import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Ticket, Calendar, MapPin, QrCode, ChevronDown, ChevronUp,
  ShoppingBag, ArrowLeft, CheckCircle2, ArrowRight, XCircle, Clock, Search
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import API_URL from '../config/api';
// ─── HELPERS ──────────────────────────────────────────────────────────────
const fmtPrice = p =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const fmtDate = iso => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getQRCodeImage = qr => {
  if (!qr) return '';
  if (qr.startsWith('http')) return qr;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`;
};

const normalizeStatus = value => String(value || '').trim().toLowerCase();
const CHECKED_STATUS_SET = new Set(['used', 'checked', 'checked_in', 'checkedin', 'scanned', 'consumed']);

const getEntityId = (value) => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.$oid) return String(value.$oid);
    if (value._id) return getEntityId(value._id);
    if (value.id) return String(value.id);
  }
  return null;
};

const isTruthyLike = (value) => {
  const normalized = normalizeStatus(value);
  return value === true || value === 1 || normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const isTicketCheckedIn = (ticket = {}) => {
  const status = normalizeStatus(ticket.status || ticket.ticketStatus || ticket.checkinStatus);
  return (
    isTruthyLike(ticket.isCheckedIn) ||
    isTruthyLike(ticket.checkedIn) ||
    isTruthyLike(ticket.isUsed) ||
    CHECKED_STATUS_SET.has(status) ||
    !!(ticket.checkedInAt || ticket.checkInAt || ticket.usedAt || ticket.scannedAt)
  );
};

const normalizeTicketPayload = (ticket) => {
  const id = getEntityId(ticket?._id || ticket?.id || ticket?.ticketId || ticket);
  return {
    ...(typeof ticket === 'object' ? ticket : {}),
    id,
    _id: ticket?._id || ticket?.id || ticket?.ticketId || id,
    checkedInAt: ticket?.checkedInAt || ticket?.checkInAt || ticket?.usedAt || ticket?.scannedAt || null,
    status: ticket?.status || ticket?.ticketStatus || ticket?.checkinStatus,
  };
};

const normalizeOrderPayload = (order) => ({
  ...order,
  _id: getEntityId(order?._id || order?.id) || String(order?._id || order?.id || ''),
  tickets: (Array.isArray(order?.tickets) ? order.tickets : []).map(normalizeTicketPayload),
});

const isCancelledOrRefunded = (ticket, order) => {
  const ticketStatus = normalizeStatus(ticket?.status);
  const orderStatus = normalizeStatus(order?.status);
  const eventStatus = normalizeStatus(order?.event?.status);

  const cancelledSet = new Set(['cancelled', 'canceled', 'refunded', 'refund', 'refund_completed']);
  return cancelledSet.has(ticketStatus) || cancelledSet.has(orderStatus) || cancelledSet.has(eventStatus);
};

// Kiểm tra vé đã hết hạn chưa — dựa vào ngày kết thúc sự kiện hoặc expiresAt của vé
const isTicketExpired = (ticket, order) => {
  // Ưu tiên: expiresAt của vé
  if (ticket.expiresAt) return new Date(ticket.expiresAt) < new Date();
  // Hoặc: ngày kết thúc sự kiện (endDate)
  if (order?.event?.endDate) return new Date(order.event.endDate) < new Date();
  // Hoặc: ngày bắt đầu sự kiện đã qua (nếu không có endDate)
  if (order?.event?.startDate) return new Date(order.event.startDate) < new Date();
  return false;
};

// Trả về trạng thái + config hiển thị của vé
const getTicketStatus = (ticket, order, t) => {
  if (isTicketCheckedIn(ticket)) {
    return {
      key: 'used',
      label: t('ticketStatus.used'),
      color: 'rgba(255,255,255,0.3)',
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
      icon: CheckCircle2,
      canShowQR: false,
    };
  }
  if (isCancelledOrRefunded(ticket, order)) {
    const isRefunded =
      normalizeStatus(ticket?.status).includes('refund') ||
      normalizeStatus(order?.status).includes('refund');
    return {
      key: isRefunded ? 'refunded' : 'cancelled',
      label: isRefunded ? (t('ticketStatus.refunded') || 'Đã hoàn tiền') : t('ticketStatus.cancelled'),
      color: '#f87171',
      bg: 'rgba(248,113,113,0.08)',
      border: 'rgba(248,113,113,0.2)',
      icon: XCircle,
      canShowQR: false,
    };
  }
  if (isTicketExpired(ticket, order)) {
    return {
      key: 'expired',
      label: t('ticketStatus.expired'),
      color: '#f87171',
      bg: 'rgba(248,113,113,0.08)',
      border: 'rgba(248,113,113,0.2)',
      icon: XCircle,
      canShowQR: false,
    };
  }
  return {
    key: 'valid',
    label: t('ticketStatus.valid'),
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.25)',
    icon: CheckCircle2,
    canShowQR: true,
  };
};

const orderStatusConfig = (s, t) => ({
  paid:      { label: t('ticketStatus.paid'), color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  confirmed: { label: t('ticketStatus.confirmed'),   color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  active:    { label: t('ticketStatus.active'),color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  used:      { label: t('ticketStatus.used'),    color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.09)' },
  cancelled: { label: t('ticketStatus.cancelled'),        color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  refunded:  { label: t('ticketStatus.refunded') || 'Đã hoàn tiền', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  refund:    { label: t('ticketStatus.refunded') || 'Đã hoàn tiền', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
}[s] || { label: s || 'Đang xử lý', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' });

const getDisplayOrderStatus = (order) => {
  const rawStatus = String(order?.status || '').toLowerCase();
  const hasTickets = Array.isArray(order?.tickets) && order.tickets.length > 0;

  // If tickets are already issued, treat pending as effectively paid in UI.
  if (rawStatus === 'pending' && hasTickets) return 'paid';
  return rawStatus || 'pending';
};

// ─── LOADING ──────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.05)' }}/>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#f97316', borderRightColor: '#a855f7' }} className="thp-spin"/>
    </div>
    <style>{`@keyframes thp-spin{to{transform:rotate(360deg)}}.thp-spin{animation:thp-spin 0.85s linear infinite}`}</style>
  </div>
);

// ─── EMPTY ────────────────────────────────────────────────────────────────
const EmptyState = ({ navigate, t }) => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
    <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
      <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
        <Ticket style={{ width: 30, height: 30, color: 'rgba(255,255,255,0.12)' }}/>
      </div>
      <h2 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, color: 'white', marginBottom: 10, fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>{t('ticketStatus.noTickets')}</h2>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28, lineHeight: 1.7, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{t('ticketStatus.noTicketsDesc')}</p>
      <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, padding: '12px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", boxShadow: '0 6px 24px rgba(249,115,22,0.28)' }}>
        {t('ticketStatus.exploreEvents')} <ArrowRight style={{ width: 14, height: 14 }}/>
      </button>
    </div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────
const TicketHistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);

  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [expandedOrder, setExpandedOrder]   = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [search, setSearch]                 = useState('');
  const [orderFilter, setOrderFilter]       = useState('all');
  const [ticketFilter, setTicketFilter]     = useState('all');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/ticket-history' } }); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let data = res.data?.data || res.data || [];
        data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(data.map(normalizeOrderPayload));
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [isAuthenticated, navigate, token]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredOrders = orders
    .map((order) => {
      const displayOrderStatus = getDisplayOrderStatus(order);
      const tickets = Array.isArray(order.tickets) ? order.tickets : [];

      const visibleTickets = tickets.filter((ticket, index) => {
        const ticketStatus = getTicketStatus(ticket, order, t);
        const ticketText =
          `e-ticket ${index + 1} ${ticket.ticketType?.name || ''} ${ticket.id || ticket._id || ''} ${ticket.qrCode || ''}`.toLowerCase();

        const matchSearch =
          !normalizedSearch ||
          ticketText.includes(normalizedSearch) ||
          String(order._id || '').toLowerCase().includes(normalizedSearch) ||
          String(order.event?.title || order.event?.name || '').toLowerCase().includes(normalizedSearch) ||
          String(order.event?.location || '').toLowerCase().includes(normalizedSearch);

        const matchTicketFilter = ticketFilter === 'all' || ticketStatus.key === ticketFilter;
        return matchSearch && matchTicketFilter;
      });

      const matchOrderFilter = orderFilter === 'all' || displayOrderStatus === orderFilter;

      return {
        ...order,
        displayOrderStatus,
        visibleTickets,
        matchOrderFilter,
      };
    })
    .filter((order) => order.matchOrderFilter && order.visibleTickets.length > 0);

  if (loading) return <LoadingScreen />;
  if (orders.length === 0) return <EmptyState navigate={navigate} t={t} />;

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 380, height: 380, background: 'radial-gradient(circle,rgba(249,115,22,0.04) 0%,transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 340, height: 340, background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 32, padding: 0, fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'color 0.2s' }}
          className="thp-back-btn">
          <ArrowLeft style={{ width: 13, height: 13 }}/> Quay lại
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 3, height: 22, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
              <h1 style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>Lịch sử vé</h1>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono',monospace", marginLeft: 13 }}>{filteredOrders.length}/{orders.length} đơn hàng</p>
          </div>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#f97316,#a855f7)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(249,115,22,0.28)' }}>
            <ShoppingBag style={{ width: 20, height: 20, color: 'white' }}/>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 18 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.35)', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo sự kiện, ID đơn, ID vé..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                fontSize: 12,
                fontFamily: "'Be Vietnam Pro',sans-serif",
                outline: 'none',
              }}
            />
          </div>
          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              fontSize: 12,
              fontFamily: "'Be Vietnam Pro',sans-serif",
              outline: 'none',
            }}>
            <option value="all" style={{ color: 'black' }}>Đơn: Tất cả</option>
            <option value="paid" style={{ color: 'black' }}>Đơn: Đã thanh toán</option>
            <option value="confirmed" style={{ color: 'black' }}>Đơn: Đã xác nhận</option>
            <option value="active" style={{ color: 'black' }}>Đơn: Đang hoạt động</option>
            <option value="cancelled" style={{ color: 'black' }}>Đơn: Đã hủy</option>
            <option value="refunded" style={{ color: 'black' }}>Đơn: Đã hoàn tiền</option>
          </select>
          <select
            value={ticketFilter}
            onChange={(e) => setTicketFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              fontSize: 12,
              fontFamily: "'Be Vietnam Pro',sans-serif",
              outline: 'none',
            }}>
            <option value="all" style={{ color: 'black' }}>Vé: Tất cả</option>
            <option value="valid" style={{ color: 'black' }}>Vé: Còn hiệu lực</option>
            <option value="used" style={{ color: 'black' }}>Vé: Đã check-in</option>
            <option value="expired" style={{ color: 'black' }}>Vé: Hết hạn</option>
            <option value="cancelled" style={{ color: 'black' }}>Vé: Đã hủy</option>
            <option value="refunded" style={{ color: 'black' }}>Vé: Đã hoàn tiền</option>
          </select>
        </div>

        {/* Order list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '38px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 4 }}>Không có dữ liệu phù hợp bộ lọc</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : filteredOrders.map(order => {
           const sc = orderStatusConfig(order.displayOrderStatus, t);  
            const isOpen = expandedOrder === order._id;

            return (
              <div key={order._id}
                style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: `1px solid ${isOpen ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, overflow: 'hidden', boxShadow: isOpen ? '0 8px 32px rgba(249,115,22,0.1)' : '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.25s' }}>

                {/* Order header */}
                <div style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* ID + status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 6 }}>
                          {order._id.substring(0, 10).toUpperCase()}...
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontFamily: "'Be Vietnam Pro',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {sc.label}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 7 }}>
                        {order.event?.title || order.event?.name || 'Sự kiện không xác định'}
                      </h3>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {order.event?.location && (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                            <MapPin style={{ width: 10, height: 10, color: '#a855f7' }}/>{order.event.location}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                          <Calendar style={{ width: 10, height: 10, color: '#f97316' }}/>{fmtDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Price + ticket count */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 900, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.01em' }}>
                        {fmtPrice(order.totalAmount)}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif", marginTop: 2 }}>{order.tickets?.length || 0} vé</p>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedOrder(isOpen ? null : order._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#fb923c', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'opacity 0.2s' }}
                    className="thp-expand-btn">
                    {isOpen
                      ? <><ChevronUp style={{ width: 13, height: 13 }}/> Ẩn vé</>
                      : <><ChevronDown style={{ width: 13, height: 13 }}/> Xem vé ({order.visibleTickets?.length})</>}
                  </button>
                </div>

                {/* Tickets expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.12)' }}>
                    {order.visibleTickets?.map((ticket, idx) => {
                      const ticketStatus = getTicketStatus(ticket, order, t);
                      const StatusIcon = ticketStatus.icon;
                      const qrOpen = expandedTicket === ticket.id;

                      return (
                        <div key={ticket.id}
                          style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

                          {/* Ticket row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: ticketStatus.key === 'used' && ticket.checkedInAt ? 8 : 0 }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: ticketStatus.key === 'expired' ? 'rgba(255,255,255,0.4)' : 'white', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3, textDecoration: ticketStatus.key === 'expired' ? 'line-through' : 'none' }}>
                                E-Ticket #{idx + 1} — {ticket.ticketType?.name}
                              </p>
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'Space Mono',monospace" }}>ID: {ticket.id}</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {/* Status badge */}
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                                background: ticketStatus.bg,
                                color: ticketStatus.color,
                                border: `1px solid ${ticketStatus.border}`,
                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <StatusIcon style={{ width: 10, height: 10 }}/>
                                {ticketStatus.label}
                              </span>

                              {/* QR toggle button */}
                              <button
                                onClick={() => ticketStatus.canShowQR && setExpandedTicket(qrOpen ? null : ticket.id)}
                                disabled={!ticketStatus.canShowQR}
                                title={!ticketStatus.canShowQR ? (ticketStatus.key === 'expired' ? 'Vé không còn hiệu lực' : 'Vé đã được sử dụng') : 'Xem mã QR'}
                                style={{
                                  width: 32, height: 32, borderRadius: 9,
                                  background: ticketStatus.canShowQR ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${ticketStatus.canShowQR ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                  color: ticketStatus.canShowQR ? '#f97316' : 'rgba(255,255,255,0.15)',
                                  cursor: ticketStatus.canShowQR ? 'pointer' : 'not-allowed',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.2s',
                                }}
                                className={ticketStatus.canShowQR ? 'thp-qr-btn' : ''}>
                                <QrCode style={{ width: 14, height: 14 }}/>
                              </button>
                            </div>
                          </div>

                          {/* Check-in time */}
                          {ticketStatus.key === 'used' && ticket.checkedInAt && (
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                              <CheckCircle2 style={{ width: 10, height: 10, color: '#34d399' }}/> Đã check-in lúc {fmtDate(ticket.checkedInAt)}
                            </p>
                          )}

                          {/* Expired notice */}
                          {ticketStatus.key === 'expired' && (
                            <p style={{ fontSize: 10, color: '#f87171', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, opacity: 0.7 }}>
                              <Clock style={{ width: 10, height: 10 }}/> Sự kiện đã kết thúc — vé không còn hiệu lực
                            </p>
                          )}

                          {/* QR expanded */}
                          {ticketStatus.canShowQR && qrOpen && (
                            <div style={{ marginTop: 14, padding: '20px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} className="thp-fade-in">
                              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Mã QR Check-in</p>
                              <div style={{ background: 'white', borderRadius: 14, padding: 8, boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }}>
                                <img src={getQRCodeImage(ticket.qrCode)} alt="QR" style={{ width: 140, height: 140, display: 'block', borderRadius: 8 }}/>
                              </div>
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'Space Mono',monospace", textAlign: 'center', wordBreak: 'break-all' }}>
                                {ticket.qrCode}
                              </p>
                              <p style={{ fontSize: 11, color: '#fb923c', fontWeight: 700, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Xuất trình QR này khi vào cổng</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');
        @keyframes thp-spin{to{transform:rotate(360deg)}}.thp-spin{animation:thp-spin 0.85s linear infinite}
        @keyframes thp-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.thp-fade-in{animation:thp-fade 0.3s ease-out}
        .thp-back-btn:hover{color:white !important}
        .thp-expand-btn:hover{opacity:0.75}
        .thp-qr-btn:hover{background:rgba(249,115,22,0.2) !important;border-color:rgba(249,115,22,0.4) !important}
        *{scrollbar-width:none}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
};

export default TicketHistoryPage;
