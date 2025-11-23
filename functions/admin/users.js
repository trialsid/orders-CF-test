import { requireAuth, AuthError } from "../_auth";

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

function handleAuthError(error) {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  try {
    await requireAuth(request, env, ["admin"]);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT 
           id, 
           phone, 
           full_name, 
           role, 
           status, 
           created_at 
         FROM users 
         ORDER BY created_at DESC`
      )
      .all();

    return jsonResponse({ users: results });
  } catch (error) {
    console.error("Failed to fetch users", error);
    return jsonResponse({ error: "Unable to load users." }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  try {
    await requireAuth(request, env, ["admin"]);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { id, role, status } = payload;

  if (!id) {
    return jsonResponse({ error: "User ID is required" }, 400);
  }

  const updates = [];
  const bindings = [];

  if (role) {
    if (!['customer', 'rider', 'admin'].includes(role)) {
        return jsonResponse({ error: "Invalid role" }, 400);
    }
    updates.push("role = ?");
    bindings.push(role);
  }

  if (status) {
    if (!['active', 'blocked'].includes(status)) {
        return jsonResponse({ error: "Invalid status" }, 400);
    }
    updates.push("status = ?");
    bindings.push(status);
  }

  if (updates.length === 0) {
    return jsonResponse({ error: "No valid fields to update" }, 400);
  }

  bindings.push(id);

  try {
    const query = `UPDATE users SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await db.prepare(query).bind(...bindings).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: "User not found" }, 404);
    }

    return jsonResponse({ message: "User updated successfully" });
  } catch (error) {
    console.error("Failed to update user", error);
    return jsonResponse({ error: "Database update failed" }, 500);
  }
}

export async function onRequest({ request, env }) {
  if (request.method === "GET") return onRequestGet({ request, env });
  if (request.method === "PATCH") return onRequestPatch({ request, env });
  return jsonResponse({ error: "Method not allowed" }, 405);
}