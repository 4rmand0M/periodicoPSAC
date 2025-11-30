let usuarioActual = null;
let seleccionada = null;
let carouselIndex = 0;

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOMContentLoaded disparado');
    await verificarSesion();
    console.log('✅ Sesión verificada');
    setupEventListeners();
    updateFilters();
    cargarPublicaciones();
});

// Verificar si hay sesión activa
async function verificarSesion() {
    try {
        console.log('🔍 Verificando sesión...');
        const response = await fetch('../Connection/check_session.php');
        const data = await response.json();
        console.log('📊 Respuesta de check_session:', data);
        
        if (data.logged_in) {
            console.log('✅ Usuario logueado:', data.user);
            usuarioActual = data.user;
            mostrarUsuarioLogueado();
            mostrarControlesEditor();
        } else {
            console.log('❌ Sin sesión activa');
            ocultarControlesEditor();
        }
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
    }
}

// Mostrar info del usuario logueado
function mostrarUsuarioLogueado() {
    const btnIngresar = document.querySelector('.ingresar-btn');
    const iniciales = obtenerIniciales(usuarioActual.nombre || usuarioActual.username);
    const color = generarColor(usuarioActual.nombre || usuarioActual.username);
    
    btnIngresar.style.background = color;
    btnIngresar.style.color = 'white';
    btnIngresar.textContent = ''; // Limpiar texto anterior
    btnIngresar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 35px; height: 35px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${color};">
                ${iniciales}
            </div>
            <div style="text-align: left; line-height: 1.2;">
                <div style="font-size: 14px; font-weight: bold;">${usuarioActual.nombre || usuarioActual.username}</div>
                <div style="font-size: 11px; opacity: 0.8;">${usuarioActual.rol === 'admin' ? '👑 Admin' : '✏️ Editor'}</div>
            </div>
        </div>
    `;
    // Remover evento onclick anterior y agregar nuevo
    btnIngresar.onclick = function() {
        if (confirm('¿Cerrar sesión?')) {
            window.location.href = '../Connection/logout.php';
        }
    };
}

// Mostrar/ocultar controles según permisos
function mostrarControlesEditor() {
    console.log('🔓 mostrarControlesEditor llamado');
    // Buscar las secciones completas por ID
    const sectionPublicar = document.getElementById('section-publicar');
    const sectionAdmtools = document.getElementById('section-admtools');
    
    console.log('🔍 Buscando elementos:');
    console.log('   section-publicar:', sectionPublicar);
    console.log('   section-admtools:', sectionAdmtools);
    
    if (sectionPublicar) {
        sectionPublicar.style.display = 'block';
        console.log('✅ section-publicar mostrada');
    }
    
    // Mostrar ADM tools solo si es admin
    if (usuarioActual && usuarioActual.rol === 'admin') {
        console.log('👑 Usuario es admin, mostrando ADM tools');
        if (sectionAdmtools) {
            sectionAdmtools.style.display = 'block';
            console.log('✅ section-admtools mostrada');
        }
    } else {
        console.log('✏️ Usuario es editor, ocultando ADM tools');
        if (sectionAdmtools) {
            sectionAdmtools.style.display = 'none';
            console.log('❌ section-admtools oculta');
        }
    }
}

function ocultarControlesEditor() {
    console.log('🔒 ocultarControlesEditor llamado');
    const sectionPublicar = document.getElementById('section-publicar');
    const sectionAdmtools = document.getElementById('section-admtools');
    
    if (sectionPublicar) {
        sectionPublicar.style.display = 'none';
        console.log('❌ section-publicar oculta');
    }
    if (sectionAdmtools) {
        sectionAdmtools.style.display = 'none';
        console.log('❌ section-admtools oculta');
    }
}

// Funciones auxiliares
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
        return palabras[0][0] + palabras[1][0];
    }
    return nombre.substring(0, 2);
}

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

// Setup event listeners
function setupEventListeners() {
    document.getElementById("btnEliminar").onclick = async function() {
        if (!usuarioActual) {
            alert("Debes iniciar sesión para eliminar publicaciones");
            return;
        }
        
        if (!seleccionada) { 
            alert("Selecciona una publicación primero"); 
            return; 
        }
        
        if (!confirm("¿Eliminar publicación?")) return;
        
        let id = seleccionada.getAttribute("data-id");
        let r = await fetch("../Connection/eliminar_publicacion.php?id=" + id);
        let t = await r.text();
        
        if (t.includes("OK")) { 
            alert("Eliminada correctamente"); 
            seleccionada = null;
            cargarPublicaciones(); 
        } else {
            alert("Error al eliminar");
        }
    };
    
    document.getElementById("prevDest").onclick = function() {
        const items = document.querySelectorAll('.dest-item');
        if (!items.length) return;
        carouselIndex = Math.max(0, carouselIndex - 1);
        items[carouselIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
    };
    
    document.getElementById("nextDest").onclick = function() {
        const items = document.querySelectorAll('.dest-item');
        if (!items.length) return;
        carouselIndex = Math.min(items.length - 1, carouselIndex + 1);
        items[carouselIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
    };
}


function toggleSection(sectionId) {
    var section = document.getElementById(sectionId);
    var arrow = document.getElementById('arrow-' + sectionId);
    if (section.className.indexOf('collapsed') > -1) {
        section.className = 'section-content';
        arrow.className = 'arrow rotated';
    } else {
        section.className = 'section-content collapsed';
        arrow.className = 'arrow';
    }
}

function updateFilters() {
    var filters = document.querySelectorAll('.filter-item');
    var selectedColors = [];
    var selected = [];
    
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i];
        var checkbox = filter.querySelector('input[type="checkbox"]');
        var checkboxCustom = filter.querySelector('.checkbox-custom');
        var label = filter.querySelector('.filter-label');
        var color = filter.getAttribute('data-color');
        
        if (checkbox.checked) {
            checkboxCustom.style.backgroundColor = color;
            label.style.color = color;
            selectedColors.push(color);
            selected.push(label.innerText.trim().toLowerCase());
        } else {
            checkboxCustom.style.backgroundColor = 'transparent';
            label.style.color = 'black';
        }
    }
    
    window.areasSelected = selected;
    updateDividerLine(selectedColors);
    aplicarFiltroActivo();
}

function updateDividerLine(colors) {
    var dividerLine = document.getElementById('dividerLine');
    if (colors.length === 0) {
        dividerLine.style.background = 'white';
    } else if (colors.length === 1) {
        dividerLine.style.background = colors[0];
    } else {
        dividerLine.style.background = 'linear-gradient(to bottom, ' + colors.join(', ') + ')';
    }
}

async function cargarPublicaciones() {
    try {
        let r = await fetch("../Connection/listar.php");
        let posts = await r.json();
        let cont = document.getElementById("publicaciones");
        cont.innerHTML = "";
        
        if (posts.length === 0) {
            cont.innerHTML = "<p style='text-align:center; color:#666; padding:40px;'>No hay publicaciones aún</p>";
            return;
        }
        
        posts.forEach(p => {
            let html = document.createElement('div');
            html.className = "card publicacion";
            html.setAttribute("data-id", p.id);
            html.innerHTML = `
                ${p.tipo === "imagen" && p.archivo ? `<img src="../Connection/uploads/${p.archivo}" class="media">` : ""}
                ${p.tipo === "video" && p.archivo ? `<video controls src="../Connection/uploads/${p.archivo}" class="media"></video>` : ""}
                <p>${p.contenido || ''}</p>
                <small>Área: ${p.area} • ${p.username ? "Publicado por: " + p.username : "Publicado por: Anónimo"}</small>
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
    } catch (error) {
        console.error("Error al cargar publicaciones:", error);
    }
}

function activarSeleccion() {
    let cards = document.querySelectorAll(".publicacion");
    cards.forEach(card => {
        card.onclick = function(e) {
            if (e.target.tagName === 'BUTTON') return;
            if (seleccionada) seleccionada.classList.remove("seleccionada");
            seleccionada = this;
            this.classList.add("seleccionada");
        }
    });
}

function attachVoteButtons() {
    document.querySelectorAll(".btn-vote-up").forEach(b => {
        b.onclick = async function(e) {
            e.stopPropagation();
            let id = this.dataset.id;
            try {
                let res = await fetch("../Connection/vote.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ publicacion_id: id, tipo: 'up' })
                });
                let json = await res.json();
                document.getElementById("up-" + id).innerText = json.up;
                document.getElementById("down-" + id).innerText = json.down;
            } catch (error) {
                console.error("Error al votar:", error);
            }
        }
    });
    
    document.querySelectorAll(".btn-vote-down").forEach(b => {
        b.onclick = async function(e) {
            e.stopPropagation();
            let id = this.dataset.id;
            try {
                let res = await fetch("../Connection/vote.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ publicacion_id: id, tipo: 'down' })
                });
                let json = await res.json();
                document.getElementById("up-" + id).innerText = json.up;
                document.getElementById("down-" + id).innerText = json.down;
            } catch (error) {
                console.error("Error al votar:", error);
            }
        }
    });
}

async function cargarVotosParaLista(posts) {
    for (let p of posts) {
        try {
            let upRes = await fetch("../Connection/vote_count.php?publicacion_id=" + p.id + "&tipo=up");
            let downRes = await fetch("../Connection/vote_count.php?publicacion_id=" + p.id + "&tipo=down");
            let up = await upRes.text();
            let down = await downRes.text();
            document.getElementById("up-" + p.id).innerText = up;
            document.getElementById("down-" + p.id).innerText = down;
        } catch (error) {
            console.error("Error al cargar votos:", error);
        }
    }
}

function construirCarousel(posts) {
    const dest = document.getElementById("carouselDestacadas");
    dest.innerHTML = "";
    let destacados = posts.filter(p => p.destacado == 1);
    
    if (destacados.length === 0) { 
        dest.innerHTML = "<em>No hay destacadas</em>"; 
        return; 
    }
    
    destacados.forEach((p, idx) => {
        let div = document.createElement("div");
        div.className = "dest-item";
        div.setAttribute("data-id", p.id);
        div.innerHTML = `
            ${p.tipo === 'imagen' && p.archivo ? `<img src="../Connection/uploads/${p.archivo}">` : 
              p.tipo === 'video' && p.archivo ? `<video src="../Connection/uploads/${p.archivo}" muted></video>` : 
              `<div style="height:90px; display:flex; align-items:center; justify-content:center; background:#f3f4f6;">TEXTO</div>`}
            <div style="padding-top:6px; font-weight:600;">${p.area}</div>
        `;
        
        div.onclick = function() {
            document.querySelectorAll('.dest-item').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
            
            let card = document.querySelector(".publicacion[data-id='" + p.id + "']");
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

function aplicarFiltroActivo() {
    let cards = document.querySelectorAll(".publicacion");
    if (!cards) return;
    
    if (!window.areasSelected || window.areasSelected.length == 0) {
        cards.forEach(c => c.style.display = "");
        return;
    }
    
    cards.forEach(c => {
        let area = c.querySelector('small')?.innerText || '';
        let m = area.match(/Área:\s*([^\s•]+)/i);
        let a = m ? m[1].toLowerCase() : '';
        
        if (window.areasSelected.includes(a)) {
            c.style.display = "";
        } else {
            c.style.display = "none";
        }
    });
}