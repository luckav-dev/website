/**
 * Sistema de contador de visitas únicas
 * Este script maneja el conteo de visitantes únicos basado en IPs
 * Versión: 1.0.1 (Mejorado manejo de errores)
 */

(function() {
    // Configuración
    const config = {
        updateInterval: 30000, // Intervalo de actualización en ms
        counterId: 'visitorCount', // ID del elemento HTML donde mostrar el contador
        statusElementId: 'counterStatus', // ID del elemento para mensajes de estado
        phpEndpoint: 'update_visitors.php', // Ruta al script PHP que maneja las actualizaciones
        ipService: 'https://api.ipify.org?format=json', // Servicio para obtener la IP del visitante
        debugMode: true, // Activar mensajes de depuración en consola
        fallbackCount: 1, // Valor de contador a usar si hay errores
        maxRetries: 3, // Número máximo de intentos por operación
        retryDelay: 2000 // Milisegundos entre reintentos
    };
    
    // Clase principal
    class VisitorCounter {
        constructor(options = {}) {
            this.config = {...config, ...options};
            this.counterElement = document.getElementById(this.config.counterId);
            this.statusElement = document.getElementById(this.config.statusElementId);
            this.retryCount = 0;
            
            if (!this.counterElement) {
                this.log('Error: No se encontró el elemento del contador. Asegúrate de tener un elemento con id "' + this.config.counterId + '"', 'error');
                
                // Buscar el elemento después, por si el DOM aún se está cargando
                setTimeout(() => {
                    this.counterElement = document.getElementById(this.config.counterId);
                    if (this.counterElement) {
                        this.log('Elemento del contador encontrado después de la carga', 'info');
                        this.init();
                    }
                }, 1000);
                
                return;
            }
            
            // Inicializar el contador
            this.init();
        }
        
        // Método de inicialización
        async init() {
            try {
                this.updateStatus('Iniciando contador...', 'loading');
                
                // Mostrar un contador temporal mientras se carga
                this.updateCounter(this.config.fallbackCount);
                
                // Verificar si el sistema está listo
                try {
                    await this.ensureSystemReady();
                } catch (error) {
                    this.log('Error al verificar sistema, intentando diagnóstico: ' + error.message, 'warn');
                    
                    // Realizar diagnóstico del sistema
                    const diagResult = await this.diagnosisSystem();
                    
                    if (!diagResult.success) {
                        throw new Error('Error de sistema: ' + diagResult.error);
                    }
                }
                
                // Cargar el conteo inicial
                const countData = await this.loadCount();
                
                if (!countData) {
                    this.log('No se pudo cargar el conteo inicial, usando valor de localStorage', 'warn');
                    this.loadLocalCount();
                }
                
                // Registrar una visita si es nueva
                try {
                    const visitorIP = await this.getVisitorIP();
                    if (visitorIP) {
                        await this.registerVisit(visitorIP);
                    } else {
                        this.log('No se pudo obtener la IP del visitante, cargando conteo sin registro', 'warn');
                        await this.loadCount();
                    }
                } catch (error) {
                    this.log('Error al registrar visita: ' + error.message, 'error');
                    this.updateStatus('Error al registrar visita: ' + error.message, 'error');
                }
                
                // Establecer actualización periódica
                setInterval(() => this.loadCount(), this.config.updateInterval);
                
                this.log('Contador inicializado correctamente');
            } catch (error) {
                this.log('Error al inicializar contador: ' + error.message, 'error');
                this.updateStatus('Error: ' + error.message, 'error');
                this.loadLocalCount();
                
                // Agregar link para diagnóstico
                this.showDiagnosticLink();
            }
        }
        
        // Diagnóstico del sistema
        async diagnosisSystem() {
            try {
                this.updateStatus('Ejecutando diagnóstico...', 'loading');
                
                // Verificar si el archivo PHP está accesible
                const phpAccessible = await this.checkFileAccess(this.config.phpEndpoint);
                
                if (!phpAccessible.success) {
                    return {
                        success: false,
                        error: 'El script PHP no está accesible. Verifica que "' + this.config.phpEndpoint + '" exista.',
                        details: phpAccessible
                    };
                }
                
                // Verificar si el archivo JSON existe
                const jsonAccessible = await this.checkFileAccess('visitors.json');
                
                // Verificar conectividad de red
                const networkOk = await this.checkNetworkConnectivity();
                
                return {
                    success: true,
                    php_accessible: phpAccessible.success,
                    json_accessible: jsonAccessible.success,
                    network: networkOk,
                    server_path: window.location.pathname
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Error durante el diagnóstico: ' + error.message
                };
            }
        }
        
        // Verificar acceso a un archivo
        async checkFileAccess(filePath) {
            try {
                const response = await fetch(filePath + '?check=1', {
                    method: 'HEAD',
                    cache: 'no-store'
                });
                
                return {
                    success: response.ok,
                    status: response.status,
                    statusText: response.statusText
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
        
        // Verificar conectividad de red
        async checkNetworkConnectivity() {
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(`https://www.google.com/favicon.ico?t=${timestamp}`, {
                    method: 'HEAD',
                    cache: 'no-store',
                    mode: 'no-cors'
                });
                
                return true;
            } catch (error) {
                return false;
            }
        }
        
        // Asegurar que el sistema está listo (archivo JSON creado)
        async ensureSystemReady() {
            try {
                this.updateStatus('Verificando sistema...', 'loading');
                
                const response = await this.fetchWithRetry(this.config.phpEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'initialize',
                        data: {
                            visitors: [],
                            count: 1,
                            last_updated: new Date().toISOString()
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Error de sistema (${response.status}): ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Error desconocido al inicializar el sistema');
                }
                
                this.updateStatus('Sistema listo', 'active');
                this.log('Sistema verificado:', data);
                return data;
            } catch (error) {
                this.log('Error al verificar sistema: ' + error.message, 'error');
                this.updateStatus('Error de sistema: ' + error.message, 'error');
                throw error;
            }
        }
        
        // Fetch con reintentos
        async fetchWithRetry(url, options = {}, retryCount = 0) {
            try {
                return await fetch(url, options);
            } catch (error) {
                if (retryCount < this.config.maxRetries) {
                    this.log(`Reintentando solicitud (${retryCount + 1}/${this.config.maxRetries})`, 'warn');
                    
                    // Esperar antes de reintentar
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                    
                    // Reintentar la solicitud
                    return this.fetchWithRetry(url, options, retryCount + 1);
                } else {
                    throw error;
                }
            }
        }
        
        // Cargar el conteo actual
        async loadCount() {
            try {
                const timestamp = new Date().getTime();
                const response = await this.fetchWithRetry(`${this.config.phpEndpoint}?t=${timestamp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'get'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Error al cargar conteo (${response.status}): ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Error desconocido al cargar conteo');
                }
                
                this.updateCounter(data.count);
                this.updateStatus('Conteo actualizado', 'active');
                
                // Guardar como respaldo
                localStorage.setItem('visitorCount', data.count);
                
                return data;
            } catch (error) {
                this.log('Error al cargar conteo: ' + error.message, 'error');
                this.updateStatus('Error al cargar datos: ' + error.message, 'error');
                
                // Intentar usar valor local
                this.loadLocalCount();
                
                return null;
            }
        }
        
        // Obtener la IP del visitante
        async getVisitorIP() {
            try {
                // Primero intentar con el servicio ipify
                const response = await this.fetchWithRetry(this.config.ipService);
                if (!response.ok) {
                    throw new Error('No se pudo obtener la IP desde el servicio principal');
                }
                
                const data = await response.json();
                return data.ip;
            } catch (error) {
                this.log('Error al obtener IP: ' + error.message, 'error');
                
                try {
                    // Servicio alternativo
                    const response = await this.fetchWithRetry('https://api.ipgeolocation.io/getip');
                    if (!response.ok) {
                        throw new Error('No se pudo obtener la IP desde servicio alternativo');
                    }
                    
                    const data = await response.json();
                    return data.ip;
                } catch (secondError) {
                    this.log('Error al obtener IP (segundo intento): ' + secondError.message, 'error');
                    return null;
                }
            }
        }
        
        // Registrar una nueva visita
        async registerVisit(ip) {
            try {
                this.updateStatus('Registrando visita...', 'loading');
                
                const response = await this.fetchWithRetry(this.config.phpEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ip: ip
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Error al registrar visita (${response.status}): ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Error desconocido al registrar visita');
                }
                
                this.updateCounter(data.count);
                this.updateStatus(data.was_new ? 'Nueva visita registrada' : 'Visita ya registrada', 'active');
                
                // Guardar en localStorage para referencia
                localStorage.setItem('visitorRegistered', 'true');
                localStorage.setItem('visitorIP', ip);
                localStorage.setItem('visitorCount', data.count);
                
                return data;
            } catch (error) {
                this.log('Error al registrar visita: ' + error.message, 'error');
                this.updateStatus('Error al registrar visita: ' + error.message, 'error');
                return null;
            }
        }
        
        // Mostrar enlace para diagnóstico
        showDiagnosticLink() {
            if (!this.statusElement) return;
            
            const diagLink = document.createElement('a');
            diagLink.href = 'create_visitors_json.php';
            diagLink.textContent = 'Diagnosticar sistema';
            diagLink.target = '_blank';
            diagLink.className = 'diagnostic-link';
            diagLink.style.display = 'block';
            diagLink.style.marginTop = '5px';
            diagLink.style.color = '#ff9800';
            diagLink.style.textDecoration = 'underline';
            
            this.statusElement.appendChild(diagLink);
        }
        
        // Actualizar el contador en la UI
        updateCounter(count) {
            if (!this.counterElement) return;
            
            const currentCount = parseInt(this.counterElement.textContent.replace(/,/g, '')) || 0;
            
            if (currentCount !== count) {
                const formattedCount = new Intl.NumberFormat().format(count);
                this.counterElement.textContent = formattedCount;
                
                // Efecto visual
                this.counterElement.classList.add('visitor-count-updated');
                setTimeout(() => {
                    this.counterElement.classList.remove('visitor-count-updated');
                }, 300);
            }
        }
        
        // Actualizar el mensaje de estado
        updateStatus(message, statusClass) {
            if (!this.statusElement) return;
            
            this.statusElement.textContent = message;
            this.statusElement.className = 'counter-status';
            
            if (statusClass) {
                this.statusElement.classList.add(statusClass);
            }
            
            // Esconder el mensaje de estado después de un tiempo si es exitoso
            if (statusClass === 'active') {
                setTimeout(() => {
                    this.statusElement.style.opacity = '0';
                    setTimeout(() => {
                        if (this.statusElement.classList.contains('active')) {
                            this.statusElement.textContent = '';
                        }
                        this.statusElement.style.opacity = '0.6';
                    }, 500);
                }, 3000);
            }
        }
        
        // Cargar contador desde localStorage como fallback
        loadLocalCount() {
            const count = parseInt(localStorage.getItem('visitorCount')) || this.config.fallbackCount;
            this.updateCounter(count);
        }
        
        // Utilidad para logs
        log(message, level = 'info', data = null) {
            if (!this.config.debugMode && level !== 'error') return;
            
            switch (level) {
                case 'error':
                    console.error(`[VisitorCounter] ${message}`, data || '');
                    break;
                case 'warn':
                    console.warn(`[VisitorCounter] ${message}`, data || '');
                    break;
                default:
                    console.log(`[VisitorCounter] ${message}`, data || '');
            }
        }
    }
    
    // Iniciar el contador cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        window.VisitorCounter = new VisitorCounter();
    });
})(); 