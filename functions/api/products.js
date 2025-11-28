import { readConfig } from "../_config.js";

function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
}

function formatDeliveryMessage(config) {
  return `Free delivery within Ieeja town on baskets above ₹${config.freeDeliveryThreshold}. ₹${config.deliveryFeeBelowThreshold} delivery fee for smaller orders (₹${config.minimumOrderAmount} minimum order).`;
}

export async function onRequest({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database service is currently unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  try {
    let etag = null;

    // 1. Global ETag Check (Unconditional)
    // Include config updates so delivery pricing stays in sync with the advertised copy.
    const meta = await db
      .prepare(
        `SELECT 
           (SELECT COUNT(*) FROM products WHERE is_active = 1) as count,
           (SELECT MAX(updated_at) FROM products WHERE is_active = 1) as last_modified,
           (SELECT MAX(updated_at) FROM admin_config) as config_last_modified`
      )
      .first();
    const count = meta?.count || 0;
    const lastModified = meta?.last_modified || "0";
    const configLastModified = meta?.config_last_modified || "0";
    etag = `W/"${count}-${lastModified}-${configLastModified}"`;

    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
          "ETag": etag,
        },
      });
    }

    // 2. Fetch Full Data (Cache miss)
    const config = await readConfig(db);
    const { results } = await db
      .prepare("SELECT id, name, description, department, category, price, mrp, raw_selling_price FROM products WHERE is_active = 1 ORDER BY name ASC")
      .all();

    const products = (results ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      department: row.department ?? undefined,
      category: row.category ?? undefined,
      price: row.price,
      mrp: row.mrp ?? undefined,
      rawSellingPrice: row.raw_selling_price ?? undefined,
    }));

    return new Response(
      JSON.stringify({
        message: formatDeliveryMessage(config),
        config,
        items: products,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
          "ETag": etag,
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch products from D1", error);
    return new Response(JSON.stringify({ error: "Unable to load products right now." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
