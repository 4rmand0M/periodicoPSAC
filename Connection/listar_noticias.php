<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli("localhost", "root", "", "periodico_psac");

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

try {
    // Consulta para obtener noticias con información del autor
    $query = "SELECT 
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
              ORDER BY n.creado DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }
    
    $noticias = [];
    while ($row = $result->fetch_assoc()) {
        $noticias[] = [
            'id' => (int)$row['id'],
            'titulo' => $row['titulo'],
            'descripcion' => $row['descripcion'],
            'contenido' => $row['contenido'],
            'categoria' => $row['categoria'],
            'imagen_principal' => $row['imagen_principal'],
            'video_principal' => $row['video_principal'],
            'autor' => $row['autor'] ?: 'Redacción',
            'creado' => $row['creado']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'noticias' => $noticias,
        'total' => count($noticias)
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener noticias',
        'error' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>