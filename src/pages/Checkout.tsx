import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Banknote,
  QrCode,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { storeService } from '../services/storeService';
import { Order, PaymentMethod, DeliveryMethod } from '../types';
import { SEOHead } from '../components/common/SEOHead';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, shipping, total, clearCart, formatCurrency } = useCart();
  const { settings, showToast } = useStore();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: user?.phone || '',
    city: 'Cartagena',
    department: 'Bolívar',
    address: '',
    notes: '',
  });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Envío por DiDi / inDrive' as DeliveryMethod);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia Nequi');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (cart.length === 0 && !completedOrder) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <ShoppingBag className="w-16 h-16 text-[#D83173] mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-[#163E2B] mb-2">
          Tu carrito está vacío
        </h2>
        <p className="text-xs text-stone-500 mb-6">
          Agrega productos a tu carrito antes de proceder con la compra.
        </p>
        <Link
          to="/productos"
          className="inline-block px-8 py-3 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition shadow-md"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await storeService.createOrder({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        address: formData.address,
        city: formData.city,
        department: formData.department,
        notes: formData.notes,
        subtotal,
        shipping,
        total,
        origin: 'Web',
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        status: 'Pendiente',
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.main_image,
          quantity: item.quantity,
          unit_price: item.product.price,
          subtotal: item.product.price * item.quantity,
        })),
      });

      setCompletedOrder(order);
      clearCart();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('¡Pedido registrado con éxito!', 'success');
    } catch (err) {
      console.error('Error creating order:', err);
      showToast('No se pudo procesar el pedido. Intenta nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsAppConfirmation = () => {
    if (!completedOrder) return;
    const url = storeService.buildWhatsAppOrderUrl({
      whatsappNumber: settings.whatsapp || '+573244456597',
      items: completedOrder.items.map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: i.unit_price,
      })),
      subtotal: completedOrder.subtotal,
      shipping: completedOrder.shipping,
      total: completedOrder.total,
      customerName: completedOrder.customer_name,
      customerPhone: completedOrder.whatsapp,
      city: completedOrder.city,
      address: completedOrder.address,
    });
    window.open(url, '_blank');
  };

  // If order completed, show Confirmation Screen
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE9E1] shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-[#E9F3EC] text-[#163E2B] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D83173]">
                ¡Pedido Realizado con Éxito!
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#163E2B]">
                Gracias por tu compra, {completedOrder.customer_name.split(' ')[0]}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Número de pedido:{' '}
                <span className="font-mono font-bold text-[#163E2B] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EFE9E1]">
                  {completedOrder.order_number}
                </span>
              </p>
            </div>

            {/* Order Brief Summary */}
            <div className="bg-[#FAF8F5] rounded-2xl p-5 text-left border border-[#EFE9E1] space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between font-bold text-[#163E2B]">
                <span>Total a Pagar:</span>
                <span className="text-[#D83173] text-base">{formatCurrency(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Método de pago:</span>
                <span className="font-semibold text-[#163E2B]">{completedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Entrega en:</span>
                <span className="font-semibold text-[#163E2B]">
                  {completedOrder.city}, {completedOrder.address}
                </span>
              </div>
            </div>

            {/* WhatsApp Direct Notification */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleOpenWhatsAppConfirmation}
                className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>Notificar Pedido por WhatsApp</span>
              </button>

              <button
                onClick={() => navigate('/productos')}
                className="w-full py-3 text-xs font-bold text-[#163E2B] hover:text-[#D83173] transition"
              >
                Seguir Explorando el Catálogo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-[#8D9B91] mb-6">
          <Link to="/" className="hover:text-[#163E2B]">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/productos" className="hover:text-[#163E2B]">Catálogo</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#163E2B] font-semibold">Finalizar Compra</span>
        </nav>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E2B] mb-8">
          Finalizar Pedido
        </h1>

        {/* Cartagena Exclusive Warning Banner */}
        <div className="bg-[#FAF6F0] border border-[#E8DCCB] rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#163E2B] text-white flex items-center justify-center shrink-0 mt-0.5">
            <Truck className="w-5 h-5 text-[#FAF6F0]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-[#163E2B] text-sm">
              📍 Venta y Entrega Exclusiva en Cartagena de Indias
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong>Importante:</strong> Solo despachamos pedidos en la ciudad de <strong>Cartagena</strong> (no contamos con envíos nacionales ni internacionales). Los envíos locales se realizan mediante las aplicaciones <strong>DiDi</strong> o <strong>inDrive</strong>; por lo tanto, el valor del domicilio variará y se pagará según la tarifa exacta que marque la aplicación al momento del despacho.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#163E2B] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#163E2B] text-white text-xs flex items-center justify-center font-sans">
                  1
                </span>
                <span>Datos de Contacto</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Carolina Gómez"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Teléfono / Celular *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ej. 300 123 4567"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    WhatsApp para confirmación *
                  </label>
                  <input
                    type="tel"
                    required
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="Ej. 300 123 4567"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ej. correo@ejemplo.com"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#163E2B] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#163E2B] text-white text-xs flex items-center justify-center font-sans">
                  2
                </span>
                <span>2. Dirección de Entrega en Cartagena</span>
              </h2>

              {/* Delivery method selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#163E2B]">
                  Método de Entrega Local:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                      deliveryMethod === ('Envío por DiDi / inDrive' as DeliveryMethod)
                        ? 'border-[#163E2B] bg-[#E9F3EC]/40 ring-1 ring-[#163E2B]'
                        : 'border-[#EFE9E1] bg-[#FAF8F5] hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="Envío por DiDi / inDrive"
                      checked={deliveryMethod === ('Envío por DiDi / inDrive' as DeliveryMethod)}
                      onChange={() => setDeliveryMethod('Envío por DiDi / inDrive' as DeliveryMethod)}
                      className="mt-1 accent-[#163E2B]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#163E2B] block">
                        🛵 Domicilio DiDi / inDrive
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Tarifa variable según la app al momento del despacho
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                      deliveryMethod === ('Recogida personal en Cartagena' as DeliveryMethod)
                        ? 'border-[#163E2B] bg-[#E9F3EC]/40 ring-1 ring-[#163E2B]'
                        : 'border-[#EFE9E1] bg-[#FAF8F5] hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="Recogida personal en Cartagena"
                      checked={deliveryMethod === ('Recogida personal en Cartagena' as DeliveryMethod)}
                      onChange={() => setDeliveryMethod('Recogida personal en Cartagena' as DeliveryMethod)}
                      className="mt-1 accent-[#163E2B]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#163E2B] block">
                        📍 Recogida Personal
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Coordinar punto de entrega en Cartagena vía WhatsApp
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Ciudad (Solo Cartagena) *
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Cartagena"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                  <span className="text-[10px] text-[#163E2B] font-semibold mt-1 block">
                    ✓ Cobertura exclusiva en Cartagena de Indias
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Bolívar"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Dirección exacta y Barrio en Cartagena *
                  </label>
                  <input
                    type="text"
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ej. Manga Callejón Real Cra 22 # 25-10 / Bocagrande / Los Calamares"
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#163E2B] mb-1">
                    Punto de referencia o notas para el conductor de DiDi/inDrive
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ej. Frente a la tienda de la esquina, conjunto cerrado torre 2 apto 301..."
                    className="w-full bg-[#FAF8F5] border border-[#E4DDD3] rounded-xl text-xs sm:text-sm py-2.5 px-3.5 outline-none focus:border-[#D83173] focus:bg-white transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-2xs space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#163E2B] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#163E2B] text-white text-xs flex items-center justify-center font-sans">
                  3
                </span>
                <span>Medio de Pago Autorizado</span>
              </h2>

              <p className="text-xs text-stone-500">
                Selecciona uno de nuestros medios oficiales de pago en Colombia:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: 'Transferencia Nequi' as PaymentMethod,
                    title: 'Transferencia Nequi',
                    badge: 'Recomendado',
                    badgeColor: 'bg-[#20003C] text-[#FF0076]',
                    icon: Smartphone,
                    desc: 'Transferencia rápida y sin costo a la cuenta Nequi de Las 3YR. Envías el comprobante por WhatsApp.',
                  },
                  {
                    id: 'Transferencia Llave' as PaymentMethod,
                    title: 'Transferencia Llave / Transfiya',
                    badge: 'Instantáneo',
                    badgeColor: 'bg-[#163E2B] text-[#A3E635]',
                    icon: QrCode,
                    desc: 'Envío de dinero interbancario inmediato desde cualquier banco de Colombia utilizando la Llave oficial.',
                  },
                  {
                    id: 'Efectivo al Contraentrega' as PaymentMethod,
                    title: 'Efectivo al Contraentrega',
                    badge: 'En tu domicilio',
                    badgeColor: 'bg-[#FAF6F0] text-[#163E2B]',
                    icon: Banknote,
                    desc: 'Pagas en efectivo al mensajero en el momento exacto en que recibes tu paquete en tu puerta.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition cursor-pointer ${
                        isSelected
                          ? 'border-[#D83173] bg-[#FDF2F6]'
                          : 'border-[#EFE9E1] bg-white hover:border-[#E2D8CD]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => setPaymentMethod(item.id)}
                        className="mt-1 accent-[#D83173]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs sm:text-sm font-bold text-[#163E2B]">
                            {item.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Dynamic Payment Instruction Box */}
              <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#E9DFD3] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#163E2B]">
                  <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                  <span>
                    {paymentMethod === 'Transferencia Nequi' && 'Instrucciones para Pago por Nequi'}
                    {paymentMethod === 'Transferencia Llave' && 'Instrucciones para Transferencia por Llave'}
                    {paymentMethod === 'Efectivo al Contraentrega' && 'Instrucciones para Pago Contraentrega'}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  {paymentMethod === 'Transferencia Nequi' && (
                    <>
                      Número Nequi de la tienda: <strong>{settings.phone || '324 445 6597'}</strong> (Titular: Las 3YR / Enith). Una vez confirmado tu pedido, envíanos la captura del comprobante por WhatsApp para alistar tu despacho.
                    </>
                  )}
                  {paymentMethod === 'Transferencia Llave' && (
                    <>
                      Llave / Transfiya oficial: <strong>{settings.phone || '324 445 6597'}</strong>. Envía el dinero desde tu app bancaria favorita (Bancolombia, Davivienda, etc.) y confirma vía WhatsApp.
                    </>
                  )}
                  {paymentMethod === 'Efectivo al Contraentrega' && (
                    <>
                      Ten a la mano el valor exacto en efectivo ({formatCurrency(total)}) al momento de la entrega para facilitar el cambio al mensajero. Confirmaremos tu dirección previamente por WhatsApp.
                    </>
                  )}
                </p>
              </div>

              {/* Legal Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    className="mt-0.5 accent-[#D83173]"
                  />
                  <span>
                    He leído y acepto los{' '}
                    <Link to="/terminos-y-condiciones" target="_blank" className="text-[#D83173] font-bold hover:underline">
                      Términos y Condiciones
                    </Link>{' '}
                    y las{' '}
                    <Link to="/politicas-de-privacidad" target="_blank" className="text-[#D83173] font-bold hover:underline">
                      Políticas de Privacidad
                    </Link>{' '}
                    de Las 3YR.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E1] shadow-md space-y-5">
              <h2 className="font-serif text-lg font-bold text-[#163E2B]">
                Resumen del Pedido
              </h2>

              <div className="divide-y divide-[#F4EFE9] max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.main_image}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-[#EFE9E1]"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#163E2B] line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {item.quantity} x {formatCurrency(item.product.price)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#163E2B]">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2.5 pt-3 border-t border-[#F0EAE1] text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-stone-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600 items-baseline">
                  <span>Envío en Cartagena</span>
                  <span className="font-semibold text-[#163E2B] text-right text-xs">
                    {deliveryMethod === 'Recogida personal en Cartagena'
                      ? 'Gratis (Recogida)'
                      : 'Según app DiDi / inDrive'}
                  </span>
                </div>
                <div className="p-2.5 bg-[#FAF6F0] rounded-xl border border-[#EFE9E1] text-[11px] text-stone-600 leading-tight">
                  🛵 <strong>Nota de envío:</strong> El valor del domicilio es variable y corresponde a la tarifa de la app DiDi o inDrive al momento de enviar tu pedido en Cartagena.
                </div>
                <div className="h-[1px] bg-[#EFE9E1] my-2"></div>
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-base font-bold text-[#163E2B] block">Total Productos</span>
                    <span className="text-[10px] text-stone-400 block">+ valor del domicilio al recibir</span>
                  </div>
                  <span className="text-2xl font-black text-[#D83173]">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#D83173] hover:bg-[#C52B66] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'PROCESANDO PEDIDO...' : 'CONFIRMAR PEDIDO'}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-[#163E2B]" />
                <span>Tus datos están 100% seguros y encriptados</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
