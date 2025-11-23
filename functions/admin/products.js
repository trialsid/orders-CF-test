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
           name, 
           description, 
           department, 
           category, 
           price, 
           mrp, 
           is_active, 
           stock_quantity 
         FROM products 
         ORDER BY name ASC`
      )
      .all();

    return jsonResponse({
      items: (results ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        department: row.department,
        category: row.category,
        price: row.price,
        mrp: row.mrp,
        isActive: row.is_active === 1,
        stockQuantity: row.stock_quantity,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch admin products", error);
    return jsonResponse({ error: "Unable to load product catalog." }, 500);
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

  const { id, price, stockQuantity, isActive } = payload;

  if (!id) {
    return jsonResponse({ error: "Product ID is required" }, 400);
  }

  const updates = [];
  const bindings = [];

  if (typeof price === "number" && price >= 0) {
    updates.push("price = ?");
    bindings.push(price);
  }

  if (typeof stockQuantity === "number") {
    updates.push("stock_quantity = ?");
    bindings.push(stockQuantity);
  }

  if (typeof isActive === "boolean") {
    updates.push("is_active = ?");
    bindings.push(isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return jsonResponse({ error: "No valid fields to update" }, 400);
  }

  bindings.push(id);

  try {
    const result = await db
      .prepare(`UPDATE products SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...bindings)
      .run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: "Product not found" }, 404);
    }

    return jsonResponse({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Failed to update product", error);
    return jsonResponse({ error: "Database update failed" }, 500);
  }
}

export async function onRequest({ request, env, ctx }) {
  if (request.method === "GET") return onRequestGet({ request, env });
  if (request.method === "PATCH") return onRequestPatch({ request, env });
  return jsonResponse({ error: "Method not allowed" }, 405);
}
