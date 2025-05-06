<?php
// Página de estadísticas de visitantes
// Esta página muestra información sobre los visitantes únicos registrados

// Intentar cargar el archivo de visitantes
$jsonFilePath = 'visitors.json';
$hasData = false;
$visitorData = [];
$visitorCount = 0;
$lastUpdated = '';

if (file_exists($jsonFilePath)) {
    $jsonData = json_decode(file_get_contents($jsonFilePath), true);
    if ($jsonData) {
        $hasData = true;
        $visitorData = $jsonData;
        $visitorCount = $jsonData['count'];
        $lastUpdated = $jsonData['last_updated'];
    }
}

// Función para mostrar la fecha en formato legible
function formatDate($date) {
    return date('d/m/Y H:i:s', strtotime($date));
}

// Autorización simple - cambiar esta contraseña por motivos de seguridad
$password = "admin123"; // Cambia esto por una contraseña segura

// Verificar acceso
$isAuthorized = false;
if (isset($_POST['password']) && $_POST['password'] === $password) {
    $isAuthorized = true;
    // Guardar en sesión para mantener autorizado
    session_start();
    $_SESSION['authorized'] = true;
} else if (isset($_SESSION['authorized']) && $_SESSION['authorized'] === true) {
    $isAuthorized = true;
}

// Procesar acciones
$message = '';
if ($isAuthorized && isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'reset':
            // Resetear contador
            $visitorData['count'] = 0;
            $visitorData['visitors'] = [];
            $visitorData['last_updated'] = date('c');
            
            if (file_put_contents($jsonFilePath, json_encode($visitorData, JSON_PRETTY_PRINT))) {
                $message = "Contador reseteado correctamente.";
                $visitorCount = 0;
                $lastUpdated = date('c');
            } else {
                $message = "Error al resetear el contador.";
            }
            break;
            
        case 'update':
            // Actualizar contador manualmente
            $newCount = isset($_POST['new_count']) ? intval($_POST['new_count']) : $visitorCount;
            $visitorData['count'] = $newCount;
            $visitorData['last_updated'] = date('c');
            
            if (file_put_contents($jsonFilePath, json_encode($visitorData, JSON_PRETTY_PRINT))) {
                $message = "Contador actualizado a $newCount.";
                $visitorCount = $newCount;
                $lastUpdated = date('c');
            } else {
                $message = "Error al actualizar el contador.";
            }
            break;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estadísticas de Visitantes</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px 15px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #3498db;
            margin: 10px 0;
        }
        .message {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .login-form {
            max-width: 400px;
            margin: 100px auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        input, button {
            display: block;
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #3498db;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background-color: #2980b9;
        }
        .action-form {
            margin-top: 20px;
            padding: 15px;
            border-top: 1px solid #eee;
        }
        .stats-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .back-link {
            text-decoration: none;
            color: #3498db;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <?php if (!$isAuthorized): ?>
    <!-- Formulario de acceso -->
    <div class="login-form">
        <h2>Acceso a Estadísticas</h2>
        <?php if (isset($_POST['password']) && $_POST['password'] !== $password): ?>
            <div class="message error">Contraseña incorrecta</div>
        <?php endif; ?>
        <form method="post">
            <input type="password" name="password" placeholder="Contraseña" required>
            <button type="submit">Acceder</button>
        </form>
        <p style="text-align: center; margin-top: 20px;">
            <a href="index.html" class="back-link">Volver al sitio principal</a>
        </p>
    </div>
    <?php else: ?>
    <div class="container">
        <div class="stats-header">
            <h1>Estadísticas de Visitantes</h1>
            <a href="index.html" class="back-link">Volver al sitio principal</a>
        </div>
        
        <?php if ($message): ?>
            <div class="message"><?php echo $message; ?></div>
        <?php endif; ?>
        
        <?php if ($hasData): ?>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Visitantes Únicos</h3>
                <div class="stat-number"><?php echo $visitorCount; ?></div>
                <p>Basado en IPs únicas</p>
            </div>
            <div class="stat-card">
                <h3>Última Actualización</h3>
                <p style="font-size: 18px;"><?php echo formatDate($lastUpdated); ?></p>
            </div>
            <div class="stat-card">
                <h3>Total IPs Almacenadas</h3>
                <div class="stat-number"><?php echo count($visitorData['visitors']); ?></div>
            </div>
        </div>
        
        <h2>Administración</h2>
        <div class="action-form">
            <form method="post">
                <h3>Actualizar Contador Manualmente</h3>
                <input type="hidden" name="action" value="update">
                <input type="number" name="new_count" value="<?php echo $visitorCount; ?>" required>
                <button type="submit">Actualizar Contador</button>
            </form>
        </div>
        
        <div class="action-form">
            <form method="post" onsubmit="return confirm('¿Estás seguro de que quieres resetear el contador? Esta acción no se puede deshacer.')">
                <h3>Resetear Contador</h3>
                <input type="hidden" name="action" value="reset">
                <button type="submit" style="background-color: #e74c3c;">Resetear Contador y Visitantes</button>
            </form>
        </div>
        
        <h2>Lista de IPs de Visitantes</h2>
        <div style="max-height: 400px; overflow-y: auto;">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Dirección IP</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($visitorData['visitors'] as $index => $ip): ?>
                    <tr>
                        <td><?php echo $index + 1; ?></td>
                        <td><?php echo htmlspecialchars($ip); ?></td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($visitorData['visitors'])): ?>
                    <tr>
                        <td colspan="2" style="text-align: center;">No hay visitantes registrados</td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php else: ?>
        <div class="message error">
            No se pudo cargar el archivo de visitantes.
        </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</body>
</html> 