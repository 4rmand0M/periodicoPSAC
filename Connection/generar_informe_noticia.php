<?php
// Este script genera un PDF simple usando HTML y CSS
// Para una solución más robusta, considera usar librerías como TCPDF o mPDF

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="informe_noticia.pdf"');

// Recibir datos JSON
$json = file_get_contents('php://input');
$data = json_decode($json, true);
$noticia_id = intval($data['noticia_id'] ?? 0);

if (!$noticia_id) {
    die('ID de noticia no válido');
}

// Conectar a la base de datos
$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die('Error de conexión');
}

// Obtener la noticia
$stmt = $conn->prepare("
    SELECT 
        n.titulo,
        n.descripcion,
        n.contenido,
        n.categoria,
        n.imagen_principal,
        n.video_principal,
        n.creado,
        u.username as autor
    FROM noticias n
    LEFT JOIN usuarios u ON n.autor_id = u.id
    WHERE n.id = ?
");

$stmt->bind_param("i", $noticia_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die('Noticia no encontrada');
}

$noticia = $result->fetch_assoc();

// Obtener galería
$stmt_galeria = $conn->prepare("
    SELECT tipo, archivo 
    FROM noticias_galeria 
    WHERE noticia_id = ?
    ORDER BY orden ASC
");

$stmt_galeria->bind_param("i", $noticia_id);
$stmt_galeria->execute();
$result_galeria = $stmt_galeria->get_result();

$galeria = [];
while ($row = $result_galeria->fetch_assoc()) {
    $galeria[] = $row;
}

// Generar HTML del informe
$fecha = date('d/m/Y', strtotime($noticia['creado']));

$html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informe - {$noticia['titulo']}</title>
    <style>
        @page {
            margin: 2cm;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        
        .titulo {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin: 30px 0 20px 0;
        }
        
        .meta {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .meta-item {
            margin: 5px 0;
            font-size: 14px;
            color: #6b7280;
        }
        
        .meta-item strong {
            color: #374151;
        }
        
        .descripcion {
            font-size: 16px;
            font-style: italic;
            color: #6b7280;
            margin-bottom: 30px;
            padding: 15px;
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
        }
        
        .contenido {
            font-size: 14px;
            text-align: justify;
            margin-bottom: 30px;
        }
        
        .contenido p {
            margin-bottom: 15px;
        }
        
        .imagen-principal {
            text-align: center;
            margin: 30px 0;
        }
        
        .imagen-principal img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .galeria {
            margin-top: 40px;
            page-break-before: always;
        }
        
        .galeria h2 {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        
        .galeria-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .galeria-item {
            text-align: center;
        }
        
        .galeria-item img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🎓 POLITÉCNICO SALESIANO ARQUIDES CALDERÓN</div>
        <div style="font-size: 18px; color: #6b7280; margin-top: 10px;">Informe de Noticia</div>
    </div>
    
    <h1 class="titulo">{$noticia['titulo']}</h1>
    
    <div class="meta">
        <div class="meta-item"><strong>📅 Fecha de Publicación:</strong> {$fecha}</div>
        <div class="meta-item"><strong>✍️ Autor:</strong> {$noticia['autor']}</div>
        <div class="meta-item"><strong>🏷️ Categoría:</strong> {$noticia['categoria']}</div>
    </div>
    
    <div class="descripcion">
        {$noticia['descripcion']}
    </div>
HTML;

// Agregar imagen principal si existe
if ($noticia['imagen_principal']) {
    $rutaImagen = __DIR__ . "/uploads/noticias/" . $noticia['imagen_principal'];
    if (file_exists($rutaImagen)) {
        $imagenData = base64_encode(file_get_contents($rutaImagen));
        $mimeType = mime_content_type($rutaImagen);
        $html .= <<<HTML
    <div class="imagen-principal">
        <img src="data:{$mimeType};base64,{$imagenData}" alt="Imagen principal">
    </div>
HTML;
    }
}

// Agregar contenido
$contenido_html = nl2br(htmlspecialchars($noticia['contenido']));
$html .= <<<HTML
    <div class="contenido">
        {$contenido_html}
    </div>
HTML;

// Agregar galería si existe
if (count($galeria) > 0) {
    $html .= <<<HTML
    <div class="galeria">
        <h2>📸 Galería de Imágenes</h2>
        <div class="galeria-grid">
HTML;
    
    foreach ($galeria as $item) {
        if ($item['tipo'] === 'imagen') {
            $rutaImagen = __DIR__ . "/uploads/noticias/" . $item['archivo'];
            if (file_exists($rutaImagen)) {
                $imagenData = base64_encode(file_get_contents($rutaImagen));
                $mimeType = mime_content_type($rutaImagen);
                $html .= <<<HTML
            <div class="galeria-item">
                <img src="data:{$mimeType};base64,{$imagenData}" alt="Galería">
            </div>
HTML;
            }
        }
    }
    
    $html .= <<<HTML
        </div>
    </div>
HTML;
}

// Footer
$html .= <<<HTML
    <div class="footer">
        <p>Este informe fue generado automáticamente por el Sistema de Noticias del Periódico PSAC</p>
        <p>Fecha de generación: {$fecha}</p>
    </div>
</body>
</html>
HTML;

// Usar DomPDF

require_once(__DIR__ . '/../vendor/autoload.php'); 

use Dompdf\Dompdf;
use Dompdf\Options;

$options = new Options();
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', true);

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$dompdf->stream("informe_noticia_{$noticia_id}.pdf", ["Attachment" => true]);

$stmt->close();
$stmt_galeria->close();
$conn->close();
?>