/**
 * router.js - Router SPA
 * Navegación sin recarga de página
 * Versión: 1.0.0
 */

const CEARouter = (function() {
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        DEFAULT_TITLE: 'CEA Biométrico',
        USE_HISTORY: true,
        ANIMATE_TRANSITIONS: true
    };

    // ===== ESTADO INTERNO =====
    let routes = new Map();
    let currentRoute = null;
    let previousRoute = null;
    let params = {};
    let query = {};
    let notFoundHandler = null;

    // ===== INICIALIZACIÓN =====
    function init() {
        console.log('🔄 Inicializando router...');

        // Escuchar cambios en la historia
        window.addEventListener('popstate', handlePopState);

        // Procesar ruta inicial
        processCurrentRoute();

        console.log('✅ Router listo');
    }

    function handlePopState(event) {
        processCurrentRoute();
    }

    // ===== DEFINICIÓN DE RUTAS =====
    function addRoute(path, handler, title = null) {
        // Convertir path a expresión regular
        const paramNames = [];
        const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });

        routes.set(path, {
            path,
            regex: new RegExp(`^${regexPath}$`),
            paramNames,
            handler,
            title: title || formatTitle(path)
        });

        console.log(`➕ Ruta añadida: ${path}`);
    }

    function setNotFound(handler) {
        notFoundHandler = handler;
    }

    // ===== NAVEGACIÓN =====
    function navigateTo(path, options = {}) {
        const {
            replace = false,
            state = {},
            title = null
        } = options;

        // Construir URL completa
        let fullPath = path;
        if (Object.keys(query).length > 0) {
            fullPath += '?' + new URLSearchParams(query).toString();
        }

        // Actualizar historial
        if (CONFIG.USE_HISTORY) {
            if (replace) {
                history.replaceState(state, '', fullPath);
            } else {
                history.pushState(state, '', fullPath);
            }
        }

        // Procesar nueva ruta
        processRoute(path, state);
    }

    function processRoute(path, state = {}) {
        // Extraer query params
        const [pathWithoutQuery, queryString] = path.split('?');
        parseQuery(queryString);

        // Buscar ruta que coincida
        let matchedRoute = null;
        let matchedParams = {};

        for (const route of routes.values()) {
            const match = pathWithoutQuery.match(route.regex);
            if (match) {
                matchedRoute = route;
                matchedParams = extractParams(route.paramNames, match.slice(1));
                break;
            }
        }

        // Actualizar estado
        previousRoute = currentRoute;
        currentRoute = matchedRoute;
        params = matchedParams;

        if (matchedRoute) {
            // Actualizar título
            document.title = matchedRoute.title + ' - ' + CONFIG.DEFAULT_TITLE;

            // Ejecutar handler
            matchedRoute.handler({ params, query, state });
        } else if (notFoundHandler) {
            notFoundHandler({ path, query, state });
        } else {
            console.error(`Ruta no encontrada: ${path}`);
        }
    }

    function processCurrentRoute() {
        const path = window.location.pathname + window.location.search;
        const state = history.state || {};
        processRoute(path, state);
    }

    // ===== PARÁMETROS =====
    function extractParams(names, values) {
        const params = {};
        names.forEach((name, index) => {
            params[name] = values[index];
        });
        return params;
    }

    function parseQuery(queryString) {
        query = {};
        if (!queryString) return;

        new URLSearchParams(queryString).forEach((value, key) => {
            query[key] = value;
        });
    }

    function getParams() {
        return { ...params };
    }

    function getQuery() {
        return { ...query };
    }

    // ===== LINKS =====
    function handleLinkClick(event) {
        const link = event.target.closest('a[data-link]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#')) return;

        event.preventDefault();
        navigateTo(href);
    }

    function initLinks() {
        document.addEventListener('click', handleLinkClick);
    }

    // ===== UTILIDADES =====
    function formatTitle(path) {
        return path
            .replace(/^\//, '')
            .replace(/\//g, ' - ')
            .replace(/:([^/]+)/g, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim() || 'Inicio';
    }

    function getCurrentRoute() {
        return currentRoute ? currentRoute.path : null;
    }

    function getPreviousRoute() {
        return previousRoute ? previousRoute.path : null;
    }

    function getRoutes() {
        return Array.from(routes.values()).map(r => ({
            path: r.path,
            title: r.title
        }));
    }

    function goBack() {
        history.back();
    }

    function goForward() {
        history.forward();
    }

    function reload() {
        processCurrentRoute();
    }

    // ===== API PÚBLICA =====
    return {
        // Inicialización
        init,
        initLinks,
        
        // Definición de rutas
        addRoute,
        setNotFound,
        
        // Navegación
        navigateTo,
        goBack,
        goForward,
        reload,
        
        // Parámetros
        getParams,
        getQuery,
        
        // Información
        getCurrentRoute,
        getPreviousRoute,
        getRoutes,
        
        // Configuración
        CONFIG
    };
})();

// Exponer globalmente
window.CEARouter = CEARouter;