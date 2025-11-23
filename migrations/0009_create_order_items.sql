-- Create a normalized table for order items to enable analytics
-- This works in parallel with the 'items_json' blob in the orders table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL, -- Snapshot of name at time of purchase
  unit_price INTEGER NOT NULL, -- Snapshot of price at time of purchase
  quantity INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
