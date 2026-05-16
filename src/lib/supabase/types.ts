// Database types matching the Supabase schema in trafordapp/supabase/migrations
// Keep in sync with: 20260101000000_traford_initial_schema.sql

export type UserRole = 'customer' | 'field_staff' | 'admin' | 'director';
export type ProductAudience = 'public' | 'field_staff_only';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type OrderType = 'retail' | 'agro_input';
export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'flexipay' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  gallery: string[] | null;
  price: number;
  compare_at_price: number | null;
  unit: string;
  stock: number;
  audience: ProductAudience;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  has_discount: boolean;
  discount_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  order_type: OrderType;
  subtotal: number;
  // Production schema (migration 004) uses `shipping_fee`; older code used
  // `shipping_cost`. Keep both optional so reads against either spelling
  // don't crash formatUGX(undefined).
  shipping_fee: number;
  shipping_cost?: number;
  tax: number;
  total: number;
  notes: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  // Production schema (migration 004) stores the per-line total as
  // `subtotal`; legacy code reads `line_total`. Keep both readable.
  subtotal: number;
  line_total?: number;
}
