// scrypt_subir.js - CON DETECCIÓN AUTOMÁTICA DE ARCHIVOS

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

// DETECCIÓN AUTOMÁTICA DE TIPO DE ARCHIVO
document.getElementById('archivoPublicar').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('previewContainer');
    const tipoSelect = document.getElementById('tipoPublicar');
    
    if (file) {
        // Detectar tipo automáticamente
        if (file.type.startsWith('image/')) {
            tipoSelect.value = 'imagen';
            notify.info('Tipo detectado: Imagen', 'Detección automática');
            
            // Preview de imagen
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
        } else if (file.type.startsWith('video/')) {
            tipoSelect.value = 'video';
            notify.info('Tipo detectado: Video', 'Detección automática');
            
            // Preview de video
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<video controls src="${event.target.result}"></video>`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
        } else {
            notify.warning('Tipo de archivo no soportado. Selecciona una imagen o video.', 'Archivo no válido');
            tipoSelect.value = 'texto';
            preview.style.display = 'none';
            e.target.value = '';
        }
    } else {
        preview.style.display = 'none';
    }
});

// Si se cambia manualmente el tipo, ocultar preview si es "texto"
document.getElementById('tipoPublicar').addEventListener('change', function(e) {
    const preview = document.getElementById('previewContainer');
    const archivoInput = document.getElementById('archivoPublicar');
    
    if (e.target.value === 'texto') {
        preview.style.display = 'none';
        archivoInput.value = '';
        notify.info('Modo texto seleccionado. No se requiere archivo.', 'Modo texto');
    }
});

// Enviar formulario con validación
document.getElementById('formPublicar').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Subiendo...';
    
    const loadingId = notify.loading('Procesando publicación...');
    
    try {
        const formData = new FormData(this);
        
        // Validación: si es imagen o video, debe haber archivo
        const tipo = document.getElementById('tipoPublicar').value;
        const archivo = document.getElementById('archivoPublicar').files[0];
        
        if ((tipo === 'imagen' || tipo === 'video') && !archivo) {
            notify.remove(loadingId);
            notify.warning('Debes seleccionar un archivo para este tipo de publicación', 'Archivo requerido');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        const response = await fetch('../Connection/subir_publicacion.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.text();
        console.log('Respuesta:', result);
        
        notify.remove(loadingId);
        
        if (result.includes('OK')) {
            notify.success('Publicación subida exitosamente', 'Éxito');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            notify.error('Error: ' + result, 'Error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        notify.remove(loadingId);
        notify.error('Error de conexión: ' + error, 'Error');
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});