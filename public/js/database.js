/**
 * database.js - Sistema de base de datos local
 * Utiliza IndexedDB para almacenamiento principal y LocalStorage para configuración
 * Versión: 1.0.0
 */

const CEADB = (function() {
    // ===== CONFIGURACIÓN =====
    const DB_NAME = 'CEABiometricoDB';
    const DB_VERSION = 2;
    const STORES = {
        usuarios: 'usuarios',
        vehiculos: 'vehiculos',
        sesiones: 'sesiones_clase',
        progreso: 'progreso',
        heartbeats: 'heartbeats',
        logs: 'logs'
    };

    const STORE_SCHEMAS = {
        usuarios: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'email', keyPath: 'email', options: { unique: true } },
                { name: 'documento', keyPath: 'numero_documento', options: { unique: true } },
                { name: 'tipo', keyPath: 'tipo_usuario' },
                { name: 'categoria', keyPath: 'categoria_aspirada' }
            ]
        },
        vehiculos: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'placa', keyPath: 'placa', options: { unique: true } },
                { name: 'categoria', keyPath: 'categoria' },
                { name: 'activo', keyPath: 'activo' }
            ]
        },
        sesiones: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'alumno', keyPath: 'alumno_id' },
                { name: 'instructor', keyPath: 'instructor_id' },
                { name: 'fecha', keyPath: 'fecha' },
                { name: 'estado', keyPath: 'estado' }
            ]
        },
        progreso: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'alumno', keyPath: 'alumno_id' },
                { name: 'tipo', keyPath: 'tipo' },
                { name: 'completado', keyPath: 'completado' }
            ]
        },
        heartbeats: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'sesion', keyPath: 'sesion_id' },
                { name: 'timestamp', keyPath: 'timestamp' }
            ]
        },
        logs: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'tipo', keyPath: 'tipo' },
                { name: 'fecha', keyPath: 'fecha' }
            ]
        }
    };

    // ===== ESTADO INTERNO =====
    let dbInstance = null;
    let isInitialized = false;
    let pendingTransactions = [];
    let syncQueue = [];

    // ===== INICIALIZACIÓN =====
    async function init() {
        console.log('🗄️ Inicializando base de datos...');

        try {
            await initIndexedDB();
            await initLocalStorage();
            await migrateData();
            
            isInitialized = true;
            console.log('✅ Base de datos inicializada correctamente');
            
            // Procesar transacciones pendientes
            processPendingTransactions();
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando base de datos:', error);
            return false;
        }
    }

    function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error abriendo IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                
                // Manejar desconexión/reconexión
                dbInstance.onclose = () => {
                    console.warn('Base de datos cerrada, reintentando...');
                    setTimeout(() => initIndexedDB(), 1000);
                };
                
                dbInstance.onversionchange = () => {
                    dbInstance.close();
                    console.log('Versión de BD cambiada, recargando...');
                    window.location.reload();
                };
                
                resolve(dbInstance);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                const transaction = event.target.transaction;

                console.log(`Actualizando BD de versión ${oldVersion} a ${DB_VERSION}`);

                // Crear stores según esquema
                Object.entries(STORES).forEach(([key, storeName]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const schema = STORE_SCHEMAS[key];
                        const store = db.createObjectStore(storeName, {
                            keyPath: schema.keyPath,
                            autoIncrement: schema.autoIncrement
                        });

                        // Crear índices
                        schema.indexes.forEach(index => {
                            store.createIndex(index.name, index.keyPath, index.options);
                        });

                        console.log(`Store creado: ${storeName}`);
                    }
                });

                // Migraciones por versión
                if (oldVersion < 1) {
                    migrateFromV0(db, transaction);
                }
                if (oldVersion < 2) {
                    migrateFromV1(db, transaction);
                }
            };
        });
    }

    function initLocalStorage() {
        // Configuración por defecto
        if (!localStorage.getItem('cea_config')) {
            localStorage.setItem('cea_config', JSON.stringify({
                theme: 'light',
                language: 'es',
                heartbeatInterval: 30,
                offlineMode: false,
                    syncEnabled: true,
                lastSync: null
            }));
        }

        // Requisitos por categoría (Ley 2026)
        if (!localStorage.getItem('cea_requirements')) {
            localStorage.setItem('cea_requirements', JSON.stringify({
                B1: { teoria: 25, practica: 25 },
                C1: { teoria: 30, practica: 35 },
                A2: { teoria: 25, practica: 15 }
            }));
        }

        // Cache de datos estáticos
        if (!localStorage.getItem('cea_cities')) {
            localStorage.setItem('cea_cities', JSON.stringify([
                { id: 1, nombre: 'Bogotá', departamento: 'Cundinamarca' },
                { id: 2, nombre: 'Medellín', departamento: 'Antioquia' },
                { id: 3, nombre: 'Cali', departamento: 'Valle del Cauca' },
                { id: 4, nombre: 'Barranquilla', departamento: 'Atlántico' },
                { id: 5, nombre: 'Cartagena', departamento: 'Bolívar' }
            ]));
        }

        // Tipos de sangre
        if (!localStorage.getItem('cea_blood_types')) {
            localStorage.setItem('cea_blood_types', JSON.stringify([
                'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
            ]));
        }

        // Categorías de licencia
        if (!localStorage.getItem('cea_categories')) {
            localStorage.setItem('cea_categories', JSON.stringify([
                { codigo: 'A1', nombre: 'Motocicleta hasta 125cc' },
                { codigo: 'A2', nombre: 'Motocicleta' },
                { codigo: 'B1', nombre: 'Automóvil' },
                { codigo: 'C1', nombre: 'Camión' }
            ]));
        }
    }

    // ===== MIGRACIONES =====
    function migrateFromV0(db, transaction) {
        console.log('Migrando desde versión 0...');
        // Implementar migraciones específicas si es necesario
    }

    function migrateFromV1(db, transaction) {
        console.log('Migrando desde versión 1...');
        // Implementar migraciones específicas si es necesario
    }

    async function migrateData() {
        // Verificar si hay datos en localStorage para migrar a IndexedDB
        const oldData = localStorage.getItem('cea_old_data');
        if (oldData) {
            try {
                const data = JSON.parse(oldData);
                await importData(data);
                localStorage.removeItem('cea_old_data');
                console.log('✅ Datos migrados desde localStorage');
            } catch (error) {
                console.error('Error migrando datos:', error);
            }
        }
    }

    // ===== OPERACIONES CRUD =====
    async function insert(storeName, data) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            // Agregar metadatos
            const record = {
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _sync: false
            };

            const request = store.add(record);

            request.onsuccess = (event) => {
                const id = event.target.result;
                record.id = id;
                
                // Registrar en cola de sincronización si es necesario
                if (navigator.onLine === false) {
                    addToSyncQueue('insert', storeName, record);
                }
                
                resolve(record);
            };

            request.onerror = () => {
                reject(new Error(`Error insertando en ${storeName}: ${request.error}`));
            };

            transaction.oncomplete = () => {
                console.log(`✅ Insertado en ${storeName}:`, record);
            };
        });
    }

    async function getById(storeName, id) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function getAll(storeName, filters = {}) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                let results = request.result;

                // Aplicar filtros
                if (Object.keys(filters).length > 0) {
                    results = results.filter(item => {
                        return Object.entries(filters).every(([key, value]) => {
                            return item[key] === value;
                        });
                    });
                }

                resolve(results);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async function update(storeName, id, data) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            // Obtener registro existente
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (!existing) {
                    reject(new Error(`Registro ${id} no encontrado en ${storeName}`));
                    return;
                }

                // Actualizar datos
                const updated = {
                    ...existing,
                    ...data,
                    updatedAt: new Date().toISOString(),
                    _sync: false
                };

                const putRequest = store.put(updated);

                putRequest.onsuccess = () => {
                    // Registrar en cola de sincronización
                    if (navigator.onLine === false) {
                        addToSyncQueue('update', storeName, updated);
                    }
                    resolve(updated);
                };

                putRequest.onerror = () => {
                    reject(new Error(`Error actualizando en ${storeName}: ${putRequest.error}`));
                };
            };

            getRequest.onerror = () => {
                reject(new Error(`Error obteniendo registro para actualizar: ${getRequest.error}`));
            };
        });
    }

    async function remove(storeName, id) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Obtener registro para backup
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const deleted = getRequest.result;
                
                const deleteRequest = store.delete(id);

                deleteRequest.onsuccess = () => {
                    // Registrar en cola de sincronización
                    if (navigator.onLine === false && deleted) {
                        addToSyncQueue('delete', storeName, { id, ...deleted });
                    }
                    resolve(true);
                };

                deleteRequest.onerror = () => {
                    reject(new Error(`Error eliminando en ${storeName}: ${deleteRequest.error}`));
                };
            };
        });
    }

    // ===== CONSULTAS ESPECIALIZADAS =====
    async function queryByIndex(storeName, indexName, value) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function getProgresoAlumno(alumnoId) {
        return await queryByIndex('progreso', 'alumno', alumnoId);
    }

    async function getSesionesAlumno(alumnoId) {
        return await queryByIndex('sesiones', 'alumno', alumnoId);
    }

    async function getSesionesActivas() {
        return await queryByIndex('sesiones', 'estado', 'active');
    }

    async function getVehiculosPorCategoria(categoria) {
        return await queryByIndex('vehiculos', 'categoria', categoria);
    }

    async function getVehiculosActivos() {
        return await queryByIndex('vehiculos', 'activo', true);
    }

    // ===== CÁLCULOS Y ESTADÍSTICAS =====
    async function calcularProgresoTotal(alumnoId) {
        const progreso = await getProgresoAlumno(alumnoId);
        
        if (progreso.length === 0) return 0;

        const totalMinutos = progreso.reduce((sum, p) => sum + (p.minutos_completados || 0), 0);
        const totalRequeridos = progreso.reduce((sum, p) => sum + (p.minutos_requeridos || 0), 0);

        return totalRequeridos > 0 ? Math.round((totalMinutos / totalRequeridos) * 100) : 0;
    }

    async function calcularHorasPorTipo(alumnoId, tipo) {
        const progreso = await getProgresoAlumno(alumnoId);
        const items = progreso.filter(p => p.tipo === tipo);
        
        const minutos = items.reduce((sum, p) => sum + (p.minutos_completados || 0), 0);
        return minutos / 60; // Convertir a horas
    }

    async function getDashboardStats(alumnoId) {
        const alumno = await getById('usuarios', alumnoId);
        if (!alumno) return null;

        const progreso = await getProgresoAlumno(alumnoId);
        const sesiones = await getSesionesAlumno(alumnoId);

        // Obtener requisitos de categoría
        const requirements = JSON.parse(localStorage.getItem('cea_requirements') || '{}');
        const req = requirements[alumno.categoria_aspirada] || { teoria: 25, practica: 25 };

        // Calcular horas
        const horasTeoria = progreso
            .filter(p => p.tipo === 'teoria')
            .reduce((sum, p) => sum + (p.minutos_completados || 0), 0) / 60;

        const horasPractica = progreso
            .filter(p => p.tipo === 'practica')
            .reduce((sum, p) => sum + (p.minutos_completados || 0), 0) / 60;

        const horasManejo = progreso
            .filter(p => p.tipo === 'manejo')
            .reduce((sum, p) => sum + (p.minutos_completados || 0), 0) / 60;

        return {
            nombre: alumno.nombre_completo,
            categoria: alumno.categoria_aspirada,
            progresoTotal: await calcularProgresoTotal(alumnoId),
            horasTeoria,
            horasPractica,
            horasManejo,
            sesionesCompletadas: sesiones.filter(s => s.estado === 'completed').length,
            sesionesActivas: sesiones.filter(s => s.estado === 'active').length,
            teoriaCompleta: horasTeoria >= req.teoria,
            puedeAgendarPractica: horasTeoria >= req.teoria
        };
    }

    // ===== SINCRONIZACIÓN =====
    function addToSyncQueue(operation, storeName, data) {
        syncQueue.push({
            id: Date.now() + Math.random().toString(36),
            operation,
            storeName,
            data,
            timestamp: new Date().toISOString(),
            attempts: 0
        });

        // Guardar cola
        localStorage.setItem('sync_queue', JSON.stringify(syncQueue));

        // Programar sincronización
        scheduleSync();
    }

    function scheduleSync() {
        if (navigator.onLine && syncQueue.length > 0) {
            setTimeout(() => sync(), 5000); // Esperar 5 segundos antes de sincronizar
        }
    }

    async function sync() {
        if (syncQueue.length === 0) return;

        console.log(`🔄 Sincronizando ${syncQueue.length} elementos...`);

        const successful = [];
        const failed = [];

        for (const item of syncQueue) {
            try {
                // Intentar sincronizar con servidor
                await syncToServer(item);
                successful.push(item);
            } catch (error) {
                console.error('Error sincronizando:', error);
                item.attempts++;
                
                if (item.attempts < 3) {
                    failed.push(item);
                }
            }
        }

        // Actualizar cola
        syncQueue = failed;
        localStorage.setItem('sync_queue', JSON.stringify(syncQueue));

        console.log(`✅ ${successful.length} sincronizados, ${failed.length} pendientes`);

        // Registrar evento
        await insert('logs', {
            tipo: 'sync',
            mensaje: `Sincronización completada: ${successful.length} éxitos, ${failed.length} fallos`,
            fecha: new Date().toISOString()
        });

        return { successful, failed };
    }

    async function syncToServer(item) {
        // Simular envío a servidor
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Datos sincronizados:', item);
                resolve({ success: true });
            }, 1000);
        });
    }

    // ===== BACKUP Y RESTORE =====
    async function exportData() {
        const data = {};

        for (const storeName of Object.values(STORES)) {
            data[storeName] = await getAll(storeName);
        }

        // Agregar metadatos
        data._metadata = {
            version: DB_VERSION,
            exportedAt: new Date().toISOString(),
            stores: Object.keys(STORES)
        };

        return data;
    }

    async function importD