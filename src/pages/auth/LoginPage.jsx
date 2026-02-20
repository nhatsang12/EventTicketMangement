import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios'; // Import thư viện gọi API

const LoginPage = () => {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy redirect URL nếu có (ví dụ từ checkout)
  const from = location.state?.from || '/';

  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cơ bản phía Client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { toast.error('Email không hợp lệ'); return; }
    if (formData.password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }

    try {
      setLoading(true);

      // --- PHẦN SỬA ĐỔI QUAN TRỌNG: GỌI API THẬT ---
      // Gọi xuống Backend thông qua Proxy (đã cài ở vite.config.js)
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Lấy dữ liệu Backend trả về (khớp với authController.js)
      const { accessToken, refreshToken, data } = response.data;
      const user = data.user; // Lấy thông tin user từ object data

      // Lưu vào Global State (Zustand)
      setAuth(user, accessToken, refreshToken);

      // Thông báo thành công
      toast.success(`👋 Xin chào ${user.name || user.username}!`);

      // Điều hướng: Nếu là admin thì vào trang admin, ngược lại về trang trước đó
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }

    } catch (error) {
      // Xử lý lỗi từ Backend trả về (ví dụ: Sai mật khẩu)
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      toast.error(message);
      console.error('Login Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 font-body">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600" alt="bg" className="w-full h-full object-cover brightness-50" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">Welcome!</h1>
          <h2 className="text-4xl font-bold text-gray-600">Sign in to your account</h2>
          {from !== '/' && (
            <p className="mt-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              ✓ Đăng nhập xong sẽ tiếp tục đặt vé
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              placeholder="Email"
              className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" 
            />
          </div>
          <div>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              placeholder="Password"
              className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 text-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 disabled:opacity-50 rounded-md transition-all duration-300">
            {loading ? 'Đang xử lý...' : 'Continue'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-3 text-sm text-gray-500">Or sign in with</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <div className="flex justify-center gap-6">
          {['apple', 'google', 'facebook'].map((p) => (
            <button key={p} className="w-12 h-12 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 hover:border-orange-300 transition-all">
              <img src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${p}/${p}-original.svg`} alt={p} className="w-6 h-6" />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" state={{ from }} className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;