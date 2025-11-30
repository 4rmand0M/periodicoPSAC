<?php
header('Content-Type: application/json; charset=utf-8');
$conn = new mysqli("localhost","root","","periodico_psac");
$r = $conn->query("SELECT p.*, u.username FROM publicaciones p LEFT JOIN usuarios u ON p.author_id = u.id ORDER BY p.id DESC");
$out = [];
while($row = $r->fetch_assoc()) $out[] = $row;
echo json_encode($out);
?>