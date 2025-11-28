const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const REFRESH_COOKIE_NAME = "refresh_token";
const PHONE_REGEX = /^[0-9]{6,15}$/;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const LOGIN_RATE_LIMIT_BLOCK_MS = 15 * 60_000; // 15 minutes
// Cloudflare's SubtleCrypto PBKDF2 caps iterations at 100k; stay within to avoid runtime errors.
const PBKDF2_ITERATIONS = 100000;
const AUTH_CACHE_TTL_MS = 90_000; // 90s in-memory cache to avoid repeat D1 reads on hot paths
const authCache = new Map();
let rateLimitWarningLogged = false;

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
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

function getTokenVersion(user) {
  return typeof user?.token_version === "number" ? user.token_version : 1;
}

function parseCookies(header) {
  if (!header || typeof header !== "string") {
    return {};
  }
  return header.split(";").reduce((acc, part) => {
    const [name, ...rest] = part.trim().split("=");
    if (!name) {
      return acc;
    }
    acc[name] = rest.join("=");
    return acc;
  }, {});
}

function readRefreshToken(request) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const value = cookies[REFRESH_COOKIE_NAME];
  if (!value) {
    return null;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.warn("Failed to decode refresh token cookie", error);
    return value;
  }
}

function createRefreshCookie(token) {
  const encoded = token ? encodeURIComponent(token) : "";
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encoded}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${token ? REFRESH_TOKEN_TTL_SECONDS : 0}`,
    "Secure",
  ];
  return parts.join("; ");
}

function clearRefreshCookie() {
  return createRefreshCookie("");
}

function getClientIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) {
    return cfIp;
  }
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first) {
      return first.trim();
    }
  }
  return null;
}

function getRateLimitStore(env) {
  if (!env || typeof env !== "object") {
    return null;
  }
  const store = env.LOGIN_RATE_LIMIT_KV;
  if (!store || typeof store.get !== "function") {
    if (!rateLimitWarningLogged) {
      console.warn("LOGIN_RATE_LIMIT_KV binding missing; login rate limiting is disabled.");
      rateLimitWarningLogged = true;
    }
    return null;
  }
  return store;
}

function getLoginRateLimitKey(ip) {
  return `rl:login:${ip}`;
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

async function signToken(payload, secret, ttlSeconds = ACCESS_TOKEN_TTL_SECONDS) {
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

async function createAccessTokenForUser(user, secret) {
  const tokenVersion = getTokenVersion(user);
  return signToken(
    { sub: user.id, role: user.role, phone: user.phone, token_version: tokenVersion, type: "access" },
    secret,
    ACCESS_TOKEN_TTL_SECONDS
  );
}

async function createRefreshTokenForUser(user, secret) {
  const tokenVersion = getTokenVersion(user);
  return signToken(
    { sub: user.id, token_version: tokenVersion, jti: crypto.randomUUID(), type: "refresh" },
    secret,
    REFRESH_TOKEN_TTL_SECONDS
  );
}

async function issueTokensForUser(user, secret) {
  const accessToken = await createAccessTokenForUser(user, secret);
  const refreshToken = await createRefreshTokenForUser(user, secret);
  return {
    accessToken,
    refreshToken,
    refreshCookie: createRefreshCookie(refreshToken),
    tokenVersion: getTokenVersion(user),
  };
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

function getRateLimitContext(env, request) {
  const store = getRateLimitStore(env);
  const ip = getClientIp(request);
  if (!store || !ip) {
    return null;
  }
  return { store, key: getLoginRateLimitKey(ip) };
}

async function readRateLimitRecord(ctx) {
  if (!ctx) {
    return null;
  }
  try {
    const raw = await ctx.store.get(ctx.key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to read login rate limit record", error);
    return null;
  }
}

async function isLoginBlocked(ctx) {
  if (!ctx) {
    return { blocked: false };
  }
  const now = Date.now();
  const record = await readRateLimitRecord(ctx);
  if (!record) {
    return { blocked: false };
  }
  if (record.blockedUntil && now < record.blockedUntil) {
    return { blocked: true, retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  return { blocked: false };
}

async function recordLoginFailure(ctx) {
  if (!ctx) {
    return { blocked: false };
  }
  const now = Date.now();
  let record = await readRateLimitRecord(ctx);
  if (record && record.resetAt && now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
    record = null;
  }

  const nextCount = (record?.count ?? 0) + 1;
  const resetAt = record?.resetAt && now <= record.resetAt ? record.resetAt : now + LOGIN_RATE_LIMIT_WINDOW_MS;
  let blockedUntil = record?.blockedUntil && now < record.blockedUntil ? record.blockedUntil : 0;
  if (nextCount >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    blockedUntil = now + LOGIN_RATE_LIMIT_BLOCK_MS;
  }

  const ttlTarget = blockedUntil || resetAt;
  // Cloudflare KV requires expiration_ttl >= 60 seconds; clamp to avoid 400 errors on near-expiry writes.
  const ttlSeconds = Math.max(60, Math.ceil((ttlTarget - now) / 1000));
  try {
    await ctx.store.put(
      ctx.key,
      JSON.stringify({ count: nextCount, resetAt, blockedUntil }),
      { expirationTtl: ttlSeconds }
    );
  } catch (error) {
    console.warn("Failed to persist login rate limit record", error);
  }

  const blocked = blockedUntil > now;
  return {
    blocked,
    retryAfterSeconds: blocked ? Math.ceil((blockedUntil - now) / 1000) : null,
  };
}

async function clearLoginAttempts(ctx) {
  if (!ctx) {
    return;
  }
  try {
    await ctx.store.delete(ctx.key);
  } catch (error) {
    console.warn("Failed to clear login attempts", error);
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

    const userRecord = {
      id: userId,
      phone,
      role: "customer",
      status: "active",
      display_name: normalizedDisplayName,
      full_name: fullName,
      token_version: 1,
      created_at: new Date().toISOString(),
    };

    const tokens = await issueTokensForUser(userRecord, secret);

    // Warm the in-memory cache for this user
    authCache.set(userId, {
      role: "customer",
      status: "active",
      version: tokens.tokenVersion,
      exp: Date.now() + AUTH_CACHE_TTL_MS,
    });
    return jsonResponse(
      {
        user: publicUser(userRecord),
        token: tokens.accessToken,
      },
      201,
      { "Set-Cookie": tokens.refreshCookie }
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

  const rateLimitCtx = getRateLimitContext(env, request);
  const precheck = await isLoginBlocked(rateLimitCtx);
  if (precheck.blocked) {
    const headers = precheck.retryAfterSeconds ? { "Retry-After": String(precheck.retryAfterSeconds) } : {};
    return jsonResponse({ error: "Too many login attempts. Please try again later." }, 429, headers);
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
    const failure = await recordLoginFailure(rateLimitCtx);
    const status = failure.blocked ? 429 : 401;
    const headers = failure.retryAfterSeconds ? { "Retry-After": String(failure.retryAfterSeconds) } : {};
    return jsonResponse({ error: "Invalid credentials." }, status, headers);
  }

  const passwordOk = await verifyPassword(body.password, user.password_hash);
  if (!passwordOk) {
    const failure = await recordLoginFailure(rateLimitCtx);
    const status = failure.blocked ? 429 : 401;
    const headers = failure.retryAfterSeconds ? { "Retry-After": String(failure.retryAfterSeconds) } : {};
    return jsonResponse({ error: "Invalid credentials." }, status, headers);
  }

  await clearLoginAttempts(rateLimitCtx);

  const tokens = await issueTokensForUser(user, secret);
  authCache.set(user.id, {
    role: user.role,
    status: user.status,
    version: tokens.tokenVersion,
    exp: Date.now() + AUTH_CACHE_TTL_MS,
  });
  return jsonResponse(
    { user: publicUser(user), token: tokens.accessToken },
    200,
    { "Set-Cookie": tokens.refreshCookie }
  );
}

export async function handleRefresh({ request, env }) {
  const secret = getAuthSecret(env);
  if (!secret) {
    return jsonResponse({ error: "AUTH_SECRET is not configured." }, 501);
  }

  const refreshToken = readRefreshToken(request);
  if (!refreshToken) {
    return jsonResponse({ error: "Refresh token missing." }, 401, { "Set-Cookie": clearRefreshCookie() });
  }

  let payload;
  try {
    payload = await verifyToken(refreshToken, secret);
  } catch (error) {
    return jsonResponse({ error: "Invalid or expired refresh token." }, 401, { "Set-Cookie": clearRefreshCookie() });
  }

  if (payload.type !== "refresh" || !payload.sub) {
    return jsonResponse({ error: "Invalid refresh token." }, 401, { "Set-Cookie": clearRefreshCookie() });
  }

  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  try {
    const user = await db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").bind(payload.sub).first();
    if (!user || user.status !== "active") {
      authCache.delete(payload.sub);
      return jsonResponse({ error: "Session expired. Please log in again." }, 401, { "Set-Cookie": clearRefreshCookie() });
    }

    const tokenVersion = getTokenVersion(user);
    if (payload.token_version !== tokenVersion) {
      authCache.delete(payload.sub);
      return jsonResponse({ error: "Session expired. Please log in again." }, 401, { "Set-Cookie": clearRefreshCookie() });
    }

    const tokens = await issueTokensForUser(user, secret);
    authCache.set(user.id, {
      role: user.role,
      status: user.status,
      version: tokens.tokenVersion,
      exp: Date.now() + AUTH_CACHE_TTL_MS,
    });
    return jsonResponse(
      { token: tokens.accessToken, user: publicUser(user) },
      200,
      { "Set-Cookie": tokens.refreshCookie }
    );
  } catch (error) {
    console.error("Failed to refresh session", error);
    return jsonResponse({ error: "Unable to refresh session right now." }, 500);
  }
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

    const etag = `W/"user-${user.id}-${user.updated_at ?? user.created_at ?? "0"}-${user.token_version ?? 1}"`;
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
          ETag: etag,
        },
      });
    }

    return jsonResponse(
      { user: publicUser(user) },
      200,
      {
        "Cache-Control": "private, max-age=0, must-revalidate",
        ETag: etag,
      }
    );
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

  if (payload.type && payload.type !== "access") {
    throw new AuthError("Invalid token type.");
  }

  // In-memory cache to avoid hitting D1 on every request
  const now = Date.now();
  const cached = authCache.get(payload.sub);
  if (cached && cached.exp > now) {
    const tokenVersion = payload.token_version || 0;
    const isLegacyToken = payload.token_version === undefined;
    const versionMatch = isLegacyToken ? cached.version === 1 : tokenVersion === cached.version;
    if (!versionMatch) {
      throw new AuthError("Session expired. Please log in again.", 401);
    }
    if (cached.status !== "active") {
      throw new AuthError("Account is suspended.", 403);
    }
    payload.role = cached.role;
    // Roles filter still applies below
  }

  // Verify token_version against DB for revocation support (fallback or cache miss)
  const db = getDatabase(env);
  const shouldCheckDb = db && (!cached || cached.exp <= now);
  if (shouldCheckDb) {
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
      authCache.set(payload.sub, {
        role: user.role,
        status: user.status,
        version: dbVersion,
        exp: now + AUTH_CACHE_TTL_MS,
      });
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

export async function handleRevoke({ request, env }) {
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
    // Increment token_version to invalidate all existing tokens
    await db.prepare("UPDATE users SET token_version = IFNULL(token_version, 1) + 1 WHERE id = ?").bind(payload.sub).run();
    authCache.delete(payload.sub);
    return jsonResponse({ message: "All sessions revoked." }, 200, { "Set-Cookie": clearRefreshCookie() });
  } catch (error) {
    console.error("Failed to revoke sessions", error);
    return jsonResponse({ error: "Unable to revoke sessions right now." }, 500);
  }
}

export async function handleLogout() {
  return jsonResponse({ message: "Logged out" }, 200, { "Set-Cookie": clearRefreshCookie() });
}

export { jsonResponse };