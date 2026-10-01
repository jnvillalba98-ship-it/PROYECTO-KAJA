const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");

const BOT_KB = [
  {
    pattern: /(hola|buenas|saludos|buen dia|buenas tardes|buenas noches)/i,
    response: "¡Hola! 👋 Soy el asistente virtual de <strong>KAJA</strong>. Puedo ayudarte con inventario, productos, ventas, roles, facturación y más."
  },
  {
    pattern: /(que es kaja|kaja|sistema kaja)/i,
    response: "<strong>KAJA</strong> es un sistema de gestión empresarial pensado para controlar inventario, ventas, usuarios, roles, movimientos y operaciones clave del negocio de forma más ordenada."
  },
  {
    pattern: /(inventario|stock|existencias|producto)/i,
    response: "El módulo de <strong>Inventario</strong> ayuda a revisar existencias, Categorías, alertas y disponibilidad de productos para tomar decisiones rápidas y evitar faltantes."
  },
  {
    pattern: /(ventas|caja|factura|ticket)/i,
    response: "En KAJA las ventas y la caja están orientadas a registrar movimientos de forma segura, revisar el día de operación y mantener el flujo comercial más claro para el negocio."
  },
  {
    pattern: /(administrador|admin|roles|usuarios)/i,
    response: "El <strong>administrador</strong> tiene un rol con mayor control del sistema y puede supervisar usuarios, permisos, empresas y configuración del negocio según los accesos habilitados."
  },
  {
    pattern: /(cajero|operacion|movimiento)/i,
    response: "El rol de <strong>cajero</strong> está centrado en la operación diaria: ventas, cobros y seguimiento del flujo de caja sin entrar en configuraciones generales del sistema."
  },
  {
    pattern: /(frontend|interfaz|pantalla|ui)/i,
    response: "El <strong>Frontend</strong> corresponde a la parte visual y operativa de KAJA: pantallas, botones, formularios, reportes y experiencia del usuario dentro del sistema."
  },
  {
    pattern: /(backend|servidor|api|node|express)/i,
    response: "El <strong>Backend</strong> procesa la lógica del negocio y conecta la interfaz con la base de datos. En KAJA, normalmente se trabaja con <strong>Node.js + Express</strong> y MySQL."
  },
  {
    pattern: /(mysql|base de datos|datos)/i,
    response: "KAJA usa <strong>MySQL</strong> para almacenar información de empresas, usuarios, productos, ventas y reportes clave del sistema."
  },
  {
    pattern: /(tecnologia|tecnologias|stack|tecnologias)/i,
    response: "La base de KAJA es moderna y práctica: <strong>HTML, CSS, JavaScript</strong> en front-end, <strong>Node.js + Express</strong> en back-end y <strong>MySQL</strong> como almacén de datos."
  },
  {
    pattern: /(objetivo|para que sirve|ayuda)/i,
    response: "El objetivo de KAJA es facilitar la administración diaria de un negocio: controlar inventario, operar ventas, mantener información organizada y dar claridad a decisiones de negocio."
  },
  {
    pattern: /(gracias|adios|adiós|chao)/i,
    response: "¡Con gusto! 😊 Estoy aquí para ayudarte cuando quieras revisar el sistema, el inventario o la operación de KAJA."
  }
];

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text || "");
  return div.innerHTML;
}

function scrollToBottom() {
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(message) {
  const div = document.createElement("div");
  div.className = "message user";
  div.innerHTML = `<div class="message-content">${escapeHTML(message)}</div>`;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function addBotMessage(message) {
  const div = document.createElement("div");
  div.className = "message bot";
  div.innerHTML = `<div class="message-content">${message}</div>`;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function addTypingIndicator() {
  const div = document.createElement("div");
  div.className = "message bot typing";
  div.innerHTML = `<div class="message-content"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatMessages.appendChild(div);
  scrollToBottom();
  return div;
}

function getBotResponse(message) {
  const text = normalizeText(message);

  for (const item of BOT_KB) {
    if (item.pattern.test(text)) {
      return item.response;
    }
  }

  return "No tengo una respuesta específica para esa pregunta todavía, pero puedo ayudarte con <strong>KAJA</strong>, inventario, ventas, productos, usuarios, reportes, frontend o backend."
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addUserMessage(message);
  userInput.value = "";

  const typing = addTypingIndicator();
  await new Promise((resolve) => setTimeout(resolve, 350));
  typing.remove();
  addBotMessage(getBotResponse(message));
}

async function quickQuestion(question) {
  addUserMessage(question);
  const typing = addTypingIndicator();
  await new Promise((resolve) => setTimeout(resolve, 300));
  typing.remove();
  addBotMessage(getBotResponse(question));
}

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

const chatbotButton = document.getElementById("chatbot-button");
const chatbotContainer = document.getElementById("chatbot-container");
const chatClose = document.getElementById("chat-close");

chatbotButton.addEventListener("click", () => {
  chatbotContainer.classList.add("active");
  userInput.focus();
});

chatClose.addEventListener("click", () => {
  chatbotContainer.classList.remove("active");
});

const initialGreeting = "¡Hola! Soy el asistente virtual de <strong>KAJA</strong>. ¿En qué puedo ayudarte hoy?";
addBotMessage(initialGreeting);