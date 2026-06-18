CREATE DATABASE IF NOT EXISTS tommy_dev_bot;
USE tommy_dev_bot;

-- Tabla de configuración por cliente (control de estados del bot)
CREATE TABLE IF NOT EXISTS client_states (
    whatsapp_id VARCHAR(50) PRIMARY KEY,
    bot_enabled TINYINT(1) DEFAULT 1,       -- /activarbot o /desactivarbot
    human_control TINYINT(1) DEFAULT 0,    -- /tomarcontrol o /liberarcontrol
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de historial de conversaciones para contextualizar a la IA
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    whatsapp_id VARCHAR(50),
    role ENUM('user', 'assistant') NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (whatsapp_id) REFERENCES client_states(whatsapp_id) ON DELETE CASCADE
);

-- Tabla de Leads (Información extraída por el bot)
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    whatsapp_id VARCHAR(50) UNIQUE,
    nombre VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    nombre_negocio VARCHAR(100),
    tipo_negocio VARCHAR(100),
    ciudad VARCHAR(100),
    servicio_solicitado VARCHAR(100),
    presupuesto_estimado VARCHAR(50),
    fecha_inicio VARCHAR(50),
    calificacion ENUM('Caliente', 'Medio', 'Frío') DEFAULT 'Frío',
    recomendacion_bot VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);