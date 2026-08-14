import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Plus,
  Minus,
  MessageCircle,
  ShoppingBag,
  Star,
  Truck,
  Award,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Product } from '../types';
import { storeService } from '../services/storeService';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHead } from '../components/common/SEOHead';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, formatCurrency } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { settings, showToast } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setQuantity(1);

    storeService.getProductBySlug(slug).then(async (prod) => {
      if (prod) {
        setProduct(prod);
        setSelectedImage(prod.main_image);
        // Load related
        const related = await storeService.getProducts({
          categorySlug: prod.category_slug,
          activeOnly: true,
        });
        setRelatedProducts(related.filter((p) => p.id !== prod.id).slice(0, 4));
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#D83173] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#163E2B]">Cargando producto...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#163E2B] mb-2">Producto no encontrado</h2>
        <p className="text-xs text-stone-500 mb-6">El producto solicitado no está disponible o ha sido retirado.</p>
        <Link
          to="/productos"
          className="px-6 py-2.5 rounded-full bg-[#D83173] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C52B66] transition"
        >
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(product.id);
  const gallery = [product.main_image, ...(product.gallery || [])].filter(Boolean);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast(`${quantity}x "${product.name}" agregado al carrito`, 'success');
  };

  const handleWhatsAppBuy = () => {
    const url = storeService.buildWhatsAppOrderUrl({
      whatsappNumber: settings.whatsapp || '+573244456597',
      items: [{ name: product.name, quantity, price: product.price }],
      subtotal: product.price * quantity,
      shipping:
        product.price * quantity >= (settings.free_shipping_from || 150000)
          ? 0
          : settings.shipping_cost || 12000,
      total:
        product.price * quantity >= (settings.free_shipping_from || 150000)
          ? product.price * quantity
          : product.price * quantity + (settings.shipping_cost || 12000),
    });
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-12">
      <SEOHead
        title={`${product.name} | ${product.brand_name || 'Las 3YR'}`}
        description={`${product.short_description || product.description?.slice(0, 160)} - Compra ${product.name} 100% original en Las 3YR Colombia. Pago con Nequi, Llave y Contraentrega.`}
        image={product.main_image}
        productData={{
          name: product.name,
          description: product.description || product.short_description,
          price: product.price,
          currency: 'COP',
          image: product.main_image,
          brand: product.brand_name || 'Las 3YR',
          sku: product.sku || product.id,
          inStock: product.stock > 0,
        }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top Dark Green Pill Badge matching screenshot */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#163E2B] text-white px-7 py-2 rounded-full text-xs sm:text-sm font-bold tracking-widest uppercase shadow-xs">
            PÁGINA DE PRODUCTO
          </div>
        </div>

        {/* Main Product Container Card matching screenshot */}
        <div className="bg-white rounded-3xl border border-[#EFE9E1] shadow-sm p-6 sm:p-10 mb-12">
          {/* Breadcrumb matching screenshot */}
          <nav className="flex items-center gap-2 text-xs text-[#8D9B91] mb-8">
            <Link to="/" className="hover:text-[#163E2B] transition">
              Inicio
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={`/categoria/${product.category_slug || 'belleza'}`}
              className="hover:text-[#163E2B] transition"
            >
              {product.category_name || 'Belleza'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#163E2B] font-semibold truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Gallery matching screenshot */}
            <div className="md:col-span-6 space-y-4">
              {/* Main Image Box */}
              <div className="relative aspect-square w-full rounded-2xl bg-[#FAF8F5] border border-[#EFE9E1] p-6 flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => toggleFavorite(product)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white text-stone-400 hover:text-[#D83173] shadow-xs hover:shadow-md transition"
                  aria-label="Favorito"
                >
                  <Heart
                    className={`w-5 h-5 ${favorited ? 'fill-[#D83173] text-[#D83173]' : ''}`}
                  />
                </button>

                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply transition-all duration-300"
                />
              </div>

              {/* Thumbnails row matching screenshot */}
              {gallery.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {gallery.slice(0, 3).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`aspect-square rounded-xl overflow-hidden bg-[#FAF8F5] p-2 border-2 transition cursor-pointer ${
                        selectedImage === img
                          ? 'border-[#D83173] shadow-xs'
                          : 'border-[#EFE9E1] hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product details matching screenshot */}
            <div className="md:col-span-6 space-y-5">
              {/* Brand Tag */}
              <span className="text-xs font-bold uppercase tracking-widest text-[#163E2B]/80 block">
                {product.brand_name || 'NATURA'}
              </span>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E2B] leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex text-[#D83173]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#64786A]">
                  {product.rating || '5.0'} ({product.reviews_count || 24} opiniones)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#163E2B]">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_price && product.compare_price > product.price && (
                  <span className="text-sm text-stone-400 line-through">
                    {formatCurrency(product.compare_price)}
                  </span>
                )}
              </div>

              {/* Description matching screenshot */}
              <p className="text-xs sm:text-sm text-[#546A5B] leading-relaxed">
                {product.description}
              </p>

              {/* Content Specification (e.g. Contenido: 150 ml) */}
              {product.content_spec && (
                <div className="text-xs font-semibold text-[#163E2B]">
                  <span className="text-[#64786A]">Contenido:</span> {product.content_spec}
                </div>
              )}

              {/* Quantity Selector matching screenshot */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#163E2B] mb-2">
                  Cantidad
                </label>
                <div className="inline-flex items-center border border-[#E4DDD3] rounded-xl bg-white overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 hover:bg-[#FAF8F5] text-stone-600 hover:text-[#163E2B] transition"
                    aria-label="Disminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs sm:text-sm font-bold text-[#163E2B] min-w-[32px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2.5 hover:bg-[#FAF8F5] text-stone-600 hover:text-[#163E2B] transition"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons matching screenshot */}
              <div className="space-y-3 pt-3">
                {/* Pink Solid Button: AGREGAR AL CARRITO */}
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#D83173] hover:bg-[#C52B66] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>AGREGAR AL CARRITO</span>
                </button>

                {/* White/Green Outline: COMPRAR POR WHATSAPP */}
                <button
                  onClick={handleWhatsAppBuy}
                  className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-[#F2F8F4] text-[#163E2B] border border-[#163E2B] font-bold text-xs sm:text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                  <span>COMPRAR POR WHATSAPP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badges matching screenshot */}
          <div className="mt-12 pt-8 border-t border-[#F0EAE1] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#FAF8F5]">
              <Truck className="w-6 h-6 text-[#163E2B]" />
              <span className="text-xs font-bold text-[#163E2B]">Envíos a todo el país</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#FAF8F5]">
              <Award className="w-6 h-6 text-[#163E2B]" />
              <span className="text-xs font-bold text-[#163E2B]">Productos 100% originales</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#FAF8F5]">
              <ShieldCheck className="w-6 h-6 text-[#163E2B]" />
              <span className="text-xs font-bold text-[#163E2B]">Compra segura y protegida</span>
            </div>
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#163E2B] mb-6 text-center">
              Productos Relacionados
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
