/**
 * offline.js - Gestión de modo offline
 */

const CEAOffline = (function() {
    let syncQueue = [];
    let isOnline = navigator.onLine;
    
    return {
        /**
         * Inicializar detector offline
         */
        init() {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
            
            // Verificar al inicio
            this.updateStatus();
            
            // Cargar cola pendiente
            this.loadQueue();
        },
        
        /**
         * Manejar cuando se recupera conexión
         */
        handleOnline() {
            isOnline = true;
            this.updateStatus();
            this.syncPendingData();
            this.showNotification('🟢 Conexión restaurada', 'success');
        },
        
        /**
         * Manejar pérdida de conexión
         */
        handleOffline() {
            isOnline = false;
            this.updateStatus();
            this.showNotification('🔴 Sin conexión - Trabajando offline', 'warning');
        },
        
        /**
         * Actualizar indicador visual
         */
        updateStatus() {
            let indicator = document.getElementById('offline-indicator');
            
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'offline-indicator';
                document.body.appendChild(indicator);
            }
            
            indicator.className = isOnline ? 'online' : 'offline';
            indicator.innerHTML = isOnline ? '🟢 En línea' : '🔴 Sin conexión';
        },
        
        /**
         * Guardar datos para sincronizar después
         */
        queueForSync(data) {
            const item = {
                id: Date.now(),
                data: data,
                timestamp: new Date().toISOString()
            };
            
            syncQueue.push(item);
            this.saveQueue();
            
            if (!isOnline) {
                this.showNotification('📦 Datos guardados localmente', 'info');
            }
        },
        
        /**
         * Sincronizar datos pendientes
         */
        async syncPendingData() {
            if (syncQueue.length === 0) return;
            
            this.showNotification(`Sincronizando ${syncQueue.length} elementos...`, 'info');
            
            let success = 0;
            let failed = 0;
            
            for (const item of syncQueue) {
                try {
                    // Intentar enviar al servidor
                    await this.sendToServer(item.data);
                    success++;
                } catch (error) {
                    console.error('Error sync:', error);
                    failed++;
                }
            }
            
            // Limpiar sincronizados
            syncQueue = syncQueue.filter(item => !item.synced);
            this.saveQueue();
            
            this.showNotification(
                `✅ ${success} sincronizados, ❌ ${failed} fallaron`,
                failed > 0 ? 'warning' : 'success'
            );
        },
        
        /**
         * Simular envío a servidor
         */
        async sendToServer(data) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log('Datos enviados:', data);
                    resolve({ success: true });
                }, 1000);
            });
        },
        
        /**
         * Guardar cola en localStorage
         */
        saveQueue() {
            localStorage.setItem('offline_queue', JSON.stringify(syncQueue));
        },
        
        /**
         * Cargar cola desde localStorage
         */
        loadQueue() {
            const saved = localStorage.getItem('offline_queue');
            if (saved) {
                syncQueue = JSON.parse(saved);
            }
        },
        
        /**
         * Verificar si hay datos cacheados
         */
        async hasCachedData(url) {
            const cache = await caches.open('cea-biometrico-v1');
            const response = await cache.match(url);
            return response !== undefined;
        },
        
        /**
         * Cachear URL manualmente
         */
        async cacheUrl(url) {
            const cache = await caches.open('cea-biometrico-v1');
            await cache.add(url);
        },
        
        /**
         * Mostrar notificación
         */
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `offline-notification ${type}`;
            notification.innerHTML = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        },
        
        /**
         * Obtener estado
         */
        getStatus() {
            return {
                online: isOnline,
                pendingSync: syncQueue.length,
                cachedUrls: syncQueue.length,
                lastSync: localStorage.getItem('last_sync')
            };
        },
        
        /**
         * Forzar sincronización
         */
        forceSync() {
            if (isOnline) {
                this.syncPendingData();
            } else {
                this.showNotification('No hay conexión para sincronizar', 'warning');
            }
        }
    };
})();

// Inicializar
CEAOffline.init();

window.CEAOffline = CEAOffline;