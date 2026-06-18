const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');

// Detectamos si estás en Windows (Local) o Linux (Render)
const isWindows = os.platform() === 'win32';

const client = new Client({
    authStrategy: new LocalAuth(), // Mantiene tu sesión guardada
    puppeteer: {
        headless: true,
        // Si tienes CHROME_PATH en el .env lo usa, si no, lo deja undefined
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

// Evento cuando el bot está listo
client.on('ready', () => {
    console.log('🚀 TommyDevStudio Bot conectado exitosamente a WhatsApp Web.');
});

// Evento para mostrar el código QR
client.on('qr', (qr) => {
    // Aquí puedes tener tu librería qrcode-terminal o dashboard
    console.log('Regenerando Código QR... Escanéalo por favor:');
    // Si usas qrcode-terminal puedes descomentar su lógica aquí
});

module.exports = client;       