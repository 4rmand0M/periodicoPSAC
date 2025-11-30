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

        // Preview de archivo
        document.getElementById('archivoPublicar').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('previewContainer');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (file.type.startsWith('image/')) {
                        preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                    } else if (file.type.startsWith('video/')) {
                        preview.innerHTML = `<video controls src="${event.target.result}"></video>`;
                    }
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
            }
        });

        // Enviar formulario
        document.getElementById('formPublicar').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subiendo...';
            
            try {
                const formData = new FormData(this);
                const response = await fetch('../Connection/subir_publicacion.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.text();
                console.log('Respuesta PHP:', result); // <-- Depuración
                if (result.includes('OK')) {
                    alert('✓ Publicación subida exitosamente');
                    window.location.href = 'index.html';
                } else {
                    alert('Error: ' + result);
                    submitBtn.disabled = false;
                    submitBtn.textContent = '✓ Publicar';
                }
            } catch (error) {
                alert('Error de conexión: ' + error);
                submitBtn.disabled = false;
                submitBtn.textContent = '✓ Publicar';
            }
        });