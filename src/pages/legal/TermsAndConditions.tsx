import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, ArrowLeft, Shield } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useStore } from '../../context/StoreContext';

export const TermsAndConditions: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-16">
      <SEOHead
        title="Términos y Condiciones Generales de Uso"
        description="Términos y condiciones del servicio, compras y catálogo en línea de Las 3YR - Donde Enith. Medios de pago autorizados, envíos en Colombia y garantías."
        keywords="terminos y condiciones, tienda online colombia, Las 3YR, Donde Enith, compras seguras, Yordev"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2F6] text-[#D83173] text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Condiciones de Compra y Uso</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E2B]">
            Términos y Condiciones del Servicio
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Bienvenido a <strong>Las 3YR — Donde Enith</strong>. Al acceder, navegar o realizar pedidos a través de este portal web o nuestros canales de WhatsApp, aceptas los presentes Términos y Condiciones. Te invitamos a leerlos detenidamente.
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

        {/* Terms Sections */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE9E1] shadow-sm space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              1. Generalidades y Delimitación Territorial (Solo Cartagena)
            </h2>
            <p>
              <strong>Las 3YR — Donde Enith</strong> es una plataforma de venta y comercialización de productos originales de marcas reconocidas de catálogo en Colombia, tales como <strong>Natura, Avon, Yanbal, Leonisa, Ésika y Azzorti</strong>.
            </p>
            <p className="p-3.5 bg-[#FAF6F0] rounded-xl border border-[#E8DCCB] text-stone-800">
              <strong>Territorio de Cobertura:</strong> Las operaciones comerciales, ventas y despachos de Las 3YR se realizan <strong>exclusivamente en la ciudad de Cartagena de Indias (Bolívar, Colombia)</strong>. No prestamos servicio de envíos nacionales ni internacionales. Los domicilios se realizan mediante servicios de plataformas urbanas (DiDi / inDrive), siendo el costo del flete asumido según la tarifa que liquide la app.
            </p>
            <p>
              Garantizamos que todos los artículos ofrecidos son 100% auténticos, adquiridos por canales oficiales de consultoría y distribución autorizada.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              2. Medios de Pago Autorizados
            </h2>
            <p>
              Para garantizar la seguridad y agilidad de tus compras, <strong>Las 3YR</strong> admite exclusivamente los siguientes métodos oficiales de pago:
            </p>
            <div className="space-y-2 pt-2">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#20003C] text-[#FF0076] font-bold text-xs flex items-center justify-center shrink-0">
                  N
                </div>
                <div>
                  <span className="font-bold text-[#163E2B] block">1. Transferencia Nequi</span>
                  <p className="text-xs text-stone-600">
                    Pago directo mediante transferencia a la cuenta Nequi oficial de la tienda. El comprobante de pago se valida y confirma a través de nuestra línea de WhatsApp.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#163E2B] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  LL
                </div>
                <div>
                  <span className="font-bold text-[#163E2B] block">2. Transferencia Llave (Transfiya / Bancolombia / Daviplata)</span>
                  <p className="text-xs text-stone-600">
                    Transferencia instantánea interbancaria utilizando el identificador o número de Llave registrado por la tienda.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E9F3EC] text-[#163E2B] font-bold text-xs flex items-center justify-center shrink-0">
                  $
                </div>
                <div>
                  <span className="font-bold text-[#163E2B] block">3. Efectivo al Contraentrega</span>
                  <p className="text-xs text-stone-600">
                    Pagas en efectivo al momento de recibir tu paquete en la dirección de entrega acordada. Válido en zonas y ciudades con cobertura de entrega contraentrega.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              3. Proceso de Confirmación y Pedidos
            </h2>
            <p>
              Una vez realizada tu solicitud en la web, el pedido entra en estado <em>«Pendiente»</em>. Nuestro equipo se contacta por WhatsApp para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Verificar la disponibilidad en inventario o ciclo de catálogo vigente.</li>
              <li>Reconfirmar dirección exacta, barrio y número de contacto.</li>
              <li>Validar el comprobante de transferencia o programar la entrega contraentrega.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              4. Precios y Promociones
            </h2>
            <p>
              Todos los precios se encuentran expresados en pesos colombianos (COP). Las 3YR se reserva el derecho de modificar precios, ofertas y disponibilidad sin previo aviso según las campañas y ciclos de cada marca. Los pedidos ya confirmados mantendrán el precio acordado.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#163E2B]">
              5. Propiedad Intelectual y Autoría de la Plataforma
            </h2>
            <p>
              Las marcas, logos e imágenes de productos de Natura, Avon, Yanbal, Leonisa, Ésika y Azzorti pertenecen a sus respectivos fabricantes y se utilizan únicamente con fines ilustrativos y de comercialización directa.
            </p>
            <p>
              El diseño visual, desarrollo tecnológico y arquitectura digital de esta tienda han sido creados y desarrollados por <strong>Yordev</strong> (<a href="https://yordevctg17.netlify.app/" target="_blank" rel="noreferrer" className="text-[#D83173] font-semibold hover:underline">https://yordevctg17.netlify.app/</a>).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
