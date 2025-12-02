
(function() {
    'use strict';
    
    // ==========================================
    // CREAR ELEMENTOS SI NO EXISTEN
    // ==========================================
    
    // Crear botón hamburguesa si no existe
    function crearBotonHamburguesa() {
        if (document.getElementById('menuToggle')) return;
        
        const btn = document.createElement('button');
        btn.id = 'menuToggle';
        btn.className = 'menu-toggle';
        btn.setAttribute('aria-label', 'Toggle menu');
        btn.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        document.body.insertBefore(btn, document.body.firstChild);
    }
    
    // Crear overlay si no existe
    function crearOverlay() {
        if (document.getElementById('sidebarOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        document.body.insertBefore(overlay, document.body.firstChild);
    }
    
    // ==========================================
    // FUNCIONALIDAD PRINCIPAL
    // ==========================================
    
    function inicializarSidebar() {
        // Crear elementos necesarios
        crearBotonHamburguesa();
        crearOverlay();
        
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('aside');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (!sidebar) {
            notify.warning('⚠️ No se encontró el elemento <aside>');
            return;
        }
        
        // Función para abrir/cerrar sidebar
        function toggleSidebar() {
            menuToggle.classList.toggle('active');
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            
            // Prevenir scroll del body cuando está abierto (solo en móvil)
            if (window.innerWidth < 769) {
                if (sidebar.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        }
        
        // Click en botón hamburguesa
        menuToggle.addEventListener('click', toggleSidebar);
        
        // Click en overlay (cerrar)
        sidebarOverlay.addEventListener('click', toggleSidebar);
        
        // Cerrar al hacer clic en enlaces (solo en móvil)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 769 && sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            });
        });
        
        // Cerrar con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
        
        // Ajustar al cambiar tamaño de ventana
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // En desktop, cerrar el menú y restaurar scroll
                if (window.innerWidth >= 769) {
                    menuToggle.classList.remove('active');
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }, 250);
        });
        
        console.log('✅ Sidebar toggle inicializado correctamente');
    }
    
    // ==========================================
    // AUTO-INICIALIZAR
    // ==========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarSidebar);
    } else {
        inicializarSidebar();
    }
    
})();