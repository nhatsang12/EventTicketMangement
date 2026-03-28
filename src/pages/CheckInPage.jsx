import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import API_URL from '../config/api';
import {
  QrCode, CheckCircle, XCircle, Ticket, ArrowLeft, RefreshCw,
  Clock, AlertTriangle, MapPin, Calendar, ArrowRight, Shield, Zap, Search
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// ─── HELPERS ──────────────────────────────────────────────────────────────
const getQRCodeImage = qr => {
  if (!qr) return '';
  if (qr.startsWith('http')) return qr;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`;
};

const fmtDate = iso =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

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

const isCancelledOrRefundedEvent = (eventStatus) => {
  const status = normalizeStatus(eventStatus);
  return ['cancelled', 'canceled', 'refunded', 'refund', 'refund_completed'].includes(status);
};

// ✅ Check nếu vé đã được check-in - nhận nhiều format backend khác nhau
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

const mapOrdersToTickets = (orders) =>
  (Array.isArray(orders) ? orders : []).flatMap((order) =>
    (Array.isArray(order?.tickets) ? order.tickets : []).map((ticket) => {
      const id = getEntityId(ticket?._id || ticket?.id || ticket?.ticketId || ticket);
      return {
        ...(typeof ticket === 'object' ? ticket : {}),
        id,
        _id: ticket?._id || ticket?.id || ticket?.ticketId || id,
        eventName: order?.event?.title || order?.event?.name,
        eventLocation: order?.event?.location,
        eventDate: order?.event?.startDate || order?.event?.date || null,
        eventEndDate: order?.event?.endDate || null,
        eventStatus: order?.event?.status || null,
        orderId: getEntityId(order?._id || order?.id),
        checkedInAt: ticket?.checkedInAt || ticket?.checkInAt || ticket?.usedAt || ticket?.scannedAt || null,
      };
    })
  ).filter((ticket) => ticket.id);

const getDateStatus = (eventDate, eventEndDate, eventStatus) => {
  if (isCancelledOrRefundedEvent(eventStatus)) return 'cancelled';
  if (!eventDate) return 'unknown';
  
  const now   = new Date();
  const start = new Date(eventDate);
  const end   = eventEndDate
    ? new Date(eventEndDate)
    : (() => { const e = new Date(eventDate); e.setHours(23, 59, 59, 999); return e; })();
  
  if (now > end) {
    return 'expired'; // quá giờ kết thúc
  } else if (now.toDateString() !== start.toDateString() && now < start) {
    return 'upcoming'; // khác ngày, chưa tới
  } else {
    return 'today'; // đúng ngày → cho quét dù chưa tới giờ
  }
};

// ─── LOADING ──────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.05)' }}/>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#f97316', borderRightColor: '#a855f7' }} className="cip-spin"/>
    </div>
      <style>{`@keyframes cip-spin{to{transform:rotate(360deg)}}.cip-spin{animation:cip-spin 0.85s linear infinite}.cip-refresh-btn:hover{background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8)}.cip-refresh-btn.spinning{animation:cip-spin 1s linear infinite}`}</style>
  </div>
);

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
const CheckInPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);

  const [tickets, setTickets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scanResult, setScanResult]     = useState(null);
  const [scanning, setScanning]         = useState(false);
  const [scanMessage, setScanMessage]   = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const syncTicketState = (nextTickets) => {
    setTickets(nextTickets);
    setSelectedTicket((prev) => {
      if (!prev) return null;
      const prevId = getEntityId(prev?.id || prev?._id || prev?.ticketId);
      if (!prevId) return null;
      return nextTickets.find((ticket) => ticket.id === prevId) || null;
    });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/orders/my-orders`, config);
      const orders = res.data?.data || res.data || [];
      syncTicketState(mapOrdersToTickets(orders));
    } catch {
      toast.error('Không thể tải danh sách vé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/checkin' } }); return; }
    fetchTickets();
    
    // Polling mỗi 15 giây để cập nhật trạng thái vé từ server (im lặng, ko hiển thị loading)
    const pollInterval = setInterval(async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_URL}/api/orders/my-orders`, config);
        const orders = res.data?.data || res.data || [];
        syncTicketState(mapOrdersToTickets(orders));
      } catch (err) {
        // Lỗi polling - không hiển thị, chỉ bỏ qua
      }
    }, 15000);
    
    return () => clearInterval(pollInterval);
  }, [isAuthenticated, navigate, token]);

  const handleSimulateScan = async ticket => {
    setScanning(true);
    setScanResult(null);
    setScanMessage('');
    
    try {
      // Gọi server để kiểm tra trạng thái vé mới nhất (phòng admin check-in)
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const freshRes = await axios.get(`${API_URL}/api/orders/my-orders`, config);
      const freshOrders = freshRes.data?.data || freshRes.data || [];
      const freshTickets = mapOrdersToTickets(freshOrders);
      const targetId = getEntityId(ticket?.id || ticket?._id || ticket?.ticketId);
      const freshTicket = freshTickets.find((ticketItem) => ticketItem.id === targetId);
      
      if (!freshTicket) {
        setScanResult('error');
        setScanMessage('Không thể tìm thấy vé này');
        setScanning(false);
        return;
      }
      
      // Kiểm tra nếu vé đã check-in từ admin hay bên khác
      if (isTicketCheckedIn(freshTicket)) {
        setScanResult('used');
        setScanMessage('Vé này đã được check-in rồi!');
        syncTicketState(freshTickets);
        setScanning(false);
        return;
      }
      
      // Kiểm tra ngày/giờ sự kiện
      const dateStatus = getDateStatus(freshTicket.eventDate, freshTicket.eventEndDate, freshTicket.eventStatus);
      if (dateStatus === 'cancelled') {
        setScanResult('cancelled');
        setScanMessage('Sự kiện đã bị hủy/hoàn tiền. Vé không còn hiệu lực check-in.');
        setScanning(false);
        return;
      }
      if (dateStatus === 'expired') {
        setScanResult('date_error');
        setScanMessage(`Sự kiện đã kết thúc. Vé không còn hiệu lực.`);
        setScanning(false);
        return;
      }
      if (dateStatus === 'upcoming') {
        setScanResult('date_error');
        setScanMessage(`Sự kiện chưa diễn ra (${fmtDate(freshTicket.eventDate)}). Chỉ được check-in đúng ngày tổ chức.`);
        setScanning(false);
        return;
      }
      
      // Tiến hành check-in
      const payload = { qrCode: freshTicket.qrCode || freshTicket.id };
      const res = await axios.post(`${API_URL}/api/admin/ticket-types/checkin`, payload, config);
      if (res.data.success) {
        const checkedInAt = new Date().toISOString();
        const updatedTicket = {
          ...freshTicket,
          isCheckedIn: true,
          checkedIn: true,
          status: 'checked',
          checkedInAt,
        };
        setScanResult('success');
        setScanMessage(res.data.message);
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t));
        setSelectedTicket(prev => prev && prev.id === updatedTicket.id ? { ...prev, ...updatedTicket } : prev);
        // Gọi lại để cập nhật dữ liệu từ server
        setTimeout(() => fetchTickets(), 1000);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi quét vé';
      setScanResult(msg.includes('ĐÃ ĐƯỢC SỬ DỤNG') || msg.toLowerCase().includes('used') ? 'used' : 'error');
      setScanMessage(msg);
      if (msg.toLowerCase().includes('đã sử dụng') || msg.toLowerCase().includes('used')) {
        setTimeout(() => fetchTickets(), 500);
      }
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => { setScanResult(null); setSelectedTicket(null); };

  const normalizedSearch = search.trim().toLowerCase();
  const ticketStats = tickets.reduce((acc, ticket) => {
    const dateStatus = getDateStatus(ticket.eventDate, ticket.eventEndDate, ticket.eventStatus);
    const used = isTicketCheckedIn(ticket);
    if (used) acc.used += 1;
    else if (dateStatus === 'today') acc.today += 1;
    else if (dateStatus === 'upcoming') acc.upcoming += 1;
    else if (dateStatus === 'expired') acc.expired += 1;
    else if (dateStatus === 'cancelled') acc.cancelled += 1;
    return acc;
  }, { today: 0, used: 0, upcoming: 0, expired: 0, cancelled: 0 });

  const filteredTickets = tickets.filter((ticket) => {
    const dateStatus = getDateStatus(ticket.eventDate, ticket.eventEndDate, ticket.eventStatus);
    const used = isTicketCheckedIn(ticket);
    const ticketStatus = used ? 'used' : dateStatus;

    const matchSearch =
      !normalizedSearch ||
      String(ticket.id || '').toLowerCase().includes(normalizedSearch) ||
      String(ticket.qrCode || '').toLowerCase().includes(normalizedSearch) ||
      String(ticket.eventName || '').toLowerCase().includes(normalizedSearch) ||
      String(ticket.eventLocation || '').toLowerCase().includes(normalizedSearch) ||
      String(ticket.ticketType?.name || '').toLowerCase().includes(normalizedSearch);

    const matchFilter =
      filterStatus === 'all' ||
      (filterStatus === 'available' && !used && dateStatus === 'today') ||
      ticketStatus === filterStatus;

    return matchSearch && matchFilter;
  });

  if (loading) return <LoadingScreen />;

  const dateBadge = status => ({
    today:   { label: 'Hôm nay',    color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  Icon: CheckCircle },
    expired: { label: 'Đã qua',     color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', Icon: XCircle     },
    upcoming:{ label: 'Chưa tới',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  Icon: Clock       },
    cancelled:{ label: 'Đã hủy',    color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', Icon: AlertTriangle },
    unknown: { label: 'Không rõ',   color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', Icon: Calendar },
  }[status] || {});

  const ticketBadge = (ticket, dateStatus) => {
    if (isTicketCheckedIn(ticket)) return { label: 'Đã dùng', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.09)' };
    if (dateStatus === 'cancelled') return { label: 'Đã hủy', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
    if (dateStatus === 'expired')  return { label: 'Hết hạn',  color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
    if (dateStatus === 'upcoming') return { label: 'Chưa tới', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)'  };
    return { label: 'Active', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' };
  };

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>
      <div style={{ position: 'fixed', top: -80, right: -80, width: 380, height: 380, background: 'radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 340, height: 340, background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '52px 24px 80px', position: 'relative', zIndex: 1 }}>

        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 32, padding: 0, fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'color 0.2s' }}
          className="cip-back-btn">
          <ArrowLeft style={{ width: 13, height: 13 }}/> Quay lại
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#f97316,#a855f7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(249,115,22,0.28)' }}>
              <QrCode style={{ width: 22, height: 22, color: 'white' }}/>
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.7rem)', fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}>QR Check-in</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif", marginTop: 3 }}>Mô phỏng quét QR vào cổng sự kiện</p>
            </div>
          </div>
          <button onClick={() => fetchTickets()}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
            className="cip-refresh-btn"
            title="Làm mới danh sách vé">
            <RefreshCw style={{ width: 18, height: 18 }}/>
          </button>
        </div>

        {scanResult && (
          <div style={{
            marginBottom: 24, borderRadius: 20, overflow: 'hidden',
            background: scanResult === 'success' ? 'rgba(16,185,129,0.07)' : scanResult === 'date_error' ? 'rgba(96,165,250,0.07)' : 'rgba(239,68,68,0.07)',
            border: `1px solid ${scanResult === 'success' ? 'rgba(52,211,153,0.25)' : scanResult === 'date_error' ? 'rgba(96,165,250,0.25)' : 'rgba(239,68,68,0.25)'}`,
            boxShadow: scanResult === 'success' ? '0 8px 32px rgba(16,185,129,0.1)' : '0 8px 32px rgba(0,0,0,0.3)',
          }} className="cip-fade-in">
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              {scanResult === 'success' ? (
                <>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle style={{ width: 28, height: 28, color: '#34d399' }}/>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", marginBottom: 6 }}>Check-in thành công!</p>
                  <p style={{ fontSize: 12, color: '#34d399', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 8 }}>{scanMessage || 'Chào mừng! Bạn đã vào sự kiện.'}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'Space Mono',monospace" }}>{selectedTicket?.id || selectedTicket?._id}</p>
                </>
              ) : scanResult === 'date_error' || scanResult === 'cancelled' ? (
                <>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: scanMessage.includes('chưa') ? 'rgba(96,165,250,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${scanMessage.includes('chưa') ? 'rgba(96,165,250,0.25)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    {scanMessage.includes('chưa')
                      ? <Clock style={{ width: 28, height: 28, color: '#60a5fa' }}/>
                      : <AlertTriangle style={{ width: 28, height: 28, color: '#f87171' }}/>}
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", marginBottom: 6 }}>Không thể check-in</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{scanMessage}</p>
                </>
              ) : (
                <>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <XCircle style={{ width: 28, height: 28, color: '#f87171' }}/>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", marginBottom: 6 }}>
                    {scanResult === 'used' ? 'Vé đã được sử dụng!' : 'Lỗi xác thực vé!'}
                  </p>
                  <p style={{ fontSize: 12, color: '#f87171', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{scanMessage}</p>
                </>
              )}
              <button onClick={resetScan}
                style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s' }}
                className="cip-reset-btn">
                <RefreshCw style={{ width: 12, height: 12 }}/> Quét vé khác
              </button>
            </div>
          </div>
        )}

        {!scanResult && (
          <>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 20 }}>
                <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Ticket style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.12)' }}/>
                </div>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 4 }}>Không có vé nào để check-in</p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginBottom: 20, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Hãy đặt vé để tham gia sự kiện</p>
                <button onClick={() => navigate('/')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 12, fontWeight: 800, padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                  Đặt vé ngay <ArrowRight style={{ width: 13, height: 13 }}/>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 12, marginBottom: 4 }}>
                  <Zap style={{ width: 12, height: 12, color: '#f97316', flexShrink: 0 }}/>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Chọn một vé bên dưới để giả lập máy quét QR của bảo vệ</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 6 }}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm theo sự kiện, ID vé, loại vé..."
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 32px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'white',
                        fontSize: 12,
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        outline: 'none',
                      }}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'white',
                      fontSize: 12,
                      fontFamily: "'Be Vietnam Pro',sans-serif",
                      outline: 'none',
                    }}>
                    <option value="all" style={{ color: 'black' }}>Tất cả ({tickets.length})</option>
                    <option value="available" style={{ color: 'black' }}>Có thể vào ({ticketStats.today})</option>
                    <option value="used" style={{ color: 'black' }}>Đã check-in ({ticketStats.used})</option>
                    <option value="upcoming" style={{ color: 'black' }}>Chưa tới ({ticketStats.upcoming})</option>
                    <option value="expired" style={{ color: 'black' }}>Hết hạn ({ticketStats.expired})</option>
                    <option value="cancelled" style={{ color: 'black' }}>Đã hủy ({ticketStats.cancelled})</option>
                  </select>
                </div>

                {filteredTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14 }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>Không có vé phù hợp bộ lọc</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Thử đổi trạng thái lọc hoặc từ khóa tìm kiếm.</p>
                  </div>
                ) : filteredTickets.map(ticket => {
                  const dateStatus = getDateStatus(ticket.eventDate, ticket.eventEndDate, ticket.eventStatus);
                  const isSelected = selectedTicket?.id === ticket.id;
                  const db = dateBadge(dateStatus);
                  const tb = ticketBadge(ticket, dateStatus);
                  const canCheckIn = !isTicketCheckedIn(ticket) && dateStatus === 'today';

                  return (
                    <div key={ticket.id}
                      onClick={() => !scanning && setSelectedTicket(isSelected ? null : ticket)}
                      style={{
                        background: isSelected ? 'linear-gradient(180deg,#201e1c 0%,#1a1818 100%)' : 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)',
                        border: isSelected ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s',
                        boxShadow: isSelected ? '0 8px 32px rgba(249,115,22,0.12), 0 0 0 1px rgba(249,115,22,0.1)' : '0 4px 20px rgba(0,0,0,0.4)',
                        opacity: isTicketCheckedIn(ticket) && !isSelected ? 0.6 : 1,
                      }}
                      className="cip-ticket-card">

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'white', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={getQRCodeImage(ticket.qrCode || ticket.id)} alt="QR" style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }}/>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                            {ticket.eventName || 'Sự kiện chưa rõ'}
                          </p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                            {ticket.ticketType?.name}{ticket.eventLocation && ` — ${ticket.eventLocation}`}
                          </p>
                          {ticket.eventDate && db.Icon && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: db.bg, color: db.color, border: `1px solid ${db.border}`, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                              <db.Icon style={{ width: 10, height: 10 }}/> {db.label} · {fmtDate(ticket.eventDate)}
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, fontFamily: "'Be Vietnam Pro',sans-serif", flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {tb.label}
                        </span>
                      </div>

                      {isSelected && !isTicketCheckedIn(ticket) && (
                        <div style={{ borderTop: '1px solid rgba(249,115,22,0.15)', background: 'rgba(249,115,22,0.03)', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                          <div style={{ background: 'white', borderRadius: 16, padding: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'inline-block' }}>
                            <img src={getQRCodeImage(ticket.qrCode || ticket.id)} alt="QR" style={{ width: 160, height: 160, display: 'block', borderRadius: 8 }}/>
                          </div>

                          {dateStatus === 'upcoming' && (
                            <div style={{ padding: '12px 16px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 12, textAlign: 'center', maxWidth: 280 }}>
                              <Clock style={{ width: 16, height: 16, color: '#60a5fa', margin: '0 auto 6px' }}/>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>Sự kiện chưa diễn ra</p>
                              <p style={{ fontSize: 11, color: 'rgba(96,165,250,0.6)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Ngày tổ chức: {fmtDate(ticket.eventDate)}</p>
                            </div>
                          )}
                          {dateStatus === 'cancelled' && (
                            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, textAlign: 'center', maxWidth: 280 }}>
                              <AlertTriangle style={{ width: 16, height: 16, color: '#f87171', margin: '0 auto 6px' }}/>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>Sự kiện đã bị hủy</p>
                              <p style={{ fontSize: 11, color: 'rgba(248,113,113,0.6)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Vé không thể sử dụng để check-in.</p>
                            </div>
                          )}
                          {dateStatus === 'expired' && (
                            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, textAlign: 'center', maxWidth: 280 }}>
                              <AlertTriangle style={{ width: 16, height: 16, color: '#f87171', margin: '0 auto 6px' }}/>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171', fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 3 }}>Sự kiện đã kết thúc</p>
                              <p style={{ fontSize: 11, color: 'rgba(248,113,113,0.6)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Vé không còn hiệu lực từ {fmtDate(ticket.eventDate)}</p>
                            </div>
                          )}

                          <button
                            onClick={e => { e.stopPropagation(); handleSimulateScan(ticket); }}
                            disabled={scanning || dateStatus !== 'today'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '13px 28px', borderRadius: 999, border: 'none',
                              cursor: scanning || dateStatus !== 'today' ? 'not-allowed' : 'pointer',
                              fontSize: 13, fontWeight: 800, fontFamily: "'Be Vietnam Pro',sans-serif",
                              background: canCheckIn && !scanning ? 'linear-gradient(135deg,#f97316,#a855f7)' : 'rgba(255,255,255,0.06)',
                              color: canCheckIn && !scanning ? 'white' : 'rgba(255,255,255,0.25)',
                              boxShadow: canCheckIn && !scanning ? '0 6px 24px rgba(249,115,22,0.28)' : 'none',
                              transition: 'all 0.25s',
                              opacity: scanning ? 0.7 : 1,
                            }}
                            className={canCheckIn && !scanning ? 'cip-cta-btn' : ''}>
                            {scanning ? (
                              <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} className="cip-spin"/> Đang quét hệ thống...</>
                            ) : dateStatus === 'cancelled' ? (
                              <><XCircle style={{ width: 14, height: 14 }}/> Sự kiện đã hủy</>
                            ) : dateStatus !== 'today' ? (
                              <><XCircle style={{ width: 14, height: 14 }}/> Không thể check-in</>
                            ) : (
                              <><QrCode style={{ width: 14, height: 14 }}/> Bấm để Check-in vé này</>
                            )}
                          </button>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: "'Space Mono',monospace" }}>ID: {ticket.id}</p>
                        </div>
                      )}

                      {isSelected && isTicketCheckedIn(ticket) && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(0,0,0,0.1)' }}>
                          <XCircle style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }}/>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif", fontWeight: 600 }}>Vé này đã được sử dụng</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 4 }}>
                  <Shield style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}/>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Mỗi vé chỉ được quét một lần duy nhất. Mã QR có chữ ký số chống giả mạo.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        @keyframes cip-spin { to { transform:rotate(360deg) } }
        .cip-spin { animation: cip-spin 0.85s linear infinite; }

        @keyframes cip-fade-in { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .cip-fade-in { animation: cip-fade-in 0.35s ease-out forwards; }

        .cip-back-btn:hover { color:white !important; }
        .cip-reset-btn:hover { background:rgba(255,255,255,0.09) !important; border-color:rgba(255,255,255,0.18) !important; color:white !important; }
        .cip-ticket-card:hover { border-color:rgba(249,115,22,0.25) !important; }
        .cip-cta-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(249,115,22,0.36) !important; }
        .cip-cta-btn:active { transform:translateY(0); }

        * { scrollbar-width:none; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
};

export default CheckInPage;
