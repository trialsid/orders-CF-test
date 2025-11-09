import { INVENTORY } from "./_inventory";

export async function onRequest() {
  return new Response(
    JSON.stringify({
      message: "Free delivery within Ieeja town on baskets above ₹299. ₹15 delivery fee for smaller orders (₹100 minimum order).",
      items: INVENTORY
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    }
  );
}
