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
                age: document.getElementById('regAge').value,
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

    // --- Carousel Logic ---
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track ? track.children : []);
    const nextButton = document.querySelector('.next-btn');
    const prevButton = document.querySelector('.prev-btn');
    const dotsNav = document.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav ? dotsNav.children : []);

    let currentSlideIndex = 0;

    const updateSlidePosition = (index) => {
        if (!track) return;
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentSlideIndex = index;
        const amountToMove = -100 * currentSlideIndex;
        track.style.transform = `translateX(${amountToMove}%)`;

        // Update dots
        dots.forEach(d => d.classList.remove('current-slide'));
        if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add('current-slide');
    };

    if (nextButton && prevButton) {
        nextButton.addEventListener('click', () => {
            updateSlidePosition(currentSlideIndex + 1);
        });

        prevButton.addEventListener('click', () => {
            updateSlidePosition(currentSlideIndex - 1);
        });
    }

    if (dotsNav) {
        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('button');
            if (!targetDot) return;
            const targetIndex = dots.indexOf(targetDot);
            updateSlidePosition(targetIndex);
        });
    }

    // Auto-play
    let autoPlayInterval = setInterval(() => {
        updateSlidePosition(currentSlideIndex + 1);
    }, 5000);

    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carouselContainer.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(() => {
                updateSlidePosition(currentSlideIndex + 1);
            }, 5000);
        });
    }
});
