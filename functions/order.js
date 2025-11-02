import { INVENTORY_MAP } from "./_inventory";

function validateOrder(body) {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const { items = [], customer = {} } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Please include at least one item in your order." };
  }

  const processed = [];
  let total = 0;

  for (const entry of items) {
    const { id, quantity } = entry ?? {};
    const item = INVENTORY_MAP.get(id);
    if (!item) {
      return { error: `Item with id '${id}' is unavailable right now.` };
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 20) {
      return { error: `Invalid quantity for ${item.name}.` };
    }

    const lineTotal = qty * item.price;
    total += lineTotal;
    processed.push({
      id: item.id,
      name: item.name,
      quantity: qty,
      unitPrice: item.price,
      lineTotal,
    });
  }

  return {
    customer: {
      name: String(customer.name || "Walk-in customer"),
      phone: customer.phone ? String(customer.phone) : undefined,
    },
    items: processed,
    total,
  };
}

export async function onRequestPost({ request }) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Request body must be valid JSON." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = validateOrder(payload);
  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return new Response(
    JSON.stringify({
      message: "Order received! We will call to confirm within 15 minutes.",
      orderId,
      summary: result,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function onRequest({ request }) {
  if (request.method === "POST") {
    return onRequestPost({ request });
  }

  return new Response(
    JSON.stringify({
      message: "Send a POST request with your items to place an order.",
      hint: "See the frontend app for an example payload.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
