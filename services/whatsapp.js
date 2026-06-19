const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const { execSync } = require('child_process'); // Requerido para buscar Chrome en la nube

// Inicializamos el SDK de Groq usando tu API KEY del .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Detectamos si estás en Windows (Local) o Linux (Render)
const isWindows = os.platform() === 'win32';

// Buscamos la ruta dinámica de Chrome solo si estamos en Render (Linux)
let renderChromePath = undefined;
if (!isWindows) {
    try {
        // Le pregunta a Puppeteer la ruta exacta de donde instaló Chrome en Render
        renderChromePath = execSync('npx puppeteer browsers latest path').toString().trim();
        console.log(`🤖 Navegador Chrome detectado en Render de forma dinámica: ${renderChromePath}`);
    } catch (e) {
        console.log('⚠️ No se pudo detectar la ruta dinámica, usando ruta estimada de respaldo...');
        renderChromePath = '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome';
    }
}

const client = new Client({
    authStrategy: new LocalAuth(), // Mantiene tu sesión guardada
    puppeteer: {
        headless: true,
        // Si está en Windows usa el CHROME_PATH local, si está en Render usa la ruta dinámica de Linux
        executablePath: isWindows ? (process.env.CHROME_PATH || undefined) : renderChromePath, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

// EVENTO DE MENSAJES: Aquí es donde ocurre la magia con la IA
client.on('message', async (msg) => {
    try {
        // Evitamos que el bot procese estados globales de WhatsApp
        if (msg.from === 'status@broadcast') return;

        console.log(`📩 Mensaje recibido de ${msg.from}: ${msg.body}`);

        // 1. Llamada real a Groq Cloud con el modelo activo y vigente
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres el asistente virtual de TommyDevStudio. Responde de forma clara, profesional, amable y concisa."
                },
                {
                    role: "user",
                    content: msg.body
                }
            ],
            model: "llama-3.1-8b-instant", // Modelo ultra rápido y activo
        });

        const respuestaIA = chatCompletion.choices[0]?.message?.content || "";

        // 2. ✨ FILTRO: Quitamos todos los asteriscos (*) del formato Markdown para WhatsApp
        const respuestaLimpia = respuestaIA.replace(/\*/g, '');

        // 3. Enviamos la respuesta limpia de vuelta al usuario
        await msg.reply(respuestaLimpia);

    } catch (error) {
        console.error('❌ Error al procesar el mensaje con Groq:', error);
    }
});

// Evento cuando el bot está listo
client.on('ready', () => {
    console.log('🚀 TommyDevStudio Bot conectado exitosamente a WhatsApp Web.');
});

// Evento para mostrar el código QR pintado en la terminal
client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('Regenerando Código QR... Escanéalo por favor:');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true }); // Dibuja el QR directamente en la consola
});

module.exports = client;