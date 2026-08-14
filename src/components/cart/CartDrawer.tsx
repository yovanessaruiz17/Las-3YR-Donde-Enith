import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, Plus, Minus, MessageCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { storeService } from '../../services/storeService';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    isOpen,
    closeCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    subtotal,
    shipping,
    total,
    itemCount,
    formatCurrency,
  } = useCart();
  const { settings } = useStore();

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    const url = storeService.buildWhatsAppOrderUrl({
      whatsappNumber: settings.whatsapp || '+573244456597',
      items: cart.map((item) => ({
        name: item.product.name + (item.selected_variant ? ` (${item.selected_variant})` : ''),
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal,
      shipping,
      total,
    });

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header section matching screenshot */}
        <div className="p-5 border-b border-[#F0EAE1] bg-[#FAF8F5] shrink-0">
            <div className="flex items-center justify-between mb-4">
              {/* Green Title Pill Badge matching screenshot */}
              <div className="mx-auto bg-[#163E2B] text-white px-6 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xs">
                CARRITO DE COMPRAS
              </div>
              <button
                onClick={closeCart}
                className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-[#163E2B] hover:bg-stone-100 rounded-full transition"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Local Cartagena Delivery Notice */}
            <div className="bg-[#FAF6F0] border border-[#EBE1D5] rounded-xl px-3 py-2 text-[11px] text-stone-600 flex items-center justify-between mb-2">
              <span className="font-semibold text-[#163E2B]">📍 Solo Cartagena</span>
              <span className="text-[10px] text-stone-500">Envíos por DiDi / inDrive</span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <h2 className="text-base sm:text-lg font-bold text-[#163E2B]">
                Tu carrito ({itemCount})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-stone-400 hover:text-rose-600 transition underline underline-offset-2"
                >
                  Vaciar carrito
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#F4EFE9]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF6F1] flex items-center justify-center text-[#C52B66]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#163E2B]">Tu carrito está vacío</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Explora nuestro catálogo con las mejores marcas de belleza, hogar y cuidado personal.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/productos');
                  }}
                  className="mt-3 px-6 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold tracking-wider uppercase hover:bg-[#C52B66] transition shadow-xs"
                >
                  Ver Productos
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-4 flex items-center gap-3 sm:gap-4 group">
                  {/* Thumbnail */}
                  <img
                    src={item.product.main_image}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-xl bg-[#FAF8F5] border border-[#EFE9E1] shrink-0"
                  />

                  {/* Title & Brand */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#183B2B] truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {item.product.brand_name || 'Catálogo'}
                      {item.product.content_spec ? ` - ${item.product.content_spec}` : ''}
                      {item.selected_variant ? ` (${item.selected_variant})` : ''}
                    </p>
                    <div className="text-xs sm:text-sm font-bold text-[#183B2B] mt-1 sm:hidden">
                      {formatCurrency(item.product.price * item.quantity)}
                    </div>
                  </div>

                  {/* Price on Desktop matching screenshot */}
                  <div className="hidden sm:block text-xs sm:text-sm font-bold text-[#183B2B] whitespace-nowrap">
                    {formatCurrency(item.product.price * item.quantity)}
                  </div>

                  {/* Quantity selector `[- 1 +]` matching screenshot */}
                  <div className="flex items-center border border-[#E4DDD3] rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      className="p-1 sm:p-1.5 hover:bg-[#FAF6F1] text-stone-600 hover:text-[#163E2B] transition"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-semibold text-[#163E2B] min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseQuantity(item.id)}
                      className="p-1 sm:p-1.5 hover:bg-[#FAF6F1] text-stone-600 hover:text-[#163E2B] transition"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals and Actions matching screenshot */}
          {cart.length > 0 && (
            <div className="p-5 bg-[#FAF8F5] border-t border-[#F0EAE1] space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal ({itemCount} productos)</span>
                  <span className="font-semibold text-stone-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600 items-baseline">
                  <span>Envío (Cartagena)</span>
                  <span className="font-semibold text-[#183B2B] text-xs">
                    Tarifa según DiDi / inDrive
                  </span>
                </div>
                <div className="h-[1px] bg-[#EFE9E1] my-2"></div>
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-base font-bold text-[#163E2B] block">Total</span>
                    <span className="text-[10px] text-stone-400 block">+ costo domicilio al recibir</span>
                  </div>
                  <span className="text-xl font-extrabold text-[#D83173]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              {/* Action Buttons matching screenshot */}
              <div className="space-y-2.5 pt-2">
                {/* Button 1: Solid Pink FINALIZAR COMPRA */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#D83173] hover:bg-[#C52B66] text-white py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  FINALIZAR COMPRA
                </button>

                {/* Button 2: White/Green Outline COMPRAR POR WHATSAPP */}
                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-white hover:bg-[#F2F8F4] text-[#163E2B] border border-[#163E2B] py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                  <span>COMPRAR POR WHATSAPP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
