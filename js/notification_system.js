// Simple notification shim to provide a `notify` API used across the project.
// This is a minimal fallback that uses native alerts/confirms when no UI library
// is available. It avoids runtime ReferenceError for `notify` and provides the
// methods expected by the existing code: loading, remove, success, error, info,
// warning, confirm.
(function (global) {
    const notifications = {};

    function makeText(title, message) {
        if (title && message) return title + "\n" + message;
        return (message || title || '');
    }

    const useSwal = typeof global.Swal === 'function' || typeof global.Swal === 'object';
    const useNotyf = typeof global.Notyf === 'function' || typeof global.Notyf === 'object';
    let notyfInstance = null;

    // Lazy initializer for Notyf: try to create an instance when first needed.
    function getNotyfInstance() {
        if (notyfInstance) return notyfInstance;
        try {
            console.log('[notify] getNotyfInstance: typeof Notyf =', typeof global.Notyf);
            if (typeof global.Notyf === 'function' || typeof global.Notyf === 'object') {
                // If the document isn't ready, defer construction until DOMContentLoaded
                if (!document || document.readyState === 'loading' || !(document.body || document.getElementsByTagName('body')[0])) {
                    console.log('[notify] document not ready — deferring Notyf init until DOMContentLoaded');
                    try {
                        document.addEventListener('DOMContentLoaded', function onReady() {
                            document.removeEventListener('DOMContentLoaded', onReady);
                            try {
                                notyfInstance = new Notyf({ duration: 3500, position: { x: 'right', y: 'top' } });
                                console.log('[notify] Notyf instance created on DOMContentLoaded');
                            } catch (err) {
                                console.error('[notify] Notyf constructor threw on DOMContentLoaded:', err && err.message ? err.message : err);
                                notyfInstance = null;
                            }
                        });
                    } catch (e) {
                        console.error('[notify] failed to attach DOMContentLoaded listener for Notyf init:', e && e.message ? e.message : e);
                    }
                    return null;
                }
                try {
                    notyfInstance = new Notyf({ duration: 3500, position: { x: 'right', y: 'top' } });
                    console.log('[notify] Notyf instance created');
                    return notyfInstance;
                } catch (innerErr) {
                    console.error('[notify] Notyf constructor threw:', innerErr && innerErr.message ? innerErr.message : innerErr);
                    notyfInstance = null;
                }
            } else {
                console.log('[notify] Notyf not present (typeof not function/object)');
            }
        } catch (e) {
            console.error('[notify] getNotyfInstance error:', e && e.message ? e.message : e);
            notyfInstance = null;
        }
        return null;
    }

    // Minimal DOM-based toast implementation used when Notyf isn't available.
    let domToastContainer = null;
    function ensureDomToastContainer() {
        if (domToastContainer) return domToastContainer;
        // Prefer existing #notyf-container (from actual Notyf CSS/shim) so styles match
        const existing = document.getElementById('notyf-container');
        if (existing) {
            domToastContainer = existing;
            return domToastContainer;
        }
        domToastContainer = document.createElement('div');
        domToastContainer.id = 'notyf-container';

        // Only inject minimal animation CSS if not already present
        if (!document.querySelector('style[data-notify-dom-style]')) {
            const css = `
                #notyf-container{position:fixed;top:1rem;right:1rem;z-index:99999;display:flex;flex-direction:column;gap:0.6rem}
                .notyf{min-width:180px;padding:10px 14px;border-radius:8px;color:#fff;margin-bottom:10px;box-shadow:0 6px 18px rgba(0,0,0,0.12);font-family:Arial, sans-serif;opacity:0;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease}
                .notyf--success{background:#16a34a}
                .notyf--error{background:#dc2626}
                .notyf--warning{background:#f59e0b;color:#111}
                .notyf--info{background:#2563eb}
            `;
            const style = document.createElement('style');
            style.setAttribute('data-notify-dom-style', '');
            style.appendChild(document.createTextNode(css));
            const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
            try { head.appendChild(style); } catch (e) { /* ignore */ }
        }

        const body = document.body || document.getElementsByTagName('body')[0] || document.documentElement;
        try { body.appendChild(domToastContainer); } catch (e) { /* ignore */ }
        return domToastContainer;
    }

    function showDomToast(type, text) {
        const container = ensureDomToastContainer();
        const el = document.createElement('div');
        // Use same classes as Notyf so the included `plugins/notyf.min.css` applies
        const cls = 'notyf ' + (type === 'success' ? 'notyf--success' : type === 'error' ? 'notyf--error' : type === 'warning' ? 'notyf--warning' : 'notyf--info');
        el.className = cls;
        el.textContent = text || '';
        container.appendChild(el);
        // trigger animation
        requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
        const timeout = setTimeout(() => {
            el.style.opacity = '0'; el.style.transform = 'translateY(-6px)';
            setTimeout(() => { try { container.removeChild(el); } catch (e) {} }, 200);
        }, 3000);
        // return an id-like token so remove() can clear it if needed
        const id = 'dom_' + Date.now() + Math.floor(Math.random()*1000);
        notifications[id] = { el, timeout };
        return id;
    }

    const notify = {
        loading(message) {
            if (useSwal) {
                const id = 'swal_loading_' + Date.now();
                Swal.fire({
                    title: message || 'Cargando...',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                notifications[id] = true;
                return id;
            }
            const id = 'not_' + Date.now();
            notifications[id] = { type: 'loading', message };
            console.log('[notify] loading:', message);
            return id;
        },
        remove(id) {
            if (!id) return;
            if (useSwal) {
                // SweetAlert uses a global modal; closing it removes loading/toasts
                Swal.close();
                delete notifications[id];
                return;
            }
            if (notifications[id]) delete notifications[id];
        },
        success(message, title) {
            const text = makeText(title, message);
            const nf = getNotyfInstance();
            if (nf) {
                try { console.log('[notify] success -> backend: Notyf'); nf.success(text); return; } catch (e) { console.warn('[notify] Notyf failed on success:', e); }
            }
            try { console.log('[notify] success -> backend: DOM fallback'); showDomToast('success', text); return; } catch (e) { console.warn('[notify] DOM fallback failed on success:', e); }
            if (useSwal) {
                console.log('[notify] success -> backend: SweetAlert2');
                return Swal.fire({ icon: 'success', title: title || '', text: message || '' });
            }
            try { console.log('[notify] success -> backend: native alert'); window.alert(text); } catch (e) { console.log('[notify] success fallback log:', title, message); }
        },
        error(message, title) {
            const text = makeText(title, message);
            const nf = getNotyfInstance();
            if (nf) {
                try { console.log('[notify] error -> backend: Notyf'); nf.error(text); return; } catch (e) { console.warn('[notify] Notyf failed on error:', e); }
            }
            try { console.log('[notify] error -> backend: DOM fallback'); showDomToast('error', text); return; } catch (e) { console.warn('[notify] DOM fallback failed on error:', e); }
            if (useSwal) {
                console.log('[notify] error -> backend: SweetAlert2');
                return Swal.fire({ icon: 'error', title: title || 'Error', text: message || '' });
            }
            try { console.log('[notify] error -> backend: native alert'); window.alert(text); } catch (e) { console.log('[notify] error fallback log:', title, message); }
        },
        info(message, title) {
            const text = makeText(title, message);
            const nf = getNotyfInstance();
            if (nf) {
                try { console.log('[notify] info -> backend: Notyf'); nf.open({ type: 'info', message: text }); return; } catch (e) { console.warn('[notify] Notyf failed on info:', e); }
            }
            try { console.log('[notify] info -> backend: DOM fallback'); showDomToast('info', text); return; } catch (e) { console.warn('[notify] DOM fallback failed on info:', e); }
            if (useSwal) {
                console.log('[notify] info -> backend: SweetAlert2');
                return Swal.fire({ icon: 'info', title: title || '', text: message || '' });
            }
            try { console.log('[notify] info -> backend: native alert'); window.alert(text); } catch (e) { console.log('[notify] info fallback log:', title, message); }
        },
        warning(message, title) {
            const text = makeText(title, message);
            const nf = getNotyfInstance();
            if (nf) {
                try { console.log('[notify] warning -> backend: Notyf'); nf.open({ type: 'warning', message: text }); return; } catch (e) { console.warn('[notify] Notyf failed on warning:', e); }
            }
            try { console.log('[notify] warning -> backend: DOM fallback'); showDomToast('warning', text); return; } catch (e) { console.warn('[notify] DOM fallback failed on warning:', e); }
            if (useSwal) {
                console.log('[notify] warning -> backend: SweetAlert2');
                return Swal.fire({ icon: 'warning', title: title || 'Aviso', text: message || '' });
            }
            try { console.log('[notify] warning -> backend: native alert'); window.alert(text); } catch (e) { console.log('[notify] warning fallback log:', title, message); }
        },
        confirm(options) {
            // options: { title, message, onConfirm, onCancel }
            if (useSwal) {
                Swal.fire({
                    title: options && options.title ? options.title : 'Confirmar',
                    text: options && options.message ? options.message : '',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Aceptar',
                    cancelButtonText: 'Cancelar'
                }).then(result => {
                    if (result.isConfirmed) {
                        if (options && typeof options.onConfirm === 'function') options.onConfirm();
                    } else {
                        if (options && typeof options.onCancel === 'function') options.onCancel();
                    }
                });
                return;
            }
            const text = makeText(options && options.title, options && options.message || '¿Confirmar?');
            const ok = window.confirm(text);
            if (ok) {
                if (options && typeof options.onConfirm === 'function') options.onConfirm();
            } else {
                if (options && typeof options.onCancel === 'function') options.onCancel();
            }
            return ok;
        }
    };

    global.notify = notify;
    // Debug output to help verify which adaptadores están activos
    try {
        // Attempt to initialize Notyf now for a clearer status message
        const _nf = getNotyfInstance();
        console.log('[notify] initialized; Notyf:', !!_nf, 'SweetAlert2:', useSwal);
    } catch (e) { /* ignore */ }

    // Diagnostic helper: call `notify.test()` from the console to run a quick
    // sequence of toasts/modals to verify that notifications work on this page.
    notify.test = async function () {
        try {
            console.log('[notify.test] starting test sequence');
            const _nf = getNotyfInstance();
            if (_nf) {
                _nf.success('Notyf OK: éxito');
                await new Promise(r => setTimeout(r, 600));
                _nf.error('Notyf OK: error');
                await new Promise(r => setTimeout(r, 600));
                _nf.open({ type: 'info', message: 'Notyf OK: info' });
                await new Promise(r => setTimeout(r, 600));
                _nf.open({ type: 'warning', message: 'Notyf OK: warning' });
            } else if (useSwal) {
                await Swal.fire({ title: 'Fallback: SweetAlert2 activo', text: 'Mostraré confirm y un toast simulado.' });
            } else {
                window.alert('Fallback: Ninguna librería de notificaciones activa.\nnotify.test muestra alertas nativas.');
            }

            // Test loading modal (Swal) if available
            if (useSwal) {
                const id = notify.loading('Probando carga...');
                await new Promise(r => setTimeout(r, 800));
                notify.remove(id);
            }

            // Test confirm behavior
            if (useSwal) {
                await new Promise(resolve => {
                    notify.confirm({
                        title: '¿Confirmación de prueba? (Swal)',
                        message: 'Pulsa Aceptar o Cancelar para probar handlers.',
                        onConfirm: () => { console.log('[notify.test] confirm -> onConfirm'); resolve(); },
                        onCancel: () => { console.log('[notify.test] confirm -> onCancel'); resolve(); }
                    });
                });
            } else {
                const r = window.confirm('Confirmación de prueba: OK/Cancelar');
                console.log('[notify.test] native confirm result:', r);
            }

            console.log('[notify.test] finished');
        } catch (err) {
            console.error('[notify.test] error during test:', err);
        }
    };
})(window);
