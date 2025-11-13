import { requireAuth, AuthError, jsonResponse } from "../_auth";

function getDatabase(env) {
  return env && typeof env === "object" ? env.ORDERS_DB : undefined;
}

function handleAuthError(error) {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  return null;
}

function normalizeText(value, max = 120) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, max);
}

function normalizeDigits(value, max = 20) {
  if (typeof value !== "string") {
    return undefined;
  }
  const digits = value.replace(/\D/g, "");
  if (!digits.length) {
    return undefined;
  }
  return digits.slice(0, max);
}

function mapAddress(row) {
  return {
    id: row.id,
    label: row.label ?? null,
    contactName: row.contact_name ?? null,
    phone: row.phone ?? null,
    line1: row.line1 ?? null,
    line2: row.line2 ?? null,
    area: row.area ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postalCode: row.postal_code ?? null,
    landmark: row.landmark ?? null,
    isDefault: row.is_default === 1,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function buildSnapshot(address) {
  if (!address) {
    return null;
  }
  return JSON.stringify({
    id: address.id,
    label: address.label ?? null,
    contactName: address.contactName ?? null,
    phone: address.phone ?? null,
    line1: address.line1 ?? null,
    line2: address.line2 ?? null,
    area: address.area ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    postalCode: address.postalCode ?? null,
    landmark: address.landmark ?? null,
  });
}

function sanitizeAddressPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const line1 = normalizeText(payload.line1, 160);
  if (!line1) {
    return null;
  }
  return {
    label: normalizeText(payload.label, 60) ?? null,
    contactName: normalizeText(payload.contactName, 80) ?? null,
    phone: normalizeDigits(payload.phone ?? "", 15) ?? null,
    line1,
    line2: normalizeText(payload.line2, 160) ?? null,
    area: normalizeText(payload.area, 120) ?? null,
    city: normalizeText(payload.city, 80) ?? null,
    state: normalizeText(payload.state, 80) ?? null,
    postalCode: normalizeText(payload.postalCode, 20) ?? null,
    landmark: normalizeText(payload.landmark, 160) ?? null,
    isDefault: Boolean(payload.isDefault),
  };
}

async function listAddresses(db, userId) {
  const { results } =
    (await db
      .prepare(
        `SELECT * FROM user_addresses
         WHERE user_id = ?
         ORDER BY is_default DESC, datetime(created_at) DESC`
      )
      .bind(userId)
      .all()) ?? {};
  return (results ?? []).map(mapAddress);
}

async function setPrimaryAddress(db, userId, addressId) {
  if (!addressId) {
    await db.prepare("UPDATE users SET primary_address_json = NULL WHERE id = ?").bind(userId).run();
    return;
  }
  const row = await db
    .prepare("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1")
    .bind(addressId, userId)
    .first();
  if (!row) {
    return;
  }
  await db.prepare("UPDATE users SET primary_address_json = ? WHERE id = ?").bind(buildSnapshot(mapAddress(row)), userId).run();
}

export async function onRequest({ request, env }) {
  const db = getDatabase(env);
  if (!db) {
    return jsonResponse({ error: "ORDERS_DB binding is not configured." }, 501);
  }

  let auth;
  try {
    auth = await requireAuth(request, env, ["customer", "admin", "rider"]);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }
    throw error;
  }

  if (request.method === "GET") {
    try {
      const addresses = await listAddresses(db, auth.sub);
      return jsonResponse({ addresses });
    } catch (error) {
      console.error("Failed to load addresses", error);
      return jsonResponse({ error: "Unable to load addresses right now." }, 500);
    }
  }

  if (request.method === "POST") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }
    const normalized = sanitizeAddressPayload(payload);
    if (!normalized) {
      return jsonResponse({ error: "Line 1 is required for the address." }, 400);
    }

    try {
      const { total } =
        (await db.prepare("SELECT COUNT(1) as total FROM user_addresses WHERE user_id = ?").bind(auth.sub).first()) ?? {};

      const addressId = crypto.randomUUID();
      const shouldDefault = normalized.isDefault || Number(total ?? 0) === 0;

      if (shouldDefault) {
        await db.prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?").bind(auth.sub).run();
      }

      await db
        .prepare(
          `INSERT INTO user_addresses (
             id,
             user_id,
             label,
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
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
        )
        .bind(
          addressId,
          auth.sub,
          normalized.label,
          normalized.contactName,
          normalized.phone,
          normalized.line1,
          normalized.line2,
          normalized.area,
          normalized.city,
          normalized.state,
          normalized.postalCode,
          normalized.landmark,
          shouldDefault ? 1 : 0
        )
        .run();

      if (shouldDefault) {
        await setPrimaryAddress(db, auth.sub, addressId);
      }

      const address = await db
        .prepare("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(addressId, auth.sub)
        .first();

      return jsonResponse({ address: mapAddress(address) }, 201);
    } catch (error) {
      console.error("Failed to create address", error);
      return jsonResponse({ error: "Unable to save address right now." }, 500);
    }
  }

  if (request.method === "PUT") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }
    if (!payload || typeof payload !== "object" || typeof payload.id !== "string") {
      return jsonResponse({ error: "Address ID is required." }, 400);
    }

    const normalized = sanitizeAddressPayload(payload);
    if (!normalized) {
      return jsonResponse({ error: "Line 1 is required for the address." }, 400);
    }

    try {
      const existing = await db
        .prepare("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(payload.id, auth.sub)
        .first();
      if (!existing) {
        return jsonResponse({ error: "Address not found." }, 404);
      }

      if (normalized.isDefault) {
        await db.prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?").bind(auth.sub).run();
      }

      await db
        .prepare(
          `UPDATE user_addresses
           SET label = ?1,
               contact_name = ?2,
               phone = ?3,
               line1 = ?4,
               line2 = ?5,
               area = ?6,
               city = ?7,
               state = ?8,
               postal_code = ?9,
               landmark = ?10,
               is_default = CASE WHEN ?11 = 1 THEN 1 ELSE is_default END
           WHERE id = ?12 AND user_id = ?13`
        )
        .bind(
          normalized.label,
          normalized.contactName,
          normalized.phone,
          normalized.line1,
          normalized.line2,
          normalized.area,
          normalized.city,
          normalized.state,
          normalized.postalCode,
          normalized.landmark,
          normalized.isDefault ? 1 : 0,
          payload.id,
          auth.sub
        )
        .run();

      if (normalized.isDefault) {
        await setPrimaryAddress(db, auth.sub, payload.id);
      }

      const address = await db
        .prepare("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(payload.id, auth.sub)
        .first();
      return jsonResponse({ address: mapAddress(address) });
    } catch (error) {
      console.error("Failed to update address", error);
      return jsonResponse({ error: "Unable to update address right now." }, 500);
    }
  }

  if (request.method === "PATCH") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }
    if (!payload || typeof payload !== "object" || typeof payload.id !== "string") {
      return jsonResponse({ error: "Address ID is required." }, 400);
    }

    try {
      const existing = await db
        .prepare("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(payload.id, auth.sub)
        .first();
      if (!existing) {
        return jsonResponse({ error: "Address not found." }, 404);
      }

      await db.prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?").bind(auth.sub).run();
      await db.prepare("UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?").bind(payload.id, auth.sub).run();
      await setPrimaryAddress(db, auth.sub, payload.id);

      return jsonResponse({ success: true });
    } catch (error) {
      console.error("Failed to set default address", error);
      return jsonResponse({ error: "Unable to set default address right now." }, 500);
    }
  }

  if (request.method === "DELETE") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }
    if (!payload || typeof payload !== "object" || typeof payload.id !== "string") {
      return jsonResponse({ error: "Address ID is required." }, 400);
    }

    try {
      const existing = await db
        .prepare("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(payload.id, auth.sub)
        .first();
      if (!existing) {
        return jsonResponse({ error: "Address not found." }, 404);
      }

      await db.prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?").bind(payload.id, auth.sub).run();

      if (existing.is_default === 1) {
        const fallback = await db
          .prepare(
            `SELECT id FROM user_addresses
             WHERE user_id = ?
             ORDER BY datetime(created_at) DESC
             LIMIT 1`
          )
          .bind(auth.sub)
          .first();
        if (fallback?.id) {
          await db.prepare("UPDATE user_addresses SET is_default = 1 WHERE id = ?").bind(fallback.id).run();
          await setPrimaryAddress(db, auth.sub, fallback.id);
        } else {
          await setPrimaryAddress(db, auth.sub, null);
        }
      }

      return jsonResponse({ success: true });
    } catch (error) {
      console.error("Failed to delete address", error);
      return jsonResponse({ error: "Unable to delete address right now." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
}
