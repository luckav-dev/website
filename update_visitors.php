<?php
// Script para actualizar el contador de visitantes únicos
// Este script recibe una solicitud POST con una IP y actualiza el archivo visitors.json

// Configurar cabeceras
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitud OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar el método de solicitud
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Use POST.']);
    exit;
}

// Obtener datos de la solicitud
$data = json_decode(file_get_contents('php://input'), true);

// Comprobar si es una solicitud para inicializar el sistema
if (isset($data['action']) && $data['action'] === 'initialize') {
    // Ruta al archivo de visitantes
    $jsonFilePath = 'visitors.json';
    
    // Verificar si el archivo ya existe
    $fileExists = file_exists($jsonFilePath);
    
    if ($fileExists) {
        // El archivo ya existe, verificar si es válido
        $jsonData = json_decode(file_get_contents($jsonFilePath), true);
        
        if (!$jsonData || !isset($jsonData['visitors']) || !isset($jsonData['count'])) {
            // Estructura inválida, crear una nueva
            $jsonData = [
                'visitors' => [],
                'count' => isset($data['data']['count']) ? intval($data['data']['count']) : 0,
                'last_updated' => date('c')
            ];
            
            // Guardar el archivo con estructura correcta
            if (file_put_contents($jsonFilePath, json_encode($jsonData, JSON_PRETTY_PRINT))) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Archivo corregido exitosamente',
                    'action' => 'corrected',
                    'file_existed' => true,
                    'count' => $jsonData['count']
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'No se pudo guardar el archivo corregido',
                    'action' => 'correction_failed',
                    'file_existed' => true
                ]);
            }
        } else {
            // El archivo existe y es válido
            echo json_encode([
                'success' => true,
                'message' => 'El archivo ya existe y es válido',
                'action' => 'verified',
                'file_existed' => true,
                'count' => $jsonData['count'],
                'test_write' => is_writable($jsonFilePath)
            ]);
        }
    } else {
        // El archivo no existe, crearlo
        $initialData = isset($data['data']) ? $data['data'] : [
            'visitors' => [],
            'count' => 0,
            'last_updated' => date('c')
        ];
        
        // Asegurarnos de tener todos los campos requeridos
        if (!isset($initialData['visitors'])) $initialData['visitors'] = [];
        if (!isset($initialData['count'])) $initialData['count'] = 0;
        if (!isset($initialData['last_updated'])) $initialData['last_updated'] = date('c');
        
        // Escribir el nuevo archivo
        if (file_put_contents($jsonFilePath, json_encode($initialData, JSON_PRETTY_PRINT))) {
            // Intentar establecer permisos adecuados
            @chmod($jsonFilePath, 0666);
            
            echo json_encode([
                'success' => true,
                'message' => 'Archivo creado exitosamente',
                'action' => 'created',
                'file_existed' => false,
                'count' => $initialData['count'],
                'permissions' => substr(sprintf('%o', fileperms($jsonFilePath)), -4)
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'No se pudo crear el archivo',
                'action' => 'creation_failed',
                'file_existed' => false,
                'directory_writable' => is_writable(dirname($jsonFilePath))
            ]);
        }
    }
    
    exit;
}

// Comprobar si es sólo una solicitud para obtener el contador actual
if (isset($data['action']) && $data['action'] === 'get') {
    // Ruta al archivo de visitantes
    $jsonFilePath = 'visitors.json';
    
    // Intentar cargar el archivo existente
    if (file_exists($jsonFilePath)) {
        $jsonData = json_decode(file_get_contents($jsonFilePath), true);
        if (!$jsonData) {
            // Si hay un error al decodificar, crear estructura predeterminada
            $jsonData = [
                'visitors' => [],
                'count' => 0,
                'last_updated' => date('c')
            ];
        }
    } else {
        // Si el archivo no existe, crear estructura predeterminada
        $jsonData = [
            'visitors' => [],
            'count' => 0,
            'last_updated' => date('c')
        ];
        
        // Guardar el archivo para futuras solicitudes
        file_put_contents($jsonFilePath, json_encode($jsonData, JSON_PRETTY_PRINT));
    }
    
    // Devolver datos actuales
    echo json_encode([
        'success' => true,
        'count' => $jsonData['count'],
        'visitors_count' => count($jsonData['visitors']),
        'last_updated' => $jsonData['last_updated']
    ]);
    
    // Registrar consulta
    $logEntry = date('Y-m-d H:i:s') . " - Consulta de contador - IP: " . $_SERVER['REMOTE_ADDR'] . " - Total: " . $jsonData['count'] . "\n";
    file_put_contents('visitors_query.log', $logEntry, FILE_APPEND);
    
    exit;
}

// Verificar si se proporcionó una IP
if (empty($data['ip'])) {
    // Si no se proporcionó IP, usar la IP del cliente
    $visitorIP = $_SERVER['REMOTE_ADDR'];
} else {
    $visitorIP = $data['ip'];
}

// Ruta al archivo de visitantes
$jsonFilePath = 'visitors.json';

// Intentar cargar el archivo existente
if (file_exists($jsonFilePath)) {
    $jsonData = json_decode(file_get_contents($jsonFilePath), true);
    if (!$jsonData) {
        // Si hay un error al decodificar, crear estructura predeterminada
        $jsonData = [
            'visitors' => [],
            'count' => 0,
            'last_updated' => date('c')
        ];
    }
} else {
    // Si el archivo no existe, crear estructura predeterminada
    $jsonData = [
        'visitors' => [],
        'count' => 0,
        'last_updated' => date('c')
    ];
}

// Verificar si la IP ya está registrada
$ipExists = in_array($visitorIP, $jsonData['visitors']);
$wasUpdated = false;

// Si la IP no existe, añadirla y actualizar contador
if (!$ipExists) {
    $jsonData['visitors'][] = $visitorIP;
    $jsonData['count']++;
    $jsonData['last_updated'] = date('c');
    $wasUpdated = true;
    
    // Guardar el archivo actualizado
    if (file_put_contents($jsonFilePath, json_encode($jsonData, JSON_PRETTY_PRINT))) {
        $result = [
            'success' => true,
            'message' => 'Visitante registrado correctamente',
            'count' => $jsonData['count'],
            'was_new' => true
        ];
    } else {
        $result = [
            'success' => false,
            'error' => 'No se pudo guardar el archivo',
            'count' => $jsonData['count'],
            'was_new' => true
        ];
    }
} else {
    // La IP ya estaba registrada
    $result = [
        'success' => true,
        'message' => 'IP ya registrada anteriormente',
        'count' => $jsonData['count'],
        'was_new' => false
    ];
}

// Registrar actividad en log
$logEntry = date('Y-m-d H:i:s') . " - IP: " . $visitorIP . " - Nuevo: " . ($wasUpdated ? "Sí" : "No") . " - Total: " . $jsonData['count'] . "\n";
file_put_contents('visitors_update.log', $logEntry, FILE_APPEND);

// Devolver resultado como JSON
echo json_encode($result);
?> 