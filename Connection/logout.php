<?php
session_start();

// Destruir la sesión
$_SESSION = array();

if (session_id() != "") {
    setcookie(session_name(), '', time() - 42000, '/');
}

session_destroy();

// Redirigir al login
header('Location: ../html/login.html');
exit;
?>
