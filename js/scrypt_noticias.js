// Variables globales
let todasLasNoticias = [];
let filtroActual = 'todas';
let noticiaActual = null;

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
    cargarNoticias();
    setupBusqueda();
});

// Cargar noticias desde la base de datos
async function cargarNoticias() {
    try {
        const response = await fetch('../Connection/listar_noticias.php', {
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            todasLasNoticias = data.noticias;
            mostrarNoticias(todasLasNoticias);
            generarTicker(todasLasNoticias);
        } else {
            mostrarError('Error al cargar noticias');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cargar noticias');
    }
}

// Generar ticker de noticias
function generarTicker(noticias) {
    const tickerItems = document.getElementById('tickerItems');
    if (!tickerItems) return;
    
    // Duplicar los títulos para efecto continuo
    const titulos = noticias.map(n => n.titulo);
    const titulosRepetidos = [...titulos, ...titulos];
    
    tickerItems.innerHTML = titulosRepetidos.map(titulo => 
        `<span class="ticker-item">${titulo}</span>`
    ).join('');
}

// Mostrar noticias en el layout
function mostrarNoticias(noticias) {
    const layoutContainer = document.getElementById('noticiasLayout');
    const gridAdicionalContainer = document.getElementById('noticiasGridAdicional');
    
    if (!noticias || noticias.length === 0) {
        layoutContainer.innerHTML = `
            <div class="empty-noticias">
                <div class="empty-noticias-icon">📰</div>
                <div class="empty-noticias-text">No hay noticias disponibles</div>
            </div>
        `;
        if (gridAdicionalContainer) gridAdicionalContainer.innerHTML = '';
        return;
    }
    
    // La primera noticia (más reciente) es la principal
    const noticiaPrincipal = noticias[0];
    // Las siguientes 4 son las del sidebar
    const noticiasSidebar = noticias.slice(1, 5);
    // El resto va en el grid de 2 columnas
    const noticiasGrid = noticias.slice(5);
    
    // Construir HTML del layout principal (noticia grande + 4 pequeñas)
    let html = `
        <!-- Noticia Principal (Izquierda) -->
        <div class="noticia-principal" onclick="abrirNoticia(${noticiaPrincipal.id})">
            ${crearMediaHTML(noticiaPrincipal, 'principal')}
            <div class="noticia-principal-contenido">
                <span class="noticia-badge ${obtenerBadgeClass(noticiaPrincipal.categoria)}">${noticiaPrincipal.categoria || 'General'}</span>
                <h2 class="noticia-principal-titulo">${noticiaPrincipal.titulo}</h2>
                <p class="noticia-principal-descripcion">${noticiaPrincipal.descripcion}</p>
                <div class="noticia-principal-footer">
                    <span class="noticia-fecha">📅 ${formatearFecha(noticiaPrincipal.creado)}</span>
                    <span class="noticia-autor">${noticiaPrincipal.autor || 'Redacción'}</span>
                </div>
            </div>
        </div>
        
        <!-- Sidebar de Noticias Pequeñas (Derecha) - SOLO 4 -->
        <div class="noticias-sidebar">
    `;
    
    // Agregar las 4 noticias secundarias del sidebar
    noticiasSidebar.forEach(noticia => {
        html += `
            <div class="noticia-pequena" onclick="abrirNoticia(${noticia.id})">
                ${crearMediaHTML(noticia, 'pequena')}
                <div class="noticia-pequena-contenido">
                    <div>
                        <span class="noticia-badge ${obtenerBadgeClass(noticia.categoria)}">${noticia.categoria || 'General'}</span>
                        <h3 class="noticia-pequena-titulo">${noticia.titulo}</h3>
                    </div>
                    <div class="noticia-pequena-meta">
                        <span>📅 ${formatearFecha(noticia.creado)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`; // Cerrar sidebar
    
    layoutContainer.innerHTML = html;
    
    // Mostrar grid adicional si hay más de 5 noticias
    if (gridAdicionalContainer) {
        if (noticiasGrid.length > 0) {
            let gridHTML = '';
            
            noticiasGrid.forEach(noticia => {
                gridHTML += `
                    <div class="noticia-card-grid" onclick="abrirNoticia(${noticia.id})">
                        ${crearMediaHTML(noticia, 'grid')}
                        <div class="noticia-card-grid-contenido">
                            <span class="noticia-badge ${obtenerBadgeClass(noticia.categoria)}">${noticia.categoria || 'General'}</span>
                            <h3 class="noticia-card-grid-titulo">${noticia.titulo}</h3>
                            <p class="noticia-card-grid-descripcion">${noticia.descripcion}</p>
                            <div class="noticia-card-grid-footer">
                                <span class="noticia-fecha">📅 ${formatearFecha(noticia.creado)}</span>
                                <span class="noticia-autor">${noticia.autor || 'Redacción'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            gridAdicionalContainer.innerHTML = gridHTML;
            gridAdicionalContainer.style.display = 'grid';
        } else {
            gridAdicionalContainer.innerHTML = '';
            gridAdicionalContainer.style.display = 'none';
        }
    }
}

// Crear HTML de media según tipo
function crearMediaHTML(noticia, size) {
    let clase = '';
    if (size === 'principal') {
        clase = 'noticia-principal';
    } else if (size === 'pequena') {
        clase = 'noticia-pequena';
    } else if (size === 'grid') {
        clase = 'noticia-card-grid';
    }
    
    if (noticia.imagen_principal) {
        return `<img src="../Connection/uploads/noticias/${noticia.imagen_principal}" alt="${noticia.titulo}" class="${clase}-imagen">`;
    } else if (noticia.video_principal) {
        return `<video src="../Connection/uploads/noticias/${noticia.video_principal}" class="${clase}-video" muted></video>`;
    }
    return '';
}

// Obtener clase de badge según categoría
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

// Formatear fecha
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha desconocida';
    
    const fecha = new Date(fechaStr);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Filtrar noticias por categoría
function filtrarNoticias(categoria) {
    filtroActual = categoria;
    
    // Actualizar botones activos
    document.querySelectorAll('.filtro-noticia').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrar
    let filtradas = todasLasNoticias;
    if (categoria !== 'todas') {
        filtradas = todasLasNoticias.filter(n => 
            n.categoria?.toLowerCase() === categoria.toLowerCase()
        );
    }
    
    // Aplicar búsqueda si hay texto
    const searchText = document.getElementById('searchNoticias').value.toLowerCase();
    if (searchText) {
        filtradas = filtradas.filter(n => 
            n.titulo.toLowerCase().includes(searchText) ||
            n.descripcion.toLowerCase().includes(searchText)
        );
    }
    
    mostrarNoticias(filtradas);
}

// Setup búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchNoticias');
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        
        // Aplicar filtro de categoría actual
        let filtradas = todasLasNoticias;
        if (filtroActual !== 'todas') {
            filtradas = todasLasNoticias.filter(n => 
                n.categoria?.toLowerCase() === filtroActual.toLowerCase()
            );
        }
        
        // Filtrar por búsqueda
        if (query) {
            filtradas = filtradas.filter(n =>
                n.titulo.toLowerCase().includes(query) ||
                n.descripcion.toLowerCase().includes(query)
            );
        }
        
        mostrarNoticias(filtradas);
    });
}

// Abrir modal de noticia completa
async function abrirNoticia(id) {
    try {
        const response = await fetch(`../Connection/obtener_noticia.php?id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            noticiaActual = data.noticia;
            mostrarModalNoticia(noticiaActual);
        } else {
            notify.error('Error al cargar la noticia', 'Error');
        }
    } catch (error) {
        console.error('Error:', error);
        notify.error('Error de conexión', 'Error');
    }
}

// Mostrar modal con la noticia completa
function mostrarModalNoticia(noticia) {
    const modal = document.getElementById('modalNoticia');
    
    // Imagen principal
    const imagen = document.getElementById('modalNoticiaImagen');
    if (noticia.imagen_principal) {
        imagen.src = `../Connection/uploads/noticias/${noticia.imagen_principal}`;
        imagen.style.display = 'block';
    } else if (noticia.video_principal) {
        imagen.outerHTML = `<video src="../Connection/uploads/noticias/${noticia.video_principal}" class="modal-noticia-media" controls autoplay muted></video>`;
    }
    
    // Badge
    const badge = document.getElementById('modalNoticiaBadge');
    badge.textContent = noticia.categoria || 'General';
    badge.className = 'noticia-badge ' + obtenerBadgeClass(noticia.categoria);
    
    // Título
    document.getElementById('modalNoticiaTitulo').textContent = noticia.titulo;
    
    // Meta info
    document.getElementById('modalNoticiaFecha').textContent = formatearFecha(noticia.creado);
    document.getElementById('modalNoticiaAutor').textContent = noticia.autor || 'Redacción';
    
    // Contenido
    const textoDiv = document.getElementById('modalNoticiaTexto');
    textoDiv.innerHTML = noticia.contenido.replace(/\n/g, '<br>');
    
    // Galería adicional
    const galeriaDiv = document.getElementById('modalNoticiaGaleria');
    if (noticia.galeria && noticia.galeria.length > 0) {
        galeriaDiv.innerHTML = noticia.galeria.map(item => {
            if (item.tipo === 'imagen') {
                return `<div class="modal-galeria-item">
                    <img src="../Connection/uploads/noticias/${item.archivo}" alt="Imagen">
                </div>`;
            } else {
                return `<div class="modal-galeria-item">
                    <video src="../Connection/uploads/noticias/${item.archivo}" controls></video>
                </div>`;
            }
        }).join('');
        galeriaDiv.style.display = 'grid';
    } else {
        galeriaDiv.style.display = 'none';
    }
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function cerrarModalNoticia() {
    const modal = document.getElementById('modalNoticia');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    noticiaActual = null;
}

// Cerrar con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarModalNoticia();
    }
});

// Cerrar al hacer clic fuera
document.getElementById('modalNoticia')?.addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModalNoticia();
    }
});

// Imprimir noticia
function imprimirNoticia() {
    if (!noticiaActual) return;
    
    const contenido = `
        <html>
        <head>
            <title>${noticiaActual.titulo}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #1f2937; margin-bottom: 20px; }
                .meta { color: #6b7280; margin-bottom: 30px; }
                .contenido { line-height: 1.8; font-size: 16px; }
                img { max-width: 100%; height: auto; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>${noticiaActual.titulo}</h1>
            <div class="meta">
                <strong>Fecha:</strong> ${formatearFecha(noticiaActual.creado)}<br>
                <strong>Autor:</strong> ${noticiaActual.autor || 'Redacción'}<br>
                <strong>Categoría:</strong> ${noticiaActual.categoria}
            </div>
            ${noticiaActual.imagen_principal ? `<img src="../Connection/uploads/noticias/${noticiaActual.imagen_principal}" alt="${noticiaActual.titulo}">` : ''}
            <div class="contenido">
                ${noticiaActual.contenido.replace(/\n/g, '<br>')}
            </div>
        </body>
        </html>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.focus();
    
    setTimeout(() => {
        ventana.print();
    }, 500);
}

// Descargar informe PDF
async function descargarInforme() {
    if (!noticiaActual) return;
    
    const loadingId = notify.loading('Generando informe PDF...');
    
    try {
        const response = await fetch('../Connection/generar_informe_noticia.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                noticia_id: noticiaActual.id
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `informe_${noticiaActual.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            notify.remove(loadingId);
            notify.success('Informe descargado correctamente', 'Descarga exitosa');
        } else {
            throw new Error('Error al generar PDF');
        }
    } catch (error) {
        notify.remove(loadingId);
        notify.error('Error al generar el informe PDF', 'Error');
        console.error('Error:', error);
    }
}

// Compartir noticia
function compartirNoticia() {
    if (!noticiaActual) return;
    
    const url = window.location.href;
    const texto = `${noticiaActual.titulo} - Periódico PSAC`;
    
    if (navigator.share) {
        navigator.share({
            title: noticiaActual.titulo,
            text: texto,
            url: url
        }).then(() => {
            notify.success('Noticia compartida', 'Compartir');
        }).catch(err => {
            console.log('Error al compartir:', err);
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            notify.success('Enlace copiado al portapapeles', 'Compartir');
        }).catch(() => {
            notify.error('No se pudo copiar el enlace', 'Error');
        });
    }
}

// Mostrar error
function mostrarError(mensaje) {
    const layout = document.getElementById('noticiasLayout');
    layout.innerHTML = `
        <div class="empty-noticias">
            <div class="empty-noticias-icon">⚠️</div>
            <div class="empty-noticias-text">${mensaje}</div>
        </div>
    `;
}

// Toggle section (para el sidebar)
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