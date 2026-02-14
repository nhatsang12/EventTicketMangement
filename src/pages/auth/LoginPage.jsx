import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { toast.error('Email không hợp lệ'); return; }
    if (formData.password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }

    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));

      // ── Tài khoản Admin cứng ──
      const ADMIN_EMAIL = 'admin@tickethub.vn';
      const ADMIN_PASSWORD = 'admin123';

      const isAdmin = formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD;

      const fakeUser = {
        id: isAdmin ? 'admin-001' : 'temp-' + Date.now(),
        name: isAdmin ? 'Admin' : formData.email.split('@')[0],
        email: formData.email,
        role: isAdmin ? 'admin' : 'user',
      };

      setAuth(fakeUser, 'fake-access-token', 'fake-refresh-token');
      toast.success(isAdmin ? '👋 Xin chào Admin!' : 'Đăng nhập thành công!');
      navigate(isAdmin ? '/admin' : from, { replace: true });
    } catch {
      toast.error('Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 font-body">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600" alt="bg" className="w-full h-full object-cover brightness-50" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

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
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email"
            className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Password"
            className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
          <button type="submit" disabled={loading}
            className="w-full py-3 text-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 disabled:opacity-50 rounded-md transition-all duration-300">
            {loading ? 'Đang đăng nhập...' : 'Continue'}
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