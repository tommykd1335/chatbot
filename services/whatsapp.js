const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleIncomingMessage } = require('../controllers/botController');

const os = require('os');

// Detectamos si el bot está corriendo en Windows o en Linux (Render)
const isWindows = os.platform() === 'win32';

const client = new Client({
    puppeteer: {
        headless: true,
        // Si es Windows usa tu ruta local, si es Render (Linux) usa la de Linux o deja que Puppeteer la busque sola
        executablePath: isWindows 
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
            : '/usr/bin/google-chrome', // Ruta estándar en servidores Linux
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Ayuda a que Render no consuma mucha memoria RAM
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('--- ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🚀 TommyDevStudio Bot conectado exitosamente a WhatsApp Web.');
});

client.on('message', async (msg) => {
    try {
        await handleIncomingMessage(msg, client);
    } catch (err) {
        console.error("Error procesando mensaje entrante: ", err);
    }
});

client.on('message_create', async (msg) => {
    // Captura también los mensajes enviados desde tu propio teléfono para la auto-pausa
    if (msg.fromMe) {
        try {
            await handleIncomingMessage(msg, client);
        } catch (err) {
            console.error("Error procesando mensaje propio: ", err);
        }
    }
});

module.exports = client;