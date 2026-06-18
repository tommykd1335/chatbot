const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleIncomingMessage } = require('../controllers/botController');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // Esta es la ruta por defecto de Google Chrome de 64 bits en Windows:
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
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