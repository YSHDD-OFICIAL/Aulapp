/**
 * vehicle-table.js - Componente de tabla de vehículos
 */

class VehicleTable {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            showActions: options.showActions !== false,
            onEdit: options.onEdit || (() => {}),
            onDelete: options.onDelete || (() => {}),
            onView: options.onView || (() => {}),
            ...options
        };
        
        this.vehicles = [];
        this.filters = {};
        this.sortBy = 'placa';
        this.sortOrder = 'asc';
    }
    
    async loadData() {
        if (window.CEADB) {
            this.vehicles = await CEADB.getAll('vehiculos');
        } else {
            // Datos de ejemplo
            this.vehicles = [
                {
                    id: 1,
                    categoria: 'B1',
                    placa: 'ABC123',
                    marca: 'Renault',
                    modelo: 2022,
                    soat_vigencia: '2024-12-31',
                    licencia_transito_vigencia: '2025-06-30',
                    activo: true
                },
                {
                    id: 2,
                    categoria: 'C1',
                    placa: 'XYZ789',
                    marca: 'Chevrolet',
                    modelo: 2023,
                    soat_vigencia: '2024-10-15',
                    licencia_transito_vigencia: '2025-03-20',
                    activo: true
                }
            ];
        }
        
        this.render();
    }
    
    render() {
        this.applyFilters();
        this.applySort();
        
        let html = `
            <div class="vehicle-table-container">
                <div class="table-controls">
                    <input type="text" id="vehicle-search" placeholder="Buscar vehículo..." class="search-input">
                    
                    <select id="filter-categoria" class="filter-select">
                        <option value="">Todas las categorías</option>
                        <option value="B1">B1 - Automóvil</option>
                        <option value="C1">C1 - Camión</option>
                        <option value="A2">A2 - Motocicleta</option>
                    </select>
                    
                    <select id="filter-estado" class="filter-select">
                        <option value="">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                        <option value="vencido">SOAT vencido</option>
                    </select>
                    
                    <button id="refresh-table" class="btn-refresh">
                        🔄 Actualizar
                    </button>
                </div>
                
                <table class="vehicle-table">
                    <thead>
                        <tr>
                            <th data-sort="placa">Placa ${this.getSortIcon('placa')}</th>
                            <th data-sort="categoria">Categoría ${this.getSortIcon('categoria')}</th>
                            <th data-sort="marca">Marca ${this.getSortIcon('marca')}</th>
                            <th data-sort="modelo">Modelo ${this.getSortIcon('modelo')}</th>
                            <th>SOAT</th>
                            <th>Licencia Tránsito</th>
                            <th>Estado</th>
        `;
        
        if (this.options.showActions) {
            html += `<th>Acciones</th>`;
        }
        
        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (this.filteredVehicles.length === 0) {
            html += `
                <tr>
                    <td colspan="${this.options.showActions ? 8 : 7}" class="no-data">
                        No hay vehículos para mostrar
                    </td>
                </tr>
            `;
        } else {
            this.filteredVehicles.forEach(vehicle => {
                html += this.renderVehicleRow(vehicle);
            });
        }
        
        html += `
                    </tbody>
                </table>
                
                <div class="table-footer">
                    <div class="pagination">
                        <button class="page-btn" data-page="prev">◀</button>
                        <span class="page-info">Página 1 de 1</span>
                        <button class="page-btn" data-page="next">▶</button>
                    </div>
                    <div class="table-stats">
                        Mostrando ${this.filteredVehicles.length} vehículos
                    </div>
                </div>
            </div>
        `;
        
        this.element.innerHTML = html;
        this.attachEvents();
    }
    
    renderVehicleRow(vehicle) {
        const hoy = new Date();
        const soatVence = new Date(vehicle.soat_vigencia);
        const licenciaVence = new Date(vehicle.licencia_transito_vigencia);
        
        const soatVencido = soatVence < hoy;
        const licenciaVencida = licenciaVence < hoy;
        const proximoVencer = this.diasHasta(soatVence) <= 30 || this.diasHasta(licenciaVence) <= 30;
        
        let estadoClass = 'estado-activo';
        let estadoText = 'Activo';
        
        if (soatVencido || licenciaVencida) {
            estadoClass = 'estado-vencido';
            estadoText = 'Documentos vencidos';
        } else if (proximoVencer) {
            estadoClass = 'estado-proximo';
            estadoText = 'Próximo a vencer';
        }
        
        return `
            <tr class="${soatVencido || licenciaVencida ? 'row-vencido' : ''}">
                <td><strong>${vehicle.placa}</strong></td>
                <td>${vehicle.categoria}</td>
                <td>${vehicle.marca}</td>
                <td>${vehicle.modelo}</td>
                <td class="${soatVencido ? 'vencido' : ''}">
                    ${CEAFormatters?.fecha(vehicle.soat_vigencia) || vehicle.soat_vigencia}
                    ${soatVencido ? '⚠️' : ''}
                </td>
                <td class="${licenciaVencida ? 'vencido' : ''}">
                    ${CEAFormatters?.fecha(vehicle.licencia_transito_vigencia) || vehicle.licencia_transito_vigencia}
                    ${licenciaVencida ? '⚠️' : ''}
                </td>
                <td>
                    <span class="estado-badge ${estadoClass}">${estadoText}</span>
                </td>
                ${this.options.showActions ? `
                    <td class="actions">
                        <button class="btn-icon" data-action="view" data-id="${vehicle.id}" title="Ver detalles">
                            👁️
                        </button>
                        <button class="btn-icon" data-action="edit" data-id="${vehicle.id}" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon" data-action="delete" data-id="${vehicle.id}" title="Eliminar">
                            🗑️
                        </button>
                    </td>
                ` : ''}
            </tr>
        `;
    }
    
    attachEvents() {
        // Búsqueda
        const searchInput = this.element.querySelector('#vehicle-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.render();
            });
        }
        
        // Filtros
        const categoriaFilter = this.element.querySelector('#filter-categoria');
        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', (e) => {
                this.filters.categoria = e.target.value;
                this.render();
            });
        }
        
        const estadoFilter = this.element.querySelector('#filter-estado');
        if (estadoFilter) {
            estadoFilter.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.render();
            });
        }
        
        // Ordenamiento
        this.element.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const sortField = th.dataset.sort;
                if (this.sortBy === sortField) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortBy = sortField;
                    this.sortOrder = 'asc';
                }
                this.render();
            });
        });
        
        // Acciones
        this.element.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                
                switch(action) {
                    case 'view':
                        this.options.onView(id);
                        break;
                    case 'edit':
                        this.options.onEdit(id);
                        break;
                    case 'delete':
                        if (confirm('¿Eliminar este vehículo?')) {
                            this.options.onDelete(id);
                        }
                        break;
                }
            });
        });
        
        // Refresh
        const refreshBtn = this.element.querySelector('#refresh-table');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }
    }
    
    applyFilters() {
        this.filteredVehicles = [...this.vehicles];
        
        // Búsqueda
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            this.filteredVehicles = this.filteredVehicles.filter(v => 
                v.placa.toLowerCase().includes(search) ||
                v.marca.toLowerCase().includes(search) ||
                v.modelo.toString().includes(search)
            );
        }
        
        // Filtro por categoría
        if (this.filters.categoria) {
            this.filteredVehicles = this.filteredVehicles.filter(v => 
                v.categoria === this.filters.categoria
            );
        }
        
        // Filtro por estado
        if (this.filters.estado) {
            const hoy = new Date();
            this.filteredVehicles = this.filteredVehicles.filter(v => {
                const soatVence = new Date(v.soat_vigencia);
                const licenciaVence = new Date(v.licencia_transito_vigencia);
                
                switch(this.filters.estado) {
                    case 'activo':
                        return v.activo && soatVence >= hoy && licenciaVence >= hoy;
                    case 'inactivo':
                        return !v.activo;
                    case 'vencido':
                        return soatVence < hoy || licenciaVence < hoy;
                    default:
                        return true;
                }
            });
        }
    }
    
    applySort() {
        this.filteredVehicles.sort((a, b) => {
            let valA = a[this.sortBy];
            let valB = b[this.sortBy];
            
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            
            if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    getSortIcon(field) {
        if (this.sortBy !== field) return '↕️';
        return this.sortOrder === 'asc' ? '↑' : '↓';
    }
    
    diasHasta(fecha) {
        const hoy = new Date();
        const diff = fecha - hoy;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    async addVehicle(vehicleData) {
        if (window.CEADB) {
            await CEADB.insert('vehiculos', vehicleData);
        } else {
            vehicleData.id = this.vehicles.length + 1;
            this.vehicles.push(vehicleData);
        }
        await this.loadData();
    }
    
    async updateVehicle(id, vehicleData) {
        if (window.CEADB) {
            await CEADB.update('vehiculos', id, vehicleData);
        } else {
            const index = this.vehicles.findIndex(v => v.id === id);
            if (index !== -1) {
                this.vehicles[index] = { ...this.vehicles[index], ...vehicleData };
            }
        }
        await this.loadData();
    }
    
    async deleteVehicle(id) {
        if (window.CEADB) {
            await CEADB.delete('vehiculos', id);
        } else {
            this.vehicles = this.vehicles.filter(v => v.id !== id);
        }
        await this.loadData();
    }
}

// Registrar global
window.VehicleTable = VehicleTable;