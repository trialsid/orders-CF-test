function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
}

export async function onRequest({ env }) {
  const db = getDatabase(env);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database service is currently unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  try {
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
          "Cache-Control": "no-store",
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
