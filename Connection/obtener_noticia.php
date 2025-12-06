<?php
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión']);
    exit;
}

try {
    $id = intval($_GET['id'] ?? 0);
    
    if (!$id) {
        throw new Exception('ID de noticia no válido');
    }
    
    // Obtener datos principales de la noticia
    $stmt = $conn->prepare("
        SELECT 
            n.id,
            n.titulo,
            n.descripcion,
            n.contenido,
            n.categoria,
            n.imagen_principal,
            n.video_principal,
            n.autor_id,
            n.creado,
            u.username as autor
        FROM noticias n
        LEFT JOIN usuarios u ON n.autor_id = u.id
        WHERE n.id = ?
    ");
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Noticia no encontrada');
    }
    
    $noticia = $result->fetch_assoc();
    
    // Obtener galería adicional de la noticia
    $stmt_galeria = $conn->prepare("
        SELECT tipo, archivo 
        FROM noticias_galeria 
        WHERE noticia_id = ?
        ORDER BY orden ASC
    ");
    
    $stmt_galeria->bind_param("i", $id);
    $stmt_galeria->execute();
    $result_galeria = $stmt_galeria->get_result();
    
    $galeria = [];
    while ($row = $result_galeria->fetch_assoc()) {
        $galeria[] = [
            'tipo' => $row['tipo'],
            'archivo' => $row['archivo']
        ];
    }
    
    $noticia['galeria'] = $galeria;
    
    echo json_encode([
        'success' => true,
        'noticia' => $noticia
    ], JSON_UNESCAPED_UNICODE);
    
    $stmt->close();
    $stmt_galeria->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>