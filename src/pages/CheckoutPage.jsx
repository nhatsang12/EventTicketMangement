import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import {
  ShoppingCart, Trash2, CreditCard, CheckCircle, Lock,
  ArrowLeft, ArrowRight, Ticket, MapPin, User,
  Mail, Phone, Shield, BadgeCheck, Zap, Building2, Smartphone,
  ChevronRight, Sparkles, XCircle
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const fmtPrice = p =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const generateQRCode = data =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

// ─── SOLD OUT MODAL ───────────────────────────────────────────────────────
const SoldOutModal = ({ message, onClose, onGoHome }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    fontFamily: "'Be Vietnam Pro',sans-serif",
    animation: 'fadeIn 0.2s ease',
  }}>
    <div style={{
      background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 24, padding: '36px 28px',
      maxWidth: 400, width: '100%',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.08)',
      textAlign: 'center',
      animation: 'slideUp 0.25s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: 68, height: 68,
        background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
        border: '1px solid rgba(239,68,68,0.25)', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <XCircle style={{ width: 32, height: 32, color: '#f87171' }}/>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 10,
        fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em',
      }}>
        Rất tiếc, vé đã hết!
      </h3>

      {/* Message */}
      <p style={{
        fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
        marginBottom: 8, fontFamily: "'Be Vietnam Pro',sans-serif",
      }}>
        {message}
      </p>

      <p style={{
        fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6,
        marginBottom: 28, fontFamily: "'Be Vietnam Pro',sans-serif",
      }}>
        Có người vừa hoàn tất thanh toán trước bạn. Vui lòng thử loại vé khác hoặc quay lại sau.
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }}/>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onGoHome}
          style={{
            flex: 1, padding: '12px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif",
            transition: 'all 0.2s',
          }}
          className="ckp-outline-btn"
        >
          Về trang chủ
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: '12px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#ef4444,#f97316)',
            color: 'white', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif",
            boxShadow: '0 4px 18px rgba(239,68,68,0.3)',
            transition: 'all 0.2s',
          }}
          className="ckp-cta-btn"
        >
          Chọn vé khác
        </button>
      </div>
    </div>
  </div>
);

// ─── STEP INDICATOR ───────────────────────────────────────────────────────
const StepBar = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
    {[['1', 'Thông tin'], ['2', 'Thanh toán'], ['3', 'Hoàn tất']].map(([num, label], i) => {
      const done = step > i + 1;
      const active = step === i + 1;
      return (
        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700,
              background: done ? 'rgba(16,185,129,0.15)' : active ? 'linear-gradient(135deg,#f97316,#a855f7)' : 'rgba(255,255,255,0.05)',
              color: done ? '#34d399' : active ? 'white' : 'rgba(255,255,255,0.2)',
              border: done ? '1px solid rgba(52,211,153,0.3)' : active ? 'none' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: active ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
              transition: 'all 0.3s',
            }}>
              {done ? '✓' : num}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Be Vietnam Pro',sans-serif", color: active ? 'white' : done ? '#34d399' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
          {i < 2 && (
            <div style={{ width: 64, height: 1, background: step > i + 1 ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.07)', margin: '0 8px', marginBottom: 20, transition: 'background 0.4s' }}/>
          )}
        </div>
      );
    })}
  </div>
);

// ─── EMPTY CART ───────────────────────────────────────────────────────────
const EmptyCart = ({ navigate }) => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
    <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
      <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
        <ShoppingCart style={{ width: 30, height: 30, color: 'rgba(255,255,255,0.15)' }}/>
      </div>
      <h2 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, color: 'white', marginBottom: 10, fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>Giỏ hàng trống</h2>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28, lineHeight: 1.7, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Hãy chọn sự kiện và thêm vé vào giỏ nhé!</p>
      <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, padding: '12px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", boxShadow: '0 6px 24px rgba(249,115,22,0.28)' }}>
        Khám phá sự kiện <ArrowRight style={{ width: 14, height: 14 }}/>
      </button>
    </div>
  </div>
);

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────
const SuccessScreen = ({ orderResponse, formData, event, navigate }) => (
  <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", padding: '60px 24px' }}>
    <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 70%)', pointerEvents: 'none' }}/>
    <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#34d399' }}/>
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 900, color: 'white', marginBottom: 8, fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>Đặt vé thành công!</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
          Mã đơn hàng: <span style={{ fontFamily: "'Space Mono',monospace", color: '#fb923c', fontWeight: 700 }}>{orderResponse._id || orderResponse.id}</span>
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        {orderResponse.tickets?.map((ticket, idx) => (
          <div key={ticket._id || idx} style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>E-Ticket #{idx + 1}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>{orderResponse.event?.title || event?.title}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>Loại vé</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{ticket.ticketType?.name}</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.08) 0,rgba(255,255,255,0.08) 8px,transparent 8px,transparent 16px)' }}/>
            <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Địa điểm', value: orderResponse.event?.location || event?.location },
                  { label: 'Email', value: orderResponse.customerInfo?.email || formData.email },
                  { label: 'Ticket ID', value: ticket._id || ticket.id, mono: true },
                ].map((row, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif", minWidth: 58, fontWeight: 700 }}>{row.label}</span>
                    <span style={{ fontSize: row.mono ? 10 : 12, color: 'rgba(255,255,255,0.7)', fontFamily: row.mono ? "'Space Mono',monospace" : "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                  </div>
                ))}
                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', width: 'fit-content', fontFamily: "'Be Vietnam Pro',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Active</span>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 6, display: 'inline-block' }}>
                  <img src={generateQRCode(ticket.qrCode || ticket._id)} alt="QR" style={{ width: 88, height: 88, display: 'block', borderRadius: 6 }}/>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 6, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Quét check-in</p>
              </div>
            </div>
            <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Giá: <span style={{ fontWeight: 800, color: '#fb923c' }}>{fmtPrice(ticket.price || ticket.ticketType?.price)}</span></span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono',monospace" }}>{new Date(orderResponse.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/ticket-history')}
          style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s' }}
          className="ckp-outline-btn">
          Lịch sử vé
        </button>
        <button onClick={() => navigate('/')}
          style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", boxShadow: '0 6px 24px rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
          className="ckp-cta-btn">
          Về trang chủ <ArrowRight style={{ width: 14, height: 14 }}/>
        </button>
      </div>
    </div>
  </div>
);

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);
  const { items, event, clearCart, removeItem, getTotalPrice } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [orderResponse, setOrderResponse] = useState(null);
  const [focused, setFocused] = useState('');
  const [soldOutMsg, setSoldOutMsg] = useState(''); // ← THÊM

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    paymentMethod: 'credit_card',
  });

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { state: { from: '/checkout' } });
  }, [isAuthenticated, navigate]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckout = async e => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Giỏ hàng trống'); return; }
    try {
      setLoading(true);
      const payload = {
        eventId: event._id || event.id,
        tickets: items.map(item => ({ ticketTypeId: item.ticketType._id, quantity: item.quantity })),
        customerInfo: { fullName: formData.fullName, email: formData.email, phone: formData.phone },
        paymentMethod: formData.paymentMethod,
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_URL}/api/orders/buy`, payload, config);
      const orderData = res.data?.data || res.data;
      const orderId = orderData._id || orderData.id;
      if (!orderId) { toast.error('Không lấy được mã đơn hàng'); setLoading(false); return; }

      if (formData.paymentMethod === 'credit_card') {
        toast.loading('Đang chuyển hướng đến Stripe...');
        const stripeRes = await axios.post(`${API_URL}/api/payments/create-checkout-session`, { orderId }, config);
        if (stripeRes.data?.url) {
          clearCart();
          window.location.href = stripeRes.data.url;
          return;
        }
      }
      if (formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'e_wallet') {
        toast.loading('Đang khởi tạo mã QR...');
        const payosRes = await axios.post(`${API_URL}/api/payments/create-payos-link`, { orderId }, config);
        if (payosRes.data?.url) {
          clearCart();
          window.location.href = payosRes.data.url;
          return;
        }
      }
      setOrderResponse(orderData);
      clearCart();
      setStep(3);
      toast.success('Đơn hàng đã được ghi nhận!');
    } catch (err) {
      toast.dismiss();
      const msg = err.response?.data?.message || 'Không thể khởi tạo thanh toán, vui lòng thử lại';

      // ← HIỆN MODAL NẾU HẾT VÉ
      if (msg.includes('hết') || msg.includes('không đủ')) {
        setSoldOutMsg(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = field => ({
    width: '100%', padding: '13px 13px 13px 42px',
    background: focused === field ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
    border: focused === field ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, fontSize: 13, color: 'white', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Be Vietnam Pro',sans-serif",
    boxShadow: focused === field ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
    boxSizing: 'border-box',
  });

  if (step === 3 && orderResponse) return <SuccessScreen orderResponse={orderResponse} formData={formData} event={event} navigate={navigate}/>;
  if (items.length === 0) return <EmptyCart navigate={navigate}/>;

  const total = getTotalPrice();

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>

      {/* ─── SOLD OUT MODAL ─── */}
      {soldOutMsg && (
        <SoldOutModal
          message={soldOutMsg}
          onClose={() => { setSoldOutMsg(''); navigate(-1); }}
          onGoHome={() => { setSoldOutMsg(''); navigate('/'); }}
        />
      )}

      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle,rgba(249,115,22,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 350, height: 350, background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '52px 24px 80px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 32, padding: 0, fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'color 0.2s' }}
          className="ckp-back-btn">
          <ArrowLeft style={{ width: 14, height: 14 }}/> Quay lại
        </button>

        <StepBar step={step}/>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }} className="ckp-layout">

          {/* ─── LEFT ─── */}
          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Order summary */}
            <div style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Thông tin đơn hàng</h2>
              </div>
              <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {event && (
                  <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>{event.title || event.name}</p>
                    {event.location && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Be Vietnam Pro',sans-serif" }}><MapPin style={{ width: 10, height: 10, color: '#a855f7' }}/>{event.location}</p>}
                  </div>
                )}
                {items.map(item => (
                  <div key={item.ticketType._id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ticket style={{ width: 13, height: 13, color: '#f97316' }}/>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ticketType.name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Space Mono',monospace" }}>{fmtPrice(item.ticketType.price)} × {item.quantity}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>{fmtPrice(item.ticketType.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.ticketType._id)}
                        style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        className="ckp-del-btn">
                        <Trash2 style={{ width: 12, height: 12 }}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer info */}
            <div style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Thông tin người đặt</h3>
              </div>
              <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: focused === 'fullName' ? '#f97316' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s', zIndex: 1 }}/>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    onFocus={() => setFocused('fullName')} onBlur={() => setFocused('')}
                    required placeholder="Họ và tên" style={inputStyle('fullName')}/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="ckp-email-phone">
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: focused === 'email' ? '#f97316' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s', zIndex: 1 }}/>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                      required placeholder="Email" style={inputStyle('email')}/>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: focused === 'phone' ? '#a855f7' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s', zIndex: 1 }}/>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      onFocus={() => setFocused('phone')} onBlur={() => setFocused('')}
                      required placeholder="Số điện thoại"
                      style={{ ...inputStyle('phone'), border: focused === 'phone' ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.09)', boxShadow: focused === 'phone' ? '0 0 0 3px rgba(168,85,247,0.1)' : 'none' }}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Phương thức thanh toán</h3>
                <Lock style={{ width: 12, height: 12, color: '#34d399', marginLeft: 2 }}/>
              </div>
              <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { value: 'credit_card',   Icon: CreditCard,  label: 'Thẻ tín dụng',         sub: 'Visa, Mastercard qua Stripe',  accent: '#f97316' },
                  { value: 'bank_transfer', Icon: Building2,   label: 'Chuyển khoản / VietQR', sub: 'Tự động kích hoạt qua PayOS', accent: '#3b82f6' },
                  { value: 'e_wallet',      Icon: Smartphone,  label: 'Ví MoMo',               sub: 'Thanh toán nhanh qua PayOS',  accent: '#ec4899' },
                ].map(opt => {
                  const active = formData.paymentMethod === opt.value;
                  return (
                    <label key={opt.value}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: active ? `1px solid ${opt.accent}50` : '1px solid rgba(255,255,255,0.07)', background: active ? `${opt.accent}0a` : 'rgba(255,255,255,0.025)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? `0 0 0 1px ${opt.accent}20` : 'none' }}>
                      <input type="radio" name="paymentMethod" value={opt.value} checked={active} onChange={handleChange} style={{ display: 'none' }}/>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: active ? `2px solid ${opt.accent}` : '2px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.accent }}/>}
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${opt.accent}14`, border: `1px solid ${opt.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <opt.Icon style={{ width: 15, height: 15, color: opt.accent }}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 2 }}>{opt.label}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{opt.sub}</p>
                      </div>
                      {active && <ChevronRight style={{ width: 14, height: 14, color: opt.accent, flexShrink: 0 }}/>}
                    </label>
                  );
                })}
                {(formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'e_wallet') && (
                  <div style={{ marginTop: 4, padding: '12px 14px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Sparkles style={{ width: 13, height: 13, color: '#60a5fa', flexShrink: 0, marginTop: 1 }}/>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: "'Be Vietnam Pro',sans-serif", lineHeight: 1.6 }}>
                      Hệ thống sẽ chuyển bạn sang cổng <span style={{ color: '#93c5fd', fontWeight: 700 }}>PayOS</span> để quét mã QR. Vé sẽ được <span style={{ color: '#93c5fd', fontWeight: 700 }}>kích hoạt tự động</span> ngay sau khi thanh toán thành công.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'all 0.25s', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#f97316,#a855f7)', boxShadow: loading ? 'none' : '0 6px 28px rgba(249,115,22,0.28)', opacity: loading ? 0.7 : 1 }}
              className="ckp-cta-btn">
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} className="ckp-spin"/> Đang xử lý...</>
                : <><CreditCard style={{ width: 16, height: 16 }}/> Xác nhận thanh toán <ArrowRight style={{ width: 15, height: 15 }}/></>}
            </button>
          </form>

          {/* ─── RIGHT ─── */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: 'linear-gradient(180deg,#1c1c1e 0%,#171719 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Tổng đơn hàng</h3>
              </div>
              <div style={{ padding: '16px 22px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Tạm tính</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: "'Space Mono',monospace" }}>{fmtPrice(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Phí dịch vụ</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Miễn phí</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 12, padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: "'Be Vietnam Pro',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tổng cộng</span>
                  <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.01em' }}>{fmtPrice(total)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 6 }}>
                  {[
                    { icon: Shield,     color: '#10b981', text: 'Thanh toán bảo mật PCI-DSS' },
                    { icon: BadgeCheck, color: '#a855f7', text: 'Vé chính hãng, QR độc nhất' },
                    { icon: Zap,        color: '#f97316', text: 'Nhận vé ngay sau thanh toán' },
                  ].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b.icon style={{ width: 12, height: 12, color: b.color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{b.text}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center', fontFamily: "'Be Vietnam Pro',sans-serif", lineHeight: 1.6, paddingTop: 4 }}>
                  Bằng cách thanh toán, bạn đồng ý với điều khoản dịch vụ của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        @keyframes ckp-spin { to { transform:rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }

        .ckp-spin { animation: ckp-spin 0.85s linear infinite; }
        .ckp-back-btn:hover { color:white !important; }
        .ckp-cta-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 36px rgba(249,115,22,0.38) !important; }
        .ckp-cta-btn:active:not(:disabled) { transform:translateY(0); }
        .ckp-outline-btn:hover { border-color:rgba(249,115,22,0.3) !important; color:white !important; }
        .ckp-del-btn:hover { background:rgba(239,68,68,0.18) !important; border-color:rgba(239,68,68,0.35) !important; }

        input::placeholder { color:rgba(255,255,255,0.25); }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #111 inset !important; -webkit-text-fill-color:white !important; }

        @media (max-width:720px) {
          .ckp-layout { grid-template-columns:1fr !important; }
          .ckp-email-phone { grid-template-columns:1fr !important; }
        }
        * { scrollbar-width:none; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
};

export default CheckoutPage;