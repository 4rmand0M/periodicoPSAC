document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const btnLogin = document.getElementById('btnLogin');
        const mensaje = document.getElementById('mensaje');

        btnLogin.disabled = true;
        btnLogin.textContent = 'Ingresando...';
        mensaje.textContent = '';

        const formData = new FormData(this);

        try {
            const response = await fetch('../Connection/login.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                mensaje.style.color = '#22c55e';
                mensaje.textContent = '✓ ' + result.message;

                // Redirigir según el rol
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                mensaje.style.color = '#ef4444';
                mensaje.textContent = '✗ ' + result.message;
                btnLogin.disabled = false;
                btnLogin.textContent = 'Ingresar';
            }
        } catch (error) {
            mensaje.style.color = '#ef4444';
            mensaje.textContent = '✗ Error de conexión';
            btnLogin.disabled = false;
            btnLogin.textContent = 'Ingresar';
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    // Verificar si ya hay sesión activa
    verificarSesionExistente();

    // Form de login
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const btnLogin = document.getElementById('btnLogin');
        const formData = new FormData(this);

        btnLogin.disabled = true;
        btnLogin.textContent = 'Ingresando...';

        // Mostrar notificación de carga
        const loadingNotif = notify.loading('Verificando credenciales...');

        try {
            const response = await fetch('../Connection/login.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Remover notificación de carga
            notify.remove(loadingNotif);

            if (result.success) {
                // Mostrar éxito
                notify.success('Credenciales verificadas correctamente', 'Inicio de sesión exitoso');

                // Limpiar modo invitado si existía
                sessionStorage.removeItem('guestMode');

                // Redirigir después de un momento
                setTimeout(() => {
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                notify.error(result.message, 'Error de autenticación');
                btnLogin.disabled = false;
                btnLogin.textContent = 'Ingresar';
            }
        } catch (error) {
            notify.remove(loadingNotif);
            notify.error('No se pudo conectar con el servidor. Intenta nuevamente.', 'Error de conexión');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Ingresar';
        }
    });

    // Botón de invitado
    document.getElementById('btnGuest').addEventListener('click', function () {
        notify.info('Accediendo con privilegios limitados', 'Modo invitado');

        // Marcar como invitado
        sessionStorage.setItem('guestMode', 'true');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });

    // Verificar Enter en inputs
    document.querySelectorAll('.input').forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
        });
    });
});

// Verificar si ya tiene sesión activa
async function verificarSesionExistente() {
    try {
        const response = await fetch('../Connection/check_session.php');
        const data = await response.json();

        if (data.logged_in) {
            // Ya está logueado, redirigir
            notify.info('Ya tienes una sesión activa', 'Redirigiendo');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        }
    } catch (error) {
        // No hacer nada, permitir login normal
        console.log('No hay sesión activa');
    }
}