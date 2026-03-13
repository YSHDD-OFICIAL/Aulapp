/**
 * variables.css - Variables CSS globales
 * Sistema de temas y configuración visual
 * Versión: 1.0.0
 */

:root {
    /* ===== COLORES PRINCIPALES ===== */
    --primary-dark: #1e3c72;
    --primary: #2a5298;
    --primary-light: #4a7db5;
    --primary-very-light: #e8f0fe;
    
    --secondary: #ff6b35;
    --secondary-dark: #e54e1b;
    --secondary-light: #ff8c5a;
    
    --success: #4caf50;
    --success-dark: #3d8b40;
    --success-light: #80e27e;
    --success-very-light: #e8f5e9;
    
    --warning: #ff9800;
    --warning-dark: #f57c00;
    --warning-light: #ffb74d;
    --warning-very-light: #fff3e0;
    
    --danger: #f44336;
    --danger-dark: #d32f2f;
    --danger-light: #e57373;
    --danger-very-light: #ffebee;
    
    --info: #2196f3;
    --info-dark: #1976d2;
    --info-light: #64b5f6;
    --info-very-light: #e3f2fd;
    
    /* ===== COLORES NEUTROS ===== */
    --white: #ffffff;
    --white-soft: #fafafa;
    
    --gray-50: #f8f9fa;
    --gray-100: #f1f3f5;
    --gray-200: #e9ecef;
    --gray-300: #dee2e6;
    --gray-400: #ced4da;
    --gray-500: #adb5bd;
    --gray-600: #868e96;
    --gray-700: #495057;
    --gray-800: #343a40;
    --gray-900: #212529;
    
    --black: #000000;
    --black-soft: #1a1a1a;
    
    /* ===== TIPOGRAFÍA ===== */
    --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    --font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    
    /* Tamaños de fuente */
    --font-size-xs: 0.75rem;    /* 12px */
    --font-size-sm: 0.875rem;   /* 14px */
    --font-size-base: 1rem;      /* 16px */
    --font-size-lg: 1.125rem;    /* 18px */
    --font-size-xl: 1.25rem;     /* 20px */
    --font-size-2xl: 1.5rem;     /* 24px */
    --font-size-3xl: 1.875rem;   /* 30px */
    --font-size-4xl: 2.25rem;    /* 36px */
    --font-size-5xl: 3rem;       /* 48px */
    
    /* Pesos de fuente */
    --font-weight-light: 300;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    
    /* Altura de línea */
    --line-height-tight: 1.2;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.8;
    
    /* ===== ESPACIADO ===== */
    --spacing-1: 0.25rem;   /* 4px */
    --spacing-2: 0.5rem;    /* 8px */
    --spacing-3: 0.75rem;   /* 12px */
    --spacing-4: 1rem;      /* 16px */
    --spacing-5: 1.25rem;   /* 20px */
    --spacing-6: 1.5rem;    /* 24px */
    --spacing-8: 2rem;      /* 32px */
    --spacing-10: 2.5rem;   /* 40px */
    --spacing-12: 3rem;     /* 48px */
    --spacing-16: 4rem;     /* 64px */
    --spacing-20: 5rem;     /* 80px */
    --spacing-24: 6rem;     /* 96px */
    
    /* ===== BORDES ===== */
    --border-radius-sm: 0.25rem;   /* 4px */
    --border-radius: 0.5rem;        /* 8px */
    --border-radius-md: 0.75rem;    /* 12px */
    --border-radius-lg: 1rem;       /* 16px */
    --border-radius-xl: 1.5rem;     /* 24px */
    --border-radius-2xl: 2rem;      /* 32px */
    --border-radius-full: 9999px;
    
    --border-width-thin: 1px;
    --border-width-normal: 2px;
    --border-width-thick: 3px;
    
    /* ===== SOMBRAS ===== */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
    
    /* Sombras de color */
    --shadow-success: 0 4px 6px -1px rgba(76, 175, 80, 0.2);
    --shadow-warning: 0 4px 6px -1px rgba(255, 152, 0, 0.2);
    --shadow-danger: 0 4px 6px -1px rgba(244, 67, 54, 0.2);
    --shadow-info: 0 4px 6px -1px rgba(33, 150, 243, 0.2);
    
    /* ===== TRANSICIONES ===== */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition: 300ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    
    /* ===== Z-INDEX ===== */
    --z-negative: -1;
    --z-elevate: 1;
    --z-sticky: 100;
    --z-dropdown: 1000;
    --z-overlay: 1010;
    --z-modal: 1020;
    --z-popover: 1030;
    --z-tooltip: 1040;
    --z-toast: 1050;
    
    /* ===== BREAKPOINTS ===== */
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;
    --breakpoint-xl: 1280px;
    --breakpoint-2xl: 1536px;
    
    /* ===== COMPONENTES ESPECÍFICOS ===== */
    /* Header */
    --header-height: 4rem;
    --header-bg: var(--white);
    --header-text: var(--gray-800);
    
    /* Sidebar */
    --sidebar-width: 16rem;
    --sidebar-collapsed-width: 5rem;
    --sidebar-bg: var(--white);
    --sidebar-text: var(--gray-700);
    
    /* Cards */
    --card-bg: var(--white);
    --card-border: var(--gray-200);
    --card-shadow: var(--shadow);
    --card-hover-shadow: var(--shadow-lg);
    
    /* Botones */
    --btn-padding-y: 0.5rem;
    --btn-padding-x: 1rem;
    --btn-border-radius: var(--border-radius);
    
    /* Formularios */
    --input-height: 2.5rem;
    --input-border-color: var(--gray-300);
    --input-focus-border: var(--primary);
    --input-focus-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
    
    /* Tablas */
    --table-header-bg: var(--gray-50);
    --table-row-hover: var(--gray-50);
    --table-border: var(--gray-200);
    
    /* Alertas */
    --alert-padding: 1rem;
    --alert-border-radius: var(--border-radius);
    
    /* ===== ANIMACIONES ===== */
    --animation-duration: 300ms;
    --animation-timing: ease-in-out;
    
    /* ===== GRADIENTES ===== */
    --gradient-primary: linear-gradient(135deg, var(--primary-dark), var(--primary));
    --gradient-secondary: linear-gradient(135deg, var(--secondary-dark), var(--secondary));
    --gradient-success: linear-gradient(135deg, var(--success-dark), var(--success));
    --gradient-warning: linear-gradient(135deg, var(--warning-dark), var(--warning));
    --gradient-danger: linear-gradient(135deg, var(--danger-dark), var(--danger));
    --gradient-info: linear-gradient(135deg, var(--info-dark), var(--info));
    
    /* ===== MEDIDAS DE ACCESIBILIDAD ===== */
    --focus-outline: 2px solid var(--primary);
    --focus-outline-offset: 2px;
    --min-touch-target: 44px; /* Mínimo para elementos táctiles */
}