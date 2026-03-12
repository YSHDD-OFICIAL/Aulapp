/**
 * export.js - Exportación de datos a CSV
 */
const CEAExport = (function() {
    return {
        /**
         * Exportar cualquier tabla a CSV
         */
        async toCSV(storeName, filename = null) {
            const data = await CEADB.getAll(storeName);
            
            if (data.length === 0) {
                alert('No hay datos para exportar');
                return;
            }
            
            // Obtener headers
            const headers = Object.keys(data[0]).filter(key => 
                !key.includes('password') && key !== 'id'
            );
            
            // Crear contenido CSV
            let csv = headers.join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    let value = row[header] || '';
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csv += values.join(',') + '\n';
            });
            
            // Descargar archivo
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.href = url;
            link.download = filename || `${storeName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            return csv;
        },
        
        /**
         * Exportar progreso de estudiante
         */
        async exportStudentProgress(studentId) {
            const student = await CEADB.getById('usuarios', studentId);
            const progreso = await CEADB.getProgresoAlumno(studentId);
            const sesiones = await CEADB.getAll('sesiones');
            const sesionesAlumno = sesiones.filter(s => s.alumno_id === studentId);
            
            const data = {
                estudiante: {
                    nombre: student.nombre_completo,
                    documento: student.numero_documento,
                    categoria: student.categoria_aspirada
                },
                progreso: progreso,
                sesiones: sesionesAlumno,
                fecha_exportacion: new Date().toISOString()
            };
            
            // Convertir a CSV
            let csv = 'TIPO,DETALLE,VALOR,FECHA\n';
            
            // Progreso
            progreso.forEach(p => {
                csv += `PROGRESO,${p.modulo},${p.minutos_completados}/${p.minutos_requeridos},${p.fecha_actualizacion}\n`;
            });
            
            // Sesiones
            sesionesAlumno.forEach(s => {
                csv += `SESION,${s.fecha},${s.minutos_totales || 0} minutos,${s.hora_inicio}\n`;
            });
            
            return csv;
        },
        
        /**
         * Importar desde CSV
         */
        async importFromCSV(file, storeName) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const csv = e.target.result;
                        const lines = csv.split('\n');
                        const headers = lines[0].split(',').map(h => h.trim());
                        
                        for (let i = 1; i < lines.length; i++) {
                            if (!lines[i].trim()) continue;
                            
                            const values = this.parseCSVLine(lines[i]);
                            const data = {};
                            
                            headers.forEach((header, index) => {
                                data[header] = values[index];
                            });
                            
                            await CEADB.insert(storeName, data);
                        }
                        
                        resolve(`Importados ${lines.length - 1} registros`);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.readAsText(file);
            });
        },
        
        /**
         * Parsear línea CSV respetando comillas
         */
        parseCSVLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            
            values.push(current);
            return values.map(v => v.replace(/^"|"$/g, ''));
        }
    };
})();

window.CEAExport = CEAExport;