/**
 * formatters.js - Formateo de datos
 */

const CEAFormatters = (function() {
    return {
        /**
         * Formatear moneda COP
         */
        moneda(valor) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(valor);
        },
        
        /**
         * Formatear fecha colombiana
         */
        fecha(fecha, formato = 'corto') {
            const d = new Date(fecha);
            const opciones = {
                corto: { day: '2-digit', month: '2-digit', year: 'numeric' },
                largo: { day: 'numeric', month: 'long', year: 'numeric' },
                completo: { day: 'numeric', month: 'long', year: 'numeric', 
                           hour: '2-digit', minute: '2-digit' }
            };
            
            return d.toLocaleDateString('es-CO', opciones[formato]);
        },
        
        /**
         * Formatear tiempo en minutos a horas
         */
        minutosAHoras(minutos) {
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            
            if (horas === 0) {
                return `${mins} minutos`;
            }
            if (mins === 0) {
                return `${horas} hora${horas > 1 ? 's' : ''}`;
            }
            return `${horas}h ${mins}min`;
        },
        
        /**
         * Formatear número de documento
         */
        documento(tipo, numero) {
            const formatos = {
                'CC': (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
                'TI': (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
                'CE': (n) => n,
                'PAS': (n) => n
            };
            
            return formatos[tipo] ? formatos[tipo](numero) : numero;
        },
        
        /**
         * Formatear teléfono Colombia
         */
        telefono(numero) {
            const limpio = numero.replace(/\D/g, '');
            
            if (limpio.length === 10) {
                return `${limpio.slice(0,3)} ${limpio.slice(3,6)} ${limpio.slice(6)}`;
            } else if (limpio.length === 7) {
                return `${limpio.slice(0,3)} ${limpio.slice(3)}`;
            }
            return numero;
        },
        
        /**
         * Formatear porcentaje
         */
        porcentaje(valor, decimales = 0) {
            return new Intl.NumberFormat('es-CO', {
                style: 'percent',
                minimumFractionDigits: decimales,
                maximumFractionDigits: decimales
            }).format(valor / 100);
        },
        
        /**
         * Formatear nombre propio
         */
        nombrePropio(nombre) {
            return nombre.toLowerCase()
                .split(' ')
                .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
                .join(' ');
        },
        
        /**
         * Formatear categoría de licencia
         */
        categoriaCompleta(codigo) {
            const categorias = {
                'A1': 'Motocicleta hasta 125cc',
                'A2': 'Motocicleta',
                'B1': 'Automóvil',
                'C1': 'Camión'
            };
            return categorias[codigo] || codigo;
        },
        
        /**
         * Formatear grupo sanguíneo
         */
        grupoSanguineo(grupo) {
            const grupos = {
                'A+': 'A Positivo',
                'A-': 'A Negativo',
                'B+': 'B Positivo',
                'B-': 'B Negativo',
                'AB+': 'AB Positivo',
                'AB-': 'AB Negativo',
                'O+': 'O Positivo',
                'O-': 'O Negativo'
            };
            return grupos[grupo] || grupo;
        },
        
        /**
         * Formatear bytes a tamaño legible
         */
        bytes(bytes) {
            const unidades = ['B', 'KB', 'MB', 'GB'];
            let tamaño = bytes;
            let unidad = 0;
            
            while (tamaño >= 1024 && unidad < unidades.length - 1) {
                tamaño /= 1024;
                unidad++;
            }
            
            return `${tamaño.toFixed(1)} ${unidades[unidad]}`;
        },
        
        /**
         * Formatear tiempo transcurrido
         */
        tiempoRelativo(fecha) {
            const ahora = new Date();
            const entonces = new Date(fecha);
            const segundos = Math.floor((ahora - entonces) / 1000);
            
            const intervalos = {
                año: 31536000,
                mes: 2592000,
                semana: 604800,
                día: 86400,
                hora: 3600,
                minuto: 60,
                segundo: 1
            };
            
            for (const [unidad, valor] of Object.entries(intervalos)) {
                const cantidad = Math.floor(segundos / valor);
                if (cantidad >= 1) {
                    return `hace ${cantidad} ${unidad}${cantidad > 1 ? 's' : ''}`;
                }
            }
            
            return 'ahora mismo';
        }
    };
})();

window.CEAFormatters = CEAFormatters;