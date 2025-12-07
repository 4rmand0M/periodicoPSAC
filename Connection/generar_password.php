<?php
header('Content-Type: text/html; charset=utf-8');

if (isset($_GET['password'])) {
    $password = $_GET['password'];
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "<!DOCTYPE html>";
    echo "<html><head><title>Generar Hash</title>";
    echo "<style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; }
        .result { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
        .label { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .hash { color: #059669; font-family: monospace; font-size: 14px; }
        .success { color: #22c55e; font-weight: bold; }
        .info { background: #dbeafe; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>";
    echo "</head><body>";
    echo "<div class='container'>";
    echo "<h1>🔐 Hash Generado</h1>";
    echo "<div class='result'>";
    echo "<div class='label'>Contraseña original:</div>";
    echo "<div style='color:#6b7280;'>" . htmlspecialchars($password) . "</div>";
    echo "</div>";
    echo "<div class='result'>";
    echo "<div class='label'>Hash generado:</div>";
    echo "<div class='hash'>" . $hash . "</div>";
    echo "</div>";
    echo "<p class='success'>✓ Hash generado exitosamente</p>";
    echo "<div class='info'>";
    echo "<strong>💡 Cómo usar:</strong><br>";
    echo "Usa este hash en tus queries SQL para crear usuarios:<br><br>";
    echo "<code style='background:#1f2937; color:#f3f4f6; padding:10px; display:block; border-radius:5px; margin-top:10px;'>";
    echo "INSERT INTO usuarios (username, password_hash, rol, nombre)<br>";
    echo "VALUES ('usuario', '$hash', 'editor', 'Nombre Completo');";
    echo "</code>";
    echo "</div>";
    echo "</div></body></html>";
} else {
    echo "<!DOCTYPE html>";
    echo "<html><head><title>Generar Hash de Contraseña</title>";
    echo "<style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f3f4f6; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2 10px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; }
        input { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 15px; margin: 10px 0; }
        button { width: 100%; padding: 14px; background: #4ade80; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
        button:hover { background: #22c55e; }
        .info { background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 14px; }
    </style>";
    echo "</head><body>";
    echo "<div class='container'>";
    echo "<h1>🔐 Generador de Hash</h1>";
    echo "<form method='get'>";
    echo "<label style='font-weight:bold; color:#374151;'>Ingresa la contraseña:</label>";
    echo "<input type='text' name='password' placeholder='Ej: admin123' required>";
    echo "<button type='submit'>Generar Hash</button>";
    echo "</form>";
    echo "<div class='info'>";
    echo "<strong>ℹ️ Información:</strong><br>";
    echo "Esta herramienta genera un hash seguro de contraseña usando bcrypt.<br>";
    echo "Usa el hash generado en tu base de datos para crear usuarios de forma segura.";
    echo "</div>";
    echo "</div></body></html>";
}
?>