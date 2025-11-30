// Simple AuthGuard to centralize logout behavior used across the app
const AuthGuard = (function () {
    async function doLogout() {
        try {
            // Call server-side logout
            const resp = await fetch('../Connection/logout.php', { method: 'GET', credentials: 'same-origin' });

            // Try to parse JSON if server returns structured response
            let ok = true;
            try {
                const j = await resp.json();
                if (j && j.success === false) ok = false;
            } catch (e) {
                // not JSON or no structured response — fallback to HTTP status
                ok = resp.ok;
            }

            // Clear any client-side guest mode
            sessionStorage.removeItem('guestMode');

            if (ok) {
                try { notify.success('Sesión cerrada correctamente', 'Desconectado'); } catch (e) { /* ignore */ }
                setTimeout(() => { window.location.href = 'login.html'; }, 600);
            } else {
                try { notify.error('No se pudo cerrar la sesión', 'Error'); } catch (e) { /* ignore */ }
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            try { notify.error('Error de conexión al cerrar sesión', 'Error'); } catch (e) { /* ignore */ }
        }
    }

    // Public logout that asks for confirmation first
    function logout() {
        try {
            notify.confirm({
                title: '¿Cerrar sesión?',
                message: '¿Estás seguro de que deseas cerrar tu sesión?',
                onConfirm: () => {
                    doLogout();
                }
            });
        } catch (e) {
            // If notify isn't available for some reason, fallback to native confirm
            if (window.confirm('¿Deseas cerrar la sesión?')) {
                doLogout();
            }
        }
    }

    return { logout };
})();
