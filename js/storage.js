const Storage = {
    KEYS: {
        USERS: 'becas_users',
        SCHOLARSHIPS: 'becas_list',
        APPLICATIONS: 'becas_applications',
        LOGS: 'becas_audit_logs',
        MESSAGES: 'becas_contact_messages',
        CURRENT_USER: 'becas_session'
    },

    init() {
        let users = this.get(this.KEYS.USERS);
        if (users.length === 0 || !users.find(u => u.role === 'admin')) {
            const admin = {
                id: 'admin-001',
                username: 'admin',
                password: 'password123',
                role: 'admin',
                fullName: 'Administrador Sistema'
            };
            // Only add if username 'admin' isn't already taken by someone else
            if (!users.find(u => u.username === 'admin')) {
                users.push(admin);
                this.save(this.KEYS.USERS, users);
            }
        }
//BECA CARGADA DE FORMA PREDETERMINADA, LAS DEMAS SE AGREGARAN DESDE LA PAGINA DE ADMINISTRADOR
        let scholarships = this.get(this.KEYS.SCHOLARSHIPS);
        if (scholarships.length === 0) {
            const defaultSocial = {
                id: 'beca-social-001',
                name: 'Beca de Apoyo Social',
                type: 'Social',
                description: 'Destinada a estudiantes con alta vulnerabilidad económica y compromiso social.',
                startDate: new Date().toISOString().split('T')[0],
                deadline: '2026-12-31',
                status: 'Abierta',
                requirements: 'Ingresos familiares mínimos, carta de motivación, residencia comprobada.',
                amount: 3500
            };
            scholarships.push(defaultSocial);
            this.save(this.KEYS.SCHOLARSHIPS, scholarships);
        }

        if (!localStorage.getItem(this.KEYS.APPLICATIONS)) this.save(this.KEYS.APPLICATIONS, []);
        if (!localStorage.getItem(this.KEYS.LOGS)) this.save(this.KEYS.LOGS, []);
        if (!localStorage.getItem(this.KEYS.MESSAGES)) this.save(this.KEYS.MESSAGES, []);
    },

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    addLog(action, userId, details) {
        const logs = this.get(this.KEYS.LOGS);
        const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action,
            userId,
            details
        };
        logs.unshift(newLog); // Newest first
        this.save(this.KEYS.LOGS, logs);
    }
};

Storage.init();
