/**
 * SIDEBAR COMMON - Sistema de usuario para sidebar
 * Este archivo NO debe cargarse en index.html porque ya tiene sus propias funciones
 * Usar solo en: contactanos, nosotros, editores, editar, subir, usuarios
 */

(function() {
    'use strict';
    
    // Variable global para usuario actual (solo si no existe)
    if (typeof window.usuarioActual === 'undefined') {
        window.usuarioActual = null;
    }

    /**
     * Verificar sesión del usuario
     */
    window.verificarSesion = async function() {
        try {
            console.log('🔍 Verificando sesión...');
            const response = await fetch('../Connection/check_session.php', { 
                cache: 'no-store',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            console.log('📊 Sesión:', data);

            if (data && data.logged_in) {
                window.usuarioActual = data.user || data;
                mostrarUsuarioSidebar(window.usuarioActual);
                mostrarControlesEditor();
                return true;
            } else {
                window.usuarioActual = null;
                ocultarControlesEditor();
                mostrarBotonIngresar();
                return false;
            }
        } catch (err) {
            console.error('❌ Error al verificar sesión:', err);
            mostrarBotonIngresar();
            return false;
        }
    };

    /**
     * Mostrar información del usuario en el sidebar
     */
    function mostrarUsuarioSidebar(user) {
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const btnIngresar = document.querySelector('.ingresar-btn');
        
        if (!userAvatar) {
            console.warn('⚠️ No se encontró #userAvatar en el DOM');
            return;
        }

        // Generar iniciales y color
        const iniciales = obtenerIniciales(user.nombre || user.username);
        const color = generarColor(user.nombre || user.username);
        let rolTexto = '👤 Usuario';
        if (user.rol === 'admin') {
            rolTexto = '👑 Administrador';
        } else if (user.rol === 'editor') {
            rolTexto = '✏️ Editor';
        }
        
        // Actualizar contenido del avatar
        userAvatar.innerHTML = `
            <div class="avatar-circle" style="background: ${color}">
                ${iniciales}
            </div>
            <div class="avatar-info">
                <strong>${user.nombre || user.username}</strong>
                <small>${rolTexto}</small>
            </div>
        `;
        
        // Mostrar contenedor de usuario
        if (userInfo) {
            userInfo.classList.remove('guest');
            userInfo.style.display = 'block';
        }
        
        // Convertir botón de ingresar en botón de salir
        if (btnIngresar) {
            btnIngresar.innerHTML = '🚪 Cerrar Sesión';
            btnIngresar.classList.add('logout');
            btnIngresar.style.background = '#EF4444';
            btnIngresar.style.color = 'white';
            btnIngresar.onclick = function(e) {
                e.preventDefault();
                cerrarSesion();
            };
        }
        
        console.log('✅ Usuario mostrado en sidebar:', user.username);
    }

    /**
     * Mostrar botón de ingresar cuando no hay sesión
     */
    function mostrarBotonIngresar() {
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const btnIngresar = document.querySelector('.ingresar-btn');
        
        if (userInfo) {
            userInfo.classList.add('guest');
            userInfo.style.display = 'none';
        }
        
        if (userAvatar) {
            userAvatar.innerHTML = '';
        }
        
        if (btnIngresar) {
            btnIngresar.innerHTML = 'Ingresar';
            btnIngresar.classList.remove('logout');
            btnIngresar.style.background = '#4ADE80';
            btnIngresar.style.color = 'white';
            btnIngresar.onclick = function() {
                window.location.href = 'login.html';
            };
        }
        
        console.log('👤 Modo invitado activado');
    }

    /**
     * Cerrar sesión del usuario
     */
    function cerrarSesion() {
        if (typeof notify !== 'undefined') {
            notify.confirm({
                title: '¿Cerrar sesión?',
                message: '¿Estás seguro de que deseas cerrar tu sesión?',
                confirmText: 'Cerrar sesión',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    window.location.href = '../Connection/logout.php';
                }
            });
        } else {
            if (confirm('¿Deseas cerrar la sesión?')) {
                window.location.href = '../Connection/logout.php';
            }
        }
    }

    /**
     * Mostrar/ocultar controles de editor según rol
     */
    function mostrarControlesEditor() {
        const sectionPublicar = document.getElementById('section-publicar');
        const sectionAdmtools = document.getElementById('section-admtools');

        // Solo mostrar sección de publicar para editores y admins
        if (sectionPublicar) {
            const rol = window.usuarioActual?.rol || 'usuario';
            sectionPublicar.style.display = (rol === 'editor' || rol === 'admin') ? 'block' : 'none';
        }
        
        // Solo mostrar herramientas de admin para admins
        if (sectionAdmtools) {
            sectionAdmtools.style.display = 
                (window.usuarioActual && window.usuarioActual.rol === 'admin') ? 'block' : 'none';
        }
    }

    function ocultarControlesEditor() {
        const sectionPublicar = document.getElementById('section-publicar');
        const sectionAdmtools = document.getElementById('section-admtools');

        if (sectionPublicar) sectionPublicar.style.display = 'none';
        if (sectionAdmtools) sectionAdmtools.style.display = 'none';
    }

    /**
     * Obtener iniciales del nombre
     */
    function obtenerIniciales(nombre) {
        if (!nombre) return '??';
        const palabras = String(nombre).trim().split(/\s+/);
        if (palabras.length >= 2) {
            return (palabras[0][0] + palabras[1][0]).toUpperCase();
        }
        return String(nombre).substring(0, 2).toUpperCase();
    }

    /**
     * Generar color único basado en el nombre
     */
    function generarColor(nombre) {
        const colores = [
            '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
            '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
            '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
            '#EC4899', '#F43F5E'
        ];
        
        if (!nombre) return colores[0];
        
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colores[Math.abs(hash) % colores.length];
    }

    /**
     * Toggle de secciones del sidebar
     */
    window.toggleSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        const arrow = document.getElementById('arrow-' + sectionId);
        
        if (!section) return;
        
        if (section.className.indexOf('collapsed') > -1) {
            section.className = 'section-content';
            if (arrow) arrow.classList.add('rotated');
        } else {
            section.className = 'section-content collapsed';
            if (arrow) arrow.classList.remove('rotated');
        }
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.verificarSesion);
    } else {
        window.verificarSesion();
    }

    console.log('✅ Sidebar Common inicializado');
})();