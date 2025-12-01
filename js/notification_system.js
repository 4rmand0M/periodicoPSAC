// Sistema de notificaciones completamente funcional y autónomo
(function(global) {
    'use strict';
    
    // Contenedor único de notificaciones
    let container = null;
    let notificationCount = 0;
    
    // Inicializar contenedor
    function initContainer() {
        if (container && document.body.contains(container)) {
            return container;
        }
        
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 420px;
            pointer-events: none;
        `;
        
        // Asegurar que el body esté disponible
        if (document.body) {
            document.body.appendChild(container);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(container);
            });
        }
        
        return container;
    }
    
    // Iconos SVG
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16.5 5L7.5 14L3.5 10"/>
        </svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10" cy="10" r="8"/>
            <line x1="10" y1="6" x2="10" y2="10"/>
            <line x1="10" y1="14" x2="10.01" y2="14"/>
        </svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 2L2 17h16L10 2z"/>
            <line x1="10" y1="8" x2="10" y2="12"/>
            <line x1="10" y1="15" x2="10.01" y2="15"/>
        </svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10" cy="10" r="8"/>
            <line x1="10" y1="14" x2="10" y2="10"/>
            <line x1="10" y1="6" x2="10.01" y2="6"/>
        </svg>`,
        loading: `<div style="width: 20px; height: 20px; border: 3px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>`
    };
    
    // Crear notificación
    function createNotification(type, message, title, duration) {
        const cont = initContainer();
        const id = 'notif_' + (++notificationCount) + '_' + Date.now();
        
        const notif = document.createElement('div');
        notif.id = id;
        notif.className = 'notification notification-' + type;
        notif.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            min-width: 320px;
            max-width: 100%;
            position: relative;
            overflow: hidden;
            border-left: 4px solid;
            pointer-events: auto;
            animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
            transform: translateX(400px);
        `;
        
        // Colores por tipo
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            loading: '#8b5cf6'
        };
        
        notif.style.borderLeftColor = colors[type] || colors.info;
        
        // Estructura HTML
        notif.innerHTML = `
            <div class="notification-icon" style="
                width: 28px;
                height: 28px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : type === 'info' ? '#dbeafe' : '#ede9fe'};
                color: ${colors[type]};
            ">
                ${icons[type] || icons.info}
            </div>
            <div class="notification-content" style="flex: 1;">
                ${title ? `<div class="notification-title" style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1f2937;">${title}</div>` : ''}
                <div class="notification-message" style="font-size: 13px; color: #6b7280; line-height: 1.4;">${message}</div>
            </div>
            ${type !== 'loading' ? `
            <button class="notification-close" style="
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
                width: 24px;
                height: 24px;
            " onclick="notify.remove('${id}')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="4" x2="4" y2="12"/>
                    <line x1="4" y1="4" x2="12" y2="12"/>
                </svg>
            </button>` : ''}
            ${duration > 0 ? '<div class="notification-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; background: currentColor; opacity: 0.3; width: 100%;"></div>' : ''}
        `;
        
        cont.appendChild(notif);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            notif.style.opacity = '1';
            notif.style.transform = 'translateX(0)';
        });
        
        // Auto-cerrar
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
        
        return id;
    }
    
    // Remover notificación
    function removeNotification(id) {
        const notif = document.getElementById(id);
        if (!notif) return;
        
        notif.style.animation = 'slideOutRight 0.3s ease-out forwards';
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(400px)';
        
        setTimeout(() => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        }, 300);
    }
    
    // Modal de confirmación
    function showConfirm(options) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: scaleIn 0.2s;
        `;
        
        modal.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">
                ${options.title || '¿Confirmar?'}
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 20px; line-height: 1.5;">
                ${options.message || ''}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="confirmCancel" style="
                    padding: 10px 20px;
                    background: #f3f4f6;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">${options.cancelText || 'Cancelar'}</button>
                <button id="confirmOk" style="
                    padding: 10px 20px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">${options.confirmText || 'Confirmar'}</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .notification-close:hover {
                background: rgba(0, 0, 0, 0.05) !important;
                color: #4b5563 !important;
            }
            #confirmCancel:hover {
                background: #e5e7eb !important;
            }
            #confirmOk:hover {
                background: #dc2626 !important;
            }
        `;
        
        if (!document.getElementById('notify-animations')) {
            style.id = 'notify-animations';
            document.head.appendChild(style);
        }
        
        const btnOk = modal.querySelector('#confirmOk');
        const btnCancel = modal.querySelector('#confirmCancel');
        
        btnOk.onclick = () => {
            if (options.onConfirm) options.onConfirm();
            document.body.removeChild(overlay);
        };
        
        btnCancel.onclick = () => {
            if (options.onCancel) options.onCancel();
            document.body.removeChild(overlay);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                if (options.onCancel) options.onCancel();
                document.body.removeChild(overlay);
            }
        };
    }
    
    // API pública
    global.notify = {
        success: function(message, title, duration) {
            return createNotification('success', message, title || 'Éxito', duration || 3000);
        },
        
        error: function(message, title, duration) {
            return createNotification('error', message, title || 'Error', duration || 4000);
        },
        
        warning: function(message, title, duration) {
            return createNotification('warning', message, title || 'Advertencia', duration || 3500);
        },
        
        info: function(message, title, duration) {
            return createNotification('info', message, title || 'Información', duration || 3000);
        },
        
        loading: function(message, title) {
            return createNotification('loading', message, title || 'Cargando', 0);
        },
        
        remove: function(id) {
            if (id) {
                removeNotification(id);
            }
        },
        
        confirm: function(options) {
            showConfirm(options || {});
        }
    };
    
    console.log('✅ Sistema de notificaciones inicializado correctamente');
    
})(window);