// Verificar sesión y permisos
async function verificarSesion() {
    try {
        const response = await fetch('../Connection/check_session.php');
        const data = await response.json();
        
        if (!data.logged_in) {
            window.location.href = 'login.html';
            return false;
        }
        
        if (data.user.rol !== 'admin') {
            try { notify.error('Acceso denegado. Solo administradores pueden acceder a esta página.', 'Acceso denegado'); } catch (e) { alert('Acceso denegado. Solo administradores pueden acceder a esta página.'); }
            window.location.href = 'index.html';
            return false;
        }
        
        mostrarInfoUsuario(data.user);
        return true;
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        window.location.href = 'login.html';
        return false;
    }
}

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
            <small>${user.rol === 'admin' ? '👑 Administrador' : user.rol === 'editor' ? '✏️ Editor' : '👤 Usuario'}</small>
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

// Cargar lista de usuarios
async function cargarUsuarios() {
    try {
        console.log('🔄 Iniciando carga de usuarios...');
        const response = await fetch('../Connection/usuarios_crud.php?action=listar');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📩 Respuesta recibida:', data);
        
        if (data.success) {
            window.todosLosUsuarios = data.usuarios;
            actualizarContadores(data.usuarios);
            mostrarUsuarios(data.usuarios);
        } else {
            console.error('❌ Error en respuesta:', data.message);
            try { notify.error('Error al cargar usuarios: ' + data.message, 'Error'); } catch (e) { alert('Error al cargar usuarios: ' + data.message); }
        }
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
        try { notify.error('Error de conexión al cargar usuarios:\n' + error.message, 'Error de conexión'); } catch (e) { alert('Error de conexión al cargar usuarios:\n' + error.message); }
    }
}

// Actualizar contadores
function actualizarContadores(usuarios) {
    const admins = usuarios.filter(u => u.rol === 'admin').length;
    const editores = usuarios.filter(u => u.rol === 'editor').length;
    const usuariosCount = usuarios.filter(u => u.rol === 'usuario' || !u.rol).length;
    
    document.getElementById('countTodos').textContent = usuarios.length;
    document.getElementById('countAdmin').textContent = admins;
    document.getElementById('countEditor').textContent = editores;
    document.getElementById('countUsuario').textContent = usuariosCount;
}

// Filtrar usuarios
function filtrarUsuarios(tipo) {
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter' + tipo.charAt(0).toUpperCase() + tipo.slice(1)).classList.add('active');
    
    // Filtrar
    let filtrados = window.todosLosUsuarios;
    if (tipo === 'admin') {
        filtrados = window.todosLosUsuarios.filter(u => u.rol === 'admin');
    } else if (tipo === 'editor') {
        filtrados = window.todosLosUsuarios.filter(u => u.rol === 'editor');
    } else if (tipo === 'usuario') {
        filtrados = window.todosLosUsuarios.filter(u => u.rol === 'usuario' || !u.rol);
    }
    
    mostrarUsuarios(filtrados);
}

// Mostrar usuarios en la interfaz
function mostrarUsuarios(usuarios) {
    const lista = document.getElementById('listaUsuarios');
    
    if (usuarios.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color:#6b7280; padding:40px;">No hay usuarios registrados</p>';
        return;
    }
    
    lista.innerHTML = usuarios.map(user => {
        const iniciales = obtenerIniciales(user.nombre || user.username);
        const color = generarColor(user.nombre || user.username);
        let badgeClass = 'badge-usuario';
        let badgeText = '👤 Usuario';
        
        if (user.rol === 'admin') {
            badgeClass = 'badge-admin';
            badgeText = '👑 Administrador';
        } else if (user.rol === 'editor') {
            badgeClass = 'badge-editor';
            badgeText = '✏️ Editor';
        }
        
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-card-header">
                    <div class="user-avatar" style="background: ${color}">
                        ${iniciales}
                    </div>
                    <div class="user-info">
                        <h3>${user.nombre || user.username}</h3>
                        <p>@${user.username}</p>
                        <span class="user-badge ${badgeClass}">${badgeText}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editarUsuario(${user.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="eliminarUsuario(${user.id}, '${user.username}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal
let editando = false;

function abrirModal(editar = false) {
    console.log('🔓 Abriendo modal, editando:', editar);
    editando = editar;
    const modal = document.getElementById('modalUsuario');
    const title = document.getElementById('modalTitle');
    const passwordInput = document.getElementById('password');
    const passwordHint = document.querySelector('.form-hint');
    
            if (editar) {
        title.textContent = 'Editar Usuario';
        passwordInput.removeAttribute('required');
        passwordHint.style.display = 'block';
    } else {
        title.textContent = 'Nuevo Usuario';
        passwordInput.setAttribute('required', 'required');
        passwordHint.style.display = 'none';
        document.getElementById('formUsuario').reset();
        document.getElementById('usuarioId').value = '';
    }
    
    console.log('✅ Modal abierto, campos inicializados');
    modal.style.display = 'block';
    setupValidation();
}

// Configurar validación en tiempo real
function setupValidation() {
    const nombreInput = document.getElementById('nombre');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // Validar nombre
    nombreInput.addEventListener('input', function() {
        const error = document.getElementById('nombreError');
        if (this.value.length > 0 && this.value.length < 3) {
            this.classList.add('error');
            this.classList.remove('success');
            error.classList.add('show');
        } else if (this.value.length >= 3) {
            this.classList.remove('error');
            this.classList.add('success');
            error.classList.remove('show');
        } else {
            this.classList.remove('error', 'success');
            error.classList.remove('show');
        }
    });
    
    // Validar username
    usernameInput.addEventListener('input', function() {
        const error = document.getElementById('usernameError');
        const pattern = /^[a-zA-Z0-9_]+$/;
        if (this.value.length > 0 && (this.value.length < 3 || !pattern.test(this.value))) {
            this.classList.add('error');
            this.classList.remove('success');
            error.classList.add('show');
        } else if (this.value.length >= 3 && pattern.test(this.value)) {
            this.classList.remove('error');
            this.classList.add('success');
            error.classList.remove('show');
        } else {
            this.classList.remove('error', 'success');
            error.classList.remove('show');
        }
    });
    
    // Validar contraseña con medidor de fuerza
    passwordInput.addEventListener('input', function() {
        const error = document.getElementById('passwordError');
        const strength = document.getElementById('passwordStrength');
        const value = this.value;
        
        if (editando && value.length === 0) {
            this.classList.remove('error', 'success');
            error.classList.remove('show');
            strength.style.display = 'none';
            return;
        }
        
        if (value.length > 0 && value.length < 6) {
            this.classList.add('error');
            this.classList.remove('success');
            error.classList.add('show');
            strength.style.display = 'none';
        } else if (value.length >= 6) {
            this.classList.remove('error');
            this.classList.add('success');
            error.classList.remove('show');
            
            // Calcular fuerza
            let score = 0;
            if (value.length >= 8) score++;
            if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
            if (/\d/.test(value)) score++;
            if (/[^a-zA-Z0-9]/.test(value)) score++;
            
            strength.style.display = 'block';
            if (score <= 1) {
                strength.textContent = '🔴 Contraseña débil';
                strength.className = 'password-strength weak';
            } else if (score <= 2) {
                strength.textContent = '🟡 Contraseña media';
                strength.className = 'password-strength medium';
            } else {
                strength.textContent = '🟢 Contraseña fuerte';
                strength.className = 'password-strength strong';
            }
        } else {
            this.classList.remove('error', 'success');
            error.classList.remove('show');
            strength.style.display = 'none';
        }
    });
}

function cerrarModal() {
    const modal = document.getElementById('modalUsuario');
    modal.style.display = 'none';
    document.getElementById('formUsuario').reset();
}

// Inicializar - Se ejecuta cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOMContentLoaded - Inicializando eventos');
    
    const sesionValida = await verificarSesion();
    if (sesionValida) {
        cargarUsuarios();
    }
    
    // Crear usuario
    const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
    if (btnNuevoUsuario) {
        btnNuevoUsuario.addEventListener('click', () => {
            console.log('➕ Botón "Nuevo Usuario" clicked');
            abrirModal(false);
        });
    }

    // Conectar botón de cerrar sesión si existe
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            if (typeof AuthGuard !== 'undefined' && AuthGuard.logout) {
                AuthGuard.logout();
            } else {
                window.location.href = '../Connection/logout.php';
            }
        });
    }

    // Cerrar modal al hacer clic en X o fuera del modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModal);
    }
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modalUsuario');
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Guardar usuario (crear o editar)
    const formUsuario = document.getElementById('formUsuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Submit disparado');
            
            const submitBtn = this.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Guardando...';
            
            const formData = new FormData(this);
            const action = editando ? 'editar' : 'crear';
            formData.append('action', action);
            
            console.log('🔍 Datos del formulario:', {
                action: action,
                nombre: formData.get('nombre'),
                username: formData.get('username'),
                password: formData.get('password') ? '***' : '',
                rol: formData.get('rol'),
                id: formData.get('id')
            });
            
            // Validaciones del lado del cliente
            const password = formData.get('password');
            const username = formData.get('username');
            
            if (!editando && password && password.length < 6) {
                try { notify.warning('La contraseña debe tener al menos 6 caracteres', 'Validación'); } catch (e) { alert('⚠️ La contraseña debe tener al menos 6 caracteres'); }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            if (username && username.length < 3) {
                try { notify.warning('El usuario debe tener al menos 3 caracteres', 'Validación'); } catch (e) { alert('⚠️ El usuario debe tener al menos 3 caracteres'); }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            // Si estamos editando y la contraseña está vacía, no la enviamos
            if (editando && !password) {
                formData.delete('password');
            }
            
            try {
                console.log('📤 Enviando a la API...');
                const response = await fetch('../Connection/usuarios_crud.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                console.log('📥 Respuesta:', result);
                
                if (result.success) {
                    // Animación de éxito
                        submitBtn.textContent = '✅ ¡Guardado!';
                        submitBtn.style.background = '#22c55e';
                        try { notify.success('Usuario guardado correctamente', 'Éxito'); } catch (e) { /* ignore */ }
                    
                    setTimeout(() => {
                        cerrarModal();
                        cargarUsuarios();
                    }, 800);
                } else {
                    try { notify.error(result.message, 'Error'); } catch (e) { alert('❌ ' + result.message); }
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error('❌ Error:', error);
                try { notify.error('Error de conexión', 'Error'); } catch (e) { alert('❌ Error de conexión'); }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Editar usuario
async function editarUsuario(id) {
    try {
        const response = await fetch(`../Connection/usuarios_crud.php?action=obtener&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const user = data.usuario;
            document.getElementById('usuarioId').value = user.id;
            document.getElementById('nombre').value = user.nombre || '';
            document.getElementById('username').value = user.username;
            document.getElementById('password').value = '';
            document.getElementById('rol').value = user.rol;
            
            abrirModal(true);
        } else {
            try { notify.error('Error al cargar usuario', 'Error'); } catch (e) { alert('Error al cargar usuario'); }
        }
    } catch (error) {
        console.error('Error:', error);
        try { notify.error('Error de conexión', 'Error'); } catch (e) { alert('Error de conexión'); }
    }
}

// Eliminar usuario
async function eliminarUsuario(id, username) {
    // Confirmación mejorada usando notify.confirm
    notify.confirm({
        title: '⚠️ ELIMINAR USUARIO',
        message: `¿Estás seguro de eliminar a "${username}"?\nEsta acción NO se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
            try {
                const response = await fetch(`../Connection/usuarios_crud.php?action=eliminar&id=${id}`);
                const result = await response.json();

                if (result.success) {
                    const card = document.querySelector(`[data-user-id="${id}"]`);
                    if (card) {
                        card.style.animation = 'fadeOutDown 0.3s ease-out';
                        setTimeout(() => {
                            cargarUsuarios();
                            try { notify.success('Usuario eliminado exitosamente', 'Eliminado'); } catch (e) { alert('✅ Usuario eliminado exitosamente'); }
                        }, 300);
                    } else {
                        cargarUsuarios();
                        try { notify.success(result.message, 'Eliminado'); } catch (e) { alert('✅ ' + result.message); }
                    }
                } else {
                    try { notify.error(result.message, 'Error'); } catch (e) { alert('❌ ' + result.message); }
                }
            } catch (error) {
                console.error('Error:', error);
                try { notify.error('Error de conexión', 'Error'); } catch (e) { alert('❌ Error de conexión'); }
            }
        }
    });
}