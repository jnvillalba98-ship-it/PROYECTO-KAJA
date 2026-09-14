const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Módulos", href: "#modulos" },
  { label: "Tecnologías", href: "#skills" }
];

const CONTACT_ITEMS = [
  {
    href: "https://wa.me/573213775435",
    icon: "fa-brands fa-whatsapp",
    label: "321 377 5435",
    external: true,
    raw: "https://wa.me/573213775435"
  },
  {
    href: "mailto:jnvillalba98@gmail.com",
    icon: "fa-regular fa-envelope",
    label: "jnvillalba98@gmail.com",
    external: false,
    raw: "mailto:jnvillalba98@gmail.com"
  }
];

const MODULES = [
  { icon: "fas fa-boxes-stacked", title: "Inventario", text: "Consulta rápida del stock, categorías personalizadas y gestión de existencias." },
  { icon: "fas fa-tags", title: "Productos", text: "Administra precios, categorías, estados y disponibilidad operativa." },
  { icon: "fas fa-file-invoice-dollar", title: "Facturación", text: "Generación de factura electrónica y vista directa para imprimir desde la pantalla." },
  { icon: "fas fa-chart-column", title: "Reportes por caja", text: "Monitorea movimientos, ventas y reportes del día por cada caja operativa." },
  { icon: "fas fa-mobile-screen-button", title: "Módulo móvil", text: "Control de operaciones clave desde dispositivos móviles con acceso rápido y seguimiento en tiempo real." },
  { icon: "fas fa-user-shield", title: "Usuarios y roles", text: "Control de accesos para administradores, cajeros y perfiles con permisos." },
  { icon: "fas fa-building", title: "Empresas", text: "Gestión centralizada de datos y configuración institucional del sistema." }
];

const TECHNOLOGIES = [
  { icon: "fas fa-code", title: "HTML" },
  { icon: "fas fa-paint-brush", title: "CSS" },
  { icon: "fas fa-bolt", title: "JavaScript" },
  { icon: "fas fa-server", title: "Node.js" },
  { icon: "fas fa-route", title: "Express" },
  { icon: "fas fa-database", title: "MySQL" }
];

const ADVANTAGES = [
  { icon: "fas fa-chart-line", title: "Control visual", text: "Monitorea stock, desempeño y operaciones con información más clara y rápida." },
  { icon: "fas fa-shield-halved", title: "Seguridad", text: "Accesos definidos por roles para proteger la información y la administración del sistema." },
  { icon: "fas fa-gears", title: "Escalabilidad", text: "Diseñado para acompasar el crecimiento del negocio y sumar más funciones sin rehacerlo." },
  { icon: "fas fa-headset", title: "Soporte cercano", text: "Contacto directo para resolver dudas y acompañar la operación del sistema de forma ágil." }
];

function buildNavigation() {
  return NAV_LINKS.map((link) => `
    <a href="${link.href}">${link.label}</a>
  `).join("");
}

function buildContactLinks() {
  return CONTACT_ITEMS.map((item) => `
    <a
      class="contact-pill"
      href="${item.href}"
      ${item.external ? 'target="_blank" rel="noreferrer"' : ""}
    >
      <i class="${item.icon}"></i>
      ${item.label}
    </a>
  `).join("");
}

function buildCards(items, className) {
  return items.map((item) => `
    <article class="${className}">
      <i class="${item.icon}"></i>
      <h3>${item.title}</h3>
      ${item.text ? `<p>${item.text}</p>` : ""}
    </article>
  `).join("");
}

function renderApp() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <header class="navbar">
      <div class="logo">
        <img src="assets/logo-kaja.png" alt="Logo KAJA" />
      </div>

      <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="nav-links" aria-label="Navegación principal">
        ${buildNavigation()}
      </nav>

      <div class="user" aria-label="Contacto de KAJA">
        <button class="contact-toggle" type="button" aria-expanded="false">
          <span>Contacto</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="user-links">
          ${buildContactLinks()}
        </div>
      </div>
    </header>

    <main class="page-shell">
      <section class="hero" id="inicio">
        <div class="hero-inner">
          <div class="hero-copy reveal">
            <span class="eyebrow">SOFTWARE EMPRESARIAL</span>
            <h1>KAJA</h1>
            <h2>Sistema inteligente de gestión empresarial + módulo móvil</h2>
            <p>
              KAJA ofrece gestión empresarial con control del inventario, usuarios, roles y procesos
              esenciales, además de un módulo móvil para monitorear operaciones clave desde dispositivos
              móviles y facilitar la operación diaria de pequeños y medianos negocios.
            </p>

            <div class="hero-actions">
              <button class="primary-btn admin-btn" type="button">Ingresar a mi empresa</button>
            </div>

            <div class="hero-badges">
              <span class="badge">Autenticación segura</span>
              <span class="badge">Inventario moderno</span>
              <span class="badge">Gestión centralizada</span>
            </div>
          </div>

          <div class="hero-panel reveal">
            <div class="panel-card kaja-dash-mock">
              <div class="kaja-dash-top">
                <div class="kaja-dash-brand">
                  <img src="assets/logo-kaja.png" alt="Logo KAJA" />
                  <div>
                    <strong>Panel KAJA</strong>
                    <small>Control central de operación</small>
                  </div>
                </div>
                <span class="status">En línea</span>
              </div>

              <div class="kaja-dash-body">
                <aside class="kaja-dash-side">
                  <span class="kaja-dash-item active">Dashboard</span>
                  <span class="kaja-dash-item">Ventas</span>
                  <span class="kaja-dash-item">Inventario</span>
                  <span class="kaja-dash-item">Empresas</span>
                  <span class="kaja-dash-item">Usuarios</span>
                  <span class="kaja-dash-item">Roles</span>
                  <span class="kaja-dash-item">Desarrollador</span>
                </aside>

                <div class="kaja-dash-main">
                  <div class="kaja-dash-kpis">
                    <div class="kaja-kpi"><span class="kaja-kpi-ico blue">⟡</span><div><small>Ventas del día</small><strong>$1.248.000</strong></div></div>
                    <div class="kaja-kpi"><span class="kaja-kpi-ico gold">◌</span><div><small>Facturas</small><strong>32</strong></div></div>
                    <div class="kaja-kpi"><span class="kaja-kpi-ico gold">✦</span><div><small>Ticket prom.</small><strong>$39.000</strong></div></div>
                    <div class="kaja-kpi"><span class="kaja-kpi-ico red">◫</span><div><small>Valor inventario</small><strong>$8.4M</strong></div></div>
                  </div>

                  <div class="kaja-dash-chart" aria-label="Ventas por día">
                    <span style="height: 35%"></span>
                    <span style="height: 48%"></span>
                    <span style="height: 62%"></span>
                    <span style="height: 52%"></span>
                    <span style="height: 78%"></span>
                    <span style="height: 70%"></span>
                    <span style="height: 95%"></span>
                  </div>

                  <div class="kaja-dash-list">
                    <div class="kaja-dash-row"><span>Monitor Samsung 24</span><b>13 und</b></div>
                    <div class="kaja-dash-row"><span>SSD Kingston 480GB</span><b>12 und</b></div>
                    <div class="kaja-dash-row"><span>Router TP-Link</span><b>9 und</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="modules reveal" id="modulos">
        <div class="section-header">
          <span class="eyebrow eyebrow-dark">Módulos inteligentes</span>
          <h2>Todo lo que necesitas para operar con orden</h2>
          <p>Herramientas enfocadas en productividad, datos claros y decisiones rápidas.</p>
        </div>

        <div class="modules-grid">
          ${buildCards(MODULES, "module-card")}
        </div>
      </section>

      <section class="skills reveal" id="skills">
        <div class="section-header">
          <span class="eyebrow eyebrow-dark">Tecnología</span>
          <h2>Tecnologías implementadas</h2>
          <p>Una base moderna para un sistema robusto, escalable y preparado para crecer.</p>
        </div>

        <div class="skills-grid">
          ${buildCards(TECHNOLOGIES, "skill-card")}
        </div>
      </section>

      <section class="extra-showcase reveal">
        <div class="section-header">
          <span class="eyebrow eyebrow-dark">Ventajas</span>
          <h2>KAJA está pensado para crecer contigo</h2>
          <p>Un sistema práctico, ordenado y listo para gestionar inventario, ventas y operaciones diarias sin complicaciones.</p>
        </div>

        <div class="showcase-grid">
          ${buildCards(ADVANTAGES, "showcase-card")}
        </div>
      </section>
    </main>

    <footer>
      <div class="footer-mark">
        <i class="fas fa-box"></i>
      </div>
      <p>© 2026 KAJA — Modern POS & Finance</p>
    </footer>

    <button id="kaja-chat-button" aria-label="Abrir Asistente KAJA">
      <i class="fas fa-comment-dots"></i>
    </button>

    <div id="kaja-chat-window" aria-hidden="true">
      <div id="kaja-chat-header">
        <span>Asistente KAJA</span>
        <button id="kaja-chat-close" aria-label="Cerrar Asistente KAJA">×</button>
      </div>
      <iframe id="kaja-chat-iframe" src="chatbot/index.html" title="Asistente KAJA"></iframe>
    </div>
  `;

  bindLandingEvents();
}

function bindLandingEvents() {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const adminBtn = document.querySelector(".admin-btn");
  const contactToggle = document.querySelector(".contact-toggle");
  const contactMenu = document.querySelector(".user-links");
  const chatButton = document.getElementById("kaja-chat-button");
  const chatWindow = document.getElementById("kaja-chat-window");
  const chatClose = document.getElementById("kaja-chat-close");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("menu-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("menu-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      const currentPath = window.location.pathname;
      const isInsideFrontFolder = currentPath.includes("/KAJA-FRONTED") || currentPath.endsWith("/KAJA-FRONTED");

      const loginCandidates = isInsideFrontFolder
        ? ["../LOGIN-KAJA/index.html", "/LOGIN-KAJA/index.html", "LOGIN-KAJA/index.html"]
        : ["LOGIN-KAJA/index.html", "/LOGIN-KAJA/index.html", "../LOGIN-KAJA/index.html"];

      const loginTarget = loginCandidates.find((candidate) => {
        try {
          const url = new URL(candidate, window.location.href);
          return url.pathname && url.pathname !== currentPath;
        } catch (error) {
          return false;
        }
      }) || "../LOGIN-KAJA/index.html";

      window.location.href = loginTarget;
    });
  }

  if (contactToggle && contactMenu) {
    contactToggle.addEventListener("click", () => {
      const isOpen = contactMenu.classList.toggle("open");
      contactToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!contactToggle.contains(event.target) && !contactMenu.contains(event.target)) {
        contactMenu.classList.remove("open");
        contactToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (chatButton && chatWindow && chatClose) {
    chatButton.addEventListener("click", () => {
      chatWindow.classList.add("active");
      chatWindow.setAttribute("aria-hidden", "false");
    });

    chatClose.addEventListener("click", () => {
      chatWindow.classList.remove("active");
      chatWindow.setAttribute("aria-hidden", "true");
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }
}

document.addEventListener("DOMContentLoaded", renderApp);
