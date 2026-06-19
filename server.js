const dotenv = require('dotenv'); // 1. Importar dotenv
dotenv.config(); // 2. ¡Cargar las variables INMEDIATAMENTE!

const express = require('express');
const cors = require('cors');
const path = require('path');
const whatsappClient = require('./services/whatsapp'); 
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 28646;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API del Panel
app.use('/api', apiRoutes);

// Levantamos Express DE INMEDIATO para que Render vea el puerto activo y no reinicie en bucle
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌍 Dashboard Web administrativo corriendo en el puerto ${PORT}`);
    
    // Iniciamos el motor de WhatsApp en segundo plano de manera segura
    console.log("Iniciando WhatsApp Engine local en segundo plano...");
    whatsappClient.initialize().catch(err => {
        console.error('❌ Error al inicializar WhatsApp:', err);
    });
});