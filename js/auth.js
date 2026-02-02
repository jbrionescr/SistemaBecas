const Auth = {
    register(userData) {
        const users = Storage.get(Storage.KEYS.USERS);

        if (users.find(u => u.username === userData.username)) {
            throw new Error('El nombre de usuario ya existe');
        }

        const newUser = {
            id: 'user-' + Date.now(),
            ...userData
        };
//registro de usuarios
        users.push(newUser);
        Storage.save(Storage.KEYS.USERS, users);
        Storage.addLog('USER_REGISTERED', newUser.id, `Usuario ${newUser.username} registrado`);
        return newUser;
    },

    login(username, password) {
        const users = Storage.get(Storage.KEYS.USERS);
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        const session = {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName
        };

        localStorage.setItem(Storage.KEYS.CURRENT_USER, JSON.stringify(session));
        Storage.addLog('USER_LOGIN', user.id, `Usuario ${username} inició sesión`);
        return session;
    },

    logout() {
        const session = this.getCurrentUser();
        if (session) {
            Storage.addLog('USER_LOGOUT', session.id, `Usuario ${session.username} cerró sesión`);
        }
        localStorage.removeItem(Storage.KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    },

    getCurrentUser() {
        const session = localStorage.getItem(Storage.KEYS.CURRENT_USER);
        return session ? JSON.parse(session) : null;
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    isEvaluator() {
        const user = this.getCurrentUser();
        return user && user.role === 'evaluator';
    },

    isStudent() {
        const user = this.getCurrentUser();
        return user && user.role === 'student';
    }
};
