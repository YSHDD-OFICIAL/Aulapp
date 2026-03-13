/**
 * charts.js - Sistema de gráficos y visualizaciones
 * Gráficos circulares, de barras, líneas y radar
 * Versión: 1.0.0
 */

const CECharts = (function() {
    // ===== CONFIGURACIÓN =====
    const COLORS = {
        primary: ['#2a5298', '#4a7db5', '#6b9fd8'],
        success: ['#4caf50', '#80e27e', '#b9f6ca'],
        warning: ['#ff9800', '#ffb74d', '#ffe082'],
        danger: ['#f44336', '#e57373', '#ffcdd2'],
        info: ['#2196f3', '#64b5f6', '#bbdefb'],
        gray: ['#9e9e9e', '#bdbdbd', '#e0e0e0']
    };

    // ===== GRÁFICO CIRCULAR =====
    class CircularChart {
        constructor(canvasId, options = {}) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error(`Canvas ${canvasId} no encontrado`);
                return;
            }

            this.ctx = this.canvas.getContext('2d');
            this.options = {
                size: options.size || 200,
                strokeWidth: options.strokeWidth || 20,
                backgroundColor: options.backgroundColor || '#f0f0f0',
                colors: options.colors || [COLORS.primary[0]],
                animation: options.animation !== false,
                animationDuration: options.animationDuration || 1000,
                showPercentage: options.showPercentage !== false,
                ...options
            };

            this.data = options.data || [{ value: 0, label: '' }];
            this.total = this.data.reduce((sum, item) => sum + item.value, 0);
            
            this.init();
        }

        init() {
            this.canvas.width = this.options.size;
            this.canvas.height = this.options.size;
            this.centerX = this.options.size / 2;
            this.centerY = this.options.size / 2;
            this.radius = (this.options.size - this.options.strokeWidth) / 2;
        }

        draw(percentages = null) {
            this.ctx.clearRect(0, 0, this.options.size, this.options.size);

            if (this.data.length === 1) {
                // Gráfico simple de progreso
                this.drawSingleProgress(percentages || this.data[0].value);
            } else {
                // Gráfico de pastel múltiple
                this.drawPieChart();
            }
        }

        drawSingleProgress(percentage) {
            // Fondo
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
            this.ctx.strokeStyle = this.options.backgroundColor;
            this.ctx.lineWidth = this.options.strokeWidth;
            this.ctx.stroke();

            // Progreso
            const endAngle = (percentage / 100) * 2 * Math.PI - 0.5 * Math.PI;
            
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.radius, -0.5 * Math.PI, endAngle);
            this.ctx.strokeStyle = this.options.colors[0];
            this.ctx.lineWidth = this.options.strokeWidth;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            // Porcentaje
            if (this.options.showPercentage) {
                this.ctx.font = `bold ${this.options.size * 0.15}px var(--font-family-primary)`;
                this.ctx.fillStyle = '#333';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${Math.round(percentage)}%`, this.centerX, this.centerY);
            }
        }

        drawPieChart() {
            let startAngle = -0.5 * Math.PI;
            
            this.data.forEach((item, index) => {
                const sliceAngle = (item.value / this.total) * 2 * Math.PI;
                const endAngle = startAngle + sliceAngle;

                // Dibujar sector
                this.ctx.beginPath();
                this.ctx.moveTo(this.centerX, this.centerY);
                this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
                this.ctx.closePath();

                this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
                this.ctx.fill();

                // Dibujar etiqueta
                const labelAngle = startAngle + sliceAngle / 2;
                const labelRadius = this.radius * 0.7;
                const labelX = this.centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = this.centerY + Math.sin(labelAngle) * labelRadius;

                if (item.value / this.total > 0.05) { // Solo mostrar si > 5%
                    this.ctx.font = `bold ${this.options.size * 0.08}px var(--font-family-primary)`;
                    this.ctx.fillStyle = '#fff';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(`${Math.round(item.value / this.total * 100)}%`, labelX, labelY);
                }

                startAngle = endAngle;
            });

            // Leyenda
            this.drawLegend();
        }

        drawLegend() {
            const legendX = this.options.size + 20;
            const legendY = 20;
            
            this.data.forEach((item, index) => {
                const y = legendY + index * 25;
                
                // Color
                this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
                this.ctx.fillRect(legendX, y, 15, 15);
                
                // Texto
                this.ctx.font = '12px var(--font-family-primary)';
                this.ctx.fillStyle = '#333';
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${item.label} (${item.value})`, legendX + 20, y + 7);
            });
        }

        animate(targetPercentage) {
            if (!this.options.animation) {
                this.draw(targetPercentage);
                return;
            }

            const startPercentage = this.data[0].value;
            const startTime = performance.now();

            const animateFrame = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / this.options.animationDuration, 1);
                
                const currentPercentage = startPercentage + (targetPercentage - startPercentage) * progress;
                this.draw(currentPercentage);

                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    this.data[0].value = targetPercentage;
                }
            };

            requestAnimationFrame(animateFrame);
        }

        updateData(newData) {
            this.data = newData;
            this.total = this.data.reduce((sum, item) => sum + item.value, 0);
            this.draw();
        }
    }

    // ===== GRÁFICO DE BARRAS =====
    class BarChart {
        constructor(canvasId, options = {}) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.options = {
                width: options.width || 600,
                height: options.height || 400,
                margin: options.margin || 50,
                barColor: options.barColor || COLORS.primary[0],
                barSpacing: options.barSpacing || 10,
                showValues: options.showValues !== false,
                showGrid: options.showGrid !== false,
                ...options
            };

            this.data = options.data || [];
            this.init();
        }

        init() {
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;
            this.chartWidth = this.options.width - 2 * this.options.margin;
            this.chartHeight = this.options.height - 2 * this.options.margin;
        }

        draw() {
            this.ctx.clearRect(0, 0, this.options.width, this.options.height);
            
            this.drawAxes();
            this.drawGrid();
            this.drawBars();
        }

        drawAxes() {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 2;

            // Eje Y
            this.ctx.moveTo(this.options.margin, this.options.margin);
            this.ctx.lineTo(this.options.margin, this.options.height - this.options.margin);

            // Eje X
            this.ctx.moveTo(this.options.margin, this.options.height - this.options.margin);
            this.ctx.lineTo(this.options.width - this.options.margin, this.options.height - this.options.margin);

            this.ctx.stroke();
        }

        drawGrid() {
            if (!this.options.showGrid) return;

            const maxValue = Math.max(...this.data.map(d => d.value));
            const gridLines = 5;

            this.ctx.beginPath();
            this.ctx.strokeStyle = '#eee';
            this.ctx.lineWidth = 0.5;

            for (let i = 0; i <= gridLines; i++) {
                const y = this.options.margin + (this.chartHeight * i) / gridLines;
                
                this.ctx.moveTo(this.options.margin, y);
                this.ctx.lineTo(this.options.width - this.options.margin, y);
                
                // Etiqueta
                const value = maxValue - (maxValue * i) / gridLines;
                this.ctx.font = '12px var(--font-family-primary)';
                this.ctx.fillStyle = '#999';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(Math.round(value), this.options.margin - 10, y + 4);
            }

            this.ctx.stroke();
        }

        drawBars() {
            const maxValue = Math.max(...this.data.map(d => d.value));
            const barWidth = (this.chartWidth - (this.data.length - 1) * this.options.barSpacing) / this.data.length;

            this.data.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * this.chartHeight;
                const x = this.options.margin + index * (barWidth + this.options.barSpacing);
                const y = this.options.height - this.options.margin - barHeight;

                // Barra
                this.ctx.fillStyle = Array.isArray(this.options.barColor) 
                    ? this.options.barColor[index % this.options.barColor.length]
                    : this.options.barColor;
                
                this.ctx.fillRect(x, y, barWidth, barHeight);

                // Valor
                if (this.options.showValues) {
                    this.ctx.font = '12px var(--font-family-primary)';
                    this.ctx.fillStyle = '#333';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(item.value, x + barWidth / 2, y - 10);
                }

                // Etiqueta
                this.ctx.font = '12px var(--font-family-primary)';
                this.ctx.fillStyle = '#666';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(item.label, x + barWidth / 2, this.options.height - this.options.margin + 20);
            });
        }

        updateData(newData) {
            this.data = newData;
            this.draw();
        }
    }

    // ===== GRÁFICO DE LÍNEAS =====
    class LineChart {
        constructor(canvasId, options = {}) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.options = {
                width: options.width || 600,
                height: options.height || 400,
                margin: options.margin || 50,
                lineColor: options.lineColor || COLORS.primary[0],
                fillArea: options.fillArea || false,
                showPoints: options.showPoints !== false,
                ...options
            };

            this.data = options.data || [];
            this.init();
        }

        init() {
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;
            this.chartWidth = this.options.width - 2 * this.options.margin;
            this.chartHeight = this.options.height - 2 * this.options.margin;
        }

        draw() {
            this.ctx.clearRect(0, 0, this.options.width, this.options.height);
            
            this.drawAxes();
            this.drawGrid();
            this.drawLine();
        }

        drawAxes() {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 2;

            // Eje Y
            this.ctx.moveTo(this.options.margin, this.options.margin);
            this.ctx.lineTo(this.options.margin, this.options.height - this.options.margin);

            // Eje X
            this.ctx.moveTo(this.options.margin, this.options.height - this.options.margin);
            this.ctx.lineTo(this.options.width - this.options.margin, this.options.height - this.options.margin);

            this.ctx.stroke();
        }

        drawGrid() {
            const values = this.data.map(d => d.value);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const gridLines = 5;

            this.ctx.beginPath();
            this.ctx.strokeStyle = '#eee';
            this.ctx.lineWidth = 0.5;

            for (let i = 0; i <= gridLines; i++) {
                const y = this.options.margin + (this.chartHeight * i) / gridLines;
                
                this.ctx.moveTo(this.options.margin, y);
                this.ctx.lineTo(this.options.width - this.options.margin, y);
                
                // Etiqueta
                const value = maxValue - ((maxValue - minValue) * i) / gridLines;
                this.ctx.font = '12px var(--font-family-primary)';
                this.ctx.fillStyle = '#999';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(Math.round(value), this.options.margin - 10, y + 4);
            }

            this.ctx.stroke();
        }

        drawLine() {
            const values = this.data.map(d => d.value);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const range = maxValue - minValue || 1;

            // Dibujar línea
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.options.lineColor;
            this.ctx.lineWidth = 3;

            this.data.forEach((item, index) => {
                const x = this.options.margin + (index * this.chartWidth) / (this.data.length - 1);
                const y = this.options.height - this.options.margin - 
                         ((item.value - minValue) / range) * this.chartHeight;

                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }

                // Puntos
                if (this.options.showPoints) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.strokeStyle = this.options.lineColor;
                    this.ctx.lineWidth = 2;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.stroke();

                    // Valor
                    this.ctx.font = '12px var(--font-family-primary)';
                    this.ctx.fillStyle = '#333';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(item.value, x, y - 15);
                }
            });

            this.ctx.stroke();

            // Rellenar área
            if (this.options.fillArea) {
                const firstX = this.options.margin;
                const lastX = this.options.margin + this.chartWidth;
                const baseY = this.options.height - this.options.margin;

                this.ctx.lineTo(lastX, baseY);
                this.ctx.lineTo(firstX, baseY);
                this.ctx.closePath();
                
                this.ctx.fillStyle = this.options.lineColor + '20'; // 20% opacity
                this.ctx.fill();
            }

            // Etiquetas del eje X
            this.data.forEach((item, index) => {
                const x = this.options.margin + (index * this.chartWidth) / (this.data.length - 1);
                
                this.ctx.font = '12px var(--font-family-primary)';
                this.ctx.fillStyle = '#666';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(item.label, x, this.options.height - this.options.margin + 20);
            });
        }

        updateData(newData) {
            this.data = newData;
            this.draw();
        }
    }

    // ===== GRÁFICO DE RADAR =====
    class RadarChart {
        constructor(canvasId, options = {}) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.options = {
                size: options.size || 400,
                levels: options.levels || 5,
                color: options.color || COLORS.primary[0],
                ...options
            };

            this.data = options.data || [];
            this.init();
        }

        init() {
            this.canvas.width = this.options.size;
            this.canvas.height = this.options.size;
            this.centerX = this.options.size / 2;
            this.centerY = this.options.size / 2;
            this.radius = this.options.size * 0.4;
            this.angleStep = (2 * Math.PI) / this.data.length;
        }

        draw() {
            this.ctx.clearRect(0, 0, this.options.size, this.options.size);
            
            this.drawGrid();
            this.drawAxes();
            this.drawData();
            this.drawLabels();
        }

        drawGrid() {
            // Círculos concéntricos
            for (let level = 1; level <= this.options.levels; level++) {
                const r = (this.radius * level) / this.options.levels;
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#ddd';
                this.ctx.lineWidth = 0.5;

                for (let i = 0; i <= this.data.length; i++) {
                    const angle = i * this.angleStep - Math.PI / 2;
                    const x = this.centerX + r * Math.cos(angle);
                    const y = this.centerY + r * Math.sin(angle);

                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }

                this.ctx.closePath();
                this.ctx.stroke();
            }
        }

        drawAxes() {
            for (let i = 0; i < this.data.length; i++) {
                const angle = i * this.angleStep - Math.PI / 2;
                const x = this.centerX + this.radius * Math.cos(angle);
                const y = this.centerY + this.radius * Math.sin(angle);

                this.ctx.beginPath();
                this.ctx.strokeStyle = '#ccc';
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(this.centerX, this.centerY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        }

        drawData() {
            const maxValue = Math.max(...this.data.map(d => d.value));

            this.ctx.beginPath();
            this.ctx.fillStyle = this.options.color + '40'; // 25% opacity
            this.ctx.strokeStyle = this.options.color;
            this.ctx.lineWidth = 2;

            for (let i = 0; i < this.data.length; i++) {
                const value = this.data[i].value;
          