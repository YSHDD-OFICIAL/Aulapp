/**
 * biometric-modal.js - Componente modal para verificación biométrica
 */

class BiometricModal {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Verificación Biométrica',
            requiredFinger: options.requiredFinger || 'left_index',
            onSuccess: options.onSuccess || (() => {}),
            onCancel: options.onCancel || (() => {}),
            ...options
        };
        
        this.modal = null;
        this.isOpen = false;
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'biometric-modal-overlay';
        modal.innerHTML = `
            <div class="biometric-modal">
                <div class="modal-header">
                    <h3>${this.options.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="finger-selector">
                        <div class="hands-container">
                            <div class="hand left-hand">
                                <h4>Mano Izquierda</h4>
                                ${this.renderHand('left')}
                            </div>
                            <div class="hand right-hand">
                                <h4>Mano Derecha</h4>
                                ${this.renderHand('right')}
                            </div>
                        </div>
                        
                        <div class="finger-instruction" id="finger-instruction">
                            Coloque el dedo <strong>${this.getFingerName(this.options.requiredFinger)}</strong> en el lector
                        </div>
                    </div>
                    
                    <div class="biometric-status" id="biometric-status">
                        <div class="status-indicator waiting"></div>
                        <span class="status-text">Esperando huella...</span>
                    </div>
                    
                    <div class="biometric-progress" id="biometric-progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
                    <button class="btn btn-primary" id="verify-btn" disabled>Verificando...</button>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    renderHand(side) {
        const fingers = ['thumb', 'index', 'middle', 'ring', 'little'];
        const positions = {
            thumb: { x: side === 'left' ? 30 : 70, y: 50 },
            index: { x: side === 'left' ? 40 : 60, y: 90 },
            middle: { x: side === 'left' ? 50 : 50, y: 130 },
            ring: { x: side === 'left' ? 60 : 40, y: 170 },
            little: { x: side === 'left' ? 70 : 30, y: 210 }
        };
        
        let svg = `<svg viewBox="0 0 100 250" class="hand-svg">`;
        
        fingers.forEach(finger => {
            const pos = positions[finger];
            const isRequired = `${side}_${finger}` === this.options.requiredFinger;
            
            svg += `
                <rect
                    x="${pos.x - 10}"
                    y="${pos.y - 20}"
                    width="20"
                    height="60"
                    rx="10"
                    class="finger ${isRequired ? 'required' : ''}"
                    data-finger="${side}_${finger}"
                />
                <text
                    x="${pos.x}"
                    y="${pos.y + 15}"
                    text-anchor="middle"
                    fill="${isRequired ? 'white' : '#333'}"
                    font-size="8"
                >
                    ${finger}
                </text>
            `;
        });
        
        svg += `</svg>`;
        return svg;
    }
    
    getFingerName(fingerCode) {
        const names = {
            'left_thumb': 'Pulgar Izquierdo',
            'left_index': 'Índice Izquierdo',
            'left_middle': 'Medio Izquierdo',
            'left_ring': 'Anular Izquierdo',
            'left_little': 'Meñique Izquierdo',
            'right_thumb': 'Pulgar Derecho',
            'right_index': 'Índice Derecho',
            'right_middle': 'Medio Derecho',
            'right_ring': 'Anular Derecho',
            'right_little': 'Meñique Derecho'
        };
        return names[fingerCode] || fingerCode;
    }
    
    open() {
        if (this.isOpen) return;
        
        this.modal = this.createModal();
        document.body.appendChild(this.modal);
        this.isOpen = true;
        
        // Evitar scroll del body
        document.body.style.overflow = 'hidden';
        
        // Event listeners
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('#cancel-btn').addEventListener('click', () => this.cancel());
        
        // Animar entrada
        setTimeout(() => {
            this.modal.classList.add('open');
        }, 10);
        
        // Simular verificación después de 3 segundos
        this.simulateVerification();
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.modal.classList.remove('open');
        setTimeout(() => {
            this.modal.remove();
            document.body.style.overflow = '';
            this.isOpen = false;
        }, 300);
    }
    
    cancel() {
        this.options.onCancel();
        this.close();
    }
    
    async simulateVerification() {
        const statusEl = this.modal.querySelector('#biometric-status .status-text');
        const indicatorEl = this.modal.querySelector('.status-indicator');
        const progressBar = this.modal.querySelector('.progress-bar');
        const verifyBtn = this.modal.querySelector('#verify-btn');
        
        // Actualizar estado
        statusEl.textContent = 'Coloque su huella...';
        indicatorEl.className = 'status-indicator waiting';
        
        // Simular progreso
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                statusEl.textContent = '✅ Huella verificada correctamente';
                indicatorEl.className = 'status-indicator success';
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Continuar';
                
                verifyBtn.addEventListener('click', () => {
                    this.options.onSuccess();
                    this.close();
                });
            }
        }, 300);
        
        // Si hay API Bridge real, usar eso
        if (window.CEABiometric) {
            try {
                const result = await CEABiometric.verifyStudentFinger(
                    this.options.requiredFinger,
                    this.options.userId
                );
                
                if (result.verified) {
                    clearInterval(interval);
                    progressBar.style.width = '100%';
                    statusEl.textContent = '✅ Huella verificada';
                    indicatorEl.className = 'status-indicator success';
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Continuar';
                } else {
                    statusEl.textContent = '❌ Error de verificación';
                    indicatorEl.className = 'status-indicator error';
                }
            } catch (error) {
                statusEl.textContent = '❌ Error en lector biométrico';
                indicatorEl.className = 'status-indicator error';
            }
        }
    }
    
    setRequiredFinger(fingerCode) {
        this.options.requiredFinger = fingerCode;
        
        if (this.isOpen) {
            const instruction = this.modal.querySelector('#finger-instruction');
            instruction.innerHTML = `Coloque el dedo <strong>${this.getFingerName(fingerCode)}</strong> en el lector`;
            
            // Actualizar resaltado de dedos
            this.modal.querySelectorAll('.finger').forEach(f => {
                f.classList.remove('required');
                if (f.dataset.finger === fingerCode) {
                    f.classList.add('required');
                }
            });
        }
    }
}

// Registrar global
window.BiometricModal = BiometricModal;