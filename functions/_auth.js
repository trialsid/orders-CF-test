const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PHONE_REGEX = /^[0-9]{6,15}$/;
// Cloudflare's SubtleCrypto PBKDF2 caps iterations at 100k; stay within to avoid runtime errors.
const PBKDF2_ITERATIONS = 100000;

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
}

function getAuthSecret(env) {
  if (!env || typeof env.AUTH_SECRET !== "string" || env.AUTH_SECRET.length < 16) {
    return undefined;
  }
  return env.AUTH_SECRET;
}

function normalizePhone(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const str = String(value);
  const digits = str.replace(/\D/g, "");
  if (!PHONE_REGEX.test(digits)) {
    return undefined;
  }
  return digits;
}

function validatePassword(password) {
  if (typeof password !== "string") {
    return "Password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  return null;
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  return new Uint8Array(value);
}

function arrayBufferToBase64(buffer) {
  const bytes = toUint8Array(buffer);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64");
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(data) {
  const base64 = arrayBufferToBase64(data);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return base64ToArrayBuffer(base64);
}

function timingSafeEqual(a, b) {
  if (typeof a === "string") {
    a = textEncoder.encode(a);
  }
  if (typeof b === "string") {
    b = textEncoder.encode(b);
  }
  if (!(a instanceof Uint8Array)) {
    a = new Uint8Array(a);
  }
  if (!(b instanceof Uint8Array)) {
    b = new Uint8Array(b);
  }
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = PBKDF2_ITERATIONS;
  const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const payload = {
    v: 1,
    i: iterations,
    s: arrayBufferToBase64(salt),
    h: arrayBufferToBase64(derivedBits),
  };
  return JSON.stringify(payload);
}

async function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.length) {
    return false;
  }
  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse password hash payload", error);
    return false;
  }
  if (!parsed || parsed.v !== 1) {
    return false;
  }
  const saltBuffer = base64ToArrayBuffer(parsed.s);
  const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: parsed.i,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return timingSafeEqual(arrayBufferToBase64(derivedBits), parsed.h);
}

async function createHmac(message, secret) {
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return base64UrlEncode(signature);
}

async function signToken(payload, secret, ttlSeconds = TOKEN_TTL_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };
  const encodedHeader = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(body)));
  const signature = await createHmac(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyToken(token, secret) {
  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 3) {
    throw new Error("Token structure invalid.");
  }
  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = await createHmac(`${encodedHeader}.${encodedPayload}`, secret);
  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error("Signature mismatch.");
  }
  const payloadBuffer = base64UrlDecode(encodedPayload);
  const payload = JSON.parse(textDecoder.decode(payloadBuffer));
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw new Error("Token expired.");
  }
  return payload;
}

export function publicUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    status: user.status,
    displayName: user.display_name ?? user.displayName ?? null,
    fullName: user.full_name ?? user.fullName ?? user.display_name ?? null,
    primaryAddress: parseJsonField(user.primary_address_json),
    createdAt: user.created_at ?? user.createdAt ?? null,
  };
}

function parseJsonField(value) {
  if (!value || typeof value !== "string") {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse JSON field", error);
    return null;
  }
}

async function readBody(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

export async function handleRegister({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  const body = await readBody(request);
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    return jsonResponse({ error: "Please provide a valid phone number (digits only)." }, 400);
  }

  const passwordError = validatePassword(body.password);
  if (passwordError) {
    return jsonResponse({ error: passwordError }, 400);
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 80) : null;
  const normalizedDisplayName = displayName ?? phone;
  const fullName = displayName ?? null;

  try {
    const existing = await db.prepare("SELECT id FROM users WHERE phone = ? LIMIT 1").bind(phone).first();
    if (existing) {
      return jsonResponse({ error: "An account with this phone number already exists." }, 409);
    }
  } catch (error) {
    console.error("Failed to check existing user", error);
    return jsonResponse({ error: "Unable to process registration right now." }, 500);
  }

  try {
    const passwordHash = await hashPassword(body.password);
    const userId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO users (id, phone, password_hash, role, status, display_name, full_name, metadata_json, primary_address_json)
         VALUES (?1, ?2, ?3, 'customer', 'active', ?4, ?5, NULL, NULL)`
      )
      .bind(userId, phone, passwordHash, normalizedDisplayName, fullName)
      .run();

    const secret = getAuthSecret(env);
    if (!secret) {
      return jsonResponse({ error: "AUTH_SECRET is not configured." }, 501);
    }

    // Include token_version: 1 (default for new users)
    const token = await signToken({ sub: userId, role: "customer", phone, token_version: 1 }, secret);
    return jsonResponse(
      {
        user: publicUser({
          id: userId,
          phone,
          role: "customer",
          status: "active",
          display_name: normalizedDisplayName,
          full_name: fullName,
          created_at: new Date().toISOString(),
        }),
        token,
      },
      201
    );
  } catch (error) {
    console.error("Failed to register user", error);
    return jsonResponse({ error: "Unable to create account right now." }, 500);
  }
}

export async function handleLogin({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }
  const secret = getAuthSecret(env);
  if (!secret) {
    return jsonResponse({ error: "AUTH_SECRET is not configured." }, 501);
  }

  const body = await readBody(request);
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    return jsonResponse({ error: "Please provide a valid phone number." }, 400);
  }
  if (typeof body.password !== "string") {
    return jsonResponse({ error: "Password is required." }, 400);
  }

  let user;
  try {
    user = await db.prepare("SELECT * FROM users WHERE phone = ? LIMIT 1").bind(phone).first();
  } catch (error) {
    console.error("Failed to fetch user", error);
    return jsonResponse({ error: "Unable to process login right now." }, 500);
  }

  if (!user || user.status !== "active") {
    return jsonResponse({ error: "Invalid credentials." }, 401);
  }

  const passwordOk = await verifyPassword(body.password, user.password_hash);
  if (!passwordOk) {
    return jsonResponse({ error: "Invalid credentials." }, 401);
  }

  const tokenVersion = user.token_version || 1;
  const token = await signToken({ sub: user.id, role: user.role, phone: user.phone, token_version: tokenVersion }, secret);
  return jsonResponse({ user: publicUser(user), token });
}

export async function handleProfile({ request, env }) {
  let payload;
  try {
    payload = await requireAuth(request, env);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    throw error;
  }
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }
  try {
    const user = await db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").bind(payload.sub).first();
    if (!user) {
      return jsonResponse({ error: "Account not found." }, 404);
    }
    return jsonResponse({ user: publicUser(user) });
  } catch (error) {
    console.error("Failed to load profile", error);
    return jsonResponse({ error: "Unable to load profile right now." }, 500);
  }
}
export async function requireAuth(request, env, roles) {
  const secret = getAuthSecret(env);
  if (!secret) {
    throw new AuthError("AUTH_SECRET is not configured.", 501);
  }
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  if (!token) {
    throw new AuthError("Missing Authorization header.");
  }
  let payload;
  try {
    payload = await verifyToken(token, secret);
  } catch (error) {
    throw new AuthError("Invalid or expired token.");
  }

  // Verify token_version against DB for revocation support
  const db = getDatabase(env);
  if (db) {
    try {
      const user = await db.prepare("SELECT token_version, role, status FROM users WHERE id = ?").bind(payload.sub).first();
      if (!user) {
        throw new AuthError("Account no longer exists.", 401);
      }
      if (user.status !== 'active') {
        throw new AuthError("Account is suspended.", 403);
      }
      
      const dbVersion = user.token_version || 1;
      const tokenVersion = payload.token_version || 0; // Treat missing version as 0 (invalid if DB has 1)
      
      // Allow grace period: if token has NO version (legacy), allow it only if DB version is 1.
      // Otherwise, versions must match exactly.
      const isLegacyToken = payload.token_version === undefined;
      const isValid = isLegacyToken ? dbVersion === 1 : tokenVersion === dbVersion;

      if (!isValid) {
        throw new AuthError("Session expired. Please log in again.", 401);
      }
      
      // Use fresh role from DB
      payload.role = user.role; 
    } catch (err) {
      // If DB fails, we might want to fail open or closed. 
      // Failing closed (denying access) is safer for "requireAuth".
      if (err instanceof AuthError) throw err;
      console.error("Auth DB check failed:", err);
      throw new AuthError("Unable to verify session.", 500);
    }
  }

  if (roles && roles.length && !roles.includes(payload.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return payload;
}

export { jsonResponse };
