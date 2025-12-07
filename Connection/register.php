<?php
/**
 * register.php - Sistema de registro de usuarios
 * Compatible con tu sistema existente de autenticación
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

// Conexión a BD (usando los mismos parámetros que tu sistema)
$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

// Verificar conexión
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]);
    exit;
}

// Respuesta por defecto
$response = [
    'success' => false,
    'message' => 'Error desconocido'
];

try {
    // Verificar que sea POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        $response['message'] = 'Método no permitido';
        echo json_encode($response);
        exit;
    }

    // Obtener y sanitizar datos
    $nombre = trim($_POST['nombre'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $email = trim($_POST['email'] ?? '');

    // ============================================
    // VALIDACIONES
    // ============================================

    // Campos requeridos
    if (empty($nombre) || empty($username) || empty($password)) {
        $response['message'] = 'Faltan campos requeridos';
        echo json_encode($response);
        exit;
    }

    // Validar longitud del nombre
    if (strlen($nombre) < 3 || strlen($nombre) > 150) {
        $response['message'] = 'El nombre debe tener entre 3 y 150 caracteres';
        echo json_encode($response);
        exit;
    }

    // Validar longitud del usuario
    if (strlen($username) < 3 || strlen($username) > 100) {
        $response['message'] = 'El usuario debe tener entre 3 y 100 caracteres';
        echo json_encode($response);
        exit;
    }

    // Validar formato del usuario (solo alfanuméricos y guion bajo)
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $response['message'] = 'El usuario solo puede contener letras, números y guion bajo';
        echo json_encode($response);
        exit;
    }

    // Validar contraseña (mínimo 8 caracteres, compatible con tu sistema)
    if (strlen($password) < 8) {
        $response['message'] = 'La contraseña debe tener al menos 8 caracteres';
        echo json_encode($response);
        exit;
    }

    // Validar email (si se proporciona)
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Email inválido';
        echo json_encode($response);
        exit;
    }

    // ============================================
    // VERIFICAR SI EL USUARIO YA EXISTE
    // ============================================

    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE username = ? LIMIT 1");
    
    if (!$stmt) {
        http_response_code(500);
        $response['message'] = 'Error en la consulta: ' . $conn->error;
        echo json_encode($response);
        exit;
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $stmt->close();
        $response['message'] = 'El usuario ya existe';
        echo json_encode($response);
        exit;
    }

    $stmt->close();

    // ============================================
    // CREAR USUARIO
    // ============================================

    // Hash de la contraseña usando PASSWORD_DEFAULT (compatible con login.php)
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Rol por defecto para usuarios que se registran
    $rol = 'usuario';
    
    // Usar el mismo patrón de prepared statement que tu sistema
    $stmt = $conn->prepare("INSERT INTO usuarios (username, password_hash, nombre, rol, creado) VALUES (?, ?, ?, ?, NOW())");

    if (!$stmt) {
        http_response_code(500);
        $response['message'] = 'Error al preparar inserción: ' . $conn->error;
        echo json_encode($response);
        exit;
    }

    $stmt->bind_param("ssss", $username, $password_hash, $nombre, $rol);

    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;
        
        // Respuesta exitosa
        $response['success'] = true;
        $response['message'] = 'Usuario registrado exitosamente';
        $response['user_id'] = $user_id;
        $response['username'] = $username;
        
        http_response_code(201); // Created

        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        $_SESSION['rol'] = $rol; // Rol asignado automáticamente al registrarse
        $_SESSION['nombre'] = $nombre;
        
    } else {
        http_response_code(500);
        $response['message'] = 'Error al crear usuario: ' . $stmt->error;
    }

    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Error: ' . $e->getMessage();
}

// Cerrar conexión
if (isset($conn)) {
    $conn->close();
}

// Enviar respuesta
echo json_encode($response);
?>