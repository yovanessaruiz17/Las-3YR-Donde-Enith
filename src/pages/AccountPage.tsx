import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Package, ShieldCheck, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { storeService } from '../services/storeService';
import { Order } from '../types';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const { showToast } = useStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      storeService.getOrders().then((all) => {
        setOrders(
          all.filter(
            (o) =>
              (o.customer_email && o.customer_email.toLowerCase() === user.email.toLowerCase()) ||
              o.customer_name.toLowerCase().includes(user.full_name.toLowerCase())
          )
        );
      });
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const res = await signUpWithEmail(email, password, fullName);
      if (res.error) {
        showToast(res.error.message, 'error');
      } else {
        showToast('¡Cuenta creada con éxito!', 'success');
      }
    } else {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        showToast(res.error.message, 'error');
      } else {
        showToast('¡Bienvenida de nuevo!', 'success');
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    showToast('Sesión cerrada correctamente', 'info');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-12 sm:py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#EFE9E1] shadow-xl">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-[#FAF6F0] text-[#D83173] flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E2B]">
                {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                {isRegister
                  ? 'Regístrate para guardar tus pedidos y direcciones'
                  : 'Accede a tu cuenta de Las 3YR - Donde Enith'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Carolina Gómez"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#163E2B] mb-1">Correo Electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 pl-9 pr-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163E2B] mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 pl-9 pr-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#D83173] hover:bg-[#C52B66] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'CARGANDO...' : isRegister ? 'CREAR MI CUENTA' : 'INGRESAR'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#F0EAE1] text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-[#D83173] font-semibold hover:underline cursor-pointer"
              >
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-full bg-[#FAF6F0] text-[#D83173] flex items-center justify-center font-serif text-2xl font-bold border border-[#EFE9E1]">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#163E2B]">
                  {user.full_name}
                </h1>
                {isAdmin && (
                  <span className="bg-[#163E2B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-full bg-[#163E2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#112F21] transition"
              >
                Panel Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-300 text-stone-600 hover:text-rose-600 hover:border-rose-300 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* My Orders */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs">
          <h2 className="font-serif text-xl font-bold text-[#163E2B] mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D83173]" />
            <span>Mis Pedidos ({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500">Aún no has registrado pedidos con esta cuenta.</p>
              <Link
                to="/productos"
                className="inline-block mt-4 px-6 py-2 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider"
              >
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE9E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-[#163E2B]">
                        {ord.order_number}
                      </span>
                      <span className="bg-[#E9F3EC] text-[#163E2B] px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-stone-500">
                      Fecha: {new Date(ord.created_at).toLocaleDateString('es-CO')}
                    </p>
                    <p className="text-stone-600 font-medium">
                      {ord.items.length} producto(s) • Total: {storeService.formatCurrency(ord.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
