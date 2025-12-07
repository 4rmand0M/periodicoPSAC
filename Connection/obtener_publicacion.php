<?php
header('Content-Type: application/json; charset=utf-8');
$conn = new mysqli("localhost","root","","periodico_psac");
$id = intval($_GET['id'] ?? 0);
$r = $conn->query("SELECT * FROM publicaciones WHERE id=$id");
echo json_encode($r->fetch_assoc());
