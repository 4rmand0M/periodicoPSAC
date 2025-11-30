<?php
header('location: ../html/index.html');

session_start();
header('Content-Type: text/plain; charset=utf-8');

// Conexión a la base de datos
$conn = new mysqli("localhost", "root", "", "periodico_psac");

// Verificar conexión
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

// Establecer charset UTF-8
$conn->set_charset("utf8mb4");

try {
    // Obtener datos del formulario
    $tipo = isset($_POST['tipo']) ? $_POST['tipo'] : 'texto';
    $contenido = isset($_POST['contenido']) ? trim($_POST['contenido']) : '';
    $area = isset($_POST['area']) ? $_POST['area'] : 'general';
    $destacado = (isset($_POST['destacado']) && $_POST['destacado'] == '1') ? 1 : 0;
    $author_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $archivo = null;

    // Validar que haya contenido
    if (empty($contenido)) {
        die("Error: El contenido no puede estar vacío");
    }

    // Procesar archivo si existe y no es tipo texto
    if ($tipo !== 'texto' && isset($_FILES['archivo']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . "/uploads/";
        
        // Crear directorio si no existe
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                die("Error: No se pudo crear el directorio de uploads");
            }
        }

        // Validar tamaño del archivo (máximo 10MB)
        $maxSize = 10 * 1024 * 1024; // 10MB en bytes
        if ($_FILES['archivo']['size'] > $maxSize) {
            die("Error: El archivo es demasiado grande. Máximo 10MB");
        }

        // Obtener extensión del archivo
        $nombreOriginal = basename($_FILES['archivo']['name']);
        $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
        
        // Validar tipo de archivo según el tipo de publicación
        $allowedImages = array('jpg', 'jpeg', 'png', 'gif', 'webp');
        $allowedVideos = array('mp4', 'webm', 'ogg', 'mov', 'avi');
        
        if ($tipo === 'imagen' && !in_array($extension, $allowedImages)) {
            die("Error: Formato de imagen no válido. Permitidos: jpg, jpeg, png, gif, webp");
        }
        
        if ($tipo === 'video' && !in_array($extension, $allowedVideos)) {
            die("Error: Formato de video no válido. Permitidos: mp4, webm, ogg, mov, avi");
        }

        // Generar nombre único para el archivo
        $archivo = uniqid() . '_' . time() . '.' . $extension;
        $rutaDestino = $uploadDir . $archivo;

        // Mover el archivo subido
        if (!move_uploaded_file($_FILES['archivo']['tmp_name'], $rutaDestino)) {
            die("Error: No se pudo guardar el archivo");
        }
    }

    // Preparar e insertar en la base de datos
    $sql = "INSERT INTO publicaciones (tipo, contenido, archivo, area, destacado, author_id, creado) VALUES (?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        die("Error en la preparación de la consulta: " . $conn->error);
    }

    // Bind de parámetros
    $stmt->bind_param("ssssii", $tipo, $contenido, $archivo, $area, $destacado, $author_id);
    
    // Ejecutar
    if ($stmt->execute()) {
        echo "OK";
    } else {
        // Si falla, eliminar el archivo subido si existe
        if ($archivo && file_exists($uploadDir . $archivo)) {
            @unlink($uploadDir . $archivo);
        }
        die("Error al guardar en la base de datos: " . $stmt->error);
    }

    $stmt->close();
    
} catch (Exception $e) {
    die("Error: " . $e->getMessage());
} finally {
    $conn->close();
}
?>