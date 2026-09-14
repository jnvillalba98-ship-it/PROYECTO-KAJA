# KAJA — Sistema de gestión empresarial

KAJA centraliza inventario, ventas, usuarios, roles y acceso por empresa en una sola interfaz oscura/dorada.
Frontend estático + backend Node.js + Express + MySQL + JWT.

## Estructura
```text
PROYECTO KAJA/
├── KAJA-FRONTED/ (landing pública, assets/logo-kaja.png)
├── LOGIN-KAJA/ (panel interno: index.html, css/style.css, js/api.js, js/main.js)
├── kaja-server/ (server.js, config/, routes/, controllers/, services/, database/kaja.sql)
└── README.md
```

## Tecnologías
- Frontend: HTML5, CSS3, JS vanilla, Bootstrap 5, Chart.js
- Backend: Node.js, Express, JWT, bcryptjs, CORS
- DB: MySQL (Laragon/XAMPP)
- Herramientas: pnpm/npm, Git

## Instalación
```bash
# 1. DB
CREATE DATABASE kaja;
# importar kaja-server/database/kaja.sql (o node database/migrate.js)

# 2. Backend
cd "PROYECTO KAJA/kaja-server"
cp .env.example .env  # DB_HOST=localhost DB_USER=root DB_PASSWORD= DB_NAME=kaja DB_PORT=3306 PORT=3000 JWT_SECRET=...
pnpm install
node server.js
# http://localhost:3000  | front: http://localhost:3000/LOGIN-KAJA/
```

## Credenciales demo
```text
Empresa: Empresa 1 / NIT: 900000001-1 / Pass: Kaja123
Usuario: admin / Pass: Kaja123 / Rol: ADMINISTRADOR
Roles: ADMINISTRADOR, CAJERO, INVENTARIO
```

## Flujo
1. Login empresa (NIT+pass) → guarda empresaSession → habilita login staff.
2. Login usuario (usuario+rol+pass, JWT) → guarda token → carga productos → dashboard.
3. Dashboard: 4 KPIs + filtros Desde/Hasta + visor estadístico + Top/Stock crítico/Cajeros/Resumen.
4. Ventas: buscar por código/nombre, carrito, IVA 19%, crear venta (descuenta stock), ver/anular factura, exportar Excel.
5. Inventario: tabla real API, crear/editar/desactivar, categorías, exportar.
6. Admin: empresas/usuarios/roles CRUD real con validación pass ≥8.

## Dashboard estadístico (nuevo)
- Solo 4 cuadros: Ventas día, Facturas día, Ticket promedio, Valor inventario.
- Filtro `dash-filter-bar` responsive (antes se cortaba): Desde/Hasta/Filtrar a `/api/reportes/dashboard`.
- Visor grande `kaja-viewer` (canvas 340px) con selector:
  BARRAS (ventas por categoría), LÍNEA (ventas por día), PASTEL (proporción), HISTOGRAMA (6 intervalos precios), DISPERSIÓN (scatter stock vs precio), CAJA/Boxplot (min/Q1/mediana/Q3/max con CSS).
- Rotación automática: botón Auto ▶/Pausar, barra `kaja-rotate-bar` (6s por gráfico), click manual detiene auto.
- Funciones en `LOGIN-KAJA/js/main.js` (comentadas en español): `dibujarEstadisticasKaja`, `mostrarStatKaja`, `dibujarCajaKaja`, `activarBotonesStatKaja`, `iniciarAutoStatKaja`, `detenerAutoStatKaja`.

## Logins (nuevo)
- Logo único `../KAJA-FRONTED/assets/logo-kaja.png` en empresa, admin y brand-bar (antes admin usaba otro archivo pequeño).
- CSS iguala tamaño: `.card-logo 72px` (60px móvil), `.brand-mini-logo 64px`, `object-fit:contain`, responsive.
- Mismo estilo, sin romper conexión `KajaApi.companyLogin/login`.

## Buenas prácticas aplicadas
- Funciones pequeñas, nombres claros, sin duplicar lógica.
- Se eliminó `renderDashboardStats` en desuso; `renderDashboardChart` queda solo como compatibilidad del mini-chart oculto.
- Comentarios en español en `main.js` (cabecera + visor), `api.js` (endpoints), `server.js` (rutas/estáticos), `style.css` (secciones KAJA fix/viewer).
- Validaciones: pass ≥8, rol válido, fechas Desde/Hasta, manejo try/catch con mensajes.
- Conexión intacta: `server.js` sirve `/LOGIN-KAJA` y `/KAJA-FRONTED`, CORS abierto, `/api/health`; `api.js` con `health/syncCache/badge`.

## API principal
- `POST /api/auth/empresa` `POST /api/auth/login` `GET /api/auth/perfil`
- `GET /api/reportes/dashboard?desde&hasta` `GET /api/reportes/inventario`
- `GET/POST /api/productos` `PUT /api/productos/:id` `PATCH /api/productos/:id/estado`
- `GET/POST /api/categorias` `PUT /api/categorias/:id`
- `GET/POST /api/ventas` `GET /api/ventas/:id` `PATCH /api/ventas/:id/anular`
- `GET/POST /api/empresas` `GET/POST /api/usuarios` `GET /api/roles`
- `GET /api/exportaciones/*` (inventario, ventas, usuarios en Excel)

## Archivos clave comentados
- `LOGIN-KAJA/js/main.js`: cabecera + visor + CRUD, todo en español.
- `LOGIN-KAJA/js/api.js`: puente fetch + token + exports Excel.
- `LOGIN-KAJA/css/style.css`: secciones `KAJA fix barra filtros`, `logos mismo tamaño`, `visor grande con rotación`.
- `kaja-server/server.js`: Express + estáticos + rutas API + health.

## Mejoras 2026-09-12 (entrega por partes completas, sin dejar a medias)
- [x] Toasts `toastKaja(msg,tipo)` en `LOGIN-KAJA/js/main.js`: reemplaza `alert()` bloqueante, auto-cierra 3.2s, tipos ok/err/warn.
- [x] Bloqueo stock frontend en `addProductToCart`: valida `stock` vs carrito, toast `STOCK INSUFICIENTE`, no deja agregar de más.
- [x] Medio de pago + stock backend: `ventas.metodo_pago` (EFECTIVO/NEQUI/DAVIPLATA/TRANSFERENCIA/TARJETA), auto-crea columna, valida stock en transacción, selector en caja, columna Pago en facturas y ticket, filtro `?metodo_pago=`.
- [x] Inventario: columna **Categoría** en la tabla + botón **Eliminar definitivo** real (`DELETE /api/productos/:id?forzar=1`), desvincula detalles de venta y borra movimientos para no romper historial.
- [x] Landing (`KAJA-FRONTED`): el panel del hero ahora es un **mockup del dashboard real** (sidebar, 4 KPIs, gráfico de ventas y top productos) en `main.js` + estilos `.kaja-dash-*` en `style.css`.
- [x] Iconos del dashboard: reemplazados por **Font Awesome** (`fa-sack-dollar`, `fa-file-invoice`, `fa-receipt`, `fa-boxes-stacked`) en `LOGIN-KAJA/index.html` + KPIs.
- [x] Factura **legislación colombiana (DIAN)**: encabezado con NIT, régimen, dirección/teléfono, resolución de facturación, adquiriente consumidor final, IVA 19% discriminado, **CUFE**, leyenda Art. 774 C.Co. y pie legal (`.ticket-legal`).
- [ ] Desarrollador: edición inline (no solo diálogos prompt) — pendiente.

## Estado
Demo local funcional. Para producción: JWT secreto fuerte, HTTPS, paginación total, permisos por rol en backend, backup `kaja.sql`.
