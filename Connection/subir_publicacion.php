<?php
// subir_publicacion.php 

// Evitar errores visibles 
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Cabeceras y sesión
header('Content-Type: text/plain; charset=utf-8');
session_start();

// Conexión a la base de datos
$conn = new mysqli("localhost", "root", "", "periodico_psac");
if ($conn->connect_error) {
    echo "Error: Conexión fallida";
    exit;
}
$conn->set_charset("utf8mb4");

try {
    // Validar método
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo "Error: Método no permitido";
        exit;
    }

    // Verificar sesión y permisos (solo editores y admins pueden crear publicaciones)
    if (!isset($_SESSION['user_id'])) {
        echo "Error: Debes iniciar sesión para crear publicaciones";
        exit;
    }

    // Verificar rol - solo editores y admins pueden crear publicaciones
    $rol = $_SESSION['rol'] ?? 'usuario';
    if ($rol !== 'editor' && $rol !== 'admin') {
        echo "Error: No tienes permisos para crear publicaciones. Solo editores y administradores pueden publicar.";
        exit;
    }

    // Obtener datos
    $tipo = $_POST['tipo'] ?? 'texto';
    $contenido = trim($_POST['contenido'] ?? '');
    $area = $_POST['area'] ?? 'general';
    $destacado = (isset($_POST['destacado']) && $_POST['destacado'] == '1') ? 1 : 0;
    $author_id = $_SESSION['user_id'] ?? null;
    $archivo = null;

    if (empty($contenido)) {
        echo "Error: El contenido no puede estar vacío";
        exit;
    }

    // Procesar archivo
    if ($tipo !== 'texto' && isset($_FILES['archivo']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . "/uploads/";
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                echo "Error: No se pudo crear el directorio de uploads";
                exit;
            }
        }

        if ($_FILES['archivo']['size'] > 10 * 1024 * 1024) {
            echo "Error: El archivo es demasiado grande. Máximo 10MB";
            exit;
        }

        $nombreOriginal = basename($_FILES['archivo']['name']);
        $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
        $allowedImages = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $allowedVideos = ['mp4', 'webm', 'ogg', 'mov', 'avi'];

        if ($tipo === 'imagen' && !in_array($extension, $allowedImages)) {
            echo "Error: Formato de imagen no válido";
            exit;
        }
        if ($tipo === 'video' && !in_array($extension, $allowedVideos)) {
            echo "Error: Formato de video no válido";
            exit;
        }

        $archivo = uniqid() . '_' . time() . '.' . $extension;
        $rutaDestino = $uploadDir . $archivo;

        if (!move_uploaded_file($_FILES['archivo']['tmp_name'], $rutaDestino)) {
            echo "Error: No se pudo guardar el archivo";
            exit;
        }
    }

    // Insertar en BD
    $sql = "INSERT INTO publicaciones (tipo, contenido, archivo, area, destacado, author_id, creado) VALUES (?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo "Error: Falló la consulta SQL";
        exit;
    }

    $stmt->bind_param("ssssii", $tipo, $contenido, $archivo, $area, $destacado, $author_id);

    if ($stmt->execute()) {
        echo "OK"; // ← Solo esto en caso de éxito
    } else {
        // Limpiar archivo si falla
        if ($archivo && file_exists($uploadDir . $archivo)) {
            @unlink($uploadDir . $archivo);
        }
        echo "Error: No se pudo guardar en la base de datos";
    }

    $stmt->close();

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
} finally {
    $conn->close();
}
?>