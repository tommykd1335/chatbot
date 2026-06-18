document.addEventListener('DOMContentLoaded', () => {
    loadLeads();
    loadReminders();
});

async function loadLeads() {
    const res = await fetch('/api/leads');
    const leads = await res.json();
    const container = document.getElementById('leads-container');
    container.innerHTML = '';

    if (leads.length === 0) {
        container.innerHTML = `<p class="text-muted text-center">No hay leads capturados aún.</p>`;
        return;
    }

    leads.forEach(lead => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-3';
        card.innerHTML = `
            <div class="card card-lead h-100 shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="card-title mb-0">${lead.nombre || 'Cliente Anónimo'}</h5>
                    <span class="badge badge-${lead.calificacion}">${lead.calificacion}</span>
                </div>
                <div class="card-body">
                    <p class="mb-1"><strong>📞 Teléfono:</strong> ${lead.telefono}</p>
                    <p class="mb-1"><strong>📧 Email:</strong> ${lead.email || 'No provisto'}</p>
                    <p class="mb-1"><strong>🏢 Negocio:</strong> ${lead.nombre_negocio || 'N/A'} (${lead.tipo_negocio || 'N/A'})</p>
                    <p class="mb-1"><strong>📍 Ciudad:</strong> ${lead.ciudad || 'No indicada'}</p>
                    <p class="mb-1"><strong>🛠️ Servicio:</strong> <span class="text-primary">${lead.servicio_solicitado || 'Evaluando'}</span></p>
                    <p class="mb-1"><strong>💰 Presupuesto:</strong> ${lead.presupuesto_estimado || 'Por definir'}</p>
                    <p class="mb-1"><strong>📅 Inicio:</strong> ${lead.fecha_inicio || 'Inmediato'}</p>
                    <hr>
                    <p class="mb-0 text-muted small"><strong>💡 Recomendación IA:</strong> ${lead.recomendacion_bot || 'Analizando negocio...'}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadReminders() {
    const res = await fetch('/api/reminders');
    const reminders = await res.json();
    const list = document.getElementById('reminder-list');
    list.innerHTML = '';

    if (reminders.length === 0) {
        list.innerHTML = `<li class="list-group-item text-success text-center">🎉 Todos tus prospectos importantes están al día.</li>`;
        return;
    }

    reminders.forEach(rem => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <strong>${rem.nombre || 'Prospecto'}</strong> (${rem.telefono}) está interesado en <em>${rem.servicio_solicitado}</em> y está calificado como 
                <span class="badge badge-${rem.calificacion}">${rem.calificacion}</span>. ¡No ha tenido interacción en más de 24 horas!
            </div>
            <a href="https://wa.me/${rem.telefono.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-sm btn-success">Escribir ya</a>
        `;
        list.appendChild(item);
    });
}