import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Layers,
  Sparkles,
  Settings,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  Database,
  TrendingUp,
  RefreshCw,
  Eye,
  Sliders,
  DollarSign,
  AlertCircle,
  LogOut,
  ShieldCheck,
  QrCode,
  KeyRound,
  Copy,
  Smartphone,
  Users,
  UserPlus,
  UserCheck,
  Lock,
  CheckCircle2,
  FolderPlus,
  Megaphone,
  Tag,
  ArrowUpRight,
  BarChart3,
  Image as ImageIcon,
  Search,
  Filter,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { storeService } from '../services/storeService';
import { totpService } from '../services/totpService';
import { adminAuthService, AdminUserItem } from '../services/adminAuthService';
import { Admin2FALogin } from '../components/admin/Admin2FALogin';
import { Product, Order, Category, Brand, Banner, Announcement, OrderStatus } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { sanitizePlainText, sanitizeEmail, sanitizeUrl } from '../lib/sanitize';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { settings, updateSettings, categories: ctxCategories, brands: ctxBrands, banners: ctxBanners, refreshStore, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<
    'kpis' | 'products' | 'orders' | 'categories' | 'banners' | 'settings' | 'messages' | 'database' | 'security'
  >('kpis');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newsletterEmails, setNewsletterEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories, Brands, Banners & Announcements Admin States
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminBrands, setAdminBrands] = useState<Brand[]>([]);
  const [adminBanners, setAdminBanners] = useState<Banner[]>([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>([]);

  // Search/Filters
  const [productSearch, setProductSearch] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Refs for scrolling
  const productFormRef = useRef<HTMLDivElement>(null);

  // Modals / Editors
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Supabase Testing & Sync states
  const [dbTesting, setDbTesting] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbSyncing, setDbSyncing] = useState(false);
  const [dbSyncResult, setDbSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // 2FA Security Tab States
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [liveCode, setLiveCode] = useState('------');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [testOtpInput, setTestOtpInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Admin Accounts Management States
  const [adminsList, setAdminsList] = useState<AdminUserItem[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);

  const loadAdminsList = async () => {
    setLoadingAdmins(true);
    try {
      const list = await adminAuthService.getAllAdmins();
      setAdminsList(list);
    } catch (err) {
      console.error('Error cargando administradores:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(newAdminEmail);
    const cleanFullName = sanitizePlainText(newAdminFullName);
    if (!cleanEmail.trim() || !cleanEmail.includes('@')) {
      showToast('Ingresa un correo electrónico válido', 'error');
      return;
    }
    if (newAdminPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setSavingAdmin(true);
    try {
      const res = await adminAuthService.createAdminFromDashboard(
        cleanEmail,
        newAdminPassword,
        cleanFullName
      );

      if (res.success) {
        showToast(res.message || '¡Nuevo administrador registrado exitosamente!', 'success');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminFullName('');
        setShowAddAdminModal(false);
        await loadAdminsList();
      } else {
        showToast(res.error || 'Error al registrar administrador', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error registrando administrador', 'error');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (adminId: string, email: string) => {
    if (email.toLowerCase() === user?.email?.toLowerCase()) {
      showToast('No puedes revocar tu propio acceso administrativo', 'error');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas revocar los permisos de administrador a ${email}?`)) {
      return;
    }

    try {
      const res = await adminAuthService.revokeAdmin(adminId, email);
      if (res.success) {
        showToast(`Permisos de administrador revocados para ${email}`, 'info');
        await loadAdminsList();
      } else {
        showToast(res.error || 'Error al revocar permisos', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error revocando administrador', 'error');
    }
  };

  useEffect(() => {
    const updateTicker = async () => {
      try {
        const code = await totpService.getCurrentCode();
        setLiveCode(code);
        setSecondsRemaining(totpService.getSecondsRemaining());
      } catch (e) {
        console.error('Error generating live TOTP:', e);
      }
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const [prods, ords, msgs, emails, cats, brs, bans, anns] = await Promise.all([
      storeService.getProducts({ activeOnly: false }),
      storeService.getOrders(),
      storeService.getContactMessages(),
      storeService.getNewsletterSubscribers(),
      storeService.getCategories(false),
      storeService.getBrands(false),
      storeService.getBanners(false),
      storeService.getAnnouncements(false),
    ]);
    setProducts(prods);
    setOrders(ords);
    setMessages(msgs);
    setNewsletterEmails(emails);
    setAdminCategories(cats);
    setAdminBrands(brs);
    setAdminBanners(bans);
    setAdminAnnouncements(anns);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
      loadAdminsList();
    }
  }, [isAdmin, activeTab]);

  if (!isAdmin) {
    return <Admin2FALogin />;
  }

  // Financial KPIs & Inventory Valuation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelado' ? o.total : 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pendiente').length;

  const totalInventoryValue = products.reduce((sum, p) => {
    const stockQty = Number(p.stock) > 0 ? Number(p.stock) : 1;
    return sum + (Number(p.price) || 0) * stockQty;
  }, 0);

  const totalUnitsInStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const activeProductsCount = products.filter((p) => p.active !== false).length;
  const inactiveProductsCount = products.filter((p) => p.active === false).length;

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const matchBrand = !productBrandFilter || p.brand_name?.toLowerCase() === productBrandFilter.toLowerCase();
      const matchCategory = !productCategoryFilter || p.category_name?.toLowerCase() === productCategoryFilter.toLowerCase();
      const matchStatus =
        productStatusFilter === 'all'
          ? true
          : productStatusFilter === 'active'
          ? p.active !== false
          : p.active === false;

      return matchSearch && matchBrand && matchCategory && matchStatus;
    });
  }, [products, productSearch, productBrandFilter, productCategoryFilter, productStatusFilter]);

  const handleStartEditProduct = (p: Product) => {
    setEditingProduct({ ...p });
    setTimeout(() => {
      if (productFormRef.current) {
        productFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleStartNewProduct = () => {
    setEditingProduct({
      name: '',
      price: 45000,
      active: true,
      featured: false,
      brand_name: adminBrands[0]?.name || 'Natura',
      category_name: adminCategories[0]?.name || 'Belleza',
      main_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      description: '',
    });
    setTimeout(() => {
      if (productFormRef.current) {
        productFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      showToast('Por favor completa el nombre y precio del producto', 'error');
      return;
    }

    try {
      const selectedBrand = adminBrands.find((b) => b.name === editingProduct.brand_name) || adminBrands[0];
      const selectedCategory = adminCategories.find((c) => c.name === editingProduct.category_name) || adminCategories[0];

      const productPayload: any = {
        ...editingProduct,
        name: sanitizePlainText(editingProduct.name),
        description: sanitizePlainText(editingProduct.description || ''),
        main_image: sanitizeUrl(editingProduct.main_image || ''),
        brand_id: selectedBrand?.id || editingProduct.brand_id || null,
        brand_name: sanitizePlainText(selectedBrand?.name || editingProduct.brand_name || 'Natura'),
        category_id: selectedCategory?.id || editingProduct.category_id || null,
        category_name: sanitizePlainText(selectedCategory?.name || editingProduct.category_name || 'Belleza'),
        category_slug: sanitizePlainText(selectedCategory?.slug || editingProduct.category_slug || 'belleza'),
        active: editingProduct.active !== undefined ? Boolean(editingProduct.active) : true,
        featured: Boolean(editingProduct.featured),
        price: Number(editingProduct.price) || 0,
        compare_price: editingProduct.compare_price ? Number(editingProduct.compare_price) : null,
      };

      delete productPayload.is_active;
      delete productPayload.is_featured;

      if (editingProduct.id) {
        await storeService.updateProduct(editingProduct.id, productPayload);
        showToast('Producto actualizado con éxito en la base de datos', 'success');
      } else {
        await storeService.createProduct(productPayload);
        showToast('Nuevo producto guardado con éxito en la base de datos', 'success');
      }
      setEditingProduct(null);
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al guardar el producto: ${err?.message || 'Revisa la conexión de Supabase'}`, 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`¿Estás segura de eliminar "${name}"?`)) {
      await storeService.deleteProduct(id);
      showToast('Producto eliminado', 'info');
      await loadAllData();
      await refreshStore();
    }
  };

  // CATEGORY CRUD HANDLERS
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizePlainText(editingCategory?.name || '');
    if (!editingCategory || !cleanName.trim()) {
      showToast('Ingresa el nombre de la categoría', 'error');
      return;
    }

    try {
      const rawSlug = editingCategory.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const slug = sanitizePlainText(rawSlug);
      const payload: Omit<Category, 'id'> = {
        name: cleanName.trim(),
        slug,
        description: sanitizePlainText(editingCategory.description || ''),
        image_url: sanitizeUrl(editingCategory.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'),
        sort_order: Number(editingCategory.sort_order) || adminCategories.length + 1,
        active: editingCategory.active !== false,
      };

      if (editingCategory.id) {
        await storeService.updateCategory(editingCategory.id, payload);
        showToast('Categoría actualizada con éxito', 'success');
      } else {
        await storeService.createCategory(payload);
        showToast('Nueva categoría creada con éxito', 'success');
      }
      setEditingCategory(null);
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al guardar categoría: ${err?.message || err}`, 'error');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`¿Estás segura de eliminar la categoría "${name}"?`)) {
      try {
        await storeService.deleteCategory(id);
        showToast('Categoría eliminada', 'info');
        await loadAllData();
        await refreshStore();
      } catch (err: any) {
        showToast(`Error al eliminar categoría: ${err?.message || err}`, 'error');
      }
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      await storeService.updateCategory(cat.id, { active: !cat.active });
      showToast(`Categoría "${cat.name}" ahora está ${!cat.active ? 'Activa' : 'Inactiva'}`, 'success');
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al cambiar estado: ${err?.message || err}`, 'error');
    }
  };

  // BRAND CRUD HANDLERS
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizePlainText(editingBrand?.name || '');
    if (!editingBrand || !cleanName.trim()) {
      showToast('Ingresa el nombre de la marca', 'error');
      return;
    }

    try {
      const rawSlug = editingBrand.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const slug = sanitizePlainText(rawSlug);
      const logoUrl = sanitizeUrl(editingBrand.logo_url || editingBrand.image_url || '');
      const payload: Omit<Brand, 'id'> = {
        name: cleanName.trim(),
        slug,
        description: sanitizePlainText(editingBrand.description || ''),
        logo_url: logoUrl,
        image_url: logoUrl,
        sort_order: Number(editingBrand.sort_order) || adminBrands.length + 1,
        active: editingBrand.active !== false,
      };

      if (editingBrand.id) {
        await storeService.updateBrand(editingBrand.id, payload);
        showToast('Marca actualizada con éxito', 'success');
      } else {
        await storeService.createBrand(payload);
        showToast('Nueva marca creada con éxito', 'success');
      }
      setEditingBrand(null);
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al guardar marca: ${err?.message || err}`, 'error');
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (confirm(`¿Estás segura de eliminar la marca "${name}"?`)) {
      try {
        await storeService.deleteBrand(id);
        showToast('Marca eliminada', 'info');
        await loadAllData();
        await refreshStore();
      } catch (err: any) {
        showToast(`Error al eliminar marca: ${err?.message || err}`, 'error');
      }
    }
  };

  const handleToggleBrandActive = async (brand: Brand) => {
    try {
      await storeService.updateBrand(brand.id, { active: !brand.active });
      showToast(`Marca "${brand.name}" ahora está ${!brand.active ? 'Activa' : 'Inactiva'}`, 'success');
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al cambiar estado: ${err?.message || err}`, 'error');
    }
  };

  // BANNER CRUD HANDLERS
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizePlainText(editingBanner?.title || '');
    if (!editingBanner || !cleanTitle.trim()) {
      showToast('Ingresa el título del banner', 'error');
      return;
    }

    try {
      const payload: Omit<Banner, 'id'> = {
        title: cleanTitle.trim(),
        description: sanitizePlainText(editingBanner.description || ''),
        tag: sanitizePlainText(editingBanner.tag || 'Las mejores marcas de catálogo'),
        image_url: sanitizeUrl(editingBanner.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'),
        button_text: sanitizePlainText(editingBanner.button_text || 'EXPLORAR PRODUCTOS'),
        button_url: sanitizePlainText(editingBanner.button_url || '/productos'),
        sort_order: Number(editingBanner.sort_order) || adminBanners.length + 1,
        active: editingBanner.active !== false,
      };

      if (editingBanner.id) {
        await storeService.updateBanner(editingBanner.id, payload);
        showToast('Banner actualizado con éxito', 'success');
      } else {
        await storeService.createBanner(payload);
        showToast('Nuevo banner agregado con éxito', 'success');
      }
      setEditingBanner(null);
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al guardar banner: ${err?.message || err}`, 'error');
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (confirm(`¿Estás segura de eliminar el banner "${title}"?`)) {
      try {
        await storeService.deleteBanner(id);
        showToast('Banner eliminado', 'info');
        await loadAllData();
        await refreshStore();
      } catch (err: any) {
        showToast(`Error al eliminar banner: ${err?.message || err}`, 'error');
      }
    }
  };

  const handleToggleBannerActive = async (ban: Banner) => {
    try {
      await storeService.updateBanner(ban.id, { active: !ban.active });
      showToast(`Banner ahora está ${!ban.active ? 'Activo' : 'Inactivo'}`, 'success');
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al cambiar estado del banner: ${err?.message || err}`, 'error');
    }
  };

  // ANNOUNCEMENT CRUD HANDLERS
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = sanitizePlainText(editingAnnouncement?.message || '');
    if (!editingAnnouncement || !cleanMessage.trim()) {
      showToast('Ingresa el texto del anuncio', 'error');
      return;
    }

    try {
      const payload: Omit<Announcement, 'id'> = {
        message: cleanMessage.trim(),
        icon: sanitizePlainText(editingAnnouncement.icon || 'Sparkles'),
        sort_order: Number(editingAnnouncement.sort_order) || adminAnnouncements.length + 1,
        active: editingAnnouncement.active !== false,
      };

      if (editingAnnouncement.id) {
        await storeService.updateAnnouncement(editingAnnouncement.id, payload);
        showToast('Anuncio actualizado con éxito', 'success');
      } else {
        await storeService.createAnnouncement(payload);
        showToast('Nuevo anuncio agregado con éxito', 'success');
      }
      setEditingAnnouncement(null);
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al guardar anuncio: ${err?.message || err}`, 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('¿Estás segura de eliminar este aviso de la barra superior?')) {
      try {
        await storeService.deleteAnnouncement(id);
        showToast('Aviso eliminado', 'info');
        await loadAllData();
        await refreshStore();
      } catch (err: any) {
        showToast(`Error al eliminar aviso: ${err?.message || err}`, 'error');
      }
    }
  };

  const handleToggleAnnouncementActive = async (ann: Announcement) => {
    try {
      await storeService.updateAnnouncement(ann.id, { active: !ann.active });
      showToast(`Aviso ahora está ${!ann.active ? 'Activo' : 'Inactivo'}`, 'success');
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al cambiar estado del aviso: ${err?.message || err}`, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    await storeService.updateOrderStatus(orderId, newStatus);
    showToast(`Estado del pedido actualizado a "${newStatus}"`, 'success');
    loadAllData();
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Admin Top Navigation */}
      <header className="bg-[#163E2B] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Las 3YR</span>
              <span className="text-[10px] tracking-widest text-[#F48FB1] uppercase font-sans font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </Link>

            {/* Supabase status indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] text-[#E8F0EA]">
              <Database className="w-3.5 h-3.5 text-[#F48FB1]" />
              <span>
                {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Local Activo'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="text-xs font-semibold text-[#B7D1C1] hover:text-white flex items-center gap-1 transition"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </Link>
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="text-xs font-semibold text-rose-300 hover:text-rose-100 flex items-center gap-1 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {[
            { id: 'kpis', label: 'Resumen & Métricas', icon: TrendingUp },
            { id: 'orders', label: `Pedidos (${orders.length})`, icon: ShoppingCart },
            { id: 'products', label: `Productos (${products.length})`, icon: Package },
            { id: 'categories', label: 'Categorías & Marcas', icon: Layers },
            { id: 'banners', label: 'Banners & Anuncios', icon: Sparkles },
            { id: 'settings', label: 'Configuración Tienda', icon: Settings },
            { id: 'messages', label: `Mensajes (${messages.length})`, icon: MessageSquare },
            { id: 'database', label: 'Supabase & Netlify', icon: Database },
            { id: 'security', label: 'Seguridad & Administradores', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-[#163E2B] text-white shadow-md'
                    : 'bg-white text-[#2B4734] border border-[#EBE3D7] hover:bg-[#FAF8F5]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: RESUMEN / KPIS */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            {/* Top Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Valor en Inventario / Venta */}
              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Total en Venta (Inventario)
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#EAF2ED] text-[#163E2B] flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#163E2B] mt-2">
                  {storeService.formatCurrency(totalInventoryValue)}
                </p>
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold mt-1">
                  <span>{totalUnitsInStock} unidades en stock</span>
                  <span className="text-[#163E2B] font-bold">{activeProductsCount} activos</span>
                </div>
              </div>

              {/* Total Facturación en Pedidos */}
              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Facturación Pedidos
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#FAF0F4] text-[#D83173] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#D83173] mt-2">
                  {storeService.formatCurrency(totalRevenue)}
                </p>
                <span className="text-[11px] text-[#25D366] font-semibold mt-1 block">
                  {orders.length} pedidos registrados
                </span>
              </div>

              {/* Pedidos Pendientes */}
              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Pedidos Pendientes
                  </span>
                  <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
                  {pendingOrders}
                </p>
                <span className="text-[11px] text-stone-400 font-semibold mt-1 block">
                  Por despachar o confirmar
                </span>
              </div>

              {/* Total Productos */}
              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Total Productos
                  </span>
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#163E2B] mt-2">
                  {products.length}
                </p>
                <span className="text-[11px] text-stone-500 font-semibold mt-1 block">
                  {adminCategories.length} categorías • {adminBrands.length} marcas
                </span>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                    Últimos Pedidos Registrados
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#D83173] hover:underline cursor-pointer"
                  >
                    Ver todos ({orders.length}) →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">No hay pedidos registrados aún.</p>
                ) : (
                  <div className="divide-y divide-[#F0EAE1]">
                    {orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-[#163E2B]">{ord.customer_name}</p>
                          <p className="text-stone-500">
                            {ord.order_number} • {ord.items.length} productos • {ord.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#D83173]">
                            {storeService.formatCurrency(ord.total)}
                          </p>
                          <span className="bg-[#E9F3EC] text-[#163E2B] px-2 py-0.5 rounded text-[10px] font-bold">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                  Acciones Rápidas
                </h3>
                <button
                  onClick={() => {
                    handleStartNewProduct();
                    setActiveTab('products');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#C52B66] transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Producto</span>
                </button>

                <button
                  onClick={() => {
                    setEditingCategory({ name: '', slug: '', description: '', image_url: '', active: true, sort_order: adminCategories.length + 1 });
                    setActiveTab('categories');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#163E2B] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#0F2B1E] transition cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Crear Nueva Categoría</span>
                </button>

                <button
                  onClick={() => {
                    setEditingBrand({ name: '', slug: '', description: '', logo_url: '', active: true, sort_order: adminBrands.length + 1 });
                    setActiveTab('categories');
                  }}
                  className="w-full py-2.5 rounded-2xl border border-[#E4DDD3] bg-white text-[#163E2B] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>Crear Nueva Marca</span>
                </button>

                <button
                  onClick={() => setActiveTab('banners')}
                  className="w-full py-2.5 rounded-2xl border border-[#E4DDD3] bg-[#FAF8F5] text-[#163E2B] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#D83173]" />
                  <span>Gestionar Banners y Publicidad</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#163E2B]">
                Gestión de Pedidos
              </h2>
              <button
                onClick={loadAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EFE9E1] text-xs text-[#163E2B] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE9E1] text-stone-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Pedido</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Ciudad / Dirección</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Método</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 font-mono font-bold text-[#163E2B]">
                        {ord.order_number}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-[#163E2B]">{ord.customer_name}</p>
                        <p className="text-stone-500 text-[11px]">{ord.whatsapp || ord.customer_phone}</p>
                      </td>
                      <td className="py-3 text-stone-600">
                        <p>{ord.city}</p>
                        <p className="text-[11px] text-stone-400">{ord.address}</p>
                      </td>
                      <td className="py-3 font-bold text-[#163E2B]">
                        {storeService.formatCurrency(ord.total)}
                      </td>
                      <td className="py-3 text-stone-600">{ord.payment_method}</td>
                      <td className="py-3">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-white border border-[#E4DDD3] rounded-lg px-2 py-1 text-xs font-semibold text-[#163E2B] outline-none cursor-pointer"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="En camino">En camino</option>
                          <option value="Entregado">Entregado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <a
                          href={`https://wa.me/${(ord.whatsapp || ord.customer_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `¡Hola ${ord.customer_name}! Te saludamos de Las 3YR - Donde Enith respecto a tu pedido ${ord.order_number}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] text-white text-[11px] font-bold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
            {/* Top Inventory Header Summary */}
            <div className="bg-[#FAF8F5] border border-[#EBE1D5] rounded-2xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Productos</span>
                <p className="text-xl sm:text-2xl font-black text-[#163E2B]">{products.length}</p>
                <span className="text-[11px] text-stone-500">{activeProductsCount} activos • {inactiveProductsCount} inactivos</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Unidades en Stock</span>
                <p className="text-xl sm:text-2xl font-black text-[#163E2B]">{totalUnitsInStock}</p>
                <span className="text-[11px] text-stone-500">Unidades físicas totales</span>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Valor Total en Venta (Inventario)</span>
                <p className="text-xl sm:text-2xl font-black text-[#163E2B]">{storeService.formatCurrency(totalInventoryValue)}</p>
                <span className="text-[11px] text-[#25D366] font-semibold">Calculado según precio y stock de catálogo</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#163E2B]">
                  Catálogo de Productos ({products.length})
                </h2>
                <p className="text-xs text-stone-500">Agrega, edita o actualiza precios de catálogo.</p>
              </div>

              <button
                onClick={handleStartNewProduct}
                className="px-5 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Product Edit / Add Form (Anchored with ref for auto-scroll) */}
            {editingProduct && (
              <div
                ref={productFormRef}
                id="admin-product-form"
                className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#E4DDD3] space-y-4 animate-in fade-in duration-150 scroll-mt-6 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D83173]/10 text-[#D83173] flex items-center justify-center font-bold">
                      {editingProduct.id ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                        {editingProduct.id ? 'Editar Producto' : 'Crear Nuevo Producto'}
                      </h3>
                      {editingProduct.id && (
                        <p className="text-[11px] text-stone-500 font-mono">ID: {editingProduct.id}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-lg hover:bg-stone-200 transition"
                    title="Cerrar formulario"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Nombre del Producto *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Ej. Ekos Maracuyá Frescor"
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none focus:border-[#D83173]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Marca</label>
                    <select
                      value={editingProduct.brand_name || adminBrands[0]?.name || 'Natura'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand_name: e.target.value })}
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none cursor-pointer"
                    >
                      {adminBrands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Categoría</label>
                    <select
                      value={editingProduct.category_name || adminCategories[0]?.name || 'Belleza'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category_name: e.target.value })}
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none cursor-pointer"
                    >
                      {adminCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Precio Actual (COP) *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Precio Anterior / Comparación</label>
                    <input
                      type="number"
                      value={editingProduct.compare_price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, compare_price: Number(e.target.value) })}
                      placeholder="Ej. 99000 (deja vacío si no hay descuento)"
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Stock / Unidades Disponibles</label>
                    <input
                      type="number"
                      value={editingProduct.stock || 1}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      placeholder="1"
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">URL de Imagen Principal</label>
                    <input
                      type="url"
                      value={editingProduct.main_image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, main_image: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Descripción</label>
                    <textarea
                      rows={3}
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-6 sm:col-span-2 bg-white p-3.5 rounded-xl border border-[#E4DDD3]">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.active !== false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                        className="rounded text-[#163E2B] focus:ring-0"
                      />
                      <span>Producto Activo en Tienda (Visible para clientes)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.featured)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                        className="rounded text-[#D83173] focus:ring-0"
                      />
                      <span>Destacado en Inicio</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#C52B66] cursor-pointer"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Product Search & Filters for Salesperson / Admin */}
            <div className="bg-[#FAF8F5] border border-[#E4DDD3] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                {/* Search Bar Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(sanitizePlainText(e.target.value))}
                    placeholder="Buscar producto por nombre, marca o categoría..."
                    className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2.5 pl-10 pr-9 outline-none focus:border-[#D83173] text-[#163E2B] transition placeholder:text-stone-400 font-medium"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={productBrandFilter}
                    onChange={(e) => setProductBrandFilter(e.target.value)}
                    className="bg-white border border-[#E4DDD3] rounded-xl text-xs font-semibold text-[#163E2B] py-2 px-3 outline-none focus:border-[#D83173] cursor-pointer"
                  >
                    <option value="">Todas las marcas</option>
                    {adminBrands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-white border border-[#E4DDD3] rounded-xl text-xs font-semibold text-[#163E2B] py-2 px-3 outline-none focus:border-[#D83173] cursor-pointer"
                  >
                    <option value="">Todas las categorías</option>
                    {adminCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value as any)}
                    className="bg-white border border-[#E4DDD3] rounded-xl text-xs font-semibold text-[#163E2B] py-2 px-3 outline-none focus:border-[#D83173] cursor-pointer"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo Activos</option>
                    <option value="inactive">Solo Inactivos</option>
                  </select>

                  {(productSearch || productBrandFilter || productCategoryFilter || productStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch('');
                        setProductBrandFilter('');
                        setProductCategoryFilter('');
                        setProductStatusFilter('all');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Status information footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-medium px-1 gap-2 pt-1 border-t border-[#EFE9E1]">
                <span>
                  Mostrando <strong className="text-[#163E2B]">{filteredProducts.length}</strong> de <strong className="text-[#163E2B]">{products.length}</strong> productos en inventario
                </span>
                {productSearch && (
                  <span className="text-[#D83173] font-semibold bg-[#FAF0F4] px-2 py-0.5 rounded">
                    Filtrando por: "{productSearch}"
                  </span>
                )}
              </div>
            </div>

            {/* Products Table or Empty Search Results */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-[#E4DDD3] rounded-2xl bg-[#FAF8F5]">
                <Search className="w-10 h-10 text-stone-400 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-bold text-[#163E2B]">No se encontraron productos</p>
                <p className="text-xs text-stone-500 mt-1 mb-4 max-w-sm mx-auto">
                  {productSearch
                    ? `No hay ningún producto que coincida con "${productSearch}". Verifica la ortografía o intenta buscar por otra palabra clave.`
                    : 'No hay productos que cumplan con los filtros seleccionados.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProductSearch('');
                    setProductBrandFilter('');
                    setProductCategoryFilter('');
                    setProductStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-[#D83173] text-white text-xs font-bold rounded-xl hover:bg-[#C52B66] cursor-pointer shadow-xs"
                >
                  Restablecer búsqueda
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EFE9E1] text-stone-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Foto</th>
                      <th className="pb-3">Producto</th>
                      <th className="pb-3">Marca / Categoría</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3">Precio</th>
                      <th className="pb-3">Estado</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE1]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-2.5">
                          <img
                            src={p.main_image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[#EFE9E1]"
                          />
                        </td>
                        <td className="py-2.5 font-bold text-[#163E2B]">
                          {p.name}
                        </td>
                        <td className="py-2.5 text-stone-600">
                          <span className="font-semibold text-[#163E2B]">{p.brand_name}</span> • {p.category_name}
                        </td>
                        <td className="py-2.5 font-semibold text-stone-600">
                          {p.stock || 1} un.
                        </td>
                        <td className="py-2.5 font-bold text-[#163E2B]">
                          {storeService.formatCurrency(p.price)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.active !== false
                                ? 'bg-[#E9F3EC] text-[#163E2B]'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {p.active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right space-x-2">
                          <button
                            onClick={() => handleStartEditProduct(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4DDD3] bg-white text-[#163E2B] hover:bg-[#FAF8F5] hover:border-[#D83173] hover:text-[#D83173] font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                            title="Editar este producto (desplaza al formulario arriba)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CATEGORIAS & MARCAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SECCIÓN CATEGORÍAS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE9E1] shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#163E2B] flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-[#163E2B]" />
                    <span>Categorías ({adminCategories.length})</span>
                  </h2>
                  <p className="text-[11px] text-stone-500">Organiza las secciones y navegación de la tienda</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCategory({
                      name: '',
                      slug: '',
                      description: '',
                      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
                      sort_order: adminCategories.length + 1,
                      active: true,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#163E2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0F2B1E] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Categoría</span>
                </button>
              </div>

              {/* Category search */}
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(sanitizePlainText(e.target.value))}
                placeholder="Buscar categoría..."
                className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
              />

              {/* Categories list */}
              <div className="divide-y divide-[#F0EAE1] max-h-[500px] overflow-y-auto pr-1">
                {adminCategories
                  .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.slug.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'}
                          alt={c.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#EBE1D5]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#163E2B]">{c.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                c.active !== false ? 'bg-[#E9F3EC] text-[#163E2B]' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {c.active !== false ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono">/{c.slug}</span>
                          {c.description && <p className="text-[11px] text-stone-500 line-clamp-1">{c.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryActive(c)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                            c.active !== false
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'border-stone-200 text-stone-400 bg-stone-50 hover:bg-stone-100'
                          }`}
                          title={c.active !== false ? 'Desactivar' : 'Activar'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(c)}
                          className="p-1.5 rounded-lg border border-[#E4DDD3] text-[#163E2B] hover:bg-[#FAF8F5] cursor-pointer"
                          title="Editar categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* SECCIÓN MARCAS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE9E1] shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#163E2B] flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#D83173]" />
                    <span>Marcas de Catálogo ({adminBrands.length})</span>
                  </h2>
                  <p className="text-[11px] text-stone-500">Natura, Avon, Yanbal, Ésika, Leonisa, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBrand({
                      name: '',
                      slug: '',
                      description: '',
                      logo_url: '',
                      sort_order: adminBrands.length + 1,
                      active: true,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Marca</span>
                </button>
              </div>

              {/* Brand search */}
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Buscar marca..."
                className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
              />

              {/* Brands list */}
              <div className="divide-y divide-[#F0EAE1] max-h-[500px] overflow-y-auto pr-1">
                {adminBrands
                  .filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()) || b.slug.toLowerCase().includes(brandSearch.toLowerCase()))
                  .map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#EBE1D5] flex items-center justify-center font-bold text-[#163E2B] text-xs">
                          {b.logo_url || b.image_url ? (
                            <img src={b.logo_url || b.image_url} alt="" className="w-full h-full object-contain rounded-xl p-1" />
                          ) : (
                            b.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#163E2B]">{b.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                b.active !== false ? 'bg-[#E9F3EC] text-[#163E2B]' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {b.active !== false ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono">slug: {b.slug}</span>
                          {b.description && <p className="text-[11px] text-stone-500 line-clamp-1">{b.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleBrandActive(b)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                            b.active !== false
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'border-stone-200 text-stone-400 bg-stone-50 hover:bg-stone-100'
                          }`}
                          title={b.active !== false ? 'Desactivar' : 'Activar'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBrand(b)}
                          className="p-1.5 rounded-lg border border-[#E4DDD3] text-[#163E2B] hover:bg-[#FAF8F5] cursor-pointer"
                          title="Editar marca"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(b.id, b.name)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar marca"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BANNERS & PUBLICIDAD */}
        {activeTab === 'banners' && (
          <div className="space-y-8">
            {/* Introductory info card */}
            <div className="bg-[#163E2B] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-[#F48FB1] text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  <span>Publicidad y Promociones</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold">
                  Banners Hero y Barra Superior de Anuncios
                </h2>
                <p className="text-xs text-[#C5DEC8] leading-relaxed">
                  Activa, edita o crea nuevas campañas publicitarias para la página de inicio. El banner principal y la barra de anuncios rotan automáticamente para destacar tus ofertas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingBanner({
                      title: 'Descubre la Belleza que Hay en Ti',
                      tag: 'Ofertas Exclusivas',
                      description: 'Perfumería fina, cuidado facial y cosméticos de catálogo con entrega directa.',
                      button_text: 'VER OFERTAS',
                      button_url: '/ofertas',
                      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
                      sort_order: adminBanners.length + 1,
                      active: true,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#D83173] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#C52B66] transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Banner Hero</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 1: BANNERS HERO PRINCIPALES */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#163E2B] flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#163E2B]" />
                    <span>Banners Principales de la Portada ({adminBanners.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Se muestran en el carrusel de la página de inicio. Puedes activar o desactivar banners según tus promociones actuales.
                  </p>
                </div>
              </div>

              {/* Grid of Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminBanners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col ${
                      banner.active !== false ? 'border-[#D9E6DC] bg-[#FAF8F5]' : 'border-stone-200 bg-stone-50 opacity-75'
                    }`}
                  >
                    {/* Banner Image Preview */}
                    <div className="relative h-44 w-full bg-stone-200 overflow-hidden group">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F48FB1] bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded w-fit mb-1">
                          {banner.tag || 'Promoción'}
                        </span>
                        <h4 className="font-serif font-bold text-sm line-clamp-1">{banner.title}</h4>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                            banner.active !== false ? 'bg-emerald-500 text-white' : 'bg-stone-700 text-stone-200'
                          }`}
                        >
                          {banner.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    {/* Banner Info & Actions */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1 text-xs">
                        <p className="text-stone-600 line-clamp-2 text-[11px]">{banner.description}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="bg-white border border-[#EBE1D5] px-2 py-0.5 rounded text-[10px] font-mono text-stone-600 font-bold">
                            Botón: "{banner.button_text || 'VER MÁS'}" → {banner.button_url || '/'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#EBE1D5] pt-3">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(banner)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                            banner.active !== false
                              ? 'bg-[#EAF2ED] text-[#163E2B] hover:bg-[#D5E6DA]'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{banner.active !== false ? 'Desactivar' : 'Activar Banner'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBanner(banner)}
                            className="p-2 rounded-xl border border-[#E4DDD3] bg-white text-[#163E2B] hover:bg-[#FAF8F5] transition cursor-pointer"
                            title="Editar banner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(banner.id, banner.title)}
                            className="p-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Eliminar banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 2: CINTA DE ANUNCIOS SUPERIOR (ANNOUNCEMENT BAR) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#163E2B] flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#D83173]" />
                    <span>Barra Superior de Avisos ({adminAnnouncements.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Mensajes y anuncios que rotan en la parte superior del encabezado de la tienda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAnnouncement({
                      message: '🚚 ¡Envíos gratis por compras superiores a $150.000!',
                      icon: 'Sparkles',
                      sort_order: adminAnnouncements.length + 1,
                      active: true,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#163E2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0F2B1E] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Aviso</span>
                </button>
              </div>

              {/* Announcement List */}
              <div className="divide-y divide-[#F0EAE1]">
                {adminAnnouncements.map((ann) => (
                  <div key={ann.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FAF0F4] text-[#D83173] flex items-center justify-center font-bold text-xs shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#163E2B] text-xs sm:text-sm">{ann.message}</p>
                        <span className="text-[10px] text-stone-400">Orden de rotación: #{ann.sort_order || 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncementActive(ann)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          ann.active !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                        }`}
                      >
                        {ann.active !== false ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAnnouncement(ann)}
                        className="p-1.5 rounded-lg border border-[#E4DDD3] text-[#163E2B] hover:bg-[#FAF8F5] cursor-pointer"
                        title="Editar aviso"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Eliminar aviso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONFIGURACIÓN TIENDA */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs max-w-2xl mx-auto space-y-6">
            <h2 className="font-serif text-xl font-bold text-[#163E2B]">
              Configuración de "Las 3YR - Donde Enith"
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#163E2B] mb-1">
                  Número de WhatsApp para Pedidos *
                </label>
                <input
                  type="text"
                  value={settings.whatsapp || ''}
                  onChange={(e) => updateSettings({ whatsapp: sanitizePlainText(e.target.value) })}
                  placeholder="+57 324 445 6597"
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#163E2B] mb-1">
                  Costo de Envío Estándar (COP)
                </label>
                <input
                  type="number"
                  value={settings.shipping_cost || 0}
                  onChange={(e) => updateSettings({ shipping_cost: Number(e.target.value) })}
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#163E2B] mb-1">
                  Monto Mínimo para Envío Gratis (COP)
                </label>
                <input
                  type="number"
                  value={settings.free_shipping_from || 0}
                  onChange={(e) => updateSettings({ free_shipping_from: Number(e.target.value) })}
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#163E2B] mb-1">
                  Texto de la Barra de Anuncios Superior
                </label>
                <input
                  type="text"
                  value={settings.announcement_text || ''}
                  onChange={(e) => updateSettings({ announcement_text: sanitizePlainText(e.target.value) })}
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => showToast('Configuración guardada correctamente', 'success')}
                  className="px-6 py-2.5 rounded-full bg-[#163E2B] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MENSAJES & SUSCRIPTORES */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
            <h2 className="font-serif text-xl font-bold text-[#163E2B]">
              Consultas y Correos Recibidos
            </h2>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Mensajes de Contacto ({messages.length})
              </h3>
              {messages.length === 0 ? (
                <p className="text-xs text-stone-400">No hay mensajes recientes.</p>
              ) : (
                <div className="divide-y divide-[#F0EAE1]">
                  {messages.map((m) => (
                    <div key={m.id} className="py-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#163E2B]">{m.name}</span>
                        <span className="text-stone-400 text-[10px]">
                          {new Date(m.created_at).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="text-stone-500">{m.email} {m.phone && `• ${m.phone}`}</p>
                      <p className="text-stone-700 bg-[#FAF8F5] p-3 rounded-xl border border-[#EFE9E1]">
                        {m.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#F0EAE1]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                Suscriptores al Newsletter ({newsletterEmails.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {newsletterEmails.map((email, idx) => (
                  <span
                    key={idx}
                    className="bg-[#FAF8F5] border border-[#EFE9E1] px-3 py-1 rounded-full text-xs text-[#163E2B] font-mono"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SUPABASE & DESPLIEGUE NETLIFY */}
        {activeTab === 'database' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#163E2B] text-xs font-bold uppercase tracking-wider mb-2">
                    <Database className="w-3.5 h-3.5" />
                    <span>Integración de Base de Datos Cloud</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#163E2B]">
                    Supabase PostgreSQL & Despliegue Netlify
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Conecta una base de datos real en la nube para persistir productos, pedidos y clientes en tiempo real.
                  </p>
                </div>

                {/* Connection Status Badge */}
                <div className={`p-4 rounded-2xl border text-center shrink-0 ${
                  isSupabaseConfigured
                    ? 'bg-[#E9F3EC] border-[#B7D1C1] text-[#163E2B]'
                    : 'bg-[#FAF6F0] border-[#E8DCCB] text-[#8C6D46]'
                }`}>
                  <div className="flex items-center justify-center gap-2 font-bold text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{isSupabaseConfigured ? 'Supabase Activo & Conectado' : 'Modo Local (LocalStorage)'}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    {isSupabaseConfigured
                      ? 'Las operaciones se sincronizan con Supabase Cloud'
                      : 'Listo para conectar con variables de entorno'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F0EAE1]">
                <button
                  onClick={async () => {
                    setDbTesting(true);
                    setDbTestResult(null);
                    const res = await storeService.testSupabaseConnection();
                    setDbTesting(false);
                    setDbTestResult(res);
                    if (res.success) {
                      showToast('Conexión con Supabase verificada con éxito', 'success');
                    } else {
                      showToast('Error al verificar conexión con Supabase', 'error');
                    }
                  }}
                  disabled={dbTesting}
                  className="px-4 py-2.5 rounded-xl bg-[#163E2B] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#123323] transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? 'animate-spin' : ''}`} />
                  <span>{dbTesting ? 'Comprobando conexión...' : 'Probar Conexión con Supabase'}</span>
                </button>

                {isSupabaseConfigured && (
                  <button
                    onClick={async () => {
                      if (confirm('¿Deseas poblar/sincronizar el catálogo inicial (productos, marcas, categorías) en tu base de datos Supabase?')) {
                        setDbSyncing(true);
                        setDbSyncResult(null);
                        const res = await storeService.seedInitialDataToSupabase();
                        setDbSyncing(false);
                        setDbSyncResult(res);
                        if (res.success) {
                          showToast('Catálogo inicial cargado en Supabase', 'success');
                          loadAllData();
                        } else {
                          showToast('Error al cargar datos en Supabase', 'error');
                        }
                      }
                    }}
                    disabled={dbSyncing}
                    className="px-4 py-2.5 rounded-xl bg-[#D83173] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#B7245E] transition disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${dbSyncing ? 'animate-spin' : ''}`} />
                    <span>{dbSyncing ? 'Sincronizando catálogo...' : 'Poblar Catálogo Inicial a Supabase'}</span>
                  </button>
                )}
              </div>

              {/* Test Result Message */}
              {dbTestResult && (
                <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  dbTestResult.success
                    ? 'bg-[#E9F3EC] border-[#B7D1C1] text-[#163E2B]'
                    : 'bg-[#FFF5F7] border-[#FAD0DE] text-[#901D4B]'
                }`}>
                  <div className="flex items-start gap-2">
                    {dbTestResult.success ? (
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{dbTestResult.message}</span>
                  </div>
                </div>
              )}

              {/* Sync Result Message */}
              {dbSyncResult && (
                <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  dbSyncResult.success
                    ? 'bg-[#E9F3EC] border-[#B7D1C1] text-[#163E2B]'
                    : 'bg-[#FFF5F7] border-[#FAD0DE] text-[#901D4B]'
                }`}>
                  <div className="flex items-start gap-2">
                    {dbSyncResult.success ? (
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">{dbSyncResult.message}</span>
                      {!dbSyncResult.success && (
                        <p className="mt-1 text-[11px] text-stone-600">
                          Si el mensaje dice <em>"new row violates row-level security policy"</em>, copia y ejecuta el script de permisos RLS en el SQL Editor de Supabase (abajo indicado).
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* RLS Policy Quick Fix Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FFE082] text-xs text-[#5D4037] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#E65100]">
                  <AlertCircle className="w-4 h-4" />
                  <span>¿Tienes el error "row-level security policy"?</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Supabase requiere que las políticas de seguridad (RLS) permitan guardar datos con la clave pública <strong>anon</strong>. Para corregirlo en 1 minuto:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      const sqlScript = `-- Ejecutar en Supabase SQL Editor:
CREATE POLICY "Allow all categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all product_images" ON product_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all offers" ON offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all newsletter" ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contact" ON contact_messages FOR ALL USING (true) WITH CHECK (true);`;
                      navigator.clipboard.writeText(sqlScript);
                      showToast('¡Script SQL copiado al portapapeles! Pégalo en el SQL Editor de Supabase y dale Run.', 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#E65100] hover:bg-[#D84315] text-white text-[11px] font-bold cursor-pointer transition shadow-2xs"
                  >
                    📋 Copiar Script SQL de Desbloqueo RLS
                  </button>
                  <span className="text-[11px] text-stone-500">
                    Luego ve al <strong>SQL Editor</strong> de Supabase, pégalo y presiona <strong>Run</strong>.
                  </span>
                </div>
              </div>

              {/* Email Not Confirmed Quick Solution Card */}
              <div className="p-4 rounded-2xl bg-[#EBF3FF] border border-[#BFDBFE] text-xs text-[#1E3A8A] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#1D4ED8]">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                  <span>¿Compradores con error "Email not confirmed" al registrarse?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#1E40AF]">
                  Para que cualquier cliente o comprador pueda registrarse e iniciar sesión de inmediato sin tener que verificar un enlace en su bandeja de entrada:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#1E3A8A] font-medium bg-white/70 p-3 rounded-xl border border-[#DBEAFE]">
                  <li>Entra a tu panel en <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="font-bold underline text-[#2563EB]">supabase.com</a>.</li>
                  <li>Ve a <strong>Authentication</strong> (icono de candado / usuarios) en el menú lateral izquierdo.</li>
                  <li>Haz clic en <strong>Providers</strong> y luego abre <strong>Email</strong>.</li>
                  <li>Desactiva el interruptor <strong>"Confirm email"</strong> (déjalo en <strong>OFF / Desactivado</strong>) y haz clic en <strong>Save</strong>.</li>
                </ol>
                <p className="text-[10px] text-emerald-800 font-semibold">
                  ✓ Con esto, todos los usuarios que se registren en tu tienda entrarán directamente a su cuenta sin ningún bloqueo.
                </p>
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Supabase Setup */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE9E1] shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E9F3EC] text-[#163E2B] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    Paso 1: Configurar Supabase
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
                  <p>
                    1. Entra a <a href="https://supabase.com/" target="_blank" rel="noreferrer" className="text-[#D83173] font-bold hover:underline">supabase.com</a> y crea un nuevo proyecto.
                  </p>
                  <p>
                    2. En el menú lateral entra al <strong>SQL Editor</strong>, abre el archivo <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E4DDD3] font-mono text-[11px]">supabase-schema.sql</code> de este repositorio, pégalo y haz clic en <strong>Run</strong>.
                  </p>
                  <p>
                    3. Ve a <strong>Project Settings → API</strong> y copia tu <strong>Project URL</strong> y tu clave <strong>anon / public</strong>.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EBE3D7] space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Variables requeridas:
                  </span>
                  <code className="text-[11px] font-mono text-[#163E2B] block select-all">
                    VITE_SUPABASE_URL=https://tu-proyecto.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=tu-clave-anon
                  </code>
                </div>
              </div>

              {/* Card 2: Netlify & GitHub Deploy */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE9E1] shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] text-[#D83173] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    Paso 2: Montar a Netlify por GitHub
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
                  <p>
                    1. Sube tu código a un repositorio en <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-[#D83173] font-bold hover:underline">GitHub</a>:
                  </p>
                  <pre className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D7] font-mono text-[10px] text-[#163E2B] overflow-x-auto">
git add .
git commit -m "deploy Las 3YR"
git push origin main</pre>
                  <p>
                    2. En <a href="https://www.netlify.com/" target="_blank" rel="noreferrer" className="text-[#D83173] font-bold hover:underline">Netlify</a> haz clic en <strong>Add new site → Import from GitHub</strong> y selecciona tu repositorio.
                  </p>
                  <p>
                    3. En <strong>Site configuration → Environment variables</strong> añade <code className="bg-[#FAF8F5] px-1 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code> y <code className="bg-[#FAF8F5] px-1 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    ✓ El archivo <code className="font-mono">netlify.toml</code> y las reglas de redirección SPA ya están configurados en el proyecto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SEGURIDAD 2FA & AUTHENTICATOR */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Main Security Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#163E2B] text-xs font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Doble Factor de Autenticación Activo</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#163E2B]">
                    Configuración de Seguridad 2FA
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    El acceso al panel está protegido mediante código temporal dinámico (TOTP) sincronizado con tu aplicación Authenticator.
                  </p>
                </div>

                {/* Status Badge */}
                <div className="bg-[#E9F3EC] border border-[#B7D1C1] text-[#163E2B] p-4 rounded-2xl text-center shrink-0">
                  <div className="flex items-center justify-center gap-2 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Protección 2FA Activada</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Requiere correo + Authenticator
                  </p>
                </div>
              </div>

              {/* Current Authenticator Code & QR Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F0EAE1]">
                {/* Left: QR Code & Setup */}
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#F0EAE1] space-y-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#D83173]" />
                    <h3 className="font-serif font-bold text-[#163E2B] text-sm">
                      Código QR para Vincular Nuevos Dispositivos
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200 shrink-0">
                      <QRCodeSVG
                        value={totpService.getOtpAuthUri(user?.email || 'enith@las3yr.com')}
                        size={130}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="space-y-2 text-xs text-stone-600 text-left">
                      <p className="text-[11px] leading-relaxed">
                        Escanea este código con <strong>Google Authenticator</strong> o <strong>Microsoft Authenticator</strong> en tu celular.
                      </p>
                      <div>
                        <span className="text-[10px] text-stone-400 block mb-0.5">Clave Secreta Manual:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded-lg border border-stone-200 text-[#163E2B] select-all max-w-[130px] truncate">
                            {totpService.getSecret()}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(totpService.getSecret());
                              setCopiedSecret(true);
                              showToast('Clave copiada al portapapeles', 'success');
                              setTimeout(() => setCopiedSecret(false), 3000);
                            }}
                            className="p-1 text-stone-500 hover:text-[#163E2B] hover:bg-white rounded-md border border-stone-200 transition text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedSecret ? 'Copiada' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Rolling PIN & Test */}
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#F0EAE1] space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#163E2B]" />
                        <h3 className="font-serif font-bold text-[#163E2B] text-sm">
                          Código Actual en Vivo
                        </h3>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        {secondsRemaining}s restantes
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200 text-center space-y-1">
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold">
                        PIN Generado por el Servidor
                      </span>
                      <span className="font-mono font-black text-3xl text-[#163E2B] tracking-[0.3em] block">
                        {liveCode}
                      </span>
                      {/* Progress bar */}
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-[#25D366] h-full transition-all duration-1000 ease-linear"
                          style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification Quick Test */}
                  <div className="space-y-2 pt-2 border-t border-[#F0EAE1]">
                    <label className="block text-[11px] font-bold text-[#163E2B]">
                      Probar código de tu celular:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={testOtpInput}
                        onChange={(e) => setTestOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="ej: 123456"
                        className="bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 font-mono font-bold tracking-widest text-center outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const valid = await totpService.verifyCode(testOtpInput);
                          if (valid) {
                            setTestResult({ success: true, message: '¡Código válido! Tu app está perfectamente sincronizada.' });
                            showToast('¡Código válido y sincronizado!', 'success');
                          } else {
                            setTestResult({ success: false, message: 'Código incorrecto o expirado. Revisa la hora de tu teléfono.' });
                            showToast('Código no coincide', 'error');
                          }
                        }}
                        className="px-4 py-2 bg-[#163E2B] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#0F2B1E] transition cursor-pointer"
                      >
                        Validar
                      </button>
                    </div>

                    {testResult && (
                      <p className={`text-[11px] font-medium mt-1 ${testResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {testResult.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Access Details & Info */}
              <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#EBE1D5] space-y-3 text-xs text-[#163E2B]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Database className="w-4 h-4 text-[#163E2B]" />
                    <span>Control de Roles en Base de Datos (Supabase)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                    Rol: {user?.role || 'admin'}
                  </span>
                </div>

                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Las credenciales no están fijas en el código fuente. El sistema valida el correo, la contraseña y comprueba en la tabla <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-stone-200">profiles</code> de Supabase que el usuario tenga el campo <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-stone-200">role = 'admin'</code>.
                </p>

                <div className="bg-white p-3 rounded-xl border border-[#E4DDD3] space-y-1.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    Comando SQL para otorgar rol de administrador en Supabase:
                  </span>
                  <pre className="bg-[#FAF8F5] p-2 rounded-lg font-mono text-[11px] text-[#163E2B] overflow-x-auto border border-stone-200 select-all">
UPDATE profiles SET role = 'admin' WHERE email = '{user?.email || 'enith@las3yr.com'}';</pre>
                </div>

                <ul className="space-y-1.5 text-stone-600 text-[11px] list-disc list-inside pt-1">
                  <li>
                    <strong>Ubicación del Acceso:</strong> El enlace al panel se encuentra únicamente en el pie de página (Footer) bajo el texto <em>"Acceso Panel"</em>.
                  </li>
                  <li>
                    <strong>Triple Capa de Seguridad:</strong> Correo Electrónico + Contraseña en Base de Datos + Validación de Rol Admin + Código Dinámico 2FA.
                  </li>
                  <li>
                    <strong>Registro Privado:</strong> Nadie puede registrarse como administrador desde afuera; los administradores solo pueden ser dados de alta desde este panel por un administrador activo.
                  </li>
                </ul>
              </div>
            </div>

            {/* Admin Accounts Management Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EAE1] pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#163E2B] text-white flex items-center justify-center shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#163E2B]">
                      Administradores Autorizados
                    </h3>
                    <p className="text-xs text-stone-500">
                      Gestiona quién tiene acceso y permisos administrativos para operar la tienda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAdminsList}
                    disabled={loadingAdmins}
                    className="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-[#163E2B] hover:bg-stone-50 transition cursor-pointer"
                    title="Recargar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAdmins ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#163E2B] hover:bg-[#0F2B1E] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-md cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Nuevo Administrador</span>
                  </button>
                </div>
              </div>

              {/* List of Admins */}
              <div className="space-y-3">
                {loadingAdmins ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#163E2B]" />
                    <span>Cargando cuentas administrativas...</span>
                  </div>
                ) : adminsList.length === 0 ? (
                  <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-stone-200 text-center space-y-2">
                    <UserCheck className="w-8 h-8 text-stone-400 mx-auto" />
                    <p className="text-xs font-bold text-stone-700">Administrador Activo Actual: {user?.email}</p>
                    <p className="text-[11px] text-stone-500">
                      Para añadir a otro miembro de tu equipo como administrador, haz clic en "Registrar Nuevo Administrador".
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {adminsList.map((adm) => {
                      const isCurrent = adm.email.toLowerCase() === user?.email?.toLowerCase();
                      return (
                        <div
                          key={adm.id || adm.email}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FAF4ED] border border-[#EBE1D5] flex items-center justify-center text-[#163E2B] font-serif font-bold text-sm">
                              {adm.fullName?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-[#163E2B]">{adm.fullName}</p>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#163E2B] font-bold text-[9px] uppercase tracking-wider">
                                    Tú (Sesión actual)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500 font-mono">{adm.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 font-semibold text-[10px] uppercase tracking-wider border border-stone-200">
                              Rol: {adm.role}
                            </span>
                            <span className="text-[10px] text-stone-400 hidden sm:inline">
                              {adm.source === 'supabase' ? 'Supabase' : 'BD Local'}
                            </span>

                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleRevokeAdmin(adm.id, adm.email)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Revocar permisos de administrador"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Admin Modal (Inside Dashboard) */}
        {showAddAdminModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE1D5] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF2ED] text-[#163E2B] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    Registrar Nuevo Administrador
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Crea una cuenta con permisos administrativos completos para un miembro de tu equipo. Podrá acceder al panel con su correo, contraseña y la clave 2FA Authenticator.
              </p>

              <form onSubmit={handleCreateNewAdmin} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={newAdminFullName}
                    onChange={(e) => setNewAdminFullName(e.target.value)}
                    placeholder="ej: Enith Ramos / Gerente"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="ej: nuevo.admin@las3yr.com"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Contraseña (Mínimo 6 caracteres)</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none transition"
                  />
                </div>

                <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#EBE1D5] text-[11px] text-stone-600">
                  <span>🔒 El nuevo administrador obtendrá automáticamente el rol <strong className="text-[#163E2B]">admin</strong> y podrá gestionar pedidos, productos e inventario.</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAdmin}
                    className="flex-1 py-2.5 rounded-xl bg-[#163E2B] hover:bg-[#0F2B1E] text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {savingAdmin ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Crear Administrador</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Category Create / Edit */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE1D5] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF2ED] text-[#163E2B] flex items-center justify-center">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    {editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Nombre de la Categoría *</label>
                  <input
                    type="text"
                    value={editingCategory.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setEditingCategory({
                        ...editingCategory,
                        name,
                        slug: editingCategory.slug && editingCategory.id ? editingCategory.slug : slug,
                      });
                    }}
                    placeholder="ej: Perfumería Fina"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Slug (URL amigable) *</label>
                  <input
                    type="text"
                    value={editingCategory.slug || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="ej: perfumeria-fina"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">URL de Imagen de Portada</label>
                  <input
                    type="url"
                    value={editingCategory.image_url || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Descripción Breve</label>
                  <textarea
                    rows={2}
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    placeholder="Fragancias, colonias y aromas para toda ocasión..."
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#163E2B] focus:bg-white rounded-xl text-xs py-2 px-3 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCategory.active !== false}
                      onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                      className="rounded text-[#163E2B]"
                    />
                    <span>Categoría Activa (Visible en tienda)</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#163E2B] hover:bg-[#0F2B1E] text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Brand Create / Edit */}
        {editingBrand && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE1D5] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF0F4] text-[#D83173] flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    {editingBrand.id ? 'Editar Marca' : 'Nueva Marca de Catálogo'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBrand} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Nombre de la Marca *</label>
                  <input
                    type="text"
                    value={editingBrand.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setEditingBrand({
                        ...editingBrand,
                        name,
                        slug: editingBrand.slug && editingBrand.id ? editingBrand.slug : slug,
                      });
                    }}
                    placeholder="ej: Natura Cosméticos"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#D83173] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Slug (Identificador) *</label>
                  <input
                    type="text"
                    value={editingBrand.slug || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="ej: natura"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#D83173] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">URL de Logotipo o Imagen (Opcional)</label>
                  <input
                    type="url"
                    value={editingBrand.logo_url || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#D83173] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Descripción de la Marca</label>
                  <textarea
                    rows={2}
                    value={editingBrand.description || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, description: e.target.value })}
                    placeholder="Cosmética y perfumería sustentable brasileña..."
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#D83173] focus:bg-white rounded-xl text-xs py-2 px-3 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBrand.active !== false}
                      onChange={(e) => setEditingBrand({ ...editingBrand, active: e.target.checked })}
                      className="rounded text-[#D83173]"
                    />
                    <span>Marca Activa (Aparece en filtros y tienda)</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBrand(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#D83173] hover:bg-[#C52B66] text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                  >
                    Guardar Marca
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Banner Hero Create / Edit */}
        {editingBanner && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE1D5] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#163E2B] text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#F48FB1]" />
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    {editingBanner.id ? 'Editar Banner Hero' : 'Nuevo Banner Hero Publicitario'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-3.5 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Etiqueta Superior (Tag)</label>
                    <input
                      type="text"
                      value={editingBanner.tag || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, tag: e.target.value })}
                      placeholder="ej: Ofertas del Mes"
                      className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Orden de Visualización</label>
                    <input
                      type="number"
                      value={editingBanner.sort_order || 1}
                      onChange={(e) => setEditingBanner({ ...editingBanner, sort_order: Number(e.target.value) })}
                      placeholder="1"
                      className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Título Principal del Banner *</label>
                  <input
                    type="text"
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    placeholder="ej: Perfumes y Belleza con los Mejores Precios"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2.5 px-3 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Descripción / Subtítulo</label>
                  <textarea
                    rows={2}
                    value={editingBanner.description || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                    placeholder="Descubre productos de catálogo con descuentos y envíos inmediatos..."
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">URL de la Imagen de Fondo *</label>
                  <input
                    type="url"
                    value={editingBanner.image_url || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Texto del Botón (CTA)</label>
                    <input
                      type="text"
                      value={editingBanner.button_text || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, button_text: e.target.value })}
                      placeholder="VER OFERTAS"
                      className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Enlace del Botón</label>
                    <input
                      type="text"
                      value={editingBanner.button_url || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, button_url: e.target.value })}
                      placeholder="/ofertas o /catalogo"
                      className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner.active !== false}
                      onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                      className="rounded text-[#163E2B]"
                    />
                    <span>Banner Activo (Visible en el carrusel de inicio)</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#163E2B] hover:bg-[#0F2B1E] text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                  >
                    Guardar Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Announcement Create / Edit */}
        {editingAnnouncement && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE1D5] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF0F4] text-[#D83173] flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-[#163E2B] text-base">
                    {editingAnnouncement.id ? 'Editar Aviso' : 'Nuevo Aviso Superior'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Mensaje del Aviso *</label>
                  <textarea
                    rows={3}
                    value={editingAnnouncement.message || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                    placeholder="ej: 🚚 ¡Envíos gratis por compras superiores a $150.000!"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#D83173] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Orden de Rotación</label>
                  <input
                    type="number"
                    value={editingAnnouncement.sort_order || 1}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, sort_order: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] focus:border-[#D83173] focus:bg-white rounded-xl text-xs py-2.5 px-3 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAnnouncement.active !== false}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, active: e.target.checked })}
                      className="rounded text-[#D83173]"
                    />
                    <span>Aviso Activo (Rota en la cinta superior)</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAnnouncement(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#D83173] hover:bg-[#C52B66] text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                  >
                    Guardar Aviso
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
