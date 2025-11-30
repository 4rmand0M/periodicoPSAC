let todosEditores = [];
let filtroActual = 'todos';

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarEditores();
    setupBusqueda();
});

// Cargar editores desde la base de datos
async function cargarEditores() {
    try {
        const response = await fetch('../Connection/listar_editores_publico.php');
        const data = await response.json();
        
        if (data.success) {
            todosEditores = data.editores;
            actualizarEstadisticas(todosEditores);
            mostrarEditores(todosEditores);
        } else {
            mostrarError('Error al cargar el equipo');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cargar el equipo');
    }
}

// Actualizar estadísticas
function actualizarEstadisticas(editores) {
    const admins = editores.filter(e => e.rol === 'admin').length;
    const editors = editores.filter(e => e.rol === 'editor').length;
    
    document.getElementById('totalEditores').textContent = editores.length;
    document.getElementById('totalAdmins').textContent = admins;
    document.getElementById('totalEditorsOnly').textContent = editors;
}

// Mostrar editores en el grid
function mostrarEditores(editores) {
    const grid = document.getElementById('editoresGrid');
    
    if (editores.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">No se encontraron editores</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = editores.map((editor, index) => {
        const iniciales = obtenerIniciales(editor.nombre || editor.username);
        const color = generarColor(editor.nombre || editor.username);
        const rolClass = editor.rol === 'admin' ? 'rol-admin' : 'rol-editor';
        const rolTexto = editor.rol === 'admin' ? '👑 Administrador' : '✏️ Editor';
        const fecha = formatearFecha(editor.creado);
        
        return `
            <div class="editor-card" data-rol="${editor.rol}">
                <div class="editor-avatar" style="background: ${color}">
                    ${iniciales}
                </div>
                <div class="editor-info">
                    <h3>${editor.nombre || editor.username}</h3>
                    <div class="editor-username">@${editor.username}</div>
                    <div class="editor-rol ${rolClass}">${rolTexto}</div>
                    <div class="editor-fecha">Miembro desde ${fecha}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Obtener iniciales del nombre
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
        return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
}

// Generar color único basado en el nombre
function generarColor(nombre) {
    const colores = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
        '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
        '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
        '#EC4899', '#F43F5E'
    ];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colores[Math.abs(hash) % colores.length];
}

// Formatear fecha
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha desconocida';
    
    const fecha = new Date(fechaStr);
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// Filtrar por rol
function filtrarPorRol(rol) {
    filtroActual = rol;
    
    // Actualizar tabs activos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('tab' + rol.charAt(0).toUpperCase() + rol.slice(1)).classList.add('active');
    
    // Filtrar editores
    let filtrados = todosEditores;
    if (rol === 'admin') {
        filtrados = todosEditores.filter(e => e.rol === 'admin');
    } else if (rol === 'editor') {
        filtrados = todosEditores.filter(e => e.rol === 'editor');
    }
    
    // Aplicar búsqueda si hay texto
    const searchText = document.getElementById('searchEditor').value.toLowerCase();
    if (searchText) {
        filtrados = filtrados.filter(e => 
            (e.nombre || '').toLowerCase().includes(searchText) ||
            e.username.toLowerCase().includes(searchText)
        );
    }
    
    mostrarEditores(filtrados);
}

// Configurar búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchEditor');
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        
        // Aplicar filtro de rol actual
        let filtrados = todosEditores;
        if (filtroActual === 'admin') {
            filtrados = todosEditores.filter(e => e.rol === 'admin');
        } else if (filtroActual === 'editor') {
            filtrados = todosEditores.filter(e => e.rol === 'editor');
        }
        
        // Filtrar por búsqueda
        if (query) {
            filtrados = filtrados.filter(e =>
                (e.nombre || '').toLowerCase().includes(query) ||
                e.username.toLowerCase().includes(query)
            );
        }
        
        mostrarEditores(filtrados);
        
        // Highlight si hay resultados
        if (query && filtrados.length > 0) {
            setTimeout(() => {
                document.querySelectorAll('.editor-card').forEach(card => {
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 500);
                });
            }, 100);
        }
    });
}

// Mostrar error
function mostrarError(mensaje) {
    const grid = document.getElementById('editoresGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">${mensaje}</div>
        </div>
    `;
}