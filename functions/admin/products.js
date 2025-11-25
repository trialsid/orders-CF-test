import { requireAuth, AuthError } from "../_auth";

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

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;
  const search = (url.searchParams.get("search") || "").trim();

  try {
    let whereClause = "";
    const bindings = [];

    if (search) {
      whereClause = "WHERE LOWER(name) LIKE ?";
      bindings.push(`%${search.toLowerCase()}%`);
    }

    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`)
      .bind(...bindings)
      .first();
    const total = countResult?.total || 0;

    const query = `
      SELECT 
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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    bindings.push(limit, offset);

    const { results } = await db.prepare(query).bind(...bindings).all();

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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin products", error);
    return jsonResponse({ error: "Unable to load product catalog." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
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

  const { name, description, department, category, price, mrp, stockQuantity, isActive } = payload;

  if (!name || typeof price !== "number") {
    return jsonResponse({ error: "Name and Price are required." }, 400);
  }

  const id = crypto.randomUUID();

  try {
    await db
      .prepare(
        `INSERT INTO products (
          id, name, description, department, category, price, mrp, stock_quantity, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(
        id,
        name.trim(),
        description ? description.trim() : null,
        department ? department.trim() : null,
        category ? category.trim() : null,
        price,
        mrp || null,
        stockQuantity || 0,
        isActive === false ? 0 : 1
      )
      .run();

    return jsonResponse({ message: "Product created", id }, 201);
  } catch (error) {
    console.error("Failed to create product", error);
    return jsonResponse({ error: "Failed to create product." }, 500);
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

  const { id, price, stockQuantity, isActive, name, description, department, category, mrp } = payload;

  if (!id) {
    return jsonResponse({ error: "Product ID is required" }, 400);
  }

  const updates = [];
  const bindings = [];

  if (name) {
    updates.push("name = ?");
    bindings.push(name.trim());
  }
  if (description !== undefined) {
    updates.push("description = ?");
    bindings.push(description ? description.trim() : null);
  }
  if (department !== undefined) {
    updates.push("department = ?");
    bindings.push(department ? department.trim() : null);
  }
  if (category !== undefined) {
    updates.push("category = ?");
    bindings.push(category ? category.trim() : null);
  }
  if (typeof price === "number" && price >= 0) {
    updates.push("price = ?");
    bindings.push(price);
  }
  if (typeof mrp === "number" && mrp >= 0) {
    updates.push("mrp = ?");
    bindings.push(mrp);
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

export async function onRequestDelete({ request, env }) {
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

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return jsonResponse({ error: "Product ID is required" }, 400);
  }

  try {
    // Check if product is in any order
    const { count } = await db
      .prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?")
      .bind(id)
      .first();

    if (count > 0) {
      return jsonResponse(
        { error: "Cannot delete product with existing orders. Please archive it (set active = false) instead." },
        409
      );
    }

    const result = await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: "Product not found" }, 404);
    }

    return jsonResponse({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Failed to delete product", error);
    return jsonResponse({ error: "Failed to delete product." }, 500);
  }
}

export async function onRequest({ request, env, ctx }) {
  if (request.method === "GET") return onRequestGet({ request, env });
  if (request.method === "POST") return onRequestPost({ request, env });
  if (request.method === "PATCH") return onRequestPatch({ request, env });
  if (request.method === "DELETE") return onRequestDelete({ request, env });
  return jsonResponse({ error: "Method not allowed" }, 405);
}
