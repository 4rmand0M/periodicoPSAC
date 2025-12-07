<?php
/**
 * login.php - VERSIÓN MEJORADA
 * Compatible con el nuevo sistema de registro
 * Reemplaza el archivo existente
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error de conexión a la base de datos'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    // Validaciones básicas
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false, 
            'message' => 'Usuario y contraseña requeridos'
        ]);
        exit;
    }
    
    // Buscar usuario usando prepared statement
    $stmt = $conn->prepare("SELECT id, username, password_hash, rol, nombre FROM usuarios WHERE username = ?");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la consulta'
        ]);
        exit;
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        echo json_encode([
            'success' => false, 
            'message' => 'Usuario o contraseña incorrectos'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Verificar contraseña usando password_verify
    if (password_verify($password, $user['password_hash'])) {
        // Login exitoso - crear sesión
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['rol'] = $user['rol'] ?? 'usuario'; // Asignar rol, por defecto 'usuario'
        $_SESSION['nombre'] = $user['nombre'];
        
        // Regenerar ID de sesión por seguridad
        session_regenerate_id(true);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'rol' => $user['rol'] ?? 'usuario',
                'nombre' => $user['nombre']
            ]
        ]);
    } else {
        // Contraseña incorrecta
        http_response_code(401);
        echo json_encode([
            'success' => false, 
            'message' => 'Usuario o contraseña incorrectos'
        ]);
    }
    
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'message' => 'Método no permitido'
    ]);
}

$conn->close();
?>