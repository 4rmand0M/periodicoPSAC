/* —————————————
   Fallback mínimo para `notify`
   Si tienes notification_system.js cargado este bloque NO hará nada.
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
            // devuelve id para que remove funcione
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
   Variables globales
   ========================= */
let usuarioActual = null;
let seleccionada = null;
let carouselIndex = 0;
window.areasSelected = []; // array de áreas seleccionadas

/* =========================
   Inicialización DOM
   ========================= */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOMContentLoaded');
    await verificarSesion();
    setupEventListeners();
    // Attach listeners to filter checkboxes (si existen)
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
        const response = await fetch('../Connection/check_session.php', { cache: 'no-store' });
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

    // Estilo para convertirlo en botón de salir
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

    // SOLO texto de salir
    btnIngresar.innerHTML = "🚪 Salir";

    // Acción para cerrar sesión
    btnIngresar.onclick = () => {
        window.location.href = "../Connection/logout.php";
    };
}


/* =========================
   Mostrar / ocultar controles según rol
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

    // Botón eliminar
    const btnEliminar = document.getElementById("btnEliminar");

    if (btnEliminar) {

        btnEliminar.onclick = async function () {
    if (!usuarioActual) {
        notify.warning("Debes iniciar sesión para eliminar publicaciones", "Acción no permitida");
        return;
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
                let r = await fetch("../Connection/eliminar_publicacion.php?id=" + id);
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
}
}


// *** activar eventos ***
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});


    // Controles del carousel (prev / next)
    const prevDest = document.getElementById("prevDest");
    const nextDest = document.getElementById("nextDest");

    if (prevDest) {
        prevDest.onclick = function () {
            const items = document.querySelectorAll('.dest-item');
            if (!items.length) return;
            carouselIndex = Math.max(0, carouselIndex - 1);
            items[carouselIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
        };
    }
    if (nextDest) {
        nextDest.onclick = function () {
            const items = document.querySelectorAll('.dest-item');
            if (!items.length) return;
            carouselIndex = Math.min(items.length - 1, carouselIndex + 1);
            items[carouselIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
        };
    }

    // Toggle sections (si hay botones que lo llamen, se usa desde el HTML)
    // No añadimos listener aquí porque toggleSection se invoca desde HTML con onclick
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
   Cargar publicaciones (lista)
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
        aplicarFiltroActivo();
    } catch (err) {
        console.error('Error al cargar publicaciones:', err);
        notify.error('Error al cargar publicaciones (revisa la consola).', 'Publicaciones');
    }
}

/* =========================
   Selección de tarjeta
   ========================= */
function activarSeleccion() {
    const cards = document.querySelectorAll(".publicacion");
    cards.forEach(card => {
        card.onclick = function (e) {
            if (e.target && e.target.tagName === 'BUTTON') return;
            if (seleccionada) seleccionada.classList.remove("seleccionada");
            seleccionada = this;
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
   Cargar conteos de votos por lista
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
   Carousel de destacadas
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
        div.innerHTML = `
            ${p.tipo === 'imagen' && p.archivo ? `<img src="../Connection/uploads/${p.archivo}" alt="">` :
              p.tipo === 'video' && p.archivo ? `<video src="../Connection/uploads/${p.archivo}" muted></video>` :
              `<div style="height:90px; display:flex; align-items:center; justify-content:center; background:#f3f4f6;">TEXTO</div>`}
            <div style="padding-top:6px; font-weight:600;">${p.area || 'general'}</div>
        `;
        div.onclick = function () {
            document.querySelectorAll('.dest-item').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');

            const card = document.querySelector(".publicacion[data-id='" + p.id + "']");
            if (card) {
                if (seleccionada) seleccionada.classList.remove('seleccionada');
                seleccionada = card;
                seleccionada.classList.add('seleccionada');
                seleccionada.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        };
        dest.appendChild(div);
    });

    if (dest.firstChild) dest.firstChild.classList.add('selected');
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
   Refrescar todo (helper público)
   ========================= */
window.refrescarTodo = function () {
    updateFilters();
    cargarPublicaciones();
};

// Mostrar info del usuario en el sidebar
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

// Obtener iniciales del nombre
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
        return palabras[0][0] + palabras[1][0];
    }
    return nombre.substring(0, 2);
}

// Generar color basado en el nombre
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