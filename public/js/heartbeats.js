/**
 * heartbeats.js - Sistema de latidos para tiempo real
 */
const CEAHeartbeat = (function() {
    let activeSessions = new Map();
    let syncQueue = [];
    
    return {
        /**
         * Iniciar heartbeat para una sesión
         */
        startSession(sessionId, studentId) {
            if (activeSessions.has(sessionId)) {
                console.warn('Sesión ya tiene heartbeat activo');
                return;
            }
            
            const session = {
                id: sessionId,
                studentId,
                startTime: Date.now(),
                lastBeat: Date.now(),
                beats: [],
                interval: setInterval(() => {
                    this.sendHeartbeat(sessionId);
                }, 30000) // cada 30 segundos
            };
            
            activeSessions.set(sessionId, session);
            
            // Enviar primer heartbeat
            this.sendHeartbeat(sessionId);
            
            console.log(`❤️ Heartbeat iniciado para sesión ${sessionId}`);
        },
        
        /**
         * Enviar heartbeat
         */
        async sendHeartbeat(sessionId) {
            const session = activeSessions.get(sessionId);
            if (!session) return;
            
            const heartbeat = {
                sessionId,
                timestamp: new Date().toISOString(),
                clientTime: Date.now(),
                userAgent: navigator.userAgent,
                online: navigator.onLine
            };
            
            session.lastBeat = Date.now();
            session.beats.push(heartbeat);
            
            // Guardar localmente
            await this.saveHeartbeat(heartbeat);
            
            // Intentar enviar si hay conexión
            if (navigator.onLine) {
                this.syncHeartbeats();
            }
        },
        
        /**
         * Guardar heartbeat en IndexedDB
         */
        async saveHeartbeat(heartbeat) {
            await CEADB.insert('heartbeats', heartbeat);
        },
        
        /**
         * Sincronizar heartbeats pendientes
         */
        async syncHeartbeats() {
            const heartbeats = await CEADB.getAll('heartbeats');
            const unsynced = heartbeats.filter(h => !h.synced);
            
            for (const beat of unsynced) {
                try {
                    // Simular envío a servidor
                    await this.sendToServer(beat);
                    
                    // Marcar como sincronizado
                    beat.synced = true;
                    await CEADB.update('heartbeats', beat.id, beat);
                    
                    console.log('✅ Heartbeat sincronizado:', beat.id);
                } catch (error) {
                    console.error('❌ Error sincronizando heartbeat:', error);
                }
            }
        },
        
        /**
         * Simular envío a servidor
         */
        async sendToServer(heartbeat) {
            return new Promise(resolve => {
                setTimeout(() => {
                    console.log('📡 Enviado al servidor:', heartbeat);
                    resolve({ success: true });
                }, 500);
            });
        },
        
        /**
         * Detener heartbeat
         */
        stopSession(sessionId) {
            const session = activeSessions.get(sessionId);
            if (session) {
                clearInterval(session.interval);
                activeSessions.delete(sessionId);
                
                // Calcular tiempo total
                const totalTime = Date.now() - session.startTime;
                const minutes = Math.round(totalTime / 60000);
                
                console.log(`⏱️ Sesión ${sessionId}: ${minutes} minutos`);
                
                return minutes;
            }
            return 0;
        },
        
        /**
         * Obtener estadísticas de heartbeats
         */
        async getStats(sessionId) {
            const heartbeats = await CEADB.getAll('heartbeats');
            const sessionBeats = heartbeats.filter(h => h.sessionId === sessionId);
            
            if (sessionBeats.length === 0) return null;
            
            const first = new Date(sessionBeats[0].timestamp);
            const last = new Date(sessionBeats[sessionBeats.length - 1].timestamp);
            const diffMs = last - first;
            const minutes = Math.round(diffMs / 60000);
            
            return {
                totalBeats: sessionBeats.length,
                startTime: first,
                endTime: last,
                durationMinutes: minutes,
                averageInterval: diffMs / (sessionBeats.length - 1) / 1000
            };
        },
        
        /**
         * Verificar salud de la conexión
         */
        getHealth() {
            return {
                activeSessions: activeSessions.size,
                online: navigator.onLine,
                lastSync: localStorage.getItem('lastHeartbeatSync'),
                pendingSync: activeSessions.size > 0 ? 'pending' : 'none'
            };
        }
    };
})();

window.CEAHeartbeat = CEAHeartbeat;

// Escuchar cambios de conexión
window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada - Sincronizando heartbeats');
    CEAHeartbeat.syncHeartbeats();
});

window.addEventListener('offline', () => {
    console.log('📴 Conexión perdida - Heartbeats guardados localmente');
});