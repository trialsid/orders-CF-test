-- Add updated_at column to orders table
-- We avoid using a function in DEFAULT to satisfy SQLite ALTER TABLE restrictions.
ALTER TABLE orders ADD COLUMN updated_at TEXT;

-- Backfill existing rows with current timestamp
UPDATE orders SET updated_at = datetime('now') WHERE updated_at IS NULL;

-- Create index on updated_at for faster ETag checks
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders (updated_at DESC);
