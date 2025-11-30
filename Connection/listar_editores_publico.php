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
    // Consulta solo información pública
    // NO incluye password_hash por seguridad
    $query = "SELECT 
                id,
                username,
                nombre,
                rol,
                creado
              FROM usuarios 
              ORDER BY 
                CASE 
                    WHEN rol = 'admin' THEN 1 
                    ELSE 2 
                END,
                creado DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }
    
    $editores = [];
    while ($row = $result->fetch_assoc()) {
        $editores[] = [
            'id' => (int)$row['id'],
            'username' => $row['username'],
            'nombre' => $row['nombre'],
            'rol' => $row['rol'],
            'creado' => $row['creado']
        ];
    }
    
    // Estadísticas adicionales
    $stats = [
        'total' => count($editores),
        'admins' => count(array_filter($editores, function($e) { return $e['rol'] === 'admin'; })),
        'editores' => count(array_filter($editores, function($e) { return $e['rol'] === 'editor'; }))
    ];
    
    echo json_encode([
        'success' => true,
        'editores' => $editores,
        'stats' => $stats,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener la lista de editores',
        'error' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>