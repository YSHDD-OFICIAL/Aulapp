/**
 * app.js - Aplicación principal CEA Biométrico
 */
const CEAApp = (function() {
    let currentUser = null;
    
    return {
        /**
         * Inicializar aplicación
         */
        async init() {
            console.log('🚀 Iniciando CEA Biométrico...');
            
            // Verificar autenticación
            await this.checkAuth();
            
            // Configurar router
            this.setupRoutes();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Inicializar PWA
            this.setupPWA();
            
            console.log('✅ Sistema listo');
        },
        
        /**
         * Configurar rutas SPA
         */
        setupRoutes() {
            CEARouter.addRoute('/', () => {
                this.renderLogin();
            }, 'Iniciar Sesión - CEA');
            
            CEARouter.addRoute('/dashboard', () => {
                if (!this.isAuthenticated()) {
                    CEARouter.navigateTo('/');
                    return;
                }
                this.renderDashboard();
            }, 'Dashboard - CEA');
            
            CEARouter.addRoute('/biometrico', () => {
                this.renderBiometricTest();
            }, 'Prueba Biométrica - CEA');
            
            CEARouter.addRoute('/exportar', () => {
                this.renderExportPage();
            }, 'Exportar Datos - CEA');
        },
        
        /**
         * Renderizar página de login
         */
        renderLogin() {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="login-container">
                    <div class="login-card">
                        <img src="/assets/images/logo.svg" alt="CEA Logo" class="login-logo">
                        <h1>Acceso al Sistema</h1>
                        <form id="login-form">
                            <div class="form-group">
                                <label for="email">Usuario o Email</label>
                                <input type="email" id="email" required 
                                       placeholder="usuario@email.com">
                            </div>
                            <div class="form-group">
                                <label for="password">Contraseña</label>
                                <input type="password" id="password" required 
                                       placeholder="••••••••">
                            </div>
                            <button type="submit" class="btn-login">
                                Ingresar
                            </button>
                            <a href="#" class="forgot-password">¿Olvidó su contraseña?</a>
                        </form>
                    </div>
                </div>
            `;
            
            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                const result = await CEAAuth.login(email, password);
                if (result.success) {
                    CEARouter.navigateTo('/dashboard');
                } else {
                    alert('Credenciales incorrectas');
                }
            });
        },
        
        /**
         * Renderizar dashboard
         */
        async renderDashboard() {
            const user = CEAAuth.getCurrentUser();
            const stats = await CEADB.getDashboardStats(user.id);
            
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="dashboard">
                    <header class="dashboard-header">
                        <h1>Bienvenido, ${user.nombre_completo}</h1>
                        <div class="user-info">
                            <span>Categoría: <strong>${user.categoria_aspirada}</strong></span>
                            <button id="btn-logout" class="btn-logout">Cerrar Sesión</button>
                        </div>
                    </header>
                    
                    <section class="progreso-total">
                        <h2>Progreso Total</h2>
                        <div class="circular-progress" data-progress="${stats.progresoTotal}">
                            <svg viewBox="0 0 100 100">
                                <circle class="bg" cx="50" cy="50" r="45"></circle>
                                <circle class="progress" cx="50" cy="50" r="45"></circle>
                                <text x="50" y="55" class="percentage">${stats.progresoTotal}%</text>
                            </svg>
                        </div>
                    </section>
                    
                    <div class="modulos-grid">
                        <div class="modulo-card">
                            <h3>Teoría</h3>
                            <div class="circular-progress small" data-progress="${stats.teoria}">
                                <svg viewBox="0 0 100 100">
                                    <circle class="bg" cx="50" cy="50" r="40"></circle>
                                    <circle class="progress" cx="50" cy="50" r="40"></circle>
                                    <text x="50" y="55" class="percentage">${stats.teoria}%</text>
                                </svg>
                            </div>
                            <button class="btn-historial" data-tipo="teoria">
                                Ver Historial
                            </button>
                        </div>
                        
                        <div class="modulo-card">
                            <h3>Práctica</h3>
                            <div class="circular-progress small" data-progress="${stats.practica}">
                                <svg viewBox="0 0 100 100">
                                    <circle class="bg" cx="50" cy="50" r="40"></circle>
                                    <circle class="progress" cx="50" cy="50" r="40"></circle>
                                    <text x="50" y="55" class="percentage">${stats.practica}%</text>
                                </svg>
                            </div>
                            <button class="btn-historial" data-tipo="practica">
                                Ver Historial
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Botón logout
            document.getElementById('btn-logout').addEventListener('click', () => {
                CEAAuth.logout();
                CEARouter.navigateTo('/');
            });
        },
        
        /**
         * Renderizar página de prueba biométrica
         */
        renderBiometricTest() {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="biometric-test">
                    <h1>Prueba de Sistema Biométrico</h1>
                    <div class="finger-test">
                        <h3>Selector de Dedos</h3>
                        <div id="finger-selector"></div>
                        <button id="test-finger" class="btn-test">
                            Probar Verificación
                        </button>
                    </div>
                    
                    <div class="session-test">
                        <h3>Prueba de Sesión</h3>
                        <button id="start-session" class="btn-start">
                            Iniciar Sesión de Práctica
                        </button>
                        <button id="end-session" class="btn-end" disabled>
                            Finalizar Sesión
                        </button>
                        <div id="session-timer"></div>
                    </div>
                    
                    <div class="heartbeat-stats">
                        <h3>Estadísticas Heartbeat</h3>
                        <pre id="heartbeat-info"></pre>
                    </div>
                </div>
            `;
            
            // Renderizar selector de dedos
            document.getElementById('finger-selector').innerHTML = 
                CEABiometric.renderFingerSelector('left_index');
            
            // Botón probar dedo
            document.getElementById('test-finger').addEventListener('click', async () => {
                const result = await CEABiometric.verifyStudentFinger('left_index', 1);
                alert(result.verified ? '✅ Huella verificada' : '❌ Error de verificación');
            });
            
            // Prueba de sesión
            let currentSession = null;
            
            document.getElementById('start-session').addEventListener('click', async () => {
                const result = await CEABiometric.startSession(1, 2, 1);
                if (result.success) {
                    currentSession = result.session;
                    document.getElementById('start-session').disabled = true;
                    document.getElementById('end-session').disabled = false;
                    
                    // Mostrar timer
                    const timer = document.getElementById('session-timer');
                    timer.innerHTML = '⏱️ Sesión iniciada...';
                }
            });
            
            document.getElementById('end-session').addEventListener('click', async () => {
                const result = await CEABiometric.endSession();
                if (result.success) {
                    document.getElementById('start-session').disabled = false;
                    document.getElementById('end-session').disabled = true;
                    
                    const timer = document.getElementById('session-timer');
                    timer.innerHTML = `✅ Sesión finalizada - Duración: ${result.session.minutesTotal} minutos`;
                    
                    // Mostrar stats
                    const stats = await CEAHeartbeat.getStats(result.session.id);
                    document.getElementById('heartbeat-info').innerHTML = 
                        JSON.stringify(stats, null, 2);
                }
            });
        },
        
        /**
         * Renderizar página de exportación
         */
        renderExportPage() {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="export-page">
                    <h1>Exportar Datos</h1>
                    
                    <div class="export-options">
                        <div class="export-card">
                            <h3>Usuarios</h3>
                            <button class="btn-export" data-store="usuarios">
                                Exportar a CSV
                            </button>
                        </div>
                        
                        <div class="export-card">
                            <h3>Vehículos</h3>
                            <button class="btn-export" data-store="vehiculos">
                                Exportar a CSV
                            </button>
                        </div>
                        
                        <div class="export-card">
                            <h3>Sesiones</h3>
                            <button class="btn-export" data-store="sesiones">
                                Exportar a CSV
                            </button>
                        </div>
                        
                        <div class="export-card">
                            <h3>Progreso de Estudiante</h3>
                            <input type="number" id="student-id" placeholder="ID Estudiante">
                            <button id="export-student">
                                Exportar Progreso
                            </button>
                        </div>
                    </div>
                    
                    <div class="import-section">
                        <h2>Importar Datos</h2>
                        <input type="file" id="csv-file" accept=".csv">
                        <select id="import-store">
                            <option value="usuarios">Usuarios</option>
                            <option value="vehiculos">Vehículos</option>
                            <option value="sesiones">Sesiones</option>
                        </select>
                        <button id="import-csv">Importar CSV</button>
                    </div>
                </div>
            `;
            
            // Exportar
            document.querySelectorAll('.btn-export').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const store = e.target.dataset.store;
                    await CEAExport.toCSV(store);
                });
            });
            
            // Exportar progreso estudiante
            document.getElementById('export-student').addEventListener('click', async () => {
                const studentId = document.getElementById('student-id').value;
                if (!studentId) {
                    alert('Ingrese ID de estudiante');
                    return;
                }
                
                const csv = await CEAExport.exportStudentProgress(parseInt(studentId));
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `estudiante_${studentId}_progreso.csv`;
                a.click();
            });
            
            // Importar CSV
            document.getElementById('import-csv').addEventListener('click', async () => {
                const file = document.getElementById('csv-file').files[0];
                const store = document.getElementById('import-store').value;
                
                if (!file) {
                    alert('Seleccione un archivo CSV');
                    return;
                }
                
                try {
                    const result = await CEAExport.importFromCSV(file, store);
                    alert(result);
                } catch (error) {
                    alert('Error al importar: ' + error.message);
                }
            });
        },
        
        /**
         * Verificar autenticación
         */
        async checkAuth() {
            currentUser = await CEAAuth.checkSession();
            if (currentUser) {
                console.log('👤 Usuario autenticado:', currentUser.nombre_completo);
            }
        },
        
        isAuthenticated() {
            return currentUser !== null;
        },
        
        /**
         * Cargar datos iniciales
         */
        async loadInitialData() {
            try {
                // Verificar si hay datos
                const usuarios = await CEADB.getAll('usuarios');
                if (usuarios.length === 0) {
                    // Cargar datos de ejemplo
                    const response = await fetch('/data/initial-data.json');
                    const data = await response.json();
                    
                    for (const usuario of data.usuarios) {
                        await CEADB.insert('usuarios', usuario);
                    }
                    
                    console.log('📦 Datos iniciales cargados');
                }
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        },
        
        /**
         * Configurar PWA
         */
        setupPWA() {
            // Detectar instalación
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                
                // Mostrar botón de instalación
                this.showInstallButton();
            });
            
            // Detectar modo offline
            this.updateOnlineStatus();
            window.addEventListener('online', this.updateOnlineStatus);
            window.addEventListener('offline', this.updateOnlineStatus);
        },
        
        showInstallButton() {
            const btn = document.createElement('button');
            btn.className = 'install-pwa';
            btn.innerHTML = '📱 Instalar App';
            btn.onclick = async () => {
                const promptEvent = window.deferredPrompt;
                if (!promptEvent) return;
                
                promptEvent.prompt();
                const result = await promptEvent.userChoice;
                console.log('Instalación:', result.outcome);
                
                delete window.deferredPrompt;
                btn.remove();
            };
            
            document.body.appendChild(btn);
        },
        
        updateOnlineStatus() {
            const status = document.createElement('div');
            status.className = `online-status ${navigator.onLine ? 'online' : 'offline'}`;
            status.innerHTML = navigator.onLine ? '🟢 En línea' : '🔴 Sin conexión';
            
            const existing = document.querySelector('.online-status');
            if (existing) {
                existing.replaceWith(status);
            } else {
                document.body.appendChild(status);
            }
        }
    };
})();

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    CEAApp.init();
});