/**
 * validators.js - Sistema de validaciones
 */

const CEAValidators = (function() {
    return {
        /**
         * Validar email
         */
        email(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return {
                valid: re.test(email),
                message: 'Email inválido'
            };
        },
        
        /**
         * Validar documento colombiano
         */
        documento(tipo, numero) {
            const patterns = {
                'CC': /^\d{6,10}$/,
                'TI': /^\d{8,11}$/,
                'CE': /^[A-Z0-9]{5,12}$/,
                'PAS': /^[A-Z]{2}\d{6,9}$/
            };
            
            return {
                valid: patterns[tipo]?.test(numero) || false,
                message: `Número de ${tipo} inválido`
            };
        },
        
        /**
         * Validar teléfono Colombia
         */
        telefono(numero) {
            const re = /^3\d{9}$|^[1-9]\d{6,9}$/;
            return {
                valid: re.test(numero),
                message: 'Teléfono inválido (10 dígitos para celular, 7-10 para fijo)'
            };
        },
        
        /**
         * Validar fecha de nacimiento (mayor de 16 años)
         */
        fechaNacimiento(fecha) {
            const nacimiento = new Date(fecha);
            const hoy = new Date();
            const edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();
            
            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                edad--;
            }
            
            return {
                valid: edad >= 16,
                message: 'Debe ser mayor de 16 años'
            };
        },
        
        /**
         * Validar contraseña segura
         */
        password(password) {
            const errors = [];
            
            if (password.length < 8) {
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
        },
        
        /**
         * Validar placa de vehículo Colombia
         */
        placa(placa, tipo) {
            const patterns = {
                'carro': /^[A-Z]{3}\d{3}$/,
                'moto': /^[A-Z]{3}\d{2}[A-Z]$/,
                'camion': /^[A-Z]{3}\d{3}$/
            };
            
            return {
                valid: patterns[tipo]?.test(placa.toUpperCase()) || false,
                message: 'Formato de placa inválido'
            };
        },
        
        /**
         * Validar grupo sanguíneo
         */
        grupoSanguineo(grupo) {
            const validos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            return {
                valid: validos.includes(grupo),
                message: 'Grupo sanguíneo inválido'
            };
        },
        
        /**
         * Validar categoría de licencia
         */
        categoria(categoria, edad) {
            const requisitos = {
                'A1': { min: 16, desc: 'Motocicleta hasta 125cc' },
                'A2': { min: 16, desc: 'Motocicleta' },
                'B1': { min: 16, desc: 'Automóvil' },
                'C1': { min: 18, desc: 'Camión' }
            };
            
            const req = requisitos[categoria];
            if (!req) {
                return { valid: false, message: 'Categoría inválida' };
            }
            
            return {
                valid: edad >= req.min,
                message: `Debe tener al menos ${req.min} años para categoría ${categoria}`
            };
        },
        
        /**
         * Validar que un campo no esté vacío
         */
        required(valor, campo) {
            return {
                valid: valor && valor.toString().trim().length > 0,
                message: `${campo} es requerido`
            };
        },
        
        /**
         * Validar formulario completo
         */
        validateForm(data, rules) {
            const errors = {};
            let isValid = true;
            
            for (const [field, value] of Object.entries(data)) {
                if (rules[field]) {
                    for (const rule of rules[field]) {
                        const result = rule.validator(value);
                        if (!result.valid) {
                            errors[field] = result.message || rule.message;
                            isValid = false;
                            break;
                        }
                    }
                }
            }
            
            return { isValid, errors };
        }
    };
})();

window.CEAValidators = CEAValidators;