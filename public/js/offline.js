/**
 * offline.js - Gestión de modo offline
 * Sincronización, colas y almacenamiento offline-first
 * Versión: 1.0.0
 */

const CEAOffline = (function() {
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        SYNC_ON_CONNECT: true,
        MAX_RETRY_ATTEMPTS: 5,
        RETRY_DELAY: 5000,
        SYNC_INTERVAL: 30000,
        STORAGE_KEY: 'offline_queue',
        MAX_QUEUE_SIZE: 1000
    };

    // ===== ESTADO INTERNO =====
    let isOnline = navigator.onLine;
    let syncQueue = [];
    let syncTimer = null;
    let syncInProgress = false;
    let pendingRequests = new Map();

    // ===== INICIALIZACIÓN =====
    function init() {
        console.log('📴 Inicializando sistema offline...');

        loadQueue();
        setupNetworkListeners();
        startSyncTimer();

        console.log('✅ Sistema offline listo');
    }

    function setupNetworkListeners() {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Verificar estado inicial
        updateOnlineStatus();
    }

    function handleOnline() {
        console.log('🌐 Conexión restaurada');
        isOnline = true;
        updateOnlineStatus();

        if (CONFIG.SYNC_ON_CONNECT) {
            syncAll();
        }
    }

    function handleOffline() {
        console.log('📴 Conexión perdida');
        isOnline = false;
        updateOnlineStatus();

        // Mostrar notificación
        CEANotifications?.warning('Modo offline activado. Los datos se guardarán localmente.');
    }

    function updateOnlineStatus() {
        const event = new CustomEvent('cea-online-status', {
            detail: { online: isOnline }
        });
        document.dispatchEvent(event);
    }

    // ===== COLA DE SINCRONIZACIÓN =====
    function queueRequest(url, options = {}, metadata = {}) {
        const requestId = generateRequestId();

        const queueItem = {
            id: requestId,
            url,
            options: {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Offline-Id': requestId
                }
            },
            metadata: {
                timestamp: Date.now(),
                attempts: 0,
                priority: metadata.priority || 'normal',
                type: metadata.type || 'api',
                ...metadata
            },
            status: 'pending'
        };

        syncQueue.push(queueItem);
        saveQueue();

        console.log('📦 Solicitud encolada:', queueItem);

        // Intentar sincronizar inmediatamente si hay conexión
        if (isOnline) {
            processQueueItem(queueItem);
        }

        return requestId;
    }

    async function processQueueItem(item) {
        if (syncInProgress || !isOnline) return false;

        try {
            item.metadata.attempts++;
            item.status = 'processing';

            const response = await fetchWithRetry(item.url, item.options);
            
            if (response.ok) {
                // Éxito - remover de la cola
                syncQueue = syncQueue.filter(i => i.id !== item.id);
                saveQueue();

                // Disparar evento
                dispatchSyncEvent('success', item, await response.json());

                return true;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error procesando item:', error);

            if (item.metadata.attempts >= CONFIG.MAX_RETRY_ATTEMPTS) {
                // Marcar como fallido permanente
                item.status = 'failed';
                item.error = error.message;
                
                // Notificar
                CEANotifications?.error(`Fallo al sincronizar: ${error.message}`);
            } else {
                item.status = 'pending';
            }

            saveQueue();
            return false;
        }
    }

    async function processQueue() {
        if (syncInProgress || !isOnline) return;

        syncInProgress = true;

        const pendingItems = syncQueue.filter(i => i.status === 'pending');
        
        if (pendingItems.length === 0) {
            syncInProgress = false;
            return;
        }

        console.log(`🔄 Procesando ${pendingItems.length} items en cola...`);

        // Procesar por prioridad
        const prioritized = pendingItems.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
        });

        for (const item of prioritized) {
            await processQueueItem(item);
        }

        syncInProgress = false;
    }

    async function syncAll() {
        console.log('🔄 Iniciando sincronización completa...');
        await processQueue();
    }

    // ===== FETCH CON RETRY =====
    async function fetchWithRetry(url, options, retries = CONFIG.MAX_RETRY_ATTEMPTS) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok || response.status < 500) {
                    return response;
                }
            } catch (error) {
                console.warn(`Intento ${i + 1} falló:`, error);
            }

            if (i < retries - 1) {
                await wait(CONFIG.RETRY_DELAY * (i + 1));
            }
        }

        throw new Error('Máximo de reintentos alcanzado');
    }

    // ===== FETCH OFFLINE-FIRST =====
    async function fetchOffline(url, options = {}) {
        const {
            forceRefresh = false,
            cacheKey = url,
            cacheTime = 5 * 60 * 1000, // 5 minutos
            ...fetchOptions
        } = options;

        // Si estamos offline o forzamos usar cache
        if (!isOnline && !forceRefresh) {
            const cached = await getCachedResponse(cacheKey);
            if (cached) {
                console.log('📦 Usando respuesta cacheada:', cacheKey);
                return cached;
            }
        }

        try {
            const response = await fetch(url, fetchOptions);
            
            if (response.ok) {
                const data = await response.clone().json();
                
                // Guardar en cache
                await cacheResponse(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    headers: Object.fromEntries(response.headers)
                });

                return data;
            }

            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            // Si hay error y tenemos cache, usarlo
            const cached = await getCachedResponse(cacheKey);
            if (cached) {
                console.log('⚠️ Usando cache por error de red');
                return cached;
            }

            throw error;
        }
    }

    async function cacheResponse(key, data) {
        const cache = await caches.open('cea-offline-v1');
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(key, response);
    }

    async function getCachedResponse(key) {
        const cache = await caches.open('cea-offline-v1');
        const response = await cache.match(key);
        
        if (response) {
            const data = await response.json();
            
            // Verificar expiración
            if (data.timestamp && (Date.now() - data.timestamp) < CONFIG.CACHE_TIME) {
                return data.data;
            }
        }

        return null;
    }

    // ===== GESTIÓN DE COLAS =====
    function loadQueue() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                syncQueue = JSON.parse(saved);
                console.log(`📦 Cola cargada: ${syncQueue.length} items`);
            } catch (error) {
                console.error('Error cargando cola:', error);
                syncQueue = [];
            }
        }
    }

    function saveQueue() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(syncQueue));
        } catch (error) {
            console.error('Error guardando cola:', error);
        }
    }

    function clearQueue() {
        syncQueue = [];
        saveQueue();
        console.log('🗑️ Cola limpiada');
    }

    function getQueueStatus() {
        return {
            total: syncQueue.length,
            pending: syncQueue.filter(i => i.status === 'pending').length,
            processing: syncQueue.filter(i => i.status === 'processing').length,
            failed: syncQueue.filter(i => i.status === 'failed').length,
            completed: syncQueue.filter(i => i.status === 'completed').length
        };
    }

    // ===== SINCRONIZACIÓN PERIÓDICA =====
    function startSyncTimer() {
        syncTimer = setInterval(() => {
            if (isOnline && syncQueue.length > 0) {
                processQueue();
            }
        }, CONFIG.SYNC_INTERVAL);
    }

    function stopSyncTimer() {
        if (syncTimer) {
            clearInterval(syncTimer);
            syncTimer = null;
        }
    }

    // ===== UTILIDADES =====
    function generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function dispatchSyncEvent(type, item, data) {
        const event = new CustomEvent('cea-sync', {
            detail: { type, item, data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    function getStatus() {
        return {
            online: isOnline,
            queueSize: syncQueue.length,
            syncInProgress,
            pendingRequests: pendingRequests.size
        };
    }

    // ===== API PÚBLICA =====
    return {
        // Inicialización
        init,
        
        // Estado
        isOnline: () => isOnline,
        getStatus,
        
        // Fetch offline-first
        fetch: fetchOffline,
        
        // Cola de sincronización
        queueRequest,
        syncAll: processQueue,
        clearQueue,
        getQueue: () => [...syncQueue],
        getQueueStatus,
        
        // Cache
        cacheResponse,
        getCachedResponse,
        
        // Configuración
        CONFIG
    };
})();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    CEAOffline.init();
});

// Exponer globalmente
window.CEAOffline = CEAOffline;