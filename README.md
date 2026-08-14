# 🛍️ Las 3YR — Donde Enith
### Plataforma de Comercio Electrónico & Catálogo Multimarca (Cartagena de Indias)

> **Desarrollado y Diseñado por:** [Yordev](https://yordevctg17.netlify.app/)  
> **Ubicación Oficial:** Cartagena de Indias, Bolívar, Colombia  
> **Contacto WhatsApp:** [+57 324 445 6597](https://wa.me/573244456597)  
> **Sitio Web Oficial:** [https://las3yr.com](https://las3yr.com)

---

## 📖 Descripción del Proyecto

**Las 3YR — Donde Enith** es una tienda online y catálogo digital multimarca especializada en productos 100% originales de belleza, perfumería, cuidado facial, cuidado corporal, moda íntima y artículos para el hogar.

La plataforma comercializa y despacha sus productos **exclusivamente en la ciudad de Cartagena de Indias**, integrando envíos urbanos por medio de **DiDi** e **inDrive**, asesoría personalizada por WhatsApp y métodos oficiales de pago (**Nequi**, **Llave / Transfiya** y **Contraentrega en Efectivo**).

---

## ✨ Características Principales

- **🛍️ Catálogo Multimarca Oficial:**
  - **Natura:** Cosmética sustentable, perfumería (Ekos, Tododia, Kaiak, Essencial), pulpas de manos y cuidados faciales.
  - **Avon:** Tratamientos faciales Anew, perfumería Far Away y maquillaje Color Trend.
  - **Yanbal:** Alta perfumería (Ccori, Temptation, Ohm), joyería fina con baño en oro de 24k y cuidado facial Sentiva.
  - **Leonisa:** Prendas íntimas femeninas y masculinas, fajas moldeadoras y tecnología en confort.
  - **Ésika:** Labiales Colorfix de larga duración, perfumería de prestigio (Mithyka, Kalos, Red Power).
  - **Azzorti (Dupree):** Hogar, cocina, lencería de cama y accesorios prácticos.

- **📍 Cobertura y Logística Exclusiva en Cartagena:**
  - Despachos locales coordinados vía **DiDi** o **inDrive** con tarifa dinámica según la app.
  - Opción de recogida personal acordada por WhatsApp.
  - No se realizan envíos nacionales ni internacionales.

- **💳 Métodos de Pago Oficiales:**
  1. **Transferencia Nequi:** Pago directo al número oficial de la tienda.
  2. **Transferencia Llave / Transfiya:** Pagos interbancarios inmediatos.
  3. **Efectivo al Contraentrega:** Pago directo al conductor o repartidor al recibir en Cartagena.

- **🛠️ Panel de Administración Completo:**
  - Gestión integral de productos, categorías, marcas, banners y anuncios.
  - Control y cambio de estados de pedidos (Pendiente, En Preparación, Despachado por DiDi/inDrive, Entregado, Cancelado).
  - Visualización de mensajes de contacto y suscriptores al boletín.
  - Asistente de sincronización y diagnóstico en vivo con base de datos **Supabase**.

- **🔍 SEO & GEO (Generative Engine Optimization):**
  - Schema.org JSON-LD para `OnlineStore`, `FAQPage` y `WebSite`.
  - Meta tags geográficos orientados a Cartagena de Indias (`CO-BOL`).
  - Archivo `public/llms.txt` para motores de búsqueda de IA.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Iconografía & Animaciones:** Lucide React, Motion (`motion/react`)
- **Enrutamiento:** React Router DOM v6
- **Base de Datos & Backend:** Supabase (PostgreSQL, Row Level Security, Storage Buckets) con fallback a LocalStorage
- **Despliegue & Hosting:** Netlify (con soporte SPA mediante `netlify.toml` y `_redirects`)

---

## 📦 Estructura del Proyecto

```
├── .env.example              # Plantilla de variables de entorno
├── index.html                # Entrada HTML con Meta Tags GEO y Schema JSON-LD
├── netlify.toml              # Configuración de compilación y headers para Netlify
├── package.json              # Dependencias y scripts de ejecución
├── public/
│   ├── _redirects            # Regla de redirección SPA para Netlify
│   └── llms.txt              # Manifiesto de contexto para modelos de IA
├── src/
│   ├── components/           # Componentes UI organizados (cart, home, layout, common)
│   ├── context/              # Estados globales (StoreContext, AuthContext)
│   ├── data/                 # Catálogo inicial y configuraciones predeterminadas
│   ├── lib/                  # Cliente y configuración de Supabase
│   ├── pages/                # Vistas principales y páginas legales (/legal)
│   ├── services/             # Lógica de datos (storeService) y utilidades
│   ├── types/                # Definiciones de TypeScript
│   ├── App.tsx               # Enrutador y layout principal
│   └── main.tsx              # Entrada de React
├── supabase-schema.sql       # Script SQL para tablas, RLS y almacenamiento en Supabase
├── SUPABASE_NETLIFY_GUIDE.md # Guía paso a paso de Supabase y Netlify
└── README.md                 # Documentación general del repositorio
```

---

## ⚙️ Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/las3yr-cartagena.git
cd las3yr-cartagena
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
VITE_STORE_WHATSAPP=+573244456597
VITE_STORE_NAME=Las 3YR - Donde Enith
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

### 5. Compilar para producción
```bash
npm run build
```

---

## 🗄️ Configuración de la Base de Datos (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Entra al **SQL Editor**, copia todo el contenido de `supabase-schema.sql` y ejecútalo (**Run**).
3. Copia tu `Project URL` y `anon public key` desde **Project Settings → API** y colócalas en tus variables de entorno.
4. Ingresa al panel de administración de la tienda (`/admin`) en la pestaña **"Supabase & Netlify"** y haz clic en **"Poblar Catálogo Inicial a Supabase"** para cargar todos los productos y categorías en la nube.

---

## 🌐 Despliegue en Netlify vía GitHub

1. Sube tu código a un repositorio en **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: tienda online Las 3YR Cartagena"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/las3yr-cartagena.git
   git push -u origin main
   ```
2. En [Netlify](https://www.netlify.com/), selecciona **Add new site → Import an existing project** y vincula tu repositorio de GitHub.
3. Configura las variables de entorno en Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz clic en **Deploy site**. ¡El despliegue se actualizará automáticamente con cada `git push`!

---

## 👨‍💻 Autor y Créditos

- **Desarrollador Web & Arquitecto de Software:** **Yordev**
- **Portafolio Oficial:** [https://yordevctg17.netlify.app/](https://yordevctg17.netlify.app/)
- **Propietaria & Asesora:** Enith (*Las 3YR — Donde Enith*)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo correspondiente para más detalles.
