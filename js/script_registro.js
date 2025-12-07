        // ============================================
        // VALIDACIÓN EN TIEMPO REAL
        // ============================================

        // Validar nombre
        document.getElementById('nombre').addEventListener('input', function() {
            const error = document.getElementById('nombreError');
            if (this.value.length > 0 && this.value.length < 3) {
                this.classList.add('error');
                this.classList.remove('success');
                error.classList.add('show');
            } else if (this.value.length >= 3) {
                this.classList.remove('error');
                this.classList.add('success');
                error.classList.remove('show');
            } else {
                this.classList.remove('error', 'success');
                error.classList.remove('show');
            }
        });

        // Validar usuario
        document.getElementById('username').addEventListener('input', function() {
            const error = document.getElementById('usernameError');
            const pattern = /^[a-zA-Z0-9_]{3,20}$/;
            
            if (this.value.length > 0 && !pattern.test(this.value)) {
                this.classList.add('error');
                this.classList.remove('success');
                error.classList.add('show');
            } else if (pattern.test(this.value)) {
                this.classList.remove('error');
                this.classList.add('success');
                error.classList.remove('show');
            } else {
                this.classList.remove('error', 'success');
                error.classList.remove('show');
            }
        });

        // Validar contraseña y mostrar medidor de fuerza
        document.getElementById('password').addEventListener('input', function() {
            const error = document.getElementById('passwordError');
            const bar = document.getElementById('passwordBar');
            const strength = document.getElementById('passwordStrength');
            const value = this.value;

            if (value.length >= 8) {
                this.classList.remove('error');
                this.classList.add('success');
                error.classList.remove('show');

                // Calcular fuerza
                let score = 0;
                let strengthText = '';
                let strengthColor = '';

                if (value.length >= 12) score++;
                if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
                if (/\d/.test(value)) score++;
                if (/[^a-zA-Z0-9]/.test(value)) score++;

                if (score === 1) {
                    strengthText = '🔴 Débil - Añade más caracteres variados';
                    strengthColor = '#ef4444';
                    bar.style.width = '25%';
                } else if (score === 2) {
                    strengthText = '🟡 Media - Mejora con más variedad';
                    strengthColor = '#f59e0b';
                    bar.style.width = '50%';
                } else if (score === 3) {
                    strengthText = '🟢 Fuerte - Buena contraseña';
                    strengthColor = '#22c55e';
                    bar.style.width = '75%';
                } else {
                    strengthText = '🟢 Muy Fuerte - Excelente contraseña';
                    strengthColor = '#16a34a';
                    bar.style.width = '100%';
                }

                strength.textContent = strengthText;
                bar.style.backgroundColor = strengthColor;
            } else if (value.length > 0) {
                this.classList.add('error');
                this.classList.remove('success');
                error.classList.add('show');
                bar.style.width = '0%';
                strength.textContent = '';
            } else {
                this.classList.remove('error', 'success');
                error.classList.remove('show');
                bar.style.width = '0%';
                strength.textContent = '';
            }

            // Validar coincidencia con confirmar
            validarCoincidenciaPassword();
        });

        // Validar confirmación de contraseña
        document.getElementById('confirmPassword').addEventListener('input', validarCoincidenciaPassword);

        function validarCoincidenciaPassword() {
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;
            const error = document.getElementById('confirmPasswordError');
            const confirmInput = document.getElementById('confirmPassword');

            if (confirm.length > 0) {
                if (password === confirm) {
                    confirmInput.classList.remove('error');
                    confirmInput.classList.add('success');
                    error.classList.remove('show');
                } else {
                    confirmInput.classList.add('error');
                    confirmInput.classList.remove('success');
                    error.classList.add('show');
                }
            } else {
                confirmInput.classList.remove('error', 'success');
                error.classList.remove('show');
            }
        }

        // ============================================
        // ENVÍO DEL FORMULARIO
        // ============================================

        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const btnRegistro = document.getElementById('btnRegistro');
            const originalText = btnRegistro.textContent;
            btnRegistro.disabled = true;
            btnRegistro.textContent = '⏳ Creando cuenta...';

            // Validaciones finales
            const nombre = document.getElementById('nombre').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const email = document.getElementById('email').value.trim();
            const terms = document.getElementById('terms').checked;

            if (!nombre || !username || !password || !confirmPassword) {
                notify.error('Por favor completa todos los campos requeridos', 'Campos incompletos');
                btnRegistro.disabled = false;
                btnRegistro.textContent = originalText;
                return;
            }

            if (password !== confirmPassword) {
                notify.error('Las contraseñas no coinciden', 'Error de validación');
                btnRegistro.disabled = false;
                btnRegistro.textContent = originalText;
                return;
            }

            if (!terms) {
                notify.error('Debes aceptar los términos y condiciones', 'Aceptación requerida');
                btnRegistro.disabled = false;
                btnRegistro.textContent = originalText;
                return;
            }

            const loadingId = notify.loading('Registrando usuario...');

            try {
                const formData = new FormData();
                formData.append('nombre', nombre);
                formData.append('username', username);
                formData.append('password', password);
                formData.append('email', email || '');

                const response = await fetch('../Connection/register.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                notify.remove(loadingId);

                if (result.success) {
                    notify.success('¡Cuenta creada exitosamente! Redirigiendo...', 'Registro exitoso');
                    
                    // Pequeño delay para que el usuario vea el mensaje
                    setTimeout(() => {
                        window.location.href = 'login.html?message=registered';
                    }, 1500);
                } else {
                    notify.error(result.message || 'Error al crear la cuenta', 'Error');
                    btnRegistro.disabled = false;
                    btnRegistro.textContent = originalText;
                }
            } catch (error) {
                notify.remove(loadingId);
                notify.error('Error de conexión al crear la cuenta', 'Error');
                console.error('Error:', error);
                btnRegistro.disabled = false;
                btnRegistro.textContent = originalText;
            }
        });

        // ============================================
        // MODALES DE TÉRMINOS Y PRIVACIDAD
        // ============================================

        function mostrarTerminos() {
            notify.info('Términos y condiciones:\n\n- No publicar contenido ofensivo\n- Respetar a otros usuarios\n- No spam\n- Cumplir con leyes aplicables', 'Términos');
        }

        function mostrarPrivacidad() {
            notify.info('Política de privacidad:\n\n- Tus datos se mantienen seguros\n- No compartimos con terceros\n- Puedes eliminar tu cuenta cuando quieras\n- Usamos cookies solo para sesión', 'Privacidad');
        }

        // Auto-enfoque en campo de nombre
        window.addEventListener('load', () => {
            document.getElementById('nombre').focus();
        });