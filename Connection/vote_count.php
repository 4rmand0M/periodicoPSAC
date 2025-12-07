<?php
$conn = new mysqli("localhost","root","","periodico_psac");
$pub = intval($_GET['publicacion_id'] ?? 0);
$tipo = $_GET['tipo'] ?? 'up';
$r = $conn->query("SELECT COUNT(*) c FROM votos WHERE publicacion_id={$pub} AND tipo='{$tipo}'");
echo $r->fetch_assoc()['c'];
