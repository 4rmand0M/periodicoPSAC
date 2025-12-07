<?php
// calendario_api.php - API para manejo de eventos del calendario

session_start();
header('Content-Type: application/json; charset=utf-8');
$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8");

// Verificar sesión (solo editores y admins pueden crear/editar/eliminar)
function verificarPermiso() {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    return true;
}

// Obtener acción
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'listar':
            listarEventos();
            break;
        
        case 'crear':
            if (!verificarPermiso()) {
                echo json_encode(['success' => false, 'message' => 'No autorizado']);
                exit;
            }
            crearEvento();
            break;
        
        case 'editar':
            if (!verificarPermiso()) {
                echo json_encode(['success' => false, 'message' => 'No autorizado']);
                exit;
            }
            editarEvento();
            break;
        
        case 'eliminar':
            if (!verificarPermiso()) {
                echo json_encode(['success' => false, 'message' => 'No autorizado']);
                exit;
            }
            eliminarEvento();
            break;
        
        case 'obtener':
            obtenerEvento();
            break;
        
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// Listar eventos
function listarEventos() {
    global $conn;
    
    $mes = isset($_GET['mes']) ? (int)$_GET['mes'] : date('n');
    $anio = isset($_GET['anio']) ? (int)$_GET['anio'] : date('Y');
    
    // Calcular primer y último día del mes
    $primerDia = "$anio-" . str_pad($mes, 2, '0', STR_PAD_LEFT) . "-01";
    $ultimoDia = date('Y-m-t', strtotime($primerDia));
    
    $query = "SELECT * FROM eventos_calendario 
              WHERE fecha BETWEEN ? AND ?
              ORDER BY fecha ASC, hora ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ss', $primerDia, $ultimoDia);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $eventos = [];
    while ($row = $result->fetch_assoc()) {
        $eventos[] = [
            'id' => (int)$row['id'],
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'fecha' => $row['fecha'],
            'hora' => $row['hora'],
            'color' => $row['color'],
            'creado' => $row['creado']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'eventos' => $eventos,
        'total' => count($eventos)
    ]);
}

// Crear evento
function crearEvento() {
    global $conn;
    
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $fecha = $_POST['fecha'] ?? '';
    $hora = $_POST['hora'] ?? null;
    $color = $_POST['color'] ?? '#3B82F6';
    $usuario_id = $_SESSION['user_id'];
    
    if (empty($nombre) || empty($fecha)) {
        echo json_encode(['success' => false, 'message' => 'Nombre y fecha son obligatorios']);
        return;
    }
    
    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        echo json_encode(['success' => false, 'message' => 'Formato de fecha inválido']);
        return;
    }
    
    $query = "INSERT INTO eventos_calendario (nombre, descripcion, fecha, hora, color, autor_id) 
              VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssssi', $nombre, $descripcion, $fecha, $hora, $color, $usuario_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Evento creado exitosamente',
            'id' => $stmt->insert_id
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al crear evento']);
    }
}

// Editar evento
function editarEvento() {
    global $conn;
    
    $id = (int)($_POST['id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $fecha = $_POST['fecha'] ?? '';
    $hora = $_POST['hora'] ?? null;
    $color = $_POST['color'] ?? '#3B82F6';
    
    if ($id <= 0 || empty($nombre) || empty($fecha)) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        return;
    }
    
    $query = "UPDATE eventos_calendario 
              SET nombre = ?, descripcion = ?, fecha = ?, hora = ?, color = ?
              WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssssi', $nombre, $descripcion, $fecha, $hora, $color, $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Evento actualizado exitosamente'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar evento']);
    }
}

// Eliminar evento
function eliminarEvento() {
    global $conn;
    
    $id = (int)($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        return;
    }
    
    $query = "DELETE FROM eventos_calendario WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Evento eliminado exitosamente'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar evento']);
    }
}

// Obtener un evento específico
function obtenerEvento() {
    global $conn;
    
    $id = (int)($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        return;
    }
    
    $query = "SELECT * FROM eventos_calendario WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo json_encode([
            'success' => true,
            'evento' => [
                'id' => (int)$row['id'],
                'nombre' => $row['nombre'],
                'descripcion' => $row['descripcion'],
                'fecha' => $row['fecha'],
                'hora' => $row['hora'],
                'color' => $row['color'],
                'creado' => $row['creado']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Evento no encontrado']);
    }
}
?>