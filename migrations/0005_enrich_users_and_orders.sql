-- Adds richer user profile data, persistent addresses, and links orders to users.

ALTER TABLE users
  ADD COLUMN full_name TEXT;

ALTER TABLE users
  ADD COLUMN primary_address_json TEXT;

CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT,
  contact_name TEXT,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  area TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  landmark TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses (user_id);

ALTER TABLE orders
  ADD COLUMN user_id TEXT REFERENCES users(id);

ALTER TABLE orders
  ADD COLUMN delivery_address_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);

-- Backfill full_name using existing display_name values when possible.
UPDATE users
SET full_name = COALESCE(NULLIF(display_name, ''), full_name)
WHERE full_name IS NULL;
