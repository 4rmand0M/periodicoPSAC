<?php
/**
 * Script para actualizar roles de usuarios
 * Asigna 'usuario' a todos los usuarios que no tengan rol definido o tengan 'editor' por defecto
 * Solo ejecutar una vez para migrar usuarios existentes
 */

header('Content-Type: text/html; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die("<h1>❌ Error de conexión: " . $conn->connect_error . "</h1>");
}

echo "<h1>🔧 Actualización de Roles de Usuarios</h1>";

// Verificar que la columna rol existe
$result = $conn->query("SHOW COLUMNS FROM usuarios WHERE Field='rol'");
if ($result->num_rows == 0) {
    echo "<p>❌ La columna 'rol' no existe. Ejecuta primero setup.php</p>";
    $conn->close();
    exit;
}

// Actualizar valor por defecto de la columna
echo "<h2>1. Actualizando valor por defecto de la columna 'rol'...</h2>";
$conn->query("ALTER TABLE usuarios MODIFY COLUMN rol VARCHAR(20) DEFAULT 'usuario'");
echo "<p>✅ Valor por defecto actualizado a 'usuario'</p>";

// Listar usuarios actuales
echo "<h2>2. Usuarios actuales:</h2>";
$result = $conn->query("SELECT id, username, rol, nombre FROM usuarios");
echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
echo "<tr style='background:#f3f4f6;'><th>ID</th><th>Username</th><th>Rol Actual</th><th>Nombre</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td>" . $row['username'] . "</td>";
    echo "<td><strong>" . ($row['rol'] ?: 'NULL') . "</strong></td>";
    echo "<td>" . ($row['nombre'] ?: '-') . "</td>";
    echo "</tr>";
}
echo "</table>";

echo "<h2>✅ Actualización completada</h2>";
echo "<p><strong>Nota:</strong> Los nuevos usuarios registrados tendrán automáticamente el rol 'usuario'</p>";

$conn->close();
?>

