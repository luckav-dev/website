<?php
// Script para buscar recursivamente el archivo visitors.json en el servidor
// Este es un último recurso cuando no se puede encontrar el archivo visitors.json

// Configurar cabeceras para JSON y CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// Función para buscar un archivo recursivamente
function findFile($filename, $directory, $maxdepth = 3) {
    if ($maxdepth <= 0) return null;
    
    $files = scandir($directory);
    
    foreach ($files as $file) {
        if ($file == '.' || $file == '..') continue;
        
        $path = $directory . '/' . $file;
        
        if ($file == $filename && is_file($path)) {
            return $path;
        }
        
        if (is_dir($path)) {
            $result = findFile($filename, $path, $maxdepth - 1);
            if ($result) return $result;
        }
    }
    
    return null;
}

// Directorios donde buscar
$search_dirs = [
    '.', // Directorio actual
    '..', // Directorio padre
    $_SERVER['DOCUMENT_ROOT'], // Raíz del servidor
    dirname($_SERVER['DOCUMENT_ROOT']), // Un nivel arriba de la raíz
];

// Buscar el archivo visitors.json
$found_path = null;

foreach ($search_dirs as $dir) {
    if (is_dir($dir)) {
        $result = findFile('visitors.json', $dir, 2);
        if ($result) {
            $found_path = $result;
            break;
        }
    }
}

// Si encontramos el archivo
if ($found_path !== null) {
    // Intentar leer el contenido
    $file_content = file_get_contents($found_path);
    
    // Registrar el éxito
    $log_entry = date('Y-m-d H:i:s') . " - Búsqueda exitosa desde " . $_SERVER['REMOTE_ADDR'] . " - Path: " . $found_path . "\n";
    file_put_contents('search_visitors.log', $log_entry, FILE_APPEND);
    
    // Enviar el contenido JSON
    echo $file_content;
} else {
    // No se encontró el archivo, crear datos de respaldo
    $default_data = [
        'visitors' => [],
        'count' => 1,
        'last_updated' => date('c'),
        'error' => 'Archivo no encontrado en búsqueda recursiva',
        'dirs_searched' => $search_dirs
    ];
    
    // Registrar el fallo
    $log_entry = date('Y-m-d H:i:s') . " - Búsqueda fallida desde " . $_SERVER['REMOTE_ADDR'] . " - No se encontró el archivo\n";
    file_put_contents('search_visitors.log', $log_entry, FILE_APPEND);
    
    // Enviar respuesta JSON de error
    http_response_code(200); // Mantenemos 200 para que el cliente no falle
    echo json_encode($default_data);
}
?> 