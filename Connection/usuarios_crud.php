<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verificar que el usuario sea admin
if (!isset($_SESSION['user_id']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo administradores.']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a BD']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'listar':
        $result = $conn->query("SELECT id, username, rol, nombre, creado FROM usuarios ORDER BY creado DESC");
        if (!$result) {
            echo json_encode(['success' => false, 'message' => 'Error en la query: ' . $conn->error]);
            exit;
        }
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
        break;
        
    case 'crear':
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $rol = $_POST['rol'] ?? 'usuario';
        $nombre = trim($_POST['nombre'] ?? '');
        
        //  Validaciones
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
            exit;
        }
        
        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
            exit;
        }
        
        if (strlen($username) < 3) {
            echo json_encode(['success' => false, 'message' => 'El usuario debe tener al menos 3 caracteres']);
            exit;
        }


        
        // Verificar si el usuario ya existe
        $check = $conn->prepare("SELECT id FROM usuarios WHERE username = ?");
        $check->bind_param("s", $username);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'El usuario ya existe']);
            exit;
        }
        
        // Crear usuario
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO usuarios (username, password_hash, rol, nombre) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $username, $password_hash, $rol, $nombre);
        
        if ($stmt->execute()) {
            $newId = $conn->insert_id;
            echo json_encode([
                'success' => true, 
                'message' => 'Usuario creado exitosamente',
                'id' => $newId
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al crear usuario: ' . $stmt->error]);
        }
        break;
        
    case 'editar':
        $id = intval($_POST['id'] ?? 0);
        $username = trim($_POST['username'] ?? '');
        $rol = $_POST['rol'] ?? 'usuario';
        $nombre = trim($_POST['nombre'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (!$id || empty($username)) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            exit;
        }
        
        // No permitir editar el propio rol de admin a editor o usuario
        if ($id == $_SESSION['user_id'] && ($rol === 'editor' || $rol === 'usuario')) {
            echo json_encode(['success' => false, 'message' => 'No puedes cambiar tu propio rol de administrador']);
            exit;
        }
        
        if (!empty($password)) {
            // Actualizar con nueva contraseña
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE usuarios SET username=?, password_hash=?, rol=?, nombre=? WHERE id=?");
            $stmt->bind_param("ssssi", $username, $password_hash, $rol, $nombre, $id);
        } else {
            // Actualizar sin cambiar contraseña
            $stmt = $conn->prepare("UPDATE usuarios SET username=?, rol=?, nombre=? WHERE id=?");
            $stmt->bind_param("sssi", $username, $rol, $nombre, $id);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado exitosamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar usuario']);
        }
        break;
        
    case 'eliminar':
        $id = intval($_GET['id'] ?? 0);
        
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID inválido']);
            exit;
        }
        
        // No permitir eliminar al propio usuario
        if ($id == $_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propia cuenta']);
            exit;
        }
        
        // Eliminar usuario
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario eliminado exitosamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar usuario']);
        }
        break;
        
    case 'obtener':
        $id = intval($_GET['id'] ?? 0);
        $stmt = $conn->prepare("SELECT id, username, rol, nombre FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'usuario' => $row]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

$conn->close();
?>