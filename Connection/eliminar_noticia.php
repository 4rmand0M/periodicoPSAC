<?php
// eliminar_noticia.php - Eliminar noticia

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
    $id = (int)($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }
    
    // Obtener archivos de la noticia para eliminarlos
    $query = "SELECT imagen_principal, video_principal FROM noticias WHERE id = ?";
    $stmt = $conexion->prepare($query);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        // Eliminar imagen principal si existe
        if ($row['imagen_principal']) {
            $rutaImagen = '../Connection/uploads/noticias/' . $row['imagen_principal'];
            if (file_exists($rutaImagen)) {
                unlink($rutaImagen);
            }
        }
        
        // Eliminar video principal si existe
        if ($row['video_principal']) {
            $rutaVideo = '../Connection/uploads/noticias/' . $row['video_principal'];
            if (file_exists($rutaVideo)) {
                unlink($rutaVideo);
            }
        }
        
        // Obtener y eliminar archivos de galería
        $queryGaleria = "SELECT archivo FROM noticias_galeria WHERE noticia_id = ?";
        $stmtGaleria = $conexion->prepare($queryGaleria);
        $stmtGaleria->bind_param('i', $id);
        $stmtGaleria->execute();
        $resultGaleria = $stmtGaleria->get_result();
        
        while ($rowGaleria = $resultGaleria->fetch_assoc()) {
            $rutaArchivo = '../Connection/uploads/noticias/' . $rowGaleria['archivo'];
            if (file_exists($rutaArchivo)) {
                unlink($rutaArchivo);
            }
        }
        
        // Eliminar registros de galería
        $queryDeleteGaleria = "DELETE FROM noticias_galeria WHERE noticia_id = ?";
        $stmtDeleteGaleria = $conexion->prepare($queryDeleteGaleria);
        $stmtDeleteGaleria->bind_param('i', $id);
        $stmtDeleteGaleria->execute();
        
        // Eliminar noticia
        $queryDelete = "DELETE FROM noticias WHERE id = ?";
        $stmtDelete = $conexion->prepare($queryDelete);
        $stmtDelete->bind_param('i', $id);
        
        if ($stmtDelete->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Noticia eliminada exitosamente'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar noticia']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Noticia no encontrada']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>