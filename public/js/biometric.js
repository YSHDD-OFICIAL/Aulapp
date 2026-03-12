/**
 * biometric.js - Manejo de huellas digitales
 * Simula comunicación con API Bridge RUNT
 */
const CEABiometric = (function() {
    const BIOMETRIC_API = 'http://localhost:8080/api/bridge';
    let currentSession = null;
    
    return {
        /**
         * Verificar huella del estudiante
         */
        async verifyStudentFinger(fingerId, studentId) {
            try {
                // Simular llamada a API Bridge
                const response = await fetch(`${BIOMETRIC_API}/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        finger: fingerId,
                        userId: studentId,
                        type: 'student',
                        timestamp: new Date().toISOString()
                    })
                });
                
                const result = await response.json();
                
                if (result.verified) {
                    this.logBiometricEvent('student_verified', studentId);
                }
                
                return result;
            } catch (error) {
                console.warn('API Bridge no disponible, modo simulación:', error);
                // Modo simulación para desarrollo
                return { verified: true, simulated: true };
            }
        },
        
        /**
         * Iniciar sesión con verificación biométrica
         */
        async startSession(studentId, instructorId, vehicleId) {
            const studentVerified = await this.verifyStudentFinger('index', studentId);
            const instructorVerified = await this.verifyStudentFinger('thumb', instructorId);
            
            if (studentVerified.verified && instructorVerified.verified) {
                currentSession = {
                    id: Date.now(),
                    studentId,
                    instructorId,
                    vehicleId,
                    startTime: new Date().toISOString(),
                    heartbeats: []
                };
                
                await CEADB.insert('sesiones', currentSession);
                this.startHeartbeat();
                
                return { success: true, session: currentSession };
            }
            
            return { success: false, error: 'Verificación biométrica falló' };
        },
        
        /**
         * Finalizar sesión
         */
        async endSession() {
            if (!currentSession) return false;
            
            const studentVerified = await this.verifyStudentFinger('index', currentSession.studentId);
            
            if (studentVerified.verified) {
                currentSession.endTime = new Date().toISOString();
                currentSession.minutesTotal = this.calculateMinutes(currentSession);
                
                await CEADB.update('sesiones', currentSession.id, currentSession);
                this.stopHeartbeat();
                
                return { success: true, session: currentSession };
            }
            
            return { success: false, error: 'Verificación de salida falló' };
        },
        
        /**
         * Sistema de heartbeats
         */
        startHeartbeat() {
            this.heartbeatInterval = setInterval(() => {
                if (!currentSession) return;
                
                const heartbeat = {
                    sessionId: currentSession.id,
                    timestamp: new Date().toISOString(),
                    type: 'active'
                };
                
                currentSession.heartbeats.push(heartbeat);
                
                // Guardar en IndexedDB
                CEADB.insert('heartbeats', heartbeat);
                
                // Si offline, registrar para sincronizar después
                if (!navigator.onLine) {
                    this.registerForSync(heartbeat);
                }
            }, 30000); // cada 30 segundos
        },
        
        stopHeartbeat() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
        },
        
        /**
         * Registrar para sincronización en segundo plano
         */
        registerForSync(heartbeat) {
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(reg => {
                    // Guardar en IndexedDB para sync
                    const request = indexedDB.open('PendingSyncDB', 1);
                    request.onsuccess = (event) => {
                        const db = event.target.result;
                        const tx = db.transaction('pending', 'readwrite');
                        const store = tx.objectStore('pending');
                        store.add(heartbeat);
                    };
                    
                    reg.sync.register('sync-heartbeats');
                });
            }
        },
        
        /**
         * Calcular minutos totales de la sesión
         */
        calculateMinutes(session) {
            if (!session.startTime || !session.endTime) return 0;
            
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            const diffMs = end - start;
            
            return Math.round(diffMs / 60000);
        },
        
        /**
         * Log de eventos biométricos
         */
        logBiometricEvent(event, userId) {
            const log = {
                event,
                userId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            // Guardar en LocalStorage
            const logs = JSON.parse(localStorage.getItem('biometric_logs') || '[]');
            logs.push(log);
            localStorage.setItem('biometric_logs', JSON.stringify(logs));
        },
        
        /**
         * Selector de dedos - UI Component
         */
        renderFingerSelector(requiredFinger) {
            const fingers = {
                'thumb': 'Pulgar',
                'index': 'Índice',
                'middle': 'Medio',
                'ring': 'Anular',
                'little': 'Meñique'
            };
            
            const hands = {
                'left': 'Izquierda',
                'right': 'Derecha'
            };
            
            return `
                <div class="finger-selector">
                    <div class="hands-container">
                        <div class="hand left-hand">
                            <h4>Mano Izquierda</h4>
                            <svg viewBox="0 0 200 300" class="hand-svg">
                                ${this.renderHand('left', requiredFinger)}
                            </svg>
                        </div>
                        <div class="hand right-hand">
                            <h4>Mano Derecha</h4>
                            <svg viewBox="0 0 200 300" class="hand-svg">
                                ${this.renderHand('right', requiredFinger)}
                            </svg>
                        </div>
                    </div>
                    <p class="finger-instruction">
                        Coloque el dedo <strong>${fingers[requiredFinger.split('_')[1]]} 
                        ${hands[requiredFinger.split('_')[0]]}</strong> en el lector
                    </p>
                </div>
            `;
        },
        
        renderHand(side, requiredFinger) {
            const fingers = ['thumb', 'index', 'middle', 'ring', 'little'];
            let svg = '';
            
            fingers.forEach((finger, index) => {
                const isRequired = requiredFinger === `${side}_${finger}`;
                const y = 50 + index * 40;
                
                svg += `
                    <rect 
                        x="${side === 'left' ? 20 : 120}" 
                        y="${y}" 
                        width="40" 
                        height="80" 
                        rx="10"
                        class="finger ${isRequired ? 'required' : ''}"
                        data-finger="${side}_${finger}"
                    />
                    <text 
                        x="${side === 'left' ? 40 : 140}" 
                        y="${y + 45}" 
                        text-anchor="middle"
                        fill="${isRequired ? 'white' : 'black'}"
                    >
                        ${finger}
                    </text>
                `;
            });
            
            return svg;
        }
    };
})();

window.CEABiometric = CEABiometric;