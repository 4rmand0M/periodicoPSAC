<?php
session_start();
$conn = new mysqli("localhost","root","","periodico_psac");
$id = intval($_GET['id'] ?? 0);
if(!$id) { echo "ERR"; exit; }
// (Opcional) validar que user sea author o admin
// primero obtener archivo para borrar
$res = $conn->query("SELECT archivo FROM publicaciones WHERE id=$id")->fetch_assoc();
if($res && $res['archivo']) {
    @unlink(__DIR__."/uploads/".$res['archivo']);
}
$conn->query("DELETE FROM publicaciones WHERE id=$id");
echo "OK";
