# 🚗 Sistema de Gestión Biométrica para Centros de Enseñanza Automovilística (CEA)

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)
![SPA](https://img.shields.io/badge/SPA-Vanilla%20JS-orange.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?logo=webassembly&logoColor=white)

**Sistema integral para la gestión de centros de enseñanza automovilística con validación biométrica obligatoria y conteo de horas en tiempo real, cumpliendo con la Ley 2026.**

[Demo](https://cea-biometrico.netlify.app) · [Reportar Bug](https://github.com/tuusuario/cea-biometrico/issues) · [Solicitar Feature](https://github.com/tuusuario/cea-biometrico/issues)

![Dashboard Preview](assets/images/dashboard-preview.jpg)

</div>

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación Rápida](#-instalación-rápida)
- [Configuración](#-configuración)
- [Uso del Sistema](#-uso-del-sistema)
- [Módulos](#-módulos)
- [API Biométrica](#-api-biométrica)
- [PWA y Offline](#-pwa-y-offline)
- [Seguridad](#-seguridad)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

## ✨ Características Principales

### 🔐 **Sistema Biométrico Avanzado**
- Validación de huella dactilar para inicio y fin de clases
- Selector visual de dedos con manos interactivas
- Integración con API Bridge RUNT para lectura biométrica
- Registro de eventos biométricos para auditoría

### 📊 **Dashboard Interactivo**
- Círculos de progreso dinámicos con SVG animado
- Visualización de horas por categoría (B1, C1, A2)
- Gráficos de progreso en tiempo real
- Historial detallado de sesiones

### ⏱️ **Conteo de Horas en Tiempo Real**
- Sistema de heartbeats cada 30 segundos
- Sincronización offline con IndexedDB
- Cálculo preciso de minutos según Ley 2026
- Bloqueo automático si teoría no está al 100%

### 📱 **PWA (Progressive Web App)**
- Funciona offline
- Instalable en dispositivos móviles
- Notificaciones push
- Sincronización en segundo plano

### 👨‍💼 **Panel Administrativo**
- Gestión de vehículos con control de vigencias
- Seguimiento de aprendices con stepper de progreso
- Exportación de datos a CSV
- Reportes y estadísticas

### 🛡️ **Seguridad y Privacidad**
- Cifrado de datos sensibles (Habeas Data)
- Validación de documentos colombianos
- Protección contra XSS
- Almacenamiento local cifrado

## 🛠️ Tecnologías Utilizadas

### Frontend
| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura semántica, templates, web components |
| **CSS3** | Variables CSS, Flexbox, Grid, Animaciones, Temas claro/oscuro |
| **JavaScript (Vanilla)** | Toda la lógica de negocio, sin frameworks |
| **TypeScript** | Tipado estático opcional para módulos críticos |
| **WebAssembly** | Cálculos biométricos de alto rendimiento |
| **Canvas/SVG** | Gráficos de progreso y visualizaciones |
| **IndexedDB** | Base de datos local offline-first |
| **LocalStorage** | Configuración y datos pequeños |

### Arquitectura
| Concepto | Implementación |
|----------|----------------|
| **SPA** | Router propio con History API |
| **MPA** | Soporte híbrido para páginas tradicionales |
| **PWA** | Service Worker, Manifest, Offline |
| **API Bridge** | Comunicación con lector biométrico local |
| **CSV** | Exportación e importación de datos |

## 📂 Estructura del Proyecto
# Aulapp