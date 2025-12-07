<?php
// comentarios_api.php - API COMPLETA DE COMENTARIOS
session_start();
header('Content-Type: application/json; charset=utf-8');
$conn = new mysqli("localhost", "root", "", "periodico_psac");
$conn->set_charset("utf8");

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$tipo = $_GET['tipo'] ?? $_POST['tipo'] ?? 'publicacion';

function obtenerUsuario() {
    if (isset($_SESSION['user_id'])) {
        return [
            'user_id' => $_SESSION['user_id'],
            'nombre' => $_SESSION['username'],
            'es_usuario' => true
        ];
    } else {
        return [
            'user_id' => null,
            'session_id' => session_id(),
            'nombre' => 'Invitado',
            'es_usuario' => false
        ];
    }
}

// CREAR COMENTARIO
if ($action === 'crear') {
    $id_item = intval($_POST['id_item'] ?? 0);
    $comentario = trim($_POST['comentario'] ?? '');
    $parent_id = isset($_POST['parent_id']) ? intval($_POST['parent_id']) : null;
    
    if (empty($comentario) || $id_item <= 0) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    
    $usuario = obtenerUsuario();
    $tabla = $tipo === 'noticia' ? 'comentarios_noticias' : 'comentarios_publicaciones';
    $campo_id = $tipo === 'noticia' ? 'noticia_id' : 'publicacion_id';
    
    try {
        // Procesar menciones
        preg_match_all('/@(\w+)/', $comentario, $menciones);
        
        $sql = "INSERT INTO $tabla ($campo_id, user_id, session_id, nombre_usuario, comentario, parent_id) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iisssi", 
            $id_item, 
            $usuario['user_id'], 
            $usuario['session_id'], 
            $usuario['nombre'], 
            $comentario,
            $parent_id
        );
        
        if ($stmt->execute()) {
            $comentario_id = $conn->insert_id;
            
            // Procesar menciones
            if (!empty($menciones[1]) && $usuario['es_usuario']) {
                foreach ($menciones[1] as $username) {
                    $sql_user = "SELECT id FROM usuarios WHERE username = ? LIMIT 1";
                    $stmt_user = $conn->prepare($sql_user);
                    $stmt_user->bind_param("s", $username);
                    $stmt_user->execute();
                    $result = $stmt_user->get_result();
                    
                    if ($user_mencionado = $result->fetch_assoc()) {
                        $sql_mencion = "INSERT INTO comentarios_menciones 
                                       (comentario_id, tipo_contenido, usuario_mencionado_id, usuario_menciono_id) 
                                       VALUES (?, ?, ?, ?)";
                        $stmt_mencion = $conn->prepare($sql_mencion);
                        $stmt_mencion->bind_param("isii", 
                            $comentario_id, $tipo, 
                            $user_mencionado['id'], 
                            $usuario['user_id']
                        );
                        $stmt_mencion->execute();
                        
                        $mensaje = $usuario['nombre'] . " te mencionó en un comentario";
                        $sql_notif = "INSERT INTO comentarios_notificaciones 
                                     (usuario_id, tipo_notificacion, comentario_id, tipo_contenido, contenido_id, usuario_origen_id, mensaje) 
                                     VALUES (?, 'mencion', ?, ?, ?, ?, ?)";
                        $stmt_notif = $conn->prepare($sql_notif);
                        $stmt_notif->bind_param("iisiis", 
                            $user_mencionado['id'], $comentario_id, $tipo, $id_item, $usuario['user_id'], $mensaje
                        );
                        $stmt_notif->execute();
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Comentario publicado',
                'comentario' => [
                    'id' => $comentario_id,
                    'nombre_usuario' => $usuario['nombre'],
                    'comentario' => $comentario,
                    'creado' => date('Y-m-d H:i:s'),
                    'es_propio' => true,
                    'parent_id' => $parent_id
                ]
            ]);
        } else {
            throw new Exception('Error al guardar comentario');
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// LISTAR COMENTARIOS
if ($action === 'listar') {
    $id_item = intval($_GET['id_item'] ?? 0);
    $orden = $_GET['orden'] ?? 'recientes';
    $limite = intval($_GET['limite'] ?? 20);
    $offset = intval($_GET['offset'] ?? 0);
    
    if ($id_item <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }
    
    $tabla = $tipo === 'noticia' ? 'comentarios_noticias' : 'comentarios_publicaciones';
    $campo_id = $tipo === 'noticia' ? 'noticia_id' : 'publicacion_id';
    $usuario = obtenerUsuario();
    
    try {
        $order_by = "c.creado DESC";
        if ($orden === 'populares') {
            $order_by = "(SELECT COUNT(*) FROM comentarios_reacciones r WHERE r.comentario_id = c.id AND r.tipo_contenido = '$tipo' AND r.tipo_reaccion = 'like') DESC, c.creado DESC";
        } elseif ($orden === 'antiguos') {
            $order_by = "c.creado ASC";
        }
        
        $sql = "SELECT c.id, c.user_id, c.session_id, c.nombre_usuario, c.comentario, 
                       c.parent_id, c.editado, c.creado,
                       (SELECT COUNT(*) FROM comentarios_reacciones r WHERE r.comentario_id = c.id AND r.tipo_contenido = '$tipo' AND r.tipo_reaccion = 'like') as likes,
                       (SELECT COUNT(*) FROM comentarios_reacciones r WHERE r.comentario_id = c.id AND r.tipo_contenido = '$tipo' AND r.tipo_reaccion = 'love') as loves,
                       (SELECT COUNT(*) FROM comentarios_reacciones r WHERE r.comentario_id = c.id AND r.tipo_contenido = '$tipo' AND r.tipo_reaccion = 'dislike') as dislikes
                FROM $tabla c
                WHERE c.$campo_id = ? AND c.parent_id IS NULL
                ORDER BY $order_by
                LIMIT ? OFFSET ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $id_item, $limite, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $comentarios = [];
        while ($row = $result->fetch_assoc()) {
            $es_propio = false;
            if ($usuario['es_usuario'] && $row['user_id'] == $usuario['user_id']) {
                $es_propio = true;
            } elseif (!$usuario['es_usuario'] && $row['session_id'] == $usuario['session_id']) {
                $es_propio = true;
            }
            
            $respuestas = obtenerRespuestas($conn, $tabla, $row['id'], $tipo, $usuario);
            $reaccion_usuario = obtenerReaccionUsuario($conn, $row['id'], $tipo, $usuario);
            
            $comentarios[] = [
                'id' => $row['id'],
                'nombre_usuario' => $row['nombre_usuario'],
                'comentario' => $row['comentario'],
                'creado' => $row['creado'],
                'editado' => $row['editado'],
                'es_propio' => $es_propio,
                'likes' => intval($row['likes']),
                'loves' => intval($row['loves']),
                'dislikes' => intval($row['dislikes']),
                'reaccion_usuario' => $reaccion_usuario,
                'respuestas' => $respuestas,
                'total_respuestas' => count($respuestas)
            ];
        }
        
        $sql_count = "SELECT COUNT(*) as total FROM $tabla WHERE $campo_id = ? AND parent_id IS NULL";
        $stmt_count = $conn->prepare($sql_count);
        $stmt_count->bind_param("i", $id_item);
        $stmt_count->execute();
        $total_result = $stmt_count->get_result();
        $total_row = $total_result->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'comentarios' => $comentarios,
            'total' => intval($total_row['total']),
            'tiene_mas' => ($offset + $limite) < intval($total_row['total'])
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

function obtenerRespuestas($conn, $tabla, $parent_id, $tipo, $usuario) {
    $sql = "SELECT c.id, c.user_id, c.session_id, c.nombre_usuario, c.comentario, c.creado, c.editado,
                   (SELECT COUNT(*) FROM comentarios_reacciones r WHERE r.comentario_id = c.id AND r.tipo_contenido = '$tipo' AND r.tipo_reaccion = 'like') as likes,
                   (SELECT COUNT(*) FROM comentarios_reacciones r WHERE r.comentario_id = c.id AND r.tipo_contenido = '$tipo' AND r.tipo_reaccion = 'love') as loves
            FROM $tabla c
            WHERE c.parent_id = ?
            ORDER BY c.creado ASC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $parent_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $respuestas = [];
    while ($row = $result->fetch_assoc()) {
        $es_propio = false;
        if ($usuario['es_usuario'] && $row['user_id'] == $usuario['user_id']) {
            $es_propio = true;
        } elseif (!$usuario['es_usuario'] && $row['session_id'] == $usuario['session_id']) {
            $es_propio = true;
        }
        
        $reaccion_usuario = obtenerReaccionUsuario($conn, $row['id'], $tipo, $usuario);
        
        $respuestas[] = [
            'id' => $row['id'],
            'nombre_usuario' => $row['nombre_usuario'],
            'comentario' => $row['comentario'],
            'creado' => $row['creado'],
            'editado' => $row['editado'],
            'es_propio' => $es_propio,
            'likes' => intval($row['likes']),
            'loves' => intval($row['loves']),
            'reaccion_usuario' => $reaccion_usuario
        ];
    }
    
    return $respuestas;
}

function obtenerReaccionUsuario($conn, $comentario_id, $tipo, $usuario) {
    if ($usuario['es_usuario']) {
        $sql = "SELECT tipo_reaccion FROM comentarios_reacciones 
                WHERE comentario_id = ? AND tipo_contenido = ? AND user_id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isi", $comentario_id, $tipo, $usuario['user_id']);
    } else {
        $sql = "SELECT tipo_reaccion FROM comentarios_reacciones 
                WHERE comentario_id = ? AND tipo_contenido = ? AND session_id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iss", $comentario_id, $tipo, $usuario['session_id']);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        return $row['tipo_reaccion'];
    }
    return null;
}

// EDITAR COMENTARIO
if ($action === 'editar') {
    $id = intval($_POST['id'] ?? 0);
    $nuevo_contenido = trim($_POST['comentario'] ?? '');
    
    if ($id <= 0 || empty($nuevo_contenido)) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    
    $tabla = $tipo === 'noticia' ? 'comentarios_noticias' : 'comentarios_publicaciones';
    $usuario = obtenerUsuario();
    
    try {
        $sql = "SELECT user_id, session_id FROM $tabla WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $comentario = $result->fetch_assoc();
        
        if (!$comentario) {
            echo json_encode(['success' => false, 'message' => 'Comentario no encontrado']);
            exit;
        }
        
        $puede_editar = false;
        if ($usuario['es_usuario'] && $comentario['user_id'] == $usuario['user_id']) {
            $puede_editar = true;
        } elseif (!$usuario['es_usuario'] && $comentario['session_id'] == $usuario['session_id']) {
            $puede_editar = true;
        }
        
        if (!$puede_editar) {
            echo json_encode(['success' => false, 'message' => 'No tienes permiso']);
            exit;
        }
        
        $sql = "UPDATE $tabla SET comentario = ?, editado = 1, editado_fecha = NOW() WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $nuevo_contenido, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Comentario editado']);
        } else {
            throw new Exception('Error al editar comentario');
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ELIMINAR COMENTARIO
if ($action === 'eliminar') {
    $id = intval($_POST['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }
    
    $tabla = $tipo === 'noticia' ? 'comentarios_noticias' : 'comentarios_publicaciones';
    $usuario = obtenerUsuario();
    
    try {
        $sql = "SELECT user_id, session_id FROM $tabla WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $comentario = $result->fetch_assoc();
        
        if (!$comentario) {
            echo json_encode(['success' => false, 'message' => 'Comentario no encontrado']);
            exit;
        }
        
        $puede_eliminar = false;
        if ($usuario['es_usuario'] && $comentario['user_id'] == $usuario['user_id']) {
            $puede_eliminar = true;
        } elseif (!$usuario['es_usuario'] && $comentario['session_id'] == $usuario['session_id']) {
            $puede_eliminar = true;
        } elseif (isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin') {
            $puede_eliminar = true;
        }
        
        if (!$puede_eliminar) {
            echo json_encode(['success' => false, 'message' => 'No tienes permiso']);
            exit;
        }
        
        $sql = "DELETE FROM $tabla WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Comentario eliminado']);
        } else {
            throw new Exception('Error al eliminar');
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// REACCIONAR
if ($action === 'reaccionar') {
    $comentario_id = intval($_POST['comentario_id'] ?? 0);
    $tipo_reaccion = $_POST['tipo_reaccion'] ?? 'like';
    
    if ($comentario_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }
    
    $usuario = obtenerUsuario();
    
    try {
        if ($usuario['es_usuario']) {
            $sql_check = "SELECT id, tipo_reaccion FROM comentarios_reacciones 
                         WHERE comentario_id = ? AND tipo_contenido = ? AND user_id = ? LIMIT 1";
            $stmt_check = $conn->prepare($sql_check);
            $stmt_check->bind_param("isi", $comentario_id, $tipo, $usuario['user_id']);
        } else {
            $sql_check = "SELECT id, tipo_reaccion FROM comentarios_reacciones 
                         WHERE comentario_id = ? AND tipo_contenido = ? AND session_id = ? LIMIT 1";
            $stmt_check = $conn->prepare($sql_check);
            $stmt_check->bind_param("iss", $comentario_id, $tipo, $usuario['session_id']);
        }
        
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        $reaccion_existente = $result_check->fetch_assoc();
        
        if ($reaccion_existente) {
            if ($reaccion_existente['tipo_reaccion'] === $tipo_reaccion) {
                $sql = "DELETE FROM comentarios_reacciones WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $reaccion_existente['id']);
                $stmt->execute();
                echo json_encode(['success' => true, 'message' => 'Reacción eliminada', 'accion' => 'eliminado']);
            } else {
                $sql = "UPDATE comentarios_reacciones SET tipo_reaccion = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("si", $tipo_reaccion, $reaccion_existente['id']);
                $stmt->execute();
                echo json_encode(['success' => true, 'message' => 'Reacción actualizada', 'accion' => 'actualizado']);
            }
        } else {
            $sql = "INSERT INTO comentarios_reacciones 
                   (comentario_id, tipo_contenido, user_id, session_id, tipo_reaccion) 
                   VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("isiss", 
                $comentario_id, $tipo, 
                $usuario['user_id'], $usuario['session_id'], 
                $tipo_reaccion
            );
            $stmt->execute();
            echo json_encode(['success' => true, 'message' => 'Reacción agregada', 'accion' => 'creado']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// BUSCAR USUARIOS (para menciones)
if ($action === 'buscar_usuarios') {
    $query = $_GET['query'] ?? '';
    
    if (strlen($query) < 2) {
        echo json_encode(['success' => false, 'message' => 'Query muy corto']);
        exit;
    }
    
    try {
        $search = "%{$query}%";
        $sql = "SELECT id, username, nombre FROM usuarios 
                WHERE username LIKE ? OR nombre LIKE ? 
                LIMIT 10";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $search, $search);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        
        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// REPORTAR COMENTARIO
if ($action === 'reportar') {
    $comentario_id = intval($_POST['comentario_id'] ?? 0);
    $razon = $_POST['razon'] ?? 'otro';
    $descripcion = trim($_POST['descripcion'] ?? '');
    
    if ($comentario_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }
    
    $usuario = obtenerUsuario();
    
    try {
        $sql = "INSERT INTO comentarios_reportes 
               (comentario_id, tipo_contenido, usuario_reporta_id, session_id, razon, descripcion) 
               VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isisss", 
            $comentario_id, $tipo, 
            $usuario['user_id'], $usuario['session_id'],
            $razon, $descripcion
        );
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Reporte enviado']);
        } else {
            throw new Exception('Error al enviar reporte');
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// NOTIFICACIONES
if ($action === 'notificaciones') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }
    
    $limite = intval($_GET['limite'] ?? 10);
    
    try {
        $sql = "SELECT n.*, u.username as usuario_origen_nombre
                FROM comentarios_notificaciones n
                LEFT JOIN usuarios u ON n.usuario_origen_id = u.id
                WHERE n.usuario_id = ?
                ORDER BY n.creado DESC
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $_SESSION['user_id'], $limite);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $notificaciones = [];
        while ($row = $result->fetch_assoc()) {
            $notificaciones[] = $row;
        }
        
        $sql_count = "SELECT COUNT(*) as total FROM comentarios_notificaciones 
                     WHERE usuario_id = ? AND leido = 0";
        $stmt_count = $conn->prepare($sql_count);
        $stmt_count->bind_param("i", $_SESSION['user_id']);
        $stmt_count->execute();
        $result_count = $stmt_count->get_result();
        $count_row = $result_count->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'notificaciones' => $notificaciones,
            'no_leidas' => intval($count_row['total'])
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Acción no válida']);
?>