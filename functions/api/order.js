import { requireAuth, AuthError } from "../_auth";
import { readConfig } from "../_config.js";
import { upsertAddressFromCheckout } from "../_addresses.js";
import { validateOrderRequest, MAX_ITEM_QUANTITY, formatAddressSnapshot } from "../../shared/order-schema.js";

const DEFAULT_ORDER_STATUS = "pending";
const ALLOWED_ORDER_STATUSES = new Set(["pending", "confirmed", "outForDelivery", "delivered", "cancelled"]);
const STATUS_ALIASES = {
  "out_for_delivery": "outForDelivery",
  outfordelivery: "outForDelivery",
};

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

async function getOptionalCustomerContext(request, env) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return requireAuth(request, env, ["customer", "admin"]);
}

function normalizeString(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

const FIELD_ERROR_MESSAGES = {
  name: "Please include your name.",
  phone: "Please include a contact phone number.",
  address: "Please include a delivery address.",
  slot: "Please choose a delivery slot.",
  paymentMethod: "Please choose a payment method.",
  invalidPhone: "Please provide a valid phone number.",
};

async function validateOrder(db, body) {
  if (!db) {
    return { error: "ORDERS_DB binding is not configured." };
  }
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const { items = [] } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Please include at least one item in your order." };
  }

  const itemIds = items.map((item) => item.id).filter(Boolean);
  if (itemIds.length === 0) {
    return { error: "Please include at least one valid item in your order." };
  }

  const productsResult = await db
    .prepare(
      `SELECT id, name, price, stock_quantity
       FROM products
       WHERE id IN (${itemIds.map(() => '?').join(',')}) AND is_active = 1`
    )
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
    if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_ITEM_QUANTITY) {
      return { error: `Invalid quantity for ${item.name}.` };
    }
    if (typeof item.stock_quantity === "number" && item.stock_quantity < qty) {
      return { error: `${item.name} is low on stock. Available: ${item.stock_quantity}.` };
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

  const { normalizedForm, fieldErrors } = validateOrderRequest(body);
  if (Object.keys(fieldErrors).length > 0) {
    const firstKey = Object.keys(fieldErrors)[0];
    const code = fieldErrors[firstKey];
    const message =
      code === "invalidPhone"
        ? FIELD_ERROR_MESSAGES.invalidPhone
        : FIELD_ERROR_MESSAGES[firstKey] ?? "Invalid order details.";
    return { error: message };
  }

  const config = await readConfig(db);
  if (total < config.minimumOrderAmount) {
    return { error: `Orders must be at least ₹${config.minimumOrderAmount}.` };
  }

  const customerAddress = formatAddressSnapshot({
    address: normalizedForm.address,
    addressLine2: normalizedForm.addressLine2,
    area: normalizedForm.area,
    city: normalizedForm.city,
    state: normalizedForm.state,
    postalCode: normalizedForm.postalCode,
    landmark: normalizedForm.landmark,
  });

  return {
    customer: {
      name: normalizedForm.name,
      phone: normalizedForm.phone,
      address: customerAddress,
      addressLine2: normalizedForm.addressLine2,
      area: normalizedForm.area,
      city: normalizedForm.city,
      state: normalizedForm.state,
      postalCode: normalizedForm.postalCode,
      landmark: normalizedForm.landmark,
    },
    items: processed,
    total,
    delivery: {
      slot: normalizedForm.slot,
      instructions: normalizedForm.instructions,
    },
    payment: {
      method: normalizedForm.paymentMethod,
    },
    config,
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
         delivery_address_id,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
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

function persistOrderItems(db, orderId, items) {
  if (!items || items.length === 0) {
    return [];
  }
  const statements = [];
  for (const item of items) {
    statements.push(
      db
        .prepare(
          `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          orderId,
          item.id,
          item.name,
          item.unitPrice,
          item.quantity,
          item.lineTotal
        )
    );
  }
  return statements;
}

function buildStockUpdateStatements(db, items) {
  if (!items || items.length === 0) {
    return [];
  }
  return items.map((item) =>
    db
      .prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?")
      .bind(item.quantity, item.id)
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
    // Also update `updated_at` when status changes
    const result = await db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(nextStatus, orderId).run();
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

  const shouldSaveAddress = payload && payload.saveAddress !== false;
  let deliveryAddressId = null;
  let addressStatements = [];
  if (shouldSaveAddress && userContext?.sub) {
    const { deliveryAddressId: resolvedAddressId, statements } = await upsertAddressFromCheckout(db, userContext.sub, result);
    deliveryAddressId = resolvedAddressId;
    addressStatements = statements;
  }

  const orderId = `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const orderStatement = persistOrder(db, result, orderId, {
    userId: userContext.sub,
    deliveryAddressId,
  });

  const orderItemsStatements = persistOrderItems(db, orderId, result.items);
  const stockStatements = buildStockUpdateStatements(db, result.items);

  try {
    // D1 requires db.batch() for atomicity. explicit BEGIN/COMMIT is not supported in Workers.
    // We execute Order + Items + Address + Stock Updates in one batch.
    // Note: To strictly prevent negative stock, we rely on the application check above
    // and the fact that high-concurrency race conditions are rare for this scale.
    // A robust fix would involve a CHECK constraint on the DB or Durable Objects.
    await db.batch([
      ...addressStatements,
      orderStatement,
      ...orderItemsStatements,
      ...stockStatements
    ]);
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
  const idParam = normalizeString(url.searchParams.get("id"));
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 1000) : 100;
  const search = normalizeString(url.searchParams.get("search"));
  const statusFilter = normalizeStatusInput(url.searchParams.get("status"));

  const isPrivileged = authContext.role === "admin" || authContext.role === "rider";

  // If requesting a specific order by ID, return early with a targeted fetch + per-order ETag.
  if (idParam) {
    try {
      let query = `SELECT id,
              customer_name,
              customer_phone,
              total_amount,
              currency,
              status,
              items_json,
              created_at,
              updated_at,
              customer_address,
              delivery_slot,
              payment_method,
              delivery_instructions,
              user_id,
              delivery_address_id
       FROM orders WHERE id = ?`;
      const bindings = [idParam];

      if (!isPrivileged) {
        query += " AND user_id = ?";
        bindings.push(authContext.sub);
      }

      query += " LIMIT 1";

      const { results } = await db.prepare(query).bind(...bindings).all();
      const row = (results ?? [])[0];
      if (!row) {
        return jsonResponse({ error: "Order not found." }, 404);
      }

      const etag = row.updated_at ? `W/"order-${row.id}-${row.updated_at}"` : null;
      const ifNoneMatch = request.headers.get("If-None-Match");
      if (etag && ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            "Cache-Control": "private, max-age=0, must-revalidate",
            ETag: etag,
          },
        });
      }

      const order = {
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone ?? undefined,
        customerAddress: row.customer_address ?? undefined,
        totalAmount: row.total_amount,
        currency: row.currency ?? "INR",
        status: row.status ?? DEFAULT_ORDER_STATUS,
        items: parseItems(row.items_json),
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
        deliverySlot: row.delivery_slot ?? undefined,
        paymentMethod: row.payment_method ?? undefined,
        deliveryInstructions: row.delivery_instructions ?? undefined,
        userId: row.user_id ?? undefined,
        deliveryAddressId: row.delivery_address_id ?? undefined,
      };

      return jsonResponse(
        { orders: [order] },
        200,
        etag
          ? {
              "Cache-Control": "private, max-age=0, must-revalidate",
              ETag: etag,
            }
          : {}
      );
    } catch (error) {
      console.error("Failed to read order by ID", error);
      return jsonResponse({ error: "Unable to load order right now." }, 500);
    }
  }

  // ETag / Caching Logic
  // We use a "Global ETag" based on the user's entire order history (Count + Max Updated At).
  // This ensures that if *any* order changes (even one not in the current limit/page), the cache invalidates.
  // This costs 1 extra lightweight query on cache misses, but ensures correctness and allows 304s for hits.
  let etag = null;
  
  if (!isPrivileged && !search && !statusFilter) {
    try {
      const meta = await db.prepare("SELECT COUNT(*) as count, MAX(updated_at) as last_modified FROM orders WHERE user_id = ?").bind(authContext.sub).first();
      const count = meta?.count || 0;
      const lastModified = meta?.last_modified || '0';
      etag = `W/"${authContext.sub}-${count}-${lastModified}"`;

      const ifNoneMatch = request.headers.get("If-None-Match");
      if (ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            "Cache-Control": "private, max-age=0, must-revalidate",
            "ETag": etag
          }
        });
      }
    } catch (err) {
      console.warn("Failed to perform ETag check for orders", err);
      // Continue to full fetch on error, but don't block the request
    }
  }

  try {
    let query = `SELECT id,
              customer_name,
              customer_phone,
              total_amount,
              currency,
              status,
              items_json,
              created_at,
              updated_at,
              customer_address,
              delivery_slot,
              payment_method,
              delivery_instructions,
              user_id,
              delivery_address_id
       FROM orders`;

    const conditions = [];
    const bindings = [];

    if (!isPrivileged) {
      conditions.push("user_id = ?");
      bindings.push(authContext.sub);
    }

    if (statusFilter) {
      conditions.push("status = ?");
      bindings.push(statusFilter);
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push("(LOWER(customer_name) LIKE ? OR LOWER(customer_phone) LIKE ? OR LOWER(id) LIKE ?)");
      bindings.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY datetime(created_at) DESC LIMIT ?`;
    bindings.push(limit);

    const { results } = await db.prepare(query).bind(...bindings).all();

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
      updatedAt: row.updated_at ?? row.created_at,
      deliverySlot: row.delivery_slot ?? undefined,
      paymentMethod: row.payment_method ?? undefined,
      deliveryInstructions: row.delivery_instructions ?? undefined,
      userId: row.user_id ?? undefined,
      deliveryAddressId: row.delivery_address_id ?? undefined,
    }));

    // If we didn't generate a global ETag (e.g. because we are searching/filtering/privileged),
    // we can't easily cache this dynamic result set safely without more complex logic.
    // We leave etag null in those cases, defaulting to no-store.
    
    const extraHeaders = etag ? { 
      "ETag": etag,
      "Cache-Control": "private, max-age=0, must-revalidate"
    } : {
      "Cache-Control": "no-store"
    };

    return jsonResponse({ orders }, 200, extraHeaders);
  } catch (error) {
    console.error("Failed to read orders", error);
    return jsonResponse({ error: "Unable to load orders right now." }, 500);
  }
}

export async function onRequest({ request, env, ctx }) {
  switch (request.method) {
    case "POST":
      return onRequestPost({ request, env, ctx });
    case "PATCH":
      try {
        await requireAuth(request, env, ["admin", "rider"]);
      } catch (error) {
        const authResponse = handleAuthError(error);
        if (authResponse) {
          return authResponse;
        }
        throw error;
      }

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
    case "GET":
      return onRequestGet({ request, env, ctx });
    default:
      return jsonResponse({ error: "Method not allowed." }, 405);
  }
}
