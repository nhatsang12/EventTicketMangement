import apiClient from '../config/api';

export const orderAPI = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  // Get user orders
  getMyOrders: async (params = {}) => {
    const response = await apiClient.get('/orders/my-orders', { params });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await apiClient.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

export const ticketAPI = {
  // Get user tickets
  getMyTickets: async (params = {}) => {
    const response = await apiClient.get('/tickets/my-tickets', { params });
    return response.data;
  },

  // Get ticket by ID
  getTicketById: async (id) => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  // Download ticket
  downloadTicket: async (id) => {
    const response = await apiClient.get(`/tickets/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Verify ticket (for check-in)
  verifyTicket: async (ticketCode) => {
    const response = await apiClient.post('/tickets/verify', { ticketCode });
    return response.data;
  },
};