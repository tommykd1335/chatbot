const db = require('../config/db');
const { pensarConOllama } = require('../services/ai');

async function handleIncomingMessage(msg, client) {
    const whatsappId = msg.from;
    const body = msg.body.trim();
    const isGroup = msg.from.endsWith('@g.us');

    if (isGroup) return; 

    // 1. Conseguir estado del cliente desde client_states_v2
    let [states] = await db.query('SELECT * FROM client_states_v2 WHERE whatsapp_id = ?', [whatsappId]);
    if (states.length === 0) {
        await db.query('INSERT INTO client_states_v2 (whatsapp_id, bot_enabled, human_control) VALUES (?, 1, 0)', [whatsappId]);
        states = [{ whatsapp_id: whatsappId, bot_enabled: 1, human_control: 0 }];
    }
    let currentState = states[0];

    // 2. Comprobar si el mensaje proviene del administrador
    if (msg.fromMe) {
        if (body.toLowerCase() === '/desactivarbot') {
            await db.query('UPDATE client_states_v2 SET bot_enabled = 0 WHERE whatsapp_id = ?', [whatsappId]);
            await client.sendMessage(whatsappId, "🤖 *Bot desactivado* globalmente para este chat.");
            return;
        }
        if (body.toLowerCase() === '/activarbot') {
            await db.query('UPDATE client_states_v2 SET bot_enabled = 1, human_control = 0 WHERE whatsapp_id = ?', [whatsappId]);
            await client.sendMessage(whatsappId, "🤖 *Bot activado* y tomando el control.");
            return;
        }
        if (body.toLowerCase() === '/tomarcontrol') {
            await db.query('UPDATE client_states_v2 SET human_control = 1 WHERE whatsapp_id = ?', [whatsappId]);
            await client.sendMessage(whatsappId, "👤 *Control Humano Activado*.");
            return;
        }
        if (body.toLowerCase() === '/liberarcontrol') {
            await db.query('UPDATE client_states_v2 SET human_control = 0 WHERE whatsapp_id = ?', [whatsappId]);
            await client.sendMessage(whatsappId, "🤖 *Control devuelto al Bot*.");
            return;
        }

        if (currentState.human_control === 0 && currentState.bot_enabled === 1) {
            await db.query('UPDATE client_states_v2 SET human_control = 1 WHERE whatsapp_id = ?', [whatsappId]);
            console.log(`Detección de actividad humana para ${whatsappId}. Bot pausado.`);
        }
        return;
    }

    if (currentState.bot_enabled === 0 || currentState.human_control === 1) {
        return;
    }

    // 3. Guardar mensaje en chat_history_v2
    await db.query('INSERT INTO chat_history_v2 (whatsapp_id, role, message) VALUES (?, "user", ?)', [whatsappId, body]);

    // 4. Obtener historial desde chat_history_v2
    const [historyRows] = await db.query('SELECT role, message FROM chat_history_v2 WHERE whatsapp_id = ? ORDER BY timestamp DESC LIMIT 15', [whatsappId]);
    const history = historyRows.reverse().map(row => ({ role: row.role, content: row.message }));

    // 5. Llamar a Ollama
    let aiResponse = await pensarConOllama(history);

    // 6. Procesar JSON
    let cleanMessage = aiResponse;
    const dataRegex = /\[DATA_EXTRACTED\]([\s\S]*?)\[END_DATA\]/;
    const match = aiResponse.match(dataRegex);

    if (match) {
        cleanMessage = aiResponse.replace(dataRegex, '').trim();
        try {
            const extractedJson = JSON.parse(match[1].trim());
            await updateLeadData(whatsappId, msg.to, extractedJson);
        } catch (e) {
            console.error("Error parseando el JSON extraído de la IA", e);
        }
    }

    // 7. Guardar respuesta en chat_history_v2 y enviar por WhatsApp
    await db.query('INSERT INTO chat_history_v2 (whatsapp_id, role, message) VALUES (?, "assistant", ?)', [whatsappId, cleanMessage]);
    await client.sendMessage(whatsappId, cleanMessage);
}

async function updateLeadData(whatsappId, botPhoneNumber, jsonData) {
    const rawNumber = whatsappId.split('@')[0];
    // Guardar en leads_v2
    const [leadExists] = await db.query('SELECT id FROM leads_v2 WHERE whatsapp_id = ?', [whatsappId]);

    if (leadExists.length === 0) {
        await db.query(`
            INSERT INTO leads_v2 (whatsapp_id, nombre, telefono, email, nombre_negocio, tipo_negocio, ciudad, servicio_solicitado, presupuesto_estimado, fecha_inicio, calificacion, recomendacion_bot)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                whatsappId, jsonData.nombre || null, jsonData.telefono || rawNumber, jsonData.email || null,
                jsonData.nombre_negocio || null, jsonData.tipo_negocio || null, jsonData.ciudad || null,
                jsonData.servicio_solicitado || null, jsonData.presupuesto_estimado || null, jsonData.fecha_inicio || null,
                jsonData.calificacion || 'Frío', jsonData.recomendacion_bot || null
            ]
        );
    } else {
        const updates = [];
        const params = [];

        Object.keys(jsonData).forEach(key => {
            if (jsonData[key] !== null && jsonData[key] !== 'o null') {
                updates.push(`${key} = ?`);
                params.push(jsonData[key]);
            }
        });

        if (updates.length > 0) {
            params.push(whatsappId);
            await db.query(`UPDATE leads_v2 SET ${updates.join(', ')} WHERE whatsapp_id = ?`, params);
        }
    }
}

module.exports = { handleIncomingMessage };