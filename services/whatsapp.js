const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const path = require('path'); // 1. Importamos path para manejar rutas de Linux

// Inicializamos el SDK de Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Detectamos el entorno
const isWindows = os.platform() === 'win32';

// Definimos la ruta exacta de Chrome para Render (Linux)
const RENDER_CHROME_PATH = '/opt/render/project/src/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome';

// Guardamos el momento exacto en que arranca el script para ignorar mensajes viejos
const bootTime = Math.floor(Date.now() / 1000);

const client = new Client({
    // 2. OBLIGAMOS a LocalAuth a guardar la sesión en la carpeta /tmp de la nube si es Linux
    authStrategy: new LocalAuth({
        clientId: "tommy-bot-session",
        dataPath: isWindows ? path.join(__dirname, '../.wwebjs_auth') : '/tmp/.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        executablePath: isWindows ? (process.env.CHROME_PATH || undefined) : RENDER_CHROME_PATH, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--disable-audio-output',
            // 3. Forzamos a Chrome a tirar toda su caché de navegación a /tmp
            isWindows ? '--disk-cache-dir=./.cache' : '--disk-cache-dir=/tmp/pulse-cache',
            '--js-flags="--max-old-space-size=150"'
        ]
    }
});

// EVENTO DE MENSAJES: Conexión e integración con Groq Cloud
client.on('message', async (msg) => {
    try {
        // Evitamos responder a estados globales de WhatsApp
        if (msg.from === 'status@broadcast') return;

        // 🔥 FILTRO DE MEMORIA: Ignora mensajes antiguos recibidos antes de que el bot encendiera
        if (msg.timestamp < bootTime) return;

        console.log(`\n📩 Mensaje recibido de ${msg.from}: ${msg.body}`);

        // 1. Llamada real a Groq Cloud con el modelo optimizado
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres el asistente virtual de TommyDevStudio. Responde de forma clara, profesional, amable y concisa. No uses formato Markdown como asteriscos en tus textos."
                },
                {
                    role: "user",
                    content: msg.body
                }
            ],
            model: "llama-3.1-8b-instant", // Modelo ultra rápido y eficiente en consumo
        });

        const respuestaIA = chatCompletion.choices[0]?.message?.content || "";

        // 2. Limpieza de asteriscos (*) por si la IA llega a usarlos
        const respuestaLimpia = respuestaIA.replace(/\*/g, '');

        // 3. Enviamos la respuesta limpia de vuelta al usuario
        await msg.reply(respuestaLimpia);
        console.log(`📤 Respuesta enviada a ${msg.from}`);

    } catch (error) {
        console.error('❌ Error al procesar el mensaje con Groq:', error);
    }
});

// Evento cuando el bot está listo y autenticado
client.on('ready', () => {
    console.log('\n🚀 TommyDevStudio Bot conectado exitosamente a WhatsApp Web.\n');
});

// Evento para mostrar el código QR pintado de forma óptima en la terminal
client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('NUEVO CÓDIGO QR GENERADO (ESCANEALO RÁPIDO):');
    console.log('======================================================\n');
    
    // Genera el QR compacto
    qrcode.generate(qr, { small: true }); 
    
    // Respaldo por si se desconfigura visualmente la consola
    console.log(`\nTexto puro del QR (Respaldo): ${qr}\n`);
});

module.exports = client;