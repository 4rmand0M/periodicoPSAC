<?php
session_start();
$conn = new mysqli("localhost","root","","periodico_psac");
$pub = intval($_POST['publicacion_id'] ?? 0);
$tipo = $_POST['tipo'] ?? 'up';
$user = $_SESSION['user_id'] ?? null;
$sid = session_id();

if(!$pub) { echo "ERR"; exit; }

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
echo json_encode(['up'=>$up,'down'=>$down]);
