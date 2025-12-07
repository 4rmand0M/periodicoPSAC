// scrypt_calendario.js - Sistema de Calendario con Eventos

let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let eventosDelMes = [];
let eventoSeleccionado = null;
let colorSeleccionado = '#3B82F6';

const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventos();
    renderizarCalendario();
    cargarEventos();
});

// Setup de eventos
function inicializarEventos() {
    // Navegación del calendario
    document.getElementById('btnPrevMonth').addEventListener('click', mesAnterior);
    document.getElementById('btnNextMonth').addEventListener('click', mesSiguiente);
    document.getElementById('btnToday').addEventListener('click', irHoy);
    
    // Nuevo evento
    document.getElementById('btnNuevoEvento').addEventListener('click', abrirModalNuevoEvento);
    
    // Toggle sidebar de eventos
    document.getElementById('btnToggleEventos').addEventListener('click', function() {
        document.querySelector('.eventos-sidebar').classList.toggle('collapsed');
    });
    
    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            colorSeleccionado = this.dataset.color;
            document.getElementById('eventoColor').value = colorSeleccionado;
        });
    });
    
    // Seleccionar primer color por defecto
    document.querySelector('.color-option[data-color="#3B82F6"]').classList.add('selected');
    
    // Form de evento
    document.getElementById('formEvento').addEventListener('submit', guardarEvento);
}

// Renderizar calendario
function renderizarCalendario() {
    const grid = document.getElementById('calendarioGrid');
    const titulo = document.getElementById('currentMonth');
    
    // Actualizar título
    titulo.textContent = `${meses[mesActual]} ${anioActual}`;
    
    // Limpiar grid
    grid.innerHTML = '';
    
    // Añadir encabezados de días
    diasSemana.forEach(dia => {
        const elem = document.createElement('div');
        elem.className = 'dia-semana';
        elem.textContent = dia;
        grid.appendChild(elem);
    });
    
    // Calcular días del mes
    const primerDia = new Date(anioActual, mesActual, 1);
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    const diasMesAnterior = new Date(anioActual, mesActual, 0).getDate();
    
    const diaInicio = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    // Días del mes anterior
    for (let i = diaInicio - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        crearDiaElemento(dia, true);
    }
    
    // Días del mes actual
    for (let i = 1; i <= diasEnMes; i++) {
        crearDiaElemento(i, false);
    }
    
    // Días del siguiente mes
    const diasRestantes = 42 - (diaInicio + diasEnMes);
    for (let i = 1; i <= diasRestantes; i++) {
        crearDiaElemento(i, true, true);
    }
}

// Crear elemento de día
function crearDiaElemento(numero, otroMes = false, mesSiguiente = false) {
    const grid = document.getElementById('calendarioGrid');
    const hoy = new Date();
    
    let mes = mesActual;
    let anio = anioActual;
    
    if (otroMes && !mesSiguiente) {
        mes = mesActual - 1;
        if (mes < 0) {
            mes = 11;
            anio = anioActual - 1;
        }
    } else if (mesSiguiente) {
        mes = mesActual + 1;
        if (mes > 11) {
            mes = 0;
            anio = anioActual + 1;
        }
    }
    
    const fecha = new Date(anio, mes, numero);
    const fechaStr = formatearFechaSQL(fecha);
    
    const elem = document.createElement('div');
    elem.className = 'dia';
    if (otroMes) elem.classList.add('otro-mes');
    
    // Verificar si es hoy
    if (fecha.toDateString() === hoy.toDateString()) {
        elem.classList.add('hoy');
    }
    
    // Buscar eventos para este día
    const eventosDelDia = eventosDelMes.filter(e => e.fecha === fechaStr);
    
    elem.innerHTML = `
        <div class="dia-numero">${numero}</div>
        <div class="dia-eventos">
            ${eventosDelDia.slice(0, 3).map(e => `
                <div class="evento-punto" style="background: ${e.color}"></div>
            `).join('')}
            ${eventosDelDia.length > 3 ? `<div class="evento-badge">+${eventosDelDia.length - 3} más</div>` : ''}
        </div>
    `;
    
    elem.onclick = () => mostrarEventosDia(fecha, eventosDelDia);
    
    grid.appendChild(elem);
}

// Mostrar eventos del día
function mostrarEventosDia(fecha, eventos) {
    if (eventos.length === 0) {
        abrirModalNuevoEvento(fecha);
        return;
    }
    
    if (eventos.length === 1) {
        mostrarDetalleEvento(eventos[0]);
    } else {
        // Mostrar lista de eventos
        notify.info(`Hay ${eventos.length} eventos este día`, 'Eventos');
        // Scroll a la lista de eventos
        document.querySelector('.eventos-lista').scrollTop = 0;
    }
}

// Cargar eventos desde el servidor
async function cargarEventos() {
    try {
        const response = await fetch(`../Connection/calendario_api.php?action=listar&mes=${mesActual + 1}&anio=${anioActual}`);
        const data = await response.json();
        
        if (data.success) {
            eventosDelMes = data.eventos;
            renderizarCalendario();
            renderizarListaEventos();
        } else {
            notify.error('Error al cargar eventos', 'Error');
        }
    } catch (error) {
        console.error('Error:', error);
        notify.error('Error de conexión', 'Error');
    }
}

// Renderizar lista de eventos
function renderizarListaEventos() {
    const lista = document.getElementById('eventosLista');
    
    if (eventosDelMes.length === 0) {
        lista.innerHTML = `
            <div class="eventos-empty">
                <p>📅 No hay eventos programados</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha
    const eventosOrdenados = [...eventosDelMes].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
    );
    
    lista.innerHTML = eventosOrdenados.map(evento => `
        <div class="evento-item" style="border-left-color: ${evento.color}" 
             onclick="mostrarDetalleEvento(${evento.id})">
            <div class="evento-item-nombre">${evento.nombre}</div>
            <div class="evento-item-fecha">
                📅 ${formatearFechaLegible(evento.fecha)}
                ${evento.hora ? `• 🕒 ${evento.hora}` : ''}
            </div>
        </div>
    `).join('');
}

// Abrir modal nuevo evento
function abrirModalNuevoEvento(fechaSeleccionada = null) {
    eventoSeleccionado = null;
    document.getElementById('modalEventoTitulo').textContent = 'Nuevo Evento';
    document.getElementById('formEvento').reset();
    document.getElementById('eventoId').value = '';
    document.getElementById('eventoColor').value = colorSeleccionado;
    
    // Establecer fecha: usar la fecha seleccionada si se proporciona, sino usar la de hoy
    const fechaInput = document.getElementById('eventoFecha');
    if (fechaSeleccionada) {
        fechaInput.value = formatearFechaSQL(fechaSeleccionada);
    } else if (!fechaInput.value) {
        fechaInput.value = formatearFechaSQL(new Date());
    }
    
    document.getElementById('modalEvento').classList.add('active');
}

// Cerrar modal evento
function cerrarModalEvento() {
    document.getElementById('modalEvento').classList.remove('active');
}

// Guardar evento
async function guardarEvento(e) {
    e.preventDefault();
    
    const id = document.getElementById('eventoId').value;
    const nombre = document.getElementById('eventoNombre').value.trim();
    const descripcion = document.getElementById('eventoDescripcion').value.trim();
    const fecha = document.getElementById('eventoFecha').value;
    const hora = document.getElementById('eventoHora').value;
    const color = document.getElementById('eventoColor').value;
    
    if (!nombre || !fecha) {
        notify.warning('Completa los campos obligatorios', 'Validación');
        return;
    }
    
    const loadingId = notify.loading(id ? 'Actualizando evento...' : 'Creando evento...');
    
    try {
        const formData = new FormData();
        formData.append('action', id ? 'editar' : 'crear');
        if (id) formData.append('id', id);
        formData.append('nombre', nombre);
        formData.append('descripcion', descripcion);
        formData.append('fecha', fecha);
        formData.append('hora', hora);
        formData.append('color', color);
        
        const response = await fetch('../Connection/calendario_api.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        notify.remove(loadingId);
        
        if (data.success) {
            notify.success(id ? 'Evento actualizado' : 'Evento creado', 'Éxito');
            cerrarModalEvento();
            cargarEventos();
        } else {
            notify.error(data.message || 'Error al guardar', 'Error');
        }
    } catch (error) {
        notify.remove(loadingId);
        notify.error('Error de conexión', 'Error');
        console.error('Error:', error);
    }
}

// Mostrar detalle de evento
function mostrarDetalleEvento(eventoIdOrObj) {
    let evento;
    
    if (typeof eventoIdOrObj === 'object') {
        evento = eventoIdOrObj;
    } else {
        evento = eventosDelMes.find(e => e.id === eventoIdOrObj);
    }
    
    if (!evento) {
        notify.error('Evento no encontrado', 'Error');
        return;
    }
    
    eventoSeleccionado = evento;
    
    document.getElementById('detalleEventoTitulo').textContent = evento.nombre;
    document.getElementById('detalleFecha').textContent = formatearFechaLegible(evento.fecha);
    
    if (evento.hora) {
        document.getElementById('detalleHoraContainer').style.display = 'flex';
        document.getElementById('detalleHora').textContent = evento.hora;
    } else {
        document.getElementById('detalleHoraContainer').style.display = 'none';
    }
    
    if (evento.descripcion) {
        document.getElementById('detalleDescripcionContainer').style.display = 'flex';
        document.getElementById('detalleDescripcion').textContent = evento.descripcion;
    } else {
        document.getElementById('detalleDescripcionContainer').style.display = 'none';
    }
    
    document.getElementById('modalDetalleEvento').classList.add('active');
}

// Cerrar modal detalle
function cerrarModalDetalle() {
    document.getElementById('modalDetalleEvento').classList.remove('active');
    eventoSeleccionado = null;
}

// Editar evento desde detalle
function editarEventoDesdeDetalle() {
    if (!eventoSeleccionado) return;
    
    cerrarModalDetalle();
    
    document.getElementById('modalEventoTitulo').textContent = 'Editar Evento';
    document.getElementById('eventoId').value = eventoSeleccionado.id;
    document.getElementById('eventoNombre').value = eventoSeleccionado.nombre;
    document.getElementById('eventoDescripcion').value = eventoSeleccionado.descripcion || '';
    document.getElementById('eventoFecha').value = eventoSeleccionado.fecha;
    document.getElementById('eventoHora').value = eventoSeleccionado.hora || '';
    document.getElementById('eventoColor').value = eventoSeleccionado.color;
    
    // Seleccionar color
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
    const colorOption = document.querySelector(`.color-option[data-color="${eventoSeleccionado.color}"]`);
    if (colorOption) colorOption.classList.add('selected');
    
    document.getElementById('modalEvento').classList.add('active');
}

// Eliminar evento desde detalle
function eliminarEventoDesdeDetalle() {
    if (!eventoSeleccionado) return;
    
    notify.confirm({
        title: '¿Eliminar evento?',
        message: `¿Estás seguro de eliminar "${eventoSeleccionado.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
            const loadingId = notify.loading('Eliminando evento...');
            
            try {
                const response = await fetch(`../Connection/calendario_api.php?action=eliminar&id=${eventoSeleccionado.id}`);
                const data = await response.json();
                
                notify.remove(loadingId);
                
                if (data.success) {
                    notify.success('Evento eliminado', 'Éxito');
                    cerrarModalDetalle();
                    cargarEventos();
                } else {
                    notify.error(data.message || 'Error al eliminar', 'Error');
                }
            } catch (error) {
                notify.remove(loadingId);
                notify.error('Error de conexión', 'Error');
                console.error('Error:', error);
            }
        }
    });
}

// Navegación del calendario
function mesAnterior() {
    mesActual--;
    if (mesActual < 0) {
        mesActual = 11;
        anioActual--;
    }
    renderizarCalendario();
    cargarEventos();
}

function mesSiguiente() {
    mesActual++;
    if (mesActual > 11) {
        mesActual = 0;
        anioActual++;
    }
    renderizarCalendario();
    cargarEventos();
}

function irHoy() {
    mesActual = new Date().getMonth();
    anioActual = new Date().getFullYear();
    renderizarCalendario();
    cargarEventos();
}

// Utilidades
function formatearFechaSQL(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function formatearFechaLegible(fechaStr) {
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio}`;
}

// Toggle section (para sidebar)
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