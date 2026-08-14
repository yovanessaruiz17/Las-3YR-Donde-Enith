export type UserRole = 'customer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  image_url?: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  brand_id?: string;
  brand_name?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  description: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  discount_percentage?: number;
  stock: number;
  main_image: string;
  gallery?: string[];
  content_spec?: string; // e.g. "150 ml", "400 g", "Talla M"
  rating?: number;
  reviews_count?: number;
  featured: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string; // product id or unique key
  product: Product;
  quantity: number;
  selected_variant?: string;
}

export type OrderStatus =
  | 'Pendiente'
  | 'Confirmado'
  | 'Preparando'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado';

export type OrderOrigin = 'Web' | 'WhatsApp' | 'Instagram' | 'Facebook' | 'Otro';

export type PaymentMethod =
  | 'Transferencia Nequi'
  | 'Transferencia Llave'
  | 'Efectivo al Contraentrega'
  | 'Contraentrega'
  | 'Transferencia'
  | 'Nequi / Daviplata'
  | 'Acordar por WhatsApp';

export type DeliveryMethod = 'Envío a domicilio' | 'Recoger en punto';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  whatsapp: string;
  address: string;
  city: string;
  department?: string;
  notes?: string;
  subtotal: number;
  shipping: number;
  total: number;
  origin: OrderOrigin;
  payment_method: PaymentMethod;
  delivery_method: DeliveryMethod;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  created_at: string;
}

export interface Offer {
  id: string;
  product_id: string;
  product?: Product;
  old_price: number;
  offer_price: number;
  discount_percentage: number;
  start_date?: string;
  end_date?: string;
  active: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  icon?: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  tag?: string;
  image_url: string;
  button_text: string;
  button_url: string;
  active: boolean;
  sort_order: number;
  start_date?: string;
  end_date?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  active: boolean;
  created_at: string;
}

export interface StoreSettings {
  id?: string;
  store_name: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  department: string;
  schedule: string;
  instagram: string;
  facebook: string;
  shipping_cost: number;
  free_shipping_from: number;
  whatsapp_custom_message: string;
  announcement_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
  read?: boolean;
}
