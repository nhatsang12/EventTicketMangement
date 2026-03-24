import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  CheckCircle, Ticket, ArrowRight, XCircle, Download,
  MapPin, Mail, Shield, Zap, BadgeCheck
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import API_URL from '../config/api';
import { clearPendingOrderTrackingBatch, extractOrderId } from '../utils/pendingOrderTimeout.js';

// ─── HELPERS ──────────────────────────────────────────────────────────────
const fmtPrice = p =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const generateQRCode = data =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

const findLikelyOrder = (orders, candidates = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return null;
  const normalizedCandidates = candidates
    .filter(Boolean)
    .map(v => String(v).trim().toLowerCase());
  if (normalizedCandidates.length === 0) return orders[0];

  return (
    orders.find(o =>
      normalizedCandidates.includes(String(o?._id || '').toLowerCase()) ||
      normalizedCandidates.includes(String(o?.id || '').toLowerCase()) ||
      normalizedCandidates.includes(String(o?.orderCode || '').toLowerCase()) ||
      normalizedCandidates.includes(String(o?.code || '').toLowerCase())
    ) || orders[0]
  );
};

const normalizePaidDisplayOrder = (order, forcePaid) => {
  if (!order) return order;
  if (!forcePaid) return order;
  return {
    ...order,
    status: 'paid',
    tickets: Array.isArray(order.tickets)
      ? order.tickets.map(t => ({ ...t, status: t?.status || 'active' }))
      : order.tickets,
  };
};

// ─── LOADING ──────────────────────────────────────────────────────────────
const LoadingScreen = ({ t }) => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
    <div style={{ position: 'relative', width: 52, height: 52, marginBottom: 18 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.05)' }}/>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#f97316', borderRightColor: '#a855f7' }} className="psp-spin"/>
    </div>
    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 4 }}>{t('paymentPage.confirming')}</p>
    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{t('paymentPage.pleaseWait')}</p>
    <style>{`@keyframes psp-spin{to{transform:rotate(360deg)}}.psp-spin{animation:psp-spin 0.85s linear infinite}`}</style>
  </div>
);

// ─── ERROR ────────────────────────────────────────────────────────────────
const ErrorScreen = ({ error, navigate, t }) => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
    <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
      <div style={{ width: 72, height: 72, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
        <XCircle style={{ width: 32, height: 32, color: '#f87171' }}/>
      </div>
      <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, color: 'white', marginBottom: 10, fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>{t('paymentPage.error')}</h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28, lineHeight: 1.7, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{error || t('paymentPage.orderNotFound')}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/ticket-history')}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", boxShadow: '0 6px 24px rgba(249,115,22,0.25)' }}>
          {t('ticket.ticketHistory')}
        </button>
        <button onClick={() => navigate('/')}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
          {t('footer.home')}
        </button>
      </div>
    </div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────
const PaymentSuccessPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.accessToken || state.token);

  const [loading, setLoading]             = useState(true);
  const [order, setOrder]                 = useState(null);
  const [error, setError]                 = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('unknown');
  const [forcePaidDisplay, setForcePaidDisplay] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const payosCode = (searchParams.get('code') || '').toUpperCase();
        const payosStatus = (searchParams.get('status') || '').toUpperCase();
        const isPayosPaid = payosCode === '00' && payosStatus === 'PAID';
        if (isPayosPaid) {
          setPaymentMethod('payos');
          setForcePaidDisplay(true);

          const payosOrderId = searchParams.get('orderId') || searchParams.get('order_id');
          const payosOrderCode = searchParams.get('orderCode') || searchParams.get('order_code');
          const payosTxnId = searchParams.get('id');

          const res = await axios.get(`${API_URL}/api/orders/my-orders`, config);
          const orders = res.data?.data || res.data || [];
          const likelyOrder = findLikelyOrder(orders, [payosOrderId, payosOrderCode, payosTxnId]);
          if (likelyOrder) setOrder(normalizePaidDisplayOrder(likelyOrder, true));
          setLoading(false);
          return;
        }

        const stripeSessionId = searchParams.get('session_id');
        if (stripeSessionId) {
          setPaymentMethod('stripe');
          try {
            const verifyRes = await axios.post(
              `${API_URL}/api/payments/verify-stripe-session`,
              { session_id: stripeSessionId }, config
            );
            if (verifyRes.data?.success) { setOrder(verifyRes.data.data); }
            else throw new Error(verifyRes.data?.message || 'Xác minh thất bại');
          } catch {
            const fallback = await axios.get(`${API_URL}/api/orders/my-orders`, config);
            const orders = fallback.data?.data || fallback.data || [];
            if (orders[0]) setOrder(orders[0]);
            else throw new Error('Không tìm thấy đơn hàng');
          }
          setLoading(false);
          return;
        }
        throw new Error('Không tìm thấy thông tin thanh toán');
      } catch (err) {
        setError(err.message || 'Đã có lỗi xảy ra');
        setLoading(false);
      }
    })();
  }, [searchParams, token]);

  useEffect(() => {
    if (!order) return;
    const idsToClear = [
      extractOrderId(order),
      order?.orderId,
      order?.orderCode,
      searchParams.get('orderId'),
      searchParams.get('order_id'),
      searchParams.get('orderCode'),
      searchParams.get('order_code'),
      searchParams.get('id'),
    ];
    clearPendingOrderTrackingBatch(idsToClear);
  }, [order, searchParams]);

  const downloadQR = (url, id) => {
    const a = document.createElement('a');
    a.href = url; a.download = `ticket-${id}.png`; a.click();
  };

  if (loading) return <LoadingScreen t={t} />;
  if (error || !order) return <ErrorScreen error={error} navigate={navigate} t={t} />;

  const displayOrderStatus = forcePaidDisplay ? 'paid' : order.status;

  const paymentLabel = paymentMethod === 'payos'
    ? { text: 'Thanh toán qua PayOS thành công', color: '#34d399' }
    : { text: 'Thanh toán qua Stripe thành công', color: '#60a5fa' };

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse,rgba(16,185,129,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', top: -80, right: -80, width: 380, height: 380, background: 'radial-gradient(circle,rgba(249,115,22,0.04) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <CheckCircle style={{ width: 32, height: 32, color: '#34d399' }}/>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 900, color: 'white', marginBottom: 8, fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>Đặt vé thành công!</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 6 }}>
            Mã đơn hàng: <span style={{ fontFamily: "'Space Mono',monospace", color: '#fb923c', fontWeight: 700 }}>#{order._id?.slice(-8).toUpperCase()}</span>
          </p>
          {paymentMethod !== 'unknown' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: paymentLabel.color, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
              ✓ {paymentLabel.text}
            </span>
          )}
        </div>

        {/* Order summary card */}
        <div style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Thông tin đơn hàng</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Sự kiện',    value: order.event?.title || order.event?.name },
              { label: 'Địa điểm',  value: order.event?.location },
              { label: 'Số lượng vé', value: `${order.tickets?.length || 0} vé` },
            ].map((row, i) => row.value && (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif", flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: "'Be Vietnam Pro',sans-serif", textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, marginTop: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Tổng tiền</span>
              <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>
                {fmtPrice(order.totalAmount)}
              </span>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Trạng thái</span>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: displayOrderStatus === 'paid' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: displayOrderStatus === 'paid' ? '#34d399' : '#fbbf24', border: `1px solid ${displayOrderStatus === 'paid' ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`, fontFamily: "'Be Vietnam Pro',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {displayOrderStatus === 'paid' ? 'Đã thanh toán' : 'Đang xử lý'}
              </span>
            </div>
          </div>

          {/* Pending warning */}
          {displayOrderStatus === 'pending' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 4 }}>⏳ Đơn hàng đang chờ xác nhận</p>
              <p style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', fontFamily: "'Be Vietnam Pro',sans-serif", lineHeight: 1.6 }}>
                Thanh toán đã thành công nhưng hệ thống đang cập nhật. Vui lòng kiểm tra lại sau vài phút.
              </p>
            </div>
          )}
        </div>

        {/* Ticket cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>Vé của bạn ({order.tickets?.length || 0})</h2>
          </div>

          {order.tickets?.map((ticket, idx) => (
            <div key={ticket._id || idx} style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {/* Gradient header */}
              <div style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>E-Ticket #{idx + 1}</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif" }}>{order.event?.title || order.event?.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>Loại vé</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{ticket.ticketType?.name || 'Standard'}</p>
                </div>
              </div>

              {/* Tear line */}
              <div style={{ height: 1, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.08) 0,rgba(255,255,255,0.08) 8px,transparent 8px,transparent 16px)' }}/>

              {/* Body */}
              <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Địa điểm', value: order.event?.location },
                    { label: 'Email',    value: order.customerInfo?.email || 'N/A' },
                    { label: 'Ticket ID',value: ticket._id?.slice(-12), mono: true },
                  ].map((row, j) => row.value && (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif", minWidth: 58, fontWeight: 700 }}>{row.label}</span>
                      <span style={{ fontSize: row.mono ? 10 : 12, color: 'rgba(255,255,255,0.7)', fontFamily: row.mono ? "'Space Mono',monospace" : "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                    </div>
                  ))}
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', width: 'fit-content', fontFamily: "'Be Vietnam Pro',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ✓ {ticket.status === 'active' ? 'Active' : (ticket.status || 'Active')}
                  </span>
                </div>

                {/* QR */}
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ background: 'white', borderRadius: 12, padding: 6, display: 'inline-block', boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}>
                    <img src={generateQRCode(ticket.qrCode || ticket._id)} alt="QR" style={{ width: 100, height: 100, display: 'block', borderRadius: 7 }}/>
                  </div>
                  <button onClick={() => downloadQR(generateQRCode(ticket.qrCode || ticket._id), ticket._id)}
                    style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#fb923c', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", margin: '6px auto 0' }}
                    className="psp-dl-btn">
                    <Download style={{ width: 10, height: 10 }}/> Tải QR
                  </button>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'Be Vietnam Pro',sans-serif", marginTop: 2 }}>Quét check-in</p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Giá: <span style={{ fontWeight: 800, color: '#fb923c' }}>{fmtPrice(ticket.price || ticket.ticketType?.price)}</span></span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono',monospace" }}>{new Date(ticket.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { icon: Shield,    color: '#10b981', text: 'Thanh toán bảo mật' },
            { icon: BadgeCheck,color: '#a855f7', text: 'Vé chính hãng'      },
            { icon: Zap,       color: '#f97316', text: 'Kích hoạt tức thì'  },
          ].map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
              <b.icon style={{ width: 12, height: 12, color: b.color }}/>{b.text}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/ticket-history')}
            style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 6px 24px rgba(249,115,22,0.25)', transition: 'all 0.2s' }}
            className="psp-cta-btn">
            <Ticket style={{ width: 14, height: 14 }}/> Xem tất cả vé <ArrowRight style={{ width: 13, height: 13 }}/>
          </button>
          <button onClick={() => navigate('/')}
            style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s' }}
            className="psp-outline-btn">
            Về trang chủ
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');
        @keyframes psp-spin{to{transform:rotate(360deg)}}.psp-spin{animation:psp-spin 0.85s linear infinite}
        .psp-cta-btn:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(249,115,22,0.36) !important}
        .psp-outline-btn:hover{border-color:rgba(249,115,22,0.25) !important;color:white !important}
        .psp-dl-btn:hover{opacity:0.75}
        *{scrollbar-width:none}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
};

export default PaymentSuccessPage;
