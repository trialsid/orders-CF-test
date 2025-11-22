DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  category TEXT,
  price REAL NOT NULL,
  mrp REAL,
  raw_selling_price REAL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_department ON products(department);