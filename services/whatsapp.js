const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');

// Inicializamos el SDK de Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🚀 ✨ ¡AQUÍ ESTÁ LA CORRECCIÓN!: Definir si es Windows o Linux
const isWindows = os.platform() === 'win32';

// Definimos la ruta de Chrome para Render (Linux)
const RENDER_CHROME_PATH = '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome'; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // Si está en Windows usa tu CHROME_PATH local, si está en Render usa la ruta de Linux
        executablePath: isWindows ? (process.env.CHROME_PATH || undefined) : RENDER_CHROME_PATH, 
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
        // Evitamos que el bot se responda a sí mismo o a grupos si no quieres
        if (msg.from === 'status@broadcast') return;

        console.log(`📩 Mensaje recibido de ${msg.from}: ${msg.body}`);

// 1. Llamada real a Groq Cloud con el modelo actualizado
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres el asistente virtual de TommyDevStudio. Responde de forma clara, profesional y amable."
                },
                {
                    role: "user",
                    content: msg.body
                }
            ],
            model: "llama-3.1-8b-instant", // <-- Cambiado aquí por el modelo activo y ultra rápido
        });
        const respuestaIA = chatCompletion.choices[0]?.message?.content || "";

        // 2. ✨ FILTRO: Quitamos todos los asteriscos del texto para que no se vean símbolos raros
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
    qrcode.generate(qr, { small: true });
});

module.exports = client;