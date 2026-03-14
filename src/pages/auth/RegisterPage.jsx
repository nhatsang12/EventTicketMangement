import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(''); // ← lỗi từ server

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });

  const validate = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'password') {
      if (value.length > 0 && value.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      } else {
        delete newErrors.password;
      }
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      } else if (formData.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      } else {
        delete newErrors.confirmPassword;
      }
    }
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    validate(e.target.name, e.target.value);
    setServerError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (formData.password !== formData.confirmPassword) return;
    if (formData.password.length < 6) return;
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/register`, {
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
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      setServerError(message); 
    } finally {
      setLoading(false);
    }
  };

  const fieldAccent = (field) => {
    if (errors[field]) return 'rgba(248,113,113,0.6)';
    if (field === 'password' || field === 'confirmPassword') return 'rgba(168,85,247,0.5)';
    return 'rgba(249,115,22,0.5)';
  };

  const fieldGlow = (field) => {
    if (errors[field]) return 'rgba(248,113,113,0.1)';
    if (field === 'password' || field === 'confirmPassword') return 'rgba(168,85,247,0.1)';
    return 'rgba(249,115,22,0.1)';
  };

  const iconColor = (field) => {
    if (errors[field]) return '#f87171';
    if (focused !== field) return 'rgba(255,255,255,0.25)';
    return field === 'password' || field === 'confirmPassword' ? '#a855f7' : '#f97316';
  };

  const inputStyle = (field, extra = {}) => ({
    width: '100%', padding: '14px 14px 14px 42px', ...extra,
    background: focused === field ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
    border: focused === field ? `1px solid ${fieldAccent(field)}` : errors[field] ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, fontSize: 14, color: 'white', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Be Vietnam Pro',sans-serif",
    boxShadow: focused === field ? `0 0 0 3px ${fieldGlow(field)}` : 'none',
    boxSizing: 'border-box',
  });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div style={{ minHeight: '100svh', display: 'flex', fontFamily: "'Be Vietnam Pro',sans-serif", background: '#060606', position: 'relative', overflow: 'hidden' }}>

      <div style={{ flex: '0 0 52%', position: 'relative', display: 'flex' }} className="rp-hero-panel">
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&auto=format&fit=crop&q=80" alt="event" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,6,6,0.55) 0%,rgba(0,0,0,0.2) 50%,rgba(168,85,247,0.08) 100%)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,6,6,0) 60%,rgba(6,6,6,0.96) 100%)' }}/>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: '#060606', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' }}/>

        <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Đăng ký</p>
            <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", marginBottom: 8 }}>
              Tạo tài khoản<br/>
              <span style={{ background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tham gia ngay!</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Username */}
            <div>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('username'), transition: 'color 0.2s', zIndex: 1 }}/>
                <input type="text" name="username" value={formData.username} onChange={handleChange}
                  onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                  required placeholder="Username" style={inputStyle('username')}/>
              </div>
            </div>

            {/* Email */}
            <div>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('email'), transition: 'color 0.2s', zIndex: 1 }}/>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  required placeholder="Email" style={inputStyle('email')}/>
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('password'), transition: 'color 0.2s', zIndex: 1 }}/>
                <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  required placeholder="Mật khẩu (tối thiểu 6 ký tự)" style={inputStyle('password', { paddingRight: 44 })}/>
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }}/> : <Eye style={{ width: 15, height: 15 }}/>}
                </button>
              </div>
              {errors.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#f87171' }}>⚠️ {errors.password}</div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: iconColor('confirmPassword'), transition: 'color 0.2s', zIndex: 1 }}/>
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused('')}
                  required placeholder="Xác nhận mật khẩu" style={inputStyle('confirmPassword', { paddingRight: 44 })}/>
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex' }}>
                  {showConfirm ? <EyeOff style={{ width: 15, height: 15 }}/> : <Eye style={{ width: 15, height: 15 }}/>}
                </button>
              </div>
              {errors.confirmPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#f87171' }}>⚠️ {errors.confirmPassword}</div>
              )}
              {formData.confirmPassword && !errors.confirmPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#4ade80' }}>✅ Mật khẩu khớp!</div>
              )}
            </div>

            {/* ✅ Lỗi từ server (email trùng, v.v.) */}
            {serverError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: 10, fontSize: 13, color: '#f87171',
                fontFamily: "'Be Vietnam Pro',sans-serif",
              }}>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading || hasErrors}
              style={{
                width: '100%', padding: '15px', borderRadius: 12,
                background: loading || hasErrors ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#f97316,#a855f7)',
                border: 'none', cursor: loading || hasErrors ? 'not-allowed' : 'pointer',
                color: 'white', fontSize: 15, fontWeight: 800,
                fontFamily: "'Be Vietnam Pro',sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.25s',
                boxShadow: loading || hasErrors ? 'none' : '0 6px 28px rgba(249,115,22,0.28)',
                opacity: loading || hasErrors ? 0.5 : 1, marginTop: 4,
              }} className="rp-submit">
              {loading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} className="rp-spin"/> Đang xử lý...</>
              ) : (
                <>Tạo tài khoản <ArrowRight style={{ width: 16, height: 16 }}/></>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>Hoặc đăng ký với</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {['apple', 'google', 'facebook'].map((p) => (
              <button key={p} style={{ flex: 1, height: 48, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} className="rp-social">
                <img src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${p}/${p}-original.svg`} alt={p} style={{ width: 20, height: 20 }}/>
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ fontWeight: 700, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
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
        @media (max-width: 768px) { .rp-hero-panel { display: none !important; } }
      `}</style>
    </div>
  );
};

export default RegisterPage;