/**
 * biometric.js - Sistema de verificación biométrica
 * Integración con API Bridge RUNT y manejo de huellas digitales
 * Versión: 1.0.0
 */

const CEABiometric = (function() {
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        API_ENDPOINT: 'http://localhost:8080/api/bridge',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        SIMULATION_MODE: true, // Cambiar a false en producción
        FINGER_NAMES: {
            'left_thumb': 'Pulgar Izquierdo',
            'left_index': 'Índice Izquierdo',
            'left_middle': 'Medio Izquierdo',
            'left_ring': 'Anular Izquierdo',
            'left_little': 'Meñique Izquierdo',
            'right_thumb': 'Pulgar Derecho',
            'right_index': 'Índice Derecho',
            'right_middle': 'Medio Derecho',
            'right_ring': 'Anular Derecho',
            'right_little': 'Meñique Derecho'
        }
    };

    // ===== ESTADO INTERNO =====
    let currentSession = null;
    let deviceStatus = 'disconnected';
    let verificationQueue = [];
    let isProcessing = false;

    // ===== INICIALIZACIÓN =====
    async function init() {
        console.log('🔐 Inicializando sistema biométrico...');
        
        try {
            // Verificar disponibilidad del lector
            await checkDevice();
            
            // Cargar configuración guardada
            loadConfig();
            
            console.log('✅ Sistema biométrico listo');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando sistema biométrico:', error);
            return false;
        }
    }

    async function checkDevice() {
        if (CONFIG.SIMULATION_MODE) {
            deviceStatus = 'simulation';
            return true;
        }

        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}/status`, {
                method: 'GET',
                timeout: CONFIG.TIMEOUT
            });
            
            if (response.ok) {
                deviceStatus = 'connected';
                return true;
            } else {
                deviceStatus = 'error';
                return false;
            }
        } catch (error) {
            console.warn('Lector biométrico no disponible, usando modo simulación');
            deviceStatus = 'simulation';
            CONFIG.SIMULATION_MODE = true;
            return false;
        }
    }

    function loadConfig() {
        const saved = localStorage.getItem('biometric_config');
        if (saved) {
            Object.assign(CONFIG, JSON.parse(saved));
        }
    }

    // ===== VERIFICACIÓN DE HUELLAS =====
    async function verifyFinger(fingerCode, userId, options = {}) {
        const {
            timeout = CONFIG.TIMEOUT,
            retryAttempts = CONFIG.RETRY_ATTEMPTS,
            quality = 'high'
        } = options;

        console.log(`🔍 Verificando dedo: ${CONFIG.FINGER_NAMES[fingerCode] || fingerCode}`);

        // Validar dedo
        if (!isValidFinger(fingerCode)) {
            throw new Error('Código de dedo inválido');
        }

        // Verificar disponibilidad del dispositivo
        if (!CONFIG.SIMULATION_MODE && deviceStatus !== 'connected') {
            await checkDevice();
        }

        let attempts = 0;
        while (attempts < retryAttempts) {
            try {
                const result = await performVerification(fingerCode, userId, quality);
                
                if (result.verified) {
                    logBiometricEvent('verification_success', { fingerCode, userId });
                    return result;
                }

                attempts++;
                if (attempts < retryAttempts) {
                    await wait(1000 * attempts); // Esperar más entre intentos
                }
            } catch (error) {
                console.error(`Intento ${attempts + 1} falló:`, error);
                attempts++;
            }
        }

        logBiometricEvent('verification_failed', { fingerCode, userId, attempts });
        throw new Error('Verificación falló después de múltiples intentos');
    }

    async function performVerification(fingerCode, userId, quality) {
        if (CONFIG.SIMULATION_MODE) {
            // Simular verificación
            await wait(2000);
            
            // 90% de éxito en simulación
            const success = Math.random() < 0.9;
            
            if (success) {
                return {
                    verified: true,
                    match: 98.5,
                    quality: 'high',
                    timestamp: new Date().toISOString(),
                    simulated: true
                };
            } else {
                return {
                    verified: false,
                    error: 'Huella no coincide',
                    simulated: true
                };
            }
        }

        // Verificación real con API Bridge
        const response = await fetch(`${CONFIG.API_ENDPOINT}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                finger: fingerCode,
                userId: userId,
                quality: quality,
                timestamp: new Date().toISOString()
            }),
            timeout: CONFIG.TIMEOUT
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.json();
    }

    // ===== SESIONES BIOMÉTRICAS =====
    async function startSession(studentId, instructorId, vehicleId) {
        console.log('🎬 Iniciando sesión biométrica...');

        // Verificar huella del estudiante
        const studentResult = await verifyFinger('right_index', studentId, {
            quality: 'high',
            retryAttempts: 2
        });

        if (!studentResult.verified) {
            throw new Error('Verificación de estudiante falló');
        }

        // Verificar huella del instructor
        const instructorResult = await verifyFinger('right_thumb', instructorId, {
            quality: 'high',
            retryAttempts: 2
        });

        if (!instructorResult.verified) {
            throw new Error('Verificación de instructor falló');
        }

        // Crear sesión
        currentSession = {
            id: generateSessionId(),
            studentId,
            instructorId,
            vehicleId,
            startTime: new Date().toISOString(),
            studentVerified: true,
            instructorVerified: true,
            heartbeats: [],
            status: 'active'
        };

        // Guardar en base de datos
        await CEADB.insert('sesiones', currentSession);

        logBiometricEvent('session_started', {
            sessionId: currentSession.id,
            studentId,
            instructorId
        });

        return {
            success: true,
            session: currentSession
        };
    }

    async function endSession() {
        if (!currentSession) {
            throw new Error('No hay sesión activa');
        }

        console.log('🏁 Finalizando sesión biométrica...');

        // Verificar huella de salida del estudiante
        const studentResult = await verifyFinger('right_index', currentSession.studentId, {
            quality: 'high',
            retryAttempts: 2
        });

        if (!studentResult.verified) {
            throw new Error('Verificación de salida falló - No se sumarán las horas');
        }

        // Calcular duración
        const endTime = new Date();
        const startTime = new Date(currentSession.startTime);
        const durationMs = endTime - startTime;
        const durationMinutes = Math.round(durationMs / 60000);

        // Actualizar sesión
        currentSession.endTime = endTime.toISOString();
        currentSession.durationMinutes = durationMinutes;
        currentSession.studentExitVerified = true;
        currentSession.status = 'completed';

        // Guardar en base de datos
        await CEADB.update('sesiones', currentSession.id, currentSession);

        // Actualizar progreso del estudiante
        await updateStudentProgress(currentSession.studentId, durationMinutes);

        logBiometricEvent('session_ended', {
            sessionId: currentSession.id,
            duration: durationMinutes
        });

        const result = {
            success: true,
            session: { ...currentSession }
        };

        currentSession = null;
        return result;
    }

    async function updateStudentProgress(studentId, minutes) {
        const progreso = await CEADB.getProgresoAlumno(studentId);
        
        // Buscar o crear registro de progreso práctico
        let progresoPractica = progreso.find(p => p.tipo === 'practica' && p.modulo === 'Clases prácticas');
        
        if (!progresoPractica) {
            progresoPractica = {
                alumno_id: studentId,
                tipo: 'practica',
                modulo: 'Clases prácticas',
                minutos_completados: 0,
                minutos_requeridos: 1500, // 25 horas
                completado: false
            };
        }

        progresoPractica.minutos_completados += minutes;
        
        if (progresoPractica.minutos_completados >= progresoPractica.minutos_requeridos) {
            progresoPractica.completado = true;
        }

        progresoPractica.fecha_actualizacion = new Date().toISOString();

        if (progresoPractica.id) {
            await CEADB.update('progreso', progresoPractica.id, progresoPractica);
        } else {
            await CEADB.insert('progreso', progresoPractica);
        }
    }

    // ===== VERIFICACIÓN CONTINUA =====
    function startContinuousVerification(options = {}) {
        const {
            interval = 60000, // 1 minuto
            onSuccess,
            onFailure
        } = options;

        if (isProcessing) return;

        isProcessing = true;

        const verifyInterval = setInterval(async () => {
            if (!currentSession) {
                clearInterval(verifyInterval);
                isProcessing = false;
                return;
            }

            try {
                const result = await verifyFinger('right_index', currentSession.studentId, {
                    quality: 'medium',
                    retryAttempts: 1
                });

                if (result.verified) {
                    onSuccess?.();
                    currentSession.lastVerification = new Date().toISOString();
                } else {
                    onFailure?.('Verificación continua falló');
                }
            } catch (error) {
                console.error('Error en verificación continua:', error);
                onFailure?.(error.message);
            }
        }, interval);

        return {
            stop: () => {
                clearInterval(verifyInterval);
                isProcessing = false;
            }
        };
    }

    // ===== VALIDACIONES =====
    function isValidFinger(fingerCode) {
        return CONFIG.FINGER_NAMES.hasOwnProperty(fingerCode);
    }

    function getFingerName(fingerCode) {
        return CONFIG.FINGER_NAMES[fingerCode] || fingerCode;
    }

    // ===== GENERADORES =====
    function generateSessionId() {
        return 'ses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== LOGGING =====
    function logBiometricEvent(eventType, data) {
        const log = {
            type: eventType,
            timestamp: new Date().toISOString(),
            data,
            deviceStatus,
            simulationMode: CONFIG.SIMULATION_MODE
        };

        // Guardar en localStorage
        const logs = JSON.parse(localStorage.getItem('biometric_logs') || '[]');
        logs.push(log);
        
        // Mantener solo últimos 100 logs
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('biometric_logs', JSON.stringify(logs));

        console.log(`📝 Evento biométrico: ${eventType}`, data);
    }

    // ===== RENDERIZADO UI =====
    function renderFingerSelector(requiredFinger = 'left_index') {
        const hands = {
            left: ['thumb', 'index', 'middle', 'ring', 'little'],
            right: ['thumb', 'index', 'middle', 'ring', 'little']
        };

        const positions = {
            thumb: { x: 30, y: 50 },
            index: { x: 40, y: 90 },
            middle: { x: 50, y: 130 },
            ring: { x: 60, y: 170 },
            little: { x: 70, y: 210 }
        };

        let html = '<div class="finger-selector">';
        html += '<div class="hands-container">';

        // Mano izquierda
        html += '<div class="hand left-hand">';
        html += '<h4>Mano Izquierda</h4>';
        html += '<svg viewBox="0 0 100 250" class="hand-svg">';
        
        hands.left.forEach(finger => {
            const pos = positions[finger];
            const isRequired = `left_${finger}` === requiredFinger;
            const fingerId = `left_${finger}`;
            
            html += `
                <rect
                    x="${pos.x - 10}"
                    y="${pos.y - 20}"
                    width="20"
                    height="60"
                    rx="10"
                    class="finger ${isRequired ? 'required' : ''}"
                    data-finger="${fingerId}"
                    onmouseover="this.classList.add('hover')"
                    onmouseout="this.classList.remove('hover')"
                    onclick="CEABiometric.selectFinger('${fingerId}')"
                />
                <text
                    x="${pos.x}"
                    y="${pos.y + 15}"
                    text-anchor="middle"
                    fill="${isRequired ? 'white' : '#333'}"
                    font-size="8"
                >
                    ${finger}
                </text>
            `;
        });
        
        html += '</svg>';
        html += '</div>';

        // Mano derecha
        html += '<div class="hand right-hand">';
        html += '<h4>Mano Derecha</h4>';
        html += '<svg viewBox="0 0 100 250" class="hand-svg">';
        
        hands.right.forEach(finger => {
            const pos = positions[finger];
            const isRequired = `right_${finger}` === requiredFinger;
            const fingerId = `right_${finger}`;
            
            html += `
                <rect
                    x="${pos.x - 10}"
                    y="${pos.y - 20}"
                    width="20"
                    height="60"
                    rx="10"
                    class="finger ${isRequired ? 'required' : ''}"
                    data-finger="${fingerId}"
                    onmouseover="this.classList.add('hover')"
                    onmouseout="this.classList.remove('hover')"
                    onclick="CEABiometric.selectFinger('${fingerId}')"
                />
                <text
                    x="${pos.x}"
                    y="${pos.y + 15}"
                    text-anchor="middle"
                    fill="${isRequired ? 'white' : '#333'}"
                    font-size="8"
                >
                    ${finger}
                </text>
            `;
        });
        
        html += '</svg>';
        html += '</div>';
        html += '</div>';

        // Instrucción
        html += `
            <div class="finger-instruction">
                Coloque el dedo <strong>${getFingerName(requiredFinger)}</strong> en el lector
            </div>
        `;

        // Estado
        html += `
            <div class="biometric-status" id="biometric-status">
                <div class="status-indicator ${deviceStatus === 'connected' ? 'success' : 'waiting'}"></div>
                <span class="status-text">
                    ${deviceStatus === 'connected' ? 'Lector listo' : 
                      deviceStatus === 'simulation' ? 'Modo simulación' : 
                      'Esperando lector...'}
                </span>
            </div>
        `;

        html += '</div>';

        return html;
    }

    function selectFinger(fingerCode) {
        console.log('Dedo seleccionado:', fingerCode);
        
        // Actualizar UI
        document.querySelectorAll('.finger').forEach(f => {
            f.classList.remove('selected');
        });
        
        const selected = document.querySelector(`[data-finger="${fingerCode}"]`);
        if (selected) {
            selected.classList.add('selected');
        }

        // Emitir evento
        const event = new CustomEvent('fingerSelected', { detail: { finger: fingerCode } });
        document.dispatchEvent(event);
    }

    // ===== UTILIDADES =====
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getDeviceStatus() {
        return {
            status: deviceStatus,
            simulationMode: CONFIG.SIMULATION_MODE,
            apiEndpoint: CONFIG.API_ENDPOINT
        };
    }

    function getCurrentSession() {
        return currentSession ? { ...currentSession } : null;
    }

    function getVerificationHistory(limit = 10) {
        const logs = JSON.parse(localStorage.getItem('biometric_logs') || '[]');
        return logs.slice(-limit);
    }

    // ===== CONFIGURACIÓN =====
    function setSimulationMode(enabled) {
        CONFIG.SIMULATION_MODE = enabled;
        localStorage.setItem('biometric_config', JSON.stringify({ simulationMode: enabled }));
        console.log(`Modo simulación: ${enabled ? 'ON' : 'OFF'}`);
    }

    function setApiEndpoint(url) {
        CONFIG.API_ENDPOINT = url;
        localStorage.setItem('biometric_config', JSON.stringify({ apiEndpoint: url }));
    }

    // ===== API PÚBLICA =====
    return {
        // Inicialización
        init,
        
        // Verificación
        verifyFinger,
        startSession,
        endSession,
        startContinuousVerification,
        
        // UI
        renderFingerSelector,
        selectFinger,
        
        // Información
        getFingerName,
        getDeviceStatus,
        getCurrentSession,
        getVerificationHistory,
        
        // Configuración
        setSimulationMode,
        setApiEndpoint,
        
        // Utilidades
        wait
    };
})();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    CEABiometric.init();
});

// Exponer globalmente
window.CEABiometric = CEABiometric;