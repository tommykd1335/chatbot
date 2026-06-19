const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');

// Inicializamos el SDK de Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Detectamos si estás en Windows (Local) o Linux (Render)
const isWindows = os.platform() === 'win32';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // En Windows usa tu ruta local, en Render (Linux) busca su Chrome nativo automáticamente.
        executablePath: isWindows ? (process.env.CHROME_PATH || undefined) : undefined, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

// EVENTO DE MENSAJES: Conexión e integración con Groq Cloud
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