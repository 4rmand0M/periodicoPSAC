<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión']);
    exit;
}

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

// Verificar rol - solo editores y admins pueden crear noticias
$rol = $_SESSION['rol'] ?? 'usuario';
if ($rol !== 'editor' && $rol !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'No tienes permisos para crear noticias. Solo editores y administradores pueden publicar.']);
    exit;
}

try {
    // Validar datos
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $contenido = trim($_POST['contenido'] ?? '');
    $categoria = $_POST['categoria'] ?? 'general';
    $autor_id = $_SESSION['user_id'];
    
    if (empty($titulo) || empty($descripcion) || empty($contenido)) {
        throw new Exception('Todos los campos son obligatorios');
    }
    
    // Crear directorio de uploads si no existe
    $uploadDir = __DIR__ . "/uploads/noticias/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Procesar archivo principal (imagen o video)
    $imagen_principal = null;
    $video_principal = null;
    
    if (isset($_FILES['imagen_principal']) && $_FILES['imagen_principal']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['imagen_principal'];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Validar extensión
        $allowedImages = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $allowedVideos = ['mp4', 'webm', 'ogg', 'mov'];
        
        if (in_array($extension, $allowedImages)) {
            $imagen_principal = uniqid() . '_' . time() . '.' . $extension;
            move_uploaded_file($file['tmp_name'], $uploadDir . $imagen_principal);
        } elseif (in_array($extension, $allowedVideos)) {
            $video_principal = uniqid() . '_' . time() . '.' . $extension;
            move_uploaded_file($file['tmp_name'], $uploadDir . $video_principal);
        } else {
            throw new Exception('Formato de archivo no válido');
        }
    } else {
        throw new Exception('La imagen o video principal es obligatorio');
    }
    
    // Insertar noticia en la base de datos
    $stmt = $conn->prepare("
        INSERT INTO noticias (titulo, descripcion, contenido, categoria, imagen_principal, video_principal, autor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("ssssssi", $titulo, $descripcion, $contenido, $categoria, $imagen_principal, $video_principal, $autor_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al guardar la noticia: ' . $stmt->error);
    }
    
    $noticia_id = $conn->insert_id;
    
    // Procesar galería adicional
    $galeria_count = intval($_POST['galeria_count'] ?? 0);
    
    for ($i = 0; $i < $galeria_count; $i++) {
        $fileKey = 'galeria_' . $i;
        
        if (isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES[$fileKey];
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            $tipo = null;
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $tipo = 'imagen';
            } elseif (in_array($extension, ['mp4', 'webm', 'ogg', 'mov'])) {
                $tipo = 'video';
            }
            
            if ($tipo) {
                $archivo = uniqid() . '_' . time() . '.' . $extension;
                move_uploaded_file($file['tmp_name'], $uploadDir . $archivo);
                
                // Guardar en tabla de galería
                $stmt_galeria = $conn->prepare("
                    INSERT INTO noticias_galeria (noticia_id, tipo, archivo, orden)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt_galeria->bind_param("issi", $noticia_id, $tipo, $archivo, $i);
                $stmt_galeria->execute();
                $stmt_galeria->close();
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Noticia publicada exitosamente',
        'noticia_id' => $noticia_id
    ]);
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>