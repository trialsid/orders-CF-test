import { requireAuth, AuthError } from "./_auth";
import { DEFAULT_CONFIG, readConfig } from "./_config.js";

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

function toNumber(value) {
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function handleAuthError(error) {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  return null;
}

async function writeConfig(db, updates) {
  try {
    const statement = db.prepare(
      `INSERT INTO admin_config (key, value, updated_at)
       VALUES (?1, ?2, CURRENT_TIMESTAMP)
       ON CONFLICT(key)
       DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
    );

    for (const [key, value] of Object.entries(updates)) {
      await statement.bind(key, String(value)).run();
    }
  } catch (error) {
    console.error("Failed to write admin config", error);
    throw new Error("Unable to save configuration right now.");
  }
}

export async function onRequest({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  if (request.method === "GET" || request.method === "PUT" || request.method === "PATCH") {
    try {
      await requireAuth(request, env, ["admin"]);
    } catch (error) {
      const authResponse = handleAuthError(error);
      if (authResponse) {
        return authResponse;
      }
      throw error;
    }
  }

  if (request.method === "GET") {
    try {
      const config = await readConfig(db);
      return jsonResponse({ config });
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }

    if (!payload || typeof payload !== "object") {
      return jsonResponse({ error: "Configuration payload is invalid." }, 400);
    }

    const nextConfig = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) {
        continue;
      }
      const parsed = toNumber(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return jsonResponse({ error: `Invalid value for ${key}.` }, 400);
      }
      nextConfig[key] = parsed;
    }

    if (!Object.keys(nextConfig).length) {
      return jsonResponse({ error: "No valid configuration changes provided." }, 400);
    }

    try {
      await writeConfig(db, nextConfig);
      const config = await readConfig(db);
      return jsonResponse({ config });
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
}
