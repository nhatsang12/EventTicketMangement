import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Ticket, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import API_URL from '../../config/api';

const LoginPage = () => {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [focused, setFocused] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { toast.error('Email không hợp lệ'); return; }
    if (formData.password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/login`, { email: formData.email, password: formData.password });
      const { accessToken, refreshToken, data } = response.data;
      const user = data.user;
      setAuth(user, accessToken, refreshToken);
      toast.success(`👋 Xin chào ${user.name || user.username}!`);
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100svh', display:'flex', fontFamily:"'Be Vietnam Pro',sans-serif", background:'#060606', position:'relative', overflow:'hidden' }}>

      {/* ── LEFT: Hero image panel ── */}
      <div style={{ flex:'0 0 52%', position:'relative', display:'flex' }} className="lp-hero-panel">
        <img
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&auto=format&fit=crop&q=80"
          alt="event"
          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
        />
        {/* Overlays */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(6,6,6,0.55) 0%,rgba(0,0,0,0.2) 50%,rgba(168,85,247,0.08) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(6,6,6,0) 60%,rgba(6,6,6,0.96) 100%)' }}/>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 48px', background:'#060606', position:'relative', overflow:'hidden' }}>
        {/* Ambient glow */}
        <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, background:'radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-80, left:-80, width:350, height:350, background:'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ width:'100%', maxWidth:380, position:'relative' }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:10, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
              Đăng nhập
            </p>
            <h1 style={{ fontSize:'clamp(1.8rem,3vw,2.4rem)', fontWeight:900, color:'white', lineHeight:1.1, letterSpacing:'-0.03em', fontFamily:"'Clash Display','Be Vietnam Pro',sans-serif", marginBottom:8 }}>
              Chào mừng<br/>
              <span style={{ background:'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>quay trở lại!</span>
            </h1>
            {from !== '/' && (
              <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#fb923c', fontFamily:"'Be Vietnam Pro',sans-serif" }}>
                <span style={{ fontSize:14 }}>🎟</span> Đăng nhập xong sẽ tiếp tục đặt vé
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Email */}
            <div style={{ position:'relative' }}>
              <Mail style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:15, height:15, color: focused==='email' ? '#f97316' : 'rgba(255,255,255,0.25)', transition:'color 0.2s', zIndex:1 }}/>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange}
                onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                required placeholder="Email"
                style={{
                  width:'100%', padding:'14px 14px 14px 42px',
                  background: focused==='email' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  border: focused==='email' ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.09)',
                  borderRadius:12, fontSize:14, color:'white',
                  outline:'none', transition:'all 0.2s',
                  fontFamily:"'Be Vietnam Pro',sans-serif",
                  boxShadow: focused==='email' ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
                  boxSizing:'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ position:'relative' }}>
              <Lock style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:15, height:15, color: focused==='password' ? '#a855f7' : 'rgba(255,255,255,0.25)', transition:'color 0.2s', zIndex:1 }}/>
              <input
                type={showPass ? 'text' : 'password'} name="password" value={formData.password}
                onChange={handleChange}
                onFocus={()=>setFocused('password')} onBlur={()=>setFocused('')}
                required placeholder="Mật khẩu"
                style={{
                  width:'100%', padding:'14px 44px 14px 42px',
                  background: focused==='password' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  border: focused==='password' ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.09)',
                  borderRadius:12, fontSize:14, color:'white',
                  outline:'none', transition:'all 0.2s',
                  fontFamily:"'Be Vietnam Pro',sans-serif",
                  boxShadow: focused==='password' ? '0 0 0 3px rgba(168,85,247,0.1)' : 'none',
                  boxSizing:'border-box',
                }}
              />
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.28)', padding:0, display:'flex' }}>
                {showPass ? <EyeOff style={{ width:15, height:15 }}/> : <Eye style={{ width:15, height:15 }}/>}
              </button>
            </div>

            {/* Forgot */}
            <div style={{ textAlign:'right', marginTop:-6 }}>
              <a href="#" style={{ fontSize:12, color:'rgba(255,255,255,0.35)', textDecoration:'none', fontFamily:"'Be Vietnam Pro',sans-serif", transition:'color 0.2s' }} className="lp-forgot">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'15px', borderRadius:12,
                background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#f97316,#a855f7)',
                border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                color:'white', fontSize:15, fontWeight:800,
                fontFamily:"'Be Vietnam Pro',sans-serif",
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'all 0.25s',
                boxShadow: loading ? 'none' : '0 6px 28px rgba(249,115,22,0.28)',
                opacity: loading ? 0.7 : 1,
              }} className="lp-submit">
              {loading ? (
                <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block' }} className="lp-spin"/> Đang xử lý...</>
              ) : (
                <>Đăng nhập <ArrowRight style={{ width:16, height:16 }}/></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:14, margin:'24px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:"'Be Vietnam Pro',sans-serif", whiteSpace:'nowrap' }}>Hoặc đăng nhập với</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
          </div>

          {/* Social */}
          <div style={{ display:'flex', gap:12 }}>
            {['apple','google','facebook'].map((p) => (
              <button key={p}
                style={{ flex:1, height:48, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s' }}
                className="lp-social">
                <img src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${p}/${p}-original.svg`} alt={p} style={{ width:20, height:20 }}/>
              </button>
            ))}
          </div>

          {/* Register link */}
          <p style={{ textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.35)', marginTop:24, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" state={{ from }}
              style={{ fontWeight:700, background:'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textDecoration:'none' }}>
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        input::placeholder { color: rgba(255,255,255,0.25); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #111 inset !important; -webkit-text-fill-color: white !important; }

        @keyframes lp-spin { to { transform: rotate(360deg); } }
        .lp-spin { animation: lp-spin 0.8s linear infinite; }

        .lp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 36px rgba(249,115,22,0.38) !important; }
        .lp-submit:active:not(:disabled) { transform: translateY(0); }
        .lp-social:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.18) !important; transform: translateY(-1px); }
        .lp-forgot:hover { color: rgba(255,255,255,0.6) !important; }

        @media (max-width: 768px) {
          .lp-hero-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;