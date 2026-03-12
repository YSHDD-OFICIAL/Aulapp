/**
 * charts.js - Sistema de gráficos para dashboard
 */

const CECharts = (function() {
    return {
        /**
         * Crear gráfico circular de progreso
         */
        createProgressCircle(canvasId, porcentaje, color = '#4CAF50') {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const radio = Math.min(width, height) / 2 - 10;
            const centroX = width / 2;
            const centroY = height / 2;
            
            // Limpiar canvas
            ctx.clearRect(0, 0, width, height);
            
            // Fondo del círculo
            ctx.beginPath();
            ctx.arc(centroX, centroY, radio, 0, 2 * Math.PI);
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 10;
            ctx.stroke();
            
            // Progreso
            const angulo = (porcentaje / 100) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(centroX, centroY, radio, 0, angulo);
            ctx.strokeStyle = color;
            ctx.lineWidth = 10;
            ctx.stroke();
            
            // Texto del porcentaje
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${porcentaje}%`, centroX, centroY);
        },
        
        /**
         * Crear gráfico de barras
         */
        createBarChart(canvasId, datos, opciones = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            const margen = opciones.margen || 50;
            const anchoBarra = (width - 2 * margen) / datos.length - 10;
            
            // Encontrar valor máximo
            const maxValor = Math.max(...datos.map(d => d.valor));
            
            // Dibujar ejes
            ctx.beginPath();
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            
            // Eje Y
            ctx.moveTo(margen, margen);
            ctx.lineTo(margen, height - margen);
            
            // Eje X
            ctx.moveTo(margen, height - margen);
            ctx.lineTo(width - margen, height - margen);
            ctx.stroke();
            
            // Dibujar barras
            datos.forEach((dato, index) => {
                const x = margen + index * (anchoBarra + 10);
                const alturaBarra = (dato.valor / maxValor) * (height - 2 * margen);
                const y = height - margen - alturaBarra;
                
                // Barra
                ctx.fillStyle = opciones.colores?.[index] || '#2a5298';
                ctx.fillRect(x, y, anchoBarra, alturaBarra);
                
                // Etiqueta
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(dato.label, x + anchoBarra / 2, height - margen + 20);
                
                // Valor
                ctx.fillStyle = '#666';
                ctx.fillText(dato.valor, x + anchoBarra / 2, y - 5);
            });
        },
        
        /**
         * Crear gráfico de líneas (progreso temporal)
         */
        createLineChart(canvasId, datos, opciones = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            const margen = 40;
            const anchoGrafico = width - 2 * margen;
            const altoGrafico = height - 2 * margen;
            
            const valores = datos.map(d => d.valor);
            const minValor = Math.min(...valores);
            const maxValor = Math.max(...valores);
            const rango = maxValor - minValor || 1;
            
            // Dibujar ejes
            ctx.beginPath();
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            
            // Eje Y
            ctx.moveTo(margen, margen);
            ctx.lineTo(margen, height - margen);
            
            // Eje X
            ctx.moveTo(margen, height - margen);
            ctx.lineTo(width - margen, height - margen);
            ctx.stroke();
            
            // Dibujar líneas de referencia
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 0.5;
            
            for (let i = 0; i <= 5; i++) {
                const y = margen + (altoGrafico * i) / 5;
                ctx.beginPath();
                ctx.moveTo(margen, y);
                ctx.lineTo(width - margen, y);
                ctx.stroke();
            }
            
            // Dibujar línea de datos
            ctx.beginPath();
            ctx.strokeStyle = opciones.color || '#2a5298';
            ctx.lineWidth = 3;
            
            datos.forEach((dato, index) => {
                const x = margen + (index * anchoGrafico) / (datos.length - 1);
                const y = height - margen - ((dato.valor - minValor) / rango) * altoGrafico;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Punto en cada dato
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = opciones.color || '#2a5298';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });
            
            ctx.stroke();
            
            // Etiquetas del eje X
            datos.forEach((dato, index) => {
                const x = margen + (index * anchoGrafico) / (datos.length - 1);
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(dato.fecha, x, height - margen + 15);
            });
        },
        
        /**
         * Crear gráfico de radar (habilidades)
         */
        createRadarChart(canvasId, datos, opciones = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const centroX = width / 2;
            const centroY = height / 2;
            const radio = Math.min(width, height) / 2 - 40;
            
            const angulo = (2 * Math.PI) / datos.length;
            
            // Dibujar círculos concéntricos
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 0.5;
            
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centroX, centroY, (radio * i) / 5, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            // Dibujar líneas radiales
            ctx.beginPath();
            ctx.strokeStyle = '#ddd';
            
            for (let i = 0; i < datos.length; i++) {
                const x = centroX + radio * Math.cos(i * angulo - Math.PI / 2);
                const y = centroY + radio * Math.sin(i * angulo - Math.PI / 2);
                
                ctx.moveTo(centroX, centroY);
                ctx.lineTo(x, y);
                ctx.stroke();
                
                // Etiquetas
                const labelX = centroX + (radio + 20) * Math.cos(i * angulo - Math.PI / 2);
                const labelY = centroY + (radio + 20) * Math.sin(i * angulo - Math.PI / 2);
                
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(datos[i].label, labelX, labelY);
            }
            
            // Dibujar datos
            ctx.beginPath();
            ctx.fillStyle = 'rgba(42, 82, 152, 0.2)';
            ctx.strokeStyle = '#2a5298';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < datos.length; i++) {
                const valor = (datos[i].valor / 100) * radio;
                const x = centroX + valor * Math.cos(i * angulo - Math.PI / 2);
                const y = centroY + valor * Math.sin(i * angulo - Math.PI / 2);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        },
        
        /**
         * Crear gráfico de pastel
         */
        createPieChart(canvasId, datos, opciones = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const centroX = width / 2;
            const centroY = height / 2;
            const radio = Math.min(width, height) / 2 - 20;
            
            const total = datos.reduce((sum, d) => sum + d.valor, 0);
            let anguloInicio = 0;
            
            const colores = opciones.colores || [
                '#2a5298', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'
            ];
            
            datos.forEach((dato, index) => {
                const angulo = (dato.valor / total) * 2 * Math.PI;
                
                ctx.beginPath();
                ctx.fillStyle = colores[index % colores.length];
                ctx.moveTo(centroX, centroY);
                ctx.arc(centroX, centroY, radio, anguloInicio, anguloInicio + angulo);
                ctx.closePath();
                ctx.fill();
                
                // Etiqueta
                const anguloMedio = anguloInicio + angulo / 2;
                const labelX = centroX + (radio / 1.5) * Math.cos(anguloMedio);
                const labelY = centroY + (radio / 1.5) * Math.sin(anguloMedio);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dato.label, labelX, labelY);
                
                anguloInicio += angulo;
            });
            
            // Leyenda
            const leyendaY = height - 50;
            datos.forEach((dato, index) => {
                const x = 50 + index * 100;
                
                ctx.fillStyle = colores[index % colores.length];
                ctx.fillRect(x, leyendaY, 15, 15);
                
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(dato.label, x + 20, leyendaY + 12);
            });
        }
    };
})();

window.CECharts = CECharts;