/**
 * KAJA - PANEL INTERNO (FRONTEND).
 * FUNCIONES PEQUENAS, NOMBRES CLAROS Y SIN CODIGO DUPLICADO.
 * - LOGIN EMPRESA + LOGIN USUARIO CON JWT (VER JS/API.JS Y KAJA-SERVER).
 * - DASHBOARD CON 4 KPIS + VISOR ESTADISTICO (BARRAS, LINEA, PASTEL, HISTOGRAMA, DISPERSION, CAJA).
 * - VENTAS, INVENTARIO, EMPRESAS, USUARIOS Y ROLES CONSUMEN LA API REAL.
 * - LOGO UNICO EN TODOS LOS LOGINS CON TAMANO RESPONSIVE.
 */
const app = document.getElementById('app');
/* BASE DE LA API DEL BACKEND KAJA */
/* API_URL removed - now uses window.location.origin via KajaApi from api.js */

const state = {
  companyValidated: false,
  token: null,
  user: null,
  role: null,
  dashboardReport: null,
  dashboardChartInstance: null,
  loginMode: 'select'
};

const DEFAULT_USER = 'admin';
const DEFAULT_PASSWORD = 'Kaja123';
const DEFAULT_NIT = '900000001-1';
const DEFAULT_COMPANY_NAME = 'Empresa 1';
const DEFAULT_CATEGORIES = ['Panadería', 'Bebidas', 'Carnes', 'Limpieza', 'Abarrotes', 'General'];

const STORAGE_KEYS = {
  categorias: 'kajaCategorias',
  empresas: 'kajaEmpresas',
  usuarios: 'kajaUsuarios',
  roles: 'kajaRoles'
};

function getStorageCollection(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch (error) {
    console.warn(`No se pudo leer ${key}:`, error);
  }

  localStorage.setItem(key, JSON.stringify(fallback));
  return JSON.parse(JSON.stringify(fallback));
}

function setStorageCollection(key, items) {
  const normalized = Array.isArray(items) ? items : [];
  localStorage.setItem(key, JSON.stringify(normalized));
  return normalized;
}

function getCategoriasDisponibles() {
  return getStorageCollection(STORAGE_KEYS.categorias, DEFAULT_CATEGORIES);
}

function guardarCategorias(categorias) {
  const limpia = [...new Set((categorias || []).map((categoria) => String(categoria).trim()).filter(Boolean))];
  const finalCategorias = limpia.length ? limpia : [...DEFAULT_CATEGORIES];
  return setStorageCollection(STORAGE_KEYS.categorias, finalCategorias);
}

function getEmpresas() {
  return getStorageCollection(STORAGE_KEYS.empresas, [{ id: 1, nombre: 'Empresa 1', nit: DEFAULT_NIT, estado: 'Activa' }]);
}

function guardarEmpresas(empresas) {
  return setStorageCollection(STORAGE_KEYS.empresas, empresas);
}

function getUsuarios() {
  return getStorageCollection(STORAGE_KEYS.usuarios, [
    {
      id: 1,
      nombre: 'Administrador principal',
      usuario: DEFAULT_USER,
      password: DEFAULT_PASSWORD,
      rol: 'ADMINISTRADOR',
      empresa: DEFAULT_COMPANY_NAME,
      estado: 'Activo',
      permisos: ['Ver', 'Editar', 'Gestionar', 'Reportes', 'Facturas']
    },
    {
      id: 2,
      nombre: 'Cajero 1',
      usuario: 'cajero',
      password: DEFAULT_PASSWORD,
      rol: 'CAJERO',
      empresa: DEFAULT_COMPANY_NAME,
      estado: 'Activo',
      permisos: ['Ventas', 'Caja', 'Reporte del día']
    }
  ]);
}

function guardarUsuarios(usuarios) {
  return setStorageCollection(STORAGE_KEYS.usuarios, usuarios);
}

function getRoles() {
  return getStorageCollection(STORAGE_KEYS.roles, [
    { id: 1, nombre: 'ADMINISTRADOR', permisos: ['Ver', 'Editar', 'Gestionar usuarios', 'Gestionar roles', 'Reportes', 'Facturas'] },
    { id: 2, nombre: 'CAJERO', permisos: ['Ventas', 'Caja', 'Reportes del día'] },
    { id: 3, nombre: 'INVENTARIO', permisos: ['Inventario', 'Stock', 'Categorías'] }
  ]);
}

function guardarRoles(roles) {
  return setStorageCollection(STORAGE_KEYS.roles, roles);
}

function getSalesRecords() {
  try {
    const sales = JSON.parse(localStorage.getItem('kajaSales') || '[]');
    return Array.isArray(sales) ? sales : [];
  } catch (error) {
    return [];
  }
}

function getLastInvoice() {
  try {
    const invoice = JSON.parse(sessionStorage.getItem('kajaFacturaActual') || 'null');
    return invoice && typeof invoice === 'object' ? invoice : null;
  } catch (error) {
    return null;
  }
}

function saveLastInvoice(factura) {
  if (!factura) {
    sessionStorage.removeItem('kajaFacturaActual');
    return;
  }
  sessionStorage.setItem('kajaFacturaActual', JSON.stringify(factura));
}

function saveSalesRecords(sales) {
  localStorage.setItem('kajaSales', JSON.stringify(Array.isArray(sales) ? sales : []));
}

function getInventoryProducts() {
  try {
    const productos = JSON.parse(localStorage.getItem('kajaProductos') || '[]');
    return Array.isArray(productos) ? productos : [];
  } catch (error) {
    return [];
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/* TOASTS KAJA: REEMPLAZA ALERT BLOQUEANTE, SIEMPRE COMPLETO Y SIN DEJAR A MEDIAS */
function toastKaja(msg, tipo = 'ok') {
  let wrap = document.getElementById('kajaToasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'kajaToasts';
    wrap.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(wrap);
    const st = document.createElement('style');
    st.textContent = '.kaja-toast{background:#0f172a;border:1px solid rgba(250,204,21,.5);color:#f8fafc;padding:10px 14px;border-radius:12px;font-size:.82rem;box-shadow:0 12px 24px rgba(0,0,0,.4);animation:kajaIn .25s ease;max-width:320px;}.kaja-toast.ok{border-color:rgba(52,211,153,.6);}.kaja-toast.err{border-color:rgba(248,113,113,.7);background:#1a0f14;}.kaja-toast.warn{border-color:rgba(250,204,21,.7);}@keyframes kajaIn{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:none;}}';
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.className = 'kaja-toast ' + tipo;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function createInvoiceNumber() {
  const date = new Date();
  return `FAC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`;
}

function getEntityNameByUser() {
  return DEFAULT_COMPANY_NAME;
}

function getEmpresaLabel() {
  return localStorage.getItem('empresaSession') ? JSON.parse(localStorage.getItem('empresaSession') || '{}').nombre || DEFAULT_COMPANY_NAME : DEFAULT_COMPANY_NAME;
}

function getArrayPermisos(permisos) {
  if (!Array.isArray(permisos)) return [];
  return permisos.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
}

function openAdminModal({ title, bodyHtml, onSave }) {
  const modalHtml = `
    <div class="modal fade show" tabindex="-1" style="display:block; background: rgba(15,23,42,0.7);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="background:#111827; border:1px solid rgba(250,204,21,.35); color:#f8fafc; border-radius:18px;">
          <div class="modal-header" style="border-bottom:1px solid rgba(148,163,184,.2);">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close btn-close-white" data-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          <div class="modal-footer" style="border-top:1px solid rgba(148,163,184,.2);">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-kaja" id="saveAdminModal">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const existing = document.querySelector('.modal.show');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const closeBtn = document.querySelector('[data-dismiss="modal"]');
  const saveBtn = document.getElementById('saveAdminModal');

  const closeModal = () => document.querySelector('.modal.show')?.remove();

  closeBtn?.addEventListener('click', closeModal);
  saveBtn?.addEventListener('click', () => {
    if (typeof onSave === 'function') onSave(document.querySelector('.modal.show'));
    closeModal();
  });
}

function startClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;

  const update = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  update();
  setInterval(update, 30000);
}

function renderDashboard() {
  app.innerHTML = `
    <section class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="../KAJA-FRONTED/assets/logo-kaja.png" class="sidebar-logo" alt="Logo KAJA">
        </div>

        <div class="empresa-indicator">
          <span>Empresa activa</span>
          <div class="empresa-indicator-row">
            <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo empresa" class="empresa-mini-logo">
            <strong>${getEmpresaLabel()}</strong>
          </div>
        </div>

        <ul class="menu">
          <li class="menu-item active" data-section="dashboard">Dashboard</li>
          <li class="menu-item" data-section="ventas">Ventas</li>
          <li class="menu-item" data-section="inventario">Inventario</li>
          <li class="menu-item" data-section="empresas">Empresas</li>
          <li class="menu-item" data-section="usuarios">Usuarios</li>
          <li class="menu-item" data-section="roles">Roles</li>
          <li class="menu-item" data-section="developer">Desarrollador web</li>
          <li id="logout">Cerrar sesión</li>
        </ul>
      </aside>

      <main class="main">
        <div class="top">
          <div>
            <h1>Panel KAJA</h1>
            <p>Control central de operación, seguridad y negocio</p>
          </div>

          <div class="top-actions">
            <div class="empresa-badge">
              <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo empresa" class="empresa-badge-logo">
              <div>
                <span>Empresa activa</span>
                <strong>${getEmpresaLabel()}</strong>
              </div>
            </div>
            <div class="developer-badge">
              <span>Desarrollador</span>
              <strong>Ver y editar</strong>
            </div>
          </div>
        </div>
        <div id="content"></div>
      </main>
    </section>
  `;

  document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      const section = item.getAttribute('data-section');
      document.querySelectorAll('.menu-item').forEach((btn) => btn.classList.remove('active'));
      item.classList.add('active');
      loadSection(section);
    });
  });

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    state.companyValidated = false;
    state.token = null;
    state.user = null;
    state.role = null;
    renderLogin();
  });

  loadSection('dashboard');
}

/* FUNCION DE COMPATIBILIDAD PARA EL MINI GRAFICO OCULTO DEL DASHBOARD */
function renderDashboardChart(view, productos) {
  const chartRoot = document.getElementById('resumenInventario');
  if (!chartRoot || !Array.isArray(productos)) return;

  if (view === 'ventas' || view === 'categorias') {
    const report = productos || {};
    const dataset = view === 'ventas' ? (report.ventas_por_dia || []) : (report.ventas_por_categoria || []);
    chartRoot.className = 'mini-chart';
    if (!dataset.length) {
      chartRoot.innerHTML = '<p class="empty-state-small">Sin datos para el periodo seleccionado</p>';
      return;
    }

    if (window.Chart) {
      chartRoot.innerHTML = '<canvas id="kajaDashboardChart" aria-label="Gráfico del dashboard"></canvas>';
      state.dashboardChartInstance?.destroy();
      const canvas = document.getElementById('kajaDashboardChart');
      state.dashboardChartInstance = new Chart(canvas, {
        type: view === 'ventas' ? 'line' : 'doughnut',
        data: {
          labels: dataset.map((item) => view === 'ventas' ? item.fecha : item.categoria),
          datasets: [{
            label: view === 'ventas' ? 'Ventas' : 'Ventas por categoría',
            data: dataset.map((item) => Number(item.total || 0)),
            borderColor: '#38bdf8',
            backgroundColor: view === 'ventas' ? 'rgba(56,189,248,0.22)' : ['#38bdf8', '#facc15', '#34d399', '#f87171', '#a78bfa'],
            borderWidth: 2,
            tension: 0.35,
            fill: view === 'ventas'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } } }
      });
    } else {
      chartRoot.className = 'chart-list';
      chartRoot.innerHTML = dataset.map((item) => `<div class="chart-list-item"><strong>${view === 'ventas' ? item.fecha : item.categoria}</strong><span>${formatMoney(item.total)}</span></div>`).join('');
    }
    return;
  }

  if (view === 'donut') {
    const activos = productos.filter((item) => Number(item.activo) === 1).length;
    const inactivos = productos.filter((item) => Number(item.activo) !== 1).length;
    const total = Math.max(productos.length, 1);
    const porcentaje = Math.round((activos / total) * 100);

    chartRoot.className = 'chart-donut-wrap';
    chartRoot.innerHTML = `
      <div class="donut-chart" style="--value:${porcentaje}%">
        <span>${porcentaje}%</span>
      </div>
      <div class="donut-legend">
        <div><span class="dot blue"></span> Activos: ${activos}</div>
        <div><span class="dot gray"></span> Inactivos: ${inactivos}</div>
      </div>
    `;
    return;
  }

  if (view === 'lista') {
    const top = [...productos].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 6);
    chartRoot.className = 'chart-list';
    chartRoot.innerHTML = top.map((producto) => `
      <div class="chart-list-item">
        <div>
          <strong>${producto.nombre || 'Producto'}</strong>
          <small>${producto.codigo || 'Sin código'}</small>
        </div>
        <span>${producto.stock || 0}</span>
      </div>
    `).join('');
    return;
  }

  if (view === 'dispersion') {
    const puntos = (Array.isArray(productos) ? productos : []).slice(0, 40).map((p) => ({ x: Number(p.stock || 0), y: Number(p.precio || 0), label: p.nombre || p.codigo || '' }));
    chartRoot.className = 'mini-chart';
    if (!puntos.length) { chartRoot.innerHTML = '<p class="empty-state-small">Sin datos para dispersión</p>'; return; }
    if (window.Chart) {
      chartRoot.innerHTML = '<canvas id="kajaDashboardChart" aria-label="Dispersión stock vs precio"></canvas>';
      state.dashboardChartInstance?.destroy();
      const canvas = document.getElementById('kajaDashboardChart');
      state.dashboardChartInstance = new Chart(canvas, {
        type: 'scatter',
        data: { datasets: [{ label: 'Stock vs Precio', data: puntos, backgroundColor: '#facc15' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Stock', color: '#e2e8f0' }, ticks: { color: '#e2e8f0' } }, y: { title: { display: true, text: 'Precio', color: '#e2e8f0' }, ticks: { color: '#e2e8f0' } } }, plugins: { legend: { labels: { color: '#e2e8f0' } }, tooltip: { callbacks: { label: (c) => `${c.raw.label}: stock ${c.raw.x}, ${formatMoney(c.raw.y)}` } } } }
      });
    } else {
      chartRoot.innerHTML = puntos.map((p) => `<div class="chart-list-item"><strong>${p.label}</strong><span>stock ${p.x} · ${formatMoney(p.y)}</span></div>`).join('');
    }
    return;
  }

  chartRoot.className = 'mini-chart';
  const maxStock = Math.max(...productos.map((producto) => Number(producto.stock || 0)), 1);
  chartRoot.innerHTML = productos.slice(0, 8).map((producto) => {
    const height = Math.max(18, (Number(producto.stock || 0) / maxStock) * 100);
    return `
      <div class="mini-bar-group">
        <span>${(producto.nombre || '-').slice(0, 8)}</span>
        <div class="mini-bar-shell">
          <div class="mini-bar" style="height:${height}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* VISOR ESTADISTICO: UN GRAFICO VISIBLE CON SELECTOR MANUAL Y ROTACION AUTOMATICA CON BARRA DE TIEMPO */
let kajaStatActual = 'barras'; let kajaStatTimer = null; let kajaStatProg = 0;
const KAJA_STAT_META = { barras: ['Barras por categoría', 'Comparar valores', 'Barras rectangulares para comparar valores entre categorías.'], linea: ['Línea en el tiempo', 'Tendencia', 'Puntos unidos por líneas: cambio numérico en el tiempo.'], pastel: ['Circular / Pastel', 'Proporción', 'Porciones del total por categoría.'], histograma: ['Histograma precios', 'Intervalos', 'Barras juntas por intervalos de precio.'], dispersion: ['Dispersión', 'Stock vs Precio', 'Puntos en plano cartesiano: relación stock-precio.'], caja: ['Caja / Boxplot precios', 'Mediana y cuartiles', 'Mediana, cuartiles y extremos.'] };
function dibujarEstadisticasKaja(report) {
  if (!window.Chart) return;
  const porCat = (report && report.ventas_por_categoria) || [];
  const porDia = (report && report.ventas_por_dia) || [];
  const top = (report && report.top_productos) || [];
  const kpis = (report && report.kpis) || {};
  const inv = JSON.parse(localStorage.getItem('kajaProductos') || '[]');
  /* GUARDA DATOS IMPORTANTES PARA EL VISOR: INGRESOS, TENDENCIA Y TOP */
  window._kajaStats = { porCat, porDia, inv, top, kpis };
  mostrarStatKaja(kajaStatActual);
  activarBotonesStatKaja();
}
function mostrarStatKaja(tipo) {
  kajaStatActual = tipo;
  const datos = window._kajaStats || { porCat: [], porDia: [], inv: [], top: [], kpis: {} };
  const meta = KAJA_STAT_META[tipo] || KAJA_STAT_META.barras;
  const titulo = document.getElementById('statViewerTitle'); const tag = document.getElementById('statViewerTag'); const desc = document.getElementById('statViewerDesc');
  if (titulo) titulo.textContent = meta[0]; if (tag) tag.textContent = meta[1]; if (desc) desc.textContent = meta[2];
  document.querySelectorAll('.kaja-viewer-nav [data-stat]').forEach((b) => b.classList.toggle('active', b.dataset.stat === tipo));
  const canvas = document.getElementById('statViewer'); const box = document.getElementById('statBoxplot'); const txt = document.getElementById('statBoxplotTxt');
  const esCaja = tipo === 'caja';
  if (canvas) canvas.style.display = esCaja ? 'none' : 'block';
  if (box) box.style.display = esCaja ? 'flex' : 'none';
  if (txt) txt.style.display = esCaja ? 'block' : 'none';
  if (desc) desc.style.display = esCaja ? 'none' : 'block';
  if (esCaja) { dibujarCajaKaja(datos.inv); return; }
  if (!canvas || !window.Chart) return;
  if (canvas._chart) canvas._chart.destroy();
  const ctx = canvas.getContext('2d');
  const gradAzul = ctx.createLinearGradient(0, 0, 0, 340); gradAzul.addColorStop(0, 'rgba(56,189,248,.95)'); gradAzul.addColorStop(1, 'rgba(99,102,241,.55)');
  const gradOro = ctx.createLinearGradient(0, 0, 0, 340); gradOro.addColorStop(0, 'rgba(250,204,21,.95)'); gradOro.addColorStop(1, 'rgba(245,158,11,.45)');
  const gradVerde = ctx.createLinearGradient(0, 0, 0, 340); gradVerde.addColorStop(0, 'rgba(52,211,153,.45)'); gradVerde.addColorStop(1, 'rgba(52,211,153,.05)');
  const base = { responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: 'easeOutQuart' }, plugins: { legend: { labels: { color: '#e2e8f0', font: { size: 12, weight: 'bold' }, padding: 16 } }, tooltip: { backgroundColor: '#0f172a', borderColor: 'rgba(250,204,21,.4)', borderWidth: 1, titleColor: '#facc15', bodyColor: '#f8fafc', padding: 12, callbacks: { label: (c) => ' ' + formatMoney(c.parsed.y ?? c.parsed ?? c.raw) } } }, scales: { x: { grid: { color: 'rgba(148,163,184,.08)' }, ticks: { color: '#cbd5e1', font: { size: 11 } } }, y: { grid: { color: 'rgba(148,163,184,.1)' }, ticks: { color: '#cbd5e1', callback: (v) => v >= 1000 ? (v / 1000) + 'k' : v } } } };
  let cfg = null;
  if (tipo === 'barras') {
    const top = (datos.top && datos.top.length ? datos.top : datos.porCat.map((c) => ({ nombre: c.categoria, total: c.total }))).slice(0, 8);
    cfg = { type: 'bar', data: { labels: top.map((c) => (c.nombre || '').slice(0, 14)), datasets: [{ label: 'INGRESOS POR PRODUCTO', data: top.map((c) => Number(c.total || 0)), backgroundColor: gradAzul, borderColor: '#38bdf8', borderWidth: 1, borderRadius: 10, maxBarThickness: 42 }] }, options: base };
  }
  if (tipo === 'linea') cfg = { type: 'line', data: { labels: datos.porDia.map((d) => String(d.fecha).slice(5)), datasets: [{ label: 'VENTAS DIARIAS', data: datos.porDia.map((d) => Number(d.total || 0)), borderColor: '#34d399', backgroundColor: gradVerde, fill: true, tension: .45, pointRadius: 5, pointBackgroundColor: '#facc15', pointBorderColor: '#0f172a', borderWidth: 3 }] }, options: base };
  if (tipo === 'pastel') cfg = { type: 'doughnut', data: { labels: datos.porCat.map((c) => c.categoria), datasets: [{ label: 'PARTICIPACION', data: datos.porCat.map((c) => Number(c.total || 0)), backgroundColor: ['#38bdf8', '#facc15', '#34d399', '#f87171', '#a78bfa', '#fb923c'], borderColor: '#0f172a', borderWidth: 3, hoverOffset: 10 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', animation: { animateRotate: true, duration: 1000 }, plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 14 } }, tooltip: { callbacks: { label: (c) => ' ' + c.label + ': ' + formatMoney(c.parsed) } } } } };
  if (tipo === 'histograma') {
    const precios = datos.inv.map((p) => Number(p.precio || 0)).filter((v) => v > 0);
    const min = Math.min(...precios, 0); const max = Math.max(...precios, 1); const n = 6; const w = Math.max(1, (max - min) / n);
    const labels = []; const counts = [];
    for (let i = 0; i < n; i++) { const a = Math.round(min + i * w); const b = Math.round(min + (i + 1) * w); labels.push('$' + (a / 1000).toFixed(0) + 'k-' + (b / 1000).toFixed(0) + 'k'); counts.push(precios.filter((v) => v >= a && (i === n - 1 ? v <= b : v < b)).length); }
    cfg = { type: 'bar', data: { labels, datasets: [{ label: 'PRODUCTOS POR RANGO DE PRECIO', data: counts, backgroundColor: gradOro, borderRadius: 8, maxBarThickness: 54 }] }, options: base };
  }
  if (tipo === 'dispersion') {
    const pts = datos.inv.slice(0, 80).map((p) => ({ x: Number(p.stock || 0), y: Number(p.precio || 0) }));
    cfg = { type: 'bubble', data: { datasets: [{ label: 'STOCK VS PRECIO (TAMANO = VALOR)', data: pts.map((p) => ({ x: p.x, y: p.y, r: Math.max(4, Math.min(14, (p.x * p.y) / 500000 + 4)) })), backgroundColor: 'rgba(248,113,113,.65)', borderColor: '#facc15', borderWidth: 1 }] }, options: { ...base, scales: { x: { title: { display: true, text: 'STOCK', color: '#facc15' }, ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148,163,184,.08)' } }, y: { title: { display: true, text: 'PRECIO', color: '#facc15' }, ticks: { color: '#cbd5e1', callback: (v) => '$' + (v / 1000) + 'k' }, grid: { color: 'rgba(148,163,184,.1)' } } } } };
  }
  if (cfg) canvas._chart = new Chart(canvas, cfg);
}
function dibujarCajaKaja(inv) {
  const precios = (inv || []).map((p) => Number(p.precio || 0)).filter((v) => v > 0);
  const box = document.getElementById('statBoxplot'); const txt = document.getElementById('statBoxplotTxt');
  if (!precios.length || !box) return;
  const s = [...precios].sort((a, b) => a - b); const q = (p) => s[Math.floor((s.length - 1) * p)];
  const min = s[0]; const max = s[s.length - 1]; const q1 = q(.25), med = q(.5), q3 = q(.75);
  const iqr = Math.max(1, q3 - q1); const lo = Math.max(min, q1 - 1.5 * iqr); const hi = Math.min(max, q3 + 1.5 * iqr);
  const pct = (v) => Math.max(0, Math.min(100, ((v - min) / Math.max(1, max - min)) * 100));
  box.innerHTML = '<div class="kaja-boxplot-track"><div class="kaja-boxplot-whisker" style="left:' + pct(lo) + '%;width:' + (pct(hi) - pct(lo)) + '%"></div><div class="kaja-boxplot-box" style="left:' + pct(q1) + '%;width:' + Math.max(4, pct(q3) - pct(q1)) + '%"></div><div class="kaja-boxplot-median" style="left:' + pct(med) + '%"></div></div>';
  if (txt) txt.textContent = 'Min ' + Math.round(lo).toLocaleString('es-CO') + ' · Q1 ' + Math.round(q1).toLocaleString('es-CO') + ' · Med ' + Math.round(med).toLocaleString('es-CO') + ' · Q3 ' + Math.round(q3).toLocaleString('es-CO') + ' · Max ' + Math.round(hi).toLocaleString('es-CO');
}
function activarBotonesStatKaja() {
  document.querySelectorAll('.kaja-viewer-nav [data-stat]').forEach((b) => {
    if (b._kaja) return; b._kaja = true;
    b.addEventListener('click', () => { detenerAutoStatKaja(); mostrarStatKaja(b.dataset.stat); });
  });
  const auto = document.getElementById('statAutoBtn');
  if (auto && !auto._kaja) { auto._kaja = true; auto.addEventListener('click', () => { if (kajaStatTimer) detenerAutoStatKaja(); else iniciarAutoStatKaja(); }); }
}
function iniciarAutoStatKaja() {
  detenerAutoStatKaja();
  const orden = ['barras', 'linea', 'pastel', 'histograma', 'dispersion', 'caja'];
  const btn = document.getElementById('statAutoBtn'); if (btn) btn.textContent = 'Pausar ⏸';
  kajaStatProg = 0;
  kajaStatTimer = setInterval(() => {
    kajaStatProg += 1;
    const bar = document.getElementById('statRotateBar'); if (bar) bar.style.width = Math.min(100, kajaStatProg) + '%';
    if (kajaStatProg >= 100) { kajaStatProg = 0; const i = orden.indexOf(kajaStatActual); mostrarStatKaja(orden[(i + 1) % orden.length]); }
  }, 150);
}
function detenerAutoStatKaja() {
  if (kajaStatTimer) clearInterval(kajaStatTimer); kajaStatTimer = null;
  const btn = document.getElementById('statAutoBtn'); if (btn) btn.textContent = 'Auto ▶';
  const bar = document.getElementById('statRotateBar'); if (bar) bar.style.width = '0%';
}

/* OBTIENE PRODUCTOS NORMALIZADOS COMO ARREGLO DESDE LA API */
async function fetchProductosApi() {
  if (!localStorage.getItem('token')) throw new Error('No hay sesión activa');
  const resp = await KajaApi.productos();
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && Array.isArray(resp.rows)) return resp.rows;
  return [];
}

function openCategoryManager() {
  const categorias = getCategoriasDisponibles();

  const modalHtml = `
    <div class="modal fade show" tabindex="-1" style="display:block; background: rgba(15,23,42,0.72);">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" style="background:#0f172a; color:#f8fafc; border:1px solid rgba(250,204,21,0.35); border-radius:18px;">
          <div class="modal-header" style="border-bottom:1px solid rgba(148,163,184,0.18);">
            <h5 class="modal-title">Categorías</h5>
            <button type="button" class="btn-close btn-close-white" data-close-modal="true" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
              <input id="newCategoryInput" type="text" class="form-control" placeholder="Nueva categoría" maxlength="40">
              <button type="button" class="btn btn-kaja" id="addCategoryBtn">Agregar</button>
            </div>
            <div class="table-responsive">
              <table class="table table-dark table-striped table-hover align-middle">
                <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${categorias.map((categoria) => `
                    <tr>
                      <td>${categoria}</td>
                      <td>
                        <div class="d-flex gap-2">
                          <button type="button" class="btn btn-sm btn-outline-light" data-category-action="edit" data-category-name="${categoria}">Editar</button>
                          <button type="button" class="btn btn-sm btn-outline-danger" data-category-action="delete" data-category-name="${categoria}">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer" style="border-top:1px solid rgba(148,163,184,0.18);">
            <button type="button" class="btn btn-secondary" data-close-modal="true">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.querySelector('.modal.show');
  const close = () => modal?.remove();

  modal?.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', close));

  document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
    const input = document.getElementById('newCategoryInput');
    const nuevo = (input?.value || '').trim();
    if (!nuevo) return;
    const categoriasActuales = getCategoriasDisponibles();
    guardarCategorias([...categoriasActuales, nuevo]);
    close();
    openCategoryManager();
  });

  modal?.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-category-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.categoryAction;
    const categoryName = actionTarget.dataset.categoryName;
    const categoriasActuales = getCategoriasDisponibles();

    if (action === 'delete') {
      if (!window.confirm(`¿Deseas eliminar la categoría "${categoryName}"?`)) return;
      guardarCategorias(categoriasActuales.filter((categoria) => categoria !== categoryName));
      close();
      openCategoryManager();
      return;
    }

    if (action === 'edit') {
      const value = window.prompt('Editar categoría:', categoryName);
      if (!value || !value.trim()) return;
      const nuevaLista = categoriasActuales.map((categoria) => categoria === categoryName ? value.trim() : categoria);
      guardarCategorias(nuevaLista);
      close();
      openCategoryManager();
    }
  });
}

async function openCategoryManagerApi() {
  const categorias = await KajaApi.categorias({ activo: 1 });
  const modalHtml = `
    <div class="modal fade show" tabindex="-1" style="display:block; background: rgba(15,23,42,0.72);">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" style="background:#0f172a; color:#f8fafc; border:1px solid rgba(250,204,21,0.35); border-radius:18px;">
          <div class="modal-header" style="border-bottom:1px solid rgba(148,163,184,0.18);">
            <h5 class="modal-title">Categorías</h5>
            <button type="button" class="btn-close btn-close-white" data-close-api-category="true" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
              <input id="newApiCategoryInput" type="text" class="form-control" placeholder="Nueva categoría" maxlength="80">
              <button type="button" class="btn btn-kaja" id="addApiCategoryBtn">Agregar</button>
            </div>
            <div class="table-responsive">
              <table class="table table-dark table-striped table-hover align-middle">
                <thead><tr><th>Nombre</th><th>Productos</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${categorias.map((categoria) => `
                    <tr>
                      <td>${categoria.nombre}</td>
                      <td>${categoria.productos_count || 0}</td>
                      <td>
                        <div class="d-flex gap-2">
                          <button type="button" class="btn btn-sm btn-outline-light" data-api-category-action="edit" data-category-id="${categoria.id}" data-category-name="${categoria.nombre}">Editar</button>
                          <button type="button" class="btn btn-sm btn-outline-danger" data-api-category-action="disable" data-category-id="${categoria.id}">Desactivar</button>
                        </div>
                      </td>
                    </tr>
                  `).join('') || '<tr><td colspan="3">No se encontraron registros</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer" style="border-top:1px solid rgba(148,163,184,0.18);">
            <button type="button" class="btn btn-secondary" data-close-api-category="true">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelector('.modal.show')?.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.querySelector('.modal.show');
  const close = () => modal?.remove();
  modal?.querySelectorAll('[data-close-api-category="true"]').forEach((button) => button.addEventListener('click', close));

  document.getElementById('addApiCategoryBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newApiCategoryInput');
    const nombre = input?.value.trim();
    if (!nombre) return;
    try {
      await KajaApi.crearCategoria(nombre);
      close();
      await openCategoryManagerApi();
    } catch (error) { alert(error.message); }
  });

  modal?.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-api-category-action]');
    if (!target) return;
    try {
      if (target.dataset.apiCategoryAction === 'edit') {
        const nombre = window.prompt('Editar categoría:', target.dataset.categoryName);
        if (nombre?.trim()) await KajaApi.actualizarCategoria(target.dataset.categoryId, nombre.trim());
      } else if (target.dataset.apiCategoryAction === 'disable') {
        if (!window.confirm('¿Deseas desactivar esta categoría?')) return;
        await KajaApi.cambiarEstadoCategoria(target.dataset.categoryId, false);
      }
      close();
      await openCategoryManagerApi();
    } catch (error) { alert(error.message); }
  });
}

async function openProductModal(producto = null) {
  const editing = Boolean(producto && producto.id);
  const respCat = await KajaApi.categorias({ activo: 1 });
  const categorias = Array.isArray(respCat) ? respCat : (respCat && respCat.data ? respCat.data : []);
  const categoriaActual = producto?.categoria_id || categorias.find((categoria) => categoria.nombre === producto?.categoria)?.id || categorias[0]?.id || '';
  const categoriaOptions = categorias.map((categoria) => `
    <option value="${categoria.id}" ${Number(categoria.id) === Number(categoriaActual) ? 'selected' : ''}>${categoria.nombre}</option>
  `).join('');

  const modalHtml = `
    <div class="modal fade show" tabindex="-1" style="display:block; background: rgba(15, 23, 42, 0.72);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="background:#0f172a; color:#f8fafc; border:1px solid rgba(250,204,21,0.35); border-radius:18px;">
          <div class="modal-header" style="border-bottom:1px solid rgba(148,163,184,0.18);">
            <h5 class="modal-title">${editing ? 'Editar producto' : 'Nuevo producto'}</h5>
            <button type="button" class="btn-close btn-close-white" data-close-modal="true" aria-label="Cerrar"></button>
          </div>
          <form id="productForm">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Código</label>
                  <input type="text" class="form-control" name="codigo" value="${producto?.codigo || ''}" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nombre</label>
                  <input type="text" class="form-control" name="nombre" value="${producto?.nombre || ''}" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Categoría</label>
                  <select class="form-control" name="categoria">
                    ${categoriaOptions || '<option value="General">General</option>'}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Estado</label>
                  <div class="form-check mt-2">
                    <input class="form-check-input" type="checkbox" name="activo" ${Number(producto?.activo ?? 1) === 1 ? 'checked' : ''}>
                    <label class="form-check-label">Activo</label>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" name="descripcion" rows="3">${producto?.descripcion || ''}</textarea>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Precio</label>
                  <input type="number" class="form-control" name="precio" min="0" step="0.01" value="${Number(producto?.precio || 0)}" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Stock</label>
                  <input type="number" class="form-control" name="stock" min="0" step="1" value="${Number(producto?.stock || 0)}" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Empresa</label>
                  <input type="text" class="form-control" value="${getEmpresaLabel()}" readonly>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid rgba(148,163,184,0.18);">
              <button type="button" class="btn btn-secondary" data-close-modal="true">Cancelar</button>
              <button type="submit" class="btn btn-kaja">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.querySelector('.modal.show');
  const close = () => modal?.remove();

  modal.querySelectorAll('[data-close-modal="true"]').forEach((button) => button.addEventListener('click', close));

  modal.querySelector('#productForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      codigo: form.codigo.value.trim(),
      nombre: form.nombre.value.trim(),
      categoria_id: Number(form.categoria.value || 0) || null,
      descripcion: form.descripcion.value.trim(),
      precio: Number(form.precio.value || 0),
      stock: Number(form.stock.value || 0),
      activo: form.activo.checked ? 1 : 0
    };

    if (!payload.codigo || !payload.nombre) {
      alert('Completa código y nombre del producto');
      return;
    }

    try {
      if (editing) {
        await KajaApi.actualizarProducto(producto.id, payload);
      } else {
        await KajaApi.crearProducto(payload);
      }

      close();
      if (document.getElementById('content')) {
        loadSection('inventario');
      }
    } catch (error) {
      alert(error.message || 'Error al guardar el producto');
    }
  });
}

/* ACCIONES DE INVENTARIO: AGREGAR, EDITAR Y ELIMINAR FUNCIONALES CONTRA LA API */
function bindInventoryActions() {
  document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal().catch((error) => alert(error.message)));
  document.getElementById('manageCategoriesBtn')?.addEventListener('click', () => openCategoryManagerApi().catch((error) => alert(error.message)));
  document.getElementById('exportInventoryBtn')?.addEventListener('click', () => KajaApi.exportarInventario().catch((error) => alert(error.message)));
  document.querySelectorAll('.btn-editar-producto').forEach((button) => {
    button.addEventListener('click', () => {
      try {
        const raw = (button.dataset.producto || '{}').replace(/'/g, "'");
        const producto = JSON.parse(raw);
        openProductModal(producto).catch((error) => alert(error.message));
      } catch (e) { alert('NO SE PUDO ABRIR EL PRODUCTO PARA EDITAR'); }
    });
  });
  document.querySelectorAll('.btn-eliminar-producto').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.id || 0);
      if (!id) { toastKaja('ID DE PRODUCTO INVALIDO', 'err'); return; }
      if (!window.confirm('¿ELIMINAR ESTE PRODUCTO DE FORMA DEFINITIVA? Esta acción no se puede deshacer.')) return;
      button.disabled = true;
      try {
        await KajaApi.eliminarProductoDefinitivo(id);
        toastKaja('PRODUCTO ELIMINADO DEFINITIVAMENTE', 'ok');
        loadSection('inventario');
      } catch (error) {
        button.disabled = false;
        toastKaja(error.message || 'ERROR AL ELIMINAR. VERIFICA PERMISOS DE EDITOR O ADMINISTRADOR.', 'err');
      }
    });
  });
}

async function loadAdminSectionApi(section) {
  const content = document.getElementById('content');
  if (!content) return;

  const renderError = (message) => {
    content.innerHTML = `<div class="panel-box"><p class="text-danger">${message}</p></div>`;
  };

  try {
    if (section === 'empresas') {
      const empresas = await KajaApi.empresas();
      content.innerHTML = `
        <div class="subheader"><div><h1>Empresas</h1><p>Control de compañías activas</p></div><button class="btn btn-kaja btn-sm" id="addEmpresaBtn">Nueva empresa</button></div>
        <div class="admin-manager-grid"><section class="admin-card-panel wide"><div class="admin-manager-table-wrap">
          <table class="admin-manager-table table table-dark table-striped table-hover align-middle">
            <thead><tr><th>Nombre</th><th>NIT</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>${empresas.map((empresa) => `
              <tr><td>${empresa.nombre}</td><td>${empresa.nit}</td>
              <td><span class="admin-badge ${Number(empresa.activo) === 1 ? 'active' : 'inactive'}">${Number(empresa.activo) === 1 ? 'Activa' : 'Inactiva'}</span></td>
              <td><div class="admin-actions"><button class="btn-link" data-action="editEmpresa" data-id="${empresa.id}">Editar</button><button class="btn-link danger" data-action="toggleEmpresa" data-id="${empresa.id}" data-active="${empresa.activo}">${Number(empresa.activo) === 1 ? 'Desactivar' : 'Activar'}</button></div></td></tr>
            `).join('') || '<tr><td colspan="4">No se encontraron registros</td></tr>'}</tbody>
          </table>
        </div></section></div>`;

      document.getElementById('addEmpresaBtn')?.addEventListener('click', async () => {
        const nombre = window.prompt('Nombre de la empresa:', 'Empresa nueva');
        const nit = nombre && window.prompt('NIT de la empresa:', '900000000-1');
        const adminNombre = nit && window.prompt('Nombre del administrador:', 'Administrador principal');
        const adminUsuario = adminNombre && window.prompt('Usuario administrador:', 'admin.nueva');
        const password = adminUsuario && window.prompt('Contraseña (mínimo 8 caracteres):', 'Kaja123');
        if (!nombre || !nit || !adminNombre || !adminUsuario || !password) return;
        if (String(password).length < 8) { alert('La contraseña debe tener al menos 8 caracteres'); return; }
        try { await KajaApi.crearEmpresa({ empresa: { nombre, nit }, administrador: { nombre: adminNombre, usuario: adminUsuario, password } }); loadSection('empresas'); }
        catch (error) { alert(error.message); }
      });
    }

    if (section === 'usuarios') {
      const response = await KajaApi.usuarios({ page: 1, pageSize: 100 });
      const usuarios = response.data || [];
      content.innerHTML = `
        <div class="subheader"><div><h1>Usuarios</h1><p>Accesos y permisos del sistema</p></div><div class="d-flex gap-2"><button class="btn btn-outline-light btn-sm" id="exportUsersBtn">Exportar Excel</button><button class="btn btn-kaja btn-sm" id="addUsuarioBtn">Nuevo usuario</button></div></div>
        <div class="admin-manager-grid"><section class="admin-card-panel wide"><div class="admin-manager-table-wrap">
          <table class="admin-manager-table table table-dark table-striped table-hover align-middle">
            <thead><tr><th>Nombre</th><th>Usuario</th><th>Empresa</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>${usuarios.map((usuario) => `
              <tr><td>${usuario.nombre}</td><td>${usuario.usuario}</td><td>${usuario.empresa_nombre || getEmpresaLabel()}</td><td>${usuario.rol}</td>
              <td><span class="admin-badge ${Number(usuario.activo) === 1 ? 'active' : 'inactive'}">${Number(usuario.activo) === 1 ? 'Activo' : 'Inactivo'}</span></td>
              <td><div class="admin-actions"><button class="btn-link" data-action="editUser" data-id="${usuario.id}">Editar</button><button class="btn-link" data-action="passwordUser" data-id="${usuario.id}">Contraseña</button><button class="btn-link danger" data-action="toggleUser" data-id="${usuario.id}" data-active="${usuario.activo}">${Number(usuario.activo) === 1 ? 'Desactivar' : 'Activar'}</button></div></td></tr>
            `).join('') || '<tr><td colspan="6">No se encontraron registros</td></tr>'}</tbody>
          </table>
        </div></section></div>`;

      document.getElementById('exportUsersBtn')?.addEventListener('click', () => KajaApi.exportarUsuarios().catch((error) => alert(error.message)));

      document.getElementById('addUsuarioBtn')?.addEventListener('click', async () => {
        const nombre = window.prompt('Nombre completo:', 'Nuevo usuario');
        const usuario = nombre && window.prompt('Usuario:', 'nuevo.usuario');
        const password = usuario && window.prompt('Contraseña:', 'Kaja123');
        const rol = password && window.prompt('Rol (ADMINISTRADOR/CAJERO/INVENTARIO):', 'CAJERO');
        if (!nombre || !usuario || !password || !rol) return;
        if (String(password).length < 8) { alert('La contraseña debe tener al menos 8 caracteres'); return; }
        try { await KajaApi.crearUsuario({ nombre, usuario, password, rol }); loadSection('usuarios'); }
        catch (error) { alert(error.message); }
      });
    }

    if (section === 'roles') {
      const roles = await KajaApi.roles();
      content.innerHTML = `
        <div class="subheader"><div><h1>Roles</h1><p>Permisos por perfil</p></div></div>
        <div class="admin-manager-grid"><section class="admin-card-panel wide"><div class="admin-manager-table-wrap">
          <table class="admin-manager-table table table-dark table-striped table-hover align-middle">
            <thead><tr><th>Rol</th><th>Permisos</th><th>Acciones</th></tr></thead>
            <tbody>${roles.map((rol) => `<tr><td>${rol.nombre}</td><td>${(rol.permisos || []).join(', ') || 'Sin permisos'}</td><td><div class="admin-actions"><button class="btn-link" data-action="editRole" data-id="${rol.id}">Editar</button></div></td></tr>`).join('')}</tbody>
          </table>
        </div></section></div>`;
    }

    content.onclick = async (event) => {
      const action = event.target.closest('[data-action]');
      if (!action) return;
      try {
        const id = action.dataset.id;
        if (section === 'empresas' && action.dataset.action === 'editEmpresa') {
          const empresa = (await KajaApi.empresas()).find((item) => String(item.id) === String(id));
          const nombre = window.prompt('Nuevo nombre de la empresa:', empresa?.nombre);
          const nit = nombre && window.prompt('Nuevo NIT:', empresa?.nit);
          if (nombre && nit) await KajaApi.actualizarEmpresa(id, { nombre, nit });
        } else if (section === 'empresas' && action.dataset.action === 'toggleEmpresa') {
          await KajaApi.cambiarEstadoEmpresa(id, Number(action.dataset.active) !== 1);
        } else if (section === 'usuarios' && action.dataset.action === 'editUser') {
          const user = (await KajaApi.usuarios({ page: 1, pageSize: 100 })).data.find((item) => String(item.id) === String(id));
          const nombre = window.prompt('Nombre completo:', user?.nombre);
          const usuario = nombre && window.prompt('Usuario:', user?.usuario);
          const rol = usuario && window.prompt('Rol:', user?.rol);
          if (nombre && usuario && rol) await KajaApi.actualizarUsuario(id, { nombre, usuario, rol });
        } else if (section === 'usuarios' && action.dataset.action === 'passwordUser') {
          const password = window.prompt('Nueva contraseña (mínimo 8 caracteres):');
          if (password) await KajaApi.cambiarPasswordUsuario(id, password);
        } else if (section === 'usuarios' && action.dataset.action === 'toggleUser') {
          await KajaApi.cambiarEstadoUsuario(id, Number(action.dataset.active) !== 1);
        } else if (section === 'roles' && action.dataset.action === 'editRole') {
          const role = (await KajaApi.roles()).find((item) => String(item.id) === String(id));
          const nombre = window.prompt('Nombre del rol:', role?.nombre);
          const permisos = nombre && window.prompt('Permisos separados por coma:', (role?.permisos || []).join(', '));
          if (nombre) await KajaApi.actualizarRol(id, { nombre, permisos: (permisos || '').split(',').map((item) => item.trim()).filter(Boolean) });
        }
        loadSection(section);
      } catch (error) { alert(error.message); }
    };
  } catch (error) { renderError(error.message || 'Error al cargar los datos'); }
}

function loadSection(section) {
  const content = document.getElementById('content');
  if (section === 'empresas' || section === 'usuarios' || section === 'roles') {
    loadAdminSectionApi(section);
    return;
  }
  if (!content) return;

  if (section === 'dashboard') {
    content.innerHTML = `
      <div class="top">
        <div>
          <h1>Dashboard General</h1>
          <p>Panel principal de gestión de inventario KAJA</p>
        </div>
        <div class="clock" id="clock"></div>
      </div>

      <div class="cards kaja-kpi-compact" id="dashboardCards">
        <div class="card"><div class="card-icon icon-blue"><i class="fa-solid fa-sack-dollar"></i></div><div class="card-copy"><h3>Ventas del día</h3><span id="ventasDia">$0</span></div></div>
        <div class="card"><div class="card-icon icon-gold"><i class="fa-solid fa-file-invoice"></i></div><div class="card-copy"><h3>Facturas del día</h3><span id="facturasDia">0</span></div></div>
        <div class="card"><div class="card-icon icon-gold"><i class="fa-solid fa-receipt"></i></div><div class="card-copy"><h3>Ticket promedio</h3><span id="ticketPromedio">$0</span></div></div>
        <div class="card"><div class="card-icon icon-red"><i class="fa-solid fa-boxes-stacked"></i></div><div class="card-copy"><h3>Valor inventario</h3><span id="valorInventario">$0</span></div></div>
      </div>
      <div style="display:none;">
        <span id="totalProductos">0</span><span id="productosActivos">0</span><span id="productosInactivos">0</span><span id="estadoSistema">Activo</span><span id="cajaActual">$0</span><span id="turnoActual">Mañana</span><span id="cajerosActivos">0</span><span id="stockBajo">0</span>
      </div>

      <div class="dashboard-insights">
        <div class="ring-panel">
          <div class="progress-ring" id="stockRing"><span id="stockPercent">0%</span></div>
          <div>
            <h3>Disponibilidad</h3>
            <p id="stockHealth">Sin datos</p>
          </div>
        </div>

        <div class="bars-panel">
          <h3>Stock por nivel</h3>
          <div class="level-row"><span>Alto</span><div class="progress-bar"><span id="stockAlta" style="width:0%"></span></div></div>
          <div class="level-row"><span>Medio</span><div class="progress-bar"><span id="stockMedia" style="width:0%"></span></div></div>
          <div class="level-row"><span>Bajo</span><div class="progress-bar danger"><span id="stockBaja" style="width:0%"></span></div></div>
        </div>
      </div>

      <div class="dash-filter-bar">
        <label>Desde<input id="dashDesde" type="date" /></label>
        <label>Hasta<input id="dashHasta" type="date" /></label>
        <button id="dashFiltrar" class="btn btn-kaja btn-sm" type="button">Filtrar</button>
      </div>

      <div class="analytics-grid">
        <div class="panel-box">
          <div class="panel-header"><h3>Top productos</h3><span>Por stock</span></div>
          <div id="topProductosList" class="product-list"></div>
        </div>
        <div class="panel-box">
          <div class="panel-header"><h3>Revisión rápida</h3><span>Stock crítico</span></div>
          <div id="stockCritico" class="alert-list"></div>
        </div>
      </div>

      <div class="analytics-grid">
        <div class="panel-box">
          <div class="panel-header"><h3>Cajeros activos</h3><span>Turno actual</span></div>
          <div id="cajerosList" class="ranking-list"></div>
        </div>
        <div class="panel-box">
          <div class="panel-header"><h3>Resumen del día</h3><span>Operación</span></div>
          <div id="resumenDiaList" class="ranking-list"></div>
        </div>
      </div>

      <div class="panel-box" style="margin-top:22px;border:1px dashed rgba(56,189,248,.5);background:linear-gradient(120deg,rgba(56,189,248,.12),rgba(250,204,21,.1));">
        <div class="panel-header"><h3>📱 KAJA APP — Próximamente</h3><span>Espacio reservado para conectar</span></div>
        <p style="color:#cbd5e1;font-size:.85rem;margin:0;">Puente backend listo en <b>/api/app/status</b> y <b>/api/app/sync</b>. Aquí se conectará la app móvil sin afectar ventas, inventario ni reportes.</p>
      </div>

      <div class="insight-panel">
        <div class="insight-header">
          <h2>Centro estadístico KAJA</h2>
          <span id="resumenInventarioTag">Actualizando...</span>
        </div>
        <div id="resumenInventario" class="mini-chart" style="display:none;"></div>
        <div class="kaja-viewer-nav chart-toggle-wrap" style="margin-top:0;">
          <button class="chart-toggle active" data-stat="barras">Barras</button>
          <button class="chart-toggle" data-stat="linea">Línea</button>
          <button class="chart-toggle" data-stat="pastel">Pastel</button>
          <button class="chart-toggle" data-stat="histograma">Histograma</button>
          <button class="chart-toggle" data-stat="dispersion">Dispersión</button>
          <button class="chart-toggle" data-stat="caja">Caja</button>
          <button id="statAutoBtn" class="chart-toggle" type="button">Auto ▶</button>
        </div>
        <div class="panel-box kaja-viewer" style="margin-top:12px;">
          <div class="panel-header"><h3 id="statViewerTitle">Barras por categoría</h3><span id="statViewerTag">Comparar valores</span></div>
          <div class="kaja-viewer-box"><canvas id="statViewer" style="display:block;"></canvas><div id="statBoxplot" class="kaja-boxplot" style="display:none;width:100%;"></div></div>
          <small id="statViewerDesc" style="opacity:.7;">Barras rectangulares para comparar valores entre categorías.</small>
          <small id="statBoxplotTxt" style="opacity:.7;display:none;"></small>
          <div class="kaja-rotate-bar"><span id="statRotateBar"></span></div>
        </div>
        <div style="display:none;"><canvas id="statBarras"></canvas><canvas id="statLinea"></canvas><canvas id="statPastel"></canvas><canvas id="statHistograma"></canvas><canvas id="statDispersion"></canvas></div>
      </div>
    `;

    startClock();
    const productos = JSON.parse(localStorage.getItem('kajaProductos') || '[]');
    const listaProductos = Array.isArray(productos) && productos.length ? productos : [
      { nombre: 'Monitor Samsung 24', stock: 13, precio: 520000, activo: 1, codigo: 'P003' },
      { nombre: 'Memoria USB Kingston', stock: 40, precio: 28000, activo: 1, codigo: 'P004' },
      { nombre: 'SSD Kingston 480GB', stock: 12, precio: 180000, activo: 1, codigo: 'P005' },
      { nombre: 'Router TP-Link', stock: 9, precio: 130000, activo: 1, codigo: 'P012' }
    ];

    const total = listaProductos.length;
    const activos = listaProductos.filter((item) => Number(item.activo) === 1).length;
    const inactivos = total - activos;
    const stockTotal = listaProductos.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const valorTotal = listaProductos.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.stock || 0), 0);
    const stockAlta = listaProductos.filter((item) => Number(item.stock || 0) > 20).length;
    const stockMedia = listaProductos.filter((item) => Number(item.stock || 0) >= 8 && Number(item.stock || 0) <= 20).length;
    const stockBaja = listaProductos.filter((item) => Number(item.stock || 0) < 8).length;
    const disponibilidad = Math.round((activos / Math.max(total, 1)) * 100);
    const ventasDelDia = getSalesRecords().reduce((sum, factura) => sum + Number(factura.total || 0), 0);
    const ticketPromedio = getSalesRecords().length ? Math.round(ventasDelDia / getSalesRecords().length) : 0;

    document.getElementById('totalProductos').textContent = total;
    document.getElementById('productosActivos').textContent = activos;
    document.getElementById('productosInactivos').textContent = inactivos;
    document.getElementById('stockPercent').textContent = `${disponibilidad}%`;
    document.getElementById('stockHealth').textContent = disponibilidad >= 70 ? 'Inventario saludable' : 'Requiere revisión';
    document.getElementById('stockRing').style.background = `conic-gradient(#38bdf8 0 ${disponibilidad}%, #1f2937 ${disponibilidad}% 100%)`;
    document.getElementById('stockAlta').style.width = `${(stockAlta / Math.max(total, 1)) * 100}%`;
    document.getElementById('stockMedia').style.width = `${(stockMedia / Math.max(total, 1)) * 100}%`;
    document.getElementById('stockBaja').style.width = `${(stockBaja / Math.max(total, 1)) * 100}%`;
    document.getElementById('resumenInventarioTag').textContent = `Stock ${stockTotal} · Valor $${valorTotal.toLocaleString('es-CO')}`;
    document.getElementById('cajaActual').textContent = `$${Math.round(valorTotal * 0.18).toLocaleString('es-CO')}`;
    document.getElementById('turnoActual').textContent = new Date().getHours() < 12 ? 'Mañana' : new Date().getHours() < 18 ? 'Tarde' : 'Noche';
    document.getElementById('facturasDia').textContent = Math.max(8, Math.round(total / 2));
    document.getElementById('cajerosActivos').textContent = getUsuarios().filter((u) => u.rol === 'CAJERO').length;
    document.getElementById('ventasDia').textContent = formatMoney(ventasDelDia);
    document.getElementById('ticketPromedio').textContent = formatMoney(ticketPromedio);
    document.getElementById('stockBajo').textContent = String(stockBaja);
    document.getElementById('valorInventario').textContent = formatMoney(valorTotal);

    const reportHasta = new Date().toISOString().slice(0, 10);
    const reportDesde = new Date(Date.now() - (29 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
    if (document.getElementById('dashDesde')) document.getElementById('dashDesde').value = reportDesde;
    if (document.getElementById('dashHasta')) document.getElementById('dashHasta').value = reportHasta;
    async function cargarDashboard(desde, hasta) {
      try {
        const report = await KajaApi.dashboard({ desde, hasta });
        state.dashboardReport = report;
        const kpis = report.kpis || {};
        document.getElementById('ventasDia').textContent = formatMoney(kpis.ventas || 0);
        document.getElementById('ticketPromedio').textContent = formatMoney(kpis.ticket_promedio || 0);
        document.getElementById('facturasDia').textContent = String(kpis.facturas || 0);
        if (report.top_productos && report.top_productos.length) {
          document.getElementById('topProductosList').innerHTML = report.top_productos.slice(0, 4).map((p) => `
            <div class="state-item"><div><strong>${p.nombre}</strong><small>${Number(p.unidades || 0)} und · ${formatMoney(p.total || 0)}</small></div><span>${p.unidades || 0}</span></div>`).join('');
        }
        if (report.stock_por_nivel) {
          const niv = report.stock_por_nivel;
          const tot = Number(niv.total || 0) || 1;
          document.getElementById('stockAlta').style.width = `${(Number(niv.alto || 0) / tot) * 100}%`;
          document.getElementById('stockMedia').style.width = `${(Number(niv.medio || 0) / tot) * 100}%`;
          document.getElementById('stockBaja').style.width = `${(Number(niv.bajo || 0) / tot) * 100}%`;
          document.getElementById('stockBajo').textContent = String(niv.bajo || 0);
        }
        if (report.alertas && report.alertas.length) {
          document.getElementById('stockCritico').innerHTML = report.alertas.slice(0, 4).map((producto) => `
            <div class="state-item warning"><div><strong>${producto.nombre}</strong><small>${producto.stock || 0} unidades</small></div><span>Revisar</span></div>`).join('');
        }
        try {
          const inv = await KajaApi.inventarioReporte().catch(() => null);
          if (inv && inv.length) {
            localStorage.setItem('kajaProductos', JSON.stringify(inv));
            const vt = inv.reduce((s, it) => s + Number(it.precio || 0) * Number(it.stock || 0), 0);
            document.getElementById('valorInventario').textContent = formatMoney(vt);
            document.getElementById('totalProductos').textContent = String(inv.length);
            document.getElementById('resumenInventarioTag').textContent = `Stock ${inv.reduce((s, it) => s + Number(it.stock || 0), 0)} · Valor $${vt.toLocaleString('es-CO')}`;
          }
        } catch (e) {}
        const activeBtn = document.querySelector('.chart-toggle.active');
        const vista = activeBtn ? activeBtn.dataset.chart : 'ventas';
        const esReporte = vista === 'ventas' || vista === 'categorias';
        renderDashboardChart(vista, esReporte ? report : listaProductos);
        try { dibujarEstadisticasKaja(report); } catch (e) {}
      } catch (e) {}
    }
    cargarDashboard(reportDesde, reportHasta);
    document.getElementById('dashFiltrar')?.addEventListener('click', () => {
      const d = document.getElementById('dashDesde')?.value || reportDesde;
      const h = document.getElementById('dashHasta')?.value || reportHasta;
      cargarDashboard(d, h);
    });

    document.getElementById('topProductosList').innerHTML = [...listaProductos].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 4).map((producto) => `
      <div class="state-item">
        <div><strong>${producto.nombre}</strong><small>${producto.codigo || 'Sin código'}</small></div>
        <span>${producto.stock || 0} und</span>
      </div>
    `).join('');

    const criticos = [...listaProductos].filter((producto) => Number(producto.stock || 0) <= 10).slice(0, 4);
    document.getElementById('stockCritico').innerHTML = criticos.length
      ? criticos.map((producto) => `
        <div class="state-item warning">
          <div><strong>${producto.nombre}</strong><small>${producto.stock || 0} unidades</small></div>
          <span>Revisar</span>
        </div>
      `).join('')
      : "<p class='empty-state-small'>Sin alertas por stock</p>";

    document.getElementById('cajerosList').innerHTML = getUsuarios().filter((u) => u.rol === 'CAJERO').map((cajero, index) => `
      <div class="ranking-row">
        <div class="ranking-copy"><strong>${cajero.nombre}</strong><small>${cajero.usuario}</small></div>
        <span class="ranking-value ${index === 0 ? 'warning' : ''}">${index === 0 ? 'Turno 1' : 'Turno 2'}</span>
      </div>
    `).join('') || '<div class="state-item"><div><strong>Sin cajeros</strong><small>No hay registro activo</small></div></div>';

    document.getElementById('resumenDiaList').innerHTML = `
      <div class="ranking-row">
        <div class="ranking-copy"><strong>Ventas estimadas</strong><small>Según operación del día</small></div>
        <span class="ranking-value">$${(valorTotal * 0.24).toLocaleString('es-CO')}</span>
      </div>
      <div class="ranking-row">
        <div class="ranking-copy"><strong>Productos con movimiento</strong><small>Inventario activo</small></div>
        <span class="ranking-value">${Math.max(6, total - 2)}</span>
      </div>
      <div class="ranking-row">
        <div class="ranking-copy"><strong>Turno vigente</strong><small>Estado de atención</small></div>
        <span class="ranking-value">${new Date().getHours() < 12 ? 'Mañana' : new Date().getHours() < 18 ? 'Tarde' : 'Noche'}</span>
      </div>
    `;

    document.querySelectorAll('.chart-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.chart-toggle').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        const isReportChart = button.dataset.chart === 'ventas' || button.dataset.chart === 'categorias';
        renderDashboardChart(button.dataset.chart, isReportChart ? state.dashboardReport : listaProductos);
      });
    });

    renderDashboardChart('barras', listaProductos);
    return;
  }

  if (section === 'ventas') {
    const productos = getInventoryProducts();
    if (localStorage.getItem('token')) {
      fetchProductosApi().then((frescos) => {
        const listaF = Array.isArray(frescos) ? frescos : (frescos && frescos.data ? frescos.data : null);
        if (listaF && listaF.length) localStorage.setItem('kajaProductos', JSON.stringify(listaF));
      }).catch(() => {});
    }
    const cartKey = 'kajaVentaActual';

    function renderSalesCart() {
      const cart = JSON.parse(sessionStorage.getItem(cartKey) || '[]');
      const lista = document.getElementById('saleCart');
      const subtotal = cart.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 1), 0);
      const iva = subtotal * 0.19;
      const total = subtotal + iva;
      const facturaActual = getLastInvoice();

      if (!lista) return;
      if (!cart.length) {
        lista.innerHTML = '<div class="empty-sale">No hay productos en la caja.</div>';
        document.getElementById('saleSubtotal').textContent = formatMoney(0);
        document.getElementById('saleIva').textContent = formatMoney(0);
        document.getElementById('saleTotal').textContent = formatMoney(0);

        if (facturaActual) {
          renderInvoicePreview(facturaActual);
        } else {
          document.getElementById('invoicePreview').innerHTML = '<div class="empty-sale">La factura aparecerá aquí cuando generes la venta.</div>';
        }
        return;
      }

      lista.innerHTML = cart.map((item) => `
        <div class="sale-item-row">
          <div>
            <strong>${item.nombre}</strong>
            <small>${formatMoney(item.precio)} c/u</small>
          </div>
          <div class="sale-actions">
            <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
            <span>${item.cantidad}</span>
            <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
      `).join('');

      document.getElementById('saleSubtotal').textContent = formatMoney(subtotal);
      document.getElementById('saleIva').textContent = formatMoney(iva);
      document.getElementById('saleTotal').textContent = formatMoney(total);
    }

    function addProductToCart(producto) {
      const cart = JSON.parse(sessionStorage.getItem(cartKey) || '[]');
      const stockDisp = Number(producto.stock ?? 999999);
      const existing = cart.find((item) => item.id === producto.id);
      const enCarrito = existing ? Number(existing.cantidad || 0) : 0;
      if (enCarrito + 1 > stockDisp) { toastKaja('STOCK INSUFICIENTE: ' + producto.nombre + ' (disp ' + stockDisp + ')', 'err'); return; }
      if (existing) { existing.cantidad += 1; }
      else { cart.push({ id: producto.id, nombre: producto.nombre, precio: Number(producto.precio || 0), cantidad: 1, codigo: producto.codigo || '' }); }
      sessionStorage.setItem(cartKey, JSON.stringify(cart));
      renderSalesCart();
    }

    function handleCartChange(id, direction) {
      const cart = JSON.parse(sessionStorage.getItem(cartKey) || '[]');
      const item = cart.find((entry) => entry.id === Number(id));
      if (!item) return;
      if (direction === 'increase') item.cantidad += 1;
      if (direction === 'decrease') item.cantidad -= 1;
      const filtered = cart.filter((entry) => entry.cantidad > 0);
      sessionStorage.setItem(cartKey, JSON.stringify(filtered));
      renderSalesCart();
    }

    async function renderReports() {
      const reportList = document.getElementById('dailyReport');
      if (!reportList) return;
      const today = new Date().toISOString().slice(0, 10);
      try {
        const response = await KajaApi.ventas({ desde: today, hasta: today, page: 1, pageSize: 25 });
        const sales = response.data || [];
        if (!sales.length) {
          reportList.innerHTML = '<div class="empty-sale">Aún no hay ventas del día.</div>';
          return;
        }
        const total = sales.reduce((sum, item) => sum + Number(item.total || 0), 0);
        reportList.innerHTML = `
          <div class="report-item"><div><strong>Facturas</strong><small>${sales.length} ventas</small></div><span>${sales.length}</span></div>
          <div class="report-item"><div><strong>Valor total</strong><small>Reporte del día</small></div><span>${formatMoney(total)}</span></div>
          ${sales.slice(0, 6).map((factura) => `
            <div class="report-item" data-invoice-number="${factura.numero_factura}">
              <div><strong>${factura.numero_factura}</strong><small>${new Date(factura.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</small></div>
              <div class="report-actions">
                <button type="button" class="mini-btn mini-btn-light" data-action="select-invoice" data-invoice-id="${factura.id}">Ver</button>
                ${factura.estado === 'EMITIDA' ? `<button type="button" class="mini-btn mini-btn-danger" data-action="annul-invoice" data-invoice-id="${factura.id}">Anular</button>` : ''}
              </div>
              <span>${formatMoney(factura.total)}</span>
            </div>
          `).join('')}
        `;
      } catch (error) {
        reportList.innerHTML = `<div class="empty-sale">${error.message || 'No se pudo cargar el reporte diario'}</div>`;
      }
    }

    /* FACTURA SEGUN LEGISLACION COLOMBIANA (DIAN): NIT, REGIMEN, RESOLUCION, CUFE, IVA DISCRIMINADO */
    function getEmpresaFiscal() {
      const ses = JSON.parse(localStorage.getItem('empresaSession') || '{}');
      return {
        nombre: ses.nombre || getEmpresaLabel(),
        nit: ses.nit || DEFAULT_NIT,
        direccion: ses.direccion || 'Colombia',
        telefono: ses.telefono || '',
        regimen: ses.regimen || 'Responsable de IVA',
        resolucion: ses.resolucion || 'Resolución DIAN de facturación vigente',
        prefijo: ses.prefijo || 'FAC'
      };
    }
    function generarCufe(numero, total, nit) {
      const base = `${numero}|${total}|${nit}|${new Date().toISOString()}`;
      let h = 0;
      for (let i = 0; i < base.length; i++) { h = (h * 31 + base.charCodeAt(i)) >>> 0; }
      return (h.toString(16) + base.length.toString(16)).toUpperCase().padStart(16, '0').slice(0, 32);
    }
    function renderInvoicePreview(factura) {
      const preview = document.getElementById('invoicePreview');
      if (!preview) return;
      const emp = getEmpresaFiscal();
      const invoiceNumber = factura.numero || factura.numero_factura;
      const invoiceDate = factura.fecha || factura.fecha_creacion;
      const items = factura.items || factura.detalles || [];
      const subtotal = Number(factura.subtotal || 0);
      const iva = Number(factura.iva || 0);
      const total = Number(factura.total || 0);
      const cufe = factura.cufe || generarCufe(invoiceNumber, total, emp.nit);
      preview.innerHTML = `
        <div class="ticket-box">
          <div class="invoice-head">
            <div class="invoice-brand">
              <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo KAJA" class="ticket-logo" />
              <div>
                <h4>${emp.nombre}</h4>
                <small>NIT: ${emp.nit} · ${emp.regimen}</small>
                <small>${emp.direccion}${emp.telefono ? ' · Tel ' + emp.telefono : ''}</small>
              </div>
            </div>
            <div class="invoice-number-wrap">
              <span class="invoice-tag">Factura de venta</span>
              <strong>${invoiceNumber}</strong>
            </div>
          </div>
          <div class="ticket-meta">
            <span>Fecha: ${new Date(invoiceDate).toLocaleString('es-CO')}</span>
            <span>Forma de pago: ${factura.metodo_pago || factura.metodo || 'EFECTIVO'}</span>
          </div>
          <div class="ticket-meta">
            <span>Adquiriente: Consumidor final</span>
            <span>CC/NIT: 222222222222</span>
          </div>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Vlr unit.</th>
                <th>Vlr total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => {
                const pu = Number(item.precio ?? item.precio_unitario) || 0;
                const cant = Number(item.cantidad || 1);
                return `
                <tr>
                  <td>${item.nombre || item.nombre_producto}</td>
                  <td>${cant}</td>
                  <td>${formatMoney(pu)}</td>
                  <td>${formatMoney(pu * cant)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div class="ticket-summary">
            <div><span>Subtotal (base gravable)</span><strong>${formatMoney(subtotal)}</strong></div>
            <div><span>IVA 19%</span><strong>${formatMoney(iva)}</strong></div>
            <div class="total"><span>Total a pagar</span><strong>${formatMoney(total)}</strong></div>
          </div>
          <div class="ticket-legal">
            <small>${emp.resolucion}</small>
            <small>Autorización de numeración DIAN · Prefijo ${emp.prefijo} · Régimen: ${emp.regimen}</small>
            <small>CUFE: ${cufe}</small>
            <small>Esta factura de venta se asimila en todos sus efectos a una letra de cambio (Art. 774 C.Co.).</small>
            <small>Generada por KAJA · Software de facturación</small>
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="subheader">
        <div><h1>Punto de venta</h1><p>Venta rápida con facturación y reportes por caja</p></div>
        <div class="d-flex gap-2"><button id="newSaleBtn" class="btn btn-kaja btn-sm">+ Nueva venta</button><button id="exportSalesBtn" class="btn btn-outline-light btn-sm">Exportar Excel</button></div>
      </div>
      <div class="sale-layout">
        <div class="sale-panel panel-box">
          <div class="panel-header"><h3>Buscar producto</h3><span>Escáner</span></div>
          <div class="barcode-row">
            <input id="barcodeInput" type="text" class="form-control" placeholder="Código o nombre del producto">
            <button id="addSaleProduct" class="btn btn-kaja">Agregar</button>
          </div>
          <div id="productPicker" class="sale-product-list">
            ${productos.slice(0, 8).map((producto) => `
              <div class="sale-product-item" data-product-id="${producto.id}">
                <div>
                  <strong>${producto.nombre}</strong>
                  <small>${producto.codigo || 'Sin código'}</small>
                </div>
                <span>${formatMoney(producto.precio || 0)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sale-panel panel-box">
          <div class="panel-header"><h3>Caja</h3><span>Resumen</span></div>
          <label class="form-label" for="saleMetodo">Medio de pago</label>
          <select id="saleMetodo" class="form-control" style="margin-bottom:10px;"><option value="EFECTIVO">EFECTIVO</option><option value="NEQUI">NEQUI</option><option value="DAVIPLATA">DAVIPLATA</option><option value="TRANSFERENCIA">TRANSFERENCIA</option><option value="TARJETA">TARJETA</option></select>
          <div id="saleCart" class="sale-cart"></div>
          <div class="sale-summary">
            <div class="summary-row"><span>Subtotal</span><strong id="saleSubtotal">$0</strong></div>
            <div class="summary-row"><span>IVA</span><strong id="saleIva">$0</strong></div>
            <div class="summary-row total"><span>Total</span><strong id="saleTotal">$0</strong></div>
          </div>
          <div class="sale-actions-row">
            <button id="generateInvoiceBtn" class="btn btn-kaja btn-block">Generar factura</button>
            <button id="clearSaleBtn" class="btn btn-outline-light btn-block">Vaciar caja</button>
          </div>
        </div>
      </div>

      <div class="analytics-grid">
        <div class="panel-box ticket-panel">
          <div class="panel-header"><h3>Factura en pantalla</h3><span>Corriente</span></div>
          <div id="invoicePreview" class="ticket-preview"></div>
        </div>
        <div class="panel-box report-panel">
          <div class="panel-header"><h3>Reporte diario</h3><span>Hoy</span></div>
          <div id="dailyReport" class="report-list"></div>
        </div>
      </div>
      <div class="panel-box" style="margin-top:12px;">
        <div class="panel-header"><h3>Reporte de facturas</h3><span>Guardadas en servidor</span></div>
        <div class="d-flex gap-2 flex-wrap" style="margin-bottom:10px;">
          <input id="facDesde" type="date" class="form-control form-control-sm" style="width:auto;" />
          <input id="facHasta" type="date" class="form-control form-control-sm" style="width:auto;" />
          <input id="facBuscar" type="text" class="form-control form-control-sm" placeholder="Buscar N° factura" style="width:200px;" />
          <button id="facFiltrar" class="btn btn-kaja btn-sm" type="button">Buscar</button>
        </div>
        <div class="table-responsive">
          <table class="table table-dark table-striped table-hover table-bordered table-sm align-middle">
            <thead><tr><th>N°</th><th>Fecha</th><th>Caja</th><th>Pago</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
            <tbody id="facturasBody"><tr><td colspan="7" class="text-center text-muted">Cargando facturas…</td></tr></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('newSaleBtn')?.addEventListener('click', () => {
      sessionStorage.removeItem(cartKey);
      saveLastInvoice(null);
      renderSalesCart();
      document.getElementById('barcodeInput')?.focus();
    });

    document.getElementById('exportSalesBtn')?.addEventListener('click', () => {
      const desde = (document.getElementById('facDesde') && document.getElementById('facDesde').value) || new Date().toISOString().slice(0, 10);
      const hasta = (document.getElementById('facHasta') && document.getElementById('facHasta').value) || desde;
      KajaApi.exportarVentas({ desde, hasta }).catch((error) => alert(error.message));
    });

    document.getElementById('addSaleProduct').addEventListener('click', () => {
      const input = document.getElementById('barcodeInput');
      const search = (input.value || '').trim().toLowerCase();
      const found = productos.find((producto) => (producto.codigo || '').toLowerCase() === search || (producto.nombre || '').toLowerCase().includes(search));
      if (!found) {
        alert('Producto no encontrado');
        return;
      }
      addProductToCart(found);
      input.value = '';
    });

    document.getElementById('productPicker')?.addEventListener('click', (event) => {
      const item = event.target.closest('[data-product-id]');
      if (!item) return;
      const productId = Number(item.dataset.productId || 0);
      const producto = productos.find((entry) => Number(entry.id) === productId);
      if (producto) addProductToCart(producto);
    });

    document.getElementById('clearSaleBtn').addEventListener('click', () => {
      sessionStorage.removeItem(cartKey);
      renderSalesCart();
    });

    document.getElementById('saleCart')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      handleCartChange(button.dataset.id, button.dataset.action);
    });

    document.getElementById('dailyReport')?.addEventListener('click', async (event) => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const invoiceId = actionButton.dataset.invoiceId;
      try {
        if (actionButton.dataset.action === 'select-invoice') {
          const factura = await KajaApi.obtenerVenta(invoiceId);
          saveLastInvoice(factura);
          renderInvoicePreview(factura);
          return;
        }
        if (actionButton.dataset.action === 'annul-invoice') {
          if (!window.confirm('¿Deseas anular esta factura?')) return;
          await KajaApi.anularVenta(invoiceId);
          renderReports();
        }
      } catch (error) { alert(error.message); }
    });

    document.getElementById('generateInvoiceBtn').addEventListener('click', async () => {
      const cart = JSON.parse(sessionStorage.getItem(cartKey) || '[]');
      if (!cart.length) { toastKaja('PRIMERO AGREGA PRODUCTOS A LA CAJA', 'warn'); return; }
      const metodo = document.getElementById('saleMetodo')?.value || 'EFECTIVO';
      try {
        const response = await KajaApi.crearVenta({
          caja: 'Caja principal',
          metodo_pago: metodo,
          items: cart.map((item) => ({ producto_id: item.id, cantidad: item.cantidad }))
        });
        const factura = response.data;
        saveLastInvoice(factura);
        renderInvoicePreview(factura);
        sessionStorage.removeItem(cartKey);
        renderSalesCart();
        renderReports();
        renderFacturasTabla();
        toastKaja('VENTA ' + factura.numero_factura + ' EN ' + (factura.metodo_pago || metodo), 'ok');
        localStorage.setItem('kajaProductos', JSON.stringify(await fetchProductosApi()));
      } catch (error) { toastKaja(error.message || 'NO SE PUDO REGISTRAR LA VENTA', 'err'); }
    });

    function renderFacturasTabla() {
      const body = document.getElementById('facturasBody');
      if (!body) return;
      const hoy = new Date().toISOString().slice(0, 10);
      const desde = (document.getElementById('facDesde') && document.getElementById('facDesde').value) || hoy;
      const hasta = (document.getElementById('facHasta') && document.getElementById('facHasta').value) || hoy;
      const buscar = ((document.getElementById('facBuscar') && document.getElementById('facBuscar').value) || '').trim().toLowerCase();
      body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Cargando facturas…</td></tr>';
      KajaApi.ventas({ desde, hasta, page: 1, pageSize: 100 }).then((resp) => {
        let rows = (resp && resp.data) || [];
        if (buscar) rows = rows.filter((f) => String(f.numero_factura || '').toLowerCase().includes(buscar));
        if (!rows.length) { body.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin facturas guardadas en ese rango.</td></tr>'; return; }
        body.innerHTML = rows.map((f) => '<tr><td>' + f.numero_factura + '</td><td>' + new Date(f.fecha_creacion).toLocaleString('es-CO') + '</td><td>' + (f.caja || 'Caja principal') + '</td><td>' + (f.metodo_pago || 'EFECTIVO') + '</td><td><span class="admin-badge ' + (f.estado === 'EMITIDA' ? 'active' : 'inactive') + '">' + f.estado + '</span></td><td>' + formatMoney(f.total) + '</td><td><div class="admin-actions"><button class="btn-link" data-fac-ver="' + f.id + '">Ver</button>' + (f.estado === 'EMITIDA' ? '<button class="btn-link danger" data-fac-anular="' + f.id + '">Anular</button>' : '') + '</div></td></tr>').join('');
      }).catch((e) => { body.innerHTML = '<tr><td colspan="7" class="text-center text-danger">' + (e.message || 'No se pudo cargar') + '</td></tr>'; });
    }
    if (document.getElementById('facDesde')) document.getElementById('facDesde').value = new Date().toISOString().slice(0, 10);
    if (document.getElementById('facHasta')) document.getElementById('facHasta').value = new Date().toISOString().slice(0, 10);
    document.getElementById('facFiltrar')?.addEventListener('click', renderFacturasTabla);
    document.getElementById('facturasBody')?.addEventListener('click', (ev) => {
      const ver = ev.target.closest('[data-fac-ver]');
      const anular = ev.target.closest('[data-fac-anular]');
      if (ver) { KajaApi.obtenerVenta(ver.dataset.facVer).then((fac) => { saveLastInvoice(fac); renderInvoicePreview(fac); }).catch((e) => alert(e.message)); }
      if (anular) { if (!window.confirm('¿Anular factura?')) return; KajaApi.anularVenta(anular.dataset.facAnular).then(() => { renderFacturasTabla(); renderReports(); }).catch((e) => alert(e.message)); }
    });
    renderSalesCart();
    renderReports();
    renderFacturasTabla();
    return;
  }

  if (section === 'inventario') {
    const categorias = getCategoriasDisponibles();
    content.innerHTML = `
      <div class="subheader">
        <div><h1>Inventario</h1><p>Productos registrados en la empresa</p></div>
        <div class="d-flex gap-2">
          <button id="manageCategoriesBtn" class="btn btn-outline-light btn-sm">Categorías</button>
          <button id="exportInventoryBtn" class="btn btn-outline-light btn-sm">Exportar Excel</button>
          <button id="addProductBtn" class="btn btn-kaja btn-sm">Agregar producto</button>
        </div>
      </div>
      <div class="inventory-panel-box">
        <div class="toolbar-row">
          <div class="category-filter-bar">
            <button class="category-filter active" type="button">Todos</button>
            ${categorias.map((categoria) => `<button class="category-filter" type="button" data-category="${categoria}">${categoria}</button>`).join('')}
            <button class="category-filter" type="button">Bajo stock</button>
          </div>
          <span id="inventoryCountBadge" class="badge text-bg-primary">0 productos</span>
        </div>
        <div class="table-responsive">
          <table class="table table-dark table-striped table-hover table-bordered table-sm align-middle kaja-table" style="border:1px solid rgba(250,204,21,.35);">
            <thead class="table-warning">
              <tr>
                <th style="border:1px solid rgba(250,204,21,.4);">ID</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Código</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Producto</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Categoría</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Stock</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Precio</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Estado</th>
                <th style="border:1px solid rgba(250,204,21,.4);">Acciones</th>
              </tr>
            </thead>
            <tbody id="inventoryDynamicBody">
              <tr><td colspan="8" class="text-center text-muted">Cargando inventario...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    (async () => {
      try {
        const productos = await fetchProductosApi();
        localStorage.setItem('kajaProductos', JSON.stringify(productos));

        const rows = (Array.isArray(productos) && productos.length ? productos : []).map((producto) => `
          <tr>
            <td>${producto.id ?? '-'}</td>
            <td>${producto.codigo || 'Sin código'}</td>
            <td>
              <div class="inventory-item-name">
                <strong>${producto.nombre ?? 'Sin nombre'}</strong>
                <small>${producto.descripcion || 'Sin descripción'}</small>
              </div>
            </td>
            <td>${producto.categoria || 'General'}</td>
            <td>${producto.stock ?? 0}</td>
            <td>$${Number(producto.precio || 0).toLocaleString('es-CO')}</td>
            <td><span class="status-badge ${Number(producto.activo ?? 1) === 1 ? 'active' : 'inactive'}">${Number(producto.activo ?? 1) === 1 ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-editar-producto" data-producto='${JSON.stringify(producto).replace(/'/g, '&#39;')}'>Editar</button>
                <button type="button" class="btn btn-eliminar-producto" data-id="${producto.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join('');

        document.getElementById('inventoryDynamicBody').innerHTML = rows || '<tr><td colspan="8" class="text-center text-muted">No hay productos registrados.</td></tr>';
        document.getElementById('inventoryCountBadge').textContent = `${productos.length || 0} productos`;
        bindInventoryActions();
      } catch (error) {
        document.getElementById('inventoryDynamicBody').innerHTML = `<tr><td colspan="8" class="text-center text-danger">${error.message || 'No se pudo cargar el inventario'}</td></tr>`;
        document.getElementById('inventoryCountBadge').textContent = 'Error';
      }
    })();

    return;
  }

  if (section === 'empresas' || section === 'usuarios' || section === 'roles') {
    const empresas = getEmpresas();
    const usuarios = getUsuarios();
    const roles = getRoles();

    if (section === 'empresas') {
      content.innerHTML = `
        <div class="subheader"><div><h1>Empresas</h1><p>Control de compañías activas</p></div><button class="btn btn-kaja btn-sm" id="addEmpresaBtn">Nueva empresa</button></div>
        <div class="admin-manager-grid">
          <section class="admin-card-panel wide">
            <div class="admin-manager-table-wrap">
              <table class="admin-manager-table table table-dark table-striped table-hover align-middle">
                <thead><tr><th>Nombre</th><th>NIT</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${empresas.map((empresa) => `
                    <tr>
                      <td>${empresa.nombre}</td>
                      <td>${empresa.nit}</td>
                      <td><span class="admin-badge ${empresa.estado === 'Activa' ? 'active' : 'inactive'}">${empresa.estado}</span></td>
                      <td><div class="admin-actions"><button class="btn-link" data-action="editEmpresa" data-id="${empresa.id}">Editar</button><button class="btn-link danger" data-action="deleteEmpresa" data-id="${empresa.id}">Eliminar</button></div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      `;
    } else if (section === 'usuarios') {
      content.innerHTML = `
        <div class="subheader"><div><h1>Usuarios</h1><p>Accesos y permisos del sistema</p></div><button class="btn btn-kaja btn-sm" id="addUsuarioBtn">Nuevo usuario</button></div>
        <div class="admin-manager-grid">
          <section class="admin-card-panel wide">
            <div class="admin-manager-table-wrap">
              <table class="admin-manager-table table table-dark table-striped table-hover align-middle">
                <thead><tr><th>Nombre</th><th>Usuario</th><th>Empresa</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${usuarios.map((usuario) => `
                    <tr>
                      <td>${usuario.nombre}</td>
                      <td>${usuario.usuario}</td>
                      <td>${usuario.empresa}</td>
                      <td>${usuario.rol}</td>
                      <td><span class="admin-badge ${usuario.estado === 'Activo' ? 'active' : 'inactive'}">${usuario.estado}</span></td>
                      <td><div class="admin-actions"><button class="btn-link" data-action="editUser" data-id="${usuario.id}">Editar</button><button class="btn-link danger" data-action="deleteUser" data-id="${usuario.id}">Eliminar</button></div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="subheader"><div><h1>Roles</h1><p>Permisos por perfil</p></div><button class="btn btn-kaja btn-sm" id="addRoleBtn">Nuevo rol</button></div>
        <div class="admin-manager-grid">
          <section class="admin-card-panel wide">
            <div class="admin-manager-table-wrap">
              <table class="admin-manager-table table table-dark table-striped table-hover align-middle">
                <thead><tr><th>Rol</th><th>Permisos</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${roles.map((rol) => `
                    <tr>
                      <td>${rol.nombre}</td>
                      <td>${getArrayPermisos(rol.permisos).join(', ') || 'Sin permisos'}</td>
                      <td><div class="admin-actions"><button class="btn-link" data-action="editRole" data-id="${rol.id}">Editar</button><button class="btn-link danger" data-action="deleteRole" data-id="${rol.id}">Eliminar</button></div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      `;
    }

    function handleAdminAction(action, id) {
      if (action === 'deleteEmpresa') {
        if (!window.confirm('¿Deseas eliminar esta empresa?')) return;
        guardarEmpresas(getEmpresas().filter((item) => String(item.id) !== String(id)));
        loadSection('empresas');
      }
      if (action === 'deleteUser') {
        if (!window.confirm('¿Deseas eliminar este usuario?')) return;
        guardarUsuarios(getUsuarios().filter((item) => String(item.id) !== String(id)));
        loadSection('usuarios');
      }
      if (action === 'deleteRole') {
        if (!window.confirm('¿Deseas eliminar este rol?')) return;
        guardarRoles(getRoles().filter((item) => String(item.id) !== String(id)));
        loadSection('roles');
      }
      if (action === 'editEmpresa') {
        const empresas = getEmpresas();
        const empresa = empresas.find((item) => String(item.id) === String(id));
        if (!empresa) return;
        const nombre = window.prompt('Nuevo nombre de la empresa:', empresa.nombre);
        const nit = window.prompt('Nuevo NIT:', empresa.nit || '900000000-1');
        if (!nombre || !nit) return;
        empresa.nombre = nombre.trim();
        empresa.nit = nit.trim();
        guardarEmpresas(empresas);
        loadSection('empresas');
      }
      if (action === 'editUser') {
        const usuarios = getUsuarios();
        const usuario = usuarios.find((item) => String(item.id) === String(id));
        if (!usuario) return;
        const nombre = window.prompt('Nombre completo:', usuario.nombre);
        const userName = window.prompt('Usuario:', usuario.usuario);
        const rol = window.prompt('Rol (ADMINISTRADOR / CAJERO / INVENTARIO):', usuario.rol || 'CAJERO');
        if (!nombre || !userName || !rol) return;
        usuario.nombre = nombre.trim();
        usuario.usuario = userName.trim();
        usuario.rol = rol.trim().toUpperCase();
        guardarUsuarios(usuarios);
        loadSection('usuarios');
      }
      if (action === 'editRole') {
        const roles = getRoles();
        const rol = roles.find((item) => String(item.id) === String(id));
        if (!rol) return;
        const nombre = window.prompt('Nombre del rol:', rol.nombre);
        const permisos = window.prompt('Permisos separados por coma:', getArrayPermisos(rol.permisos).join(', '));
        if (!nombre) return;
        rol.nombre = nombre.trim().toUpperCase();
        rol.permisos = (permisos || '').split(',').map((item) => item.trim()).filter(Boolean);
        guardarRoles(roles);
        loadSection('roles');
      }
    }

    content.addEventListener('click', (event) => {
      const link = event.target.closest('[data-action]');
      if (!link) return;
      handleAdminAction(link.dataset.action, link.dataset.id);
    });

    document.getElementById('addEmpresaBtn')?.addEventListener('click', () => {
      const nombre = window.prompt('Nombre de la empresa:', 'Empresa nueva');
      if (!nombre) return;
      const empresas = getEmpresas();
      empresas.push({ id: Date.now(), nombre: nombre.trim(), nit: '900000000-1', estado: 'Activa' });
      guardarEmpresas(empresas);
      loadSection('empresas');
    });

    document.getElementById('addUsuarioBtn')?.addEventListener('click', () => {
      const nombre = window.prompt('Nombre completo:', 'Nuevo usuario');
      if (!nombre) return;
      const usuario = window.prompt('Usuario:', 'nuevo.usuario');
      if (!usuario) return;
      const password = window.prompt('Contraseña:', DEFAULT_PASSWORD);
      if (!password) return;
      const rol = window.prompt('Rol (ADMINISTRADOR/CAJERO/INVENTARIO):', 'CAJERO');
      if (!rol) return;
      const usuarios = getUsuarios();
      usuarios.push({ id: Date.now(), nombre: nombre.trim(), usuario: usuario.trim(), password: password.trim(), rol: rol.trim().toUpperCase(), empresa: DEFAULT_COMPANY_NAME, estado: 'Activo', permisos: ['Ventas', 'Caja'] });
      guardarUsuarios(usuarios);
      loadSection('usuarios');
    });

    document.getElementById('addRoleBtn')?.addEventListener('click', () => {
      const nombre = window.prompt('Nombre del rol:', 'AUDITOR');
      if (!nombre) return;
      const permisos = window.prompt('Permisos separados por coma:', 'Ver, Reportes');
      const roles = getRoles();
      roles.push({ id: Date.now(), nombre: nombre.trim().toUpperCase(), permisos: (permisos || '').split(',').map((item) => item.trim()).filter(Boolean) });
      guardarRoles(roles);
      loadSection('roles');
    });

    return;
  }

  if (section === 'developer') {
    const ses = JSON.parse(localStorage.getItem('kajaSessionUser') || '{}');
    content.innerHTML = `
      <div class="subheader"><div><h1>Desarrollador web</h1><p>Acceso total: edita empresas, usuarios, roles, productos y conexión KAJA APP</p></div><span class="admin-badge active">ROL: ${ses.rol || state.role || 'DEV'}</span></div>
      <div class="developer-privileged-grid">
        <section class="admin-card-panel"><div class="admin-card-head"><span>👤 Crear acceso desarrollador / editor</span></div>
          <div class="role-editor-form d-flex flex-column gap-2">
            <input id="devNombre" class="form-control" placeholder="Nombre completo" />
            <input id="devUsuario" class="form-control" placeholder="usuario.dev" />
            <input id="devPass" type="password" class="form-control" placeholder="Contraseña min 8" />
            <select id="devRol" class="form-select"><option value="DESARROLLADOR">DESARROLLADOR</option><option value="EDITOR">EDITOR</option><option value="ADMINISTRADOR">ADMINISTRADOR</option></select>
            <button id="devCrearBtn" class="btn btn-kaja btn-sm">Crear acceso total</button>
            <small style="opacity:.7">Este usuario podrá editar todo el sistema.</small>
          </div>
        </section>
        <section class="admin-card-panel"><div class="admin-card-head"><span>🔗 Conexión KAJA APP (próximamente)</span><span id="appStatusBadge" class="admin-badge active">Verificando…</span></div>
          <div class="developer-config-grid">
            <div class="form-group"><label>URL puente</label><input id="appBridgeUrl" class="form-control" value="http://localhost:3000/api/app/status" readonly /></div>
            <div class="form-group"><label>Estado</label><input id="appBridgeState" class="form-control" value="PROXIMAMENTE" readonly /></div>
            <div class="form-group full-width"><button id="appTestBtn" class="btn btn-kaja btn-sm">Probar conexión</button></div>
          </div>
          <small style="opacity:.7">Backend listo en <b>/api/app/status</b> y <b>/api/app/sync</b> para conectar la app móvil sin romper lo actual.</small>
        </section>
      </div>
      <div class="developer-privileged-grid" style="margin-top:16px;">
        <section class="admin-card-panel"><div class="admin-card-head"><span>⚙ Accesos rápidos de edición total</span></div>
          <div class="developer-actions-list">
            <button class="btn btn-outline-light btn-sm btn-block" data-goto="empresas">Editar empresas</button>
            <button class="btn btn-outline-light btn-sm btn-block" data-goto="usuarios">Editar usuarios</button>
            <button class="btn btn-outline-light btn-sm btn-block" data-goto="roles">Editar roles</button>
            <button class="btn btn-outline-light btn-sm btn-block" data-goto="inventario">Editar inventario</button>
          </div>
        </section>
      </div>
    `;
    document.getElementById('devCrearBtn')?.addEventListener('click', async () => {
      const nombre = document.getElementById('devNombre').value.trim();
      const usuario = document.getElementById('devUsuario').value.trim();
      const password = document.getElementById('devPass').value;
      const rol = document.getElementById('devRol').value;
      if (!nombre || !usuario || !password) { alert('Completa todos los campos'); return; }
      try { await KajaApi.crearUsuario({ nombre, usuario, password, rol }); alert('ACCESO CREADO: ' + usuario + ' (' + rol + ')'); }
      catch (e) { alert(e.message); }
    });
    content.querySelectorAll('[data-goto]')?.forEach((b) => b.addEventListener('click', () => loadSection(b.dataset.goto)));
    fetch(API_URL + '/app/status', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then((j) => {
      const b = document.getElementById('appStatusBadge'); if (b) { b.textContent = (j.estado || 'LISTO').toUpperCase(); }
      const s = document.getElementById('appBridgeState'); if (s) s.value = JSON.stringify(j);
    }).catch(() => { const b = document.getElementById('appStatusBadge'); if (b) b.textContent = 'SIN CONEXION'; });
    document.getElementById('appTestBtn')?.addEventListener('click', async () => {
      try { const r = await fetch(API_URL + '/app/status').then((x) => x.json()); alert('KAJA APP PUENTE: ' + JSON.stringify(r)); }
      catch (e) { alert('No se pudo conectar al puente'); }
    });
    return;
  }
}

function renderLogin() {
  const isSelectMode = state.loginMode === 'select';
  const isCompanyMode = state.loginMode === 'company';
  const isStaffMode = state.loginMode === 'staff';

  app.innerHTML = `
    <div class="login-screen">
      <div class="login-shell">
        <div class="login-header">
          <span class="eyebrow">Acceso</span>
          <h1>${isSelectMode ? 'Selecciona tu tipo de ingreso' : isCompanyMode ? 'Acceso a la empresa' : 'Acceso al sistema'}</h1>
        </div>

        <div class="login-brand-bar">
          <div class="brand-mark">
            <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo KAJA" class="brand-mini-logo" />
            <div>
              <span>KAJA</span>
              <strong>Gestión inteligente</strong>
            </div>
          </div>
          <div class="brand-company-tag">
            <span>Empresa activa</span>
            <strong>${DEFAULT_COMPANY_NAME}</strong>
          </div>
        </div>

        ${isSelectMode ? `
          <div class="login-grid split-login">
            <div class="login-card company-card selection-card" data-login-type="company">
              <div class="login-card-identity company-identity">
                <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo empresa" class="card-logo" />
                <div>
                  <span>Empresa</span>
                  <strong>${DEFAULT_COMPANY_NAME}</strong>
                </div>
              </div>
              <h2>Login de empresa</h2>
              <p class="helper-text">Valida el NIT y la contraseña de la empresa antes de acceder al sistema.</p>
              <button type="button" class="btn-kaja">Entrar</button>
            </div>

            <div class="login-card admin-card selection-card" data-login-type="staff">
              <div class="login-card-identity admin-identity">
                <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo KAJA" class="card-logo" />
                <div>
                  <span>Administración</span>
                  <strong>Usuarios y caja</strong>
                </div>
              </div>
              <h2>Login del sistema</h2>
              <p class="helper-text">Accede con tu usuario y rol del backend de KAJA.</p>
              <button type="button" class="btn-kaja">Entrar</button>
            </div>
          </div>
        ` : ''}

        ${isCompanyMode ? `
          <div class="login-panel company-panel">
            <div class="login-card company-card active-card" data-login-type="company">
              <div class="login-card-identity company-identity">
                <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo empresa" class="card-logo" />
                <div>
                  <span>Empresa</span>
                  <strong>${DEFAULT_COMPANY_NAME}</strong>
                </div>
              </div>
              <h2>Login de empresa</h2>
              <form id="companyForm" class="login-form" novalidate>
                <label class="form-label" for="companyNit">NIT o usuario de la empresa</label>
                <input id="companyNit" type="text" value="" placeholder="NIT o usuario de la empresa" autocomplete="username" />
                <label class="form-label" for="companyPassword">Contraseña</label>
                <input id="companyPassword" type="password" value="" placeholder="••••••••" autocomplete="current-password" />
                <button type="submit" class="btn-kaja">Ingresar</button>
              </form>
              <p id="companyMessage" class="login-message" aria-live="polite"></p>
              <button type="button" class="btn-secondary" id="backToLoginSelect">Volver</button>
            </div>
          </div>
        ` : ''}

        ${isStaffMode ? `
          <div class="login-panel staff-panel">
            <div class="login-card admin-card active-card" data-login-type="staff">
              <div class="login-card-identity admin-identity">
                <img src="../KAJA-FRONTED/assets/logo-kaja.png" alt="Logo KAJA" class="card-logo" />
                <div>
                  <span>Administración</span>
                  <strong>Usuarios y caja</strong>
                </div>
              </div>
              <h2>Login del sistema</h2>
              <form id="staffForm" class="login-form" novalidate>
                <label class="form-label" for="staffUser">Usuario</label>
                <input id="staffUser" type="text" value="" placeholder="Usuario" autocomplete="username" ${state.companyValidated ? '' : 'disabled'} />
                <label class="form-label" for="staffRole">Rol</label>
                <select id="staffRole" class="role-select" ${state.companyValidated ? '' : 'disabled'}>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="CAJERO">Cajero</option>
                  <option value="INVENTARIO">Inventario</option>
                  <option value="EDITOR">Editor (edita todo)</option>
                  <option value="DESARROLLADOR">Desarrollador (acceso total)</option>
                </select>
                <label class="form-label" for="staffPassword">Contraseña</label>
                <input id="staffPassword" type="password" value="" placeholder="••••••••" autocomplete="current-password" ${state.companyValidated ? '' : 'disabled'} />
                <button type="submit" class="btn-kaja" ${state.companyValidated ? '' : 'disabled'}>Ingresar</button>
              </form>
              <p id="staffMessage" class="login-message" aria-live="polite"></p>
              <button type="button" class="btn-secondary" id="backToLoginSelect">Volver</button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const companyForm = document.getElementById('companyForm');
  if (companyForm) {
    const companyNit = document.getElementById('companyNit');
    const companyPassword = document.getElementById('companyPassword');
    const companyMessage = document.getElementById('companyMessage');

    companyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const nit = companyNit.value.trim();
      const password = companyPassword.value.trim();
      try {
        const response = await KajaApi.companyLogin(nit, password);
        state.companyValidated = true;
        state.loginMode = 'staff';
        localStorage.setItem('empresaSession', JSON.stringify(response.empresa));
        companyMessage.textContent = 'Empresa autenticada. Puedes ingresar al backend con tu usuario.';
        companyMessage.className = 'login-message success';
        renderLogin();
      } catch (error) {
        state.companyValidated = false;
        state.loginMode = 'company';
        companyMessage.textContent = error.message || 'Credenciales de empresa incorrectas.';
        companyMessage.className = 'login-message error';
      }
    });
  }

  const staffForm = document.getElementById('staffForm');
  if (staffForm) {
    const staffUser = document.getElementById('staffUser');
    const staffRole = document.getElementById('staffRole');
    const staffPassword = document.getElementById('staffPassword');
    const staffMessage = document.getElementById('staffMessage');

    staffForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const user = staffUser.value.trim();
      const role = staffRole.value;
      const password = staffPassword.value.trim();

      try {
        const authData = await KajaApi.login(user, password);
        const loggedUser = authData.usuario || {};
        if (loggedUser.rol && role !== loggedUser.rol) throw new Error('Usuario o rol no coinciden con la empresa activa');

        state.token = authData.token;
        state.user = loggedUser.username || user;
        state.role = loggedUser.rol || role;
        localStorage.setItem('token', authData.token);
        localStorage.setItem('kajaSessionUser', JSON.stringify(loggedUser));

        const productosDesdeApi = await fetchProductosApi();
        localStorage.setItem('kajaProductos', JSON.stringify(productosDesdeApi));
        renderDashboard();
      } catch (error) {
        staffMessage.textContent = error.message || 'No se pudo iniciar sesión.';
        staffMessage.className = 'login-message error';
      }
    });
  }

  document.querySelectorAll('[data-login-type]').forEach((card) => {
    card.addEventListener('click', (event) => {
      const selectedType = card.dataset.loginType;
      const clickedSelectionButton = event.target.closest('.btn-kaja') && !event.target.closest('form');
      const clickedBackButton = event.target.closest('#backToLoginSelect');

      if (clickedBackButton || event.target.closest('input, select, textarea, label, form')) {
        return;
      }

      if (clickedSelectionButton) {
        if (selectedType === 'staff' && !state.companyValidated) {
          state.loginMode = 'company';
          renderLogin();
          return;
        }

        state.loginMode = selectedType;
        renderLogin();
        return;
      }

      if (selectedType === 'staff' && !state.companyValidated) {
        state.loginMode = 'company';
        renderLogin();
        return;
      }

      state.loginMode = selectedType;
      renderLogin();
    });
  });

  document.getElementById('backToLoginSelect')?.addEventListener('click', () => {
    state.loginMode = 'select';
    renderLogin();
  });
}

renderLogin();
