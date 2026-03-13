/**
 * export.js - Sistema de exportación e importación de datos
 * Soporte para CSV, JSON y PDF
 * Versión: 1.0.0
 */

const CEAExport = (function() {
    // ===== CONFIGURACIÓN =====
    const FORMATS = {
        CSV: 'csv',
        JSON: 'json',
        PDF: 'pdf'
    };

    // ===== EXPORTAR A CSV =====
    async function toCSV(storeName, options = {}) {
        const {
            filename = `${storeName}_${new Date().toISOString().split('T')[0]}.csv`,
            delimiter = ',',
            includeHeaders = true,
            filters = {}
        } = options;

        try {
            // Obtener datos
            const data = await CEADB.getAll(storeName, filters);
            
            if (data.length === 0) {
                throw new Error('No hay datos para exportar');
            }

            // Obtener headers (excluir campos internos)
            const excludeFields = ['_sync', 'password_hash'];
            const headers = Object.keys(data[0]).filter(key => !excludeFields.includes(key));

            // Crear contenido CSV
            let csv = '';

            // Headers
            if (includeHeaders) {
                csv += headers.join(delimiter) + '\n';
            }

            // Datos
            data.forEach(row => {
                const values = headers.map(header => {
                    let value = row[header] || '';
                    
                    // Escapar caracteres especiales
                    if (typeof value === 'string') {
                        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
                            value = `"${value.replace(/"/g, '""')}"`;
                        }
                    }
                    
                    return value;
                });
                
                csv += values.join(delimiter) + '\n';
            });

            // Descargar archivo
            downloadFile(csv, filename, 'text/csv;charset=utf-8;');

            // Registrar evento
            await CEADB.insert('logs', {
                tipo: 'export',
                store: storeName,
                format: 'csv',
                records: data.length,
                fecha: new Date().toISOString()
            });

            return {
                success: true,
                records: data.length,
                filename
            };

        } catch (error) {
            console.error('Error exportando a CSV:', error);
            throw error;
        }
    }

    // ===== EXPORTAR A JSON =====
    async function toJSON(storeName, options = {}) {
        const {
            filename = `${storeName}_${new Date().toISOString().split('T')[0]}.json`,
            pretty = true,
            filters = {}
        } = options;

        try {
            // Obtener datos
            const data = await CEADB.getAll(storeName, filters);

            if (data.length === 0) {
                throw new Error('No hay datos para exportar');
            }

            // Crear objeto de exportación
            const exportData = {
                _metadata: {
                    store: storeName,
                    exportedAt: new Date().toISOString(),
                    version: CEADB.DB_VERSION,
                    records: data.length
                },
                data: data
            };

            // Convertir a JSON
            const json = pretty ? 
                JSON.stringify(exportData, null, 2) : 
                JSON.stringify(exportData);

            // Descargar archivo
            downloadFile(json, filename, 'application/json');

            // Registrar evento
            await CEADB.insert('logs', {
                tipo: 'export',
                store: storeName,
                format: 'json',
                records: data.length,
                fecha: new Date().toISOString()
            });

            return {
                success: true,
                records: data.length,
                filename
            };

        } catch (error) {
            console.error('Error exportando a JSON:', error);
            throw error;
        }
    }

    // ===== EXPORTAR A PDF (simplificado) =====
    async function toPDF(storeName, options = {}) {
        const {
            filename = `${storeName}_${new Date().toISOString().split('T')[0]}.pdf`,
            title = `Reporte de ${storeName}`,
            filters = {}
        } = options;

        try {
            // Obtener datos
            const data = await CEADB.getAll(storeName, filters);

            if (data.length === 0) {
                throw new Error('No hay datos para exportar');
            }

            // Crear contenido HTML para PDF
            let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 2cm; }
                        h1 { color: #1e3c72; }
                        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                        th { background: #1e3c72; color: white; padding: 10px; }
                        td { border: 1px solid #ccc; padding: 8px; }
                        .footer { margin-top: 30px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p>Fecha de exportación: ${new Date().toLocaleDateString()}</p>
                    <p>Total de registros: ${data.length}</p>
                    
                    <table>
                        <thead>
                            <tr>
            `;

            // Headers
            const headers = Object.keys(data[0]).filter(key => !key.startsWith('_'));
            headers.forEach(header => {
                html += `<th>${header}</th>`;
            });

            html += `
                            </tr>
                        </thead>
                        <tbody>
            `;

            // Datos
            data.forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    html += `<td>${row[header] || ''}</td>`;
                });
                html += '</tr>';
            });

            html += `
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        Generado por Sistema CEA Biométrico - Ley 2026
                    </div>
                </body>
                </html>
            `;

            // En un entorno real, aquí se usaría una librería como jsPDF
            // Por ahora, simulamos la descarga como HTML
            downloadFile(html, filename.replace('.pdf', '.html'), 'text/html');

            // Registrar evento
            await CEADB.insert('logs', {
                tipo: 'export',
                store: storeName,
                format: 'pdf',
                records: data.length,
                fecha: new Date().toISOString()
            });

            return {
                success: true,
                records: data.length,
                filename: filename.replace('.pdf', '.html')
            };

        } catch (error) {
            console.error('Error exportando a PDF:', error);
            throw error;
        }
    }

    // ===== EXPORTAR PROGRESO DE ESTUDIANTE =====
    async function exportStudentProgress(studentId, options = {}) {
        const {
            format = 'pdf',
            includeDetails = true
        } = options;

        try {
            // Obtener datos del estudiante
            const student = await CEADB.getById('usuarios', studentId);
            if (!student) {
                throw new Error('Estudiante no encontrado');
            }

            const progreso = await CEADB.getProgresoAlumno(studentId);
            const sesiones = await CEADB.getSesionesAlumno(studentId);

            // Crear reporte
            const report = {
                _metadata: {
                    studentId,
                    studentName: student.nombre_completo,
                    document: student.numero_documento,
                    category: student.categoria_aspirada,
                    exportedAt: new Date().toISOString()
                },
                resumen: {
                    progresoTotal: await CEADB.calcularProgresoTotal(studentId),
                    horasTeoria: await CEADB.calcularHorasPorTipo(studentId, 'teoria'),
                    horasPractica: await CEADB.calcularHorasPorTipo(studentId, 'practica'),
                    sesionesCompletadas: sesiones.filter(s => s.estado === 'completed').length
                },
                progreso: includeDetails ? progreso : [],
                sesiones: includeDetails ? sesiones : []
            };

            // Exportar según formato
            switch (format) {
                case 'json':
                    return await exportJSON(report, `progreso_${studentId}.json`);
                case 'csv':
                    return await exportProgressCSV(progreso, sesiones, `progreso_${studentId}.csv`);
                default:
                    return await exportProgressPDF(report, `progreso_${studentId}.pdf`);
            }

        } catch (error) {
            console.error('Error exportando progreso:', error);
            throw error;
        }
    }

    async function exportProgressCSV(progreso, sesiones, filename) {
        let csv = 'TIPO,DETALLE,VALOR,FECHA\n';

        // Progreso
        progreso.forEach(p => {
            csv += `PROGRESO,${p.modulo},${p.minutos_completados}/${p.minutos_requeridos},${p.fecha_actualizacion}\n`;
        });

        // Sesiones
        sesiones.forEach(s => {
            csv += `SESION,Clase práctica,${s.minutos_totales || 0} minutos,${s.fecha}\n`;
        });

        downloadFile(csv, filename, 'text/csv');
        return { success: true, filename };
    }

    async function exportProgressPDF(report, filename) {
        const html = generateProgressHTML(report);
        downloadFile(html, filename.replace('.pdf', '.html'), 'text/html');
        return { success: true, filename: filename.replace('.pdf', '.html') };
    }

    async function exportJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, filename, 'application/json');
        return { success: true, filename };
    }

    // ===== IMPORTAR DESDE CSV =====
    async function importFromCSV(file, storeName) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n').filter(line => line.trim());
                    
                    if (lines.length < 2) {
                        throw new Error('Archivo CSV vacío');
                    }

                    // Obtener headers
                    const headers = parseCSVLine(lines[0]);
                    
                    // Procesar datos
                    const imported = [];
                    const errors = [];

                    for (let i = 1; i < lines.length; i++) {
                        try {
                            const values = parseCSVLine(lines[i]);
                            const record = {};

                            headers.forEach((header, index) => {
                                if (values[index] !== undefined) {
                                    record[header.trim()] = values[index];
                                }
                            });

                            // Insertar en base de datos
                            const result = await CEADB.insert(storeName, record);
                            imported.push(result);

                        } catch (error) {
                            errors.push({ line: i + 1, error: error.message });
                        }
                    }

                    // Registrar evento
                    await CEADB.insert('logs', {
                        tipo: 'import',
                        store: storeName,
                        format: 'csv',
                        imported: imported.length,
                        errors: errors.length,
                        fecha: new Date().toISOString()
                    });

                    resolve({
                        success: true,
                        imported: imported.length,
                        errors,
                        total: lines.length - 1
                    });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // ===== IMPORTAR DESDE JSON =====
    async function importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validar estructura
                    if (!data._metadata || !data.data) {
                        throw new Error('Formato JSON inválido');
                    }

                    // Importar datos
                    const imported = [];
                    for (const record of data.data) {
                        const result = await CEADB.insert(data._metadata.store, record);
                        imported.push(result);
                    }

                    // Registrar evento
                    await CEADB.insert('logs', {
                        tipo: 'import',
                        store: data._metadata.store,
                        format: 'json',
                        imported: imported.length,
                        fecha: new Date().toISOString()
                    });

                    resolve({
                        success: true,
                        imported: imported.length,
                        store: data._metadata.store
                    });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // ===== UTILIDADES =====
    function parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
        return values;
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }

    function generateProgressHTML(report) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Progreso de Estudiante</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 2cm; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #1e3c72; }
                    .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                    .stat-card { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #1e3c72; }
                    .stat-label { font-size: 14px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #1e3c72; color: white; padding: 10px; }
                    td { border: 1px solid #ccc; padding: 8px; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reporte de Progreso Académico</h1>
                </div>

                <div class="info">
                    <h3>${report._metadata.studentName}</h3>
                    <p>Documento: ${report._metadata.document}</p>
                    <p>Categoría: ${report._metadata.category}</p>
                    <p>Fecha de exportación: ${new Date(report._metadata.exportedAt).toLocaleDateString()}</p>
                </div>

                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value">${report.resumen.progresoTotal}%</div>
                        <div class="stat-label">Progreso Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.resumen.horasTeoria.toFixed(1)}h</div>
                        <div class="stat-label">Horas Teoría</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${report.resumen.horasPractica.toFixed(1)}h</div>
                        <div class="stat-label">Horas Práctica</div>
                    </div>
                </div>

                ${report.progreso.length > 0 ? `
                    <h3>Detalle de Progreso</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Módulo</th>
                                <th>Minutos</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.progreso.map(p => `
                                <tr>
                                    <td>${p.tipo}</td>
                                    <td>${p.modulo}</td>
                                    <td>${p.minutos_completados}/${p.minutos_requeridos}</td>
                                    <td>${p.completado ? '✅ Completado' : '⏳ En progreso'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <div class="footer">
                    Generado por Sistema CEA Biométrico - Ley 2026
                </div>
            </body>
            </html>
        `;
    }

    // ===== API PÚBLICA =====
    return {
        // Exportar
        toCSV,
        toJSON,
        toPDF,
        exportStudentProgress,
        
        // Importar
        importFromCSV,
        importFromJSON,
        
        // Formatos
        FORMATS,
        
        // Utilidades
        downloadFile,
        parseCSVLine
    };
})();

// Exponer globalmente
window.CEAExport = CEAExport;