const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const whatsappClient = require('./services/whatsapp');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API del Panel
app.use('/api', apiRoutes);

// Inicializar Servidor Web
app.listen(PORT, () => {
    console.log(`🌍 Dashboard Web administrativo corriendo en http://localhost:${PORT}`);
});

// Inicializar Cliente WhatsApp
console.log("Iniciando WhatsApp Engine local...");
whatsappClient.initialize();