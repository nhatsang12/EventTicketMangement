import apiClient from '../config/api';

// Service gọi API xác thực tới backend
// Backend của bạn đang mount dưới /api/auth (xem src/app.js)

export const authAPI = {
  // Đăng ký
  register: (data) => apiClient.post('/auth/register', data),

  // Đăng nhập
  login: (data) => apiClient.post('/auth/login', data),

  // Quên mật khẩu (tùy backend đã có hay chưa)
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  // Lấy thông tin người dùng hiện tại (nếu có route)
  me: () => apiClient.get('/auth/me'),
};