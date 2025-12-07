<?php
session_start();
header('Content-Type: application/json');
$conn = new mysqli("localhost","root","","periodico_psac");
$pub = intval($_POST['publicacion_id'] ?? $_GET['publicacion_id'] ?? 0);
$tipo = $_POST['tipo'] ?? 'up';
$action = $_GET['action'] ?? '';
$user = $_SESSION['user_id'] ?? null;
$sid = session_id();

if(!$pub) { echo json_encode(['error'=>'ID inválido']); exit; }

// Si es una petición para verificar estado
if($action === 'check'){
    $votoActual = null;
    if($user){
        $q = $conn->prepare("SELECT tipo FROM votos WHERE publicacion_id=? AND user_id=?");
        $q->bind_param("ii",$pub,$user);
        $q->execute(); 
        $res = $q->get_result()->fetch_assoc();
        if($res) $votoActual = $res['tipo'];
    } else {
        $q = $conn->prepare("SELECT tipo FROM votos WHERE publicacion_id=? AND session_id=?");
        $q->bind_param("is",$pub,$sid);
        $q->execute(); 
        $res = $q->get_result()->fetch_assoc();
        if($res) $votoActual = $res['tipo'];
    }
    echo json_encode(['tipo'=>$votoActual]);
    exit;
}

// Chequear si ya votó
if($user){
    $q = $conn->prepare("SELECT id, tipo FROM votos WHERE publicacion_id=? AND user_id=?");
    $q->bind_param("ii",$pub,$user);
    $q->execute(); $res = $q->get_result()->fetch_assoc();
} else {
    $q = $conn->prepare("SELECT id, tipo FROM votos WHERE publicacion_id=? AND session_id=?");
    $q->bind_param("is",$pub,$sid);
    $q->execute(); $res = $q->get_result()->fetch_assoc();
}

if($res){
    // si es mismo tipo => quitar voto. si es distinto => actualizar
    if($res['tipo'] === $tipo){
        $conn->query("DELETE FROM votos WHERE id=".$res['id']);
    } else {
        $conn->query("UPDATE votos SET tipo='{$tipo}' WHERE id=".$res['id']);
    }
}else{
    $ins = $conn->prepare("INSERT INTO votos(publicacion_id, user_id, session_id, tipo) VALUES(?,?,?,?)");
    $ins->bind_param("iiss",$pub, $user, $sid, $tipo);
    $ins->execute();
}

// devolver totales
$up = $conn->query("SELECT COUNT(*) c FROM votos WHERE publicacion_id={$pub} AND tipo='up'")->fetch_assoc()['c'];
$down = $conn->query("SELECT COUNT(*) c FROM votos WHERE publicacion_id={$pub} AND tipo='down'")->fetch_assoc()['c'];

// Verificar estado actual del voto después de la acción
$votoActual = null;
if($user){
    $q2 = $conn->prepare("SELECT tipo FROM votos WHERE publicacion_id=? AND user_id=?");
    $q2->bind_param("ii",$pub,$user);
    $q2->execute(); 
    $res2 = $q2->get_result()->fetch_assoc();
    if($res2) $votoActual = $res2['tipo'];
} else {
    $q2 = $conn->prepare("SELECT tipo FROM votos WHERE publicacion_id=? AND session_id=?");
    $q2->bind_param("is",$pub,$sid);
    $q2->execute(); 
    $res2 = $q2->get_result()->fetch_assoc();
    if($res2) $votoActual = $res2['tipo'];
}

echo json_encode(['up'=>$up,'down'=>$down,'voto_actual'=>$votoActual]);
