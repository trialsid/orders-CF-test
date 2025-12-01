-- Migration: Add rider_id to orders table
-- Description: Assigns orders to specific users (riders).

ALTER TABLE orders ADD COLUMN rider_id TEXT;
CREATE INDEX idx_orders_rider_id ON orders(rider_id);