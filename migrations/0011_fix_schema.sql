-- Fix Schema Issues: REAL for money, CHECK constraint for stock
-- Note: SQLite doesn't support changing column types easily, so we recreate tables.

-- 1. Fix Products (Add CHECK constraint for atomic inventory safety)
CREATE TABLE products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  category TEXT,
  price REAL NOT NULL,
  mrp REAL,
  raw_selling_price REAL,
  is_active INTEGER DEFAULT 1,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- Enforce non-negative stock
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO products_new (id, name, description, department, category, price, mrp, raw_selling_price, is_active, stock_quantity, created_at, updated_at)
SELECT id, name, description, department, category, price, mrp, raw_selling_price, is_active, stock_quantity, created_at, updated_at FROM products;

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_department ON products(department);


-- 2. Fix Orders (Change total_amount to REAL)
CREATE TABLE orders_new (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount REAL NOT NULL, -- Changed from INTEGER to REAL
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  items_json TEXT NOT NULL,
  customer_address TEXT,
  delivery_slot TEXT,
  payment_method TEXT,
  delivery_instructions TEXT,
  user_id TEXT,
  delivery_address_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(id)
);

-- Explicit column mapping to handle potential column order differences
INSERT INTO orders_new (
  id, customer_name, customer_phone, total_amount, currency, status, items_json, 
  customer_address, delivery_slot, payment_method, delivery_instructions, 
  user_id, delivery_address_id, created_at
)
SELECT 
  id, customer_name, customer_phone, total_amount, currency, status, items_json, 
  customer_address, delivery_slot, payment_method, delivery_instructions, 
  user_id, delivery_address_id, created_at 
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_user_id ON orders (user_id);


-- 3. Fix Order Items (Change unit_price and line_total to REAL)
CREATE TABLE order_items_new (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL, -- Changed from INTEGER to REAL
  quantity INTEGER NOT NULL,
  line_total REAL NOT NULL, -- Changed from INTEGER to REAL
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Explicit column mapping
INSERT INTO order_items_new (
  id, order_id, product_id, product_name, unit_price, quantity, line_total, created_at
)
SELECT 
  id, order_id, product_id, product_name, unit_price, quantity, line_total, created_at 
FROM order_items;

DROP TABLE order_items;
ALTER TABLE order_items_new RENAME TO order_items;

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
