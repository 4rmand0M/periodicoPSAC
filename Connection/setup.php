<?php
header('Content-Type: text/html; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die("<h1>❌ Error de conexión: " . $conn->connect_error . "</h1>");
}

echo "<h1>🔧 Configuración de Base de Datos</h1>";

// 0. Verificar tabla usuarios existe
echo "<h2>0. Verificando tabla usuarios...</h2>";
$result = $conn->query("SHOW TABLES LIKE 'usuarios'");
if ($result->num_rows == 0) {
    echo "❌ Tabla usuarios no existe. Creando...<br>";
    $sql = "CREATE TABLE usuarios (
        id int auto_increment primary key,
        username varchar(100) unique not null,
        password_hash varchar(255) not null,
        nombre varchar(150),
        rol varchar(20) default 'usuario',
        creado timestamp default current_timestamp
    )";
    if ($conn->query($sql)) {
        echo "✅ Tabla usuarios creada<br>";
    } else {
        echo "❌ Error al crear tabla: " . $conn->error . "<br>";
    }
} else {
    echo "✅ Tabla usuarios existe<br>";
}

// 1. Verificar si la columna 'rol' existe
echo "<h2>1. Verificando columna 'rol'...</h2>";
$result = $conn->query("SHOW COLUMNS FROM usuarios WHERE Field='rol'");
if ($result->num_rows == 0) {
    echo "Agregando columna 'rol'...<br>";
    if ($conn->query("ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) DEFAULT 'usuario' AFTER password_hash")) {
        echo "✅ Columna 'rol' agregada exitosamente<br>";
    } else {
        echo "❌ Error: " . $conn->error . "<br>";
    }
} else {
    echo "✅ Columna 'rol' ya existe<br>";
}

// 2. Crear/actualizar usuarios de prueba
echo "<h2>2. Creando usuarios de prueba...</h2>";

$usuarios = [
    ['username' => 'editor1', 'password' => 'editor123', 'rol' => 'editor', 'nombre' => 'Editor Uno'],
    ['username' => 'admin', 'password' => 'admin123', 'rol' => 'admin', 'nombre' => 'Administrador']
];

foreach ($usuarios as $user) {
    $username = $user['username'];
    $password_hash = password_hash($user['password'], PASSWORD_DEFAULT);
    $rol = $user['rol'];
    $nombre = $user['nombre'];
    
    // Verificar si existe
    $check = $conn->prepare("SELECT id FROM usuarios WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $exists = $check->get_result()->num_rows > 0;
    
    if ($exists) {
        // Actualizar
        $stmt = $conn->prepare("UPDATE usuarios SET password_hash=?, rol=?, nombre=? WHERE username=?");
        $stmt->bind_param("ssss", $password_hash, $rol, $nombre, $username);
        if ($stmt->execute()) {
            echo "✅ Usuario '$username' actualizado<br>";
        } else {
            echo "❌ Error al actualizar '$username': " . $conn->error . "<br>";
        }
        $stmt->close();
    } else {
        // Crear
        $stmt = $conn->prepare("INSERT INTO usuarios (username, password_hash, rol, nombre) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $username, $password_hash, $rol, $nombre);
        if ($stmt->execute()) {
            echo "✅ Usuario '$username' creado<br>";
        } else {
            echo "❌ Error al crear '$username': " . $conn->error . "<br>";
        }
        $stmt->close();
    }
}

// 3. Listar usuarios
echo "<h2>3. Usuarios actuales en la BD:</h2>";
$result = $conn->query("SELECT id, username, rol, nombre FROM usuarios");
echo "<table border='1' cellpadding='10'>";
echo "<tr><th>ID</th><th>Username</th><th>Rol</th><th>Nombre</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td>" . $row['username'] . "</td>";
    echo "<td>" . $row['rol'] . "</td>";
    echo "<td>" . $row['nombre'] . "</td>";
    echo "</tr>";
}
echo "</table>";

echo "<h2>✅ Configuración completada</h2>";
echo "<p><strong>Prueba iniciar sesión con:</strong></p>";
echo "<ul>";
echo "<li>Usuario: <strong>editor1</strong> / Contraseña: <strong>editor123</strong> (Editor)</li>";
echo "<li>Usuario: <strong>admin</strong> / Contraseña: <strong>admin123</strong> (Admin)</li>";
echo "</ul>";

$conn->close();
?>
