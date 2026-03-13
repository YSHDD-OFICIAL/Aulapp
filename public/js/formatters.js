/**
 * formatters.js - Utilidades de formateo de datos
 * Formateo de fechas, números, documentos, moneda, etc.
 * Versión: 1.0.0
 */

const CEAFormatters = (function() {
    // ===== CONFIGURACIÓN =====
    const LOCALE = 'es-CO';
    const CURRENCY = 'COP';
    const TIMEZONE = 'America/Bogota';

    // ===== FORMATEO DE FECHAS =====
    function formatDate(date, options = {}) {
        const {
            format = 'short',
            includeTime = false,
            locale = LOCALE
        } = options;

        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Fecha inválida';

        const formats = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            medium: { day: 'numeric', month: 'short', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
            full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        };

        const dateOptions = formats[format] || formats.short;

        if (includeTime) {
            dateOptions.hour = '2-digit';
            dateOptions.minute = '2-digit';
        }

        return d.toLocaleDateString(locale, dateOptions);
    }

    function formatTime(date, options = {}) {
        const {
            format = 'short',
            includeSeconds = false,
            locale = LOCALE
        } = options;

        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Hora inválida';

        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };

        if (includeSeconds) {
            timeOptions.second = '2-digit';
        }

        return d.toLocaleTimeString(locale, timeOptions);
    }

    function formatDateTime(date, options = {}) {
        return `${formatDate(date, options)} ${formatTime(date, options)}`;
    }

    function formatRelativeTime(date) {
        const now = new Date();
        const then = new Date(date);
        const diffInSeconds = Math.floor((now - then) / 1000);

        if (diffInSeconds < 60) {
            return 'hace unos segundos';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
        }

        const diffInYears = Math.floor(diffInMonths / 12);
        return `hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
    }

    // ===== FORMATEO DE NÚMEROS =====
    function formatNumber(number, options = {}) {
        const {
            decimals = 0,
            thousandsSeparator = '.',
            decimalSeparator = ',',
            locale = LOCALE
        } = options;

        if (number === null || number === undefined) return '';

        const num = typeof number === 'string' ? parseFloat(number) : number;
        
        if (isNaN(num)) return 'Número inválido';

        // Usar Intl para formateo estándar
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    function formatCurrency(amount, options = {}) {
        const {
            currency = CURRENCY,
            decimals = 0,
            locale = LOCALE
        } = options;

        if (amount === null || amount === undefined) return '';

        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        if (isNaN(num)) return 'Monto inválido';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    function formatPercentage(value, options = {}) {
        const {
            decimals = 0,
            includeSymbol = true,
            locale = LOCALE
        } = options;

        if (value === null || value === undefined) return '';

        const num = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(num)) return 'Porcentaje inválido';

        const formatted = new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num / 100);

        return includeSymbol ? formatted : formatted.replace('%', '').trim();
    }

    // ===== FORMATEO DE DOCUMENTOS COLOMBIANOS =====
    function formatDocument(type, number) {
        if (!number) return '';

        const cleanNumber = number.toString().replace(/\D/g, '');

        const formats = {
            'CC': (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
            'TI': (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
            'CE': (n) => n,
            'PAS': (n) => n,
            'NIT': (n) => {
                const digits = n.replace(/\D/g, '');
                if (digits.length <= 9) {
                    return digits.replace(/(\d{1,3})(\d{3})(\d{3})/, '$1.$2.$3');
                }
                return digits;
            }
        };

        const formatter = formats[type] || ((n) => n);
        return formatter(cleanNumber);
    }

    function formatPhone(phone, options = {}) {
        const {
            international = false,
            countryCode = '57'
        } = options;

        if (!phone) return '';

        const cleanPhone = phone.toString().replace(/\D/g, '');

        if (international) {
            return `+${countryCode} ${cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}`;
        }

        if (cleanPhone.length === 10) {
            return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        } else if (cleanPhone.length === 7) {
            return cleanPhone.replace(/(\d{3})(\d{4})/, '$1 $2');
        }

        return cleanPhone;
    }

    // ===== FORMATEO DE PLACAS =====
    function formatLicensePlate(plate, type = 'car') {
        if (!plate) return '';

        const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

        const formats = {
            'car': (p) => {
                if (p.length === 6) {
                    return `${p.slice(0, 3)} ${p.slice(3)}`;
                }
                return p;
            },
            'motorcycle': (p) => {
                if (p.length === 6) {
                    return `${p.slice(0, 3)} ${p.slice(3, 5)}${p.slice(5)}`;
                }
                return p;
            },
            'trailer': (p) => {
                if (p.length === 7) {
                    return `${p.slice(0, 3)} ${p.slice(3, 5)}-${p.slice(5)}`;
                }
                return p;
            }
        };

        const formatter = formats[type] || ((p) => p);
        return formatter(cleanPlate);
    }

    // ===== FORMATEO DE NOMBRES =====
    function formatName(name, options = {}) {
        const {
            uppercase = false,
            lowercase = false,
            titleCase = true,
            removeAccents = false
        } = options;

        if (!name) return '';

        let formatted = name.trim().replace(/\s+/g, ' ');

        if (removeAccents) {
            formatted = formatted.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        if (titleCase) {
            formatted = formatted.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        }

        if (uppercase) {
            formatted = formatted.toUpperCase();
        }

        if (lowercase) {
            formatted = formatted.toLowerCase();
        }

        return formatted;
    }

    // ===== FORMATEO DE DIRECCIONES =====
    function formatAddress(address, options = {}) {
        const {
            uppercase = false,
            abbreviate = false
        } = options;

        if (!address) return '';

        let formatted = address.trim().replace(/\s+/g, ' ');

        const abbreviations = {
            'Calle': 'Cl',
            'Carrera': 'Cr',
            'Avenida': 'Av',
            'Transversal': 'Tv',
            'Diagonal': 'Dg',
            'Circular': 'Cir',
            'Autopista': 'Aut',
            'Norte': 'N',
            'Sur': 'S',
            'Este': 'E',
            'Oeste': 'O',
            'Bis': 'Bs',
            'Número': 'No'
        };

        if (abbreviate) {
            Object.entries(abbreviations).forEach(([full, abbr]) => {
                const regex = new RegExp(`\\b${full}\\b`, 'gi');
                formatted = formatted.replace(regex, abbr);
            });
        }

        if (uppercase) {
            formatted = formatted.toUpperCase();
        }

        return formatted;
    }

    // ===== FORMATEO DE TIEMPO =====
    function formatDuration(minutes, options = {}) {
        const {
            format = 'full',
            showSeconds = false
        } = options;

        if (minutes === null || minutes === undefined) return '';

        const mins = Math.abs(parseInt(minutes) || 0);
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;

        if (format === 'short') {
            if (hours === 0) return `${mins}min`;
            if (remainingMins === 0) return `${hours}h`;
            return `${hours}h ${remainingMins}min`;
        }

        if (format === 'full') {
            const parts = [];
            if (hours > 0) {
                parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
            }
            if (remainingMins > 0 || hours === 0) {
                parts.push(`${remainingMins} ${remainingMins === 1 ? 'minuto' : 'minutos'}`);
            }
            return parts.join(' y ');
        }

        return `${hours.toString().padStart(2, '0')}:${remainingMins.toString().padStart(2, '0')}`;
    }

    function formatSeconds(seconds, options = {}) {
        const secs = Math.abs(parseInt(seconds) || 0);
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const remainingSecs = secs % 60;

        return {
            hours,
            minutes,
            seconds: remainingSecs,
            toString: () => {
                const parts = [];
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}m`);
                if (remainingSecs > 0) parts.push(`${remainingSecs}s`);
                return parts.join(' ') || '0s';
            },
            toTimeString: () => {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
            }
        };
    }

    // ===== FORMATEO DE BYTES =====
    function formatBytes(bytes, options = {}) {
        const {
            decimals = 2,
            format = 'auto' // 'auto', 'binary', 'decimal'
        } = options;

        if (bytes === 0) return '0 Bytes';
        if (!bytes) return '';

        const k = format === 'binary' ? 1024 : 1000;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = format === 'binary' 
            ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
            : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // ===== FORMATEO DE GRUPO SANGUÍNEO =====
    function formatBloodType(bloodType) {
        if (!bloodType) return '';

        const types = {
            'A+': 'A Positivo',
            'A-': 'A Negativo',
            'B+': 'B Positivo',
            'B-': 'B Negativo',
            'AB+': 'AB Positivo',
            'AB-': 'AB Negativo',
            'O+': 'O Positivo',
            'O-': 'O Negativo'
        };

        return types[bloodType] || bloodType;
    }

    // ===== FORMATEO DE CATEGORÍAS =====
    function formatCategory(category) {
        if (!category) return '';

        const categories = {
            'A1': 'Motocicleta hasta 125cc',
            'A2': 'Motocicleta',
            'B1': 'Automóvil',
            'C1': 'Camión',
            'C2': 'Vehículo articulado',
            'C3': 'Vehículo de servicio público'
        };

        return categories[category] || category;
    }

    // ===== FORMATEO DE GÉNERO =====
    function formatGender(gender) {
        if (!gender) return '';

        const genders = {
            'M': 'Masculino',
            'F': 'Femenino',
            'Otro': 'Otro',
            'N/A': 'No especifica'
        };

        return genders[gender] || gender;
    }

    // ===== FORMATEO DE ESTADOS =====
    function formatStatus(status, type = 'general') {
        if (!status) return '';

        const statuses = {
            general: {
                'active': 'Activo',
                'inactive': 'Inactivo',
                'pending': 'Pendiente',
                'completed': 'Completado',
                'cancelled': 'Cancelado',
                'expired': 'Vencido'
            },
            soat: {
                'valid': 'Vigente',
                'expired': 'Vencido',
                'soon': 'Próximo a vencer'
            },
            class: {
                'scheduled': 'Programada',
                'in_progress': 'En progreso',
                'completed': 'Completada',
                'cancelled': 'Cancelada'
            },
            payment: {
                'paid': 'Pagado',
                'pending': 'Pendiente',
                'overdue': 'Vencido',
                'refunded': 'Reembolsado'
            }
        };

        const typeStatuses = statuses[type] || statuses.general;
        return typeStatuses[status] || status;
    }

    // ===== FORMATEO DE BÚSQUEDA =====
    function formatSearchTerm(term) {
        if (!term) return '';

        return term
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ');
    }

    // ===== FORMATEO DE SLUG =====
    function formatSlug(text) {
        if (!text) return '';

        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    // ===== FORMATEO DE TELÉFONO INTERNACIONAL =====
    function formatInternationalPhone(phone, countryCode = '57') {
        if (!phone) return '';

        const cleanPhone = phone.toString().replace(/\D/g, '');
        
        if (cleanPhone.length === 10) {
            return `+${countryCode} ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
        }

        return `+${countryCode} ${cleanPhone}`;
    }

    // ===== FORMATEO DE VALORES BOOLEANOS =====
    function formatBoolean(value, options = {}) {
        const {
            trueText = 'Sí',
            falseText = 'No',
            includeIcon = false
        } = options;

        const bool = Boolean(value);

        if (includeIcon) {
            return bool ? '✅ ' + trueText : '❌ ' + falseText;
        }

        return bool ? trueText : falseText;
    }

    // ===== FORMATEO DE LISTAS =====
    function formatList(items, options = {}) {
        const {
            separator = ', ',
            lastSeparator = ' y ',
            maxItems = null,
            emptyText = 'Ninguno'
        } = options;

        if (!items || items.length === 0) return emptyText;

        let list = [...items];

        if (maxItems && list.length > maxItems) {
            const remaining = list.length - maxItems;
            list = list.slice(0, maxItems);
            list.push(`y ${remaining} más`);
        }

        if (list.length === 1) return list[0];
        if (list.length === 2) return list.join(lastSeparator);

        const last = list.pop();
        return list.join(separator) + lastSeparator + last;
    }

    // ===== API PÚBLICA =====
    return {
        // Fechas
        formatDate,
        formatTime,
        formatDateTime,
        formatRelativeTime,
        
        // Números
        formatNumber,
        formatCurrency,
        formatPercentage,
        
        // Documentos
        formatDocument,
        formatPhone,
        formatInternationalPhone,
        
        // Vehículos
        formatLicensePlate,
        
        // Texto
        formatName,
        formatAddress,
        formatSearchTerm,
        formatSlug,
        
        // Tiempo
        formatDuration,
        formatSeconds,
        
        // Datos técnicos
        formatBytes,
        
        // Catálogos
        formatBloodType,
        formatCategory,
        formatGender,
        formatStatus,
        
        // Otros
        formatBoolean,
        formatList,
        
        // Constantes
        LOCALE,
        CURRENCY,
        TIMEZONE
    };
})();

// Exponer globalmente
window.CEAFormatters = CEAFormatters;