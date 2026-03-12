/**
 * circular-progress.js - Componente de círculo de progreso
 */

class CircularProgress {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            size: options.size || 150,
            strokeWidth: options.strokeWidth || 10,
            color: options.color || '#2a5298',
            backgroundColor: options.backgroundColor || '#e0e0e0',
            animate: options.animate !== false,
            duration: options.duration || 1000,
            ...options
        };
        
        this.progress = 0;
        this.init();
    }
    
    init() {
        // Crear SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', '0 0 100 100');
        this.svg.style.width = `${this.options.size}px`;
        this.svg.style.height = `${this.options.size}px`;
        
        // Círculo de fondo
        this.backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.backgroundCircle.setAttribute('cx', '50');
        this.backgroundCircle.setAttribute('cy', '50');
        this.backgroundCircle.setAttribute('r', '45');
        this.backgroundCircle.setAttribute('fill', 'none');
        this.backgroundCircle.setAttribute('stroke', this.options.backgroundColor);
        this.backgroundCircle.setAttribute('stroke-width', this.options.strokeWidth);
        this.svg.appendChild(this.backgroundCircle);
        
        // Círculo de progreso
        this.progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.progressCircle.setAttribute('cx', '50');
        this.progressCircle.setAttribute('cy', '50');
        this.progressCircle.setAttribute('r', '45');
        this.progressCircle.setAttribute('fill', 'none');
        this.progressCircle.setAttribute('stroke', this.options.color);
        this.progressCircle.setAttribute('stroke-width', this.options.strokeWidth);
        this.progressCircle.setAttribute('stroke-linecap', 'round');
        this.progressCircle.setAttribute('stroke-dasharray', '282.6');
        this.progressCircle.setAttribute('stroke-dashoffset', '282.6');
        this.progressCircle.style.transition = this.options.animate ? 
            `stroke-dashoffset ${this.options.duration}ms ease` : 'none';
        this.svg.appendChild(this.progressCircle);
        
        // Texto del porcentaje
        this.text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.text.setAttribute('x', '50');
        this.text.setAttribute('y', '55');
        this.text.setAttribute('text-anchor', 'middle');
        this.text.setAttribute('dominant-baseline', 'middle');
        this.text.setAttribute('font-size', '20');
        this.text.setAttribute('font-weight', 'bold');
        this.text.setAttribute('fill', '#333');
        this.text.textContent = '0%';
        this.svg.appendChild(this.text);
        
        this.element.appendChild(this.svg);
    }
    
    setProgress(percent) {
        this.progress = Math.min(100, Math.max(0, percent));
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (this.progress / 100) * circumference;
        
        this.progressCircle.setAttribute('stroke-dashoffset', offset);
        this.text.textContent = `${Math.round(this.progress)}%`;
    }
    
    animateTo(percent) {
        const start = this.progress;
        const end = Math.min(100, Math.max(0, percent));
        const steps = 60;
        const increment = (end - start) / steps;
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            this.setProgress(current);
        }, this.options.duration / steps);
    }
    
    setColor(color) {
        this.progressCircle.setAttribute('stroke', color);
        this.options.color = color;
    }
}

// Registrar como componente global
window.CircularProgress = CircularProgress;