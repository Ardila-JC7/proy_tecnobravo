/**
 * TecnoBravo Store - Frontend
 * Aplicación de página única (SPA) con CRUD completo.
 * Arquitectura: MVC (Model - View - Controller).
 * Se comunica con el backend Node.js + Express vía fetch().
 */

// ===== Configuración =====
const API_URL = '/api/pedidos';
const PRODUCTOS_URL = './productos.json';

// =========================================================
// MODEL: lógica de datos y comunicación con el backend
// =========================================================
const Model = {
    availableProducts: [],
    orders: [],

    /** Carga el catálogo de productos desde el JSON local */
    async cargarProductos() {
        try {
            const response = await fetch(PRODUCTOS_URL);
            if (!response.ok) throw new Error('No se pudo cargar el catálogo');
            this.availableProducts = await response.json();
            return this.availableProducts;
        } catch (error) {
            console.error('Error cargando productos:', error);
            View.showNotification('Error cargando el catálogo de productos', 'error');
            return [];
        }
    },

    /** GET - Obtiene todos los pedidos del backend */
    async fetchOrders() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error obteniendo pedidos');
            this.orders = await response.json();
            return this.orders;
        } catch (error) {
            console.error('Error en fetchOrders:', error);
            View.showNotification('No se pudo conectar al servidor', 'error');
            return [];
        }
    },

    /** POST - Crea un nuevo pedido en el backend */
    async addOrder(data) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detalles?.join(', ') || err.error || 'Error al crear');
            }
            const nuevo = await response.json();
            this.orders.push(nuevo);
            return nuevo;
        } catch (error) {
            console.error('Error en addOrder:', error);
            View.showNotification(error.message, 'error');
            return null;
        }
    },

    /** PUT - Actualiza un pedido existente en el backend */
    async updateOrder(id, data) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detalles?.join(', ') || err.error || 'Error al actualizar');
            }
            const actualizado = await response.json();
            const indice = this.orders.findIndex(o => o.id === id);
            if (indice !== -1) this.orders[indice] = actualizado;
            return actualizado;
        } catch (error) {
            console.error('Error en updateOrder:', error);
            View.showNotification(error.message, 'error');
            return null;
        }
    },

    /** DELETE - Elimina un pedido en el backend */
    async removeOrder(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al eliminar');
            }
            this.orders = this.orders.filter(o => o.id !== id);
            return true;
        } catch (error) {
            console.error('Error en removeOrder:', error);
            View.showNotification(error.message, 'error');
            return false;
        }
    },

    /** Busca un pedido por ID en la lista local */
    findOrder(id) {
        return this.orders.find(o => o.id === id);
    }
};

// =========================================================
// VIEW: manipulación del DOM y feedback visual
// =========================================================
const View = {
    /** Llena el selector de productos del formulario */
    initProductSelect(products) {
        const select = document.getElementById('product-select');
        select.innerHTML = '<option value="" disabled selected>Seleccione un producto...</option>';
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.name;
            option.textContent = `${p.name} (${p.category})`;
            select.appendChild(option);
        });
    },

    /** Renderiza el catálogo de productos en cards */
    renderCatalogo(products) {
        const contenedor = document.getElementById('productos');
        if (!contenedor) return;
        contenedor.innerHTML = products.map(p => `
            <article class="producto-card">
                <h3>${this.escapeHTML(p.name)}</h3>
                <p>Disponible en TecnoBravo Store</p>
                <span class="category-tag">${this.escapeHTML(p.category)}</span>
            </article>
        `).join('');
    },

    /** Renderiza la tabla de pedidos */
    renderTable(orders, editingId = null) {
        const tbody = document.getElementById('table-body');
        const emptyMsg = document.getElementById('empty-msg');
        const counter = document.getElementById('pedidos-count');

        tbody.innerHTML = '';
        counter.textContent = `${orders.length} pedido${orders.length === 1 ? '' : 's'}`;

        if (orders.length === 0) {
            emptyMsg.style.display = 'block';
            return;
        }

        emptyMsg.style.display = 'none';
        orders.forEach(item => {
            const isEditing = item.id === editingId;
            const row = document.createElement('tr');
            if (isEditing) row.classList.add('row-editing');
            row.innerHTML = `
                <td>${this.escapeHTML(item.date)}</td>
                <td><strong>${this.escapeHTML(item.email)}</strong></td>
                <td>${this.escapeHTML(item.phone || '-')}</td>
                <td>${this.escapeHTML(item.product)}</td>
                <td>${this.escapeHTML(item.payment)}</td>
                <td>${this.escapeHTML(item.instructions)}</td>
                <td>
                    <button class="btn-edit" data-id="${item.id}" aria-label="Editar pedido">Editar</button>
                    <button class="btn-delete" data-id="${item.id}" aria-label="Eliminar pedido">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    /** Carga los datos de un pedido en el formulario para edición */
    fillForm(order) {
        document.getElementById('order-id').value = order.id;
        document.getElementById('client-email').value = order.email;
        document.getElementById('client-phone').value = order.phone || '';
        document.getElementById('product-select').value = order.product;
        document.getElementById('payment-method').value = order.payment;
        document.getElementById('shipping-instructions').value = order.instructions;

        document.getElementById('submit-btn').textContent = 'Actualizar pedido';
        document.getElementById('cancel-edit-btn').hidden = false;

        // Scroll suave hasta el formulario
        document.getElementById('contacto').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /**
     * Limpia el formulario y vuelve al modo creación.
     * Llama a form.reset(): el listener del evento 'reset' (en Controller)
     * se encarga de limpiar los elementos auxiliares.
     */
    resetForm() {
        document.getElementById('contact-form').reset();
    },

    /** Muestra una notificación toast */
    showNotification(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    /** Escapa HTML para evitar inyección de código */
    escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// =========================================================
// CONTROLLER: orquesta Model y View, maneja eventos
// =========================================================
const Controller = {
    editingId: null,

    async init() {
        // 1. Cargar productos y renderizar UI inicial
        await Model.cargarProductos();
        View.initProductSelect(Model.availableProducts);
        View.renderCatalogo(Model.availableProducts);

        // 2. Cargar pedidos existentes del backend
        await Model.fetchOrders();
        View.renderTable(Model.orders);

        // 3. Registrar listeners
        this.bindFormEvents();
        this.bindTableEvents();
    },

    /** Toma los datos del formulario en un objeto */
    getFormData() {
        return {
            email: document.getElementById('client-email').value.trim(),
            phone: document.getElementById('client-phone').value.trim(),
            product: document.getElementById('product-select').value,
            payment: document.getElementById('payment-method').value,
            instructions: document.getElementById('shipping-instructions').value.trim()
        };
    },

    /** Validación básica del lado del cliente */
    validateForm(data) {
        if (!data.email || !data.email.includes('@')) return 'Ingrese un correo válido';
        if (!data.phone || data.phone.length < 7) return 'Ingrese un teléfono válido';
        if (!data.product) return 'Seleccione un producto';
        if (!data.payment) return 'Seleccione un método de pago';
        if (!data.instructions) return 'Ingrese las instrucciones de envío';
        return null;
    },

    bindFormEvents() {
        const form = document.getElementById('contact-form');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        // Submit: decide entre crear y actualizar según el campo oculto
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = this.getFormData();
            const error = this.validateForm(data);
            if (error) {
                View.showNotification(error, 'error');
                return;
            }

            const orderId = document.getElementById('order-id').value;

            if (orderId) {
                // Modo edición
                const actualizado = await Model.updateOrder(parseInt(orderId), data);
                if (actualizado) {
                    View.showNotification(`Pedido de ${actualizado.email} actualizado`, 'success');
                    this.editingId = null;
                    View.renderTable(Model.orders);
                    View.resetForm();
                }
            } else {
                // Modo creación
                const nuevo = await Model.addOrder(data);
                if (nuevo) {
                    View.showNotification(`Pedido de ${nuevo.email} registrado con éxito`, 'success');
                    View.renderTable(Model.orders);
                    View.resetForm();
                }
            }
        });

        // Cancelar edición: dispara un reset del formulario, que activa
        // el listener centralizado de limpieza definido más abajo.
        cancelBtn.addEventListener('click', () => {
            form.reset();
            View.renderTable(Model.orders);
            View.showNotification('Edición cancelada', 'info');
        });

        // Listener centralizado para cualquier reset del formulario.
        // Limpia el estado de edición y los elementos auxiliares de la UI.
        form.addEventListener('reset', () => {
            this.editingId = null;
            // setTimeout permite que el reset nativo aplique antes de modificar campos auxiliares
            setTimeout(() => {
                document.getElementById('order-id').value = '';
                document.getElementById('submit-btn').textContent = 'Registrar pedido';
                document.getElementById('cancel-edit-btn').hidden = true;
            }, 0);
        });
    },

    bindTableEvents() {
        const tableBody = document.getElementById('table-body');

        tableBody.addEventListener('click', async (e) => {
            const target = e.target;
            const id = parseInt(target.getAttribute('data-id'));
            if (!id) return;

            // Acción: editar
            if (target.classList.contains('btn-edit')) {
                const order = Model.findOrder(id);
                if (order) {
                    this.editingId = id;
                    View.fillForm(order);
                    View.renderTable(Model.orders, id);
                    View.showNotification('Editando pedido. Modifique y pulse Actualizar.', 'info');
                }
            }

            // Acción: eliminar
            if (target.classList.contains('btn-delete')) {
                if (!confirm('¿Está seguro de eliminar este pedido?')) return;
                const ok = await Model.removeOrder(id);
                if (ok) {
                    // Si estaba editando este mismo pedido, cancelar la edición
                    if (this.editingId === id) {
                        this.editingId = null;
                        View.resetForm();
                    }
                    View.renderTable(Model.orders, this.editingId);
                    View.showNotification('Pedido eliminado', 'success');
                }
            }
        });
    }
};

// Arrancar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => Controller.init());
