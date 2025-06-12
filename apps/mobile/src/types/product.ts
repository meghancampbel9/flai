export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price?: number;
  currency: string;
  image_url: string;
  product_url: string;
  category?: string;
  is_on_sale?: boolean;
  description: string;
  sizes?: string[];
  colors?: string[];
  material?: string;
  gender_tag?: string;
  source: string;
  created_at: string;
}

export interface UserProductInteraction {
  user_id: string;
  product_id: string;
  interaction_type: 'bought' | 'favorited' | 'viewed';
  created_at: string;
}

export type ProductGridType = 'closet' | 'wishlist' | 'recommended';