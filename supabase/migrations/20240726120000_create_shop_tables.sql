-- V1__create_shop_tables.sql

-- Create the cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create the wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create the closet_items table
CREATE TABLE IF NOT EXISTS closet_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cart_items
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add items to their own cart" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for wishlist_items
CREATE POLICY "Users can view their own wishlist items" ON wishlist_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add items to their own wishlist" ON wishlist_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlist items" ON wishlist_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for closet_items
CREATE POLICY "Users can view their own closet items" ON closet_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add items to their own closet" ON closet_items
    FOR INSERT WITH CHECK (auth.uid() = user_id); 