import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState('');

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
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { accessToken, refreshToken, data } = response.data;
      const user = data.user;
      setAuth(user, accessToken, refreshToken);
      toast.success('Đăng ký thành công! Chào mừng bạn.');
      navigate('/');
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fieldAccent = (field) => {
    if (field === 'password' || field === 'confirmPassword') return 'rgba(168,85,247,0.5)';
    return 'rgba(249,115,22,0.5)';
  };

  const fieldGlow = (field) => {
    if (field === 'password' || field === 'confirmPassword') return 'rgba(168,85,247,0.1)';
    return 'rgba(249,115,22,0.1)';
  };

  const iconColor = (field) => {
    if (focused !== field) return 'rgba(255,255,255,0.25)';
    return field === 'password' || field === 'confirmPassword' ? '#a855f7' : '#f97316';
  };

  const inputStyle = (field, extra = {}) => ({
    width: '100%',
    padding: '14px 14px 14px 42px',
    ...extra,
    background: focused === field ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
    border: focused === field
      ? `1px solid ${fieldAccent(field)}`
      : '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12,
    fontSize: 14,
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: "'Be Vietnam Pro',sans-serif",
    boxShadow: focused === field ? `0 0 0 3px ${fieldGlow(field)}` : 'none',
    boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '100svh', display: 'flex', fontFamily: "'Be Vietnam Pro',sans-serif", background: '#060606', position: 'relative', overflow: 'hidden' }}>

      {/* ── LEFT: Hero image panel ── */}
      <div style={{ flex: '0 0 52%', position: 'relative', display: 'flex' }} className="rp-hero-panel">
        <img
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&auto=format&fit=crop&q=80"
          alt="event"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,6,6,0.55) 0%,rgba(0,0,0,0.2) 50%,rgba(168,85,247,0.08) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,6,6,0) 60%,rgba(6,6,6,0.96) 100%)' }} />
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: '#060606', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
              Đăng ký
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", marginBottom: 8 }}>
              Tạo tài khoản<br />
              <span style={{ background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                tham gia ngay!
              </span>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Username */}
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('username'), transition: 'color 0.2s', zIndex: 1 }} />
              <input
                type="text" name="username" value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                required placeholder="Username"
                style={inputStyle('username')}
              />
            </div>

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('email'), transition: 'color 0.2s', zIndex: 1 }} />
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                required placeholder="Email"
                style={inputStyle('email')}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('password'), transition: 'color 0.2s', zIndex: 1 }} />
              <input
                type={showPass ? 'text' : 'password'} name="password" value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                required placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                style={inputStyle('password', { paddingRight: 44 })}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('confirmPassword'), transition: 'color 0.2s', zIndex: 1 }} />
              <input
                type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused('')}
                required placeholder="Xác nhận mật khẩu"
                style={inputStyle('confirmPassword', { paddingRight: 44 })}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex' }}>
                {showConfirm ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 12,
                background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#f97316,#a855f7)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white', fontSize: 15, fontWeight: 800,
                fontFamily: "'Be Vietnam Pro',sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.25s',
                boxShadow: loading ? 'none' : '0 6px 28px rgba(249,115,22,0.28)',
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }} className="rp-submit">
              {loading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} className="rp-spin" /> Đang xử lý...</>
              ) : (
                <>Tạo tài khoản <ArrowRight style={{ width: 16, height: 16 }} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif", whiteSpace: 'nowrap' }}>Hoặc đăng ký với</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            {['apple', 'google', 'facebook'].map((p) => (
              <button key={p}
                style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                className="rp-social">
                <img src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${p}/${p}-original.svg`} alt={p} style={{ width: 20, height: 20 }} />
              </button>
            ))}
          </div>

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 24, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            Đã có tài khoản?{' '}
            <Link to="/login"
              style={{ fontWeight: 700, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        input::placeholder { color: rgba(255,255,255,0.25); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #111 inset !important; -webkit-text-fill-color: white !important; }

        @keyframes rp-spin { to { transform: rotate(360deg); } }
        .rp-spin { animation: rp-spin 0.8s linear infinite; }

        .rp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 36px rgba(249,115,22,0.38) !important; }
        .rp-submit:active:not(:disabled) { transform: translateY(0); }
        .rp-social:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.18) !important; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .rp-hero-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;