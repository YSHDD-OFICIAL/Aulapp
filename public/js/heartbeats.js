/**
 * heartbeats.js - Sistema de latidos para tiempo real
 * Mantiene la sesión activa y calcula tiempo exacto
 * Versión: 1.0.0
 */

const CEAHeartbeat = (function() {
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        HEARTBEAT_INTERVAL: 30000, // 30 segundos
        MAX_MISSED_BEATS: 3,
        SYNC_INTERVAL: 60000, // 1 minuto
        STORAGE_KEY: 'heartbeats_cache',
        MAX_OFFLINE_STORAGE: 1000
    };

    // ===== ESTADO INTERNO =====
    let activeSessions = new Map();
    let heartbeatTimers = new Map();
    let syncTimer = null;
    let isOnline = navigator.onLine;
    let missedBeats = 0;

    // ===== INICIALIZACIÓN =====
    function init() {
        console.log('💓 Inicializando sistema de heartbeats...');

        // Cargar sesiones activas guardadas
        loadActiveSessions();

        // Configurar listeners de red
        setupNetworkListeners();

        // Iniciar sincronización periódica
        startSyncTimer();

        console.log('✅ Sistema de heartbeats listo');
    }

    function setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada, sincronizando heartbeats...');
            isOnline = true;
            syncPendingHeartbeats();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Conexión perdida, heartbeats guardados localmente');
            isOnline = false;
        });
    }

    // ===== GESTIÓN DE SESIONES =====
    function startSession(sessionId, metadata = {}) {
        if (activeSessions.has(sessionId)) {
            console.warn(`Sesión ${sessionId} ya tiene heartbeat activo`);
            return activeSessions.get(sessionId);
        }

        const session = {
            id: sessionId,
            startTime: Date.now(),
            lastBeat: Date.now(),
            beatCount: 0,
            metadata: {
                userId: metadata.userId,
                type: metadata.type || 'class',
                ...metadata
            },
            beats: [],
            status: 'active',
            missedBeats: 0
        };

        activeSessions.set(sessionId, session);

        // Iniciar timer
        const timer = setInterval(() => sendHeartbeat(sessionId), CONFIG.HEARTBEAT_INTERVAL);
        heartbeatTimers.set(sessionId, timer);

        // Enviar primer heartbeat
        sendHeartbeat(sessionId);

        // Guardar en localStorage
        saveActiveSessions();

        console.log(`💓 Heartbeat iniciado para sesión ${sessionId}`);
        
        return session;
    }

    function stopSession(sessionId, options = {}) {
        const {
            force = false,
            calculateDuration = true
        } = options;

        const session = activeSessions.get(sessionId);
        if (!session) return null;

        // Detener timer
        const timer = heartbeatTimers.get(sessionId);
        if (timer) {
            clearInterval(timer);
            heartbeatTimers.delete(sessionId);
        }

        // Calcular duración
        let duration = null;
        if (calculateDuration) {
            const lastBeat = session.lastBeat;
            const now = Date.now();
            duration = {
                milliseconds: now - session.startTime,
                seconds: Math.floor((now - session.startTime) / 1000),
                minutes: Math.floor((now - session.startTime) / 60000)
            };
        }

        // Actualizar sesión
        session.status = 'stopped';
        session.endTime = Date.now();
        session.duration = duration;

        // Guardar beats finales en base de datos
        saveSessionBeats(session);

        // Remover de sesiones activas
        activeSessions.delete(sessionId);
        saveActiveSessions();

        console.log(`💔 Heartbeat detenido para sesión ${sessionId}`, duration);

        return {
            session,
            duration
        };
    }

    function stopAllSessions() {
        const sessions = Array.from(activeSessions.keys());
        sessions.forEach(sessionId => stopSession(sessionId));
    }

    // ===== ENVÍO DE HEARTBEATS =====
    async function sendHeartbeat(sessionId) {
        const session = activeSessions.get(sessionId);
        if (!session) return;

        const heartbeat = {
            sessionId,
            timestamp: Date.now(),
            clientTime: new Date().toISOString(),
            beatNumber: session.beatCount + 1,
            online: isOnline,
            metadata: session.metadata
        };

        session.lastBeat = Date.now();
        session.beatCount++;
        session.beats.push(heartbeat);
        session.missedBeats = 0;

        // Guardar en base de datos local
        await saveHeartbeat(heartbeat);

        // Intentar enviar a servidor
        if (isOnline) {
            try {
                await sendToServer(heartbeat);
                heartbeat.synced = true;
            } catch (error) {
                console.warn('Error enviando heartbeat, guardado localmente:', error);
                queueForSync(heartbeat);
            }
        } else {
            queueForSync(heartbeat);
        }

        // Emitir evento
        dispatchHeartbeatEvent('heartbeat', heartbeat);

        return heartbeat;
    }

    async function saveHeartbeat(heartbeat) {
        try {
            await CEADB.insert('heartbeats', {
                session_id: heartbeat.sessionId,
                timestamp: heartbeat.clientTime,
                beat_number: heartbeat.beatNumber,
                metadata: heartbeat.metadata,
                synced: heartbeat.synced || false
            });
        } catch (error) {
            console.error('Error guardando heartbeat:', error);
        }
    }

    async function sendToServer(heartbeat) {
        // Simular envío a servidor
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('📡 Heartbeat enviado:', heartbeat.beatNumber);
                resolve({ success: true });
            }, 500);
        });
    }

    // ===== SINCRONIZACIÓN =====
    function queueForSync(heartbeat) {
        const queue = getSyncQueue();
        queue.push({
            ...heartbeat,
            queuedAt: Date.now()
        });

        // Mantener límite
        if (queue.length > CONFIG.MAX_OFFLINE_STORAGE) {
            queue.shift();
        }

        localStorage.setItem('heartbeat_sync_queue', JSON.stringify(queue));
    }

    function getSyncQueue() {
        const queue = localStorage.getItem('heartbeat_sync_queue');
        return queue ? JSON.parse(queue) : [];
    }

    async function syncPendingHeartbeats() {
        const queue = getSyncQueue();
        if (queue.length === 0) return;

        console.log(`🔄 Sincronizando ${queue.length} heartbeats pendientes...`);

        const successful = [];
        const failed = [];

        for (const heartbeat of queue) {
            try {
                await sendToServer(heartbeat);
                successful.push(heartbeat);
            } catch (error) {
                console.error('Error sincronizando heartbeat:', error);
                failed.push(heartbeat);
            }
        }

        // Actualizar cola
        localStorage.setItem('heartbeat_sync_queue', JSON.stringify(failed));

        // Marcar como sincronizados en BD
        for (const heartbeat of successful) {
            await markAsSynced(heartbeat.sessionId, heartbeat.beatNumber);
        }

        console.log(`✅ ${successful.length} sincronizados, ${failed.length} pendientes`);

        return { successful, failed };
    }

    async function markAsSynced(sessionId, beatNumber) {
        // Implementar marcado en base de datos
    }

    // ===== ESTADÍSTICAS =====
    async function getSessionStats(sessionId) {
        const session = activeSessions.get(sessionId);
        
        if (session) {
            // Sesión activa
            const now = Date.now();
            return {
                active: true,
                startTime: new Date(session.startTime).toISOString(),
                lastBeat: new Date(session.lastBeat).toISOString(),
                beatCount: session.beatCount,
                duration: {
                    milliseconds: now - session.startTime,
                    seconds: Math.floor((now - session.startTime) / 1000),
                    minutes: Math.floor((now - session.startTime) / 60000)
                },
                status: session.status,
                missedBeats: session.missedBeats
            };
        }

        // Sesión finalizada - consultar BD
        const heartbeats = await CEADB.queryByIndex('heartbeats', 'sesion', sessionId);
        
        if (heartbeats.length === 0) return null;

        const first = heartbeats[0];
        const last = heartbeats[heartbeats.length - 1];
        const startTime = new Date(first.timestamp).getTime();
        const endTime = new Date(last.timestamp).getTime();

        return {
            active: false,
            startTime: first.timestamp,
            endTime: last.timestamp,
            beatCount: heartbeats.length,
            duration: {
                milliseconds: endTime - startTime,
                seconds: Math.floor((endTime - startTime) / 1000),
                minutes: Math.floor((endTime - startTime) / 60000)
            }
        };
    }

    function getActiveSessions() {
        return Array.from(activeSessions.entries()).map(([id, session]) => ({
            id,
            startTime: new Date(session.startTime).toISOString(),
            lastBeat: new Date(session.lastBeat).toISOString(),
            beatCount: session.beatCount,
            metadata: session.metadata,
            status: session.status
        }));
    }

    // ===== UTILIDADES =====
    function saveActiveSessions() {
        const sessions = {};
        activeSessions.forEach((session, id) => {
            sessions[id] = {
                id: session.id,
                startTime: session.startTime,
                lastBeat: session.lastBeat,
                beatCount: session.beatCount,
                metadata: session.metadata,
                status: session.status
            };
        });
        localStorage.setItem('active_sessions', JSON.stringify(sessions));
    }

    function loadActiveSessions() {
        const saved = localStorage.getItem('active_sessions');
        if (saved) {
            try {
                const sessions = JSON.parse(saved);
                Object.values(sessions).forEach(session => {
                    // Verificar si la sesión debería seguir activa
                    const timeSinceLastBeat = Date.now() - session.lastBeat;
                    if (timeSinceLastBeat < CONFIG.HEARTBEAT_INTERVAL * CONFIG.MAX_MISSED_BEATS) {
                        activeSessions.set(session.id, {
                            ...session,
                            beats: [],
                            missedBeats: 0
                        });
                        
                        // Reanudar heartbeat
                        const timer = setInterval(() => sendHeartbeat(session.id), CONFIG.HEARTBEAT_INTERVAL);
                        heartbeatTimers.set(session.id, timer);
                    }
                });
            } catch (error) {
                console.error('Error cargando sesiones activas:', error);
            }
        }
    }

    function startSyncTimer() {
        syncTimer = setInterval(() => {
            if (isOnline) {
                syncPendingHeartbeats();
            }
        }, CONFIG.SYNC_INTERVAL);
    }

    function saveSessionBeats(session) {
        // Guardar todos los beats en BD
        session.beats.forEach(beat => saveHeartbeat(beat));
    }

    function dispatchHeartbeatEvent(type, data) {
        const event = new CustomEvent('cea-heartbeat', {
            detail: {
                type,
                data,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    function checkHealth() {
        return {
            activeSessions: activeSessions.size,
            pendingSync: getSyncQueue().length,
            isOnline,
            heartbeatTimers: heartbeatTimers.size,
            missedBeats: missedBeats
        };
    }

    // ===== API PÚBLICA =====
    return {
        // Inicialización
        init,
        
        // Gestión de sesiones
        startSession,
        stopSession,
        stopAllSessions,
        getActiveSessions,
        
        // Heartbeats
        sendHeartbeat,
        
        // Sincronización
        syncPendingHeartbeats,
        
        // Estadísticas
        getSessionStats,
        checkHealth,
        
        // Utilidades
        getSyncQueue,
        
        // Configuración
        CONFIG
    };
})();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    CEAHeartbeat.init();
});

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
    CEAHeartbeat.stopAllSessions();
});

// Exponer globalmente
window.CEAHeartbeat = CEAHeartbeat;