import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import axios from 'axios'; // Import axios để gọi API
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Backend cần 'username', nên mình đổi fullname -> username cho khớp
  const [formData, setFormData] = useState({
    username: '', 
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate phía Client
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);

      // 2. Gọi API Đăng ký (Đã cấu hình Proxy nên chỉ cần gõ ngắn gọn)
      const response = await axios.post('/api/auth/register', {
        username: formData.username, // Mapping dữ liệu đúng với Backend yêu cầu
        email: formData.email,
        password: formData.password,
      });

      // 3. Xử lý kết quả trả về từ Backend
      // Cấu trúc trả về: { status, message, accessToken, refreshToken, data: { user } }
      const { accessToken, refreshToken, data } = response.data;
      const user = data.user;

      // 4. Lưu vào Store (Đăng ký xong tự đăng nhập luôn)
      setAuth(user, accessToken, refreshToken);

      toast.success('Đăng ký thành công! Chào mừng bạn.');
      navigate('/'); // Chuyển hướng về trang chủ

    } catch (error) {
      console.error(error);
      // Lấy thông báo lỗi từ Backend (ví dụ: Email đã tồn tại)
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 font-body">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600"
          alt="Background"
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">
            Create account
          </h1>
          <h2 className="text-4xl font-bold text-gray-600">
            Join us today
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Username Input */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="username" // Đã sửa thành username
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Username" // Đổi placeholder cho hợp lý
              className="w-full pl-10 px-3 py-3 text-sm border border-gray-300 rounded-md
                          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Email"
              className="w-full pl-10 px-3 py-3 text-sm border border-gray-300 rounded-md
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password (min 6 chars)"
              className="w-full pl-10 px-3 py-3 text-sm border border-gray-300 rounded-md
                          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
              className="w-full pl-10 px-3 py-3 text-sm border border-gray-300 rounded-md
                          focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-lg font-semibold text-white
                       bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700
                       disabled:opacity-50 rounded-md transition-all duration-300"
          >
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent font-medium hover:from-orange-700 hover:to-purple-700 transition-all"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;