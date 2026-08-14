import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Product,
  Category,
  Brand,
  Order,
  OrderStatus,
  StoreSettings,
  Announcement,
  Banner,
  ContactMessage,
  NewsletterSubscriber
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
} from '../data/initialData';

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'las3yr_products_v2',
  CATEGORIES: 'las3yr_categories_v2',
  BRANDS: 'las3yr_brands_v2',
  ORDERS: 'las3yr_orders_v2',
  ANNOUNCEMENTS: 'las3yr_announcements_v2',
  BANNERS: 'las3yr_banners_v2',
  SETTINGS: 'las3yr_settings_v2',
  SUBSCRIBERS: 'las3yr_subscribers_v2',
  MESSAGES: 'las3yr_messages_v2',
};

// Helper for local storage getters
function getLocalData<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultData;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing to localStorage:', err);
  }
}

export const storeService = {
  // PRODUCTS
  async getProducts(params?: {
    categorySlug?: string;
    brandSlug?: string;
    search?: string;
    featured?: boolean;
    offersOnly?: boolean;
    activeOnly?: boolean;
    sortBy?: string;
  }): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('products').select('*');

        if (params?.activeOnly !== false) {
          query = query.eq('active', true);
        }
        if (params?.featured) {
          query = query.eq('featured', true);
        }
        if (params?.categorySlug) {
          // get category ID first or join
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', params.categorySlug)
            .single();
          if (cat) query = query.eq('category_id', cat.id);
        }
        if (params?.brandSlug) {
          const { data: br } = await supabase
            .from('brands')
            .select('id')
            .eq('slug', params.brandSlug)
            .single();
          if (br) query = query.eq('brand_id', br.id);
        }
        if (params?.search) {
          query = query.ilike('name', `%${params.search}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as Product[];
        }
      } catch (e) {
        console.warn('Supabase getProducts fallback to local store', e);
      }
    }

    // Fallback Local Storage
    let products = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    if (params?.activeOnly !== false) {
      products = products.filter((p) => p.active);
    }
    if (params?.featured) {
      products = products.filter((p) => p.featured);
    }
    if (params?.offersOnly) {
      products = products.filter((p) => p.compare_price && p.compare_price > p.price);
    }
    if (params?.categorySlug) {
      products = products.filter(
        (p) =>
          p.category_slug?.toLowerCase() === params.categorySlug?.toLowerCase() ||
          p.category_name?.toLowerCase().includes(params.categorySlug?.toLowerCase() || '')
      );
    }
    if (params?.brandSlug) {
      products = products.filter(
        (p) => p.brand_name?.toLowerCase() === params.brandSlug?.toLowerCase()
      );
    }
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand_name?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'price-asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          products.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          products.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'best-sellers':
        case 'popular':
          products.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
          break;
      }
    }

    return products;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .single();
        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('Supabase getProductBySlug fallback', err);
      }
    }
    const products = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return (products || []).find((p) => p.slug === slug || p.id === slug) || null;
  },

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('Supabase createProduct fallback', err);
      }
    }

    const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    list.unshift(newProduct);
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('Supabase updateProduct fallback', err);
      }
    }

    const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');
    const updated = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    list[index] = updated;
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteProduct fallback', err);
      }
    }

    const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = list.filter((p) => p.id !== id);
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  // CATEGORIES
  async getCategories(activeOnly = true): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Category[];
      } catch (err) {
        console.warn('Supabase getCategories fallback', err);
      }
    }

    const categories = getLocalData<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    return activeOnly ? categories.filter((c) => c.active) : categories;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories(false);
    return (categories || []).find((c) => c.slug?.toLowerCase() === slug?.toLowerCase()) || null;
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').insert([newCat]).select().single();
        if (!error && data) return data as Category;
      } catch (err) {
        console.warn('Supabase createCategory fallback', err);
      }
    }
    const list = getLocalData<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    list.push(newCat);
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, list);
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
        if (!error && data) return data as Category;
      } catch (err) {
        console.warn('Supabase updateCategory fallback', err);
      }
    }
    const list = getLocalData<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Categoría no encontrada');
    list[index] = { ...list[index], ...updates };
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, list);
    return list[index];
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteCategory fallback', err);
      }
    }
    const list = getLocalData<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, list.filter((c) => c.id !== id));
    return true;
  },

  // BRANDS
  async getBrands(activeOnly = true): Promise<Brand[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('brands').select('*').order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Brand[];
      } catch (err) {
        console.warn('Supabase getBrands fallback', err);
      }
    }

    const brands = getLocalData<Brand[]>(LOCAL_STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    return activeOnly ? brands.filter((b) => b.active) : brands;
  },

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const brands = await this.getBrands(false);
    return (brands || []).find((b) => b.slug?.toLowerCase() === slug?.toLowerCase() || b.name?.toLowerCase() === slug?.toLowerCase()) || null;
  },

  async createBrand(brandData: Omit<Brand, 'id'>): Promise<Brand> {
    const newBrand: Brand = {
      ...brandData,
      id: 'brand-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('brands').insert([newBrand]).select().single();
        if (!error && data) return data as Brand;
      } catch (err) {
        console.warn('Supabase createBrand fallback', err);
      }
    }
    const list = getLocalData<Brand[]>(LOCAL_STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    list.push(newBrand);
    setLocalData(LOCAL_STORAGE_KEYS.BRANDS, list);
    return newBrand;
  },

  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('brands').update(updates).eq('id', id).select().single();
        if (!error && data) return data as Brand;
      } catch (err) {
        console.warn('Supabase updateBrand fallback', err);
      }
    }
    const list = getLocalData<Brand[]>(LOCAL_STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Marca no encontrada');
    list[index] = { ...list[index], ...updates };
    setLocalData(LOCAL_STORAGE_KEYS.BRANDS, list);
    return list[index];
  },

  async deleteBrand(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('brands').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteBrand fallback', err);
      }
    }
    const list = getLocalData<Brand[]>(LOCAL_STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    setLocalData(LOCAL_STORAGE_KEYS.BRANDS, list.filter((b) => b.id !== id));
    return true;
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .order('created_at', { ascending: false });
        if (!error && data) return data as Order[];
      } catch (err) {
        console.warn('Supabase getOrders fallback', err);
      }
    }
    return getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return (orders || []).find((o) => o.id === id || o.order_number === id) || null;
  },

  async createOrder(orderInput: Omit<Order, 'id' | 'order_number' | 'created_at'>): Promise<Order> {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `3YR-${new Date().getFullYear().toString().slice(-2)}${randomNum}`;
    const newOrder: Order = {
      ...orderInput,
      id: 'ord-' + Date.now(),
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              id: newOrder.id,
              order_number: newOrder.order_number,
              customer_name: newOrder.customer_name,
              customer_email: newOrder.customer_email,
              customer_phone: newOrder.customer_phone,
              whatsapp: newOrder.whatsapp,
              address: newOrder.address,
              city: newOrder.city,
              department: newOrder.department,
              notes: newOrder.notes,
              subtotal: newOrder.subtotal,
              shipping: newOrder.shipping,
              total: newOrder.total,
              origin: newOrder.origin,
              payment_method: newOrder.payment_method,
              delivery_method: newOrder.delivery_method,
              status: newOrder.status,
            },
          ])
          .select()
          .single();

        if (!error && data && newOrder.items.length > 0) {
          const itemsPayload = newOrder.items.map((it) => ({
            order_id: data.id,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal: it.subtotal,
          }));
          await supabase.from('order_items').insert(itemsPayload);
        }
      } catch (err) {
        console.warn('Supabase createOrder fallback', err);
      }
    }

    const orders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    orders.unshift(newOrder);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, orders);

    return newOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (note) {
          await supabase
            .from('order_status_history')
            .insert([{ order_id: id, status, note }]);
        }
      } catch (err) {
        console.warn('Supabase updateOrderStatus fallback', err);
      }
    }

    const orders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Pedido no encontrado');
    orders[index].status = status;
    orders[index].updated_at = new Date().toISOString();
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, orders);
    return orders[index];
  },

  // ANNOUNCEMENTS
  async getAnnouncements(): Promise<Announcement[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) return data as Announcement[];
      } catch (err) {
        console.warn('Supabase getAnnouncements fallback', err);
      }
    }
    return getLocalData<Announcement[]>(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  async updateAnnouncements(list: Announcement[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('announcements').upsert(list);
      } catch (err) {
        console.warn('Supabase updateAnnouncements fallback', err);
      }
    }
    setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, list);
  },

  // BANNERS
  async getBanners(): Promise<Banner[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) return data as Banner[];
      } catch (err) {
        console.warn('Supabase getBanners fallback', err);
      }
    }
    return getLocalData<Banner[]>(LOCAL_STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
  },

  async updateBanners(list: Banner[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('banners').upsert(list);
      } catch (err) {
        console.warn('Supabase updateBanners fallback', err);
      }
    }
    setLocalData(LOCAL_STORAGE_KEYS.BANNERS, list);
  },

  // SETTINGS
  async getStoreSettings(): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
        if (!error && data) return data as StoreSettings;
      } catch (err) {
        console.warn('Supabase getStoreSettings fallback', err);
      }
    }
    const settings = getLocalData<StoreSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (!settings.city || settings.city.toLowerCase().includes('medell')) {
      settings.city = 'Cartagena';
      settings.department = 'Bolívar';
      settings.address = 'Cartagena de Indias';
      setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, settings);
    }
    return settings;
  },

  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .upsert({ ...settings, updated_at: new Date().toISOString() })
          .select()
          .single();
        if (!error && data) return data as StoreSettings;
      } catch (err) {
        console.warn('Supabase updateStoreSettings fallback', err);
      }
    }
    setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, settings);
    return settings;
  },

  // NEWSLETTER
  async subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert([{ email: cleanEmail, active: true }]);
        if (error && error.code === '23505') {
          return { success: true, message: '¡Ya estabas suscrita! Te mantendremos informada.' };
        }
      } catch (err) {
        console.warn('Supabase subscribe fallback', err);
      }
    }

    const list = getLocalData<NewsletterSubscriber[]>(LOCAL_STORAGE_KEYS.SUBSCRIBERS, []);
    if (list.some((s) => s.email === cleanEmail)) {
      return { success: true, message: '¡Ya estabas suscrita a nuestro catálogo!' };
    }
    list.push({ id: 'sub-' + Date.now(), email: cleanEmail, active: true, created_at: new Date().toISOString() });
    setLocalData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, list);
    return { success: true, message: '¡Gracias por suscribirte! Recibirás nuestras novedades y ofertas.' };
  },

  async getNewsletterSubscribers(): Promise<string[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('email')
          .order('created_at', { ascending: false });
        if (!error && data) return data.map((d: any) => d.email);
      } catch (err) {
        console.warn('Supabase getNewsletterSubscribers fallback', err);
      }
    }
    const list = getLocalData<NewsletterSubscriber[]>(LOCAL_STORAGE_KEYS.SUBSCRIBERS, []);
    return list.map((s) => s.email);
  },

  // CONTACT MESSAGE
  async sendContactMessage(msg: Omit<ContactMessage, 'id' | 'created_at'>): Promise<boolean> {
    const newMessage: ContactMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      created_at: new Date().toISOString(),
      read: false,
    };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contact_messages').insert([newMessage]);
      } catch (err) {
        console.warn('Supabase contact fallback', err);
      }
    }
    const list = getLocalData<ContactMessage[]>(LOCAL_STORAGE_KEYS.MESSAGES, []);
    list.unshift(newMessage);
    setLocalData(LOCAL_STORAGE_KEYS.MESSAGES, list);
    return true;
  },

  async getContactMessages(): Promise<ContactMessage[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as ContactMessage[];
      } catch (err) {
        console.warn('Supabase getContactMessages fallback', err);
      }
    }
    return getLocalData<ContactMessage[]>(LOCAL_STORAGE_KEYS.MESSAGES, []);
  },

  // Helper to format prices consistently: "$ 89.900"
  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0,
    }).format(value);
  },

  // Helper to build WhatsApp purchase URL
  buildWhatsAppOrderUrl(order: {
    whatsappNumber: string;
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    shipping: number;
    total: number;
    customerName?: string;
    customerPhone?: string;
    city?: string;
    address?: string;
  }): string {
    let cleanNumber = order.whatsappNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber.startsWith('57') && cleanNumber.length === 10) {
      cleanNumber = '57' + cleanNumber;
    }

    let itemsText = '';
    order.items.forEach((item) => {
      itemsText += `• ${item.quantity}x ${item.name} (${this.formatCurrency(item.price * item.quantity)})\n`;
    });

    let msg = `Hola 👋\n\nSoy cliente de *Las 3YR - Donde Enith*.\nQuiero realizar el siguiente pedido:\n\n🛍️ *PRODUCTOS:*\n${itemsText}\n`;
    msg += `📊 *Subtotal:* ${this.formatCurrency(order.subtotal)}\n`;
    msg += `🚚 *Envío:* ${order.shipping === 0 ? '¡Gratis!' : this.formatCurrency(order.shipping)}\n`;
    msg += `✨ *TOTAL:* ${this.formatCurrency(order.total)}\n\n`;

    if (order.customerName) {
      msg += `👤 *Cliente:* ${order.customerName}\n`;
      if (order.customerPhone) msg += `📱 *Teléfono/WhatsApp:* ${order.customerPhone}\n`;
      if (order.city) msg += `📍 *Ciudad:* ${order.city}\n`;
      if (order.address) msg += `🏠 *Dirección:* ${order.address}\n\n`;
    }

    msg += `¡Muchas gracias! Quedo a la espera para coordinar la entrega y el pago. 💖`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  },

  // Test Supabase live connection
  async testSupabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas en el entorno.',
      };
    }
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        return {
          success: false,
          message: `Error al consultar la tabla products en Supabase: ${error.message}. Asegúrate de haber ejecutado supabase-schema.sql en el SQL Editor.`,
          details: error,
        };
      }
      return {
        success: true,
        message: '¡Conexión exitosa a la base de datos Supabase! Las tablas y políticas RLS están respondiendo correctamente.',
        details: data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Excepción al conectar con Supabase: ${err.message || err}`,
        details: err,
      };
    }
  },

  // Seed / Sync initial catalog data to Supabase
  async seedInitialDataToSupabase(): Promise<{ success: boolean; count: number; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        count: 0,
        message: 'Supabase no está configurado con claves válidas.',
      };
    }

    try {
      // 1. Seed categories
      await supabase.from('categories').upsert(INITIAL_CATEGORIES, { onConflict: 'id' });
      // 2. Seed brands
      await supabase.from('brands').upsert(INITIAL_BRANDS, { onConflict: 'id' });
      // 3. Seed announcements
      await supabase.from('announcements').upsert(INITIAL_ANNOUNCEMENTS, { onConflict: 'id' });
      // 4. Seed banners
      await supabase.from('banners').upsert(INITIAL_BANNERS, { onConflict: 'id' });
      // 5. Seed products
      const { error: prodErr } = await supabase.from('products').upsert(INITIAL_PRODUCTS, { onConflict: 'id' });

      if (prodErr) {
        throw prodErr;
      }

      return {
        success: true,
        count: INITIAL_PRODUCTS.length,
        message: `Se sincronizaron con éxito ${INITIAL_PRODUCTS.length} productos, ${INITIAL_CATEGORIES.length} categorías, ${INITIAL_BRANDS.length} marcas y banners en Supabase.`,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: `Error al sincronizar datos iniciales: ${err.message || err}`,
      };
    }
  },
};
