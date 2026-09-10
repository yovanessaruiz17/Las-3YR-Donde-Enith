import fs from 'fs';
import path from 'path';
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
  NewsletterSubscriber,
} from '../src/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
} from '../src/data/initialData';

const DATA_DIR = path.join(process.cwd(), 'server-storage');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

export const serverStorage = {
  // ORDERS
  getOrders(): Order[] {
    const orders = readJsonFile<Order[]>('orders.json', []);
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  saveOrder(newOrder: Order): Order {
    const orders = this.getOrders();
    const existingIndex = orders.findIndex(
      (o) => o.id === newOrder.id || (newOrder.order_number && o.order_number === newOrder.order_number)
    );
    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...newOrder, updated_at: new Date().toISOString() };
    } else {
      orders.unshift(newOrder);

      // REDUCE PRODUCT STOCK & AUTO-DEACTIVATE IF STOCK REACHES ZERO
      if (Array.isArray(newOrder.items) && newOrder.items.length > 0) {
        const products = this.getProducts();
        let productsChanged = false;

        for (const item of newOrder.items) {
          const prodIndex = products.findIndex(
            (p) => p.id === item.product_id || (item.product_name && p.name.toLowerCase() === item.product_name.toLowerCase())
          );

          if (prodIndex >= 0) {
            const prod = products[prodIndex];
            const currentStock = typeof prod.stock === 'number' ? prod.stock : 10;
            const qtyPurchased = Math.max(1, Number(item.quantity) || 1);
            const remainingStock = Math.max(0, currentStock - qtyPurchased);

            prod.stock = remainingStock;
            // Solo si se vende esa última unidad y queda en 0 se desactiva; si aún tiene stock queda activo y visible
            if (remainingStock <= 0) {
              prod.active = false;
              console.log(`[INVENTORY] Se vendió la última unidad de "${prod.name}" (${prod.id}) y quedó en 0. Desactivado y ocultado del catálogo.`);
            } else {
              prod.active = true;
            }
            prod.updated_at = new Date().toISOString();
            productsChanged = true;
          }
        }

        if (productsChanged) {
          writeJsonFile('products.json', products);
        }
      }
    }
    writeJsonFile('orders.json', orders);
    return newOrder;
  },

  updateOrderStatus(id: string, status: OrderStatus, note?: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === id || o.order_number === id);
    if (idx === -1) return null;
    orders[idx].status = status;
    orders[idx].updated_at = new Date().toISOString();
    writeJsonFile('orders.json', orders);
    return orders[idx];
  },

  deleteOrder(id: string): boolean {
    const orders = this.getOrders();
    const filtered = orders.filter((o) => o.id !== id && o.order_number !== id);
    writeJsonFile('orders.json', filtered);
    return true;
  },

  syncOrders(incomingOrders: Order[]): Order[] {
    const currentOrders = this.getOrders();
    let hasChanges = false;
    let productsChanged = false;
    const products = this.getProducts();

    for (const incoming of incomingOrders) {
      if (!incoming || (!incoming.id && !incoming.order_number)) continue;
      const exists = currentOrders.some(
        (o) => o.id === incoming.id || (incoming.order_number && o.order_number === incoming.order_number)
      );
      if (!exists) {
        currentOrders.unshift(incoming);
        hasChanges = true;

        // Deduct stock for synced orders
        if (Array.isArray(incoming.items) && incoming.items.length > 0) {
          for (const item of incoming.items) {
            const prodIndex = products.findIndex(
              (p) => p.id === item.product_id || (item.product_name && p.name.toLowerCase() === item.product_name.toLowerCase())
            );
            if (prodIndex >= 0) {
              const prod = products[prodIndex];
              const currentStock = typeof prod.stock === 'number' ? prod.stock : 10;
              const qtyPurchased = Math.max(1, Number(item.quantity) || 1);
              const remainingStock = Math.max(0, currentStock - qtyPurchased);
              prod.stock = remainingStock;
              if (remainingStock <= 0) {
                prod.active = false;
              } else {
                prod.active = true;
              }
              prod.updated_at = new Date().toISOString();
              productsChanged = true;
            }
          }
        }
      }
    }

    if (productsChanged) {
      writeJsonFile('products.json', products);
    }

    if (hasChanges) {
      currentOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      writeJsonFile('orders.json', currentOrders);
    }
    return currentOrders;
  },

  // PRODUCTS
  getProducts(): Product[] {
    const products = readJsonFile<Product[]>('products.json', INITIAL_PRODUCTS);
    let changed = false;

    // REGLA: "los productos que tengan mas de 1 producto esten activados y mostrandose y solo si se vende esa ultima unidad y queda en 0 se desactive"
    for (const prod of products) {
      const stock = typeof prod.stock === 'number' ? prod.stock : 1;
      if (stock > 0 && prod.active === false) {
        prod.active = true;
        changed = true;
      } else if (stock <= 0 && prod.active !== false) {
        prod.active = false;
        changed = true;
      }
    }

    if (changed) {
      writeJsonFile('products.json', products);
    }
    return products;
  },

  saveProduct(product: Product): Product {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === product.id);
    const stock = typeof product.stock === 'number' ? Math.max(0, product.stock) : 1;
    // Si stock >= 1 queda activado y mostrándose; solo si queda en 0 se desactiva
    const finalActive = stock > 0;
    const finalProduct = {
      ...product,
      stock,
      active: finalActive,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      products[idx] = { ...products[idx], ...finalProduct };
    } else {
      products.unshift(finalProduct);
    }
    writeJsonFile('products.json', products);
    return finalProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const existing = products[idx];
    const newStock = typeof updates.stock === 'number' ? Math.max(0, updates.stock) : (existing.stock ?? 1);
    // Si stock >= 1 queda activado; si queda en 0 queda desactivado
    const newActive = newStock > 0 ? (updates.active !== undefined ? updates.active : true) : false;

    products[idx] = {
      ...existing,
      ...updates,
      stock: newStock,
      active: newActive,
      updated_at: new Date().toISOString(),
    };
    writeJsonFile('products.json', products);
    return products[idx];
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    writeJsonFile('products.json', filtered);
    return true;
  },

  // CATEGORIES
  getCategories(): Category[] {
    return readJsonFile<Category[]>('categories.json', INITIAL_CATEGORIES);
  },

  saveCategory(cat: Category): Category {
    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      categories[idx] = { ...categories[idx], ...cat };
    } else {
      categories.push(cat);
    }
    writeJsonFile('categories.json', categories);
    return cat;
  },

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    categories[idx] = { ...categories[idx], ...updates };
    writeJsonFile('categories.json', categories);
    return categories[idx];
  },

  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    writeJsonFile('categories.json', categories.filter((c) => c.id !== id));
    return true;
  },

  // BRANDS
  getBrands(): Brand[] {
    return readJsonFile<Brand[]>('brands.json', INITIAL_BRANDS);
  },

  saveBrand(brand: Brand): Brand {
    const brands = this.getBrands();
    const idx = brands.findIndex((b) => b.id === brand.id);
    if (idx >= 0) {
      brands[idx] = { ...brands[idx], ...brand };
    } else {
      brands.push(brand);
    }
    writeJsonFile('brands.json', brands);
    return brand;
  },

  updateBrand(id: string, updates: Partial<Brand>): Brand | null {
    const brands = this.getBrands();
    const idx = brands.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    brands[idx] = { ...brands[idx], ...updates };
    writeJsonFile('brands.json', brands);
    return brands[idx];
  },

  deleteBrand(id: string): boolean {
    const brands = this.getBrands();
    writeJsonFile('brands.json', brands.filter((b) => b.id !== id));
    return true;
  },

  // BANNERS
  getBanners(): Banner[] {
    return readJsonFile<Banner[]>('banners.json', INITIAL_BANNERS);
  },

  saveBanner(banner: Banner): Banner {
    const banners = this.getBanners();
    const idx = banners.findIndex((b) => b.id === banner.id);
    if (idx >= 0) {
      banners[idx] = { ...banners[idx], ...banner };
    } else {
      banners.push(banner);
    }
    writeJsonFile('banners.json', banners);
    return banner;
  },

  updateBanner(id: string, updates: Partial<Banner>): Banner | null {
    const banners = this.getBanners();
    const idx = banners.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    banners[idx] = { ...banners[idx], ...updates };
    writeJsonFile('banners.json', banners);
    return banners[idx];
  },

  deleteBanner(id: string): boolean {
    const banners = this.getBanners();
    writeJsonFile('banners.json', banners.filter((b) => b.id !== id));
    return true;
  },

  // ANNOUNCEMENTS
  getAnnouncements(): Announcement[] {
    return readJsonFile<Announcement[]>('announcements.json', INITIAL_ANNOUNCEMENTS);
  },

  saveAnnouncement(ann: Announcement): Announcement {
    const list = this.getAnnouncements();
    const idx = list.findIndex((a) => a.id === ann.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...ann };
    } else {
      list.push(ann);
    }
    writeJsonFile('announcements.json', list);
    return ann;
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const list = this.getAnnouncements();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    writeJsonFile('announcements.json', list);
    return list[idx];
  },

  deleteAnnouncement(id: string): boolean {
    const list = this.getAnnouncements();
    writeJsonFile('announcements.json', list.filter((a) => a.id !== id));
    return true;
  },

  // SETTINGS
  getSettings(): StoreSettings {
    return readJsonFile<StoreSettings>('settings.json', INITIAL_SETTINGS);
  },

  updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    writeJsonFile('settings.json', updated);
    return updated;
  },

  // CONTACT MESSAGES
  getMessages(): ContactMessage[] {
    return readJsonFile<ContactMessage[]>('messages.json', []);
  },

  saveMessage(msg: ContactMessage): ContactMessage {
    const msgs = this.getMessages();
    msgs.unshift(msg);
    writeJsonFile('messages.json', msgs);
    return msg;
  },

  markMessageRead(id: string): boolean {
    const msgs = this.getMessages();
    const idx = msgs.findIndex((m) => m.id === id);
    if (idx >= 0) {
      msgs[idx].read = true;
      writeJsonFile('messages.json', msgs);
      return true;
    }
    return false;
  },

  // SUBSCRIBERS
  getSubscribers(): NewsletterSubscriber[] {
    return readJsonFile<NewsletterSubscriber[]>('subscribers.json', []);
  },

  saveSubscriber(email: string): NewsletterSubscriber {
    const subscribers = this.getSubscribers();
    const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;
    const newSub: NewsletterSubscriber = {
      id: 'sub-' + Date.now(),
      email,
      active: true,
      created_at: new Date().toISOString(),
    };
    subscribers.unshift(newSub);
    writeJsonFile('subscribers.json', subscribers);
    return newSub;
  },
};
