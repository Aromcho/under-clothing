# Under Clothing — tienda online

Web de **Under Clothing** (Villa Gesell · [@under.clothing7](https://www.instagram.com/under.clothing7/)): catálogo con pedido por WhatsApp, panel de administración completo y contenido 100 % real relevado del Instagram.

| | |
|---|---|
| **Web pública** | Next.js 16 (App Router) · Tailwind 4 · motion |
| **API** | NestJS 11 · Drizzle ORM · PostgreSQL 16 |
| **Imágenes** | sharp → WebP en 320/640/960/1440 px + placeholder borroso |
| **Identidad** | Paleta “Rosa empolvado” (`#FFFDFB` `#F5ECE9` `#EBCFCB` `#C99A98` `#1C1A1A`) · tipografía Jost 300/400/500 |

## Instalación en Windows

Requisitos: **Node.js 20.9 o superior** y **Docker Desktop** abierto.

```powershell
cd "Desktop\Proyectos\Under clothing\under-clothing"
npm install
npm run setup
npm run dev
```

- Web: <http://localhost:3000>
- Panel: <http://localhost:3000/admin>
- API: <http://localhost:4000/api>

`npm run setup` hace todo: crea el `.env` con secretos aleatorios, levanta PostgreSQL en Docker (puerto **5433**), corre las migraciones y carga el seed con las 78 prendas, 30 historias, las fotos del showroom y los fondos. El seed procesa unas 250 imágenes: tarda 2 o 3 minutos.

### Usuario administrador

| Email | Contraseña |
|---|---|
| `admin@underclothing.com.ar` | `under2026` |

Se definen en `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) antes de correr el seed. **Cambiá la contraseña** desde *Panel → Usuarios* antes de publicar.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run setup` | `.env` + base de datos + migraciones + seed |
| `npm run dev` | API (4000) y web (3000) con recarga |
| `npm run build` | Compila API y web para producción |
| `npm start` | Levanta lo compilado |
| `npm run db:seed` | Vuelve a cargar el contenido relevado (**borra** lo editado en el panel) |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:generate` | Genera una migración a partir de `apps/api/src/db/schema.ts` |
| `npm run test:e2e` | Verificación con Playwright (con la web corriendo) |

Para `test:e2e` la primera vez: `npx playwright install chromium`. Deja las capturas mobile y desktop de cada página en `capturas/`.

## Estructura

```
under-clothing/
├─ docker-compose.yml        PostgreSQL 16 en el puerto 5433
├─ scripts/                  setup, run (dev/start en paralelo), e2e
├─ apps/
│  ├─ api/                   NestJS
│  │  ├─ src/db/schema.ts    tablas (Drizzle)
│  │  ├─ src/db/seed.ts      seed con el contenido del Instagram
│  │  ├─ src/db/seed-data/   catálogo relevado + relevamiento.json (86 publicaciones)
│  │  ├─ seed/images/        fotos originales (posts, historias, showroom, fondos)
│  │  ├─ drizzle/            migraciones SQL
│  │  └─ uploads/            imágenes procesadas (se genera sola)
│  └─ web/                   Next.js
│     ├─ src/app/(site)/     web pública
│     ├─ src/app/admin/      panel
│     └─ src/components/     HangTag (etiqueta), Stitch (costura), carrito, catálogo…
```

## Web pública

- **Elemento firma: la etiqueta.** El logo es un círculo, igual que una etiqueta colgante de prenda. Cuelga de un hilo en la portada, se balancea con el scroll y se da vuelta al tocarla (muestra cuántos ingresos nuevos hay). Una **costura** se va cosiendo a medida que bajás (vertical en escritorio, bajo el encabezado en el celular) y cada divisor de sección es una puntada que se dibuja al entrar en pantalla.
- **Catálogo** con filtros por categoría, colección, talle y color, orden y búsqueda. Los filtros viven en la URL (se pueden compartir).
- **Ficha de producto**: galería con zoom, colores, talles, stock por variante, guía de talles, productos relacionados.
- **Carrito → pedido**: guarda el pedido en el panel y abre WhatsApp con el mensaje armado. Mientras no haya número de WhatsApp cargado, copia el mensaje y abre el chat de Instagram.
- **Historias** tipo Instagram (la destacada real “EN STOCK” + grupos armados con el catálogo y el showroom).
- **Showroom**: horarios con “Abierto ahora”, mapa y fotos reales del local.
- **SEO**: metadatos, Open Graph, JSON-LD (`ClothingStore`, `Product`, `BreadcrumbList`), `sitemap.xml`, `robots.txt`, manifest e íconos.
- Accesible: navegación por teclado, foco visible, `prefers-reduced-motion`, contraste AA (el rosa nunca es color de texto).

## Panel (`/admin`)

- Login con cookie JWT `httpOnly`. Roles: **admin** (todo) y **editor** (contenido y pedidos; no elimina ni gestiona usuarios).
- **Productos**: variantes de talle y color con stock, fotos con orden por arrastre, precio, colecciones, guía de talles.
- **Pedidos y consultas**: estados, notas internas, botón de responder por WhatsApp. Al confirmar se descuenta el stock; al cancelar se repone.
- **Medios**: subida múltiple (también arrastrando), optimización automática, orden por arrastre.
- **Categorías, colecciones, historias, banners y fotos, beneficios, guía de talles, datos del negocio** (horarios, envíos, cambios, pagos, SEO) y **usuarios**.
- Cada cambio se ve **al instante** en la web: la API avisa a Next qué tags de caché invalidar (`/internal/revalidate`).
- Pensado para el celular: barra inferior, hojas deslizables, botones grandes.

## Lo que falta cargar (no figura en el Instagram)

Todo esto se edita desde el panel; la web ya está preparada para mostrarlo.

1. **Precios**: ninguna publicación los tiene. Las prendas dicen “Consultá el precio” hasta que los cargues.
2. **WhatsApp**: no está en la bio. *Panel → Datos del negocio*. Hasta entonces los pedidos salen por mensaje de Instagram.
3. **Stock y talles**: la mayoría de las publicaciones dicen “consultar talles”. Cada prenda tiene el interruptor *Controlar stock*.
4. **Medios de pago** y **cambios y devoluciones**: las páginas invitan a consultar hasta que se carguen.
5. **Guía de talles**: no hay medidas publicadas.
6. **Logo en alta resolución**: se usó la foto de perfil (150 px). Con el archivo original se reemplaza `apps/web/public/brand/logo.png`.

## Producción (VPS con Nginx)

1. Copiar el proyecto, `npm install`, completar `.env` (`NEXT_PUBLIC_SITE_URL=https://tudominio`, `WEB_URL` igual, secretos propios) y `npm run setup`.
2. `npm run build` y levantar con PM2: `pm2 start "npm start" --name under-clothing` (con `NODE_ENV=production`).
3. Nginx: un `server` nuevo con `proxy_pass http://127.0.0.1:3000;` y Certbot para el certificado. La web ya reenvía `/api` y `/uploads` a la API, así que sólo se expone el puerto 3000. Subir `client_max_body_size` a 25m para las fotos.
4. Hacer backup de la base (`pg_dump`) y de `apps/api/uploads/`.
