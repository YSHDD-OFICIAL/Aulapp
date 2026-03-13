/**
 * app.js - Aplicación principal CEA Biométrico
 * Versión: 1.0.0
 */

const CEAApp = (function() {
    // ===== ESTADO INTERNO =====
    let currentUser = null;
    let appInitialized = false;
    let config = {
        theme: 'light',
        language: 'es',
        heartbeatInterval: 30000,
        offlineMode: false,
        apiEndpoint: 'http://localhost:3000/api'
    };

    // ===== INICIALIZACIÓN =====
    async function init() {
        console.log('🚀 Iniciando CEA Biométrico...', new Date().toISOString());
        
        try {
            // Cargar configuración
            loadConfig();
            
            // Verificar autenticación
            await checkAuth();
            
            // Configurar router
            setupRoutes();
            
            // Cargar datos iniciales
            await loadInitialData();
            
            // Inicializar PWA
            setupPWA();
            
            // Configurar event listeners globales
            setupGlobalEvents();
            
            // Aplicar tema
            applyTheme(config.theme);
            
            appInitialized = true;
            console.log('✅ Sistema inicializado correctamente');
            
            // Mostrar mensaje de bienvenida si hay usuario
            if (currentUser) {
                showWelcomeMessage();
            }
            
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            showError('Error al iniciar la aplicación. Recargue la página.');
        }
    }

    // ===== CONFIGURACIÓN =====
    function loadConfig() {
        const savedConfig = localStorage.getItem('cea_config');
        if (savedConfig) {
            config = { ...config, ...JSON.parse(savedConfig) };
        }
        console.log('⚙️ Configuración cargada:', config);
    }

    function saveConfig() {
        localStorage.setItem('cea_config', JSON.stringify(config));
    }

    // ===== AUTENTICACIÓN =====
    async function checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                // Verificar token con el servidor (simulado)
                currentUser = await CEAAuth.validateToken(token);
                if (currentUser) {
                    console.log('👤 Usuario autenticado:', currentUser.nombre);
                }
            } catch (error) {
                console.warn('Token inválido, redirigiendo a login');
                localStorage.removeItem('auth_token');
                currentUser = null;
            }
        }
    }

    function isAuthenticated() {
        return currentUser !== null;
    }

    function getCurrentUser() {
        return currentUser;
    }

    // ===== RUTAS =====
    function setupRoutes() {
        // Rutas públicas
        CEARouter.addRoute('/', renderLogin, 'Iniciar Sesión - CEA');
        CEARouter.addRoute('/login', renderLogin, 'Iniciar Sesión - CEA');
        CEARouter.addRoute('/registro', renderRegister, 'Registro - CEA');
        CEARouter.addRoute('/recuperar-password', renderRecoverPassword, 'Recuperar Contraseña - CEA');
        
        // Rutas protegidas (requieren autenticación)
        CEARouter.addRoute('/dashboard', requireAuth(renderDashboard), 'Dashboard - CEA');
        CEARouter.addRoute('/progreso', requireAuth(renderProgress), 'Mi Progreso - CEA');
        CEARouter.addRoute('/horarios', requireAuth(renderSchedule), 'Horarios - CEA');
        CEARouter.addRoute('/historial', requireAuth(renderHistory), 'Historial - CEA');
        CEARouter.addRoute('/perfil', requireAuth(renderProfile), 'Mi Perfil - CEA');
        
        // Rutas biométricas
        CEARouter.addRoute('/biometrico', requireAuth(renderBiometric), 'Verificación Biométrica - CEA');
        CEARouter.addRoute('/biometrico/test', requireAuth(renderBiometricTest), 'Prueba Biométrica - CEA');
        
        // Rutas de exportación
        CEARouter.addRoute('/exportar', requireAuth(renderExport), 'Exportar Datos - CEA');
        
        // Rutas de administración (requieren rol admin)
        CEARouter.addRoute('/admin', requireAdmin(renderAdminDashboard), 'Panel Admin - CEA');
        CEARouter.addRoute('/admin/usuarios', requireAdmin(renderAdminUsers), 'Usuarios - CEA');
        CEARouter.addRoute('/admin/vehiculos', requireAdmin(renderAdminVehicles), 'Vehículos - CEA');
        CEARouter.addRoute('/admin/reportes', requireAdmin(renderAdminReports), 'Reportes - CEA');
        
        // Ruta 404
        CEARouter.addRoute('404', renderNotFound, 'Página no encontrada - CEA');
        
        // Iniciar router
        CEARouter.init();
    }

    // Middleware para rutas protegidas
    function requireAuth(handler) {
        return function() {
            if (!isAuthenticated()) {
                CEARouter.navigateTo('/login');
                return;
            }
            handler();
        };
    }

    // Middleware para rutas de administrador
    function requireAdmin(handler) {
        return function() {
            if (!isAuthenticated()) {
                CEARouter.navigateTo('/login');
                return;
            }
            if (currentUser.rol !== 'admin') {
                CEARouter.navigateTo('/dashboard');
                showNotification('Acceso no autorizado', 'error');
                return;
            }
            handler();
        };
    }

    // ===== RENDERIZADO DE PÁGINAS =====
    function renderLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card animate-fadeInUp">
                    <img src="/assets/images/logo.svg" alt="CEA Logo" class="login-logo">
                    <h1>Acceso al Sistema</h1>
                    
                    <form id="login-form" class="login-form">
                        <div class="form-group">
                            <label for="email">
                                <i class="icon-user"></i>
                                Usuario o Email
                            </label>
                            <input type="email" 
                                   id="email" 
                                   required 
                                   placeholder="usuario@email.com"
                                   autocomplete="username">
                        </div>
                        
                        <div class="form-group">
                            <label for="password">
                                <i class="icon-lock"></i>
                                Contraseña
                            </label>
                            <input type="password" 
                                   id="password" 
                                   required 
                                   placeholder="••••••••"
                                   autocomplete="current-password">
                        </div>
                        
                        <div class="form-options">
                            <label class="checkbox-group">
                                <input type="checkbox" id="remember">
                                <span class="checkbox-label">Recordarme</span>
                            </label>
                            <a href="/recuperar-password" class="forgot-password" data-link>
                                ¿Olvidó su contraseña?
                            </a>
                        </div>
                        
                        <button type="submit" class="btn-login btn-primary">
                            <span class="btn-text">Ingresar</span>
                            <span class="btn-loader" style="display: none;"></span>
                        </button>
                    </form>
                    
                    <div class="login-footer">
                        <p>¿No tienes cuenta? <a href="/registro" data-link>Regístrate aquí</a></p>
                    </div>
                    
                    <div class="login-demo">
                        <small>Demo: admin@cea.com / admin123</small>
                    </div>
                </div>
            </div>
        `;

        // Event listener del formulario
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            // Mostrar loader
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            
            try {
                const result = await CEAAuth.login(email, password);
                
                if (result.success) {
                    currentUser = result.user;
                    if (remember) {
                        localStorage.setItem('auth_token', result.token);
                    } else {
                        sessionStorage.setItem('auth_token', result.token);
                    }
                    
                    showNotification('¡Bienvenido!', 'success');
                    CEARouter.navigateTo('/dashboard');
                } else {
                    showNotification(result.error || 'Credenciales incorrectas', 'error');
                }
            } catch (error) {
                showNotification('Error de conexión', 'error');
            } finally {
                // Restaurar botón
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
        });
    }

    function renderRegister() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="register-container">
                <div class="register-card animate-fadeInUp">
                    <h1>Registro de Estudiante</h1>
                    <p class="subtitle">Completa tus datos para registrarte en el sistema</p>
                    
                    <form id="register-form" class="register-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tipo de Documento</label>
                                <select id="tipo-documento" required>
                                    <option value="">Seleccione...</option>
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="TI">Tarjeta de Identidad</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="PAS">Pasaporte</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Número de Documento</label>
                                <input type="text" id="numero-documento" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" id="nombre" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Fecha de Nacimiento</label>
                                <input type="date" id="fecha-nacimiento" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Sexo</label>
                                <select id="sexo" required>
                                    <option value="">Seleccione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="email" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Teléfono Móvil</label>
                                <input type="tel" id="telefono" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Teléfono Fijo</label>
                                <input type="tel" id="telefono-fijo">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Dirección</label>
                            <input type="text" id="direccion" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ciudad</label>
                                <input type="text" id="ciudad" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Departamento</label>
                                <input type="text" id="departamento" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Barrio</label>
                                <input type="text" id="barrio" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Código Postal</label>
                                <input type="text" id="codigo-postal">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Grupo Sanguíneo</label>
                            <select id="grupo-sanguineo" required>
                                <option value="">Seleccione...</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>EPS</label>
                            <input type="text" id="eps" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Contacto de Emergencia - Nombre</label>
                                <input type="text" id="contacto-nombre" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Contacto de Emergencia - Teléfono</label>
                                <input type="tel" id="contacto-telefono" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Categoría Aspirada</label>
                            <select id="categoria" required>
                                <option value="">Seleccione...</option>
                                <option value="A1">A1 - Motocicleta hasta 125cc</option>
                                <option value="A2">A2 - Motocicleta</option>
                                <option value="B1">B1 - Automóvil</option>
                                <option value="C1">C1 - Camión</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Contraseña</label>
                                <input type="password" id="password" required>
                                <small class="help-text">Mínimo 8 caracteres, 1 mayúscula, 1 número</small>
                            </div>
                            
                            <div class="form-group">
                                <label>Confirmar Contraseña</label>
                                <input type="password" id="confirm-password" required>
                            </div>
                        </div>
                        
                        <div class="form-group terms-group">
                            <label class="checkbox-group">
                                <input type="checkbox" id="terminos" required>
                                <span class="checkbox-label">
                                    Acepto los <a href="/terminos" target="_blank">términos y condiciones</a> 
                                    y el tratamiento de datos personales (Habeas Data)
                                </span>
                            </label>
                        </div>
                        
                        <button type="submit" class="btn-register btn-primary">
                            Registrarse
                        </button>
                        
                        <p class="login-link">
                            ¿Ya tienes cuenta? <a href="/login" data-link>Inicia sesión aquí</a>
                        </p>
                    </form>
                </div>
            </div>
        `;

        // Validación de formulario
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validar contraseñas
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password').value;
            
            if (password !== confirm) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }
            
            // Validar fortaleza de contraseña
            const passwordValidation = CEAValidators.password(password);
            if (!passwordValidation.valid) {
                showNotification(passwordValidation.errors.join('. '), 'error');
                return;
            }
            
            // Validar email
            const email = document.getElementById('email').value;
            if (!CEAValidators.email(email).valid) {
                showNotification('Email inválido', 'error');
                return;
            }
            
            // Validar telé