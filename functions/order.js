import { requireAuth, AuthError } from "./_auth";

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

function handleAuthError(error) {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  return null;
}

async function getOptionalCustomerContext(request, env) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return requireAuth(request, env, ["customer", "admin"]);
}

async function upsertUserAddress(db, userId, summary) {
  const statements = [];
  let addressId = null;
  
  if (!db || !userId) {
    return { deliveryAddressId: null, statements };
  }
  const addressLine = normalizeString(summary.customer?.address);
  if (!addressLine) {
    return { deliveryAddressId: null, statements };
  }

  const phone = normalizeDigits(summary.customer?.phone ?? "");
  const contactName = normalizeString(summary.customer?.name);
  const landmark = normalizeString(summary.delivery?.instructions);

  try {
    const existing = await db
      .prepare(
        `SELECT id FROM user_addresses
         WHERE user_id = ? AND line1 = ? AND IFNULL(phone, '') = IFNULL(?, '')
         LIMIT 1`
      )
      .bind(userId, addressLine, phone ?? null)
      .first();
      
    if (existing?.id) {
      addressId = existing.id;
    } else {
      const { total } =
        (await db.prepare("SELECT COUNT(1) as total FROM user_addresses WHERE user_id = ?").bind(userId).first()) ?? {};
      const isDefault = Number(total ?? 0) === 0 ? 1 : 0;

      addressId = crypto.randomUUID();
      
      // If we are making this the default, first unset any existing default for this user.
      // This helps mitigate race conditions where concurrent requests might both decide to set a default.
      if (isDefault) {
        statements.push(db.prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?").bind(userId));
      }

      statements.push(db
        .prepare(
          `INSERT INTO user_addresses (
             id,
             user_id,
             contact_name,
             phone,
             line1,
             line2,
             area,
             city,
             state,
             postal_code,
             landmark,
             is_default
           )
           VALUES (?1, ?2, ?3, ?4, ?5, NULL, NULL, NULL, NULL, NULL, ?6, ?7)`
        )
        .bind(addressId, userId, contactName ?? null, phone ?? null, addressLine, landmark ?? null, isDefault));

      if (isDefault) {
        const snapshot = JSON.stringify({
          addressId,
          contactName: contactName ?? null,
          phone: phone ?? null,
          line1: addressLine,
          landmark: landmark ?? null,
        });
        statements.push(db.prepare("UPDATE users SET primary_address_json = ? WHERE id = ?").bind(snapshot, userId));
      }
    }

    return { deliveryAddressId: addressId, statements };
  } catch (error) {
    console.error("Failed to prepare user address upsert statements", error);
    return { deliveryAddressId: null, statements: [] };
  }
}

function normalizeString(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeDigits(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const digits = value.replace(/\D/g, "");
  return digits.length ? digits : undefined;
}

async function validateOrder(db, body) {
  if (!db) {
    return { error: "ORDERS_DB binding is not configured." };
  }
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const { items = [], customer = {}, delivery = {}, payment = {} } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Please include at least one item in your order." };
  }

  const itemIds = items.map((item) => item.id).filter(Boolean);
  if (itemIds.length === 0) {
    return { error: "Please include at least one valid item in your order." };
  }

  const productsResult = await db
    .prepare(`SELECT id, name, price FROM products WHERE id IN (${itemIds.map(() => '?').join(',')}) AND is_active = 1`)
    .bind(...itemIds)
    .all();

  const productsMap = new Map((productsResult.results ?? []).map((product) => [product.id, product]));

  const processed = [];
  let total = 0;

  for (const entry of items) {
    const { id, quantity } = entry ?? {};
    const item = productsMap.get(id);
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

function persistOrder(dbOrBatch, summary, orderId, options = {}) {
  const payload = JSON.stringify(summary.items);

  return dbOrBatch
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
         delivery_instructions,
         user_id,
         delivery_address_id
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      summary.delivery?.instructions ?? null,
      options.userId ?? null,
      options.deliveryAddressId ?? null
    );
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
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const result = await validateOrder(db, payload);
  if (result.error) {
    return jsonResponse({ error: result.error }, 400);
  }

  let userContext;
  try {
    userContext = await requireAuth(request, env, ["customer", "admin"]);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }
    throw error;
  }

  let deliveryAddressId = null;
  let addressStatements = [];
  if (userContext?.sub) {
    const { deliveryAddressId: resolvedAddressId, statements } = await upsertUserAddress(db, userContext.sub, result);
    deliveryAddressId = resolvedAddressId;
    addressStatements = statements;
  }

  const orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const orderStatement = persistOrder(db, result, orderId, {
    userId: userContext.sub,
    deliveryAddressId,
  });

  try {
    await db.batch([...addressStatements, orderStatement]);
  } catch (error) {
    console.error("Failed to persist order and address in a batch transaction", error);
    return jsonResponse({ error: "Unable to save order and address right now due to a database error." }, 500);
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

  let authContext;
  try {
    authContext = await requireAuth(request, env, ["admin", "rider", "customer"]);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }
    throw error;
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 100) : 25;
  const isPrivileged = authContext.role === "admin" || authContext.role === "rider";

  try {
    const baseQuery = `SELECT id,
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
              delivery_instructions,
              user_id,
              delivery_address_id
       FROM orders`;

    const whereClause = isPrivileged ? "" : " WHERE user_id = ?";
    const orderLimitClause = " ORDER BY datetime(created_at) DESC LIMIT ?";
    const statement = db.prepare(baseQuery + whereClause + orderLimitClause);

    const binding = isPrivileged ? [limit] : [authContext.sub, limit];
    const { results } = await statement.bind(...binding).all();

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
      userId: row.user_id ?? undefined,
      deliveryAddressId: row.delivery_address_id ?? undefined,
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

  if (request.method === "PATCH") {
    try {
      await requireAuth(request, env, ["admin", "rider"]);
    } catch (error) {
      const authResponse = handleAuthError(error);
      if (authResponse) {
        return authResponse;
      }
      throw error;
    }
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