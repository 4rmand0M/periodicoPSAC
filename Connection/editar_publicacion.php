<?php
session_start();
$conn = new mysqli("localhost","root","","periodico_psac");

$id = intval($_POST['id'] ?? 0);
$contenido = $_POST['contenido'] ?? '';
$area = $_POST['area'] ?? 'general';
$destacado = isset($_POST['destacado']) && $_POST['destacado']=='1' ? 1 : 0;

$archivo_sql = "";
if(isset($_FILES['archivo']) && $_FILES['archivo']['error']===0){
    $safe = preg_replace('/[^A-Za-z0-9\-\_\.]/','_', $_FILES['archivo']['name']);
    $archivo = time()."_".$safe;
    move_uploaded_file($_FILES['archivo']['tmp_name'], __DIR__."/uploads/".$archivo);
    $archivo_sql = ", archivo='{$archivo}'";
}

$stmt = $conn->prepare("UPDATE publicaciones SET contenido=?, area=?, destacado=? $archivo_sql WHERE id=?");
if($archivo_sql){
    
    $conn->query("UPDATE publicaciones SET contenido='". $conn->real_escape_string($contenido) ."', area='". $conn->real_escape_string($area) ."', destacado={$destacado}, archivo='{$archivo}' WHERE id={$id}");
}else{
    $stmt = $conn->prepare("UPDATE publicaciones SET contenido=?, area=?, destacado=? WHERE id=?");
    $stmt->bind_param("ssii",$contenido,$area,$destacado,$id);
    $stmt->execute();
}

echo "OK";
