import { INVENTORY } from "./_inventory";

export async function onRequest() {
  return new Response(
    JSON.stringify({
      message: "Free delivery within Ieeja town for orders above ₹499.",
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
