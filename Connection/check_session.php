<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verificar si hay una sesión activa
if (isset($_SESSION['user_id'])) {
    // Usuario logueado
    echo json_encode([
        'logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'nombre' => $_SESSION['nombre'] ?? $_SESSION['username'],
            'rol' => $_SESSION['rol']
        ]
    ]);
} else {
    // Usuario no logueado
    echo json_encode([
        'logged_in' => false,
        'user' => null
    ]);
}
?>
