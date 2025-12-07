// Arrays para almacenar archivos
let archivosPrincipales = [];
let archivosGaleria = [];

// Preview de imagen/video principal
document.getElementById('imagenPrincipal').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('previewPrincipal');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `<img src="${event.target.result}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`;
            } else if (file.type.startsWith('video/')) {
                preview.innerHTML = `<video controls src="${event.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 8px;"></video>`;
            }
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
});

// Preview de galería adicional
document.getElementById('galeriaAdicional').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    const preview = document.getElementById('galeriaPreview');
    
    archivosGaleria = [...archivosGaleria, ...files];
    
    actualizarGaleriaPreview();
});

function actualizarGaleriaPreview() {
    const preview = document.getElementById('galeriaPreview');
    preview.innerHTML = '';
    
    archivosGaleria.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const div = document.createElement('div');
            div.className = 'galeria-item';
            
            if (file.type.startsWith('image/')) {
                div.innerHTML = `
                    <img src="${event.target.result}" alt="Galería ${index + 1}">
                    <button type="button" class="galeria-item-remove" onclick="eliminarDeGaleria(${index})">✕</button>
                `;
            } else if (file.type.startsWith('video/')) {
                div.innerHTML = `
                    <video src="${event.target.result}"></video>
                    <button type="button" class="galeria-item-remove" onclick="eliminarDeGaleria(${index})">✕</button>
                `;
            }
            
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

function eliminarDeGaleria(index) {
    archivosGaleria.splice(index, 1);
    actualizarGaleriaPreview();
    notify.info('Archivo eliminado de la galería', 'Galería');
}

// Enviar formulario
document.getElementById('formCrearNoticia').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Publicando...';
    
    const loadingId = notify.loading('Subiendo noticia y archivos...');
    
    try {
        const formData = new FormData();
        
        // Datos del formulario
        formData.append('titulo', document.getElementById('titulo').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('contenido', document.getElementById('contenido').value);
        formData.append('categoria', document.getElementById('categoria').value);
        
        // Archivo principal
        const imagenPrincipal = document.getElementById('imagenPrincipal').files[0];
        if (imagenPrincipal) {
            formData.append('imagen_principal', imagenPrincipal);
        }
        
        // Galería adicional
        archivosGaleria.forEach((file, index) => {
            formData.append(`galeria_${index}`, file);
        });
        formData.append('galeria_count', archivosGaleria.length);
        
        const response = await fetch('../Connection/crear_noticia.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        notify.remove(loadingId);
        
        if (result.success) {
            notify.success('Noticia publicada exitosamente', 'Éxito');
            
            setTimeout(() => {
                window.location.href = 'noticias.html';
            }, 1500);
        } else {
            notify.error(result.message || 'Error al publicar la noticia', 'Error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        notify.remove(loadingId);
        notify.error('Error de conexión al publicar la noticia', 'Error');
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Validación de descripción (máximo 200 caracteres)
document.getElementById('descripcion').addEventListener('input', function() {
    if (this.value.length > 200) {
        this.value = this.value.substring(0, 200);
        notify.warning('La descripción no puede exceder 200 caracteres', 'Límite alcanzado');
    }
});