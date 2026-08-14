import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Clock, ShieldCheck, CheckCircle2, ArrowLeft, PackageCheck, AlertCircle, Smartphone } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useStore } from '../../context/StoreContext';

export const ShippingPolicy: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-16">
      <SEOHead
        title="Política de Envíos y Entregas en Cartagena"
        description="Venta y entrega exclusiva en la ciudad de Cartagena de Indias. Envíos urbanos realizados a través de DiDi o inDrive con tarifa según la aplicación. No se realizan envíos nacionales ni internacionales."
        keywords="envios cartagena, domicilios cartagena, didi cartagena, indriver cartagena, entrega local cartagena, Las 3YR, Donde Enith, Yordev"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64786A] hover:text-[#163E2B] mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE9E1] shadow-sm mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#163E2B] text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Exclusivo Ciudad de Cartagena</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E2B]">
            Política de Envíos y Domicilios Locales
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            En <strong>Las 3YR — Donde Enith</strong>, comercializamos y entregamos nuestros productos de catálogo <strong>única y exclusivamente en la ciudad de Cartagena de Indias</strong>.
          </p>

          <div className="p-4 bg-[#FFF5F7] border border-[#FAD0DE] rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D83173] shrink-0 mt-0.5" />
            <p className="text-xs text-[#901D4B] leading-relaxed">
              <strong>Aviso Importante:</strong> No contamos con envíos a nivel nacional ni despachos internacionales. Todos nuestros pedidos se entregan dentro del perímetro urbano de Cartagena mediante las plataformas <strong>DiDi</strong> o <strong>inDrive</strong>.
            </p>
          </div>

          <div className="pt-2 text-[11px] text-stone-400">
            Última actualización: Agosto de 2026 • Desarrollado por{' '}
            <a
              href="https://yordevctg17.netlify.app/"
              target="_blank"
              rel="noreferrer"
              className="text-[#D83173] font-bold hover:underline"
            >
              Yordev
            </a>
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-[#EFE9E1] text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E9F3EC] text-[#163E2B] flex items-center justify-center mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-[#163E2B] text-sm">Cobertura Exclusiva</h3>
            <p className="text-xs text-stone-500">
              Barrios y sectores urbanos de <strong>Cartagena de Indias</strong>.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EFE9E1] text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF2F6] text-[#D83173] flex items-center justify-center mx-auto">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-[#163E2B] text-sm">DiDi e inDrive</h3>
            <p className="text-xs text-stone-500">
              Despachos seguros en moto o carro. Tarifa exacta según la app.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EFE9E1] text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#163E2B] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-[#163E2B] text-sm">Pago Flexible</h3>
            <p className="text-xs text-stone-500">
              Paga por <strong>Nequi</strong>, <strong>Llave</strong> o en efectivo al recibir.
            </p>
          </div>
        </div>

        {/* Detailed Policy Text */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE9E1] shadow-sm space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D83173]" />
              <span>1. Delimitación Geográfica y Cobertura</span>
            </h2>
            <p>
              La comercialización de productos de <strong>Las 3YR — Donde Enith</strong> está restringida al área urbana de la ciudad de <strong>Cartagena de Indias (Bolívar, Colombia)</strong>.
            </p>
            <p className="font-semibold text-stone-800">
              No se atienden pedidos con destino a otras ciudades de Colombia ni envíos al exterior.
            </p>
            <p>
              Cubrimos los diferentes sectores de la ciudad, incluyendo Manga, Pie de la Popa, Bocagrande, Castillogrande, El Laguito, Centro Histórico, San Diego, Cabrero, Marbella, Crespo, Los Alpes, Los Calamares, El Pozón, Providencia, Blas de Lezo, Turbaco (zona conurbada sujeta a disponibilidad de conductor), entre otros.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B] flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#D83173]" />
              <span>2. Logística de Entrega (DiDi / inDrive) y Costos de Envío</span>
            </h2>
            <p>
              Para garantizar entregas rápidas y seguras, los despachos se gestionan a través de las aplicaciones móviles de transporte y mensajería urbana <strong>DiDi</strong> o <strong>inDrive</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600">
              <li>
                <strong>Costo Variable:</strong> El valor del envío no es fijo. Depende directamente de la distancia entre nuestro punto de despacho en Cartagena y la dirección de entrega, el estado del tráfico, el clima y la tarifa dinámica calculada por DiDi o inDrive al momento de solicitar el servicio.
              </li>
              <li>
                <strong>Modalidad de Pago del Domicilio:</strong> El costo del viaje se cancela directamente al conductor de la aplicación al momento de recibir el paquete o se añade a la transferencia previa según lo coordinado por WhatsApp.
              </li>
              <li>
                <strong>Seguimiento en Vivo:</strong> Una vez asignado el conductor en la app, compartimos contigo el enlace o captura del viaje para que puedas monitorear la ruta del mensajero en tiempo real.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D83173]" />
              <span>3. Tiempos de Entrega</span>
            </h2>
            <p>
              - <strong>Productos en Inventario Inmediato:</strong> Se programan y despachan el mismo día o al día siguiente hábil una vez confirmado el pedido por WhatsApp.
            </p>
            <p>
              - <strong>Productos de Campaña / Catálogo por Pedido:</strong> Se informará la fecha estimada de llegada del pedido de catálogo (Natura, Yanbal, Avon, Leonisa, Ésika o Azzorti) y, al tenerlo listo, se programa el despacho por DiDi/inDrive.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#D83173]" />
              <span>4. Coordinación y Confirmación por WhatsApp</span>
            </h2>
            <p>
              Todo pedido debe ser reconfirmado a través de nuestra línea oficial de WhatsApp antes de solicitar el vehículo en la app. Nuestro asesor verificará que te encuentres disponible en la dirección indicada para recibir el paquete y evitar contratiempos con el conductor.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
