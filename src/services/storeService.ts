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
import {
  sanitizePlainText,
  sanitizeSearchQuery,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeObject,
} from '../lib/sanitize';

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

// Helper to communicate with central backend server API
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
    return null;
  } catch {
    return null;
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
    let rawProducts: Product[] = [];

    // 1. Central Server API First (multi-device synchronization)
    const serverProducts = await fetchApi<Product[]>('/api/products');
    if (serverProducts && Array.isArray(serverProducts) && serverProducts.length > 0) {
      rawProducts = serverProducts;
      setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, rawProducts);
    } else if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('products').select('*');

        if (params?.activeOnly !== false) {
          query = query.eq('active', true);
        }
        if (params?.featured) {
          query = query.eq('featured', true);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          rawProducts = data as Product[];
          setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, rawProducts);
        } else if (error) {
          console.warn('Error consultando productos en Supabase, usando respaldo local:', error.message);
          rawProducts = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        }
      } catch (e) {
        console.warn('Supabase getProducts fallback to local store', e);
        rawProducts = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      }
    } else {
      rawProducts = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }

    let products = [...rawProducts];

    // Filter active
    if (params?.activeOnly !== false) {
      products = products.filter((p) => p.active !== false);
    }

    // Filter featured
    if (params?.featured) {
      products = products.filter((p) => Boolean(p.featured));
    }

    // Filter offersOnly: ONLY products that have a comparison price higher than current price
    if (params?.offersOnly) {
      products = products.filter(
        (p) => p.compare_price && Number(p.compare_price) > Number(p.price)
      );
    }

    // Filter category
    if (params?.categorySlug) {
      const cSlug = params.categorySlug.toLowerCase().trim();
      products = products.filter((p) => {
        const pSlug = (p.category_slug || '').toLowerCase().trim();
        const pName = (p.category_name || '').toLowerCase().trim();
        const pId = (p.category_id || '').toLowerCase().trim();
        return (
          pSlug === cSlug ||
          pName === cSlug ||
          pName.includes(cSlug) ||
          pId === cSlug ||
          cSlug.includes(pSlug && pSlug.length > 2 ? pSlug : '___')
        );
      });
    }

    // Filter brand
    if (params?.brandSlug) {
      const bSlug = params.brandSlug.toLowerCase().trim();
      products = products.filter((p) => {
        const pBrand = (p.brand_name || '').toLowerCase().trim();
        const pId = (p.brand_id || '').toLowerCase().trim();
        return (
          pBrand === bSlug ||
          pBrand.includes(bSlug) ||
          bSlug.includes(pBrand && pBrand.length > 2 ? pBrand : '___') ||
          pId === bSlug
        );
      });
    }

    // Filter search
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.short_description || '').toLowerCase().includes(q) ||
          (p.brand_name || '').toLowerCase().includes(q) ||
          (p.category_name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'price-asc':
          products.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
          break;
        case 'price-desc':
          products.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
          break;
        case 'name-asc':
          products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'name-desc':
          products.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
          break;
        case 'best-sellers':
        case 'popular':
          products.sort((a, b) => (Number(b.reviews_count) || 0) - (Number(a.reviews_count) || 0));
          break;
        default:
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
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .maybeSingle();
        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('Supabase getProductBySlug fallback', err);
      }
    }
    const products = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return (products || []).find((p) => p.slug === slug || p.id === slug) || null;
  },

  async createProduct(productData: Omit<Product, 'id'> & { is_active?: boolean; is_featured?: boolean }): Promise<Product> {
    const rawName = sanitizePlainText(productData.name, { allowNewlines: false });
    const slug = sanitizePlainText(productData.slug || (
      rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4)
    ));

    const isActive = productData.active !== undefined 
      ? Boolean(productData.active) 
      : productData.is_active !== undefined 
      ? Boolean(productData.is_active) 
      : true;

    const isFeatured = productData.featured !== undefined 
      ? Boolean(productData.featured) 
      : productData.is_featured !== undefined 
      ? Boolean(productData.is_featured) 
      : false;

    const cleanGallery = Array.isArray(productData.gallery)
      ? productData.gallery.map((img) => sanitizeUrl(img)).filter(Boolean)
      : [];

    const cleanProduct: Product = {
      id: 'prod-' + Date.now(),
      name: rawName,
      slug,
      sku: productData.sku ? sanitizePlainText(productData.sku, { allowNewlines: false }) : (null as any),
      brand_id: productData.brand_id && productData.brand_id.trim() ? sanitizePlainText(productData.brand_id, { allowNewlines: false }) : (null as any),
      brand_name: productData.brand_name ? sanitizePlainText(productData.brand_name, { allowNewlines: false }) : (null as any),
      category_id: productData.category_id && productData.category_id.trim() ? sanitizePlainText(productData.category_id, { allowNewlines: false }) : (null as any),
      category_name: productData.category_name ? sanitizePlainText(productData.category_name, { allowNewlines: false }) : (null as any),
      category_slug: productData.category_slug ? sanitizePlainText(productData.category_slug, { allowNewlines: false }) : (null as any),
      description: sanitizePlainText(productData.description || '', { allowNewlines: true }),
      short_description: productData.short_description ? sanitizePlainText(productData.short_description, { allowNewlines: true }) : (null as any),
      price: sanitizeNumber(productData.price, 0),
      compare_price: productData.compare_price ? sanitizeNumber(productData.compare_price, 0) : (null as any),
      discount_percentage: sanitizeNumber(productData.discount_percentage, 0),
      stock: sanitizeNumber(productData.stock, 0),
      main_image: sanitizeUrl(productData.main_image, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'),
      gallery: cleanGallery,
      content_spec: productData.content_spec ? sanitizePlainText(productData.content_spec, { allowNewlines: false }) : (null as any),
      rating: sanitizeNumber(productData.rating, 5.0),
      reviews_count: sanitizeNumber(productData.reviews_count, 0),
      featured: isFeatured,
      active: isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const validColumns = [
          'id', 'name', 'slug', 'sku', 'brand_id', 'brand_name',
          'category_id', 'category_name', 'category_slug', 'description',
          'short_description', 'price', 'compare_price', 'discount_percentage',
          'stock', 'main_image', 'gallery', 'content_spec', 'rating',
          'reviews_count', 'featured', 'active', 'created_at', 'updated_at'
        ];
        const supabasePayload: Record<string, any> = {};
        for (const col of validColumns) {
          if ((cleanProduct as any)[col] !== undefined) {
            supabasePayload[col] = (cleanProduct as any)[col];
          }
        }

        const { data, error } = await supabase
          .from('products')
          .insert([supabasePayload])
          .select()
          .single();

        if (error) {
          console.error('Error insertando producto en Supabase:', error);
          // If error is FK constraint on brand or category, retry with null FKs
          if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates')) {
            const retryPayload = { ...supabasePayload, brand_id: null, category_id: null };
            const { data: retryData, error: retryErr } = await supabase
              .from('products')
              .insert([retryPayload])
              .select()
              .single();
            if (!retryErr && retryData) {
              const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
              list.unshift(retryData as Product);
              setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
              return retryData as Product;
            }
          }
          throw new Error(`Error en Supabase: ${error.message}`);
        }

        if (data) {
          const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
          list.unshift(data as Product);
          setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
          return data as Product;
        }
      } catch (err: any) {
        console.error('Excepción al guardar en Supabase:', err);
        throw err;
      }
    }

    const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    list.unshift(cleanProduct);
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
    return cleanProduct;
  },

  async updateProduct(id: string, updates: Partial<Product> & { is_active?: boolean; is_featured?: boolean }): Promise<Product> {
    const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    
    // Normalize active and featured
    if (updates.active !== undefined) cleanUpdates.active = Boolean(updates.active);
    else if (updates.is_active !== undefined) cleanUpdates.active = Boolean(updates.is_active);

    if (updates.featured !== undefined) cleanUpdates.featured = Boolean(updates.featured);
    else if (updates.is_featured !== undefined) cleanUpdates.featured = Boolean(updates.is_featured);

    if ('brand_id' in cleanUpdates) cleanUpdates.brand_id = cleanUpdates.brand_id && String(cleanUpdates.brand_id).trim() ? sanitizePlainText(cleanUpdates.brand_id, { allowNewlines: false }) : null;
    if ('brand_name' in cleanUpdates) cleanUpdates.brand_name = cleanUpdates.brand_name ? sanitizePlainText(cleanUpdates.brand_name, { allowNewlines: false }) : null;
    if ('category_id' in cleanUpdates) cleanUpdates.category_id = cleanUpdates.category_id && String(cleanUpdates.category_id).trim() ? sanitizePlainText(cleanUpdates.category_id, { allowNewlines: false }) : null;
    if ('category_name' in cleanUpdates) cleanUpdates.category_name = cleanUpdates.category_name ? sanitizePlainText(cleanUpdates.category_name, { allowNewlines: false }) : null;
    if ('category_slug' in cleanUpdates) cleanUpdates.category_slug = cleanUpdates.category_slug ? sanitizePlainText(cleanUpdates.category_slug, { allowNewlines: false }) : null;
    if ('name' in cleanUpdates && cleanUpdates.name) cleanUpdates.name = sanitizePlainText(cleanUpdates.name, { allowNewlines: false });
    if ('slug' in cleanUpdates && cleanUpdates.slug) cleanUpdates.slug = sanitizePlainText(cleanUpdates.slug, { allowNewlines: false });
    if ('description' in cleanUpdates) cleanUpdates.description = sanitizePlainText(cleanUpdates.description || '', { allowNewlines: true });
    if ('short_description' in cleanUpdates) cleanUpdates.short_description = cleanUpdates.short_description ? sanitizePlainText(cleanUpdates.short_description, { allowNewlines: true }) : null;
    if ('main_image' in cleanUpdates && cleanUpdates.main_image) cleanUpdates.main_image = sanitizeUrl(cleanUpdates.main_image);
    if ('gallery' in cleanUpdates && Array.isArray(cleanUpdates.gallery)) cleanUpdates.gallery = cleanUpdates.gallery.map((g: any) => sanitizeUrl(g)).filter(Boolean);
    if ('price' in cleanUpdates) cleanUpdates.price = sanitizeNumber(cleanUpdates.price, 0);
    if ('stock' in cleanUpdates) cleanUpdates.stock = sanitizeNumber(cleanUpdates.stock, 0);
    if ('compare_price' in cleanUpdates) cleanUpdates.compare_price = cleanUpdates.compare_price ? sanitizeNumber(cleanUpdates.compare_price) : null;
    if ('discount_percentage' in cleanUpdates) cleanUpdates.discount_percentage = sanitizeNumber(cleanUpdates.discount_percentage, 0);
    if ('rating' in cleanUpdates) cleanUpdates.rating = sanitizeNumber(cleanUpdates.rating, 5.0);
    if ('reviews_count' in cleanUpdates) cleanUpdates.reviews_count = sanitizeNumber(cleanUpdates.reviews_count, 0);
    if ('sku' in cleanUpdates) cleanUpdates.sku = cleanUpdates.sku ? sanitizePlainText(cleanUpdates.sku, { allowNewlines: false }) : null;
    if ('content_spec' in cleanUpdates) cleanUpdates.content_spec = cleanUpdates.content_spec ? sanitizePlainText(cleanUpdates.content_spec, { allowNewlines: false }) : null;

    // Delete legacy/temp UI keys
    delete cleanUpdates.is_active;
    delete cleanUpdates.is_featured;

    if (isSupabaseConfigured && supabase) {
      try {
        const validColumns = [
          'name', 'slug', 'sku', 'brand_id', 'brand_name',
          'category_id', 'category_name', 'category_slug', 'description',
          'short_description', 'price', 'compare_price', 'discount_percentage',
          'stock', 'main_image', 'gallery', 'content_spec', 'rating',
          'reviews_count', 'featured', 'active', 'updated_at'
        ];
        const supabasePayload: Record<string, any> = { updated_at: cleanUpdates.updated_at };
        for (const col of validColumns) {
          if (cleanUpdates[col] !== undefined) {
            supabasePayload[col] = cleanUpdates[col];
          }
        }

        const { data, error } = await supabase
          .from('products')
          .update(supabasePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error actualizando producto en Supabase:', error);
          if (error.code === '23503' || error.message?.includes('foreign key')) {
            const retryUpdates = { ...supabasePayload, brand_id: null, category_id: null };
            const { data: retryData, error: retryErr } = await supabase
              .from('products')
              .update(retryUpdates)
              .eq('id', id)
              .select()
              .single();
            if (!retryErr && retryData) {
              const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
              const idx = list.findIndex((p) => p.id === id);
              if (idx !== -1) list[idx] = retryData as Product;
              setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
              return retryData as Product;
            }
          }
          throw new Error(`Error en Supabase: ${error.message}`);
        }

        if (data) {
          const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
          const idx = list.findIndex((p) => p.id === id);
          if (idx !== -1) list[idx] = data as Product;
          setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
          return data as Product;
        }
      } catch (err: any) {
        console.error('Excepción al actualizar en Supabase:', err);
        throw err;
      }
    }

    const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');
    const updated = { ...list[index], ...cleanUpdates };
    list[index] = updated;
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, list);
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.error('Error eliminando producto de Supabase:', error);
          throw new Error(`Error en Supabase al eliminar producto: ${error.message}`);
        }
      } catch (err: any) {
        console.error('Excepción al eliminar en Supabase:', err);
        throw err;
      }
    }

    const list = getLocalData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = list.filter((p) => p.id !== id);
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  // CATEGORIES
  async getCategories(activeOnly = true): Promise<Category[]> {
    const serverCats = await fetchApi<Category[]>('/api/categories');
    if (serverCats && Array.isArray(serverCats) && serverCats.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, serverCats);
      return activeOnly ? serverCats.filter((c) => c.active) : serverCats;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, data as Category[]);
          return data as Category[];
        }
      } catch (err) {
        console.warn('Supabase getCategories fallback', err);
      }
    }

    const categories = getLocalData<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    return activeOnly ? categories.filter((c) => c.active) : categories;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cleanSlug = sanitizePlainText(slug, { allowNewlines: false }).toLowerCase();
    const categories = await this.getCategories(false);
    return (categories || []).find((c) => c.slug?.toLowerCase() === cleanSlug) || null;
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const newCat: Category = {
      name: sanitizePlainText(cat.name, { allowNewlines: false }),
      slug: sanitizePlainText(cat.slug, { allowNewlines: false }).toLowerCase(),
      description: cat.description ? sanitizePlainText(cat.description, { allowNewlines: true }) : '',
      image_url: cat.image_url ? sanitizeUrl(cat.image_url) : '',
      active: cat.active !== false,
      sort_order: sanitizeNumber(cat.sort_order, 1),
      id: 'cat-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    fetchApi('/api/categories', { method: 'POST', body: JSON.stringify(newCat) }).catch(() => {});

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
    const cleanUpdates: Partial<Category> = {};
    if (updates.name !== undefined) cleanUpdates.name = sanitizePlainText(updates.name, { allowNewlines: false });
    if (updates.slug !== undefined) cleanUpdates.slug = sanitizePlainText(updates.slug, { allowNewlines: false }).toLowerCase();
    if (updates.description !== undefined) cleanUpdates.description = sanitizePlainText(updates.description, { allowNewlines: true });
    if (updates.image_url !== undefined) cleanUpdates.image_url = sanitizeUrl(updates.image_url);
    if (updates.active !== undefined) cleanUpdates.active = Boolean(updates.active);
    if (updates.sort_order !== undefined) cleanUpdates.sort_order = sanitizeNumber(updates.sort_order, 1);

    fetchApi(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').update(cleanUpdates).eq('id', id).select().single();
        if (!error && data) return data as Category;
      } catch (err) {
        console.warn('Supabase updateCategory fallback', err);
      }
    }
    const list = getLocalData<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Categoría no encontrada');
    list[index] = { ...list[index], ...cleanUpdates };
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, list);
    return list[index];
  },

  async deleteCategory(id: string): Promise<boolean> {
    fetchApi(`/api/categories/${id}`, { method: 'DELETE' }).catch(() => {});

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
    const serverBrands = await fetchApi<Brand[]>('/api/brands');
    if (serverBrands && Array.isArray(serverBrands) && serverBrands.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.BRANDS, serverBrands);
      return activeOnly ? serverBrands.filter((b) => b.active) : serverBrands;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('brands').select('*').order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setLocalData(LOCAL_STORAGE_KEYS.BRANDS, data as Brand[]);
          return data as Brand[];
        }
      } catch (err) {
        console.warn('Supabase getBrands fallback', err);
      }
    }
    const brands = getLocalData<Brand[]>(LOCAL_STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    return activeOnly ? brands.filter((b) => b.active) : brands;
  },

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const cleanSlug = sanitizePlainText(slug, { allowNewlines: false }).toLowerCase();
    const brands = await this.getBrands(false);
    return (brands || []).find((b) => b.slug?.toLowerCase() === cleanSlug || b.name?.toLowerCase() === cleanSlug) || null;
  },

  async createBrand(brandData: Omit<Brand, 'id'>): Promise<Brand> {
    const newBrand: Brand = {
      name: sanitizePlainText(brandData.name, { allowNewlines: false }),
      slug: sanitizePlainText(brandData.slug, { allowNewlines: false }).toLowerCase(),
      description: brandData.description ? sanitizePlainText(brandData.description, { allowNewlines: true }) : '',
      logo_url: brandData.logo_url ? sanitizeUrl(brandData.logo_url) : '',
      active: brandData.active !== false,
      sort_order: sanitizeNumber(brandData.sort_order, 1),
      id: 'brand-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    fetchApi('/api/brands', { method: 'POST', body: JSON.stringify(newBrand) }).catch(() => {});

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
    const cleanUpdates: Partial<Brand> = {};
    if (updates.name !== undefined) cleanUpdates.name = sanitizePlainText(updates.name, { allowNewlines: false });
    if (updates.slug !== undefined) cleanUpdates.slug = sanitizePlainText(updates.slug, { allowNewlines: false }).toLowerCase();
    if (updates.description !== undefined) cleanUpdates.description = sanitizePlainText(updates.description, { allowNewlines: true });
    if (updates.logo_url !== undefined) cleanUpdates.logo_url = sanitizeUrl(updates.logo_url);
    if (updates.active !== undefined) cleanUpdates.active = Boolean(updates.active);
    if (updates.sort_order !== undefined) cleanUpdates.sort_order = sanitizeNumber(updates.sort_order, 1);

    fetchApi(`/api/brands/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('brands').update(cleanUpdates).eq('id', id).select().single();
        if (!error && data) return data as Brand;
      } catch (err) {
        console.warn('Supabase updateBrand fallback', err);
      }
    }
    const list = getLocalData<Brand[]>(LOCAL_STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Marca no encontrada');
    list[index] = { ...list[index], ...cleanUpdates };
    setLocalData(LOCAL_STORAGE_KEYS.BRANDS, list);
    return list[index];
  },

  async deleteBrand(id: string): Promise<boolean> {
    fetchApi(`/api/brands/${id}`, { method: 'DELETE' }).catch(() => {});

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
    // 1. Central Server API First (Real Multi-Device Synchronization)
    const serverOrders = await fetchApi<Order[]>('/api/orders');
    if (serverOrders && Array.isArray(serverOrders)) {
      // Check if this device has any local order created previously that is not yet on the server
      const localOrders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
      const unsynced = localOrders.filter(
        (lo) => !serverOrders.some((so) => so.id === lo.id || so.order_number === lo.order_number)
      );

      if (unsynced.length > 0) {
        // Automatically sync pending local orders to server so all devices see them!
        fetchApi<{ success: boolean; orders: Order[] }>('/api/orders/sync', {
          method: 'POST',
          body: JSON.stringify({ orders: unsynced }),
        }).catch((e) => console.warn('Order sync error:', e));

        const merged = [...unsynced, ...serverOrders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLocalData(LOCAL_STORAGE_KEYS.ORDERS, merged);
        return merged;
      }

      setLocalData(LOCAL_STORAGE_KEYS.ORDERS, serverOrders);
      return serverOrders;
    }

    // 2. Fallback to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setLocalData(LOCAL_STORAGE_KEYS.ORDERS, data as Order[]);
          return data as Order[];
        }
      } catch (err) {
        console.warn('Supabase getOrders fallback', err);
      }
    }

    // 3. Fallback to local storage
    return getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const cleanId = sanitizePlainText(id, { allowNewlines: false });
    const orders = await this.getOrders();
    return (orders || []).find((o) => o.id === cleanId || o.order_number === cleanId) || null;
  },

  async createOrder(orderInput: Omit<Order, 'id' | 'order_number' | 'created_at'>): Promise<Order> {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `3YR-${new Date().getFullYear().toString().slice(-2)}${randomNum}`;
    const cleanItems = (orderInput.items || []).map((it) => ({
      product_id: sanitizePlainText(it.product_id, { allowNewlines: false }),
      product_name: sanitizePlainText(it.product_name, { allowNewlines: false }),
      product_image: sanitizeUrl(it.product_image),
      quantity: sanitizeNumber(it.quantity, 1),
      unit_price: sanitizeNumber(it.unit_price, 0),
      subtotal: sanitizeNumber(it.subtotal, 0),
    }));

    const newOrder: Order = {
      customer_name: sanitizePlainText(orderInput.customer_name, { allowNewlines: false }),
      customer_email: sanitizeEmail(orderInput.customer_email),
      customer_phone: sanitizePhone(orderInput.customer_phone),
      whatsapp: sanitizePhone(orderInput.whatsapp || orderInput.customer_phone),
      address: sanitizePlainText(orderInput.address, { allowNewlines: false }),
      city: sanitizePlainText(orderInput.city || 'Cartagena', { allowNewlines: false }),
      department: sanitizePlainText(orderInput.department || 'Bolívar', { allowNewlines: false }),
      notes: orderInput.notes ? sanitizePlainText(orderInput.notes, { allowNewlines: true, maxLength: 500 }) : '',
      subtotal: sanitizeNumber(orderInput.subtotal, 0),
      shipping: sanitizeNumber(orderInput.shipping, 0),
      total: sanitizeNumber(orderInput.total, 0),
      origin: orderInput.origin || 'Web',
      payment_method: orderInput.payment_method,
      delivery_method: orderInput.delivery_method,
      status: orderInput.status || 'Pendiente',
      items: cleanItems,
      id: 'ord-' + Date.now(),
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Post to Server API (persists centrally for all devices)
    const serverCreated = await fetchApi<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(newOrder),
    });

    const finalOrder = serverCreated || newOrder;

    // 2. Also try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              id: finalOrder.id,
              order_number: finalOrder.order_number,
              customer_name: finalOrder.customer_name,
              customer_email: finalOrder.customer_email,
              customer_phone: finalOrder.customer_phone,
              whatsapp: finalOrder.whatsapp,
              address: finalOrder.address,
              city: finalOrder.city,
              department: finalOrder.department,
              notes: finalOrder.notes,
              subtotal: finalOrder.subtotal,
              shipping: finalOrder.shipping,
              total: finalOrder.total,
              origin: finalOrder.origin,
              payment_method: finalOrder.payment_method,
              delivery_method: finalOrder.delivery_method,
              status: finalOrder.status,
            },
          ])
          .select()
          .single();

        if (!error && data && finalOrder.items.length > 0) {
          const itemsPayload = finalOrder.items.map((it) => ({
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

    // 3. Save to local storage cache
    const orders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    orders.unshift(finalOrder);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, orders);

    return finalOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
    // 1. Update on Server API
    await fetchApi<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });

    // 2. Update on Supabase if configured
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

    // 3. Update local cache
    const orders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    const index = orders.findIndex((o) => o.id === id || o.order_number === id);
    if (index === -1) {
      return { id, status, updated_at: new Date().toISOString() } as any;
    }
    orders[index].status = status;
    orders[index].updated_at = new Date().toISOString();
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, orders);
    return orders[index];
  },

  async deleteOrder(id: string): Promise<boolean> {
    // 1. Delete on Server API
    await fetchApi(`/api/orders/${id}`, { method: 'DELETE' });

    // 2. Delete on Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('orders').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteOrder fallback', err);
      }
    }

    // 3. Delete from local cache
    const orders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    const filtered = orders.filter((o) => o.id !== id && o.order_number !== id);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, filtered);
    return true;
  },

  async syncAllLocalOrders(): Promise<{ syncedCount: number; totalCount: number }> {
    const localOrders = getLocalData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    const serverOrders = (await fetchApi<Order[]>('/api/orders')) || [];
    const unsynced = localOrders.filter(
      (lo) => !serverOrders.some((so) => so.id === lo.id || so.order_number === lo.order_number)
    );

    if (unsynced.length > 0) {
      const res = await fetchApi<{ success: boolean; count: number; orders: Order[] }>('/api/orders/sync', {
        method: 'POST',
        body: JSON.stringify({ orders: unsynced }),
      });
      if (res && res.orders) {
        setLocalData(LOCAL_STORAGE_KEYS.ORDERS, res.orders);
        return { syncedCount: unsynced.length, totalCount: res.orders.length };
      }
    }

    return { syncedCount: 0, totalCount: serverOrders.length || localOrders.length };
  },

  // ANNOUNCEMENTS
  async getAnnouncements(activeOnly = true): Promise<Announcement[]> {
    const serverAnns = await fetchApi<Announcement[]>('/api/announcements');
    if (serverAnns && Array.isArray(serverAnns) && serverAnns.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, serverAnns);
      return activeOnly ? serverAnns.filter((a) => a.active) : serverAnns;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('announcements').select('*').order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, data as Announcement[]);
          return data as Announcement[];
        }
      } catch (err) {
        console.warn('Supabase getAnnouncements fallback', err);
      }
    }
    const list = getLocalData<Announcement[]>(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    return activeOnly ? list.filter((a) => a.active) : list;
  },

  async createAnnouncement(announcementData: Omit<Announcement, 'id'>): Promise<Announcement> {
    const newAnn: Announcement = {
      message: sanitizePlainText(announcementData.message, { allowNewlines: false }),
      icon: announcementData.icon ? sanitizePlainText(announcementData.icon, { allowNewlines: false }) : 'Sparkles',
      active: announcementData.active !== false,
      sort_order: sanitizeNumber(announcementData.sort_order, 1),
      id: 'ann-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    fetchApi('/api/announcements', { method: 'POST', body: JSON.stringify(newAnn) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('announcements').insert([newAnn]).select().single();
        if (!error && data) return data as Announcement;
      } catch (err) {
        console.warn('Supabase createAnnouncement fallback', err);
      }
    }
    const list = getLocalData<Announcement[]>(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    list.push(newAnn);
    setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, list);
    return newAnn;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const cleanUpdates: Partial<Announcement> = {};
    if (updates.message !== undefined) cleanUpdates.message = sanitizePlainText(updates.message, { allowNewlines: false });
    if (updates.icon !== undefined) cleanUpdates.icon = sanitizePlainText(updates.icon, { allowNewlines: false });
    if (updates.active !== undefined) cleanUpdates.active = Boolean(updates.active);
    if (updates.sort_order !== undefined) cleanUpdates.sort_order = sanitizeNumber(updates.sort_order, 1);

    fetchApi(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('announcements').update(cleanUpdates).eq('id', id).select().single();
        if (!error && data) return data as Announcement;
      } catch (err) {
        console.warn('Supabase updateAnnouncement fallback', err);
      }
    }
    const list = getLocalData<Announcement[]>(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Anuncio no encontrado');
    list[index] = { ...list[index], ...cleanUpdates };
    setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, list);
    return list[index];
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    fetchApi(`/api/announcements/${id}`, { method: 'DELETE' }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteAnnouncement fallback', err);
      }
    }
    const list = getLocalData<Announcement[]>(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, list.filter((a) => a.id !== id));
    return true;
  },

  async updateAnnouncements(list: Announcement[]): Promise<void> {
    const cleanList = list.map((a) => ({
      ...a,
      message: sanitizePlainText(a.message, { allowNewlines: false }),
      icon: a.icon ? sanitizePlainText(a.icon, { allowNewlines: false }) : 'Sparkles',
      active: Boolean(a.active),
      sort_order: sanitizeNumber(a.sort_order, 1),
    }));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('announcements').upsert(cleanList);
      } catch (err) {
        console.warn('Supabase updateAnnouncements fallback', err);
      }
    }
    setLocalData(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, cleanList);
  },

  // BANNERS
  async getBanners(activeOnly = true): Promise<Banner[]> {
    const serverBanners = await fetchApi<Banner[]>('/api/banners');
    if (serverBanners && Array.isArray(serverBanners) && serverBanners.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.BANNERS, serverBanners);
      return activeOnly ? serverBanners.filter((b) => b.active) : serverBanners;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('banners').select('*').order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setLocalData(LOCAL_STORAGE_KEYS.BANNERS, data as Banner[]);
          return data as Banner[];
        }
      } catch (err) {
        console.warn('Supabase getBanners fallback', err);
      }
    }
    const list = getLocalData<Banner[]>(LOCAL_STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    return activeOnly ? list.filter((b) => b.active) : list;
  },

  async createBanner(bannerData: Omit<Banner, 'id'>): Promise<Banner> {
    const newBanner: Banner = {
      title: sanitizePlainText(bannerData.title, { allowNewlines: false }),
      description: bannerData.description ? sanitizePlainText(bannerData.description, { allowNewlines: false }) : '',
      tag: bannerData.tag ? sanitizePlainText(bannerData.tag, { allowNewlines: false }) : '',
      image_url: sanitizeUrl(bannerData.image_url),
      button_text: bannerData.button_text ? sanitizePlainText(bannerData.button_text, { allowNewlines: false }) : 'VER MÁS',
      button_url: bannerData.button_url ? sanitizePlainText(bannerData.button_url, { allowNewlines: false }) : '/productos',
      active: bannerData.active !== false,
      sort_order: sanitizeNumber(bannerData.sort_order, 1),
      id: 'ban-' + Date.now(),
    };

    fetchApi('/api/banners', { method: 'POST', body: JSON.stringify(newBanner) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('banners').insert([newBanner]).select().single();
        if (!error && data) return data as Banner;
      } catch (err) {
        console.warn('Supabase createBanner fallback', err);
      }
    }
    const list = getLocalData<Banner[]>(LOCAL_STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    list.push(newBanner);
    setLocalData(LOCAL_STORAGE_KEYS.BANNERS, list);
    return newBanner;
  },

  async updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
    const cleanUpdates: Partial<Banner> = {};
    if (updates.title !== undefined) cleanUpdates.title = sanitizePlainText(updates.title, { allowNewlines: false });
    if (updates.description !== undefined) cleanUpdates.description = sanitizePlainText(updates.description, { allowNewlines: false });
    if (updates.tag !== undefined) cleanUpdates.tag = sanitizePlainText(updates.tag, { allowNewlines: false });
    if (updates.image_url !== undefined) cleanUpdates.image_url = sanitizeUrl(updates.image_url);
    if (updates.button_text !== undefined) cleanUpdates.button_text = sanitizePlainText(updates.button_text, { allowNewlines: false });
    if (updates.button_url !== undefined) cleanUpdates.button_url = sanitizePlainText(updates.button_url, { allowNewlines: false });
    if (updates.active !== undefined) cleanUpdates.active = Boolean(updates.active);
    if (updates.sort_order !== undefined) cleanUpdates.sort_order = sanitizeNumber(updates.sort_order, 1);

    fetchApi(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('banners').update(cleanUpdates).eq('id', id).select().single();
        if (!error && data) return data as Banner;
      } catch (err) {
        console.warn('Supabase updateBanner fallback', err);
      }
    }
    const list = getLocalData<Banner[]>(LOCAL_STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Banner no encontrado');
    list[index] = { ...list[index], ...cleanUpdates };
    setLocalData(LOCAL_STORAGE_KEYS.BANNERS, list);
    return list[index];
  },

  async deleteBanner(id: string): Promise<boolean> {
    fetchApi(`/api/banners/${id}`, { method: 'DELETE' }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('banners').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteBanner fallback', err);
      }
    }
    const list = getLocalData<Banner[]>(LOCAL_STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    setLocalData(LOCAL_STORAGE_KEYS.BANNERS, list.filter((b) => b.id !== id));
    return true;
  },

  async updateBanners(list: Banner[]): Promise<void> {
    const cleanList = list.map((b) => ({
      ...b,
      title: sanitizePlainText(b.title, { allowNewlines: false }),
      description: b.description ? sanitizePlainText(b.description, { allowNewlines: false }) : '',
      tag: b.tag ? sanitizePlainText(b.tag, { allowNewlines: false }) : '',
      image_url: sanitizeUrl(b.image_url),
      button_text: b.button_text ? sanitizePlainText(b.button_text, { allowNewlines: false }) : 'VER MÁS',
      button_url: b.button_url ? sanitizePlainText(b.button_url, { allowNewlines: false }) : '/productos',
      active: Boolean(b.active),
      sort_order: sanitizeNumber(b.sort_order, 1),
    }));

    for (const b of cleanList) {
      fetchApi('/api/banners', { method: 'POST', body: JSON.stringify(b) }).catch(() => {});
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('banners').upsert(cleanList);
      } catch (err) {
        console.warn('Supabase updateBanners fallback', err);
      }
    }
    setLocalData(LOCAL_STORAGE_KEYS.BANNERS, cleanList);
  },

  // SETTINGS
  async getStoreSettings(): Promise<StoreSettings> {
    const serverSettings = await fetchApi<StoreSettings>('/api/settings');
    if (serverSettings && serverSettings.store_name) {
      setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, serverSettings);
      return serverSettings;
    }

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
    const cleanSettings: StoreSettings = {
      store_name: sanitizePlainText(settings.store_name, { allowNewlines: false }),
      whatsapp: sanitizePhone(settings.whatsapp),
      phone: sanitizePhone(settings.phone),
      email: sanitizeEmail(settings.email),
      address: sanitizePlainText(settings.address, { allowNewlines: false }),
      city: sanitizePlainText(settings.city, { allowNewlines: false }),
      department: sanitizePlainText(settings.department, { allowNewlines: false }),
      schedule: sanitizePlainText(settings.schedule || 'Lunes a Sábado: 8:00 AM - 7:00 PM', { allowNewlines: false }),
      instagram: settings.instagram ? sanitizePlainText(settings.instagram, { allowNewlines: false }) : '',
      facebook: settings.facebook ? sanitizePlainText(settings.facebook, { allowNewlines: false }) : '',
      shipping_cost: sanitizeNumber(settings.shipping_cost, 12000),
      free_shipping_from: sanitizeNumber(settings.free_shipping_from, 150000),
      whatsapp_custom_message: sanitizePlainText(settings.whatsapp_custom_message || 'Hola Las 3YR, quiero realizar un pedido', { allowNewlines: true }),
      announcement_text: settings.announcement_text ? sanitizePlainText(settings.announcement_text, { allowNewlines: false }) : '',
    };

    fetchApi('/api/settings', { method: 'PUT', body: JSON.stringify(cleanSettings) }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .upsert({ ...cleanSettings, updated_at: new Date().toISOString() })
          .select()
          .single();
        if (!error && data) return data as StoreSettings;
      } catch (err) {
        console.warn('Supabase updateStoreSettings fallback', err);
      }
    }
    setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, cleanSettings);
    return cleanSettings;
  },

  // NEWSLETTER
  async subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }

    fetchApi('/api/subscribers', { method: 'POST', body: JSON.stringify({ email: cleanEmail }) }).catch(() => {});

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
    const serverSubs = await fetchApi<NewsletterSubscriber[]>('/api/subscribers');
    if (serverSubs && Array.isArray(serverSubs) && serverSubs.length > 0) {
      return serverSubs.map((s) => s.email);
    }

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
      name: sanitizePlainText(msg.name, { allowNewlines: false }),
      email: sanitizeEmail(msg.email),
      phone: sanitizePhone(msg.phone || ''),
      message: sanitizePlainText(msg.message, { allowNewlines: true, maxLength: 2000 }),
      id: 'msg-' + Date.now(),
      created_at: new Date().toISOString(),
      read: false,
    };

    fetchApi('/api/messages', { method: 'POST', body: JSON.stringify(newMessage) }).catch(() => {});

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
    const serverMsgs = await fetchApi<ContactMessage[]>('/api/messages');
    if (serverMsgs && Array.isArray(serverMsgs) && serverMsgs.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.MESSAGES, serverMsgs);
      return serverMsgs;
    }

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
      
      // 5. Clean and Seed products
      const cleanProducts = INITIAL_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku || null,
        brand_id: p.brand_id || null,
        brand_name: p.brand_name || null,
        category_id: p.category_id || null,
        category_name: p.category_name || null,
        category_slug: p.category_slug || null,
        description: p.description || '',
        short_description: p.short_description || null,
        price: Number(p.price) || 0,
        compare_price: p.compare_price ? Number(p.compare_price) : null,
        discount_percentage: Number(p.discount_percentage) || 0,
        stock: Number(p.stock) || 0,
        main_image: p.main_image,
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
        content_spec: p.content_spec || null,
        rating: Number(p.rating) || 5.0,
        reviews_count: Number(p.reviews_count) || 0,
        featured: Boolean(p.featured),
        active: p.active !== false,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: prodErr } = await supabase.from('products').upsert(cleanProducts, { onConflict: 'id' });

      if (prodErr) {
        // If FK error, try without FKs
        console.warn('Upsert inicial con FK falló, reintentando con referencias limpias...', prodErr.message);
        const retryProducts = cleanProducts.map((p) => ({ ...p, brand_id: null, category_id: null }));
        const { error: retryProdErr } = await supabase.from('products').upsert(retryProducts, { onConflict: 'id' });
        if (retryProdErr) throw retryProdErr;
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
