const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");

/* 🔹 Función para consultar IA */
async function getAIResponse(message) {
    const apiKey = "TU_API_KEY"; // reemplaza con tu clave real
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: message }]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

/* MENSAJE DEL USUARIO */
function addUserMessage(message) {
    const div = document.createElement("div");
    div.className = "message user";
    div.innerHTML = `
        <div class="message-content">
            ${escapeHTML(message)}
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

/* MENSAJE DEL BOT */
function addBotMessage(message) {
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerHTML = `
        <div class="message-content">
            ${message}
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

/* RESPUESTAS */
async function getBotResponse(message) {
    const text = normalizeText(message);

    /* SALUDO */
    if (text.includes("hola") || text.includes("buenas") || text.includes("saludos")) {
        return `¡Hola! 👋<br><br>Soy el <strong>Asistente KAJA</strong>. Estoy aquí para ayudarte a conocer el sistema.`;
    }

    /* ¿QUÉ ES KAJA? */
    if (text.includes("que es kaja") || text.includes("kaja")) {
        return `<strong>KAJA</strong> es un Sistema de Punto de Venta con Inventario diseñado para apoyar la gestión de productos, existencias y ventas en pequeños y medianos establecimientos.`;
    }

    /* INVENTARIO */
    if (text.includes("inventario") || text.includes("stock") || text.includes("existencias")) {
        return `El módulo de <strong>Inventario</strong> permite consultar y administrar los productos registrados y sus existencias.<br><br>De esta manera se facilita el control de los productos disponibles en el establecimiento.`;
    }

    /* PRODUCTOS */
    if (text.includes("producto") || text.includes("productos")) {
        return `En KAJA se pueden gestionar los productos registrados.<br><br>Dependiendo de los permisos del usuario, se pueden consultar, registrar, actualizar y eliminar productos.`;
    }

    /* ADMINISTRADOR */
    if (text.includes("administrador") || text.includes("admin")) {
        return `El <strong>administrador</strong> tiene mayores permisos dentro del sistema.<br><br>Puede gestionar información del sistema y realizar operaciones administrativas sobre productos e inventario, según las funciones habilitadas.`;
    }

    /* CAJERO */
    if (text.includes("cajero") || text.includes("caja") || text.includes("ventas")) {
        return `El usuario <strong>cajero</strong> está orientado principalmente a las operaciones de venta y manejo de caja.<br><br>Esto permite separar las funciones operativas de las funciones administrativas.`;
    }

    /* TECNOLOGÍAS */
    if (text.includes("tecnologia") || text.includes("tecnologias") || text.includes("tecnologías")) {
        return `KAJA utiliza tecnologías web para construir su sistema.<br><br><strong>Frontend:</strong> HTML, CSS y JavaScript.<br><strong>Backend:</strong> Node.js y Express.<br><strong>Base de datos:</strong> MySQL.<br><br>El proyecto también incorpora tecnologías emergentes como un asistente conversacional.`;
    }

    /* FRONTEND */
    if (text.includes("frontend") || text.includes("interfaz")) {
        return `El <strong>Frontend</strong> corresponde a la parte visual de KAJA con la que interactúa el usuario.<br><br>Allí se presentan los módulos, formularios, tablas, botones y demás elementos de la interfaz.`;
    }

    /* BACKEND */
    if (text.includes("backend") || text.includes("servidor")) {
        return `El <strong>Backend</strong> se encarga de procesar las solicitudes del sistema y comunicarse con la base de datos.<br><br>En KAJA se desarrolla utilizando <strong>Node.js + Express</strong>.`;
    }

    /* BASE DE DATOS */
    if (text.includes("base de datos") || text.includes("mysql")) {
        return `KAJA utiliza <strong>MySQL</strong> como sistema de gestión de base de datos.<br><br>Allí se almacena la información necesaria para el funcionamiento del sistema.`;
    }

    /* OBJETIVO */
    if (text.includes("objetivo") || text.includes("para que sirve") || text.includes("para que sirve kaja")) {
        return `El objetivo de KAJA es facilitar la administración de productos, inventario, ventas y operaciones de caja mediante una solución informática accesible para pequeños y medianos negocios.`;
    }

    /* AYUDA */
    if (text.includes("ayuda") || text.includes("opciones") || text.includes("puedes hacer")) {
        return `Puedo ayudarte con temas relacionados con:<br><br>• KAJA<br>• Inventario<br>• Productos<br>• Ventas<br>• Administrador<br>• Cajero<br>• Frontend<br>• Backend<br>• MySQL<br>• Tecnologías utilizadas`;
    }

    /* DESPEDIDA */
    if (text.includes("adios") || text.includes("adiós") || text.includes("gracias") || text.includes("chao")) {
        return `¡Con gusto! 😊<br><br>Gracias por utilizar el <strong>Asistente KAJA</strong>.`;
    }

    /* RESPUESTA POR DEFECTO → IA */
    try {
        const aiResponse = await getAIResponse(message);
        return aiResponse;
    } catch (error) {
        return `No tengo una respuesta específica para esa pregunta todavía.<br><br>Pregunta por <strong>KAJA, inventario, productos, ventas, administrador, cajero, frontend, backend, MySQL o tecnologías</strong>.`;
    }
}

/* NORMALIZAR TEXTO */
function normalizeText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* SEGURIDAD */
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* SCROLL */
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ENTER */
userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

/* 🔹 Ajuste de funciones para async */
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    addUserMessage(message);
    userInput.value = "";

    const response = await getBotResponse(message);
    addBotMessage(response);
}

async function quickQuestion(question) {
    addUserMessage(question);
    const response = await getBotResponse(question);
    addBotMessage(response);
}
/* =========================
   CONTROL DE LA BURBUJA
========================= */

const chatbotButton = document.getElementById("chatbot-button");
const chatbotContainer = document.getElementById("chatbot-container");
const chatClose = document.getElementById("chat-close");


/* ABRIR CHAT */

chatbotButton.addEventListener("click", () => {
    chatbotContainer.classList.add("active");
});


/* CERRAR CHAT */

chatClose.addEventListener("click", () => {
    chatbotContainer.classList.remove("active");
});