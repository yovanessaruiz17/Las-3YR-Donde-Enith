# Guía Completa de Conexión a Supabase y Despliegue en Netlify vía GitHub
**Proyecto:** Las 3YR — Donde Enith (Cartagena de Indias)  
**Desarrollado por:** [Yordev](https://yordevctg17.netlify.app/)

---

## 📌 PARTE 1: Configuración de Supabase (Base de Datos PostgreSQL)

### 1.1 Crear el proyecto en Supabase
1. Ingresa a [https://supabase.com/](https://supabase.com/) e inicia sesión con tu cuenta de GitHub o correo.
2. Haz clic en **"New Project"** (Nuevo Proyecto).
3. Asigna un nombre a tu proyecto (ej: `las3yr-store`), crea una contraseña segura de base de datos y selecciona la región más cercana (ej: `South America (São Paulo)` o `East US`).
4. Espera 1-2 minutos mientras Supabase aprovisiona la base de datos.

### 1.2 Ejecutar las Tablas y Políticas de Seguridad (SQL)
1. En el menú lateral izquierdo de Supabase, entra a **"SQL Editor"** (ícono de terminal `>_`).
2. Haz clic en **"New query"** (+).
3. Abre el archivo `supabase-schema.sql` de este proyecto, copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Presiona el botón verde **"Run"** (o presiona `Ctrl + Enter` / `Cmd + Enter`).
5. ¡Listo! Se habrán creado todas las tablas (`products`, `categories`, `brands`, `orders`, `order_items`, `store_settings`, `announcements`, `banners`, `newsletter_subscribers`, `contact_messages`), las políticas de seguridad RLS y los buckets de almacenamiento de imágenes.

### 1.3 Obtener tus Credenciales API
1. En el menú lateral de Supabase, ve a **"Project Settings"** (ícono de engranaje ⚙️) -> **"API"**.
2. Copia los siguientes dos valores:
   - **Project URL** (ej: `https://xyzcompany.supabase.co`)
   - **anon / public key** (una clave larga que empieza por `eyJh...`)

---

## 📌 PARTE 2: Subir el Proyecto a GitHub

Si aún no has subido el proyecto a un repositorio de GitHub:

1. Crea un nuevo repositorio en [https://github.com/new](https://github.com/new) (ej: `las3yr-cartagena`).
2. En tu terminal o consola local en la carpeta del proyecto, ejecuta:
   ```bash
   git init
   git add .
   git commit -m "feat: tienda online Las 3YR Cartagena con soporte Supabase y Netlify"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/las3yr-cartagena.git
   git push -u origin main
   ```

---

## 📌 PARTE 3: Despliegue en Netlify desde GitHub

### 3.1 Conectar repositorio en Netlify
1. Ve a [https://www.netlify.com/](https://www.netlify.com/) e inicia sesión.
2. Haz clic en **"Add new site"** -> **"Import an existing project"**.
3. Selecciona **GitHub** y autoriza a Netlify para acceder a tus repositorios.
4. Elige tu repositorio `las3yr-cartagena`.

### 3.2 Configuración del Build
Netlify detectará automáticamente el archivo `netlify.toml` ya incluido en el proyecto:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### 3.3 Configurar Variables de Entorno en Netlify
Antes de presionar "Deploy", haz clic en **"Add environment variables"** (o ve a *Site configuration -> Environment variables* después de crear el sitio) y añade:

| Clave (Key) | Valor (Value) |
|---|---|
| `VITE_SUPABASE_URL` | Tu Project URL de Supabase (ej: `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Tu clave anon public de Supabase (`eyJhbGci...`) |
| `VITE_STORE_WHATSAPP` | `+573244456597` |
| `VITE_STORE_NAME` | `Las 3YR - Donde Enith` |

### 3.4 Desplegar
1. Haz clic en **"Deploy site"**.
2. En menos de 1 minuto tu tienda estará online en producción con certificado SSL gratis (`https://tu-sitio.netlify.app`). Cada vez que hagas `git push` a la rama `main`, Netlify compilará y actualizará el sitio automáticamente.

---

## 📌 PARTE 4: Verificación y Soporte Local

- Si pruebas en local, puedes crear un archivo `.env` con las mismas variables:
  ```env
  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
  VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
  ```
- Si las variables no están configuradas, el sistema activa automáticamente el **modo local de contingencia (`localStorage`)**, asegurando que la tienda nunca se caiga.
