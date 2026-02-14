import apiClient from '../config/api';

export const eventAPI = {
  // Get all events with filters
  getEvents: async (params = {}) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  // Get single event by ID
  getEventById: async (id) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  // Get event ticket types
  getEventTicketTypes: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/ticket-types`);
    return response.data;
  },

  // Search events
  searchEvents: async (query) => {
    const response = await apiClient.get('/events/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Get featured events
  getFeaturedEvents: async () => {
    const response = await apiClient.get('/events/featured');
    return response.data;
  },

  // Get events by category
  getEventsByCategory: async (category) => {
    const response = await apiClient.get('/events/category', {
      params: { category },
    });
    return response.data;
  },
};