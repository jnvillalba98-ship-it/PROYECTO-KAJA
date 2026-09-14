window.KajaApi = (() => {
  const API_URL = 'http://localhost:3000/api';

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    const token = localStorage.getItem('token');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.blob();

    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error(body?.mensaje || 'Sesión expirada');
    }
    if (!response.ok) throw new Error(body?.mensaje || 'No se pudo completar la solicitud');
    return body;
  }

  const json = (path, method = 'GET', body) => request(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const queryString = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });
    const result = query.toString();
    return result ? `?${result}` : '';
  };

  async function download(path, filename, params = {}) {
    const blob = await request(`${path}${queryString(params)}`, { method: 'GET' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return {
    login: (usuario, password) => json('/auth/login', 'POST', { usuario, password }),
    companyLogin: (nit, password) => json('/auth/company-login', 'POST', { nit, password }),
    me: () => json('/auth/me'),
    changePassword: (password) => json('/auth/password', 'PATCH', { password }),

    empresas: (params) => json(`/empresas${queryString(params)}`),
    crearEmpresa: (payload) => json('/empresas', 'POST', payload),
    actualizarEmpresa: (id, payload) => json(`/empresas/${id}`, 'PUT', payload),
    cambiarEstadoEmpresa: (id, activo) => json(`/empresas/${id}/estado`, 'PATCH', { activo }),

    usuarios: (params) => json(`/usuarios${queryString(params)}`),
    crearUsuario: (payload) => json('/usuarios', 'POST', payload),
    actualizarUsuario: (id, payload) => json(`/usuarios/${id}`, 'PUT', payload),
    cambiarEstadoUsuario: (id, activo) => json(`/usuarios/${id}/estado`, 'PATCH', { activo }),
    cambiarPasswordUsuario: (id, password) => json(`/usuarios/${id}/password`, 'PATCH', { password }),

    roles: () => json('/roles'),
    actualizarRol: (id, payload) => json(`/roles/${id}`, 'PUT', payload),

    categorias: (params) => json(`/categorias${queryString(params)}`),
    crearCategoria: (nombre) => json('/categorias', 'POST', { nombre }),
    actualizarCategoria: (id, nombre) => json(`/categorias/${id}`, 'PUT', { nombre }),
    cambiarEstadoCategoria: (id, activo) => json(`/categorias/${id}/estado`, 'PATCH', { activo }),

    productos: (params) => json(`/productos${queryString(params)}`),
    crearProducto: (payload) => json('/productos', 'POST', payload),
    actualizarProducto: (id, payload) => json(`/productos/${id}`, 'PUT', payload),
    desactivarProducto: (id) => json(`/productos/${id}`, 'DELETE'),
    eliminarProductoDefinitivo: (id) => json(`/productos/${id}?forzar=1`, 'DELETE'),

    ventas: (params) => json(`/ventas${queryString(params)}`),
    crearVenta: (payload) => json('/ventas', 'POST', payload),
    obtenerVenta: (id) => json(`/ventas/${id}`),
    anularVenta: (id) => json(`/ventas/${id}/anular`, 'PATCH'),

    dashboard: (params) => json(`/reportes/dashboard${queryString(params)}`),
    inventarioReporte: () => json('/reportes/inventario'),
    exportarVentas: (params) => download('/exportaciones/ventas.xlsx', 'kaja-ventas.xlsx', params),
    exportarInventario: () => download('/exportaciones/inventario.xlsx', 'kaja-inventario.xlsx'),
    exportarUsuarios: () => download('/exportaciones/usuarios.xlsx', 'kaja-usuarios.xlsx')
  };
})();

/* PUENTE FRONTEND-BACKEND: VERIFICA SALUD DEL SERVIDOR Y SINCRONIZA PRODUCTOS Y CATEGORIAS AL CACHE LOCAL */
(() => {
  const API_BASE = 'http://localhost:3000/api';
  async function health() {
    try {
      const r = await fetch(`${API_BASE}/health`);
      if (!r.ok) return { ok: false };
      return await r.json();
    } catch (e) { return { ok: false }; }
  }
  async function syncCache() {
    if (!window.KajaApi || !localStorage.getItem('token')) return { ok: false };
    const resumen = {};
    try {
      const prod = await window.KajaApi.productos({ page: 1, pageSize: 200 }).catch(() => null);
      const lista = Array.isArray(prod) ? prod : (prod && prod.data ? prod.data : null);
      if (lista) { localStorage.setItem('kajaProductos', JSON.stringify(lista)); resumen.productos = lista.length; }
    } catch (e) {}
    try {
      const cats = await window.KajaApi.categorias({ activo: 1 }).catch(() => null);
      const listaC = Array.isArray(cats) ? cats : (cats && cats.data ? cats.data : null);
      if (listaC) {
        const nombres = listaC.map((c) => (typeof c === 'string' ? c : c.nombre)).filter(Boolean);
        if (nombres.length) localStorage.setItem('kajaCategorias', JSON.stringify(nombres));
        resumen.categorias = nombres.length;
      }
    } catch (e) {}
    return { ok: true, resumen };
  }
  function ensureBadge() {
    let b = document.getElementById('kaja-conexion-badge');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'kaja-conexion-badge';
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;font:12px Inter,system-ui;padding:7px 11px;border-radius:999px;background:#0f172a;color:#e2e8f0;border:1px solid rgba(148,163,184,.35);';
    b.textContent = 'KAJA: verificando servidor…';
    document.body.appendChild(b);
    return b;
  }
  async function pintarEstado() {
    const badge = ensureBadge();
    const h = await health();
    badge.textContent = (h && h.ok) ? '● KAJA servidor conectado' : '○ KAJA sin servidor (modo demo local)';
    return h;
  }
  if (window.KajaApi) { window.KajaApi.health = health; window.KajaApi.syncCache = syncCache; window.KajaApi.pintarEstado = pintarEstado; }
  let ultimo = localStorage.getItem('token') || '';
  setInterval(async () => {
    const t = localStorage.getItem('token') || '';
    if (t && t !== ultimo) { ultimo = t; try { await syncCache(); } catch (e) {} }
    if (!t) ultimo = '';
  }, 2500);
  document.addEventListener('DOMContentLoaded', () => {
    pintarEstado();
    setInterval(pintarEstado, 15000);
    setTimeout(() => { syncCache().catch(() => {}); }, 3000);
  });
})();
