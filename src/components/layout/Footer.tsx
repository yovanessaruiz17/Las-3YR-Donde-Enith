import React from 'react';
import { Link } from 'react-router-dom';
import {
  Instagram,
  Facebook,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { InstallAppButton } from '../common/PWAInstallPrompt';

export const Footer: React.FC = () => {
  const { settings } = useStore();

  return (
    <footer className="bg-[#133826] text-[#E8F0EA] pt-14 pb-8 border-t border-[#1C4A34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-[#214D38]">
          {/* Brand Info & Socials */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-serif text-white font-bold tracking-tight">
                  Las 3YR
                </span>
                <Sparkles className="w-4 h-4 text-[#F48FB1]" />
              </div>
              <div className="flex items-center gap-1.5 w-full">
                <span className="h-[1px] w-3 bg-[#F48FB1]/60"></span>
                <span className="text-[10px] tracking-[0.25em] text-[#F48FB1] font-semibold uppercase">
                  DONDE ENITH
                </span>
                <span className="h-[1px] w-3 bg-[#F48FB1]/60"></span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#B7D1C1] leading-relaxed max-w-sm">
              Tu tienda online de productos de catálogo. Belleza, hogar y estilo para ti y tu familia con asesoría personalizada.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={settings.instagram || 'https://instagram.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-[#1B4B34] hover:bg-[#D83173] text-white flex items-center justify-center transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.facebook || 'https://facebook.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[#1B4B34] hover:bg-[#1877F2] text-white flex items-center justify-center transition"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${(settings.whatsapp || '+573244456597').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-[#1B4B34] hover:bg-[#25D366] text-white flex items-center justify-center transition"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>

            {/* PWA Mobile App Download Button */}
            <div className="pt-2">
              <InstallAppButton
                label="Instalar App en el Celular"
                className="bg-[#F48FB1]/10 text-[#F48FB1] border border-[#F48FB1]/30 hover:bg-[#F48FB1]/20 hover:text-white"
              />
            </div>
          </div>

          {/* Col 1: COMPRA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">COMPRA</h4>
            <ul className="space-y-2 text-xs text-[#B7D1C1]">
              <li>
                <Link to="/productos" className="hover:text-white hover:underline transition">
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link to="/productos" className="hover:text-white hover:underline transition">
                  Categorías
                </Link>
              </li>
              <li>
                <Link to="/ofertas" className="hover:text-white hover:underline transition text-[#F48FB1]">
                  Ofertas especiales
                </Link>
              </li>
              <li>
                <Link to="/productos" className="hover:text-white hover:underline transition">
                  Lanzamientos
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: POLÍTICAS & LEGAL */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">POLÍTICAS & LEGAL</h4>
            <ul className="space-y-2 text-xs text-[#B7D1C1]">
              <li>
                <Link to="/politicas-de-privacidad" className="hover:text-white hover:underline transition">
                  Políticas de Privacidad (Habeas Data)
                </Link>
              </li>
              <li>
                <Link to="/terminos-y-condiciones" className="hover:text-white hover:underline transition">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/politica-de-envios" className="hover:text-white hover:underline transition">
                  Política de Envíos y Tarifas
                </Link>
              </li>
              <li>
                <Link to="/cambios-y-devoluciones" className="hover:text-white hover:underline transition">
                  Cambios, Devoluciones y Garantías
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: CONTACTO & MEDIOS DE PAGO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">ATENCIÓN & PAGOS</h4>
            <ul className="space-y-2 text-xs text-[#B7D1C1]">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <span>WhatsApp: {settings.phone || '+57 324 445 6597'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#F48FB1] shrink-0" />
                <span>{settings.email || 'info@las3yr.com'}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F48FB1] shrink-0" />
                <span>
                  {settings.city && !settings.city.toLowerCase().includes('medell')
                    ? `${settings.city}, Bolívar`
                    : 'Cartagena de Indias, Bolívar'}
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-white mb-2">
                MEDIOS DE PAGO OFICIALES
              </h5>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#20003C] text-[#FF0076] font-extrabold text-[10px] px-2.5 py-1 rounded-md border border-[#FF0076]/30 shadow-xs">
                  Nequi
                </span>
                <span className="bg-[#163E2B] text-[#A3E635] font-extrabold text-[10px] px-2.5 py-1 rounded-md border border-[#A3E635]/30 shadow-xs">
                  Llave / Transfiya
                </span>
                <span className="bg-[#FAF6F0] text-[#133826] font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow-xs">
                  Contraentrega (Efectivo)
                </span>
              </div>
              <p className="text-[10px] text-[#8DAE99] mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Pagos directos, seguros y verificados</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright and Creator Reference */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#8DAE99] gap-4">
          <div className="text-center md:text-left space-y-1">
            <p>
              © 2026 <strong>Las 3YR — Donde Enith</strong>. Todos los derechos reservados.
            </p>
            <p className="text-[11px] text-[#A6C4B0]">
              Diseño y desarrollo web por{' '}
              <a
                href="https://yordevctg17.netlify.app/"
                target="_blank"
                rel="noreferrer"
                className="text-[#F48FB1] hover:text-white font-bold underline underline-offset-2 transition"
                title="Visitar portafolio de Yordev"
              >
                Yordev
              </a>{' '}
              
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] flex-wrap justify-center">
            <Link to="/politicas-de-privacidad" className="hover:text-white transition">
              Privacidad
            </Link>
            <span>•</span>
            <Link to="/terminos-y-condiciones" className="hover:text-white transition">
              Términos
            </Link>
            <span>•</span>
            <Link to="/politica-de-envios" className="hover:text-white transition">
              Envíos
            </Link>
            <span>•</span>
            <Link to="/cambios-y-devoluciones" className="hover:text-white transition">
              Garantías
            </Link>
            <span>•</span>
            <Link
              to="/admin"
              className="text-[#B7D1C1] hover:text-[#F48FB1] transition flex items-center gap-1 font-medium group"
              title="Acceso de administración privada con doble factor 2FA"
            >
              <ShieldCheck className="w-3 h-3 text-[#F48FB1] group-hover:scale-110 transition-transform" />
              <span>Acceso Panel</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
