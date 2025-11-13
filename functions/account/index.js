import { requireAuth, AuthError, jsonResponse, publicUser } from "../_auth";

function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
}

function handleAuthError(error) {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  return null;
}

function mapAddress(row) {
  return {
    id: row.id,
    label: row.label ?? null,
    contactName: row.contact_name ?? null,
    phone: row.phone ?? null,
    line1: row.line1 ?? null,
    line2: row.line2 ?? null,
    area: row.area ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postalCode: row.postal_code ?? null,
    landmark: row.landmark ?? null,
    isDefault: row.is_default === 1,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
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

  try {
    const userRow = await db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").bind(auth.sub).first();
    const { results } =
      (await db
        .prepare(
          `SELECT * FROM user_addresses
           WHERE user_id = ?
           ORDER BY is_default DESC, datetime(created_at) DESC`
        )
        .bind(auth.sub)
        .all()) ?? {};

    return jsonResponse({
      user: publicUser(userRow),
      addresses: (results ?? []).map(mapAddress),
    });
  } catch (error) {
    console.error("Failed to load account data", error);
    return jsonResponse({ error: "Unable to load account details right now." }, 500);
  }
}
