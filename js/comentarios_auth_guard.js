/**
 * comentarios_auth_guard.js

 */

(function() {
    'use strict';

    console.log('🔒 Sistema de protección de comentarios activado');

    /**
     * Verificar sesión del usuario
     */
    async function verificarSesionComentarios() {
        try {
            const response = await fetch('../Connection/check_session.php', {
                cache: 'no-store',
                credentials: 'same-origin'
            });
            const data = await response.json();
            return data && data.logged_in ? data.user : null;
        } catch (error) {
            console.error('❌ Error al verificar sesión:', error);
            return null;
        }
    }

    /**
     * Mostrar modal de login requerido
     */
    function mostrarModalLoginRequerido() {
        // Remover modales anteriores
        const existente = document.getElementById('modal-login-requerido');
        if (existente) existente.remove();

        const overlay = document.createElement('div');
        overlay.id = 'modal-login-requerido';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: scaleIn 0.2s;
            position: relative;
        `;

        modal.innerHTML = `
            <button onclick="document.getElementById('modal-login-requerido').remove()" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #9ca3af;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">✕</button>

            <div style="font-size: 64px; margin-bottom: 20px;">🔐</div>
            <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 12px; margin-top: 0;">Sesión Requerida</h2>
            <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px; line-height: 1.6;">
                Debes iniciar sesión para comentar en publicaciones y noticias.
            </p>
            
            <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
                <button id="btnCancelarModal" style="
                    flex: 1;
                    padding: 14px 20px;
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                ">Cerrar</button>
                <button id="btnIrLogin" style="
                    flex: 1;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                ">Iniciar Sesión</button>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                ¿No tienes cuenta? 
                <button id="btnIrRegistro" style="
                    background: none;
                    border: none;
                    color: #2563eb;
                    text-decoration: none;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0;
                    font-size: 14px;
                ">Crear una gratis</button>
            </p>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Agregar estilos de animación si no existen
        if (!document.getElementById('comentarios-auth-animations')) {
            const style = document.createElement('style');
            style.id = 'comentarios-auth-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { 
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to { 
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Eventos del modal
        document.getElementById('btnCancelarModal').onclick = () => {
            overlay.remove();
        };

        document.getElementById('btnIrLogin').onclick = () => {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
        };

        document.getElementById('btnIrRegistro').onclick = () => {
            window.location.href = 'registro.html';
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        };
    }

    /**
     * BLOQUEAR: Acceso al textarea de comentarios sin sesión
     */
    function bloquearTextareaComentarios() {
        // Buscar todos los textareas de comentarios
        const textareas = document.querySelectorAll('.comentario-textarea');
        
        textareas.forEach(textarea => {
            textarea.addEventListener('focus', async function(e) {
                const usuario = await verificarSesionComentarios();
                
                if (!usuario) {
                    e.preventDefault();
                    this.blur();
                    mostrarModalLoginRequerido();
                    return false;
                }
            });

            // También bloquear si intenta escribir
            textarea.addEventListener('input', async function(e) {
                const usuario = await verificarSesionComentarios();
                
                if (!usuario) {
                    // Limpiar lo que escribió
                    this.value = this.value.slice(0, -1);
                    mostrarModalLoginRequerido();
                    return false;
                }
            });

            // Bloquear clic directo
            textarea.addEventListener('click', async function(e) {
                const usuario = await verificarSesionComentarios();
                
                if (!usuario) {
                    e.preventDefault();
                    e.stopPropagation();
                    mostrarModalLoginRequerido();
                    return false;
                }
            });
        });
    }

    /**
     * BLOQUEAR: Botón de comentar sin sesión
     */
    function bloquearBotonesComentar() {
        // Reemplazar función publicar del sistemaCom
        if (window.sistemaCom && typeof window.sistemaCom.publicar === 'function') {
            const originalPublicar = window.sistemaCom.publicar;

            window.sistemaCom.publicar = async function(itemId, parentId = null) {
                const usuario = await verificarSesionComentarios();

                if (!usuario) {
                    mostrarModalLoginRequerido();
                    return;
                }

                // Verificar que hay texto en el comentario
                const inputId = parentId ? `resp-input-${parentId}` : `input-${itemId}`;
                const textarea = document.getElementById(inputId);
                
                if (!textarea || textarea.value.trim() === '') {
                    if (typeof notify !== 'undefined') {
                        notify.warning('Escribe un comentario primero', 'Campo vacío');
                    }
                    return;
                }

                // Hay sesión - llamar a función original
                return originalPublicar.call(this, itemId, parentId);
            };

            console.log('✅ Botón de comentar protegido');
        }
    }

    /**
     * BLOQUEAR: Botones de responder sin sesión
     */
    function bloquearBotonesResponder() {
        if (window.sistemaCom && typeof window.sistemaCom.mostrarRespuesta === 'function') {
            const originalMostrarRespuesta = window.sistemaCom.mostrarRespuesta;

            window.sistemaCom.mostrarRespuesta = async function(id) {
                const usuario = await verificarSesionComentarios();

                if (!usuario) {
                    mostrarModalLoginRequerido();
                    return;
                }

                return originalMostrarRespuesta.call(this, id);
            };

            console.log('✅ Botón de responder protegido');
        }
    }

    /**
     * BLOQUEAR: Acceso a modal de comentarios sin sesión
     */
    function bloquearAbrirModalComentarios() {
        // Interceptar botones de comentarios
        document.addEventListener('click', async function(e) {
            // Si hace clic en botón de abrir modal de comentarios
            if (e.target.closest('.btn-comentarios-modal')) {
                const usuario = await verificarSesionComentarios();

                if (!usuario) {
                    e.preventDefault();
                    e.stopPropagation();
                    mostrarModalLoginRequerido();
                    return false;
                }
            }
        }, true);

        console.log('✅ Modal de comentarios protegido');
    }

    /**
     * Inicializar protección
     */
    function inicializarProteccion() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    bloquearTextareaComentarios();
                    bloquearBotonesComentar();
                    bloquearBotonesResponder();
                    bloquearAbrirModalComentarios();
                    console.log('🔒 Protección de comentarios completamente activada');
                }, 500);
            });
        } else {
            setTimeout(() => {
                bloquearTextareaComentarios();
                bloquearBotonesComentar();
                bloquearBotonesResponder();
                bloquearAbrirModalComentarios();
                console.log('🔒 Protección de comentarios completamente activada');
            }, 500);
        }
    }

    // Usar MutationObserver para comentarios dinámicos
    const observer = new MutationObserver(() => {
        bloquearTextareaComentarios();
        bloquearBotonesResponder();
    });

    // Observar cambios en el DOM
    if (document.readyState !== 'loading') {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    // Iniciar
    inicializarProteccion();

})();