-- V2__add_unique_constraint_to_closet.sql

-- Add a unique constraint to the closet_items table to prevent duplicate items
ALTER TABLE closet_items
ADD CONSTRAINT unique_closet_item UNIQUE (user_id, product_id); 