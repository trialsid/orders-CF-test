export const DEFAULT_CONFIG = {
  minimumOrderAmount: 100,
  freeDeliveryThreshold: 299,
  deliveryFeeBelowThreshold: 15,
};

/**
 * Read delivery/pricing config from admin_config with sane defaults.
 * Falls back to DEFAULT_CONFIG if the table is unavailable.
 */
export async function readConfig(db) {
  const config = { ...DEFAULT_CONFIG };
  if (!db) {
    return config;
  }

  try {
    const { results } = await db.prepare("SELECT key, value FROM admin_config").all();
    for (const row of results ?? []) {
      if (!row?.key) continue;
      if (!Object.prototype.hasOwnProperty.call(config, row.key)) continue;

      const num = Number(row.value);
      if (Number.isFinite(num) && num >= 0) {
        config[row.key] = num;
      }
    }
  } catch (error) {
    console.error("Failed to read admin config", error);
  }

  return config;
}
