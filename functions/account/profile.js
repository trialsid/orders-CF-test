import { requireAuth, AuthError, jsonResponse } from "../_auth";

function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
}

function handleAuthError(error) {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  return null;
}

function normalizeText(value, max = 120) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, max);
}

export async function onRequest({ request, env }) {
  if (request.method !== "PUT") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  let auth;
  try {
    auth = await requireAuth(request, env, ["customer", "admin", "rider"]);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }
    throw error;
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  if (!payload || typeof payload !== "object") {
    return jsonResponse({ error: "Profile payload is invalid." }, 400);
  }

  const displayName = normalizeText(payload.displayName, 80);
  const fullName = normalizeText(payload.fullName, 120);

  if (!displayName && !fullName) {
    return jsonResponse({ error: "Please provide a displayName or fullName." }, 400);
  }

  try {
    await db
      .prepare(
        `UPDATE users
         SET display_name = COALESCE(?1, display_name),
             full_name = COALESCE(?2, full_name)
         WHERE id = ?3`
      )
      .bind(displayName ?? null, fullName ?? null, auth.sub)
      .run();
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to update profile", error);
    return jsonResponse({ error: "Unable to update profile right now." }, 500);
  }
}
