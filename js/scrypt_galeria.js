let todosLosArchivos = [];
let filtroActual = 'todos';

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
    cargarGaleria();
    setupBusqueda();
});

// Cargar galería
async function cargarGaleria() {
    try {
        const response = await fetch('../Connection/listar_galeria.php', {
            cache: 'no-store'
        });

        const data = await response.json();

        if (data.success) {
            todosLosArchivos = data.archivos;
            mostrarGaleria(todosLosArchivos);
        } else {
            mostrarError('Error al cargar la galería');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cargar la galería');
    }
}

// Mostrar galería
function mostrarGaleria(archivos) {
    const grid = document.getElementById('galeriaGrid');

    if (!archivos || archivos.length === 0) {
        grid.innerHTML = `
            <div class="empty-galeria">
                <div class="empty-galeria-icon">🖼️</div>
                <div class="empty-galeria-text">No hay archivos en la galería</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = archivos.map(archivo => {
        const tipo = archivo.tipo === 'imagen' ? 'imagen' : 'video';
        const icono = tipo === 'imagen' ? '🖼️' : '🎥';
        const badge = tipo === 'imagen' ? 'Imagen' : 'Video';
        const badgeClass = tipo === 'imagen' ? '' : 'video';
        const url = `../Connection/uploads/${archivo.ruta}`;

        return `
            <div class="galeria-item" onclick="abrirModal('${url}', '${archivo.tipo}', '${archivo.area || 'General'}', '${archivo.descripcion || 'Sin descripción'}', '${archivo.fecha}')">
                ${tipo === 'imagen' 
                    ? `<img src="${url}" alt="${badge}" class="galeria-item-media">` 
                    : `<video class="galeria-item-media"><source src="${url}"></video>`
                }
                <div class="galeria-item-overlay">
                    <div class="galeria-item-icon">${icono}</div>
                </div>
                <div class="galeria-item-badge">
                    <span class="tipo-badge ${badgeClass}">${badge}</span>
                </div>
                <div class="galeria-item-info">
                    <div class="galeria-item-area">📁 ${archivo.area || 'General'}</div>
                    <div class="galeria-item-title">${archivo.descripcion || 'Sin descripción'}</div>
                    <div class="galeria-item-meta">
                        <span>📅 ${formatearFecha(archivo.fecha)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filtrar por tipo
function filtrarPor(tipo) {
    filtroActual = tipo;

    // Actualizar botones
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filtrar archivos
    let filtrados = todosLosArchivos;
    if (tipo !== 'todos') {
        filtrados = todosLosArchivos.filter(a => a.tipo === tipo);
    }

    // Aplicar búsqueda si hay texto
    const searchText = document.getElementById('searchGaleria').value.toLowerCase();
    if (searchText) {
        filtrados = filtrados.filter(a =>
            (a.area || '').toLowerCase().includes(searchText) ||
            (a.descripcion || '').toLowerCase().includes(searchText)
        );
    }

    mostrarGaleria(filtrados);
}

// Setup búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchGaleria');

    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();

        let filtrados = todosLosArchivos;
        if (filtroActual !== 'todos') {
            filtrados = todosLosArchivos.filter(a => a.tipo === filtroActual);
        }

        if (query) {
            filtrados = filtrados.filter(a =>
                (a.area || '').toLowerCase().includes(query) ||
                (a.descripcion || '').toLowerCase().includes(query)
            );
        }

        mostrarGaleria(filtrados);
    });
}

// Abrir modal
function abrirModal(url, tipo, area, descripcion, fecha) {
    const modal = document.getElementById('modalGaleria');
    const mediaContainer = document.getElementById('modalMediaContainer');
    const infoContainer = document.getElementById('modalInfoContainer');

    // Crear media
    if (tipo === 'imagen') {
        mediaContainer.innerHTML = `<img src="${url}" alt="${descripcion}" class="modal-galeria-media">`;
    } else {
        mediaContainer.innerHTML = `<video controls class="modal-galeria-media"><source src="${url}"></video>`;
    }

    // Crear info
    const tipoTexto = tipo === 'imagen' ? 'Imagen' : 'Video';
    infoContainer.innerHTML = `
        <div class="modal-galeria-title">${descripcion}</div>
        <div class="modal-galeria-meta">
            <div class="meta-item">
                <strong>Tipo:</strong> ${tipoTexto}
            </div>
            <div class="meta-item">
                <strong>Área:</strong> ${area}
            </div>
            <div class="meta-item">
                <strong>Fecha:</strong> ${formatearFecha(fecha)}
            </div>
        </div>
        <div class="modal-galeria-acciones">
            <button class="btn-accion-galeria btn-descargar" onclick="descargarArchivo('${url}', '${descripcion}')">
                📥 Descargar
            </button>
            <button class="btn-accion-galeria" onclick="compartirArchivo('${url}', '${descripcion}')">
                🔗 Compartir
            </button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function cerrarModal() {
    const modal = document.getElementById('modalGaleria');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Cerrar modal al presionar ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarModal();
    }
});

// Cerrar al hacer clic fuera
document.getElementById('modalGaleria')?.addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

// Descargar archivo
function descargarArchivo(url, nombre) {
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre || 'descarga';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    notify.success('Descarga iniciada', 'Éxito');
}

// Compartir archivo
function compartirArchivo(url, nombre) {
    if (navigator.share) {
        navigator.share({
            title: nombre,
            text: 'Mira este archivo de la Galería PSAC',
            url: url
        }).catch(err => console.log('Error al compartir:', err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            notify.success('Enlace copiado al portapapeles', 'Compartir');
        }).catch(() => {
            notify.error('No se pudo copiar el enlace', 'Error');
        });
    }
}

// Formatear fecha
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha desconocida';

    const fecha = new Date(fechaStr);
    const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Mostrar error
function mostrarError(mensaje) {
    const grid = document.getElementById('galeriaGrid');
    grid.innerHTML = `
        <div class="empty-galeria">
            <div class="empty-galeria-icon">⚠️</div>
            <div class="empty-galeria-text">${mensaje}</div>
        </div>
    `;
}

// Toggle section
function toggleSection(sectionId) {
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
}