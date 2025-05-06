<?php
// Script para crear o corregir el archivo visitors.json
// Ejecutar este script una vez para asegurar que existe el archivo

// Ruta del archivo
$jsonFilePath = 'visitors.json';

// Verificar si el archivo ya existe
if (file_exists($jsonFilePath)) {
    echo "El archivo visitors.json ya existe. Verificando estructura...<br>";
    
    // Leer el contenido actual
    $jsonContent = file_get_contents($jsonFilePath);
    $jsonData = json_decode($jsonContent, true);
    
    // Verificar si la estructura es válida
    if (!$jsonData || !isset($jsonData['visitors']) || !isset($jsonData['count'])) {
        echo "La estructura del archivo es inválida. Corrigiendo...<br>";
        
        // Crear estructura correcta
        $jsonData = [
            'visitors' => isset($jsonData['visitors']) ? $jsonData['visitors'] : [],
            'count' => isset($jsonData['count']) ? intval($jsonData['count']) : 0,
            'last_updated' => date('c')
        ];
        
        // Guardar archivo con estructura corregida
        if (file_put_contents($jsonFilePath, json_encode($jsonData, JSON_PRETTY_PRINT))) {
            echo "¡Archivo corregido exitosamente!<br>";
        } else {
            echo "Error al escribir el archivo.<br>";
        }
    } else {
        echo "La estructura del archivo es correcta.<br>";
    }
} else {
    echo "El archivo visitors.json no existe. Creando...<br>";
    
    // Crear estructura inicial
    $jsonData = [
        'visitors' => [],
        'count' => 0,
        'last_updated' => date('c')
    ];
    
    // Guardar archivo nuevo
    if (file_put_contents($jsonFilePath, json_encode($jsonData, JSON_PRETTY_PRINT))) {
        echo "¡Archivo creado exitosamente!<br>";
    } else {
        echo "Error al crear el archivo.<br>";
    }
}

// Verificar permisos
$perms = fileperms($jsonFilePath);
$permsOctal = substr(sprintf('%o', $perms), -4);
echo "Permisos actuales del archivo: $permsOctal<br>";

// Verificar si el archivo es escribible
if (is_writable($jsonFilePath)) {
    echo "El archivo es escribible.<br>";
} else {
    echo "ADVERTENCIA: El archivo NO es escribible. Asignar permisos adecuados.<br>";
    
    // Intentar cambiar permisos
    if (chmod($jsonFilePath, 0666)) {
        echo "Permisos cambiados a 0666.<br>";
    } else {
        echo "No se pudieron cambiar los permisos. Cambiar manualmente usando FTP.<br>";
    }
}

// Mostrar contenido actual
$currentData = json_decode(file_get_contents($jsonFilePath), true);
echo "<h3>Contenido actual:</h3>";
echo "<pre>";
print_r($currentData);
echo "</pre>";

// Probar escritura
echo "<h3>Probando escritura:</h3>";
$testData = $currentData;
$testData['test_timestamp'] = date('c');
if (file_put_contents($jsonFilePath, json_encode($testData, JSON_PRETTY_PRINT))) {
    echo "Prueba de escritura exitosa.<br>";
} else {
    echo "ERROR: No se pudo escribir en el archivo.<br>";
}

echo "<p>Si hay problemas de permisos, ejecuta en el servidor:</p>";
echo "<code>chmod 666 visitors.json</code>";
?> 