// Mouse Glow Tracker
document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.mouse-glow');
    if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in - Only if on index.html (Home) or login.html
    const isAuthPage = window.location.pathname.includes('login.html');
    const isHomePage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    if ((isAuthPage || isHomePage) && Auth.getCurrentUser()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');

    if (loginForm && registerForm && toRegister && toLogin) {
        // Toggle between forms
        toRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });

        toLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });

        // Handle Login
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            try {
                Auth.login(user, pass);
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert(error.message);
            }
        });

        // Handle Registration
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pass = document.getElementById('regPassword').value;
            const passConfirm = document.getElementById('regPasswordConfirm').value;

            if (pass !== passConfirm) {
                return alert('Las contraseñas no coinciden');
            }

            const userData = {
                fullName: document.getElementById('regFullname').value,
                username: document.getElementById('regUsername').value,
                role: document.getElementById('regRole').value,
                password: pass
            };

            try {
                Auth.register(userData);
                alert('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
                registerForm.reset();
                toLogin.click();
            } catch (error) {
                alert(error.message);
            }
        });
    }
});
