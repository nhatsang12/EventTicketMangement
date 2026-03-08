import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Save, X,
  Ticket, History, QrCode, LogOut, Camera, Shield,
  TrendingUp, Star, Award, ChevronRight, ChevronDown, Check, Sparkles,
  ArrowRight, BadgeCheck, Zap
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import API_URL from '../config/api';
// ─── HELPERS ──────────────────────────────────────────────────────────────
const fmtPrice = p =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const fmtDate = iso =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── INPUT ────────────────────────────────────────────────────────────────
const Field = ({ label, name, type = 'text', value, onChange, disabled, placeholder, icon: Icon, focused, onFocus, onBlur }) => {
  const isActive = focused === name;
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 8 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: isActive ? '#f97316' : 'rgba(255,255,255,0.22)', transition: 'color 0.2s', zIndex: 1, pointerEvents: 'none' }}/>}
        <input type={type} name={name} value={value} onChange={onChange}
          onFocus={() => onFocus?.(name)} onBlur={() => onBlur?.('')}
          disabled={disabled} placeholder={placeholder || label}
          style={{
            width: '100%', padding: `13px 13px 13px ${Icon ? '40px' : '14px'}`,
            background: disabled ? 'rgba(255,255,255,0.02)' : isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
            border: disabled ? '1px solid rgba(255,255,255,0.05)' : isActive ? '1px solid rgba(249,115,22,0.45)' : '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12, fontSize: 13, color: disabled ? 'rgba(255,255,255,0.38)' : 'white', outline: 'none',
            transition: 'all 0.2s', fontFamily: "'Be Vietnam Pro',sans-serif",
            boxShadow: isActive ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
            boxSizing: 'border-box', cursor: disabled ? 'default' : 'text',
          }}
        />
      </div>
    </div>
  );
};

// ─── ACCORDION ROW ────────────────────────────────────────────────────────
const OrderAccordion = ({ order }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }} className="pp-order-acc">
      {/* Header — always visible */}
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.18s' }}
        className="pp-acc-header">
        {/* Ticket icon */}
        <div style={{ width: 44, height: 44, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ticket style={{ width: 18, height: 18, color: '#f97316' }}/>
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {order.event?.title || order.event?.name || 'Sự kiện chưa rõ'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            {order.tickets?.length || 0} vé &nbsp;·&nbsp; {fmtDate(order.createdAt)}
          </p>
        </div>
        {/* Price */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: 'white', fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>{fmtPrice(order.totalAmount)}</p>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Check style={{ width: 9, height: 9 }}/> Đã xác nhận
          </span>
        </div>
        {/* Chevron */}
        <ChevronDown style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.3)', flexShrink: 0, transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
      </button>

      {/* Expanded tickets */}
      {open && (
        <div style={{ padding: '0 18px 16px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {order.tickets?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14 }}>
              {order.tickets.map((t, i) => (
                <div key={t._id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 2 }}>{t.ticketType?.name || `Vé #${i + 1}`}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: "'Space Mono',monospace" }}>{t._id || t.id}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#fb923c', fontFamily: "'Space Mono',monospace", marginBottom: 3 }}>{fmtPrice(t.price || t.ticketType?.price)}</p>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '1px 7px', borderRadius: 999 }}>Active</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ paddingTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Không có thông tin vé chi tiết.</p>
          )}
        </div>
      )}
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
  const [showAllOrders, setShowAllOrders] = useState(false);

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
        const res = await axios.get(`${API_URL}/api/orders/my-orders`, config);
        let orders = res.data?.data || res.data || [];
        orders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  const PREVIEW_COUNT = 3;
  const displayedOrders = showAllOrders ? recentOrders : recentOrders.slice(0, PREVIEW_COUNT);

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

  const BENEFITS = [
    { Icon: Zap,        label: 'Đặt vé siêu tốc',    desc: '3 bước dưới 2 phút',              color: '#f97316' },
    { Icon: Shield,     label: 'Bảo mật tuyệt đối',  desc: 'Cổng thanh toán PCI-DSS',         color: '#a855f7' },
    { Icon: BadgeCheck, label: 'Vé chính hãng 100%', desc: 'Mã QR độc nhất, chống giả',       color: '#3b82f6' },
  ];

  const card = { background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 };

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>
      <div style={{ position: 'fixed', top: -80, right: -80, width: 380, height: 380, background: 'radial-gradient(circle,rgba(249,115,22,0.04) 0%,transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 340, height: 340, background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      {/* ── HERO BANNER ── */}
      <section style={{ position: 'relative', height: 'clamp(200px,25vw,280px)', overflow: 'hidden', background: '#0a0a0a' }}>
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1800&auto=format&fit=crop&q=80" alt="cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22 }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,6,6,0.7) 0%,transparent 60%,rgba(168,85,247,0.06) 100%)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,#060606 100%)' }}/>
        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, padding: '6px 14px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <Sparkles style={{ width: 10, height: 10 }}/> Hồ sơ cá nhân
        </div>
      </section>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── PROFILE CARD ── */}
        <div style={{ ...card, padding: '28px 30px', marginTop: -64, marginBottom: 28, boxShadow: '0 28px 72px rgba(0,0,0,0.65)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, marginBottom: 28, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0, marginTop: -60 }}>
              <div style={{ width: 100, height: 100, borderRadius: 22, border: '3px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: 'linear-gradient(135deg,#f97316,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <span style={{ fontSize: 34, fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>{initials}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 15, height: 15, borderRadius: '50%', background: '#34d399', border: '2.5px solid #060606' }}/>
              {editing && (
                <>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s' }}
                    className="pp-avatar-btn">
                    <Camera style={{ width: 24, height: 24 }}/>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange}/>
                </>
              )}
            </div>

            {/* Name & meta */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.025em' }}>{user?.name}</h1>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.22)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Award style={{ width: 10, height: 10 }}/> Member
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', marginBottom: 10 }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin style={{ width: 12, height: 12, color: '#f97316' }}/>{formData.location}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar style={{ width: 12, height: 12, color: '#a855f7' }}/>Tham gia 2025
                </span>
              </div>
            </div>

            {/* Edit/Save */}
            <div style={{ display: 'flex', gap: 9, flexShrink: 0 }}>
              {editing ? (
                <>
                  <button onClick={handleCancel}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    className="pp-outline-btn">
                    <X style={{ width: 13, height: 13 }}/> Hủy
                  </button>
                  <button onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 18px rgba(249,115,22,0.28)', transition: 'all 0.2s' }}
                    className="pp-cta-btn">
                    <Save style={{ width: 13, height: 13 }}/> Lưu
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  className="pp-outline-btn">
                  <Edit3 style={{ width: 13, height: 13 }}/> Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'Đơn hàng',    value: recentOrders.length, color: '#f97316' },
              { label: 'Vé đã mua',   value: totalTickets,        color: '#a855f7' },
              { label: 'Đã chi tiêu', value: fmtPrice(totalSpent), color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: "'Space Mono',monospace", letterSpacing: '-0.02em', marginBottom: 5 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: 22, alignItems: 'start' }} className="pp-layout">

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Quick links */}
            <div style={{ ...card, padding: '22px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Truy cập nhanh</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {quickLinks.map(({ to, Icon, label, desc }) => (
                  <Link key={to} to={to}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 13, textDecoration: 'none', transition: 'all 0.2s' }}
                    className="pp-quick-link">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s' }} className="pp-link-icon">
                      <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.78)', marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
                    </div>
                    <ChevronRight style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.18)', flexShrink: 0 }}/>
                  </Link>
                ))}
              </div>
            </div>

            {/* Member progress card */}
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', padding: '24px 22px' }}>
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80" alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }}/>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(249,115,22,0.88),rgba(168,85,247,0.88))' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Award style={{ width: 18, height: 18, color: '#fde68a' }}/>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fde68a' }}>Member</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, marginBottom: 18 }}>
                  Tích lũy điểm qua mỗi vé để nhận ưu đãi độc quyền!
                </p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>Tiến độ lên hạng Silver</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'white', fontFamily: "'Space Mono',monospace" }}>30%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '30%', background: 'linear-gradient(90deg,#fde68a,#fb923c)', borderRadius: 6 }}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits — bigger text, more spacing */}
            <div style={{ ...card, padding: '22px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Lợi ích thành viên</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {BENEFITS.map(({ Icon, label, desc, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon style={{ width: 15, height: 15, color }}/>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.82)', marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ width: '100%', padding: '13px', borderRadius: 13, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
              className="pp-logout-btn">
              <LogOut style={{ width: 14, height: 14 }}/> Đăng xuất
            </button>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 5, marginBottom: 20 }}>
              {tabs.map(({ key, label, Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 8px', borderRadius: 12, border: 'none', background: isActive ? 'linear-gradient(135deg,#f97316,#a855f7)' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 4px 16px rgba(249,115,22,0.28)' : 'none' }}>
                    <Icon style={{ width: 14, height: 14 }}/>{label}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: THÔNG TIN ── */}
            {activeTab === 'info' && (
              <div style={{ ...card, padding: '26px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Thông tin cá nhân</h3>
                  </div>
                  {!editing && (
                    <button onClick={() => setEditing(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#fb923c', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      <Edit3 style={{ width: 12, height: 12 }}/> Sửa
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="pp-field-grid">
                  <Field label="Họ và tên"    name="name"     icon={User}  value={formData.name}     onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused}/>
                  <Field label="Email"         name="email"    icon={Mail}  value={formData.email}    onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused}/>
                  <Field label="Số điện thoại" name="phone"    icon={Phone} value={formData.phone}    onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused} placeholder="Chưa cập nhật"/>
                  <Field label="Địa điểm"      name="location" icon={MapPin} value={formData.location} onChange={handleChange} disabled={!editing} focused={focused} onFocus={setFocused} onBlur={setFocused}/>
                </div>

                <div style={{ marginBottom: editing ? 20 : 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Giới thiệu</p>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!editing}
                    placeholder="Viết vài dòng giới thiệu..." rows={3}
                    style={{ width: '100%', padding: '13px 14px', background: !editing ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: !editing ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.09)', borderRadius: 12, fontSize: 13, color: !editing ? 'rgba(255,255,255,0.35)' : 'white', outline: 'none', resize: 'none', fontFamily: "'Be Vietnam Pro',sans-serif", lineHeight: 1.7, cursor: !editing ? 'default' : 'text', boxSizing: 'border-box' }}
                    onFocus={() => setFocused('bio')} onBlur={() => setFocused('')}/>
                </div>

                {editing && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCancel}
                      style={{ flex: 1, padding: '12px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      className="pp-outline-btn">Hủy</button>
                    <button onClick={handleSave}
                      style={{ flex: 1, padding: '12px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 16px rgba(249,115,22,0.25)' }}
                      className="pp-cta-btn">
                      <Check style={{ width: 14, height: 14 }}/> Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: VÉ GẦN ĐÂY (accordion) ── */}
            {activeTab === 'tickets' && (
              <div style={{ ...card, padding: '26px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Vé gần đây</h3>
                    {recentOrders.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)', fontFamily: "'Space Mono',monospace" }}>
                        {recentOrders.length}
                      </span>
                    )}
                  </div>
                  <Link to="/ticket-history"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textDecoration: 'none', transition: 'color 0.2s' }}
                    className="pp-all-link">
                    Xem tất cả <ChevronRight style={{ width: 12, height: 12 }}/>
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                    <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Ticket style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.1)' }}/>
                    </div>
                    <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 6 }}>Chưa có vé nào</p>
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, marginBottom: 22, lineHeight: 1.6 }}>Hãy đặt vé sự kiện đầu tiên!</p>
                    <Link to="/"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, padding: '11px 24px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 4px 18px rgba(249,115,22,0.25)' }}>
                      Khám phá sự kiện <ArrowRight style={{ width: 13, height: 13 }}/>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {displayedOrders.map(order => (
                        <OrderAccordion key={order._id} order={order}/>
                      ))}
                    </div>

                    {recentOrders.length > PREVIEW_COUNT && (
                      <button onClick={() => setShowAllOrders(v => !v)}
                        style={{ width: '100%', marginTop: 14, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                        className="pp-outline-btn">
                        <ChevronDown style={{ width: 13, height: 13, transition: 'transform 0.2s', transform: showAllOrders ? 'rotate(180deg)' : 'none' }}/>
                        {showAllOrders ? 'Thu gọn' : `Xem thêm ${recentOrders.length - PREVIEW_COUNT} đơn hàng`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB: BẢO MẬT ── */}
            {activeTab === 'security' && (
              <div style={{ ...card, padding: '26px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Bảo mật tài khoản</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Đổi mật khẩu',   desc: 'Cập nhật mật khẩu của bạn',      Icon: Shield,     action: 'Đổi ngay', color: '#3b82f6', badge: null           },
                    { label: 'Xác thực 2 bước', desc: 'Bảo vệ tài khoản với OTP',        Icon: Star,       action: 'Bật',      color: '#f97316', badge: 'Khuyến nghị'  },
                    { label: 'Phiên đăng nhập', desc: 'Quản lý thiết bị đang đăng nhập', Icon: TrendingUp, action: 'Xem',      color: '#a855f7', badge: null           },
                  ].map(({ label, desc, Icon, action, color, badge }) => (
                    <div key={label}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, gap: 14, transition: 'all 0.2s' }}
                      className="pp-security-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 16, height: 16, color }}/>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{label}</p>
                            {badge && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}>{badge}</span>}
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>{desc}</p>
                        </div>
                      </div>
                      <button onClick={() => toast('Tính năng đang phát triển 🚧')}
                        style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${color}35`, background: `${color}08`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
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

        .pp-cta-btn:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(249,115,22,0.35) !important; }
        .pp-outline-btn:hover { border-color:rgba(255,255,255,0.18) !important; color:white !important; }
        .pp-logout-btn:hover { background:rgba(239,68,68,0.12) !important; border-color:rgba(239,68,68,0.3) !important; }
        .pp-quick-link:hover { background:rgba(249,115,22,0.06) !important; }
        .pp-quick-link:hover .pp-link-icon { background:linear-gradient(135deg,#f97316,#a855f7) !important; border-color:transparent !important; }
        .pp-security-row:hover { border-color:rgba(255,255,255,0.12) !important; }
        .pp-sec-btn:hover { opacity:0.78; }
        .pp-avatar-btn:hover { opacity:1 !important; }
        .pp-order-acc:hover { border-color:rgba(249,115,22,0.2) !important; }
        .pp-acc-header:hover { background:rgba(255,255,255,0.05) !important; }
        .pp-all-link:hover { color:rgba(255,255,255,0.65) !important; }

        input::placeholder, textarea::placeholder { color:rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #111 inset !important; -webkit-text-fill-color:white !important; }

        @media (max-width:720px) {
          .pp-layout { grid-template-columns:1fr !important; }
          .pp-field-grid { grid-template-columns:1fr !important; }
        }
        * { scrollbar-width:none; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
};

export default ProfilePage;