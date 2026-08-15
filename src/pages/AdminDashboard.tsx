import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { storeService } from '../services/storeService';
import { totpService } from '../services/totpService';
import { adminAuthService, AdminUserItem } from '../services/adminAuthService';
import { Admin2FALogin } from '../components/admin/Admin2FALogin';
import { Product, Order, Category, Brand, Banner, OrderStatus } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { settings, updateSettings, categories, brands, banners, refreshStore, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<
    'kpis' | 'products' | 'orders' | 'categories' | 'banners' | 'settings' | 'messages' | 'database' | 'security'
  >('kpis');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newsletterEmails, setNewsletterEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase Testing & Sync states
  const [dbTesting, setDbTesting] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbSyncing, setDbSyncing] = useState(false);
  const [dbSyncResult, setDbSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Modals / Editors
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
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
        newAdminEmail.trim(),
        newAdminPassword,
        newAdminFullName.trim()
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
    const [prods, ords, msgs, emails] = await Promise.all([
      storeService.getProducts({ activeOnly: false }),
      storeService.getOrders(),
      storeService.getContactMessages(),
      storeService.getNewsletterSubscribers(),
    ]);
    setProducts(prods);
    setOrders(ords);
    setMessages(msgs);
    setNewsletterEmails(emails);
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

  // KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelado' ? o.total : 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pendiente').length;

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      showToast('Por favor completa el nombre y precio del producto', 'error');
      return;
    }

    try {
      if (editingProduct.id) {
        await storeService.updateProduct(editingProduct.id, editingProduct);
        showToast('Producto actualizado con éxito', 'success');
      } else {
        await storeService.createProduct(editingProduct as any);
        showToast('Nuevo producto creado con éxito', 'success');
      }
      setEditingProduct(null);
      await loadAllData();
      await refreshStore();
    } catch (err: any) {
      showToast(`Error al guardar el producto: ${err?.message || 'Revisa los permisos de Supabase'}`, 'error');
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Total en Ventas
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#163E2B] mt-2">
                  {storeService.formatCurrency(totalRevenue)}
                </p>
                <span className="text-[11px] text-[#25D366] font-semibold mt-1 block">
                  {orders.length} pedidos totales
                </span>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Pedidos Pendientes
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#D83173] mt-2">
                  {pendingOrders}
                </p>
                <span className="text-[11px] text-stone-400 font-semibold mt-1 block">
                  Por despachar o confirmar
                </span>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Productos en Catálogo
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#163E2B] mt-2">
                  {products.length}
                </p>
                <span className="text-[11px] text-[#163E2B] font-semibold mt-1 block">
                  {products.filter((p) => p.is_active).length} activos para compra
                </span>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Contactos & Suscriptores
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#163E2B] mt-2">
                  {newsletterEmails.length}
                </p>
                <span className="text-[11px] text-stone-400 font-semibold mt-1 block">
                  {messages.length} consultas recibidas
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
                    className="text-xs font-bold text-[#D83173] hover:underline"
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

              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                  Acciones Rápidas
                </h3>
                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      price: 50000,
                      is_active: true,
                      is_featured: false,
                      brand_name: 'Natura',
                      category_name: 'Belleza',
                      main_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
                      description: '',
                    });
                    setActiveTab('products');
                  }}
                  className="w-full py-3 rounded-2xl bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#C52B66] transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Producto</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full py-3 rounded-2xl border border-[#E4DDD3] bg-[#FAF8F5] text-[#163E2B] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white transition"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurar Teléfono / WhatsApp</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EFE9E1] text-xs text-[#163E2B] hover:bg-[#FAF8F5]"
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
                    <th className="pb-3">Pago</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right">Acciones</th>
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
                          className="bg-white border border-[#E4DDD3] rounded-lg px-2 py-1 text-xs font-semibold text-[#163E2B] outline-none"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#163E2B]">
                  Catálogo de Productos ({products.length})
                </h2>
                <p className="text-xs text-stone-500">Agrega, edita o actualiza precios de catálogo.</p>
              </div>

              <button
                onClick={() =>
                  setEditingProduct({
                    name: '',
                    price: 45000,
                    is_active: true,
                    is_featured: false,
                    brand_name: 'Natura',
                    category_name: 'Belleza',
                    main_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
                    description: '',
                  })
                }
                className="px-5 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Product Edit / Add Modal */}
            {editingProduct && (
              <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#E4DDD3] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-[#163E2B]">
                    {editingProduct.id ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h3>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="p-1 text-stone-400 hover:text-stone-700"
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
                      value={editingProduct.brand_name || 'Natura'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand_name: e.target.value })}
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#163E2B] mb-1">Categoría</label>
                    <select
                      value={editingProduct.category_name || 'Belleza'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category_name: e.target.value })}
                      className="w-full bg-white border border-[#E4DDD3] rounded-xl text-xs py-2 px-3 outline-none"
                    >
                      {categories.map((c) => (
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

                  <div className="sm:col-span-2">
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

                  <div className="flex items-center gap-4 sm:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.is_active ?? true}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                      />
                      <span>Producto Activo en Tienda</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#163E2B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.is_featured ?? false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                      />
                      <span>Destacado en Inicio</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#C52B66]"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE9E1] text-stone-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Foto</th>
                    <th className="pb-3">Producto</th>
                    <th className="pb-3">Marca / Categoría</th>
                    <th className="pb-3">Precio</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]">
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
                      <td className="py-2.5 font-bold text-[#163E2B]">
                        {storeService.formatCurrency(p.price)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.is_active
                              ? 'bg-[#E9F3EC] text-[#163E2B]'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {p.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-2">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1.5 rounded-lg border border-[#E4DDD3] text-[#163E2B] hover:bg-white"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIAS & MARCAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#163E2B]">
                Categorías ({categories.length})
              </h2>
              <div className="divide-y divide-[#F0EAE1]">
                {categories.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={c.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <span className="font-bold text-[#163E2B]">{c.name}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">/{c.slug}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EFE9E1] shadow-2xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#163E2B]">
                Marcas de Catálogo ({brands.length})
              </h2>
              <div className="divide-y divide-[#F0EAE1]">
                {brands.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#163E2B]">{b.name}</span>
                    <span className="text-[11px] text-stone-400">{b.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONFIGURACIÓN TIENDA */}
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
                  onChange={(e) => updateSettings({ whatsapp: e.target.value })}
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
                  onChange={(e) => updateSettings({ announcement_text: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => showToast('Configuración guardada correctamente', 'success')}
                  className="px-6 py-2.5 rounded-full bg-[#163E2B] text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MENSAJES & SUSCRIPTORES */}
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
      </div>
    </div>
  );
};
