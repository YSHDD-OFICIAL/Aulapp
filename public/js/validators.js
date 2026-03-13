/**
 * validators.js - Sistema de validaciones
 * Validación de documentos, emails, teléfonos, etc.
 * Versión: 1.0.0
 */

const CEAValidators = (function() {
    // ===== CONFIGURACIÓN =====
    const PATTERNS = {
        // Documentos colombianos
        CC: /^\d{6,10}$/,
        TI: /^\d{8,11}$/,
        CE: /^[A-Z0-9]{5,12}$/,
        PAS: /^[A-Z]{2}\d{6,9}$/,
        NIT: /^\d{9,10}$/,
        
        // Contacto
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^3\d{9}$|^[1-9]\d{6,9}$/,
        CELLPHONE: /^3\d{9}$/,
        
        // Vehículos
        PLATE_CAR: /^[A-Z]{3}\d{3}$/,
        PLATE_MOTO: /^[A-Z]{3}\d{2}[A-Z]$/,
        PLATE_TRAILER: /^[A-Z]{3}\d{3}[A-Z]$/,
        
        // Seguridad
        PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        
        // Fechas
        DATE: /^\d{4}-\d{2}-\d{2}$/,
        TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
        
        // Códigos
        POSTAL_CODE: /^\d{6}$/,
        
        // Nombres
        NAME: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        
        // Números
        NUMBER: /^\d+$/,
        DECIMAL: /^\d+(\.\d+)?$/
    };

    // ===== VALIDACIONES BÁSICAS =====
    function required(value, fieldName = 'Campo') {
        const isValid = value !== null && 
                       value !== undefined && 
                       value.toString().trim() !== '';
        
        return {
            valid: isValid,
            message: isValid ? '' : `${fieldName} es requerido`
        };
    }

    function minLength(value, min, fieldName = 'Campo') {
        const length = value ? value.toString().length : 0;
        const isValid = length >= min;
        
        return {
            valid: isValid,
            message: isValid ? '' : `${fieldName} debe tener al menos ${min} caracteres`
        };
    }

    function maxLength(value, max, fieldName = 'Campo') {
        const length = value ? value.toString().length : 0;
        const isValid = length <= max;
        
        return {
            valid: isValid,
            message: isValid ? '' : `${fieldName} debe tener máximo ${max} caracteres`
        };
    }

    function range(value, min, max, fieldName = 'Campo') {
        const num = parseFloat(value);
        const isValid = !isNaN(num) && num >= min && num <= max;
        
        return {
            valid: isValid,
            message: isValid ? '' : `${fieldName} debe estar entre ${min} y ${max}`
        };
    }

    function pattern(value, regex, message = 'Formato inválido') {
        const isValid = regex.test(value);
        
        return {
            valid: isValid,
            message: isValid ? '' : message
        };
    }

    // ===== VALIDACIONES ESPECÍFICAS =====
    function email(email) {
        return pattern(email, PATTERNS.EMAIL, 'Email inválido');
    }

    function documento(tipo, numero) {
        const patterns = {
            'CC': PATTERNS.CC,
            'TI': PATTERNS.TI,
            'CE': PATTERNS.CE,
            'PAS': PATTERNS.PAS,
            'NIT': PATTERNS.NIT
        };

        const tipoPattern = patterns[tipo];
        if (!tipoPattern) {
            return {
                valid: false,
                message: 'Tipo de documento inválido'
            };
        }

        const cleanNumber = numero.toString().replace(/\D/g, '');
        const isValid = tipoPattern.test(cleanNumber);

        return {
            valid: isValid,
            message: isValid ? '' : `Número de ${tipo} inválido`
        };
    }

    function telefono(numero, tipo = 'fijo') {
        const cleanNumber = numero.toString().replace(/\D/g, '');
        
        if (tipo === 'celular') {
            return pattern(cleanNumber, PATTERNS.CELLPHONE, 'Celular inválido (debe ser 3XXXXXXXXX)');
        }
        
        return pattern(cleanNumber, PATTERNS.PHONE, 'Teléfono inválido');
    }

    function placa(placa, tipo = 'carro') {
        const patterns = {
            'carro': PATTERNS.PLATE_CAR,
            'moto': PATTERNS.PLATE_MOTO,
            'trailer': PATTERNS.PLATE_TRAILER
        };

        const cleanPlate = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const platePattern = patterns[tipo] || patterns.carro;

        return pattern(cleanPlate, platePattern, 'Placa inválida');
    }

    function fechaNacimiento(fecha) {
        if (!fecha) {
            return {
                valid: false,
                message: 'Fecha de nacimiento requerida'
            };
        }

        const nacimiento = new Date(fecha);
        if (isNaN(nacimiento.getTime())) {
            return {
                valid: false,
                message: 'Fecha inválida'
            };
        }

        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return {
            valid: edad >= 16,
            message: edad >= 16 ? '' : 'Debe ser mayor de 16 años',
            edad
        };
    }

    function password(password) {
        const errors = [];
        
        if (!password || password.length < 8) {
            errors.push('Mínimo 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Al menos una mayúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Al menos una minúscula');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Al menos un número');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Al menos un carácter especial (!@#$%^&*)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    function passwordMatch(password, confirm) {
        const isValid = password === confirm;
        
        return {
            valid: isValid,
            message: isValid ? '' : 'Las contraseñas no coinciden'
        };
    }

    function grupoSanguineo(grupo) {
        const validos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const isValid = validos.includes(grupo);
        
        return {
            valid: isValid,
            message: isValid ? '' : 'Grupo sanguíneo inválido'
        };
    }

    function categoria(categoria, edad) {
        const requisitos = {
            'A1': { min: 16, desc: 'Motocicleta hasta 125cc' },
            'A2': { min: 16, desc: 'Motocicleta' },
            'B1': { min: 16, desc: 'Automóvil' },
            'C1': { min: 18, desc: 'Camión' },
            'C2': { min: 21, desc: 'Vehículo articulado' }
        };

        const req = requisitos[categoria];
        if (!req) {
            return {
                valid: false,
                message: 'Categoría inválida'
            };
        }

        const isValid = edad >= req.min;
        
        return {
            valid: isValid,
            message: isValid ? '' : `Debe tener al menos ${req.min} años para categoría ${categoria}`,
            requisito: req
        };
    }

    function vigencia(fecha) {
        if (!fecha) {
            return {
                valid: false,
                message: 'Fecha requerida'
            };
        }

        const fechaVen = new Date(fecha);
        if (isNaN(fechaVen.getTime())) {
            return {
                valid: false,
                message: 'Fecha inválida'
            };
        }

        const hoy = new Date();
        const diffTime = fechaVen - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                valid: false,
                message: 'Documento vencido',
                days: diffDays,
                status: 'expired'
            };
        } else if (diffDays <= 30) {
            return {
                valid: true,
                warning: true,
                message: `Vence en ${diffDays} días`,
                days: diffDays,
                status: 'soon'
            };
        }

        return {
            valid: true,
            message: 'Vigente',
            days: diffDays,
            status: 'valid'
        };
    }

    // ===== VALIDACIONES DE FORMATO =====
    function isNumeric(value) {
        return pattern(value, PATTERNS.NUMBER, 'Debe ser un número').valid;
    }

    function isDecimal(value) {
        return pattern(value, PATTERNS.DECIMAL, 'Debe ser un número decimal').valid;
    }

    function isDate(value) {
        return pattern(value, PATTERNS.DATE, 'Formato de fecha inválido (YYYY-MM-DD)').valid;
    }

    function isTime(value) {
        return pattern(value, PATTERNS.TIME, 'Formato de hora inválido (HH:MM)').valid;
    }

    function isName(value) {
        return pattern(value, PATTERNS.NAME, 'Solo se permiten letras').valid;
    }

    // ===== VALIDACIONES COMPUESTAS =====
    function validateForm(data, rules) {
        const errors = {};
        let isValid = true;

        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = data[field];
            
            for (const rule of fieldRules) {
                let result;

                if (typeof rule === 'function') {
                    result = rule(value);
                } else if (rule.validator) {
                    result = rule.validator(value);
                } else {
                    continue;
                }

                if (result && !result.valid) {
                    errors[field] = result.message || rule.message || 'Campo inválido';
                    isValid = false;
                    break;
                }
            }
        }

        return { isValid, errors };
    }

    function validateUser(userData) {
        const rules = {
            nombre_completo: [
                (v) => required(v, 'Nombre'),
                (v) => isName(v)
            ],
            email: [
                (v) => required(v, 'Email'),
                (v) => email(v)
            ],
            tipo_documento: [
                (v) => required(v, 'Tipo de documento')
            ],
            numero_documento: [
                (v) => required(v, 'Número de documento'),
                (v) => documento(userData.tipo_documento, v)
            ],
            fecha_nacimiento: [
                (v) => required(v, 'Fecha de nacimiento'),
                (v) => fechaNacimiento(v)
            ],
            telefono_movil: [
                (v) => telefono(v, 'celular')
            ]
        };

        return validateForm(userData, rules);
    }

    function validateVehicle(vehicleData) {
        const rules = {
            placa: [
                (v) => required(v, 'Placa'),
                (v) => placa(v, vehicleData.categoria?.toLowerCase() === 'a2' ? 'moto' : 'carro')
            ],
            categoria: [
                (v) => required(v, 'Categoría')
            ],
            marca: [
                (v) => required(v, 'Marca')
            ],
            modelo: [
                (v) => required(v, 'Modelo'),
                (v) => range(v, 2000, new Date().getFullYear() + 1, 'Modelo')
            ],
            soat_vigencia: [
                (v) => required(v, 'Vigencia SOAT'),
                (v) => vigencia(v)
            ],
            licencia_transito_vigencia: [
                (v) => required(v, 'Vigencia licencia'),
                (v) => vigencia(v)
            ]
        };

        return validateForm(vehicleData, rules);
    }

    function validateSession(sessionData) {
        const rules = {
            alumno_id: [
                (v) => required(v, 'Alumno')
            ],
            instructor_id: [
                (v) => required(v, 'Instructor')
            ],
            vehiculo_id: [
                (v) => required(v, 'Vehículo')
            ],
            fecha: [
                (v) => required(v, 'Fecha')
            ],
            hora_inicio: [
                (v) => required(v, 'Hora de inicio')
            ]
        };

        return validateForm(sessionData, rules);
    }

    // ===== UTILIDADES =====
    function sanitizeInput(value) {
        if (!value) return value;
        
        return value
            .toString()
            .trim()
            .replace(/[<>]/g, '') // Prevenir XSS básico
            .replace(/\s+/g, ' ');
    }

    function normalizeText(value) {
        if (!value) return value;
        
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    // ===== API PÚBLICA =====
    return {
        // Básicas
        required,
        minLength,
        maxLength,
        range,
        pattern,
        
        // Específicas
        email,
        documento,
        telefono,
        placa,
        fechaNacimiento,
        password,
        passwordMatch,
        grupoSanguineo,
        categoria,
        vigencia,
        
        // Formato
        isNumeric,
        isDecimal,
        isDate,
        isTime,
        isName,
        
        // Compuestas
        validateForm,
        validateUser,
        validateVehicle,
        validateSession,
        
        // Utilidades
        sanitizeInput,
        normalizeText,
        
        // Constantes
        PATTERNS
    };
})();

// Exponer globalmente
window.CEAValidators = CEAValidators;