/* —————————————
   Fallback mínimo para `notify`
   ————————————— */
if (typeof notify === 'undefined') {
    console.warn('notify no encontrado — usando fallback mínimo (consola/alert).');
    window.notify = {
        success: (msg, title) => { console.log('SUCCESS:', title || '', msg); },
        error: (msg, title) => { console.error('ERROR:', title || '', msg); },
        warning: (msg, title) => { console.warn('WARNING:', title || '', msg); },
        info: (msg, title) => { console.log('INFO:', title || '', msg); },
        loading: (msg, title) => {
            console.log('LOADING:', title || '', msg);
            return 'loading_' + Date.now();
        },
        remove: (id) => { console.log('REMOVE NOTIF:', id); },
        confirm: (opts) => {
            const ok = confirm((opts.title ? opts.title + '\n\n' : '') + (opts.message || '¿Confirmar?'));
            if (ok && typeof opts.onConfirm === 'function') opts.onConfirm();
            if (!ok && typeof opts.onCancel === 'function') opts.onCancel();
        }
    };
}

/* =========================
   Mapa de colores por área
   ========================= */
const AREA_COLORS = {
    'informatica': '#FCD34D',
    'mercadeo': '#FB923C',
    'contabilidad': '#EF4444',
    'logistica': '#4ADE80',
    'turismo': '#22D3EE',
    'acondicionamiento': '#000000',
    'lengua': '#6366F1',
    'matematica': '#A855F7',
    'sociales': '#D946EF',
    'naturales': '#22C55E'
};

/* =========================
   Obtener color según área
   ========================= */
function getAreaColor(area) {
    const normalizedArea = (area || 'general').toLowerCase().trim();
    return AREA_COLORS[normalizedArea] || '#FB923C';
}

/* =========================
   Variables globales
   ========================= */
let usuarioActual = null;
let seleccionada = null;
let carouselIndex = 0;
window.areasSelected = [];

/* =========================
   Inicialización DOM
   ========================= */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOMContentLoaded');
    await verificarSesion();
    setupEventListeners();
    document.querySelectorAll('.filter-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', updateFilters);
    });
    updateFilters();
    cargarPublicaciones();
});

/* =========================
   Verificar sesión
   ========================= */
async function verificarSesion() {
    try {
        console.log('🔍 Verificando sesión...');
        const response = await fetch('../Connection/check_session.php', { 
            cache: 'no-store',
            credentials: 'same-origin'
        });
        const data = await response.json();
        console.log('📊 check_session ->', data);

        if (data && data.logged_in) {
            usuarioActual = data.user || data;
            mostrarUsuarioLogueado();
            mostrarControlesEditor();
            mostrarInfoUsuario(usuarioActual);
        } else {
            usuarioActual = null;
            ocultarControlesEditor();
        }
    } catch (err) {
        console.error('❌ Error verificarSesion:', err);
        notify.error('No se pudo verificar la sesión (problema de conexión).', 'Sesión');
    }
}

/* =========================
   Mostrar usuario logueado
   ========================= */
function mostrarUsuarioLogueado() {
    if (!usuarioActual) return;

    const btnIngresar = document.querySelector('.ingresar-btn');
    if (!btnIngresar) return;

    btnIngresar.style.background = "#EF4444";
    btnIngresar.style.color = "white";
    btnIngresar.style.fontWeight = "700";
    btnIngresar.style.padding = "10px 16px";
    btnIngresar.style.borderRadius = "8px";
    btnIngresar.style.display = "flex";
    btnIngresar.style.alignItems = "center";
    btnIngresar.style.justifyContent = "center";
    btnIngresar.style.cursor = "pointer";
    btnIngresar.style.fontSize = "14px";

    btnIngresar.innerHTML = "🚪 Salir";

    btnIngresar.onclick = () => {
        window.location.href = "../Connection/logout.php";
    };
}

/* =========================
   Mostrar / ocultar controles
   ========================= */
function mostrarControlesEditor() {
    const sectionPublicar = document.getElementById('section-publicar');
    const sectionAdmtools = document.getElementById('section-admtools');

    if (sectionPublicar) sectionPublicar.style.display = 'block';
    if (sectionAdmtools) {
        sectionAdmtools.style.display = (usuarioActual && usuarioActual.rol === 'admin') ? 'block' : 'none';
    }
}

function ocultarControlesEditor() {
    const sectionPublicar = document.getElementById('section-publicar');
    const sectionAdmtools = document.getElementById('section-admtools');

    if (sectionPublicar) sectionPublicar.style.display = 'none';
    if (sectionAdmtools) sectionAdmtools.style.display = 'none';
}

/* =========================
   Auxiliares: iniciales y color
   ========================= */
function obtenerIniciales(nombre) {
    if (!nombre) return '??';
    const palabras = String(nombre).trim().split(/\s+/);
    if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase();
    return String(nombre).substring(0, 2).toUpperCase();
}

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

/* =========================
   Setup event listeners
   ========================= */
function setupEventListeners() {
    // Botón eliminar - CORREGIDO
    const btnEliminar = document.getElementById("btnEliminar");
    if (btnEliminar) {
        btnEliminar.onclick = async function () {
            // Verificar sesión primero
            if (!usuarioActual) {
                // Re-verificar sesión por si acaso
                await verificarSesion();
                
                if (!usuarioActual) {
                    notify.warning("Debes iniciar sesión para eliminar publicaciones", "Acción no permitida");
                    return;
                }
            }

            if (!seleccionada) {
                notify.warning("Selecciona una publicación primero", "Ninguna seleccionada");
                return;
            }

            notify.confirm({
                title: "¿Eliminar publicación?",
                message: "Esta acción no se puede deshacer. ¿Deseas continuar?",
                confirmText: "Eliminar",
                cancelText: "Cancelar",
                onConfirm: async () => {
                    let id = seleccionada.getAttribute("data-id");
                    const loadingId = notify.loading("Eliminando publicación...");

                    try {
                        let r = await fetch("../Connection/eliminar_publicacion.php?id=" + id, {
                            credentials: 'same-origin'
                        });
                        let t = await r.text();
                        notify.remove(loadingId);

                        if (t.includes("OK")) {
                            notify.success("Publicación eliminada con éxito", "Éxito");
                            seleccionada = null;
                            cargarPublicaciones();
                        } else {
                            notify.error("Error al eliminar la publicación", "Error");
                        }
                    } catch (err) {
                        notify.remove(loadingId);
                        notify.error("Error de conexión al eliminar", "Error");
                        console.error(err);
                    }
                }
            });
        };
    }

    // Controles del carousel con scroll suave
    const prevDest = document.getElementById("prevDest");
    const nextDest = document.getElementById("nextDest");
    const container = document.getElementById("carouselDestacadas");

    if (prevDest && container) {
        prevDest.onclick = function () {
            container.scrollBy({
                left: -200,
                behavior: 'smooth'
            });
        };
    }
    
    if (nextDest && container) {
        nextDest.onclick = function () {
            container.scrollBy({
                left: 200,
                behavior: 'smooth'
            });
        };
    }
}

/* =========================
   toggleSection (UI)
   ========================= */
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

/* =========================
   Filtros
   ========================= */
function updateFilters() {
    const filters = document.querySelectorAll('.filter-item');
    const selectedColors = [];
    const selected = [];

    for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        const checkbox = filter.querySelector('input[type="checkbox"]');
        const checkboxCustom = filter.querySelector('.checkbox-custom');
        const label = filter.querySelector('.filter-label');
        const color = filter.getAttribute('data-color') || '';

        if (checkbox && checkbox.checked) {
            if (checkboxCustom) checkboxCustom.style.backgroundColor = color;
            if (label) label.style.color = color;
            selectedColors.push(color);
            if (label) selected.push(label.innerText.trim().toLowerCase());
        } else {
            if (checkboxCustom) checkboxCustom.style.backgroundColor = 'transparent';
            if (label) label.style.color = 'black';
        }
    }

    window.areasSelected = selected;
    updateDividerLine(selectedColors);
    aplicarFiltroActivo();
}

function updateDividerLine(colors) {
    const dividerLine = document.getElementById('dividerLine');
    if (!dividerLine) return;
    if (!colors || colors.length === 0) {
        dividerLine.style.background = 'white';
    } else if (colors.length === 1) {
        dividerLine.style.background = colors[0];
    } else {
        dividerLine.style.background = 'linear-gradient(to bottom, ' + colors.join(', ') + ')';
    }
}

/* =========================
   Cargar publicaciones mejorado
   ========================= */
async function cargarPublicaciones() {
    try {
        const r = await fetch("../Connection/listar.php", { cache: 'no-store' });
        const posts = await r.json();
        const cont = document.getElementById("publicaciones");
        if (!cont) { console.warn('No existe contenedor #publicaciones'); return; }
        cont.innerHTML = "";

        if (!posts || posts.length === 0) {
            cont.innerHTML = "<p style='text-align:center; color:#666; padding:40px;'>No hay publicaciones aún</p>";
            return;
        }

        posts.forEach(p => {
            const html = document.createElement('div');
            html.className = "card publicacion";
            html.setAttribute("data-id", p.id || '');
            html.setAttribute("data-area", (p.area || 'general').toLowerCase());
            
            // Añadir clase de área
            const areaClass = 'area-' + (p.area || 'general').toLowerCase().replace(/\s+/g, '');
            html.classList.add(areaClass);

            html.innerHTML = `
                ${p.tipo === "imagen" && p.archivo ? `<img src="../Connection/uploads/${p.archivo}" class="media">` : ""}
                ${p.tipo === "video" && p.archivo ? `<video controls src="../Connection/uploads/${p.archivo}" class="media"></video>` : ""}
                <p>${p.contenido || ''}</p>
                <small>Área: ${p.area || 'general'} • ${p.username ? "Publicado por: " + p.username : "Publicado por: Anónimo"}</small>
                <div class="votos">
                    <button class="btn-vote-up" data-id="${p.id}">⬆</button>
                    <span class="count" id="up-${p.id}">0</span>
                    <button class="btn-vote-down" data-id="${p.id}">⬇</button>
                    <span class="count" id="down-${p.id}">0</span>
                    <span style="margin-left:auto; font-size:13px; color:#666;">${p.creado || ''}</span>
                </div>
            `;
            cont.appendChild(html);
        });

        activarSeleccion();
        attachVoteButtons();
        cargarVotosParaLista(posts);
        construirCarousel(posts);
        mejorarScrollDestacadas();
        aplicarFiltroActivo();
    } catch (err) {
        console.error('Error al cargar publicaciones:', err);
        notify.error('Error al cargar publicaciones (revisa la consola).', 'Publicaciones');
    }
}

/* =========================
   Activar selección con colores
   ========================= */
function activarSeleccion() {
    const cards = document.querySelectorAll(".publicacion");
    cards.forEach(card => {
        card.onclick = function (e) {
            if (e.target && e.target.tagName === 'BUTTON') return;
            
            if (seleccionada) seleccionada.classList.remove("seleccionada");
            seleccionada = this;
            
            // Obtener área y aplicar color
            const smallText = this.querySelector('small')?.innerText || '';
            const match = smallText.match(/Área:\s*([^\s•]+)/i);
            const area = match ? match[1].toLowerCase() : 'general';
            const areaColor = getAreaColor(area);
            
            this.style.setProperty('--area-color', areaColor);
            this.classList.add("seleccionada");
        };
    });
}

/* =========================
   Botones de voto
   ========================= */
function attachVoteButtons() {
    document.querySelectorAll(".btn-vote-up").forEach(b => {
        b.onclick = async function (e) {
            e.stopPropagation();
            const id = this.dataset.id;
            try {
                const res = await fetch("../Connection/vote.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ publicacion_id: id, tipo: 'up' })
                });
                const json = await res.json();
                const upEl = document.getElementById("up-" + id);
                const downEl = document.getElementById("down-" + id);
                if (upEl) upEl.innerText = json.up;
                if (downEl) downEl.innerText = json.down;
            } catch (err) {
                console.error('Error al votar (up):', err);
                notify.error('No se pudo registrar el voto.', 'Voto');
            }
        };
    });

    document.querySelectorAll(".btn-vote-down").forEach(b => {
        b.onclick = async function (e) {
            e.stopPropagation();
            const id = this.dataset.id;
            try {
                const res = await fetch("../Connection/vote.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ publicacion_id: id, tipo: 'down' })
                });
                const json = await res.json();
                const upEl = document.getElementById("up-" + id);
                const downEl = document.getElementById("down-" + id);
                if (upEl) upEl.innerText = json.up;
                if (downEl) downEl.innerText = json.down;
            } catch (err) {
                console.error('Error al votar (down):', err);
                notify.error('No se pudo registrar el voto.', 'Voto');
            }
        };
    });
}

/* =========================
   Cargar conteos de votos
   ========================= */
async function cargarVotosParaLista(posts) {
    if (!posts || !posts.length) return;
    for (const p of posts) {
        try {
            const upRes = await fetch("../Connection/vote_count.php?publicacion_id=" + encodeURIComponent(p.id) + "&tipo=up", { cache: 'no-store' });
            const downRes = await fetch("../Connection/vote_count.php?publicacion_id=" + encodeURIComponent(p.id) + "&tipo=down", { cache: 'no-store' });
            const up = await upRes.text();
            const down = await downRes.text();
            const upEl = document.getElementById("up-" + p.id);
            const downEl = document.getElementById("down-" + p.id);
            if (upEl) upEl.innerText = up;
            if (downEl) downEl.innerText = down;
        } catch (err) {
            console.error('Error cargarVotosParaLista:', err);
        }
    }
}

/* =========================
   Construcción mejorada del carousel
   ========================= */
function construirCarousel(posts) {
    const dest = document.getElementById("carouselDestacadas");
    if (!dest) return;
    dest.innerHTML = "";
    const destacados = (posts || []).filter(p => Number(p.destacado) === 1);

    if (!destacados.length) {
        dest.innerHTML = "<em>No hay destacadas</em>";
        return;
    }

    destacados.forEach((p, idx) => {
        const div = document.createElement("div");
        div.className = "dest-item";
        div.setAttribute("data-id", p.id || '');
        div.setAttribute("data-area", (p.area || 'general').toLowerCase());
        
        const areaClass = 'area-' + (p.area || 'general').toLowerCase().replace(/\s+/g, '');
        div.classList.add(areaClass);
        
        // Generar contenido según tipo
        let contentHTML = '';
        
        if (p.tipo === 'imagen' && p.archivo) {
            contentHTML = `<img src="../Connection/uploads/${p.archivo}" alt="${p.area}">`;
        } else if (p.tipo === 'video' && p.archivo) {
            contentHTML = `<video src="../Connection/uploads/${p.archivo}" muted></video>`;
        } else {
            // Preview de texto
            const previewText = (p.contenido || 'Sin contenido').substring(0, 60) + '...';
            contentHTML = `<div class="dest-text-preview">${previewText}</div>`;
        }
        
        div.innerHTML = `
            ${contentHTML}
            <div class="dest-info">${p.area || 'general'}</div>
        `;
        
        // Click simple solo selecciona
        div.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('.dest-item').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
            
            const areaColor = getAreaColor(p.area);
            this.style.setProperty('--area-color', areaColor);
        };
        
        // Doble click para ir a la publicación
        div.ondblclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const card = document.querySelector(".publicacion[data-id='" + p.id + "']");
            if (card) {
                if (seleccionada) seleccionada.classList.remove('seleccionada');
                seleccionada = card;
                
                const areaColor = getAreaColor(p.area);
                card.style.setProperty('--area-color', areaColor);
                
                seleccionada.classList.add('seleccionada');
                seleccionada.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        };
        
        dest.appendChild(div);
    });

    if (dest.firstChild) {
        dest.firstChild.classList.add('selected');
        const firstArea = dest.firstChild.getAttribute('data-area');
        const firstColor = getAreaColor(firstArea);
        dest.firstChild.style.setProperty('--area-color', firstColor);
    }
}

/* =========================
   Mejorar scroll touch en destacadas
   ========================= */
function mejorarScrollDestacadas() {
    const container = document.getElementById('carouselDestacadas');
    if (!container) return;
    
    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;
    
    container.addEventListener('touchstart', (e) => {
        isScrolling = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
        if (!isScrolling) return;
        
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    }, { passive: true });
    
    container.addEventListener('touchend', () => {
        isScrolling = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mousedown', (e) => {
        isScrolling = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
    });
    
    container.addEventListener('mouseleave', () => {
        isScrolling = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mouseup', () => {
        isScrolling = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });
    
    container.style.cursor = 'grab';
}

/* =========================
   Aplicar filtro activo
   ========================= */
function aplicarFiltroActivo() {
    const cards = document.querySelectorAll(".publicacion");
    if (!cards) return;

    if (!window.areasSelected || window.areasSelected.length === 0) {
        cards.forEach(c => c.style.display = "");
        return;
    }

    cards.forEach(c => {
        const smallText = c.querySelector('small')?.innerText || '';
        const m = smallText.match(/Área:\s*([^\s•]+)/i);
        const a = m ? m[1].toLowerCase() : '';
        if (window.areasSelected.includes(a)) {
            c.style.display = "";
        } else {
            c.style.display = "none";
        }
    });
}

/* =========================
   Refrescar todo
   ========================= */
window.refrescarTodo = function () {
    updateFilters();
    cargarPublicaciones();
};

/* =========================
   Mostrar info del usuario
   ========================= */
function mostrarInfoUsuario(user) {
    const userAvatar = document.getElementById('userAvatar');
    const iniciales = obtenerIniciales(user.nombre || user.username);
    const color = generarColor(user.nombre || user.username);
    
    userAvatar.innerHTML = `
        <div class="avatar-circle" style="background: ${color}">
            ${iniciales}
        </div>
        <div class="avatar-info">
            <strong>${user.nombre || user.username}</strong>
            <small>${user.rol === 'admin' ? '👑 Administrador' : '✏️ Editor'}</small>
        </div>
    `;
}