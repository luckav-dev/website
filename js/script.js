// Variables para reproducción de video
let playAttempted = false;

// Función para iniciar el video
function playVideo() {
  const video = document.getElementById('backgroundVideo');
  if (video) {
    video.volume = 0.5;
    video.muted = false; // Asegurar que no esté silenciado
    
    // Intentar reproducir y manejar la promesa
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Error al iniciar video:", error);
        
        // Si falla, intentamos con interacción simulada
        document.body.click();
        
        // Intentamos de nuevo después de un pequeño retraso
        setTimeout(() => {
          video.play().catch(e => console.error("Segundo intento fallido:", e));
        }, 1000);
      });
    }
  }
}

// Intentar reproducir inmediatamente
playVideo();

// Intentar reproducir cuando la ventana cargue
window.addEventListener('load', playVideo);

// Intentar reproducir con el primer clic
document.addEventListener('click', function initOnFirstClick() {
  playVideo();
  document.removeEventListener('click', initOnFirstClick);
}, { once: true });

// Configurar audio después de 2 segundos
var audioInitialized = false;

// Esperar 2 segundos exactos para intentar activar audio
setTimeout(function() {
    initializeAudio();
}, 2000);

// Función para inicializar el audio
function initializeAudio() {
    if (audioInitialized) return;
    audioInitialized = true;
    
    try {
        // Acceder al iframe de audio
        var iframe = document.getElementById('audioIframe');
        if (iframe && iframe.contentWindow) {
            // Intentar enviar un mensaje al iframe para forzar la reproducción
            iframe.contentWindow.postMessage('play', '*');
            
            // También podemos intentar acceder directamente al audio si están en el mismo dominio
            try {
                var iframeVideo = iframe.contentWindow.document.getElementById('audioSource');
                if (iframeVideo) {
                    iframeVideo.volume = 0.5;
                    iframeVideo.muted = false;
                    iframeVideo.play();
                }
            } catch(e) {
                console.error("Error accediendo al iframe", e);
            }
        }
        
        // Intentar recargar iframe para forzar nuevos intentos
        setTimeout(function() {
            if (iframe) {
                iframe.src = iframe.src;
            }
        }, 500);
    } catch(e) {
        console.error("Error en inicialización de audio", e);
    }
}

// También iniciar cuando la página esté completamente cargada (por si acaso)
window.addEventListener('load', function() {
    // Esperar 2 segundos desde la carga
    setTimeout(initializeAudio, 2000);
});

// Iniciar con el primer clic por si todo lo demás falla
document.addEventListener('click', function firstClickHandler() {
    initializeAudio();
    document.removeEventListener('click', firstClickHandler);
});

// Animación del título
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
var str = 'JACAREZINHO\u00A0|\u00A0FEARLESS'; // non-breaking space
document.title = '';
async function typewriteTitle() {
  for (let i = 0; i < str.length; i++) {
    document.title += str.charAt(i);
    await sleep(100);
  }
}
typewriteTitle();

// Movimiento 3D
const card = document.querySelector('.card');
const title = document.querySelector('.card-title p');
const ascii = document.querySelector('.card-ascii-img');
const avatar = document.querySelector('.card-avatar img');

if (card) {
  card.addEventListener('mousemove', e => {
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const mouseX = e.clientX - cardCenterX;
    const mouseY = e.clientY - cardCenterY;

    if (title) title.style.transform = `translateZ(25px) translateX(${mouseX * 0.03}px) translateY(${mouseY * 0.03}px)`;
    if (ascii) ascii.style.transform = `translateZ(15px) translateX(${mouseX * 0.02}px) translateY(${mouseY * 0.02}px)`;
    if (avatar) avatar.style.transform = `translateZ(35px) translateX(${mouseX * 0.05}px) translateY(${mouseY * 0.05}px)`;

    const skills = document.querySelectorAll('.skill');
    if (skills.length > 0) {
      skills.forEach((skill, index) => {
        const delay = index * 0.05;
        const offsetX = mouseX * (0.01 + (index % 3) * 0.005);
        const offsetY = mouseY * (0.01 + (index % 2) * 0.005);
        skill.style.transform = `translateZ(${10 + index}px) translateX(${offsetX}px) translateY(${offsetY}px)`;
        skill.style.transitionDelay = `${delay}s`;
      });
    }
  });

  card.addEventListener('mouseleave', () => {
    if (title) title.style.transform = 'translateZ(20px)';
    if (ascii) ascii.style.transform = 'translateZ(10px)';
    if (avatar) avatar.style.transform = 'translateZ(30px)';

    const skills = document.querySelectorAll('.skill');
    if (skills.length > 0) {
      skills.forEach(skill => {
        skill.style.transform = '';
        skill.style.transitionDelay = '';
      });
    }

    [title, ascii, avatar].forEach(el => {
      if (el) {
        el.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
        setTimeout(() => {
          el.style.transition = '';
        }, 800);
      }
    });
  });
}

// Animación partículas brillo
const glows = document.querySelectorAll('.glow');
glows.forEach(glow => {
    setInterval(() => {
        const randomX = Math.random() * window.innerWidth;
        const randomY = Math.random() * window.innerHeight;
        glow.style.transition = 'all 15s cubic-bezier(0.1, 0.7, 0.5, 1)';
        glow.style.left = `${randomX}px`;
        glow.style.top = `${randomY}px`;
    }, 10000);
});

// Animación skills
const skills = document.querySelectorAll('.skill');
skills.forEach((skill, index) => {
    skill.style.opacity = '0';
    skill.style.transform = 'translateY(20px)';

    setTimeout(() => {
        skill.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        skill.style.opacity = '1';
        skill.style.transform = 'translateY(0)';
    }, 1000 + index * 100);
});

// Contador de visitas en tiempo real basado en IPs únicas
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar inmediatamente al cargar
    initUniqueVisitorCounter();
    
    // También actualizar cuando el usuario vuelve a la página
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            loadVisitorCountFromJSON();
        }
    });
    
    // Verificar actualizaciones cada 30 segundos si la página sigue abierta
    setInterval(loadVisitorCountFromJSON, 30000);
});

// Función para iniciar el contador y verificar el archivo visitors.json
async function initUniqueVisitorCounter() {
    // Obtener el elemento del contador
    const visitorCountElement = document.getElementById('visitorCount');
    if (!visitorCountElement) return;
    
    try {
        // Intentar crear o verificar el archivo JSON mediante una solicitud inicial
        await ensureVisitorsFileExists();
        
        // Cargar el conteo inicial desde el archivo JSON
        await loadVisitorCountFromJSON();
        
        // Obtener la IP del usuario usando un servicio externo
        const ipData = await getVisitorIP();
        
        if (!ipData || !ipData.ip) {
            console.error('No se pudo obtener la IP del visitante');
            fallbackToLocalCounter();
            return;
        }
        
        const visitorIP = ipData.ip;
        
        // Verificar si esta IP ya ha sido registrada
        const isNewVisitor = !hasVisitorBeenCounted(visitorIP);
        
        if (isNewVisitor) {
            // Es un nuevo visitante, registrar su IP y actualizar el contador
            await registerNewVisitor(visitorIP);
        }
        
        // Establecer un intervalo para verificar cambios en el archivo JSON
        setInterval(loadVisitorCountFromJSON, 30000); // Verificar cada 30 segundos
    } catch (error) {
        console.error('Error al inicializar el contador de visitantes únicos:', error);
        updateCounterStatus('Error de inicialización', 'error');
        fallbackToLocalCounter();
    }
}

// Función para asegurar que el archivo visitors.json existe
async function ensureVisitorsFileExists() {
    updateCounterStatus('Verificando sistema...', 'loading');
    
    try {
        // Crear objeto inicial si no existe el archivo
        const initialData = {
            visitors: [],
            count: 1,
            last_updated: new Date().toISOString()
        };
        
        // Intentar escribir en el archivo o crearlo si no existe
        const response = await fetch('update_visitors.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                action: 'initialize',
                data: initialData
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error al inicializar el archivo (${response.status})`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            updateCounterStatus('Sistema inicializado correctamente', 'active');
            console.log('Archivo de visitantes verificado:', result);
            return true;
        } else {
            throw new Error(result.error || 'Error al inicializar el sistema');
        }
    } catch (error) {
        console.error('Error al verificar archivo JSON:', error);
        updateCounterStatus('Error: ' + error.message, 'error');
        return false;
    }
}

// Función para cargar el conteo de visitantes desde el archivo JSON
async function loadVisitorCountFromJSON() {
    updateCounterStatus('Cargando...', 'loading');
    
    try {
        // Usar un timestamp para evitar el caché del navegador
        const timestamp = new Date().getTime();
        // Probar diferentes rutas para encontrar el archivo
        let response = null;
        let data = null;
        
        // Lista de rutas a intentar
        const paths = [
            `./visitors.json?t=${timestamp}`,
            `/visitors.json?t=${timestamp}`,
            `../visitors.json?t=${timestamp}`,
            `get_visitors.php?t=${timestamp}`
        ];
        
        // Intentar cada ruta hasta encontrar una que funcione
        for (const path of paths) {
            try {
                const tempResponse = await fetch(path);
                if (tempResponse.ok) {
                    response = tempResponse;
                    data = await response.json();
                    console.log(`Archivo JSON cargado exitosamente desde: ${path}`);
                    updateCounterStatus(`Datos cargados desde ${path}`, 'active');
                    break;
                }
            } catch (pathError) {
                console.warn(`No se pudo cargar desde ${path}:`, pathError);
            }
        }
        
        // Si después de intentar todas las rutas, no tenemos datos
        if (!data) {
            // Último intento: solicitar al script PHP actualizar visitantes
            try {
                console.log('Intentando usar update_visitors.php como último recurso');
                updateCounterStatus('Usando script alternativo...', 'loading');
                
                const updateResponse = await fetch('update_visitors.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        ip: 'consulta',
                        action: 'get'
                    })
                });
                
                if (updateResponse.ok) {
                    data = await updateResponse.json();
                    updateCounterStatus('Datos recuperados del servidor', 'active');
                } else {
                    throw new Error('Todos los métodos de obtención fallaron');
                }
            } catch (finalError) {
                console.error('Error en último intento:', finalError);
                throw new Error('No se pudo obtener el conteo de visitantes');
            }
        }
        
        // Actualizar la visualización con los datos obtenidos
        if (data) {
            const visitorCountElement = document.getElementById('visitorCount');
            if (visitorCountElement) {
                const currentCount = parseInt(visitorCountElement.textContent.replace(/,/g, '')) || 0;
                const jsonCount = data.count || 0;
                
                // Solo actualizar si el conteo ha cambiado
                if (currentCount !== jsonCount) {
                    const formattedCount = new Intl.NumberFormat().format(jsonCount);
                    visitorCountElement.textContent = formattedCount;
                    
                    // Efecto visual para el contador
                    visitorCountElement.classList.add('visitor-count-updated');
                    setTimeout(() => {
                        visitorCountElement.classList.remove('visitor-count-updated');
                    }, 300);
                    
                    console.log('Contador de visitantes actualizado desde JSON:', jsonCount);
                }
            }
            
            return data;
        }
    } catch (error) {
        console.error('Error al cargar visitors.json:', error);
        updateCounterStatus('Error al cargar datos', 'error');
        
        // Usar datos almacenados localmente como respaldo
        const visitorsRecord = JSON.parse(localStorage.getItem('visitorsRecord')) || { visitors: [], count: 1 };
        const visitorCountElement = document.getElementById('visitorCount');
        if (visitorCountElement) {
            const formattedCount = new Intl.NumberFormat().format(visitorsRecord.count);
            visitorCountElement.textContent = formattedCount;
        }
        
        return null;
    }
}

// Función para obtener la IP del visitante
async function getVisitorIP() {
    try {
        // Usando un servicio público para obtener la IP
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Error al obtener la IP');
        return await response.json();
    } catch (error) {
        console.error('Error obteniendo IP:', error);
        return null;
    }
}

// Función para verificar si el visitante ya ha sido contado
function hasVisitorBeenCounted(ip) {
    // Obtener el registro de visitantes del localStorage
    const visitorsRecord = JSON.parse(localStorage.getItem('visitorsRecord')) || { visitors: [], count: 0 };
    
    // Verificar si la IP ya está en la lista
    return visitorsRecord.visitors.includes(ip);
}

// Función para registrar un nuevo visitante
async function registerNewVisitor(ip) {
    try {
        updateCounterStatus('Registrando nuevo visitante...', 'loading');
        
        // Enviar la solicitud al servidor para actualizar el contador
        const response = await fetch('update_visitors.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip: ip })
        });
        
        if (!response.ok) {
            throw new Error(`Error al registrar visitante: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Actualizar el contador en localStorage para referencia
            const visitorsRecord = JSON.parse(localStorage.getItem('visitorsRecord')) || { visitors: [], count: 0 };
            
            // Añadir la nueva IP y actualizar el contador
            if (!visitorsRecord.visitors.includes(ip)) {
                visitorsRecord.visitors.push(ip);
                visitorsRecord.count = result.count;
                visitorsRecord.last_updated = new Date().toISOString();
                
                // Guardar los cambios en localStorage
                localStorage.setItem('visitorsRecord', JSON.stringify(visitorsRecord));
            }
            
            // Mostrar el nuevo conteo
            const visitorCountElement = document.getElementById('visitorCount');
            if (visitorCountElement) {
                const formattedCount = new Intl.NumberFormat().format(result.count);
                visitorCountElement.textContent = formattedCount;
                
                // Efecto visual para el contador
                visitorCountElement.classList.add('visitor-count-updated');
    setTimeout(() => {
                    visitorCountElement.classList.remove('visitor-count-updated');
                }, 300);
            }
            
            updateCounterStatus(result.was_new ? 'Nuevo visitante registrado!' : 'Visitante ya registrado', result.was_new ? 'active' : 'info');
        } else {
            throw new Error(result.error || 'Error desconocido al registrar visitante');
        }
    } catch (error) {
        console.error('Error al registrar nuevo visitante:', error);
        updateCounterStatus('Error al registrar: ' + error.message, 'error');
        
        // Si no podemos registrar en el servidor, actualizar localmente como respaldo
        fallbackToLocalCounter();
    }
}

// Función para actualizar el estado del contador en la UI
function updateCounterStatus(message, statusClass) {
    const statusElement = document.getElementById('counterStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'counter-status';
        if (statusClass) {
            statusElement.classList.add(statusClass);
        }
        
        // Limpiar el mensaje después de 5 segundos si fue exitoso
        if (statusClass === 'active') {
            setTimeout(() => {
                statusElement.style.opacity = '0';
                setTimeout(() => {
                    if (statusElement.classList.contains('active')) {
                        statusElement.textContent = '';
                    }
                    statusElement.style.opacity = '0.6';
                }, 500);
            }, 5000);
        }
    }
}

// Control de audio con tecla espacio
let audioEnabled = false;

// Función para activar/desactivar el audio
function toggleAudio() {
    // 1. Obtener el video principal
    const video = document.getElementById('backgroundVideo');
    
    // 2. Obtener el iframe de audio
    const iframe = document.getElementById('audioIframe');
    
    // 3. Crear un botón de audio para referencia
    const audioToggleButton = document.getElementById('audioToggleButton');
    const audioIcon = audioToggleButton?.querySelector('.audio-icon');
    
    // Invertir el estado
    audioEnabled = !audioEnabled;
    
    // Si el audio está habilitado
    if (audioEnabled) {
        // Intentar activar el audio
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage('play', '*');
                
                try {
                    const iframeVideo = iframe.contentWindow.document.getElementById('audioSource');
                    if (iframeVideo) {
                        iframeVideo.volume = 0.5;
                        iframeVideo.play();
                        iframeVideo.muted = false;
                    }
                } catch(e) {
                    console.error("Error accessing iframe audio", e);
                }
            } catch(e) {
                console.error("Error sending message to iframe", e);
            }
        }
        
        // Silenciar el video para que no interfiera
        if (video) {
            video.muted = true;
        }
        
        // Actualizar la UI
        if (audioToggleButton) {
            audioToggleButton.classList.add('active');
            if (audioIcon) audioIcon.classList.remove('muted');
        }
    } else {
        // Si el audio está deshabilitado
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage('pause', '*');
                
                try {
                    const iframeVideo = iframe.contentWindow.document.getElementById('audioSource');
                    if (iframeVideo) {
                        iframeVideo.pause();
                    }
                } catch(e) {
                    console.error("Error accessing iframe audio", e);
                }
            } catch(e) {
                console.error("Error sending message to iframe", e);
            }
        }
        
        // Actualizar la UI
        if (audioToggleButton) {
            audioToggleButton.classList.remove('active');
            if (audioIcon) audioIcon.classList.add('muted');
        }
    }
}

// Inicialización del botón de audio
document.addEventListener('DOMContentLoaded', function() {
    const audioToggleButton = document.getElementById('audioToggleButton');
    if (audioToggleButton) {
        audioToggleButton.addEventListener('click', toggleAudio);
    }
});

// Escuchar la tecla de espacio para alternar el audio
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !event.repeat && 
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
        event.preventDefault(); // Prevenir scroll
        toggleAudio();
    }
});

// Función de respaldo al contador local si todo falla
function fallbackToLocalCounter() {
    // Obtener el elemento del contador
    const visitorCountElement = document.getElementById('visitorCount');
    if (!visitorCountElement) return;
    
    // Obtener el contador actual del localStorage, iniciar en 1 si no existe
    let count = parseInt(localStorage.getItem('simpleVisitorCount')) || 1;
    
    // Incrementar el contador solo si no está la marca hasVisitedSimple
    if (!localStorage.getItem('hasVisitedSimple')) {
        count++;
        localStorage.setItem('hasVisitedSimple', 'true');
    }
    
    // Guardar el nuevo valor en localStorage
    localStorage.setItem('simpleVisitorCount', count.toString());
    
    // Formatear y mostrar el número con separadores de miles
    const formattedCount = new Intl.NumberFormat().format(count);
    visitorCountElement.textContent = formattedCount;
    
    // Efecto visual para el contador
    visitorCountElement.classList.add('visitor-count-updated');
    setTimeout(() => {
        visitorCountElement.classList.remove('visitor-count-updated');
    }, 300);
}