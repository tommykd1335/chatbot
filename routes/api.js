const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los leads guardados y calificados
router.get('/leads', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener recordatorios de seguimiento automático (Leads calientes/medios estancados)
router.get('/reminders', async (req, res) => {
    try {
        // Clientes calientes o medios que no han sido actualizados en las últimas 24 horas
        const [rows] = await db.query(`
            SELECT nombre, telefono, calificacion, servicio_solicitado, updated_at 
            FROM leads 
            WHERE calificacion IN ('Caliente', 'Medio') 
            AND updated_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;