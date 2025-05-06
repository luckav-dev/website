// Sistema de cursor personalizado con partículas
(function() {
    // Configuración del cursor
    const cursorConfig = {
        cursorSize: 20,
        dotSize: 6,
        particlesCount: 10,
        particleLifespan: 800, // milisegundos
        particleColors: [
            'rgba(255, 255, 255, 0.9)',
            'rgba(150, 200, 255, 0.8)',
            'rgba(255, 150, 200, 0.8)',
            'rgba(200, 255, 150, 0.8)',
            'rgba(150, 150, 255, 0.8)'
        ],
        particleSizeRange: [2, 6],
        particleSpeedRange: [1, 4],
        gravitationalPull: 0.03,
        friction: 0.97,
        particleEmissionRate: 40, // ms entre partículas
        maxParticles: 40, // límite de partículas para mantener performance
        trailEffects: true, // habilitar efectos de trail
        showGlowEffects: true, // efectos de brillo adicionales
        mouseDownParticleBoost: 3 // multiplicador de partículas al hacer clic
    };
    
    // Variables principales
    let mouseX = 0;
    let mouseY = 0;
    let cursorRing = null;
    let cursorDot = null;
    let particlesContainer = null;
    let glowEffect = null;
    let particles = [];
    let lastParticleTime = 0;
    let isMoving = false;
    let isMouseDown = false;
    let movementTimer = null;
    let lastX = 0;
    let lastY = 0;
    let mouseSpeed = 0;
    let mouseVelocityX = 0;
    let mouseVelocityY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let animationFrameId = null;
    
    // Crear elementos del cursor
    function createCursorElements() {
        // Crear anillo exterior del cursor
        cursorRing = document.createElement('div');
        cursorRing.className = 'custom-cursor';
        document.body.appendChild(cursorRing);
        
        // Crear punto central del cursor
        cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        document.body.appendChild(cursorDot);
        
        // Crear contenedor de partículas
        particlesContainer = document.createElement('div');
        particlesContainer.className = 'cursor-particles-container';
        document.body.appendChild(particlesContainer);
        
        // Crear efecto de brillo
        if (cursorConfig.showGlowEffects) {
            glowEffect = document.createElement('div');
            glowEffect.style.position = 'fixed';
            glowEffect.style.width = '40px';
            glowEffect.style.height = '40px';
            glowEffect.style.borderRadius = '50%';
            glowEffect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)';
            glowEffect.style.pointerEvents = 'none';
            glowEffect.style.zIndex = '9996';
            glowEffect.style.transform = 'translate(-50%, -50%)';
            glowEffect.style.filter = 'blur(5px)';
            glowEffect.style.opacity = '0.7';
            document.body.appendChild(glowEffect);
        }
    }
    
    // Calcular velocidad del ratón
    function calculateMouseVelocity(e) {
        mouseVelocityX = e.clientX - lastMouseX;
        mouseVelocityY = e.clientY - lastMouseY;
        
        mouseSpeed = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        return mouseSpeed;
    }
    
    // Actualizar posición del cursor con mayor fluidez usando interpolación
    function updateCursorPosition(e) {
        if (!cursorRing || !cursorDot) return;
        
        // Guardar la posición actual del ratón
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Calcular velocidad del movimiento
        const speed = calculateMouseVelocity(e);
        
        // Usar una técnica de suavizado basada en la velocidad
        let smoothFactor = 0.15; // Valor base para movimiento fluido
        
        // Actualizar posición del punto central del cursor inmediatamente para mayor precisión
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
        
        // Aplicar un efecto más fluido para el anillo exterior
        let ringX = parseFloat(cursorRing.style.left || mouseX);
        let ringY = parseFloat(cursorRing.style.top || mouseY);
        
        if (isNaN(ringX)) ringX = mouseX;
        if (isNaN(ringY)) ringY = mouseY;
        
        // Ajustar factor de suavizado basado en la velocidad del movimiento
        if (speed > 20) {
            smoothFactor = 0.3; // Más rápido cuando el usuario mueve el ratón rápidamente
        } else if (speed < 5) {
            smoothFactor = 0.1; // Más suave cuando el movimiento es lento
        }
        
        // Calcular nueva posición con interpolación
        const nextRingX = ringX + (mouseX - ringX) * smoothFactor;
        const nextRingY = ringY + (mouseY - ringY) * smoothFactor;
        
        // Actualizar posición del anillo con interpolación suave
        cursorRing.style.left = `${nextRingX}px`;
        cursorRing.style.top = `${nextRingY}px`;
        
        // Actualizar efecto de brillo para seguir al cursor con suavidad
        if (glowEffect) {
            // El brillo sigue al cursor con un retraso aún mayor para un efecto más suave
            const glowSmoothFactor = smoothFactor * 0.8;
            
            let glowX = parseFloat(glowEffect.style.left || mouseX);
            let glowY = parseFloat(glowEffect.style.top || mouseY);
            
            if (isNaN(glowX)) glowX = mouseX;
            if (isNaN(glowY)) glowY = mouseY;
            
            const nextGlowX = glowX + (mouseX - glowX) * glowSmoothFactor;
            const nextGlowY = glowY + (mouseY - glowY) * glowSmoothFactor;
            
            glowEffect.style.left = `${nextGlowX}px`;
            glowEffect.style.top = `${nextGlowY}px`;
            
            // Ajustar tamaño del brillo según velocidad
            const glowSize = 40 + Math.min(speed * 2, 60);
            glowEffect.style.width = `${glowSize}px`;
            glowEffect.style.height = `${glowSize}px`;
            
            // Ajustar opacidad según velocidad
            glowEffect.style.opacity = Math.min(0.1 + speed * 0.02, 0.6);
        }
        
        // Detectar si el ratón está en movimiento
        if (lastX !== mouseX || lastY !== mouseY) {
            isMoving = true;
            clearTimeout(movementTimer);
            
            movementTimer = setTimeout(() => {
                isMoving = false;
            }, 100);
            
            lastX = mouseX;
            lastY = mouseY;
        }
        
        // Crear partículas cuando el ratón se mueve
        if (isMoving) {
            const now = Date.now();
            // Ajustar emisión de partículas según velocidad y si está haciendo clic
            const emissionRate = isMouseDown 
                ? cursorConfig.particleEmissionRate / cursorConfig.mouseDownParticleBoost 
                : cursorConfig.particleEmissionRate;
                
            if (now - lastParticleTime > emissionRate) {
                // Ajustar número de partículas según velocidad
                const particlesToCreate = Math.min(
                    Math.ceil(speed / 10), 
                    isMouseDown ? 5 : 3
                );
                
                // Crear múltiples partículas según la velocidad
                for (let i = 0; i < particlesToCreate; i++) {
                    if (particles.length < cursorConfig.maxParticles) {
                        createParticle();
                    }
                }
                lastParticleTime = now;
            }
        }
        
        // Solicitar el siguiente frame para una animación constante y fluida
        requestAnimationFrame(() => updatePosition());
    }
    
    // Función separada para actualizar la posición continuamente
    function updatePosition() {
        if (!cursorRing || !cursorDot) return;
        
        // Esta función se ejecuta en cada frame de animación para mantener actualizado el cursor
        // incluso cuando el ratón no se está moviendo, lo que permite animaciones más suaves
        
        // Solicitar el siguiente frame para una animación constante
        animationFrameId = requestAnimationFrame(updatePosition);
    }
    
    // Crear una nueva partícula
    function createParticle() {
        if (!particlesContainer) return;
        
        // Crear nueva partícula
        const particle = document.createElement('div');
        particle.className = 'cursor-particle';
        
        // Propiedades aleatorias para variedad
        const size = getRandomValue(cursorConfig.particleSizeRange[0], cursorConfig.particleSizeRange[1]);
        const color = cursorConfig.particleColors[Math.floor(Math.random() * cursorConfig.particleColors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = getRandomValue(cursorConfig.particleSpeedRange[0], cursorConfig.particleSpeedRange[1]);
        
        // Añadir velocidad basada en el movimiento del ratón
        const velocityInfluence = 0.2;
        const baseVx = Math.cos(angle) * speed;
        const baseVy = Math.sin(angle) * speed;
        const vx = baseVx + (mouseVelocityX * velocityInfluence);
        const vy = baseVy + (mouseVelocityY * velocityInfluence);
        
        // Aplicar estilos
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        
        // Posición ligeramente aleatoria alrededor del cursor
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        particle.style.left = `${mouseX + offsetX}px`;
        particle.style.top = `${mouseY + offsetY}px`;
        
        // Añadir un efecto de filtro aleatorio
        const filters = [
            'blur(0px)',
            'blur(1px)',
            'blur(0.5px) brightness(1.2)',
            'blur(0.7px) brightness(1.1)'
        ];
        particle.style.filter = filters[Math.floor(Math.random() * filters.length)];
        
        // Efectos especiales cuando el ratón está presionado
        if (isMouseDown) {
            particle.style.boxShadow = '0 0 8px ' + color;
        }
        
        // Añadir al DOM
        particlesContainer.appendChild(particle);
        
        // Añadir a la lista de partículas
        const newParticle = {
            element: particle,
            x: mouseX + offsetX,
            y: mouseY + offsetY,
            vx: vx,
            vy: vy,
            size: size,
            alpha: 1,
            color: color,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 4,
            createdAt: Date.now()
        };
        
        particles.push(newParticle);
        
        // Eliminar la partícula después de su tiempo de vida
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
            particles = particles.filter(p => p !== newParticle);
        }, cursorConfig.particleLifespan);
    }
    
    // Actualizar partículas en cada frame
    function updateParticles() {
        const now = Date.now();
        
        particles.forEach(particle => {
            // Calcular la edad de la partícula
            const age = now - particle.createdAt;
            const lifePercent = age / cursorConfig.particleLifespan;
            
            // Actualizar posición
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Reducir velocidad gradualmente (fricción)
            particle.vx *= cursorConfig.friction;
            particle.vy *= cursorConfig.friction;
            
            // Añadir un poco de gravedad
            particle.vy += cursorConfig.gravitationalPull;
            
            // Rotación de partículas para más dinamismo
            particle.rotation += particle.rotationSpeed;
            
            // Reducir opacidad gradualmente
            particle.alpha = 1 - lifePercent;
            
            // Reducir tamaño con el tiempo
            const sizeReduction = particle.size * 0.2 * lifePercent;
            
            // Aplicar cambios al elemento DOM
            particle.element.style.left = `${particle.x}px`;
            particle.element.style.top = `${particle.y}px`;
            particle.element.style.opacity = particle.alpha;
            particle.element.style.width = `${particle.size - sizeReduction}px`;
            particle.element.style.height = `${particle.size - sizeReduction}px`;
            
            // Aplicar rotación y escalado con transformación
            particle.element.style.transform = `rotate(${particle.rotation}deg) scale(${1 - lifePercent * 0.3})`;
            
            // Efecto de desvanecimiento en el color
            if (lifePercent > 0.7) {
                const endColor = `rgba(255, 255, 255, ${particle.alpha})`;
                particle.element.style.backgroundColor = endColor;
            }
        });
        
        requestAnimationFrame(updateParticles);
    }
    
    // Manejo de eventos de ratón en elementos interactivos
    function setupInteractiveElements() {
        const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (cursorRing) {
                    cursorRing.style.width = `${cursorConfig.cursorSize * cursorConfig.hoverScale}px`;
                    cursorRing.style.height = `${cursorConfig.cursorSize * cursorConfig.hoverScale}px`;
                    cursorRing.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    
                    // Efecto visual adicional al pasar por elementos interactivos
                    cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.9)';
                    cursorRing.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.4)';
                    
                    if (cursorDot) {
                        cursorDot.style.width = '8px';
                        cursorDot.style.height = '8px';
                        cursorDot.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                    }
                }
                
                // Crear un pequeño estallido de partículas
                for (let i = 0; i < 5; i++) {
                    if (particles.length < cursorConfig.maxParticles) {
                        setTimeout(() => createParticle(), i * 20);
                    }
                }
            });
            
            element.addEventListener('mouseleave', () => {
                if (cursorRing) {
                    cursorRing.style.width = `${cursorConfig.cursorSize}px`;
                    cursorRing.style.height = `${cursorConfig.cursorSize}px`;
                    cursorRing.style.backgroundColor = 'transparent';
                    cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                    cursorRing.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.2)';
                    
                    if (cursorDot) {
                        cursorDot.style.width = '6px';
                        cursorDot.style.height = '6px';
                        cursorDot.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.5)';
                    }
                }
            });
        });
    }
    
    // Responsive: deshabilitar en dispositivos móviles
    function setupResponsiveMode() {
        // Comprobar si es dispositivo móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        
        if (isMobile) {
            if (cursorRing) cursorRing.style.display = 'none';
            if (cursorDot) cursorDot.style.display = 'none';
            if (glowEffect) glowEffect.style.display = 'none';
            document.body.style.cursor = 'auto';
            document.documentElement.style.cursor = 'auto';
            
            // Restaurar cursor en elementos interactivos
            const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
            interactiveElements.forEach(element => {
                element.style.cursor = '';
            });
            
            return false;
        }
        
        return true;
    }
    
    // Función auxiliar para obtener valores aleatorios
    function getRandomValue(min, max) {
        return min + Math.random() * (max - min);
    }
    
    // Gestionar eventos de clic
    function handleMouseDown() {
        isMouseDown = true;
        
        if (cursorRing) {
            cursorRing.style.transform = 'translate(-50%, -50%) scale(0.8)';
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorRing.style.borderColor = 'rgba(255, 255, 255, 1)';
        }
        
        // Crear un estallido de partículas al hacer clic
        for (let i = 0; i < 8; i++) {
            if (particles.length < cursorConfig.maxParticles) {
                setTimeout(() => createParticle(), i * 10);
            }
        }
    }
    
    function handleMouseUp() {
        isMouseDown = false;
        
        if (cursorRing) {
            cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        }
    }
    
    // Función para soporte de dispositivos táctiles
    function setupTouchSupport() {
        // Detectar si es un dispositivo táctil
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (!isTouchDevice) return; // No es un dispositivo táctil
        
        // En dispositivos táctiles, mostrar el cursor personalizado solo en eventos táctiles
        document.addEventListener('touchstart', function(e) {
            if (!e.touches || !e.touches[0]) return;
            
            // Obtener posición del toque
            const touch = e.touches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            // Actualizar posición del cursor para seguir el toque
            if (cursorDot) {
                cursorDot.style.left = `${touchX}px`;
                cursorDot.style.top = `${touchY}px`;
                cursorDot.style.display = 'block';
            }
            
            if (cursorRing) {
                cursorRing.style.left = `${touchX}px`;
                cursorRing.style.top = `${touchY}px`;
                cursorRing.style.display = 'block';
            }
            
            // Crear partículas en el punto de toque
            mouseX = touchX;
            mouseY = touchY;
            isMouseDown = true;
            
            // Crear un estallido de partículas al tocar
            for (let i = 0; i < 5; i++) {
                if (particles.length < cursorConfig.maxParticles) {
                    setTimeout(() => createParticle(), i * 50);
                }
            }
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!e.touches || !e.touches[0]) return;
            
            // Obtener posición del toque
            const touch = e.touches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            // Actualizar posición del cursor para seguir el toque
            mouseX = touchX;
            mouseY = touchY;
            
            if (cursorDot) {
                cursorDot.style.left = `${touchX}px`;
                cursorDot.style.top = `${touchY}px`;
            }
            
            if (cursorRing) {
                cursorRing.style.left = `${touchX}px`;
                cursorRing.style.top = `${touchY}px`;
            }
            
            // Crear partículas al mover
            const now = Date.now();
            if (now - lastParticleTime > cursorConfig.particleEmissionRate * 2) {
                createParticle();
                lastParticleTime = now;
            }
        });
        
        document.addEventListener('touchend', function() {
            isMouseDown = false;
            
            // Ocultar cursor después de un tiempo
            setTimeout(() => {
                if (cursorDot) cursorDot.style.display = 'none';
                if (cursorRing) cursorRing.style.display = 'none';
            }, 1500);
        });
    }
    
    // Inicializar todo el sistema de cursor
    function initCustomCursor() {
        // Detectar si es dispositivo móvil primero
        if (!setupResponsiveMode()) return;
        
        // Crear elementos necesarios
        createCursorElements();
        
        // Configurar eventos
        document.addEventListener('mousemove', updateCursorPosition);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Configurar elementos interactivos
        setupInteractiveElements();
        
        // Iniciar animación de partículas
        updateParticles();
        
        // Recalcular en cambio de tamaño
        window.addEventListener('resize', setupResponsiveMode);
        
        // Inicialización adicional para dispositivos móviles
        setupTouchSupport();
    }
    
    // Llamada inicial segura cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomCursor);
    } else {
        initCustomCursor();
    }
})(); 