# 📜 Guías de Desarrollo y Arquitectura - Portal Colmillo de Acero

Este documento establece las mejores prácticas, convenciones y estrategias de arquitectura para el portal web de la hermandad **Colmillo de Acero**. Su propósito es asegurar que cada iteración mantenga un estándar alto de seguridad, escalabilidad, rendimiento y enfoque a la conversión.

---

## 🏗️ 1. Arquitectura del Sistema

El portal está construido sobre un stack moderno y eficiente (JAMstack modificado):
- **Frontend Framework:** [Astro](https://astro.build/) (Renderizado Híbrido: SSG para contenido estático, SSR para paneles de administración y APIs).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first, diseño altamente responsivo y temático).
- **Interactividad:** [Alpine.js](https://alpinejs.dev/) (Reactividad ligera del lado del cliente, ideal para evitar el overhead de React/Vue en interfaces simples).
- **Backend / Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL, Autenticación, Edge Functions).
- **Integraciones Críticas:** Addon Lua (RaidDominion), Webhooks de Discord, API de IA (Groq).

---

## 💻 2. Estándares de Desarrollo Frontend

### Astro y Renderizado
- **Pre-renderizado por defecto:** Mantener `export const prerender = true` en páginas de contenido (Guías, Index, Reglas) para máxima velocidad (SSG).
- **SSR solo cuando sea necesario:** Usar Server-Side Rendering (`prerender = false`) estrictamente para páginas que requieran datos en tiempo real (Panel Admin) o endpoints de API (`/api/*`).

### Alpine.js (Mejores Prácticas)
- **Evitar Colisiones de Sintaxis:** Astro y Alpine usan sintaxis similares para variables. **NUNCA** uses *template literals* (backticks `` `${var}` ``) de Astro dentro de atributos de Alpine (`x-data`, `@click`, etc.), ya que causa errores de compilación (`Expected ")" but found "$"`).
  - ❌ *Incorrecto:* `x-data={ \`{ id: ${id} }\` }`
  - ✅ *Correcto:* `x-data={"{" + "id: '" + id + "'" + "}"}` o inyectar datos globales vía `<script>`.
- **Estado Global:** Para estados compartidos entre componentes, usar `Alpine.store()`.

### Diseño y UI/UX (Enfoque a Conversión)
- **Esquema de Colores "Místico 2026":** Mantener la paleta basada en `Indigo`, `Purple`, `Teal` y `Amber` (ej. `bg-gradient-to-br from-indigo-950/80 via-gray-900/90 to-purple-900/60`). Evitar grises planos.
- **Micro-interacciones:** Toda acción del usuario (clic, drag & drop) debe tener feedback inmediato. Usar `window.showToast()` para notificaciones de éxito/error.
- **Llamados a la Acción (CTAs):** Los botones principales (ej. "Apuntarse a la Raid") deben destacar con colores vibrantes (Amber/Red) y efectos de hover (`hover:scale-105`, `shadow-amber-500/20`).

---

## 🗄️ 3. Gestión de Datos (Supabase)

- **Normalización Obligatoria:** Los datos críticos para búsquedas deben normalizarse antes de insertarse o consultarse.
  - Ejemplo: Días de la semana sin acentos (`sábado` -> `sabado`).
- **Consultas Optimizadas:** Usar `.select('campo1, campo2')` en lugar de `.select('*')` cuando los payloads sean grandes.
- **Búsqueda Difusa (Fuzzy Search):** Para nombres de bandas (Raid ID), usar patrones flexibles (ej. reemplazar espacios por `%` y usar `.ilike`) para prevenir fallos si el usuario o el addon Lua envían datos con espacios extra (ej. "ICC 10N" vs "ICC10N").

---

## 🔒 4. Seguridad

- **Protección de Endpoints API:**
  - Los endpoints automatizados (ej. auto-generación de blog) **deben** estar protegidos por un token estático (ej. `CRON_TOKEN` en `import.meta.env`).
  - Los endpoints de administración (`move-registrations`, `clear-officer-data`) deben validar los datos de entrada (sanitización básica) y eventualmente verificar la sesión activa de Supabase.
- **Row Level Security (RLS):** Asegurar que las políticas en Supabase estén activas. La tabla `raid_registrations` debe permitir inserciones públicas, pero actualizaciones/borrados solo mediante roles de `admin` o llamadas seguras del servidor (SSR).

---

## ⚡ 5. Rendimiento y Optimización

- **Sistemas de Partículas (Fondo Mágico):**
  - **Usar Canvas API:** Las animaciones masivas (como `MagicBackground.astro`) deben hacerse en `<canvas>` con `requestAnimationFrame`, nunca con cientos de elementos DOM manipulados por CSS, para no saturar la CPU/GPU.
  - **Adaptabilidad (Responsive Density):** Detectar el ancho de pantalla (`window.innerWidth`) para reducir la cantidad de partículas en dispositivos móviles (ahorro de batería y rendimiento).
- **Gestión de Imágenes:** Todas las imágenes grandes (`background.png`, mascotas) deben estar comprimidas (preferiblemente en WebP) y tener una estructura de `z-index` clara para no tapar interacciones del DOM.

---

## 🤖 6. Integraciones (Discord y Lua)

- **Webhooks de Discord:**
  - **Identidad Visual:** Los mensajes deben incluir siempre avatares, thumbnails o imágenes representativas (ej. `mascotaAnuncios.png`) alojadas en la URL de producción (`https://colmillo.netlify.app/...`).
  - **Manejo de Tiempos (Timezones):** Las fechas calculadas en el servidor para notificaciones deben usar la función centralizada `getGuildTime()` (configurada en Europe/Madrid) para evitar desfases de horas causados por el servidor de Netlify (UTC).
- **Addon Lua (RaidDominion):**
  - El endpoint de ingesta (`upload-lua`) debe ser capaz de manejar JSON malformados o strings truncados mediante bloques `try/catch` robustos.

---

*Estas guías son un documento vivo. Toda nueva iteración o feature debe validarse contra estos principios para mantener el portal Colmillo de Acero como una herramienta de primer nivel.*
