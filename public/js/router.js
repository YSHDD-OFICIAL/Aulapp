/**
 * router.js - Router para SPA
 */
const CEARouter = (function() {
    const routes = {};
    let currentRoute = null;
    
    function handleRoute() {
        const path = window.location.pathname;
        const route = routes[path] || routes['404'];
        
        if (route) {
            currentRoute = route;
            route.handler();
        }
    }
    
    return {
        addRoute(path, handler, title) {
            routes[path] = { handler, title };
        },
        
        navigateTo(path) {
            history.pushState({}, '', path);
            handleRoute();
            document.title = routes[path]?.title || 'CEA Biométrico';
        },
        
        init() {
            window.addEventListener('popstate', handleRoute);
            handleRoute();
        }
    };
})();

// Uso
CEARouter.addRoute('/', () => {
    document.getElementById('app').innerHTML = '<login-page></login-page>';
}, 'Iniciar Sesión - CEA');

CEARouter.addRoute('/dashboard', () => {
    if (!CEAAuth.isAuthenticated()) {
        CEARouter.navigateTo('/');
        return;
    }
    document.getElementById('app').innerHTML = '<dashboard-page></dashboard-page>';
}, 'Dashboard - CEA');

CEARouter.init();