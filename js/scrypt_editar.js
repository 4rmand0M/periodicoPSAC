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

        // Cargar lista de publicaciones
        async function cargarPublicaciones() {
            try {
                const response = await fetch('../Connection/listar.php');
                const publicaciones = await response.json();
                const lista = document.getElementById('publicacionesList');
                
                if (publicaciones.length === 0) {
                    lista.innerHTML = '<p style="text-align:center; color:#666;">No hay publicaciones disponibles</p>';
                    return;
                }
                
                lista.innerHTML = '';
                publicaciones.forEach(pub => {
                    const item = document.createElement('div');
                    item.className = 'publicacion-item';
                    item.setAttribute('data-id', pub.id);
                    item.innerHTML = `
                        <h3>📄 ${pub.area} - ID: ${pub.id}</h3>
                        <p>${pub.contenido ? pub.contenido.substring(0, 100) + '...' : 'Sin contenido'}</p>
                        <small style="color:#9ca3af;">Tipo: ${pub.tipo} • ${pub.destacado == 1 ? '⭐ Destacada' : ''}</small>
                    `;
                    
                    item.onclick = function() {
                        document.querySelectorAll('.publicacion-item').forEach(i => i.classList.remove('selected'));
                        this.classList.add('selected');
                        cargarDatosEdicion(pub.id);
                    };
                    
                    lista.appendChild(item);
                });
            } catch (error) {
                console.error('Error al cargar publicaciones:', error);
            }
        }

        // Cargar datos de la publicación seleccionada
        async function cargarDatosEdicion(id) {
            try {
                const response = await fetch(`../Connection/obtener_publicacion.php?id=${id}`);
                const data = await response.json();
                
                document.getElementById('edit_id').value = data.id;
                document.getElementById('edit_contenido').value = data.contenido || '';
                document.getElementById('edit_area').value = data.area;
                document.getElementById('edit_destacado').checked = data.destacado == 1;
                
                // Mostrar archivo actual
                const currentFile = document.getElementById('currentFile');
                if (data.archivo) {
                    currentFile.innerHTML = `Archivo actual: <strong>${data.archivo}</strong>`;
                    currentFile.style.display = 'block';
                } else {
                    currentFile.style.display = 'none';
                }
                
                document.getElementById('formEditar').style.display = 'block';
                document.getElementById('formEditar').scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                alert('Error al cargar los datos: ' + error);
            }
        }

        // Preview de nuevo archivo
        document.getElementById('edit_archivo').addEventListener('change', function(e) {
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
        document.getElementById('formEditar').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
            
            try {
                const formData = new FormData(this);
                const response = await fetch('../Connection/editar_publicacion.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.text();
                
                if (result.includes('OK')) {
                    alert('✓ Publicación editada exitosamente');
                    window.location.href = 'index.html';
                } else {
                    alert('Error: ' + result);
                    submitBtn.disabled = false;
                    submitBtn.textContent = '💾 Guardar Cambios';
                }
            } catch (error) {
                alert('Error de conexión: ' + error);
                submitBtn.disabled = false;
                submitBtn.textContent = '💾 Guardar Cambios';
            }
        });

        // Cargar publicaciones al iniciar
        cargarPublicaciones();
