/**
 * notifications.js - Sistema de notificaciones
 * Notificaciones push, toast, alertas y mensajes en pantalla
 * Versión: 1.0.0
 */

const CEANotifications = (function() {
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        TOAST_DURATION: 3000,
        MAX_TOASTS: 5,
        DEFAULT_POSITION: 'bottom-right',
        SOUND_ENABLED: true,
        VIBRATION_ENABLED: true
    };

    // ===== ESTADO INTERNO =====
    let toastContainer = null;
    let activeToasts = [];
    let notificationPermission = false;
    let soundEnabled = localStorage.getItem('notifications_sound') !== 'false';
    let vibrationEnabled = localStorage.getItem('notifications_vibration') !== 'false';

    // ===== INICIALIZACIÓN =====
    function init() {
        console.log('🔔 Inicializando sistema de notificaciones...');

        createToastContainer();
        checkNotificationPermission();
        loadSettings();

        console.log('✅ Sistema de notificaciones listo');
    }

    function createToastContainer() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
        setPosition(CONFIG.DEFAULT_POSITION);
    }

    function setPosition(position) {
        const positions = {
            'top-left': { top: '20px', left: '20px', alignItems: 'flex-start' },
            'top-right': { top: '20px', right: '20px', alignItems: 'flex-end' },
            'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
            'bottom-left': { bottom: '20px', left: '20px', alignItems: 'flex-start' },
            'bottom-right': { bottom: '20px', right: '20px', alignItems: 'flex-end' },
            'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
        };

        const style = positions[position] || positions['bottom-right'];
        Object.assign(toastContainer.style, style);
    }

    // ===== NOTIFICACIONES PUSH =====
    async function checkNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Este navegador no soporta notificaciones push');
            return false;
        }

        if (Notification.permission === 'granted') {
            notificationPermission = true;
            return true;
        }

        return false;
    }

    async function requestPermission() {
        if (!('Notification' in window)) return false;

        try {
            const permission = await Notification.requestPermission();
            notificationPermission = permission === 'granted';
            return notificationPermission;
        } catch (error) {
            console.error('Error solicitando permiso:', error);
            return false;
        }
    }

    function sendPushNotification(title, options = {}) {
        if (!notificationPermission) {
            console.warn('Permiso de notificaciones no concedido');
            return false;
        }

        const defaultOptions = {
            body: '',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/icon-72x72.png',
            vibrate: vibrationEnabled ? [200, 100, 200] : undefined,
            sound: soundEnabled ? '/assets/sounds/notification.mp3' : undefined,
            tag: 'notification',
            renotify: true,
            requireInteraction: false,
            data: {},
            actions: []
        };

        const notificationOptions = { ...defaultOptions, ...options };

        try {
            const notification = new Notification(title, notificationOptions);

            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();

                if (options.onClick) {
                    options.onClick(notification.data);
                }
            };

            return notification;
        } catch (error) {
            console.error('Error enviando notificación:', error);
            return false;
        }
    }

    // ===== TOAST NOTIFICATIONS =====
    function show(message, type = 'info', options = {}) {
        const {
            duration = CONFIG.TOAST_DURATION,
            title = getTitleByType(type),
            position,
            dismissible = true,
            icon = getIconByType(type)
        } = options;

        // Limitar número de toasts
        if (activeToasts.length >= CONFIG.MAX_TOASTS) {
            const oldestToast = activeToasts.shift();
            oldestToast.remove();
        }

        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type} animate-slideIn`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            ${dismissible ? '<button class="toast-close">&times;</button>' : ''}
        `;

        // Posición específica
        if (position) {
            setPosition(position);
        }

        // Evento de cierre
        if (dismissible) {
            toast.querySelector('.toast-close').addEventListener('click', () => {
                closeToast(toast);
            });
        }

        // Auto-cerrar
        if (duration > 0) {
            setTimeout(() => closeToast(toast), duration);
        }

        toastContainer.appendChild(toast);
        activeToasts.push(toast);

        // Reproducir sonido si está habilitado
        if (soundEnabled) {
            playSound(type);
        }

        // Vibrar si está habilitado
        if (vibrationEnabled && type === 'error') {
            vibrate([500, 200, 500]);
        }

        return toast;
    }

    function closeToast(toast) {
        toast.classList.add('animate-slideOut');
        setTimeout(() => {
            toast.remove();
            activeToasts = activeToasts.filter(t => t !== toast);
        }, 300);
    }

    function closeAllToasts() {
        activeToasts.forEach(toast => closeToast(toast));
    }

    function getTitleByType(type) {
        const titles = {
            'success': '✅ Éxito',
            'error': '❌ Error',
            'warning': '⚠️ Advertencia',
            'info': 'ℹ️ Información',
            'biometric': '🔐 Verificación Biométrica',
            'heartbeat': '💓 Heartbeat',
            'sync': '🔄 Sincronización'
        };
        return titles[type] || 'Notificación';
    }

    function getIconByType(type) {
        const icons = {
            'success': '✓',
            'error': '✗',
            'warning': '⚠',
            'info': 'ℹ',
            'biometric': '🔐',
            'heartbeat': '💓',
            'sync': '🔄'
        };
        return icons[type] || '•';
    }

    // ===== ALERTAS =====
    function alert(message, title = 'Alerta', options = {}) {
        const {
            type = 'info',
            confirmText = 'Aceptar',
            cancelText,
            onConfirm,
            onCancel
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content alert-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert-icon ${type}">${getIconByType(type)}</div>
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    ${cancelText ? `<button class="btn-secondary cancel-btn">${cancelText}</button>` : ''}
                    <button class="btn-${type === 'error' ? 'danger' : 'primary'} confirm-btn">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animación
        setTimeout(() => modal.classList.add('show'), 10);

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            closeModal(modal);
            if (onCancel) onCancel();
        });

        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            closeModal(modal);
            if (onConfirm) onConfirm();
        });

        if (cancelText) {
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                closeModal(modal);
                if (onCancel) onCancel();
            });
        }

        // Click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal && cancelText) {
                closeModal(modal);
                if (onCancel) onCancel();
            }
        });
    }

    function confirm(message, title = 'Confirmar', options = {}) {
        const {
            confirmText = 'Aceptar',
            cancelText = 'Cancelar',
            type = 'warning',
            onConfirm,
            onCancel
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content confirm-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="confirm-icon ${type}">${getIconByType(type)}</div>
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary cancel-btn">${cancelText}</button>
                    <button class="btn-${type === 'warning' ? 'warning' : 'primary'} confirm-btn">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animación
        setTimeout(() => modal.classList.add('show'), 10);

        return new Promise((resolve) => {
            modal.querySelector('.modal-close').addEventListener('click', () => {
                closeModal(modal);
                if (onCancel) onCancel();
                resolve(false);
            });

            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                closeModal(modal);
                if (onConfirm) onConfirm();
                resolve(true);
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                closeModal(modal);
                if (onCancel) onCancel();
                resolve(false);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                    if (onCancel) onCancel();
                    resolve(false);
                }
            });
        });
    }

    function closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    // ===== NOTIFICACIONES ESPECÍFICAS =====
    function biometricReminder(finger) {
        show(
            `Coloque el dedo ${finger} en el lector biométrico`,
            'biometric',
            {
                duration: 5000,
                title: '🔐 Verificación Biométrica'
            }
        );

        if (notificationPermission) {
            sendPushNotification('Verificación Biométrica', {
                body: `Coloque el dedo ${finger} en el lector`,
                tag: 'biometric',
                requireInteraction: true
            });
        }
    }

    function classReminder(classInfo) {
        const message = `Tiene clase de ${classInfo.type} en 30 minutos con ${classInfo.instructor}`;
        
        show(message, 'info', {
            duration: 0,
            title: '📅 Recordatorio de Clase'
        });

        if (notificationPermission) {
            sendPushNotification('Recordatorio de Clase', {
                body: message,
                tag: 'class-reminder',
                requireInteraction: true
            });
        }
    }

    function progressUpdate(percentage, type) {
        show(
            `Ha completado ${percentage}% de ${type}`,
            'success',
            {
                title: '📊 Progreso Actualizado'
            }
        );
    }

    function achievementUnlocked(achievement) {
        show(
            `¡Has desbloqueado: ${achievement}!`,
            'success',
            {
                duration: 5000,
                title: '🏆 Logro Desbloqueado'
            }
        );

        if (vibrationEnabled) {
            vibrate([500, 200, 500]);
        }
    }

    function syncComplete(count) {
        show(
            `Se sincronizaron ${count} elementos correctamente`,
            'sync',
            {
                title: '🔄 Sincronización Completada'
            }
        );
    }

    function heartbeatLost() {
        show(
            'Se ha perdido la conexión. Guardando datos localmente...',
            'heartbeat',
            {
                duration: 0,
                title: '💔 Heartbeat Perdido'
            }
        );
    }

    function error(message, error = null) {
        show(message, 'error', {
            duration: 0,
            title: '❌ Error'
        });

        if (error) {
            console.error('Error:', error);
        }
    }

    // ===== SONIDOS =====
    function playSound(type) {
        if (!soundEnabled) return;

        const sounds = {
            'success': '/assets/sounds/success.mp3',
            'error': '/assets/sounds/error.mp3',
            'warning': '/assets/sounds/warning.mp3',
            'info': '/assets/sounds/info.mp3',
            'biometric': '/assets/sounds/biometric.mp3',
            'heartbeat': '/assets/sounds/heartbeat.mp3'
        };

        const soundFile = sounds[type];
        if (!soundFile) return;

        try {
            const audio = new Audio(soundFile);
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (error) {
            console.warn('Error reproduciendo sonido:', error);
        }
    }

    // ===== VIBRACIÓN =====
    function vibrate(pattern) {
        if (!vibrationEnabled || !window.navigator.vibrate) return;

        try {
            window.navigator.vibrate(pattern);
        } catch (error) {
            console.warn('Error vibrando:', error);
        }
    }

    // ===== CONFIGURACIÓN =====
    function loadSettings() {
        soundEnabled = localStorage.getItem('notifications_sound') !== 'false';
        vibrationEnabled = localStorage.getItem('notifications_vibration') !== 'false';
    }

    function setSoundEnabled(enabled) {
        soundEnabled = enabled;
        localStorage.setItem('notifications_sound', enabled);
    }

    function setVibrationEnabled(enabled) {
        vibrationEnabled = enabled;
        localStorage.setItem('notifications_vibration', enabled);
    }

    function setPosition(position) {
        setPosition(position);
        localStorage.setItem('notifications_position', position);
    }

    // ===== UTILIDADES =====
    function getSettings() {
        return {
            soundEnabled,
            vibrationEnabled,
            notificationPermission,
            position: CONFIG.DEFAULT_POSITION,
            maxToasts: CONFIG.MAX_TOASTS
        };
    }

    // ===== API PÚBLICA =====
    return {
        // Inicialización
        init,
        
        // Notificaciones push
        requestPermission,
        sendPushNotification,
        
        // Toasts
        show,
        success: (message, options) => show(message, 'success', options),
        error: (message, options) => show(message, 'error', options),
        warning: (message, options) => show(message, 'warning', options),
        info: (message, options) => show(message, 'info', options),
        closeAll: closeAllToasts,
        
        // Alertas y confirmaciones
        alert,
        confirm,
        
        // Notificaciones específicas
        biometricReminder,
        classReminder,
        progressUpdate,
        achievementUnlocked,
        syncComplete,
        heartbeatLost,
        
        // Sonido y vibración
        playSound,
        vibrate,
        
        // Configuración
        setSoundEnabled,
        setVibrationEnabled,
        setPosition,
        getSettings
    };
})();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    CEANotifications.init();
});

// Exponer globalmente
window.CEANotifications = CEANotifications;