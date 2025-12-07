<?php
// editar_noticia.php - Editar noticia existente

session_start();
header('Content-Type: application/json; charset=utf-8');
$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8");

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

try {
    $id = (int)($_POST['id'] ?? 0);
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $categoria = trim($_POST['categoria'] ?? 'general');
    $contenido = trim($_POST['contenido'] ?? '');
    
    if ($id <= 0 || empty($titulo) || empty($contenido)) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    
    // Actualizar noticia
    $query = "UPDATE noticias 
              SET titulo = ?, descripcion = ?, categoria = ?, contenido = ?
              WHERE id = ?";
    
    $stmt = $conexion->prepare($query);
    $stmt->bind_param('ssssi', $titulo, $descripcion, $categoria, $contenido, $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Noticia actualizada exitosamente'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar noticia']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>