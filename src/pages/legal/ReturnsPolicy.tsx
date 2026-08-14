import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ShieldCheck, AlertTriangle, CheckCircle2, ArrowLeft, MessageCircle, FileQuestion } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useStore } from '../../context/StoreContext';

export const ReturnsPolicy: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-16">
      <SEOHead
        title="Política de Cambios, Devoluciones y Garantías"
        description="Política de Cambios, Devoluciones y Garantías de Las 3YR - Donde Enith. Derecho de retracto y garantías de productos de catálogo conforme a la Ley 1480 de 2011."
        keywords="garantias, devoluciones colombia, cambios de producto, derecho de retracto, ley 1480, Las 3YR, Donde Enith, Yordev"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F0] text-[#163E2B] text-xs font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Estatuto del Consumidor • Ley 1480 de 2011</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E2B]">
            Política de Cambios, Devoluciones y Garantías
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Tu satisfacción y tranquilidad son nuestra prioridad. En <strong>Las 3YR — Donde Enith</strong>, respaldamos la calidad de todos nuestros productos con políticas transparentes y alineadas con la legislación colombiana de protección al consumidor.
          </p>

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

        {/* Details Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE9E1] shadow-sm space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              1. Derecho de Retracto (Compras por Canales No Presenciales)
            </h2>
            <p>
              De conformidad con el Artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), tienes derecho a retractarte de tu compra dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la fecha de entrega del producto.
            </p>
            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1]">
              <span className="font-bold text-[#163E2B] block mb-1">Requisitos para aplicar al retracto:</span>
              <ul className="list-disc pl-5 space-y-1 text-stone-600 text-xs">
                <li>El producto debe conservarse nuevo, sin señales de uso, con sus precintos, termosellados y etiquetas originales intactas.</li>
                <li>Los costos de transporte y demás que conlleve la devolución del bien serán asumidos por el consumidor, conforme a la ley.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              2. Excepciones al Derecho de Retracto y Cambios
            </h2>
            <p>
              Por estrictas razones de salud pública, higiene y bioseguridad, <strong>no se aceptan cambios ni devoluciones en:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Prendas de uso personal e íntimo (ropa interior, fajas, panties, tops abiertos).</li>
              <li>Cosméticos, labiales, máscaras de pestañas y cremas que hayan sido abiertos o desprecintados.</li>
              <li>Perfumería con atomizador accionado o sin su celofán original.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              3. Garantía por Defectos de Fábrica
            </h2>
            <p>
              Todos nuestros productos de Natura, Avon, Yanbal, Leonisa, Ésika y Azzorti cuentan con el respaldo y la garantía de sus respectivas marcas fabricantes. Si recibes un artículo con defecto de fábrica (por ejemplo: válvula de perfume averiada, empaque roto de origen o producto defectuoso), gestionaremos el cambio o reposición sin costo adicional para ti.
            </p>
          </section>

          {/* Section 4: Cómo solicitar */}
          <section className="p-6 bg-[#FAF6F0] rounded-2xl border border-[#E9DFD3] space-y-3">
            <h3 className="font-bold text-[#163E2B] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span>¿Cómo tramitar una garantía o cambio?</span>
            </h3>
            <p className="text-xs text-stone-600">
              Escríbenos directamente a nuestro WhatsApp oficial con el número de tu pedido o foto de la factura y una foto/video del producto. Te brindaremos respuesta en menos de 24 horas hábiles.
            </p>
            <a
              href={`https://wa.me/${(settings.whatsapp || '+573244456597').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, necesito asesoría sobre una garantía o cambio en Las 3YR.')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#163E2B] hover:bg-[#102B1E] text-white text-xs font-bold uppercase tracking-wider transition"
            >
              Contactar por WhatsApp
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};
