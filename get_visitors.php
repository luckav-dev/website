<?php
// Script para leer el archivo visitors.json y devolverlo como JSON
// Este script se utiliza como alternativa si el acceso directo al archivo JSON falla

// Configurar cabeceras para JSON y CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// Posibles ubicaciones del archivo JSON
$possible_paths = [
    './visitors.json',
    '../visitors.json',
    realpath('./visitors.json'),
    realpath('../visitors.json'),
    __DIR__ . '/visitors.json',
    dirname(__DIR__) . '/visitors.json',
    '/visitors.json'
];

// Recorrer las posibles ubicaciones del archivo
$file_content = null;
$found_path = null;

foreach ($possible_paths as $path) {
    if (file_exists($path) && is_readable($path)) {
        $file_content = file_get_contents($path);
        $found_path = $path;
        break;
    }
}

// Si encontramos el archivo, devolverlo
if ($file_content !== null) {
    // Registrar el acceso en un archivo de log
    $log_entry = date('Y-m-d H:i:s') . " - Acceso exitoso desde " . $_SERVER['REMOTE_ADDR'] . " - Path: " . $found_path . "\n";
    file_put_contents('visitors_access.log', $log_entry, FILE_APPEND);
    
    // Enviar el contenido JSON
    echo $file_content;
} else {
    // Si no se encuentra, devolver un error y un contador predeterminado
    $log_entry = date('Y-m-d H:i:s') . " - Acceso fallido desde " . $_SERVER['REMOTE_ADDR'] . " - No se encontró el archivo\n";
    file_put_contents('visitors_access.log', $log_entry, FILE_APPEND);
    
    // Crear un objeto JSON de respaldo
    $default_data = [
        'visitors' => [],
        'count' => 1,
        'last_updated' => date('c'),
        'error' => 'Archivo no encontrado',
        'paths_checked' => $possible_paths
    ];
    
    // Enviar respuesta JSON de error
    http_response_code(200); // Mantenemos 200 para que el cliente no falle
    echo json_encode($default_data);
}
?> 