<?php
header('Content-Type: text/html; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die("<h1>❌ Error de conexión: " . $conn->connect_error . "</h1>");
}

echo "<h1>✅ Creando/Actualizando Usuarios</h1>";

// Definir usuarios a crear/actualizar
$usuarios = [
    [
        'username' => 'editor1',
        'password' => 'editor123',
        'rol' => 'editor',
        'nombre' => 'Editor Uno'
    ],
    [
        'username' => 'admin',
        'password' => 'admin123',
        'rol' => 'admin',
        'nombre' => 'Administrador'
    ]
];

foreach ($usuarios as $user) {
    $username = $user['username'];
    $password = $user['password'];
    $rol = $user['rol'];
    $nombre = $user['nombre'];
    
    // IMPORTANTE: Hash la contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "<h2>Procesando usuario: <strong>$username</strong></h2>";
    
    // Verificar si existe
    $check = $conn->prepare("SELECT id FROM usuarios WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $check_result = $check->get_result();
    $exists = $check_result->num_rows > 0;
    $check->close();
    
    if ($exists) {
        // Actualizar (incluyendo contraseña)
        echo "Actualizando usuario existente...<br>";
        $stmt = $conn->prepare("UPDATE usuarios SET password_hash=?, rol=?, nombre=? WHERE username=?");
        $stmt->bind_param("ssss", $password_hash, $rol, $nombre, $username);
        if ($stmt->execute()) {
            echo "✅ Usuario <strong>$username</strong> actualizado<br>";
            echo "   Contraseña: <strong>$password</strong><br>";
            echo "   Rol: <strong>$rol</strong><br>";
        } else {
            echo "❌ Error al actualizar '$username': " . $conn->error . "<br>";
        }
        $stmt->close();
    } else {
        // Crear nuevo
        echo "Creando nuevo usuario...<br>";
        $stmt = $conn->prepare("INSERT INTO usuarios (username, password_hash, rol, nombre) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $username, $password_hash, $rol, $nombre);
        if ($stmt->execute()) {
            echo "✅ Usuario <strong>$username</strong> creado<br>";
            echo "   Contraseña: <strong>$password</strong><br>";
            echo "   Rol: <strong>$rol</strong><br>";
        } else {
            echo "❌ Error al crear '$username': " . $conn->error . "<br>";
        }
        $stmt->close();
    }
    
    // Verificar que la contraseña se guardó correctamente
    echo "Verificando contraseña...<br>";
    $verify_stmt = $conn->prepare("SELECT password_hash FROM usuarios WHERE username = ?");
    $verify_stmt->bind_param("s", $username);
    $verify_stmt->execute();
    $verify_result = $verify_stmt->get_result();
    if ($verify_row = $verify_result->fetch_assoc()) {
        $verify_ok = password_verify($password, $verify_row['password_hash']);
        echo "   Hash en BD: <code>" . substr($verify_row['password_hash'], 0, 30) . "...</code><br>";
        echo "   password_verify: " . ($verify_ok ? "✅ CORRECTO" : "❌ ERROR") . "<br>";
    }
    $verify_stmt->close();
    
    echo "<hr>";
}

// Listar todos los usuarios finales
echo "<h2>Usuarios finales en la BD:</h2>";
$result = $conn->query("SELECT id, username, rol, nombre FROM usuarios");
echo "<table border='1' cellpadding='10' style='border-collapse:collapse;'>";
echo "<tr style='background:#f3f4f6;'><th>ID</th><th>Username</th><th>Rol</th><th>Nombre</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td><strong>" . $row['username'] . "</strong></td>";
    echo "<td>" . $row['rol'] . "</td>";
    echo "<td>" . $row['nombre'] . "</td>";
    echo "</tr>";
}
echo "</table>";

echo "<h2 style='color:green;'>✅ Proceso completado</h2>";
echo "<p><strong>Ahora prueba a iniciar sesión con:</strong></p>";
echo "<ul>";
echo "<li><strong>Usuario:</strong> editor1 | <strong>Contraseña:</strong> editor123 (Editor)</li>";
echo "<li><strong>Usuario:</strong> admin | <strong>Contraseña:</strong> admin123 (Admin)</li>";
echo "</ul>";

$conn->close();
?>
