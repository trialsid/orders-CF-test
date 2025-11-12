import { INVENTORY_MAP } from "./_inventory";

const DEFAULT_ORDER_STATUS = "pending";
const ALLOWED_ORDER_STATUSES = new Set(["pending", "confirmed", "outForDelivery", "delivered", "cancelled"]);
const STATUS_ALIASES = {
  "out_for_delivery": "outForDelivery",
  outfordelivery: "outForDelivery",
};

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

function normalizeString(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function validateOrder(body) {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const { items = [], customer = {}, delivery = {}, payment = {} } = body;

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

  const customerName = normalizeString(customer.name) ?? "Walk-in customer";
  const customerPhone = normalizeString(customer.phone);
  const customerAddress = normalizeString(customer.address);
  const deliverySlot = normalizeString(delivery.slot);
  const deliveryInstructions = normalizeString(delivery.instructions);
  const paymentMethod = normalizeString(payment.method);

  if (!customerPhone) {
    return { error: "Please include a contact phone number." };
  }

  const phoneDigits = customerPhone.replace(/\D/g, "");
  if (phoneDigits.length < 6) {
    return { error: "Please provide a valid phone number." };
  }

  if (!customerAddress) {
    return { error: "Please include a delivery address." };
  }

  if (!deliverySlot) {
    return { error: "Please choose a delivery slot." };
  }

  if (!paymentMethod) {
    return { error: "Please choose a payment method." };
  }

  return {
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
    },
    items: processed,
    total,
    delivery: {
      slot: deliverySlot,
      instructions: deliveryInstructions,
    },
    payment: {
      method: paymentMethod,
    },
  };
}

async function persistOrder(env, summary, orderId) {
  const db = getDatabase(env);
  if (!db) {
    return { error: "ORDERS_DB binding is not configured." };
  }

  const payload = JSON.stringify(summary.items);

  try {
    await db
      .prepare(
        `INSERT INTO orders (
           id,
           customer_name,
           customer_phone,
           total_amount,
           currency,
           status,
           items_json,
           customer_address,
           delivery_slot,
           payment_method,
           delivery_instructions
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        orderId,
        summary.customer.name,
        summary.customer.phone ?? null,
        summary.total,
        "INR",
        DEFAULT_ORDER_STATUS,
        payload,
        summary.customer.address ?? null,
        summary.delivery?.slot ?? null,
        summary.payment?.method ?? null,
        summary.delivery?.instructions ?? null
      )
      .run();
    return {};
  } catch (error) {
    console.error("Failed to persist order", error);
    return { error: "Unable to save order right now." };
  }
}

function parseItems(itemsJson) {
  if (!itemsJson) {
    return [];
  }
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse order items", error);
    return [];
  }
}

function normalizeStatusInput(status) {
  if (typeof status !== "string") {
    return undefined;
  }
  const trimmed = status.trim();
  if (!trimmed) {
    return undefined;
  }

  if (ALLOWED_ORDER_STATUSES.has(trimmed)) {
    return trimmed;
  }

  const alias = STATUS_ALIASES[trimmed.toLowerCase()];
  if (alias && ALLOWED_ORDER_STATUSES.has(alias)) {
    return alias;
  }

  return undefined;
}

async function updateOrderStatus(env, orderId, nextStatus) {
  const db = getDatabase(env);
  if (!db) {
    return { error: "ORDERS_DB binding is not configured." };
  }

  try {
    const result = await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(nextStatus, orderId).run();
    if (result.meta.changes === 0) {
      return { error: "Order not found.", status: 404 };
    }
    return {};
  } catch (error) {
    console.error("Failed to update order status", error);
    return { error: "Unable to update order right now." };
  }
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const result = validateOrder(payload);
  if (result.error) {
    return jsonResponse({ error: result.error }, 400);
  }

  const orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const persistResult = await persistOrder(env, result, orderId);
  if (persistResult.error) {
    return jsonResponse({ error: persistResult.error }, 500);
  }

  return jsonResponse({
    message: "Order received! We will call to confirm within 15 minutes.",
    orderId,
    summary: {
      ...result,
      status: DEFAULT_ORDER_STATUS,
    },
  });
}

export async function onRequestGet({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 100) : 25;

  try {
    const statement = db.prepare(
      `SELECT id,
              customer_name,
              customer_phone,
              total_amount,
              currency,
              status,
              items_json,
              created_at,
              customer_address,
              delivery_slot,
              payment_method,
              delivery_instructions
       FROM orders
       ORDER BY datetime(created_at) DESC
       LIMIT ?`
    );
    const { results } = await statement.bind(limit).all();

    const orders = (results ?? []).map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? undefined,
      customerAddress: row.customer_address ?? undefined,
      totalAmount: row.total_amount,
      currency: row.currency ?? "INR",
      status: row.status ?? DEFAULT_ORDER_STATUS,
      items: parseItems(row.items_json),
      createdAt: row.created_at,
      deliverySlot: row.delivery_slot ?? undefined,
      paymentMethod: row.payment_method ?? undefined,
      deliveryInstructions: row.delivery_instructions ?? undefined,
    }));

    return jsonResponse({ orders });
  } catch (error) {
    console.error("Failed to read orders", error);
    return jsonResponse({ error: "Unable to load orders right now." }, 500);
  }
}

export async function onRequest({ request, env, ctx }) {
  if (request.method === "POST") {
    return onRequestPost({ request, env, ctx });
  }

  if (request.method === "GET") {
    return onRequestGet({ request, env, ctx });
  }

  if (request.method === "PATCH") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }

    if (!payload || typeof payload !== "object") {
      return jsonResponse({ error: "Invalid request payload." }, 400);
    }

    const orderId = normalizeString(payload.orderId);
    const status = normalizeStatusInput(payload.status);

    if (!orderId) {
      return jsonResponse({ error: "Order ID is required." }, 400);
    }

    if (!status) {
      return jsonResponse({ error: "Status is invalid." }, 400);
    }

    const result = await updateOrderStatus(env, orderId, status);
    if (result.error) {
      return jsonResponse({ error: result.error }, result.status ?? 500);
    }

    return jsonResponse({ orderId, status });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
}
