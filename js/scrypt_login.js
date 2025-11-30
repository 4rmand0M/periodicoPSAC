document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
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
    