<?php
$conn = new mysqli("localhost","root","","periodico_psac");

// Mostrar datos actuales
echo "Datos actuales:\n";
$r = $conn->query("SELECT id, area, tipo, contenido FROM publicaciones");
echo "<pre>";
while($row = $r->fetch_assoc()) {
    echo "ID: {$row['id']}, Area: '{$row['area']}', Tipo: {$row['tipo']}\n";
}
echo "</pre>";

// Actualizar todas las áreas que sean "0" o vacías a "general"
echo "\nActualizando áreas vacías a 'general'...\n";
$update = $conn->query("UPDATE publicaciones SET area = 'general' WHERE area = '0' OR area = '' OR area IS NULL");
echo "Registros actualizados: " . $conn->affected_rows . "\n";

// Mostrar datos después de actualizar
echo "\nDatos después de actualizar:\n";
$r = $conn->query("SELECT id, area, tipo, contenido FROM publicaciones");
echo "<pre>";
while($row = $r->fetch_assoc()) {
    echo "ID: {$row['id']}, Area: '{$row['area']}', Tipo: {$row['tipo']}\n";
}
echo "</pre>";

$conn->close();
?>
