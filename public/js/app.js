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
            
            // Validar teléfono
            const telefono = document.getElementById('telefono').value;
            if (!CEAValidators.telefono(telefono).valid) {
                showNotification('Teléfono inválido (10 dígitos para celular)', 'error');
                return;
            }
            
            // Validar fecha de nacimiento
            const fecha = document.getElementById('fecha-nacimiento').value;
            if (!CEAValidators.fechaNacimiento(fecha).valid) {
                showNotification('Debe ser mayor de 16 años', 'error');
                return;
            }
            
            // Validar documento
            const tipoDoc = document.getElementById('tipo-documento').value;
            const numDoc = document.getElementById('numero-documento').value;
            if (!CEAValidators.documento(tipoDoc, numDoc).valid) {
                showNotification('Número de documento inválido', 'error');
                return;
            }
            
            // Recolectar datos
            const userData = {
                tipo_usuario: 'alumno',
                nombre_completo: document.getElementById('nombre').value,
                tipo_documento: tipoDoc,
                numero_documento: numDoc,
                fecha_nacimiento: fecha,
                sexo: document.getElementById('sexo').value,
                grupo_sanguineo: document.getElementById('grupo-sanguineo').value,
                direccion: document.getElementById('direccion').value,
                barrio: document.getElementById('barrio').value,
                ciudad: document.getElementById('ciudad').value,
                departamento: document.getElementById('departamento').value,
                codigo_postal: document.getElementById('codigo-postal').value,
                telefono_fijo: document.getElementById('telefono-fijo').value,
                telefono_movil: telefono,
                email: email,
                password_hash: password, // En producción, hashear
                eps: document.getElementById('eps').value,
                contacto_emergencia_nombre: document.getElementById('contacto-nombre').value,
                contacto_emergencia_telefono: document.getElementById('contacto-telefono').value,
                categoria_aspirada: document.getElementById('categoria').value,
                fecha_registro: new Date().toISOString(),
                activo: true
            };
            
            try {
                // Guardar en base de datos
                await CEADB.insert('usuarios', userData);
                showNotification('Registro exitoso. Ya puedes iniciar sesión.', 'success');
                CEARouter.navigateTo('/login');
            } catch (error) {
                showNotification('Error al registrar: ' + error.message, 'error');
            }
        });
    }

    function renderRecoverPassword() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="recover-container">
                <div class="recover-card animate-fadeInUp">
                    <h1>Recuperar Contraseña</h1>
                    <p>Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.</p>
                    
                    <form id="recover-form">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="email" required>
                        </div>
                        
                        <button type="submit" class="btn-primary">Enviar instrucciones</button>
                        
                        <p class="back-link">
                            <a href="/login" data-link>← Volver al inicio de sesión</a>
                        </p>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('recover-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            
            // Simular envío de email
            showNotification(`Se enviaron instrucciones a ${email}`, 'success');
            setTimeout(() => CEARouter.navigateTo('/login'), 2000);
        });
    }

    function renderDashboard() {
        const app = document.getElementById('app');
        
        // Obtener estadísticas del usuario
        const stats = CEADB.getDashboardStats(currentUser.id);
        
        app.innerHTML = `
            <div class="dashboard-container">
                <header class="dashboard-header animate-fadeInDown">
                    <div class="header-content">
                        <div>
                            <h1>Bienvenido, ${currentUser.nombre_completo}</h1>
                            <p class="user-role">
                                <span class="badge badge-info">${currentUser.tipo_usuario}</span>
                                <span class="badge badge-primary">Categoría: ${currentUser.categoria_aspirada || 'N/A'}</span>
                            </p>
                        </div>
                        <div class="header-actions">
                            <button id="btn-notifications" class="btn-icon">
                                <span class="notification-badge">3</span>
                                🔔
                            </button>
                            <button id="btn-logout" class="btn-logout">
                                <i class="icon-logout"></i>
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </header>
                
                <div class="stats-grid">
                    <div class="stat-card animate-fadeInLeft" style="animation-delay: 0.1s">
                        <div class="stat-icon">📚</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.horasTeoria?.toFixed(1) || 0}h</div>
                            <div class="stat-label">Teoría completada</div>
                            <div class="stat-change positive">+2.5h esta semana</div>
                        </div>
                    </div>
                    
                    <div class="stat-card animate-fadeInLeft" style="animation-delay: 0.2s">
                        <div class="stat-icon">🚗</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.horasPractica?.toFixed(1) || 0}h</div>
                            <div class="stat-label">Práctica completada</div>
                            <div class="stat-change positive">+1.5h esta semana</div>
                        </div>
                    </div>
                    
                    <div class="stat-card animate-fadeInLeft" style="animation-delay: 0.3s">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.sesionesCompletadas || 0}</div>
                            <div class="stat-label">Sesiones realizadas</div>
                            <div class="stat-change">+3 esta semana</div>
                        </div>
                    </div>
                    
                    <div class="stat-card animate-fadeInLeft" style="animation-delay: 0.4s">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.progresoTotal || 0}%</div>
                            <div class="stat-label">Progreso total</div>
                            <div class="stat-change positive">+8% este mes</div>
                        </div>
                    </div>
                </div>
                
                <div class="progress-section animate-fadeInUp" style="animation-delay: 0.2s">
                    <div class="progress-header">
                        <h2>Mi Progreso</h2>
                        <p>Sigue avanzando en tu formación</p>
                    </div>
                    
                    <div class="progress-grid">
                        <div class="progress-item">
                            <div class="progress-circle" id="progress-teoria"></div>
                            <h3>Teoría</h3>
                            <div class="progress-detail">
                                <span>📊 ${stats.horasTeoria?.toFixed(1) || 0}h / 25h</span>
                                <span>✅ ${Math.round((stats.horasTeoria/25)*100) || 0}%</span>
                            </div>
                            <button class="btn-secondary btn-historial" data-tipo="teoria">
                                Ver historial
                            </button>
                        </div>
                        
                        <div class="progress-item">
                            <div class="progress-circle" id="progress-practica"></div>
                            <h3>Práctica</h3>
                            <div class="progress-detail">
                                <span>🚗 ${stats.horasPractica?.toFixed(1) || 0}h / 25h</span>
                                <span>✅ ${Math.round((stats.horasPractica/25)*100) || 0}%</span>
                            </div>
                            <button class="btn-secondary btn-historial" data-tipo="practica">
                                Ver historial
                            </button>
                        </div>
                        
                        <div class="progress-item">
                            <div class="progress-circle" id="progress-manejo"></div>
                            <h3>Clase de Manejo</h3>
                            <div class="progress-detail">
                                <span>⏱️ ${stats.horasManejo?.toFixed(1) || 0}h / 20h</span>
                                <span>✅ ${Math.round((stats.horasManejo/20)*100) || 0}%</span>
                            </div>
                            <button class="btn-secondary btn-historial" data-tipo="manejo">
                                Ver historial
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="section animate-fadeInUp" style="animation-delay: 0.3s">
                    <div class="section-header">
                        <h2 class="section-title">Próximas Clases</h2>
                        <a href="/horarios" class="btn-link" data-link>Ver todos →</a>
                    </div>
                    
                    <div class="schedule-list">
                        <div class="schedule-item">
                            <div class="schedule-time">Hoy 15:00</div>
                            <div class="schedule-info">
                                <h4>Clase Práctica</h4>
                                <p>Instructor: Juan Pérez - Vehículo: ABC123</p>
                            </div>
                            <button class="btn-primary btn-small" onclick="startClass()">
                                Iniciar
                            </button>
                        </div>
                        
                        <div class="schedule-item">
                            <div class="schedule-time">Mañana 10:00</div>
                            <div class="schedule-info">
                                <h4>Teoría - Señales</h4>
                                <p>Aula 101 - Módulo 3</p>
                            </div>
                            <span class="badge badge-success">Confirmado</span>
                        </div>
                        
                        <div class="schedule-item">
                            <div class="schedule-time">Vie 14:30</div>
                            <div class="schedule-info">
                                <h4>Clase Práctica</h4>
                                <p>Instructor: María García - Vehículo: XYZ789</p>
                            </div>
                            <span class="badge badge-warning">Pendiente</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inicializar círculos de progreso
        new CircularProgress(document.getElementById('progress-teoria'), {
            percentage: Math.round((stats.horasTeoria/25)*100) || 0,
            color: '#2196F3',
            size: 150
        });

        new CircularProgress(document.getElementById('progress-practica'), {
            percentage: Math.round((stats.horasPractica/25)*100) || 0,
            color: '#4CAF50',
            size: 150
        });

        new CircularProgress(document.getElementById('progress-manejo'), {
            percentage: Math.round((stats.horasManejo/20)*100) || 0,
            color: '#FF9800',
            size: 150
        });

        // Botón logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            CEAAuth.logout();
            currentUser = null;
            CEARouter.navigateTo('/login');
        });

        // Botones historial
        document.querySelectorAll('.btn-historial').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tipo = e.target.dataset.tipo;
                CEARouter.navigateTo(`/historial?tipo=${tipo}`);
            });
        });
    }

    function renderProgress() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="progress-page">
                <h1>Mi Progreso Detallado</h1>
                <!-- Contenido de progreso detallado -->
            </div>
        `;
    }

    function renderSchedule() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="schedule-page">
                <h1>Mis Horarios</h1>
                <!-- Contenido de horarios -->
            </div>
        `;
    }

    function renderHistory() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="history-page">
                <h1>Historial de Clases</h1>
                <!-- Contenido de historial -->
            </div>
        `;
    }

    function renderProfile() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="profile-page">
                <h1>Mi Perfil</h1>
                <!-- Contenido de perfil -->
            </div>
        `;
    }

    function renderBiometric() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="biometric-page">
                <h1>Verificación Biométrica</h1>
                <div id="biometric-container"></div>
            </div>
        `;

        // Inicializar modal biométrico
        const modal = new BiometricModal({
            requiredFinger: 'left_index',
            onSuccess: () => {
                showNotification('✅ Huella verificada correctamente', 'success');
            }
        });
        modal.open();
    }

    function renderBiometricTest() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="biometric-test-page">
                <h1>Prueba de Sistema Biométrico</h1>
                
                <div class="test-container">
                    <div class="test-card">
                        <h3>Selector de Dedos</h3>
                        <div id="finger-selector"></div>
                        <button id="test-finger" class="btn-primary">
                            Probar Verificación
                        </button>
                    </div>
                    
                    <div class="test-card">
                        <h3>Prueba de Sesión</h3>
                        <button id="start-session" class="btn-success">
                            Iniciar Sesión
                        </button>
                        <button id="end-session" class="btn-danger" disabled>
                            Finalizar Sesión
                        </button>
                        <div id="session-timer" class="timer"></div>
                    </div>
                    
                    <div class="test-card">
                        <h3>Heartbeats</h3>
                        <button id="start-heartbeat" class="btn-info">
                            Iniciar Heartbeat
                        </button>
                        <button id="stop-heartbeat" class="btn-warning" disabled>
                            Detener Heartbeat
                        </button>
                        <pre id="heartbeat-stats"></pre>
                    </div>
                </div>
            </div>
        `;

        // Selector de dedos
        const selector = document.getElementById('finger-selector');
        selector.innerHTML = CEABiometric.renderFingerSelector('left_index');

        // Probar verificación
        document.getElementById('test-finger').addEventListener('click', async () => {
            const result = await CEABiometric.verifyStudentFinger('left_index', 1);
            showNotification(result.verified ? '✅ Verificado' : '❌ Error', 
                          result.verified ? 'success' : 'error');
        });

        // Prueba de sesión
        let currentSession = null;
        
        document.getElementById('start-session').addEventListener('click', async () => {
            const result = await CEABiometric.startSession(1, 2, 1);
            if (result.success) {
                currentSession = result.session;
                document.getElementById('start-session').disabled = true;
                document.getElementById('end-session').disabled = false;
                document.getElementById('session-timer').textContent = '⏱️ Sesión iniciada';
            }
        });

        document.getElementById('end-session').addEventListener('click', async () => {
            const result = await CEABiometric.endSession();
            if (result.success) {
                document.getElementById('start-session').disabled = false;
                document.getElementById('end-session').disabled = true;
                document.getElementById('session-timer').textContent = 
                    `✅ Sesión finalizada - Duración: ${result.session.minutesTotal} minutos`;
            }
        });

        // Heartbeat test
        let heartbeatInterval;
        
        document.getElementById('start-heartbeat').addEventListener('click', () => {
            CEAHeartbeat.startSession(999, 1);
            document.getElementById('start-heartbeat').disabled = true;
            document.getElementById('stop-heartbeat').disabled = false;
            
            heartbeatInterval = setInterval(async () => {
                const stats = await CEAHeartbeat.getStats(999);
                document.getElementById('heartbeat-stats').textContent = 
                    JSON.stringify(stats, null, 2);
            }, 2000);
        });

        document.getElementById('stop-heartbeat').addEventListener('click', () => {
            CEAHeartbeat.stopSession(999);
            document.getElementById('start-heartbeat').disabled = false;
            document.getElementById('stop-heartbeat').disabled = true;
            clearInterval(heartbeatInterval);
        });
    }

    function renderExport() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="export-page">
                <h1>Exportar Datos</h1>
                
                <div class="export-grid">
                    <div class="export-card">
                        <h3>📊 Usuarios</h3>
                        <p>Exportar lista completa de usuarios</p>
                        <button class="btn-primary" onclick="CEAExport.toCSV('usuarios')">
                            Exportar CSV
                        </button>
                    </div>
                    
                    <div class="export-card">
                        <h3>🚗 Vehículos</h3>
                        <p>Exportar inventario de vehículos</p>
                        <button class="btn-primary" onclick="CEAExport.toCSV('vehiculos')">
                            Exportar CSV
                        </button>
                    </div>
                    
                    <div class="export-card">
                        <h3>📅 Sesiones</h3>
                        <p>Exportar todas las sesiones de clase</p>
                        <button class="btn-primary" onclick="CEAExport.toCSV('sesiones')">
                            Exportar CSV
                        </button>
                    </div>
                    
                    <div class="export-card">
                        <h3>📈 Progreso</h3>
                        <p>Exportar progreso de estudiantes</p>
                        <button class="btn-primary" onclick="CEAExport.toCSV('progreso')">
                            Exportar CSV
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
                    <button id="import-btn" class="btn-secondary">Importar CSV</button>
                </div>
            </div>
        `;

        document.getElementById('import-btn').addEventListener('click', async () => {
            const file = document.getElementById('csv-file').files[0];
            const store = document.getElementById('import-store').value;
            
            if (!file) {
                showNotification('Selecciona un archivo CSV', 'warning');
                return;
            }
            
            try {
                await CEAExport.importFromCSV(file, store);
                showNotification('Datos importados correctamente', 'success');
            } catch (error) {
                showNotification('Error al importar: ' + error.message, 'error');
            }
        });
    }

    function renderAdminDashboard() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-container">
                <header class="admin-header">
                    <h1>Panel de Administración</h1>
                    <div class="admin-actions">
                        <button class="btn-primary" onclick="CEARouter.navigateTo('/admin/usuarios')">
                            Gestionar Usuarios
                        </button>
                    </div>
                </header>
                
                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-users">0</div>
                        <div class="stat-label">Usuarios Totales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-sessions">0</div>
                        <div class="stat-label">Sesiones Activas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="total-vehicles">0</div>
                        <div class="stat-label">Vehículos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="pending-alerts">0</div>
                        <div class="stat-label">Alertas</div>
                    </div>
                </div>
                
                <div class="admin-grid">
                    <div class="admin-card">
                        <h3>Vehículos Próximos a Vencer</h3>
                        <div id="expiring-vehicles"></div>
                    </div>
                    
                    <div class="admin-card">
                        <h3>Últimas Sesiones</h3>
                        <div id="recent-sessions"></div>
                    </div>
                    
                    <div class="admin-card">
                        <h3>Estudiantes Activos</h3>
                        <div id="active-students"></div>
                    </div>
                    
                    <div class="admin-card">
                        <h3>Reportes Rápidos</h3>
                        <div class="quick-reports">
                            <button class="btn-link" onclick="CEAExport.toCSV('usuarios')">
                                Exportar Usuarios
                            </button>
                            <button class="btn-link" onclick="CEAExport.toCSV('vehiculos')">
                                Exportar Vehículos
                            </button>
                            <button class="btn-link" onclick="generateMonthlyReport()">
                                Reporte Mensual
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cargar estadísticas
        loadAdminStats();
    }

    function renderAdminUsers() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-users">
                <h1>Gestión de Usuarios</h1>
                <div id="users-table-container"></div>
            </div>
        `;

        // Inicializar tabla de usuarios
        loadUsersTable();
    }

    function renderAdminVehicles() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-vehicles">
                <h1>Gestión de Vehículos</h1>
                <div id="vehicles-table-container"></div>
            </div>
        `;

        // Inicializar tabla de vehículos
        const vehicleTable = new VehicleTable(
            document.getElementById('vehicles-table-container'),
            {
                showActions: true,
                onEdit: (id) => editVehicle(id),
                onDelete: (id) => deleteVehicle(id),
                onView: (id) => viewVehicle(id)
            }
        );
        vehicleTable.loadData();
    }

    function renderAdminReports() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-reports">
                <h1>Reportes</h1>
                <!-- Contenido de reportes -->
            </div>
        `;
    }

    function renderNotFound() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="not-found">
                <h1>404</h1>
                <h2>Página no encontrada</h2>
                <p>La página que buscas no existe o ha sido movida.</p>
                <a href="/" class="btn-primary" data-link>Volver al inicio</a>
            </div>
        `;
    }

    // ===== FUNCIONES AUXILIARES =====
    async function loadInitialData() {
        try {
            // Verificar si hay datos
            const usuarios = await CEADB.getAll('usuarios');
            
            if (usuarios.length === 0) {
                console.log('📦 Cargando datos iniciales...');
                
                // Cargar desde JSON
                const response = await fetch('/data/initial-data.json');
                const data = await response.json();
                
                // Insertar usuarios
                for (const usuario of data.usuarios) {
                    await CEADB.insert('usuarios', usuario);
                }
                
                // Insertar vehículos
                for (const vehiculo of data.vehiculos) {
                    await CEADB.insert('vehiculos', vehiculo);
                }
                
                // Insertar progreso
                for (const prog of data.progreso) {
                    await CEADB.insert('progreso', prog);
                }
                
                console.log('✅ Datos iniciales cargados');
            }
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }

    async function loadAdminStats() {
        const usuarios = await CEADB.getAll('usuarios');
        const vehiculos = await CEADB.getAll('vehiculos');
        const sesiones = await CEADB.getAll('sesiones');
        
        document.getElementById('total-users').textContent = usuarios.length;
        document.getElementById('active-sessions').textContent = 
            sesiones.filter(s => !s.hora_fin).length;
        document.getElementById('total-vehicles').textContent = vehiculos.length;
        
        // Alertas (vehículos próximos a vencer)
        const hoy = new Date();
        const alertas = vehiculos.filter(v => {
            const soat = new Date(v.soat_vigencia);
            const diff = (soat - hoy) / (1000 * 60 * 60 * 24);
            return diff <= 30 && diff > 0;
        }).length;
        
        document.getElementById('pending-alerts').textContent = alertas;
    }

    function loadUsersTable() {
        // Implementar tabla de usuarios
    }

    function editVehicle(id) {
        console.log('Editar vehículo:', id);
        showNotification('Función en desarrollo', 'info');
    }

    function deleteVehicle(id) {
        if (confirm('¿Eliminar este vehículo?')) {
            CEADB.delete('vehiculos', id);
            showNotification('Vehículo eliminado', 'success');
            CEARouter.navigateTo('/admin/vehiculos');
        }
    }

    function viewVehicle(id) {
        console.log('Ver vehículo:', id);
    }

    function generateMonthlyReport() {
        showNotification('Generando reporte...', 'info');
        setTimeout(() => {
            showNotification('Reporte generado', 'success');
        }, 2000);
    }

    function startClass() {
        const modal = new BiometricModal({
            title: 'Iniciar Clase',
            requiredFinger: 'left_index',
            onSuccess: () => {
                showNotification('Clase iniciada', 'success');
                CEAHeartbeat.startSession(Date.now(), currentUser.id);
            }
        });
        modal.open();
    }

    // ===== CONFIGURACIÓN PWA =====
    function setupPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('✅ Service Worker registrado'))
                    .catch(err => console.error('❌ Error SW:', err));
            });
        }
    }

    // ===== EVENTOS GLOBALES =====
    function setupGlobalEvents() {
        // Detectar cambios de conexión
        window.addEventListener('online', () => {
            showNotification('🟢 Conexión restaurada', 'success');
            CEAOffline.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            showNotification('🔴 Sin conexión - Trabajando offline', 'warning');
        });
        
        // Detectar tecla Escape para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.remove();
        });
    }

    // ===== TEMAS =====
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        const newTheme = config.theme === 'light' ? 'dark' : 'light';
        config.theme = newTheme;
        applyTheme(newTheme);
        saveConfig();
    }

    // ===== NOTIFICACIONES =====
    function showNotification(message, type = 'info') {
        if (window.CEANotifications) {
            CEANotifications.show(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    function showError(message) {
        showNotification(message, 'error');
    }

    function showWelcomeMessage() {
        const hour = new Date().getHours();
        let greeting = 'Buenos días';
        
        if (hour >= 12 && hour < 18) {
            greeting = 'Buenas tardes';
        } else if (hour >= 18) {
            greeting = 'Buenas noches';
        }
        
        showNotification(`${greeting}, ${currentUser.nombre_completo}`, 'success');
    }

    // ===== API PÚBLICA =====
    return {
        init,
        getCurrentUser,
        isAuthenticated,
        toggleTheme,
        showNotification,
        config
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    CEAApp.init();
});

// Exponer globalmente
window.CEAApp = CEAApp;