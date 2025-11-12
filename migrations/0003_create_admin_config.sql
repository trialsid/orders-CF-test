CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO admin_config (key, value) VALUES
  ('minimumOrderAmount', '100'),
  ('freeDeliveryThreshold', '299'),
  ('deliveryFeeBelowThreshold', '15');
