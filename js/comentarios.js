// sistema de comentarios

class SistemaComentarios {
    constructor(tipo = 'publicacion') {
        this.tipo = tipo;
        this.currentItemId = null;
        this.orden = 'recientes';
        this.offset = 0;
        this.limite = 20;
        this.cargando = false;
        this.tieneMas = true;
    }

    /**
     * Inicializar sistema
     */
    init(itemId, containerId) {
        this.currentItemId = itemId;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('Contenedor no encontrado:', containerId);
            return;
        }

        container.innerHTML = this.getHTMLTemplate();
        this.cargarComentarios(itemId);
        this.setupEventos(itemId);
    }

    /**
     * Abrir modal de comentarios
     */
    abrirModal(itemId) {
        this.currentItemId = itemId;
        
        // Crear modal si no existe
        let modal = document.getElementById('modal-comentarios');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-comentarios';
            modal.className = 'modal-comentarios';
            modal.innerHTML = `
                <div class="modal-comentarios-overlay" onclick="sistemaCom.cerrarModal()"></div>
                <div class="modal-comentarios-content">
                    <div class="modal-comentarios-header">
                        <h3>💬 Comentarios</h3>
                        <button class="modal-comentarios-close" onclick="sistemaCom.cerrarModal()">✕</button>
                    </div>
                    <div class="modal-comentarios-body" id="modal-comentarios-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Inicializar comentarios en el modal
        const modalBody = document.getElementById('modal-comentarios-body');
        modalBody.innerHTML = this.getHTMLTemplate();
        this.cargarComentarios(itemId);
        this.setupEventos(itemId);
        
        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Cerrar modal de comentarios
     */
    cerrarModal() {
        const modal = document.getElementById('modal-comentarios');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Template HTML
     */
    getHTMLTemplate() {
        const isModal = document.getElementById('modal-comentarios')?.classList.contains('active');
        return `
            <div class="comentarios-section">
                <div class="comentarios-header">
                    <div class="comentarios-titulo-wrapper">
                        <h3 class="comentarios-titulo">
                            💬 Comentarios
                            <span class="comentarios-count" id="count-${this.currentItemId}">0</span>
                        </h3>
                    </div>
                </div>
                
                <div class="comentarios-container ${isModal ? 'visible' : ''}" id="container-${this.currentItemId}">
                    <div class="comentario-form">
                        <textarea 
                            class="comentario-textarea" 
                            id="input-${this.currentItemId}"
                            placeholder="Escribe un comentario... (Usa @ para mencionar)"
                            maxlength="1000"
                        ></textarea>
                        <div class="autocomplete-menciones" id="autocomplete-${this.currentItemId}"></div>
                        <div class="comentario-form-actions">
                            <span class="comentario-char-count" id="char-${this.currentItemId}">0/1000</span>
                            <button class="btn-comentar" 
                                    onclick="sistemaCom.publicar('${this.currentItemId}')">
                                📤 Comentar
                            </button>
                        </div>
                    </div>
                    
                    <div class="comentarios-lista" id="lista-${this.currentItemId}">
                        <div class="comentarios-loading">
                            <div class="spinner"></div>
                            <p>Cargando...</p>
                        </div>
                    </div>
                    
                    <div class="cargar-mas" id="cargar-${this.currentItemId}" style="display:none;">
                        <button onclick="sistemaCom.cargarMas('${this.currentItemId}')">
                            📄 Cargar más
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup eventos
     */
    setupEventos(itemId) {
        const textarea = document.getElementById(`input-${itemId}`);
        const charCount = document.getElementById(`char-${itemId}`);
        
        if (textarea && charCount) {
            textarea.addEventListener('input', (e) => {
                const length = e.target.value.length;
                charCount.textContent = `${length}/1000`;
                
                if (length >= 900) charCount.classList.add('warning');
                else charCount.classList.remove('warning');
                
                this.handleMenciones(e.target.value, itemId);
            });
            
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.publicar(itemId);
                }
            });
        }
    }

    /**
     * Autocompletado de menciones
     */
    async handleMenciones(texto, itemId) {
        const autocomplete = document.getElementById(`autocomplete-${itemId}`);
        if (!autocomplete) return;
        
        const match = texto.match(/@(\w+)$/);
        
        if (match && match[1].length >= 2) {
            const query = match[1];
            
            try {
                const response = await fetch(`../Connection/comentarios_api.php?action=buscar_usuarios&query=${query}`);
                const data = await response.json();
                
                if (data.success && data.usuarios.length > 0) {
                    autocomplete.innerHTML = data.usuarios.map(u => `
                        <div class="autocomplete-item" onclick="sistemaCom.seleccionarMencion('${itemId}', '@${u.username}')">
                            <div class="mencion-avatar" style="background: ${this.generarColor(u.username)}">
                                ${this.obtenerIniciales(u.username)}
                            </div>
                            <div class="mencion-info">
                                <strong>${u.nombre || u.username}</strong>
                                <small>@${u.username}</small>
                            </div>
                        </div>
                    `).join('');
                    autocomplete.style.display = 'block';
                } else {
                    autocomplete.style.display = 'none';
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            autocomplete.style.display = 'none';
        }
    }

    /**
     * Seleccionar mención
     */
    seleccionarMencion(itemId, mencion) {
        const textarea = document.getElementById(`input-${itemId}`);
        const autocomplete = document.getElementById(`autocomplete-${itemId}`);
        
        if (textarea) {
            const text = textarea.value;
            const lastAtIndex = text.lastIndexOf('@');
            textarea.value = text.substring(0, lastAtIndex) + mencion + ' ';
            textarea.focus();
        }
        
        if (autocomplete) autocomplete.style.display = 'none';
    }

    /**
     * Toggle comentarios
     */
    toggleComentarios(itemId) {
        const container = document.getElementById(`container-${itemId}`);
        const btn = container.previousElementSibling.querySelector('.toggle-comentarios');
        
        if (container.classList.contains('visible')) {
            container.classList.remove('visible');
            btn.textContent = 'Ver';
        } else {
            container.classList.add('visible');
            btn.textContent = 'Ocultar';
        }
    }

    /**
     * Cambiar orden (método mantenido para compatibilidad, pero no se usa)
     */
    cambiarOrden(itemId, nuevoOrden) {
        this.orden = nuevoOrden;
        this.offset = 0;
        this.cargarComentarios(itemId);
    }

    /**
     * Cargar comentarios
     */
    async cargarComentarios(itemId, append = false) {
        if (this.cargando) return;
        
        this.cargando = true;
        const lista = document.getElementById(`lista-${itemId}`);
        
        if (!append) {
            lista.innerHTML = '<div class="comentarios-loading"><div class="spinner"></div><p>Cargando...</p></div>';
        }
        
        try {
            const url = `../Connection/comentarios_api.php?action=listar&tipo=${this.tipo}&id_item=${itemId}&orden=${this.orden}&limite=${this.limite}&offset=${this.offset}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                if (append) {
                    const html = data.comentarios.map(c => this.crearHTML(c)).join('');
                    lista.insertAdjacentHTML('beforeend', html);
                } else {
                    this.mostrar(itemId, data.comentarios);
                }
                
                this.actualizarContador(itemId, data.total);
                this.tieneMas = data.tiene_mas;
                
                const btnCargar = document.getElementById(`cargar-${itemId}`);
                if (btnCargar) {
                    btnCargar.style.display = data.tiene_mas ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Error:', error);
            lista.innerHTML = '<div class="comentarios-empty"><p>Error al cargar</p></div>';
        } finally {
            this.cargando = false;
        }
    }

    /**
     * Cargar más
     */
    cargarMas(itemId) {
        if (!this.tieneMas || this.cargando) return;
        this.offset += this.limite;
        this.cargarComentarios(itemId, true);
    }

    /**
     * Mostrar comentarios
     */
    mostrar(itemId, comentarios) {
        const lista = document.getElementById(`lista-${itemId}`);
        
        if (comentarios.length === 0) {
            lista.innerHTML = '<div class="comentarios-empty"><div class="icon">💬</div><p>Sé el primero en comentar</p></div>';
            return;
        }
        
        lista.innerHTML = comentarios.map(c => this.crearHTML(c)).join('');
    }

    /**
     * Crear HTML de comentario
     */
    crearHTML(c, esRespuesta = false) {
        const iniciales = this.obtenerIniciales(c.nombre_usuario);
        const color = this.generarColor(c.nombre_usuario);
        const fecha = this.formatearFecha(c.creado);
        const clases = `comentario-item ${c.es_propio ? 'propio' : ''} ${esRespuesta ? 'respuesta' : ''}`;
        const editado = c.editado ? '<span class="editado">✏️</span>' : '';
        const texto = this.resaltarMenciones(c.comentario);
        
        const respuestas = c.respuestas && c.respuestas.length > 0 
            ? `<div class="respuestas">${c.respuestas.map(r => this.crearHTML(r, true)).join('')}</div>`
            : '';
        
        return `
            <div class="${clases}" id="com-${c.id}">
                <div class="com-main">
                    <div class="com-header">
                        <div class="com-autor">
                            <div class="avatar" style="background:${color}">${iniciales}</div>
                            <div class="info">
                                <span class="nombre">${c.nombre_usuario}</span>
                                <span class="fecha">${fecha}</span>
                                ${editado}
                            </div>
                        </div>
                        <div class="acciones">
                            ${c.es_propio ? `
                            <button onclick="sistemaCom.editar(${c.id})" title="Editar">✏️</button>
                            <button onclick="sistemaCom.eliminar(${c.id})" title="Eliminar">🗑️</button>
                            ` : `
                            <button onclick="sistemaCom.reportar(${c.id})" title="Reportar">⚠️</button>
                            `}
                        </div>
                    </div>
                    <div class="com-texto" id="texto-${c.id}">${texto}</div>
                    
                    <div class="com-reacciones">
                        ${this.crearReacciones(c)}
                        ${!esRespuesta ? `<button class="btn-responder" onclick="sistemaCom.mostrarRespuesta(${c.id})">💬 Responder</button>` : ''}
                    </div>
                    
                    ${!esRespuesta ? `
                    <div class="respuesta-form" id="resp-form-${c.id}" style="display:none;">
                        <textarea id="resp-input-${c.id}" placeholder="Escribe una respuesta..." maxlength="500"></textarea>
                        <div class="resp-actions">
                            <button onclick="sistemaCom.enviarRespuesta(${c.id})">Responder</button>
                            <button onclick="sistemaCom.cancelarRespuesta(${c.id})">Cancelar</button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ${respuestas}
            </div>
        `;
    }

    /**
     * Crear reacciones
     */
    crearReacciones(c) {
        const reacciones = [
            { tipo: 'like', emoji: '👍', count: c.likes || 0 },
            { tipo: 'love', emoji: '❤️', count: c.loves || 0 },
            { tipo: 'dislike', emoji: '👎', count: c.dislikes || 0 }
        ];
        
        return reacciones.map(r => {
            const activa = c.reaccion_usuario === r.tipo ? 'activa' : '';
            return `<button class="btn-reaccion ${activa}" onclick="sistemaCom.reaccionar(${c.id}, '${r.tipo}')">${r.emoji} ${r.count}</button>`;
        }).join('');
    }

    /**
     * Resaltar menciones
     */
    resaltarMenciones(texto) {
        return texto.replace(/@(\w+)/g, '<span class="mencion">@$1</span>');
    }

    /**
     * Publicar comentario
     */
    async publicar(itemId, parentId = null) {
        const inputId = parentId ? `resp-input-${parentId}` : `input-${itemId}`;
        const textarea = document.getElementById(inputId);
        const comentario = textarea.value.trim();
        
        if (!comentario) {
            notify.warning('Escribe un comentario', 'Vacío');
            return;
        }
        
        const loadingId = notify.loading('Publicando...');
        
        try {
            const formData = new FormData();
            formData.append('action', 'crear');
            formData.append('tipo', this.tipo);
            formData.append('id_item', itemId);
            formData.append('comentario', comentario);
            if (parentId) formData.append('parent_id', parentId);
            
            const response = await fetch('../Connection/comentarios_api.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            notify.remove(loadingId);
            
            if (data.success) {
                notify.success('Comentario publicado', 'Éxito');
                textarea.value = '';
                
                if (parentId) this.cancelarRespuesta(parentId);
                
                this.offset = 0;
                this.cargarComentarios(itemId);
                
                // Asegurar que el contenedor esté visible (especialmente en modal)
                const container = document.getElementById(`container-${itemId}`);
                if (container) {
                    container.classList.add('visible');
                }
            } else {
                notify.error(data.message, 'Error');
            }
        } catch (error) {
            notify.remove(loadingId);
            notify.error('Error de conexión', 'Error');
        }
    }

    /**
     * Mostrar formulario respuesta
     */
    mostrarRespuesta(id) {
        const form = document.getElementById(`resp-form-${id}`);
        if (form) {
            form.style.display = 'block';
            const textarea = document.getElementById(`resp-input-${id}`);
            if (textarea) textarea.focus();
        }
    }

    /**
     * Cancelar respuesta
     */
    cancelarRespuesta(id) {
        const form = document.getElementById(`resp-form-${id}`);
        if (form) {
            form.style.display = 'none';
            const textarea = document.getElementById(`resp-input-${id}`);
            if (textarea) textarea.value = '';
        }
    }

    /**
     * Enviar respuesta
     */
    enviarRespuesta(parentId) {
        this.publicar(this.currentItemId, parentId);
    }

    /**
     * Editar comentario
     */
    async editar(id) {
        const textoDiv = document.getElementById(`texto-${id}`);
        const original = textoDiv.innerText;
        
        const textarea = document.createElement('textarea');
        textarea.value = original;
        textarea.className = 'textarea-edit';
        textarea.maxLength = 1000;
        
        const btnGuardar = document.createElement('button');
        btnGuardar.textContent = '💾 Guardar';
        btnGuardar.className = 'btn-edit';
        
        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = '✗ Cancelar';
        btnCancelar.className = 'btn-cancel';
        
        const actions = document.createElement('div');
        actions.className = 'edit-actions';
        actions.appendChild(btnGuardar);
        actions.appendChild(btnCancelar);
        
        textoDiv.innerHTML = '';
        textoDiv.appendChild(textarea);
        textoDiv.appendChild(actions);
        textarea.focus();
        
        btnCancelar.onclick = () => {
            textoDiv.innerHTML = this.resaltarMenciones(original);
        };
        
        btnGuardar.onclick = async () => {
            const nuevo = textarea.value.trim();
            if (!nuevo) {
                notify.warning('El comentario no puede estar vacío', 'Vacío');
                return;
            }
            
            const loadingId = notify.loading('Guardando...');
            
            try {
                const formData = new FormData();
                formData.append('action', 'editar');
                formData.append('tipo', this.tipo);
                formData.append('id', id);
                formData.append('comentario', nuevo);
                
                const response = await fetch('../Connection/comentarios_api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                notify.remove(loadingId);
                
                if (data.success) {
                    notify.success('Actualizado', 'Éxito');
                    textoDiv.innerHTML = this.resaltarMenciones(nuevo) + ' <span class="editado">✏️</span>';
                } else {
                    notify.error(data.message, 'Error');
                    textoDiv.innerHTML = this.resaltarMenciones(original);
                }
            } catch (error) {
                notify.remove(loadingId);
                notify.error('Error de conexión', 'Error');
                textoDiv.innerHTML = this.resaltarMenciones(original);
            }
        };
    }

    /**
     * Eliminar comentario
     */
    async eliminar(id) {
        notify.confirm({
            title: '¿Eliminar comentario?',
            message: 'Esta acción no se puede deshacer',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                const item = document.getElementById(`com-${id}`);
                if (item) item.classList.add('removing');
                
                try {
                    const formData = new FormData();
                    formData.append('action', 'eliminar');
                    formData.append('tipo', this.tipo);
                    formData.append('id', id);
                    
                    const response = await fetch('../Connection/comentarios_api.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        setTimeout(() => {
                            this.offset = 0;
                            this.cargarComentarios(this.currentItemId);
                            notify.success('Eliminado', 'Éxito');
                        }, 300);
                    } else {
                        if (item) item.classList.remove('removing');
                        notify.error(data.message, 'Error');
                    }
                } catch (error) {
                    if (item) item.classList.remove('removing');
                    notify.error('Error de conexión', 'Error');
                }
            }
        });
    }

    /**
     * Reaccionar
     */
    async reaccionar(id, tipo) {
        try {
            const formData = new FormData();
            formData.append('action', 'reaccionar');
            formData.append('tipo', this.tipo);
            formData.append('comentario_id', id);
            formData.append('tipo_reaccion', tipo);
            
            const response = await fetch('../Connection/comentarios_api.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.offset = 0;
                this.cargarComentarios(this.currentItemId);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    /**
     * Reportar comentario
     */
    async reportar(id) {
        // Implementación simple de reporte
        notify.confirm({
            title: 'Reportar comentario',
            message: '¿Deseas reportar este comentario como inapropiado?',
            confirmText: 'Reportar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    const formData = new FormData();
                    formData.append('action', 'reportar');
                    formData.append('tipo', this.tipo);
                    formData.append('comentario_id', id);
                    formData.append('razon', 'inapropiado');
                    formData.append('descripcion', 'Reportado desde la interfaz');
                    
                    const response = await fetch('../Connection/comentarios_api.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        notify.success('Reporte enviado', 'Gracias');
                    } else {
                        notify.error('Error al reportar', 'Error');
                    }
                } catch (error) {
                    notify.error('Error de conexión', 'Error');
                }
            }
        });
    }

    /**
     * Actualizar contador
     */
    actualizarContador(itemId, total) {
        const contador = document.getElementById(`count-${itemId}`);
        if (contador) contador.textContent = total;
    }

    /**
     * Obtener iniciales
     */
    obtenerIniciales(nombre) {
        if (!nombre) return '??';
        const palabras = nombre.trim().split(/\s+/);
        if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase();
        return nombre.substring(0, 2).toUpperCase();
    }

    /**
     * Generar color
     */
    generarColor(nombre) {
        const colores = [
            '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
            '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
            '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'
        ];
        
        if (!nombre) return colores[0];
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colores[Math.abs(hash) % colores.length];
    }

    /**
     * Formatear fecha
     */
    formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diff = ahora - fecha;
        
        const segundos = Math.floor(diff / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        
        if (segundos < 60) return 'Ahora';
        if (minutos < 60) return `Hace ${minutos}m`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias < 7) return `Hace ${dias}d`;
        
        return fecha.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short'
        });
    }
}

// Instancia global
window.sistemaCom = new SistemaComentarios('publicacion');