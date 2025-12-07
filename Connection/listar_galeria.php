<?php
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión']);
    exit;
}
$conn->set_charset('utf8mb4');

try {
    $sql = "SELECT id, tipo, archivo, area, contenido, creado FROM publicaciones 
            WHERE archivo IS NOT NULL AND archivo != '' AND (tipo = 'imagen' OR tipo = 'video')
            ORDER BY id DESC";
    $res = $conn->query($sql);

    $archivos = [];
    while ($row = $res->fetch_assoc()) {
        $archivos[] = [
            'id' => (int)$row['id'],
            'tipo' => $row['tipo'],
            'ruta' => $row['archivo'],
            'area' => $row['area'] ?: 'general',
            'descripcion' => $row['contenido'] ?: '',
            'fecha' => $row['creado'] ?: ''
        ];
    }

    echo json_encode(['success' => true, 'archivos' => $archivos]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error al listar la galería']);
} finally {
    $conn->close();
}
?>
