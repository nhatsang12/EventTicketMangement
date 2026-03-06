import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Save, X,
  Ticket, History, QrCode, LogOut, Camera, Shield,
  TrendingUp, Star, Award, ChevronRight, Check, Sparkles,
  ArrowRight, BadgeCheck, Zap
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// ─── HELPERS ──────────────────────────────────────────────────────────────
const fmtPrice = p =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const fmtDate = iso =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── INPUT (reuses LoginPage style) ───────────────────────────────────────
const Field = ({ label, name, type = 'text', value, onChange, disabled, placeholder, icon: Icon, focused, onFocus, onBlur }) => {
  const isActive = focused === name;
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 6 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: isActive ? '#f97316' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s', zIndex: 1, pointerEvents: 'none' }}/>}
        <input type={type} name={name} value={value} onChange={onChange}
          onFocus={() => onFocus && onFocus(name)} onBlur={() => onBlur && onBlur('')}
          disabled={disabled} placeholder={placeholder || label}
          style={{
            width: '100%', padding: `12px 12px 12px ${Icon ? '36px' : '14px'}`,
            background: disabled ? 'rgba(255,255,255,0.02)' : isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
            border: disabled ? '1px solid rgba(255,255,255,0.05)' : isActive ? '1px solid rgba(249,115,22,0.45)' : '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, fontSize: 13, color: disabled ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none',
            transition: 'all 0.2s', fontFamily: "'Be Vietnam Pro',sans-serif",
            boxShadow: isActive ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
            boxSizing: 'border-box', cursor: disabled ? 'default' : 'text',
          }}
        />
      </div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setAuth } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);
  const fileInputRef = useRef(null);

  const [editing, setEditing]         = useState(false);
  const [activeTab, setActiveTab]     = useState('info');
  const [recentOrders, setRecentOrders] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [focused, setFocused]         = useState('');

  const [formData, setFormData] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    location: user?.location || 'Ho Chi Minh City',
    bio:      user?.bio      || '',
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/profile' } }); return; }
    const saved = localStorage.getItem(`avatar_${user?.id}`);
    if (saved) setAvatarPreview(saved);
    (async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:8000/api/orders/my-orders', config);
        let orders = res.data?.data || res.data || [];
        orders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
        setRecentOrders(orders);
      } catch { /* silent */ }
    })();
  }, [isAuthenticated, navigate, user?.id, token]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    const updated = { ...user, ...formData };
    setAuth(updated, 'fake-access-token', 'fake-refresh-token');
    if (avatarPreview) localStorage.setItem(`avatar_${user?.id}`, avatarPreview);
    setEditing(false);
    toast.success('Cập nhật hồ sơ thành công!');
  };

  const handleCancel = () => {
    setFormData({ name: user?.name||'', email: user?.email||'', phone: user?.phone||'', location: user?.location||'Ho Chi Minh City', bio: user?.bio||'' });
    setEditing(false);
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const totalSpent   = recentOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalTickets = recentOrders.reduce((s, o) => s + (o.tickets?.length || 0), 0);
  const initials     = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const tabs = [
    { key: 'info',     label: 'Thông tin',  Icon: User   },
    { key: 'tickets',  label: 'Vé gần đây', Icon: Ticket },
    { key: 'security', label: 'Bảo mật',    Icon: Shield },
  ];

  const quickLinks = [
    { to: '/ticket-history', Icon: History, label: 'Lịch sử vé',   desc: 'Tất cả đơn hàng & vé'  },
    { to: '/checkin',        Icon: QrCode,  label: 'QR Check-in',  desc: 'Mô phỏng vào sự kiện'  },
    { to: '/my-tickets',     Icon: Ticket,  label: 'Vé của tôi',   desc: 'Vé đang active'         },
  ];

  // shared card style
  const card = { background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 };

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 380, height: 380, background: 'radial-gradient(circle,rgba(249,115,22,0.04) 0%,transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 340, height: 340, background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      {/* ── HERO BANNER ── */}
      <section style={{ position: 'relative', height: 'clamp(200px,25vw,280px)', overflow: 'hidden', background: '#0a0a0a' }}>
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1800&auto=format&fit=crop&q=80" alt="cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,6,6,0.7) 0%,transparent 50%,rgba(168,85,247,0.08) 100%)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,#060606 100%)' }}/>
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, padding: '6px 14px', borderRadius: 999, fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <Sparkles style={{ width: 11, height: 11 }}/> Hồ sơ cá nhân
        </div>
      </section>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── PROFILE CARD overlapping banner ── */}
        <div style={{ ...card, padding: '24px', marginTop: -60, marginBottom: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0, marginTop: -56 }}>
              <div style={{ width: 96, height: 96, borderRadius: 18, border: '3px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: 'linear-gradient(135deg,#f97316,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <span style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>{initials}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#34d399', border: '2px solid #060606' }}/>
              {editing && (
                <>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s' }}
                    className="pp-avatar-btn">
                    <Camera style={{ width: 22, height: 22 }}/>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange}/>
                </>
              )}
            </div>

            {/* Name & meta */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.2rem,3vw,1.7rem)', fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>{user?.name}</h1>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(168,85,247,0.15))', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Award style={{ width: 10, height: 10 }}/> Member
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                  <MapPin style={{ width: 11, height: 11, color: '#f97316' }}/>{formData.location}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                  <Calendar style={{ width: 11, height: 11, color: '#a855f7' }}/>Tham gia 2025
                </span>
              </div>
            </div>

            {/* Edit/Save */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {editing ? (
                <>
                  <button onClick={handleCancel}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s' }}
                    className="pp-outline-btn">
                    <X style={{ width: 13, height: 13 }}/> Hủy
                  </button>
                  <button onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", boxShadow: '0 4px 16px rgba(249,115,22,0.25)', transition: 'all 0.2s' }}
                    className="pp-cta-btn">
                    <Save style={{ width: 13, height: 13 }}/> Lưu
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s' }}
                  className="pp-outline-btn">
                  <Edit3 style={{ width: 13, height: 13 }}/> Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Đơn hàng',    value: recentOrders.length, color: '#f97316' },
              { label: 'Vé đã mua',   value: totalTickets,        color: '#a855f7' },
              { label: 'Đã chi tiêu', value: fmtPrice(totalSpent), color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "'Space Mono',monospace", letterSpacing: '-0.02em' }}>{s.value}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif", marginTop: 3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, alignItems: 'start' }} className="pp-layout">

          {/* LEFT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quick links */}
            <div style={{ ...card, padding: '18px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 12 }}>Truy cập nhanh</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {quickLinks.map(({ to, Icon, label, desc }) => (
                  <Link key={to} to={to}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 12, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}
                    className="pp-quick-link">
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s' }} className="pp-link-icon">
                      <Icon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)' }} className="pp-link-ico"/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{label}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
                    </div>
                    <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}/>
                  </Link>
                ))}
              </div>
            </div>

            {/* Member card */}
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', padding: '20px' }}>
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80" alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }}/>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(249,115,22,0.85),rgba(168,85,247,0.85))' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Award style={{ width: 16, height: 16, color: '#fde68a' }}/>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fde68a', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Member</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 14 }}>
                  Tích lũy điểm qua mỗi vé để nhận ưu đãi độc quyền!
                </p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Tiến độ lên hạng Silver</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'white', fontFamily: "'Space Mono',monospace" }}>30%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '30%', background: 'linear-gradient(90deg,#fde68a,#fb923c)', borderRadius: 5 }}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div style={{ ...card, padding: '18px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 12 }}>Lợi ích thành viên</p>
              {[
                { Icon: Zap,        label: 'Đặt vé siêu tốc',    color: '#f97316' },
                { Icon: Shield,     label: 'Bảo mật tuyệt đối',  color: '#a855f7' },
                { Icon: BadgeCheck, label: 'Vé chính hãng 100%', color: '#3b82f6' },
              ].map(({ Icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 13, height: 13, color }}/>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: "'Be Vietnam Pro',sans-serif", fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
              className="pp-logout-btn">
              <LogOut style={{ width: 13, height: 13 }}/> Đăng xuất
            </button>
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 4, marginBottom: 18 }}>
              {tabs.map(({ key, label, Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 10, border: 'none', background: isActive ? 'linear-gradient(135deg,#f97316,#a855f7)' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s', boxShadow: isActive ? '0 4px 14px rgba(249,115,22,0.25)' : 'none' }}>
                    <Icon style={{ width: 13, height: 13 }}/>{label}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: THÔNG TIN ── */}
            {activeTab === 'info' && (
              <div style={{ ...card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Thông tin cá nhân</h3>
                  </div>
                  {!editing && (
                    <button onClick={() => setEditing(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#fb923c', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                      <Edit3 style={{ width: 11, height: 11 }}/> Sửa
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }} className="pp-field-grid">
                  <Field label="Họ và tên"    name="name"     icon={User}  value={formData.name}     onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused}/>
                  <Field label="Email"         name="email"    icon={Mail}  value={formData.email}    onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused}/>
                  <Field label="Số điện thoại" name="phone"    icon={Phone} value={formData.phone}    onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused} placeholder="Chưa cập nhật"/>
                  <Field label="Địa điểm"      name="location" icon={MapPin} value={formData.location} onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused}/>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: editing ? 16 : 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 6 }}>Giới thiệu</p>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!editing}
                    placeholder="Viết vài dòng giới thiệu..." rows={3}
                    style={{ width: '100%', padding: '12px 14px', background: !editing ? 'rgba(255,255,255,0.02)' : focused === 'bio' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)', border: !editing ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontSize: 12, color: !editing ? 'rgba(255,255,255,0.35)' : 'white', outline: 'none', resize: 'none', fontFamily: "'Be Vietnam Pro',sans-serif", lineHeight: 1.7, cursor: !editing ? 'default' : 'text', boxSizing: 'border-box' }}
                    onFocus={() => setFocused('bio')} onBlur={() => setFocused('')}/>
                </div>

                {editing && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCancel}
                      style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif" }}
                      className="pp-outline-btn">Hủy</button>
                    <button onClick={handleSave}
                      style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(249,115,22,0.25)' }}
                      className="pp-cta-btn">
                      <Check style={{ width: 13, height: 13 }}/> Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: VÉ GẦN ĐÂY ── */}
            {activeTab === 'tickets' && (
              <div style={{ ...card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Vé gần đây</h3>
                  </div>
                  <Link to="/ticket-history"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
                    Xem tất cả <ChevronRight style={{ width: 12, height: 12, color: '#a855f7' }}/>
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Ticket style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.1)' }}/>
                    </div>
                    <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 4 }}>Chưa có vé nào</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginBottom: 18, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Hãy đặt vé sự kiện đầu tiên!</p>
                    <Link to="/"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 12, fontWeight: 800, padding: '10px 20px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 4px 16px rgba(249,115,22,0.22)' }}>
                      Khám phá sự kiện <ArrowRight style={{ width: 12, height: 12 }}/>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentOrders.map(order => (
                      <div key={order._id}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, transition: 'all 0.2s' }}
                        className="pp-order-row">
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#f97316,#a855f7)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Ticket style={{ width: 17, height: 17, color: 'white' }}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                            {order.event?.title || order.event?.name || 'Sự kiện chưa rõ'}
                          </p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                            {order.tickets?.length || 0} vé · {fmtDate(order.createdAt)}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 900, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif', marginBottom: 3" }}>
                            {fmtPrice(order.totalAmount)}
                          </p>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                            <Check style={{ width: 9, height: 9 }}/> Đã xác nhận
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: BẢO MẬT ── */}
            {activeTab === 'security' && (
              <div style={{ ...card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Bảo mật tài khoản</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Đổi mật khẩu',   desc: 'Cập nhật mật khẩu của bạn',      Icon: Shield,      action: 'Đổi ngay', color: '#3b82f6', badge: null          },
                    { label: 'Xác thực 2 bước', desc: 'Bảo vệ tài khoản với OTP',        Icon: Star,        action: 'Bật',      color: '#f97316', badge: 'Khuyến nghị' },
                    { label: 'Phiên đăng nhập', desc: 'Quản lý thiết bị đang đăng nhập', Icon: TrendingUp,  action: 'Xem',      color: '#a855f7', badge: null          },
                  ].map(({ label, desc, Icon, action, color, badge }) => (
                    <div key={label}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, transition: 'all 0.2s', gap: 12 }}
                      className="pp-security-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 15, height: 15, color }}/>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{label}</p>
                            {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{badge}</span>}
                          </div>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{desc}</p>
                        </div>
                      </div>
                      <button onClick={() => toast('Tính năng đang phát triển 🚧')}
                        style={{ padding: '7px 16px', borderRadius: 999, border: `1px solid ${color}35`, background: `${color}0a`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", flexShrink: 0, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                        className="pp-sec-btn">
                        {action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        .pp-cta-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(249,115,22,0.32) !important}
        .pp-outline-btn:hover{border-color:rgba(255,255,255,0.18) !important;color:white !important}
        .pp-logout-btn:hover{background:rgba(239,68,68,0.12) !important;border-color:rgba(239,68,68,0.3) !important}
        .pp-quick-link:hover{background:rgba(249,115,22,0.06) !important;border-radius:12px}
        .pp-quick-link:hover .pp-link-icon{background:linear-gradient(135deg,#f97316,#a855f7) !important;border-color:transparent !important}
        .pp-order-row:hover{border-color:rgba(249,115,22,0.2) !important}
        .pp-security-row:hover{border-color:rgba(255,255,255,0.12) !important}
        .pp-sec-btn:hover{opacity:0.8}
        .pp-avatar-btn:hover{opacity:1 !important}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #111 inset !important;-webkit-text-fill-color:white !important}
        @media(max-width:720px){.pp-layout{grid-template-columns:1fr !important}.pp-field-grid{grid-template-columns:1fr !important}}
        *{scrollbar-width:none}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
};

export default ProfilePage;