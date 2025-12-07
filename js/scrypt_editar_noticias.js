// scrypt_editar_noticias.js - Gestión de noticias

let todasLasNoticias = [];
let noticiaActual = null;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarNoticias();
    setupBusqueda();
    setupFormulario();
});

// Cargar noticias
async function cargarNoticias() {
    try {
        const response = await fetch('../Connection/listar_noticias.php', {
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            todasLasNoticias = data.noticias;
            mostrarNoticias(todasLasNoticias);
        } else {
            mostrarError('Error al cargar noticias');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Mostrar noticias
function mostrarNoticias(noticias) {
    const grid = document.getElementById('noticiasGrid');
    
    if (noticias.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📰</div>
                <div class="empty-state-text">No hay noticias disponibles</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = noticias.map(noticia => `
        <div class="noticia-card">
            ${noticia.imagen_principal ? 
                `<img src="../Connection/uploads/noticias/${noticia.imagen_principal}" alt="${noticia.titulo}" class="noticia-card-imagen">` :
                '<div class="noticia-card-imagen" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">📰</div>'
            }
            <div class="noticia-card-body">
                <span class="noticia-card-badge ${obtenerBadgeClass(noticia.categoria)}">${noticia.categoria || 'General'}</span>
                <h3 class="noticia-card-titulo">${noticia.titulo}</h3>
                <p class="noticia-card-descripcion">${noticia.descripcion}</p>
                <div class="noticia-card-meta">
                    <span>📅 ${formatearFecha(noticia.creado)}</span>
                    <span>✍️ ${noticia.autor || 'Redacción'}</span>
                </div>
                <div class="noticia-card-actions">
                    <button class="btn-editar-noticia" onclick="editarNoticia(${noticia.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn-eliminar-noticia" onclick="eliminarNoticia(${noticia.id}, '${noticia.titulo.replace(/'/g, "\\'")}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Editar noticia
async function editarNoticia(id) {
    try {
        const response = await fetch(`../Connection/obtener_noticia.php?id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            noticiaActual = data.noticia;
            
            document.getElementById('editNoticiaId').value = noticiaActual.id;
            document.getElementById('editTitulo').value = noticiaActual.titulo;
            document.getElementById('editDescripcion').value = noticiaActual.descripcion || '';
            document.getElementById('editCategoria').value = noticiaActual.categoria || 'general';
            document.getElementById('editContenido').value = noticiaActual.contenido;
            
            document.getElementById('modalEditar').classList.add('active');
        } else {
            notify.error('Error al cargar la noticia', 'Error');
        }
    } catch (error) {
        console.error('Error:', error);
        notify.error('Error de conexión', 'Error');
    }
}

// Cerrar modal
function cerrarModalEditar() {
    document.getElementById('modalEditar').classList.remove('active');
    noticiaActual = null;
}

// Setup formulario
function setupFormulario() {
    document.getElementById('formEditar').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('editNoticiaId').value;
        const titulo = document.getElementById('editTitulo').value.trim();
        const descripcion = document.getElementById('editDescripcion').value.trim();
        const categoria = document.getElementById('editCategoria').value;
        const contenido = document.getElementById('editContenido').value.trim();
        
        if (!titulo || !contenido) {
            notify.warning('Completa los campos obligatorios', 'Validación');
            return;
        }
        
        const loadingId = notify.loading('Actualizando noticia...');
        
        try {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('categoria', categoria);
            formData.append('contenido', contenido);
            
            const response = await fetch('../Connection/editar_noticia.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            notify.remove(loadingId);
            
            if (result.success) {
                notify.success('Noticia actualizada exitosamente', 'Éxito');
                cerrarModalEditar();
                cargarNoticias();
            } else {
                notify.error(result.message || 'Error al actualizar', 'Error');
            }
        } catch (error) {
            notify.remove(loadingId);
            notify.error('Error de conexión', 'Error');
            console.error('Error:', error);
        }
    });
}

// Eliminar noticia
async function eliminarNoticia(id, titulo) {
    notify.confirm({
        title: '¿Eliminar noticia?',
        message: `¿Estás seguro de eliminar "${titulo}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
            const loadingId = notify.loading('Eliminando noticia...');
            
            try {
                const response = await fetch(`../Connection/eliminar_noticia.php?id=${id}`);
                const result = await response.json();
                
                notify.remove(loadingId);
                
                if (result.success) {
                    notify.success('Noticia eliminada exitosamente', 'Éxito');
                    cargarNoticias();
                } else {
                    notify.error(result.message || 'Error al eliminar', 'Error');
                }
            } catch (error) {
                notify.remove(loadingId);
                notify.error('Error de conexión', 'Error');
                console.error('Error:', error);
            }
        }
    });
}

// Setup búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchNoticias');
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        
        if (query) {
            const filtradas = todasLasNoticias.filter(n =>
                n.titulo.toLowerCase().includes(query) ||
                n.descripcion.toLowerCase().includes(query) ||
                n.categoria.toLowerCase().includes(query)
            );
            mostrarNoticias(filtradas);
        } else {
            mostrarNoticias(todasLasNoticias);
        }
    });
}

// Utilidades
function obtenerBadgeClass(categoria) {
    const clases = {
        'informatica': 'badge-informatica',
        'deportes': 'badge-deportes',
        'cultura': 'badge-cultura',
        'general': 'badge-general',
        'mercadeo': 'badge-mercadeo'
    };
    return clases[categoria?.toLowerCase()] || 'badge-general';
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha desconocida';
    
    const fecha = new Date(fechaStr);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function mostrarError(mensaje) {
    const grid = document.getElementById('noticiasGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">${mensaje}</div>
        </div>
    `;
}