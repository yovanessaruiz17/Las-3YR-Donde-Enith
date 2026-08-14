import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle2, ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { useStore } from '../../context/StoreContext';

export const PrivacyPolicy: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-16">
      <SEOHead
        title="Políticas de Privacidad y Tratamiento de Datos"
        description="Política de Tratamiento y Protección de Datos Personales de Las 3YR - Donde Enith en cumplimiento de la Ley 1581 de 2012 de la República de Colombia."
        keywords="privacidad, datos personales, Ley 1581 de 2012, Las 3YR, Donde Enith, Colombia, proteccion de datos, Yordev"
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
            <Shield className="w-3.5 h-3.5 text-[#163E2B]" />
            <span>Marco Legal Colombia • Ley 1581 de 2012</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E2B]">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            En <strong>Las 3YR — Donde Enith</strong>, valoramos y respetamos la confianza que depositas en nosotros. Esta política describe cómo recolectamos, utilizamos, almacenamos y protegemos tus datos personales conforme al régimen legal vigente de protección de datos en la República de Colombia.
          </p>

          <div className="pt-2 text-[11px] text-stone-400">
            Última actualización: Agosto de 2026 • Plataforma desarrollada por{' '}
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

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE9E1] shadow-sm space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#163E2B]">
              <FileText className="w-5 h-5 text-[#D83173]" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">1. Responsable del Tratamiento</h2>
            </div>
            <p>
              El responsable del tratamiento de los datos recolectados en esta tienda virtual es <strong>Las 3YR — Donde Enith</strong>, con domicilio en la ciudad de {settings.city || 'Cartagena'}, Bolívar, Colombia.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li><strong>Nombre Comercial:</strong> Las 3YR — Donde Enith</li>
              <li><strong>Línea WhatsApp Oficial:</strong> {settings.phone || '+57 324 445 6597'}</li>
              <li><strong>Correo Electrónico de Contacto:</strong> {settings.email || 'info@las3yr.com'}</li>
              <li><strong>Ubicación y Despachos:</strong> {settings.city || 'Cartagena'}, Bolívar, Colombia (Venta y entrega exclusiva en Cartagena)</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#163E2B]">
              <Eye className="w-5 h-5 text-[#D83173]" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">2. Datos Personales que Recolectamos</h2>
            </div>
            <p>
              Para gestionar tus compras, envíos y consultas, podemos solicitar los siguientes datos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1]">
                <span className="font-bold text-[#163E2B] block mb-1">Datos de Identificación</span>
                <p className="text-[11px] text-stone-500">Nombre completo, número de cédula o documento (cuando aplique para facturación o entrega).</p>
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1]">
                <span className="font-bold text-[#163E2B] block mb-1">Datos de Contacto</span>
                <p className="text-[11px] text-stone-500">Teléfono celular, número de WhatsApp y dirección de correo electrónico.</p>
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1]">
                <span className="font-bold text-[#163E2B] block mb-1">Datos de Envío</span>
                <p className="text-[11px] text-stone-500">Dirección completa de residencia, ciudad, departamento y notas de entrega.</p>
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EFE9E1]">
                <span className="font-bold text-[#163E2B] block mb-1">Información de Pago</span>
                <p className="text-[11px] text-stone-500">Método seleccionado (Nequi, Llave o Efectivo contraentrega). No almacenamos números de tarjetas bancarias.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#163E2B]">
              <CheckCircle2 className="w-5 h-5 text-[#D83173]" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">3. Finalidad del Tratamiento de los Datos</h2>
            </div>
            <p>
              La información recolectada se utiliza exclusivamente para los siguientes propósitos legítimos:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>Procesar, despachar y entregar los pedidos realizados en la tienda online.</li>
              <li>Coordinar entregas y confirmar comprobantes de transferencia (Nequi o Llave) vía WhatsApp.</li>
              <li>Atender solicitudes de asesoría personalizada, peticiones, quejas y reclamos (PQR).</li>
              <li>Enviar notificaciones sobre el estado del pedido, guías de envío y promociones exclusivas si el usuario lo ha consentido.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#163E2B]">
              <Lock className="w-5 h-5 text-[#D83173]" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">4. Derechos del Titular (Habeas Data)</h2>
            </div>
            <p>
              De conformidad con el Artículo 8 de la Ley 1581 de 2012, tú como titular de los datos tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li><strong>Conocer, actualizar y rectificar</strong> tus datos personales frente a Las 3YR.</li>
              <li><strong>Solicitar prueba</strong> de la autorización otorgada para el tratamiento de tus datos.</li>
              <li><strong>Ser informado</strong> sobre el uso que se le ha dado a tu información.</li>
              <li><strong>Revocar la autorización</strong> o solicitar la supresión de tus datos cuando consideres que no se respetan los principios legales.</li>
            </ul>
          </section>

          {/* Section 5: Canal de Atención */}
          <section className="p-6 bg-[#FAF6F0] rounded-2xl border border-[#E9DFD3] space-y-3">
            <h3 className="font-bold text-[#163E2B]">¿Deseas ejercer tus derechos o consultar tus datos?</h3>
            <p className="text-xs text-stone-600">
              Puedes comunicarte directamente con nuestra administración a través de los canales oficiales:
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold">
              <a
                href={`https://wa.me/${(settings.whatsapp || '+573244456597').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[#163E2B] hover:text-[#25D366]"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp: {settings.phone || '+57 324 445 6597'}</span>
              </a>
              <a
                href={`mailto:${settings.email || 'info@las3yr.com'}`}
                className="inline-flex items-center gap-1.5 text-[#163E2B] hover:text-[#D83173]"
              >
                <Mail className="w-4 h-4 text-[#D83173]" />
                <span>{settings.email || 'info@las3yr.com'}</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
