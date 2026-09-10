import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { serverStorage } from './server/storage';
import { Order, OrderStatus } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic CORS support so external clients or webhooks can communicate
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Anti-cache headers for all /api endpoints so all devices always get fresh data
  app.use('/api', (req: Request, res: Response, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // ==========================================
  // API ROUTES (MUST COME FIRST BEFORE VITE)
  // ==========================================

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/status', (req: Request, res: Response) => {
    const orders = serverStorage.getOrders();
    const products = serverStorage.getProducts();
    res.json({
      status: 'ok',
      storage: 'server-json',
      ordersCount: orders.length,
      productsCount: products.length,
      supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
    });
  });

  // --- ORDERS ---
  app.get('/api/orders', (req: Request, res: Response) => {
    try {
      const orders = serverStorage.getOrders();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching orders' });
    }
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<Order>;

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = body.order_number || `3YR-${new Date().getFullYear().toString().slice(-2)}${randomNum}`;
      const now = new Date().toISOString();

      // Forgiving fallback so orders are never dropped due to missing optional fields
      const customerName = (body.customer_name || '').trim() || (body.customer_email ? body.customer_email.split('@')[0] : 'Cliente Las 3YR');
      const customerPhone = (body.customer_phone || body.whatsapp || '').trim() || 'No especificado';

      const newOrder: Order = {
        id: body.id || 'ord-' + Date.now(),
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: body.customer_email || '',
        customer_phone: customerPhone,
        whatsapp: body.whatsapp || customerPhone,
        address: body.address || '',
        city: body.city || 'Cartagena',
        department: body.department || 'Bolívar',
        notes: body.notes || '',
        subtotal: Number(body.subtotal) || 0,
        shipping: Number(body.shipping) || 0,
        total: Number(body.total) || 0,
        origin: body.origin || 'Web',
        payment_method: body.payment_method || 'Contraentrega',
        delivery_method: body.delivery_method || 'Envío a domicilio',
        status: (body.status as OrderStatus) || 'Pendiente',
        items: Array.isArray(body.items) ? body.items : [],
        created_at: body.created_at || now,
        updated_at: now,
      };

      const saved = serverStorage.saveOrder(newOrder);
      console.log(`[SERVER] Nuevo pedido recibido y guardado: ${saved.order_number} (${saved.customer_name})`);
      res.status(201).json(saved);
    } catch (err: any) {
      console.error('[SERVER] Error saving order:', err);
      res.status(500).json({ error: err.message || 'Error guardando pedido en el servidor' });
    }
  });

  // Sync orders from client localStorage (e.g. if order was placed offline or on other device)
  app.post('/api/orders/sync', (req: Request, res: Response) => {
    try {
      const { orders } = req.body;
      if (Array.isArray(orders) && orders.length > 0) {
        const updated = serverStorage.syncOrders(orders);
        return res.json({ success: true, count: updated.length, orders: updated });
      }
      res.json({ success: true, count: 0, orders: serverStorage.getOrders() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error syncing orders' });
    }
  });

  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status requerido' });
      }
      const updated = serverStorage.updateOrderStatus(id, status as OrderStatus, note);
      if (!updated) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error updating order' });
    }
  });

  app.delete('/api/orders/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      serverStorage.deleteOrder(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error deleting order' });
    }
  });

  // --- PRODUCTS ---
  app.get('/api/products', (req: Request, res: Response) => {
    try {
      const products = serverStorage.getProducts();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching products' });
    }
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const product = req.body;
      if (!product.name) return res.status(400).json({ error: 'Nombre de producto requerido' });
      const saved = serverStorage.saveProduct({
        ...product,
        id: product.id || 'prod-' + Date.now(),
        created_at: product.created_at || new Date().toISOString(),
      });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error creating product' });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = serverStorage.updateProduct(id, req.body);
      if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error updating product' });
    }
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      serverStorage.deleteProduct(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error deleting product' });
    }
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req: Request, res: Response) => {
    res.json(serverStorage.getCategories());
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const cat = req.body;
    const saved = serverStorage.saveCategory({ ...cat, id: cat.id || 'cat-' + Date.now() });
    res.status(201).json(saved);
  });

  app.put('/api/categories/:id', (req: Request, res: Response) => {
    const updated = serverStorage.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(updated);
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    serverStorage.deleteCategory(req.params.id);
    res.json({ success: true });
  });

  // --- BRANDS ---
  app.get('/api/brands', (req: Request, res: Response) => {
    res.json(serverStorage.getBrands());
  });

  app.post('/api/brands', (req: Request, res: Response) => {
    const brand = req.body;
    const saved = serverStorage.saveBrand({ ...brand, id: brand.id || 'brd-' + Date.now() });
    res.status(201).json(saved);
  });

  app.put('/api/brands/:id', (req: Request, res: Response) => {
    const updated = serverStorage.updateBrand(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json(updated);
  });

  app.delete('/api/brands/:id', (req: Request, res: Response) => {
    serverStorage.deleteBrand(req.params.id);
    res.json({ success: true });
  });

  // --- BANNERS ---
  app.get('/api/banners', (req: Request, res: Response) => {
    res.json(serverStorage.getBanners());
  });

  app.post('/api/banners', (req: Request, res: Response) => {
    const banner = req.body;
    const saved = serverStorage.saveBanner({ ...banner, id: banner.id || 'ban-' + Date.now() });
    res.status(201).json(saved);
  });

  app.put('/api/banners/:id', (req: Request, res: Response) => {
    const updated = serverStorage.updateBanner(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Banner no encontrado' });
    res.json(updated);
  });

  app.delete('/api/banners/:id', (req: Request, res: Response) => {
    serverStorage.deleteBanner(req.params.id);
    res.json({ success: true });
  });

  // --- ANNOUNCEMENTS ---
  app.get('/api/announcements', (req: Request, res: Response) => {
    res.json(serverStorage.getAnnouncements());
  });

  app.post('/api/announcements', (req: Request, res: Response) => {
    const ann = req.body;
    const saved = serverStorage.saveAnnouncement({ ...ann, id: ann.id || 'ann-' + Date.now() });
    res.status(201).json(saved);
  });

  app.put('/api/announcements/:id', (req: Request, res: Response) => {
    const updated = serverStorage.updateAnnouncement(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Anuncio no encontrado' });
    res.json(updated);
  });

  app.delete('/api/announcements/:id', (req: Request, res: Response) => {
    serverStorage.deleteAnnouncement(req.params.id);
    res.json({ success: true });
  });

  // --- SETTINGS ---
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(serverStorage.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const updated = serverStorage.updateSettings(req.body);
    res.json(updated);
  });

  // --- MESSAGES ---
  app.get('/api/messages', (req: Request, res: Response) => {
    res.json(serverStorage.getMessages());
  });

  app.post('/api/messages', (req: Request, res: Response) => {
    const msg = req.body;
    const saved = serverStorage.saveMessage({
      ...msg,
      id: msg.id || 'msg-' + Date.now(),
      created_at: msg.created_at || new Date().toISOString(),
      read: false,
    });
    res.status(201).json(saved);
  });

  app.patch('/api/messages/:id/read', (req: Request, res: Response) => {
    const success = serverStorage.markMessageRead(req.params.id);
    res.json({ success });
  });

  // --- SUBSCRIBERS ---
  app.get('/api/subscribers', (req: Request, res: Response) => {
    res.json(serverStorage.getSubscribers());
  });

  app.post('/api/subscribers', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    const saved = serverStorage.saveSubscriber(email);
    res.status(201).json(saved);
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Tienda Las 3YR ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
