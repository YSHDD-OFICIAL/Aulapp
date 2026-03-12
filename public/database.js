/**
 * database.js - Sistema de almacenamiento híbrido
 * Utiliza IndexedDB para datos grandes y LocalStorage para configuración
 */

const CEADB = (function() {
    const DB_NAME = 'CEABiometricoDB';
    const DB_VERSION = 1;
    const STORES = ['usuarios', 'vehiculos', 'sesiones', 'progreso', 'heartbeats'];
    
    let dbInstance = null;
    
    /**
     * Inicializar IndexedDB
     */
    async function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                dbInstance = request.result;
                resolve(dbInstance);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear stores si no existen
                STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        
                        // Crear índices según el store
                        switch(storeName) {
                            case 'usuarios':
                                store.createIndex('email', 'email', { unique: true });
                                store.createIndex('documento', 'numero_documento', { unique: true });
                                store.createIndex('tipo', 'tipo_usuario');
                                break;
                            case 'vehiculos':
                                store.createIndex('placa', 'placa', { unique: true });
                                store.createIndex('categoria', 'categoria');
                                break;
                            case 'sesiones':
                                store.createIndex('alumno', 'alumno_id');
                                store.createIndex('fecha', 'fecha');
                                break;
                        }
                    }
                });
            };
        });
    }
    
    /**
     * API Pública
     */
    return {
        /**
         * Inicializar toda la base de datos
         */
        async init() {
            await initIndexedDB();
            this.initLocalStorage();
            await this.loadInitialData();
            console.log('✅ Base de datos inicializada');
        },
        
        /**
         * Inicializar LocalStorage con datos por defecto
         */
        initLocalStorage() {
            if (!localStorage.getItem('cea_config')) {
                localStorage.setItem('cea_config', JSON.stringify({
                    theme: 'light',
                    language: 'es',
                    heartbeatInterval: 30,
                    offlineMode: false
                }));
            }
        },
        
        /**
         * Cargar datos iniciales desde JSON
         */
        async loadInitialData() {
            const response = await fetch('/data/initial-data.json');
            const data = await response.json();
            
            // Guardar requisitos en LocalStorage
            localStorage.setItem('cea_requirements', JSON.stringify(data.requirements));
            
            // Guardar ciudades
            localStorage.setItem('cea_cities', JSON.stringify(data.cities));
        },
        
        /**
         * CRUD para IndexedDB
         */
        async insert(storeName, data) {
            const db = await initIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                data.createdAt = new Date().toISOString();
                const request = store.add(data);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        
        async getAll(storeName) {
            const db = await initIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        
        async getById(storeName, id) {
            const db = await initIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        
        async update(storeName, id, data) {
            const db = await initIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                data.updatedAt = new Date().toISOString();
                const request = store.put({ ...data, id });
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        
        async delete(storeName, id) {
            const db = await initIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        },
        
        /**
         * Consultas específicas
         */
        async getProgresoAlumno(alumnoId) {
            const db = await initIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction('progreso', 'readonly');
                const store = transaction.objectStore('progreso');
                const index = store.index('alumno_id');
                const request = index.getAll(alumnoId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        
        /**
         * Calcular progreso total
         */
        async calcularProgresoTotal(alumnoId) {
            const progreso = await this.getProgresoAlumno(alumnoId);
            if (progreso.length === 0) return 0;
            
            const total = progreso.reduce((acc, p) => {
                return acc + (p.minutos_completados / p.minutos_requeridos) * 100;
            }, 0);
            
            return Math.round(total / progreso.length);
        },
        
        /**
         * Exportar a CSV
         */
        async exportToCSV(storeName) {
            const data = await this.getAll(storeName);
            if (data.length === 0) return '';
            
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => {
                return Object.values(row).map(value => {
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(',');
            }).join('\n');
            
            return `${headers}\n${rows}`;
        },
        
        /**
         * Importar desde CSV
         */
        async importFromCSV(csvText, storeName) {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');
            const rows = lines.slice(1).filter(line => line.trim());
            
            for (const row of rows) {
                const values = row.split(',').map(v => v.replace(/^"|"$/g, ''));
                const data = {};
                headers.forEach((header, index) => {
                    data[header.trim()] = values[index];
                });
                await this.insert(storeName, data);
            }
        }
    };
})();

// Inicializar automáticamente
CEADB.init();

// Hacer global
window.CEADB = CEADB;