/**
 * notifications.js - Notificaciones del sistema
 */

const CEANotifications = (function() {
    let permission = false;
    
    return {
        /**
         * Solicitar permiso para notificaciones
         */
        async requestPermission() {
            if (!('Notification' in window)) {
                console.log('Este navegador no soporta notificaciones');
                return false;
            }
            
            if (Notification.permission === 'granted') {
                permission = true;
                return true;
            }
            
            if (Notification.permission !== 'denied') {
                const result = await Notification.requestPermission();
                permission = result === 'granted';
                return permission;
            }
            
            return false;
        },
        
        /**
         * Enviar notificación
         */
        send(title, options = {}) {
            const defaultOptions = {
                body: 'Nueva notificación del sistema CEA',
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-72x72.png',
                vibrate: [200, 100, 200],
                tag: 'cea-notification',
                renotify: true,
                requireInteraction: true,
                actions: [
                    { action: 'ver', title: 'Ver' },
                    { action: 'cerrar', title: 'Cerrar' }
                ]
            };
            
            const notifOptions = { ...defaultOptions, ...options };
            
            if (permission) {
                const notification = new Notification(title, notifOptions);
                
                notification.onclick = (event) => {
                    event.preventDefault();
                    window.focus();
                    notification.close();
                    
                    if (options.onClick) {
                        options.onClick();
                    }
                };
                
                return notification;
            } else {
                // Fallback a alerta si no hay permisos
                this.fallbackAlert(title, options.body);
            }
        },
        
        /**
         * Notificación de clase próxima
         */
        classReminder(clase) {
            this.send('📅 Recordatorio de clase', {
                body: `Tienes clase de ${clase.tipo} en 30 minutos con ${clase.instructor}`,
                tag: 'class-reminder'
            });
        },
        
        /**
         * Notificación de verificación biométrica
         */
        biometricReminder() {
            this.send('🔐 Verificación biométrica requerida', {
                body: 'Por favor coloca tu huella para iniciar la sesión',
                tag: 'biometric-reminder',
                requireInteraction: true
            });
        },
        
        /**
         * Notificación de progreso
         */
        progressUpdate(porcentaje) {
            this.send('📊 Progreso actualizado', {
                body: `Has completado el ${porcentaje}% de tu curso`,
                tag: 'progress-update'
            });
        },
        
        /**
         * Notificación de logro
         */
        achievement(logro) {
            this.send('🏆 ¡Logro desbloqueado!', {
                body: `Has obtenido: ${logro}`,
                tag: 'achievement',
                vibrate: [500, 200, 500]
            });
        },
        
        /**
         * Notificación de error
         */
        error(mensaje) {
            this.send('❌ Error en el sistema', {
                body: mensaje,
                tag: 'error',
                requireInteraction: true
            });
        },
        
        /**
         * Notificación de sincronización
         */
        syncComplete(cantidad) {
            this.send('🔄 Sincronización completada', {
                body: `Se sincronizaron ${cantidad} elementos correctamente`,
                tag: 'sync'
            });
        },
        
        /**
         * Notificación de heartbeat perdido
         */
        heartbeatLost() {
            this.send('💔 Heartbeat perdido', {
                body: 'Se ha perdido la conexión, guardando localmente...',
                tag: 'heartbeat-lost'
            });
        },
        
        /**
         * Notificación programada
         */
        scheduleNotification(title, body, time) {
            const ahora = new Date();
            const programada = new Date(time);
            const diff = programada - ahora;
            
            if (diff > 0) {
                setTimeout(() => {
                    this.send(title, { body });
                }, diff);
                
                return true;
            }
            
            return false;
        },
        
        /**
         * Notificaciones del día
         */
        dailySummary(estadisticas) {
            const body = `
                Clases hoy: ${estadisticas.clasesHoy}
                Progreso: ${estadisticas.progreso}%
                Pendientes: ${estadisticas.pendientes}
            `;
            
            this.send('📋 Resumen diario', { body });
        },
        
        /**
         * Fallback si no hay notificaciones
         */
        fallbackAlert(title, message) {
            console.log(`[NOTIFICACIÓN] ${title}: ${message}`);
            
            // Mostrar toast si existe
            if (typeof CEAToast !== 'undefined') {
                CEAToast.show(message, title);
            }
        },
        
        /**
         * Verificar estado
         */
        checkStatus() {
            return {
                supported: 'Notification' in window,
                permission: Notification.permission,
                granted: permission
            };
        }
    };
})();

window.CEANotifications = CEANotifications;