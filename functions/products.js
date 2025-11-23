function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
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
    // 1. Lightweight Check: Get version info to generate ETag
    // This costs very few read units compared to fetching the whole table.
    const meta = await db.prepare("SELECT COUNT(*) as count, MAX(updated_at) as last_modified FROM products WHERE is_active = 1").first();
    
    const count = meta?.count || 0;
    const lastModified = meta?.last_modified || '0';
    // Create a weak ETag based on count and last modified timestamp
    const etag = `W/"${count}-${lastModified}"`;

    // 2. Check Client's Cache
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

    // 3. Fetch Full Data (only if cache missed)
    const { results } = await db.prepare("SELECT id, name, description, department, category, price, mrp, raw_selling_price FROM products WHERE is_active = 1 ORDER BY name ASC").all();

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
        message: "Free delivery within Ieeja town on baskets above ₹299. ₹15 delivery fee for smaller orders (₹100 minimum order).",
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
