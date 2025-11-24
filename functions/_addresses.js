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

export function mapAddress(row) {
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

export function buildSnapshot(address) {
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

export function sanitizeAddressPayload(payload) {
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

export async function listAddresses(db, userId) {
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

export async function setPrimaryAddress(db, userId, addressId) {
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

/**
 * Upsert a delivery address from a checkout payload. Uses a minimal line1/phone/contactName set,
 * but still respects default semantics and snapshots.
 */
export async function upsertAddressFromCheckout(db, userId, summary) {
  const statements = [];
  let addressId = null;

  if (!db || !userId) {
    return { deliveryAddressId: null, statements };
  }

  const line1 = normalizeText(summary?.customer?.address, 160);
  if (!line1) {
    return { deliveryAddressId: null, statements };
  }

  const phone = normalizeDigits(summary?.customer?.phone ?? "", 15) ?? null;
  const contactName = normalizeText(summary?.customer?.name, 80) ?? null;
  const landmark = normalizeText(summary?.customer?.landmark ?? summary?.delivery?.instructions, 160) ?? null;
  const line2 = normalizeText(summary?.customer?.addressLine2, 160) ?? null;
  const area = normalizeText(summary?.customer?.area, 120) ?? null;
  const city = normalizeText(summary?.customer?.city, 80) ?? "Ieeja";
  const state = normalizeText(summary?.customer?.state, 80) ?? "Telangana";
  const postalCode = normalizeText(summary?.customer?.postalCode, 20) ?? "509127";

  try {
    const existing = await db
      .prepare(
        `SELECT id FROM user_addresses
         WHERE user_id = ? AND line1 = ? AND IFNULL(phone, '') = IFNULL(?, '')
         LIMIT 1`
      )
      .bind(userId, line1, phone ?? null)
      .first();

    if (existing?.id) {
      addressId = existing.id;
    } else {
      const { total } =
        (await db.prepare("SELECT COUNT(1) as total FROM user_addresses WHERE user_id = ?").bind(userId).first()) ?? {};
      const isDefault = Number(total ?? 0) === 0 ? 1 : 0;

      addressId = crypto.randomUUID();

      if (isDefault) {
        statements.push(db.prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?").bind(userId));
      }

      statements.push(
        db
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
             VALUES (?1, ?2, NULL, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
          )
          .bind(addressId, userId, contactName ?? null, phone ?? null, line1, line2, area, city, state, postalCode, landmark ?? null, isDefault)
      );

      if (isDefault) {
        const snapshot = buildSnapshot({
          id: addressId,
          label: null,
          contactName,
          phone,
          line1,
          line2,
          area,
          city,
          state,
          postalCode,
          landmark,
          isDefault: true,
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
