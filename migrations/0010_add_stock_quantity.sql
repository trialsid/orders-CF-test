-- Add inventory tracking to products
ALTER TABLE products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;

-- Seed existing rows with a generous default so current catalog continues to work
UPDATE products SET stock_quantity = 1000 WHERE stock_quantity = 0;

-- Enforce non-negative stock (D1/SQLite supports this)
-- Note: SQLite ALTER TABLE is limited, so we can't add a CHECK constraint to an existing column easily without recreating the table.
-- However, for a new migration on a new column, we can try to rely on application logic or recreate.
-- Since this is a dev environment/new feature, let's try the simplest "UPDATE" approach first.
-- For now, we will RELY on the SQL failure in the batch transaction. 
-- We will change the SQL in order.js to force a failure if stock is low.

