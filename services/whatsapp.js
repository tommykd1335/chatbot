const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');

// Inicializamos el SDK de Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Detectamos el entorno
const isWindows = os.platform() === 'win32';

// Definimos la ruta exacta de Chrome para Render (Linux)
const RENDER_CHROME_PATH = '/opt/render/project/src/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // En Windows usa CHROME_PATH, en Render le pasamos la ruta absoluta directa al binario descargado
        executablePath: isWindows ? (process.env.CHROME_PATH || undefined) : RENDER_CHROME_PATH, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

// ... El resto de tus eventos (message, ready, qr) se quedan exactamente igual ...
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
// Busca tu evento 'qr' al final del archivo y reemplázalo por este:
client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('NUEVO CÓDIGO QR GENERADO (VÁLIDO POR 20 SEGUNDOS):');
    console.log('======================================================\n');
    
    // Esto fuerza a la terminal a dibujar con caracteres más compactos y limpios
    qrcode.generate(qr, { small: true }); 

    // RESPALDO TRUCO: Imprime el código en texto puro por si el dibujo se deforma
    console.log(`Si el cuadro se ve mal, copia este texto de abajo y pégalo en un generador de QR online:`);
    console.log(`👉 ${qr}\n`);
});
module.exports = client;