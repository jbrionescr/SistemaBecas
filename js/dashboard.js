document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // UI Elements
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const logoutBtn = document.getElementById('logoutBtn');

    // Setup Header
    userNameEl.textContent = user.fullName;
    userRoleEl.textContent = user.role;
    logoutBtn.onclick = () => Auth.logout();

    // Show View based on Role
    const views = {
        admin: document.getElementById('adminView'),
        evaluator: document.getElementById('evaluatorView'),
        student: document.getElementById('studentView')
    };

    if (views[user.role]) {
        views[user.role].classList.remove('hidden');
        renderDashboard(user.role);
    }

    // Modal logic
    const modal = document.getElementById('modalOverlay');
    const closeModal = document.getElementById('closeModal');
    closeModal.onclick = () => modal.classList.add('hidden');
});

function renderDashboard(role) {
    if (role === 'admin') renderAdminDashboard();
    if (role === 'student') renderStudentDashboard();
    if (role === 'evaluator') renderEvaluatorDashboard();
}

// --- ADMIN FEATURES ---
function renderAdminDashboard() {
    const scholarships = Storage.get(Storage.KEYS.SCHOLARSHIPS);
    const applications = Storage.get(Storage.KEYS.APPLICATIONS);

    document.getElementById('statBecas').textContent = scholarships.length;
    document.getElementById('statPostulaciones').textContent = applications.length;

    const totalBudget = scholarships.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    document.getElementById('statPresupuesto').textContent = `$${totalBudget.toLocaleString()}`;

    renderScholarshipsTable(scholarships);
    renderAllApplicationsAdmin(applications);
    renderEvaluatorManagement();
    renderReportsTable(scholarships, applications);
    renderAuditLogs();
    renderMessagesAdmin();

    document.getElementById('newScholarshipBtn').onclick = () => openScholarshipModal();
}

function renderScholarshipsTable(scholarships) {
    const list = document.getElementById('adminBecasList');
    if (scholarships.length === 0) {
        list.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted)">No hay becas creadas.</p>';
    } else {
        list.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: var(--bg-main)">
                    <tr>
                        <th style="padding: 1rem; text-align: left;">Nombre</th>
                        <th style="padding: 1rem; text-align: left;">Monto</th>
                        <th style="padding: 1rem; text-align: left;">Plazo</th>
                        <th style="padding: 1rem; text-align: left;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${scholarships.map(b => `
                        <tr style="border-top: 1px solid var(--border)">
                            <td style="padding: 1rem;">${b.name}</td>
                            <td style="padding: 1rem;">$${parseFloat(b.amount).toLocaleString()}</td>
                            <td style="padding: 1rem;">${b.deadline}</td>
                            <td style="padding: 1rem;">
                                <button class="btn btn-sm btn-outline" onclick="openScholarshipModal('${b.id}')">Editar</button>
                                <button class="btn btn-sm btn-outline" style="color: var(--danger)" onclick="deleteScholarship('${b.id}')">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

function renderReportsTable(scholarships, applications) {
    const container = document.getElementById('adminReports');

    if (scholarships.length === 0) {
        container.innerHTML = '<p style="padding: 1rem; color: var(--text-muted)">No hay datos para generar reportes.</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: var(--bg-main)">
                <tr>
                    <th style="padding: 1rem; text-align: left;">Beca</th>
                    <th style="padding: 1rem; text-align: center;">Total Postulantes</th>
                    <th style="padding: 1rem; text-align: center;">Aprobados</th>
                    <th style="padding: 1rem; text-align: center;">Pendientes</th>
                    <th style="padding: 1rem; text-align: right;">Presupuesto Comprometido</th>
                </tr>
            </thead>
            <tbody>
                ${scholarships.map(b => {
        const apps = applications.filter(a => a.becaId === b.id);
        const approved = apps.filter(a => a.status === 'Aprobada').length;
        const pending = apps.filter(a => a.status === 'Pendiente').length;
        const committed = approved * parseFloat(b.amount);

        return `
                        <tr style="border-top: 1px solid var(--border)">
                            <td style="padding: 1rem;">${b.name}</td>
                            <td style="padding: 1rem; text-align: center;">${apps.length}</td>
                            <td style="padding: 1rem; text-align: center; color: var(--success); font-weight: bold;">${approved}</td>
                            <td style="padding: 1rem; text-align: center; color: var(--warning);">${pending}</td>
                            <td style="padding: 1rem; text-align: right;">$${committed.toLocaleString()}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

function renderAuditLogs() {
    const logs = Storage.get(Storage.KEYS.LOGS);
    const container = document.getElementById('auditLogs');

    if (logs.length === 0) {
        container.innerHTML = '<p style="padding: 1rem;">No hay registros de actividad.</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead style="background: var(--bg-main); position: sticky; top: 0;">
                <tr>
                    <th style="padding: 0.75rem; text-align: left;">Fecha</th>
                    <th style="padding: 0.75rem; text-align: left;">Acción</th>
                    <th style="padding: 0.75rem; text-align: left;">Usuario</th>
                    <th style="padding: 0.75rem; text-align: left;">Detalles</th>
                </tr>
            </thead>
            <tbody>
                ${logs.map(log => `
                    <tr style="border-top: 1px solid var(--border)">
                        <td style="padding: 0.75rem; color: var(--text-muted)">${new Date(log.timestamp).toLocaleString()}</td>
                        <td style="padding: 0.75rem;"><strong>${log.action}</strong></td>
                        <td style="padding: 0.75rem;">${log.userId}</td>
                        <td style="padding: 0.75rem;">${log.details}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function openScholarshipModal(id = null) {
    const modal = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const saveBtn = document.getElementById('saveModal');

    const scholarships = Storage.get(Storage.KEYS.SCHOLARSHIPS);
    const beca = id ? scholarships.find(b => b.id === id) : null;

    document.getElementById('modalTitle').textContent = id ? 'Editar Beca' : 'Crear Nueva Beca';
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label>Nombre de la Beca</label>
                <input type="text" id="becaName" class="form-input" value="${beca ? beca.name : ''}" placeholder="Beca Excelencia">
            </div>
            <div class="form-group">
                <label>Monto de la Beca ($)</label>
                <input type="number" id="becaAmount" class="form-input" value="${beca ? (beca.amount || 0) : ''}" placeholder="5000">
            </div>
        </div>
        <div class="form-group">
            <label>Tipo de Beca</label>
            <select id="becaType" class="form-input">
                <option value="Económica" ${beca?.type === 'Económica' ? 'selected' : ''}>Económica</option>
                <option value="Académica" ${beca?.type === 'Académica' ? 'selected' : ''}>Académica</option>
                <option value="Social" ${beca?.type === 'Social' ? 'selected' : ''}>Social</option>
                <option value="Deportiva" ${beca?.type === 'Deportiva' ? 'selected' : ''}>Deportiva</option>
            </select>
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="becaDescription" class="form-input" rows="2" placeholder="Breve descripción...">${beca?.description || ''}</textarea>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label>Fecha Inicio</label>
                <input type="date" id="becaStartDate" class="form-input" value="${beca ? beca.startDate : ''}">
            </div>
            <div class="form-group">
                <label>Fecha Cierre</label>
                <input type="date" id="becaDeadline" class="form-input" value="${beca ? beca.deadline : ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="becaStatus" class="form-input">
                <option value="Abierta" ${beca?.status === 'Abierta' ? 'selected' : ''}>Abierta</option>
                <option value="Cerrada" ${beca?.status === 'Cerrada' ? 'selected' : ''}>Cerrada</option>
            </select>
        </div>
        <div class="form-group">
            <label>Requisitos y Criterios</label>
            <textarea id="becaRequirements" class="form-input" rows="3" placeholder="Promedio > 9.0...">${beca ? (beca.requirements || '') : ''}</textarea>
        </div>
    `;

    modal.classList.remove('hidden');

    saveBtn.onclick = () => {
        const name = document.getElementById('becaName').value;
        const type = document.getElementById('becaType').value;
        const description = document.getElementById('becaDescription').value;
        const startDate = document.getElementById('becaStartDate').value;
        const deadline = document.getElementById('becaDeadline').value;
        const status = document.getElementById('becaStatus').value;
        const requirements = document.getElementById('becaRequirements').value;

        if (!name || !deadline || !startDate) return alert('Nombre, Fecha de inicio y Fecha de cierre son obligatorios');

        const scholarshipData = {
            id: id || 'beca-' + Date.now(),
            name,
            type,
            description,
            startDate,
            deadline,
            status,
            requirements,
            amount: parseFloat(document.getElementById('becaAmount').value) || 0
        };

        if (id) {
            const index = scholarships.findIndex(b => b.id === id);
            scholarships[index] = scholarshipData;
            Storage.addLog('BECA_UPDATED', Auth.getCurrentUser().id, `Beca ${name} actualizada`);
        } else {
            scholarships.push(scholarshipData);
            Storage.addLog('BECA_CREATED', Auth.getCurrentUser().id, `Beca ${name} creada`);
        }

        Storage.save(Storage.KEYS.SCHOLARSHIPS, scholarships);
        modal.classList.add('hidden');
        renderAdminDashboard();
    };
}

function renderEvaluatorManagement() {
    const users = Storage.get(Storage.KEYS.USERS).filter(u => u.role === 'evaluator');
    const container = document.getElementById('evaluatorManagement');

    container.innerHTML = `
        <div class="view-header" style="margin-top: 2rem">
            <h4>Listado de Evaluadores</h4>
        </div>
        <div class="data-table">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: var(--bg-main)">
                    <tr>
                        <th style="padding: 1rem; text-align: left;">Nombre</th>
                        <th style="padding: 1rem; text-align: left;">Usuario</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr style="border-top: 1px solid var(--border)">
                            <td style="padding: 1rem;">${u.fullName}</td>
                            <td style="padding: 1rem;">${u.username}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="2" style="padding: 1rem; text-align: center;">No hay evaluadores registrados.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderAllApplicationsAdmin(applications) {
    const container = document.getElementById('adminApplicationsList');
    if (!container) return;

    if (applications.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted)">No hay postulaciones registradas.</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: var(--bg-main)">
                <tr>
                    <th style="padding: 1rem; text-align: left;">Estudiante</th>
                    <th style="padding: 1rem; text-align: left;">Beca</th>
                    <th style="padding: 1rem; text-align: left;">Fecha</th>
                    <th style="padding: 1rem; text-align: left;">Estado</th>
                    <th style="padding: 1rem; text-align: left;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${applications.map(a => `
                    <tr style="border-top: 1px solid var(--border)">
                        <td style="padding: 1rem;">
                            <strong>${a.studentName}</strong><br>
                            <small>${a.studentID}</small>
                        </td>
                        <td style="padding: 1rem;">${a.becaName}</td>
                        <td style="padding: 1rem;">${new Date(a.date).toLocaleDateString()}</td>
                        <td style="padding: 1rem;">
                            <span class="badge" style="background: ${getStatusColor(a.status)}; color: white">${a.status}</span>
                        </td>
                        <td style="padding: 1rem;">
                            <button class="btn btn-sm btn-outline" onclick="viewApplicationDetail('${a.id}')">Ver Detalle</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.viewApplicationDetail = (appId) => {
    const applications = Storage.get(Storage.KEYS.APPLICATIONS);
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const modal = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const saveBtn = document.getElementById('saveModal');

    document.getElementById('modalTitle').textContent = 'Detalle de Postulación';
    saveBtn.classList.add('hidden'); // Hide save button for view-only

    modalBody.innerHTML = `
        <div style="font-size: 0.9rem;">
            <div style="background: var(--bg-main); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                <p><strong>Estudiante:</strong> ${app.studentName}</p>
                <p><strong>ID:</strong> ${app.studentID} | <strong>Email/Usuario:</strong> ${app.studentId}</p>
                <p><strong>Beca:</strong> ${app.becaName}</p>
                <p><strong>Fecha:</strong> ${new Date(app.date).toLocaleString()}</p>
            </div>
            <div style="margin-bottom: 1rem;">
                <p><strong>Teléfono:</strong> ${app.phone}</p>
                <p><strong>Dirección:</strong> ${app.address}</p>
                <p><strong>Nivel:</strong> ${app.educationLevel} | <strong>Inst:</strong> ${app.school}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border); margin: 1rem 0;">
            <p><strong>Situación Socioeconómica:</strong></p>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">${app.socioEconomic}</p>
            <p><strong>Motivación:</strong></p>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">${app.motivation}</p>
            ${app.score ? `
                <div style="background: var(--primary-50); padding: 1rem; border-radius: 0.5rem;">
                    <p><strong>Puntaje:</strong> ${app.score}/100</p>
                    <p><strong>Evaluador:</strong> ${app.evaluatorId}</p>
                    <p><strong>Comentarios:</strong> ${app.comments}</p>
                </div>
            ` : '<p style="color: var(--warning)"><em>Pendiente de evaluación</em></p>'}
        </div>
    `;

    modal.classList.remove('hidden');

    // We need to show the button again when modal is closed
    const origClose = document.getElementById('closeModal').onclick;
    document.getElementById('closeModal').onclick = () => {
        modal.classList.add('hidden');
        saveBtn.classList.remove('hidden');
    };
}

window.deleteScholarship = (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta beca?')) return;
    let scholarships = Storage.get(Storage.KEYS.SCHOLARSHIPS);
    scholarships = scholarships.filter(b => b.id !== id);
    Storage.save(Storage.KEYS.SCHOLARSHIPS, scholarships);
    Storage.addLog('BECA_DELETED', Auth.getCurrentUser().id, `Beca eliminada: ${id}`);
    renderAdminDashboard();
};

// --- STUDENT FEATURES ---
function renderStudentDashboard() {
    const scholarships = Storage.get(Storage.KEYS.SCHOLARSHIPS);
    const applications = Storage.get(Storage.KEYS.APPLICATIONS).filter(a => a.studentId === Auth.getCurrentUser().id);

    // Available Scholarships
    const availableList = document.getElementById('availableBecasList');
    availableList.innerHTML = scholarships.map(b => `
        <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h3>${b.name}</h3>
                <span class="badge" style="background: ${b.status === 'Abierta' ? 'var(--success)' : 'var(--danger)'}; color: white; font-size: 0.6rem;">${b.status}</span>
            </div>
            <p style="font-size: 0.85rem; font-weight: 600; color: var(--primary-600); margin: 0.25rem 0;">${b.type}</p>
            <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.5rem;">${b.description || ''}</p>
            <p style="font-size: 0.75rem; color: var(--text-muted)">📅 ${b.startDate} al ${b.deadline}</p>
            <div style="margin-top: 1rem; font-size: 0.85rem; background: var(--bg-main); padding: 0.5rem; border-radius: 0.25rem;">
                <strong>Requisitos:</strong><br>
                ${b.requirements || 'No especificados'}
            </div>
            ${b.status === 'Abierta' ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn btn-primary btn-sm" onclick="applyScholarship('${b.id}', '${b.name}')">Postularse</button>
                    <a href="scholarship-detail.html?id=${b.id}" class="btn btn-outline btn-sm">Ver Más</a>
                </div>
            ` : `<a href="scholarship-detail.html?id=${b.id}" class="btn btn-outline btn-sm btn-block" style="margin-top: 1rem">Ver Detalles</a>`}
        </div>
    `).join('') || '<p>No hay becas disponibles en este momento.</p>';

    // My Applications
    const table = document.getElementById('myApplications');
    if (applications.length === 0) {
        table.innerHTML = '<p style="padding: 1rem; color: var(--text-muted)">Aún no te has postulado a ninguna beca.</p>';
    } else {
        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: var(--bg-main)">
                    <tr>
                        <th style="padding: 1rem; text-align: left;">Beca</th>
                        <th style="padding: 1rem; text-align: left;">Fecha</th>
                        <th style="padding: 1rem; text-align: left;">Estado</th>
                        <th style="padding: 1rem; text-align: left;">Puntaje</th>
                        <th style="padding: 1rem; text-align: left;">Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${applications.map(a => `
                        <tr style="border-top: 1px solid var(--border)">
                            <td style="padding: 1rem;">${a.becaName}</td>
                            <td style="padding: 1rem;">${new Date(a.date).toLocaleDateString()}</td>
                            <td style="padding: 1rem;">
                                <span class="badge" style="background: ${getStatusColor(a.status)}; color: white">${a.status}</span>
                            </td>
                            <td style="padding: 1rem; font-weight: 600;">${a.score || '-'}</td>
                            <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted); max-width: 300px;">
                                ${a.comments || '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

window.applyScholarship = (becaId, becaName) => {
    const user = Auth.getCurrentUser();
    const scholarships = Storage.get(Storage.KEYS.SCHOLARSHIPS);
    const beca = scholarships.find(b => b.id === becaId);

    if (!beca) return;

    // Validation Rules
    if (beca.status === 'Cerrada') return alert('Esta convocatoria está cerrada.');
    const today = new Date().toISOString().split('T')[0];
    if (today < beca.startDate) return alert(`Abre el ${beca.startDate}`);
    if (today > beca.deadline) return alert('Plazo vencido.');

    const applications = Storage.get(Storage.KEYS.APPLICATIONS);
    if (applications.find(a => a.becaId === becaId && a.studentId === user.id)) {
        return alert('Ya te has postulado a esta beca.');
    }

    // Open detailed form
    const modal = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const saveBtn = document.getElementById('saveModal');

    document.getElementById('modalTitle').textContent = `Postulación: ${becaName}`;
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label>Documento de Identidad (DNI/ID)</label>
                <input type="text" id="appID" class="form-input" placeholder="12345678X">
            </div>
            <div class="form-group">
                <label>Teléfono de Contacto</label>
                <input type="tel" id="appPhone" class="form-input" placeholder="+54 11 ...">
            </div>
        </div>
        <div class="form-group">
            <label>Dirección de Residencia</label>
            <input type="text" id="appAddress" class="form-input" placeholder="Calle, Nro, Ciudad">
        </div>
        <div class="form-group">
            <label>Nivel Educativo Actual</label>
            <select id="appEducationLevel" class="form-input">
                <option value="Secundario">Secundario</option>
                <option value="Terciario">Terciario</option>
                <option value="Universitario">Universitario</option>
                <option value="Posgrado">Posgrado</option>
            </select>
        </div>
        <div class="form-group">
            <label>Institución Educativa</label>
            <input type="text" id="appSchool" class="form-input" placeholder="Nombre de la Institución">
        </div>
        <div class="form-group">
            <label>Situación Socioeconómica</label>
            <textarea id="appSocioEconomic" class="form-input" rows="2" placeholder="Ingresos familiares, miembros del hogar, etc."></textarea>
        </div>
        <div class="form-group">
            <label>Motivo de la Solicitud</label>
            <textarea id="appMotivation" class="form-input" rows="3" placeholder="Justifique su petición..."></textarea>
        </div>
    `;

    modal.classList.remove('hidden');

    saveBtn.onclick = () => {
        const studentID = document.getElementById('appID').value;
        const phone = document.getElementById('appPhone').value;
        const address = document.getElementById('appAddress').value;
        const educationLevel = document.getElementById('appEducationLevel').value;
        const school = document.getElementById('appSchool').value;
        const socioEconomic = document.getElementById('appSocioEconomic').value;
        const motivation = document.getElementById('appMotivation').value;

        if (!studentID || !phone || !address || !school || !socioEconomic || !motivation) {
            return alert('Por favor completa todos los campos del formulario.');
        }

        const newApp = {
            id: 'app-' + Date.now(),
            becaId,
            becaName,
            studentId: user.id,
            studentName: user.fullName,
            date: new Date().toISOString(),
            status: 'Enviada',
            studentID,
            phone,
            address,
            educationLevel,
            school,
            socioEconomic,
            motivation,
            score: null,
            comments: ''
        };

        const currentApps = Storage.get(Storage.KEYS.APPLICATIONS);
        currentApps.push(newApp);
        Storage.save(Storage.KEYS.APPLICATIONS, currentApps);
        Storage.addLog('APPLICATION_CREATED', user.id, `Postulación completa a ${becaName}`);

        alert('¡Postulación enviada con éxito!');
        modal.classList.add('hidden');
        renderStudentDashboard();
    };
};

function getStatusColor(status) {
    if (status === 'Enviada') return 'var(--info)';
    if (status === 'En revisión') return 'var(--warning)';
    if (status === 'Aprobada') return 'var(--success)';
    if (status === 'Rechazada') return 'var(--danger)';
    return 'var(--text-muted)';
}

// --- EVALUATOR FEATURES ---
function renderEvaluatorDashboard() {
    const applications = Storage.get(Storage.KEYS.APPLICATIONS).filter(a => a.status === 'Enviada' || a.status === 'En revisión');
    const scholarships = Storage.get(Storage.KEYS.SCHOLARSHIPS);
    const list = document.getElementById('evaluatorList');

    if (applications.length === 0) {
        list.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted)">No hay postulaciones pendientes de evaluar.</p>';
        return;
    }

    list.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: var(--bg-main)">
                <tr>
                    <th style="padding: 1rem; text-align: left;">Estudiante</th>
                    <th style="padding: 1rem; text-align: left;">Beca</th>
                    <th style="padding: 1rem; text-align: left;">Estado</th>
                    <th style="padding: 1rem; text-align: left;">Criterios</th>
                    <th style="padding: 1rem; text-align: left;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${applications.map(a => {
        const beca = scholarships.find(b => b.id === a.becaId);
        return `
                        <tr style="border-top: 1px solid var(--border)">
                            <td style="padding: 1rem;">${a.studentName}</td>
                            <td style="padding: 1rem;">${a.becaName}</td>
                            <td style="padding: 1rem;"><span class="badge" style="background: ${getStatusColor(a.status)}; color: white">${a.status}</span></td>
                            <td style="padding: 1rem; font-size: 0.8rem; max-width: 200px;">
                                ${beca ? (beca.requirements || 'N/A') : 'N/A'}
                            </td>
                            <td style="padding: 1rem;">
                                <button class="btn btn-sm btn-primary" onclick="openEvaluationModal('${a.id}')">Evaluar</button>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

window.openEvaluationModal = (appId) => {
    const modal = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const saveBtn = document.getElementById('saveModal');

    let applications = Storage.get(Storage.KEYS.APPLICATIONS);
    const index = applications.findIndex(a => a.id === appId);
    const app = applications[index];

    // RULE: An approved or rejected application cannot be modified
    if (app.status === 'Aprobada' || app.status === 'Rechazada') {
        return alert('Esta solicitud ya tiene un dictamen final y no puede ser modificada.');
    }

    // RULE: Change status to 'En revisión' if it's 'Enviada'
    if (app.status === 'Enviada') {
        applications[index].status = 'En revisión';
        Storage.save(Storage.KEYS.APPLICATIONS, applications);
        renderEvaluatorDashboard();
    }

    modalBody.innerHTML = `
        <div style="background: var(--bg-main); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.85rem; max-height: 200px; overflow-y: auto; border: 1px solid var(--border);">
            <p><strong>Estudiante:</strong> ${app.studentName}</p>
            <p><strong>ID:</strong> ${app.studentID} | <strong>Nivel:</strong> ${app.educationLevel}</p>
            <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid var(--border);">
            <p><strong>Situación:</strong> ${app.socioEconomic}</p>
            <p><strong>Motivo:</strong> ${app.motivation}</p>
        </div>
        
        <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem;">Criterios de Evaluación (Weighted)</p>
        <div class="form-group">
            <label>Situación Económica (Máx 40 pts)</label>
            <input type="number" id="scoreSocio" class="form-input score-input" min="0" max="40" value="0">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label>Rend. Académico (Máx 30 pts)</label>
                <input type="number" id="scoreAcad" class="form-input score-input" min="0" max="30" value="0">
            </div>
            <div class="form-group">
                <label>Contexto Social (Máx 30 pts)</label>
                <input type="number" id="scoreSocial" class="form-input score-input" min="0" max="30" value="0">
            </div>
        </div>

        <div style="background: var(--primary-50); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; text-align: center;">
            <span style="font-size: 0.875rem; color: var(--primary-600); font-weight: 600;">Puntaje Total (Sobre 100):</span>
            <div id="totalScoreCalc" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600);">0</div>
        </div>

        <div class="form-group">
            <label>Recomendación Final</label>
            <select id="evalStatus" class="form-input">
                <option value="Aprobada">Recomendar Aprobación</option>
                <option value="Rechazada">Recomendar Rechazo</option>
            </select>
        </div>
        <div class="form-group">
            <label>Observaciones del Evaluador</label>
            <textarea id="evalComments" class="form-input" rows="2" placeholder="Detalle los hallazgos de la evaluación..."></textarea>
        </div>
    `;

    modal.classList.remove('hidden');

    // Auto-calculate logic
    const scoreInputs = modalBody.querySelectorAll('.score-input');
    const totalDisplay = document.getElementById('totalScoreCalc');

    const calculateTotal = () => {
        const socio = parseFloat(document.getElementById('scoreSocio').value) || 0;
        const acad = parseFloat(document.getElementById('scoreAcad').value) || 0;
        const social = parseFloat(document.getElementById('scoreSocial').value) || 0;

        const total = (socio + acad + social).toFixed(0);
        totalDisplay.textContent = total;
        return total;
    };

    scoreInputs.forEach(input => input.oninput = calculateTotal);

    saveBtn.onclick = () => {
        const totalScore = calculateTotal();
        const status = document.getElementById('evalStatus').value;
        const comments = document.getElementById('evalComments').value;

        let applications = Storage.get(Storage.KEYS.APPLICATIONS);
        const index = applications.findIndex(a => a.id === appId);

        if (index !== -1) {
            applications[index] = {
                ...applications[index],
                status: status,
                score: totalScore,
                scoreDetails: {
                    socio: document.getElementById('scoreSocio').value,
                    academic: document.getElementById('scoreAcad').value,
                    social: document.getElementById('scoreSocial').value
                },
                comments: comments,
                evaluatorId: Auth.getCurrentUser().id,
                evaluationDate: new Date().toISOString()
            };

            Storage.save(Storage.KEYS.APPLICATIONS, applications);
            Storage.addLog('APPLICATION_EVALUATED', Auth.getCurrentUser().id, `Evaluación finalizada para ${appId}: ${status} (${totalScore})`);
        }

        modal.classList.add('hidden');
        renderEvaluatorDashboard();
    };
};

// --- MESSAGE MANAGEMENT ---
function renderMessagesAdmin() {
    const list = document.getElementById('adminMessagesList');
    if (!list) return;

    const messages = Storage.get(Storage.KEYS.MESSAGES);

    if (messages.length === 0) {
        list.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">No hay mensajes en el buzón.</p>';
        return;
    }

    list.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Estudiante</th>
                    <th>Asunto</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${messages.map(m => `
                    <tr>
                        <td>${new Date(m.timestamp).toLocaleDateString()}</td>
                        <td>
                            <strong>${m.name}</strong><br>
                            <small>${m.email}</small>
                        </td>
                        <td>${m.subject}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-sm btn-outline" onclick="viewMessageDetail(${m.id})">Leer</button>
                                <button class="btn btn-sm btn-outline" style="color: var(--danger)" onclick="deleteMessage(${m.id})">Eliminar</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function viewMessageDetail(id) {
    const messages = Storage.get(Storage.KEYS.MESSAGES);
    const m = messages.find(msg => msg.id === id);
    if (!m) return;

    const modal = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const saveBtn = document.getElementById('modalSaveBtn');

    modalTitle.textContent = 'Detalle de Mensaje';
    saveBtn.classList.add('hidden');

    modalBody.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <p><strong>De:</strong> ${m.name} (${m.email})</p>
            <p><strong>Fecha:</strong> ${new Date(m.timestamp).toLocaleString()}</p>
            <p><strong>Asunto:</strong> ${m.subject}</p>
        </div>
        <div style="background: var(--bg-page); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
            <p style="white-space: pre-line; color: var(--text-main);">${m.message}</p>
        </div>
    `;

    modal.classList.remove('hidden');
}

function deleteMessage(id) {
    if (confirm('¿Estás seguro de eliminar este mensaje?')) {
        let messages = Storage.get(Storage.KEYS.MESSAGES);
        messages = messages.filter(m => m.id !== id);
        Storage.save(Storage.KEYS.MESSAGES, messages);
        renderMessagesAdmin();
        Storage.addLog('MESSAGE_DELETED', Auth.getCurrentUser().id, `Mensaje ${id} eliminado`);
    }
}
