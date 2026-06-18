const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleIncomingMessage } = require('../controllers/botController');

const client = new Client({
    puppeteer: {
        headless: true,
        // Si existe la variable en el entorno la usa, si no, deja que Puppeteer busque solo
        executablePath: process.env.CHROME_PATH || undefined, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
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