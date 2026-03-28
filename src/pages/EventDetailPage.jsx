import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import {
  Calendar, MapPin, Clock, Share2, Heart,
  Minus, Plus, ShoppingCart, AlertCircle, Sparkles,
  ArrowLeft, Ticket,
  BadgeCheck, Shield, Zap, ArrowRight, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const getImageUrl = p =>
  !p ? 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&auto=format&fit=crop&q=80'
     : p.startsWith('http') ? p : `${API_URL}${p}`;

const fmtPrice = p =>
  (p === null || p === undefined || p === 0)
    ? 'Miễn phí'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const fmtPercent = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const fmtDate = d => {
  if (!d) return 'Chưa cập nhật';
  try { return format(new Date(d), 'EEEE, dd MMMM yyyy', { locale: vi }); }
  catch { return 'TBA'; }
};

const fmtTime = d => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return isNaN(dt) ? '' : dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

const extractTicketDescription = (ticket) => {
  if (typeof ticket?.description === 'string' && ticket.description.trim()) return ticket.description.trim();
  if (typeof ticket?.details === 'string' && ticket.details.trim()) return ticket.details.trim();
  if (Array.isArray(ticket?.benefits) && ticket.benefits.length > 0) {
    return ticket.benefits.map((item) => `- ${item}`).join('\n');
  }
  return '';
};

const normalizeTicketType = (ticket, fallbackEventId) => {
  const ticketId = getEntityId(ticket?._id || ticket?.id || ticket?.ticketId);
  const eventId = getEntityId(ticket?.event?._id || ticket?.event || ticket?.eventId || fallbackEventId);
  return {
    ...ticket,
    _id: ticket?._id || ticket?.id || ticketId,
    event: eventId,
    description: extractTicketDescription(ticket),
  };
};

const collectArrayPayload = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.ticketTypes)) return payload.ticketTypes;
  if (Array.isArray(payload?.tickets)) return payload.tickets;
  if (Array.isArray(payload)) return payload;
  return [];
};

const fetchTicketTypesByEvent = async (eventId) => {
  const attempts = [
    `${API_URL}/api/ticket-types/event/${eventId}`,
    `${API_URL}/api/ticket-types?event=${eventId}`,
    `${API_URL}/api/tickets?event=${eventId}`,
    `${API_URL}/api/tickets`,
  ];

  for (const url of attempts) {
    try {
      const res = await axios.get(url);
      const rows = collectArrayPayload(res.data).map((ticket) => normalizeTicketType(ticket, eventId));
      const filtered = rows.filter((ticket) => getEntityId(ticket?.event) === eventId);
      if (filtered.length > 0) return filtered;
      if (rows.length > 0 && url !== `${API_URL}/api/tickets`) return rows;
    } catch {
      // try next endpoint
    }
  }
  return [];
};

const getTicketAvailability = (ticket) => {
  const quantity = Math.max(0, toNumber(ticket?.quantity, 0));
  const soldRaw = Number(ticket?.sold);
  const sold = Number.isFinite(soldRaw) && soldRaw >= 0 ? soldRaw : null;

  const remainingRaw = Number(ticket?.remaining);
  const hasRemaining =
    ticket?.remaining !== undefined &&
    ticket?.remaining !== null &&
    Number.isFinite(remainingRaw);

  let remaining = hasRemaining
    ? remainingRaw
    : Math.max(0, quantity - (sold ?? 0));

  // Legacy guard: old records may have remaining=0 while sold is still 0.
  if (hasRemaining && remaining === 0 && quantity > 0 && sold === 0) {
    remaining = quantity;
  }

  remaining = Math.max(0, Math.min(quantity || remaining, remaining));
  const soldCount = sold ?? Math.max(0, quantity - remaining);
  const pct = quantity ? Math.min(100, (soldCount / quantity) * 100) : 0;

  return { quantity, sold: soldCount, remaining, pct };
};

const getStatusInfo = s => ({
  published: { label: 'Đang mở bán', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  active:    { label: 'Đang mở bán', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  draft:     { label: 'Sắp mở bán',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cancelled: { label: 'Đã huỷ',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  ended:     { label: 'Đã kết thúc', color: '#6b7280', bg: 'rgba(107,114,128,0.12)'},
}[s] || { label: 'Đang mở bán', color: '#10b981', bg: 'rgba(16,185,129,0.12)' });

const getFavoriteStorageKey = (user) => {
  const userKey = user?._id || user?.email || 'guest';
  return `favorite-events-${String(userKey)}`;
};

const getFavoriteEventId = (item) => getEntityId(item?._id || item?.id || item?.eventId);

const readFavorites = (user) => {
  try {
    const raw = localStorage.getItem(getFavoriteStorageKey(user));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFavorites = (user, favorites) => {
  localStorage.setItem(getFavoriteStorageKey(user), JSON.stringify(favorites));
};

// FIX: Be Vietnam Pro TRƯỚC Clash Display
// Clash Display không có glyph tiếng Việt → đặt trước sẽ gây dính chữ
const FONT_VN = "'Be Vietnam Pro','Clash Display',sans-serif";

const LoadingPage = () => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 18px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)' }}/>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#f97316', borderRightColor: '#a855f7' }} className="edp-spin"/>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Đang tải sự kiện...</p>
    </div>
    <style>{`@keyframes edp-spin{to{transform:rotate(360deg)}}.edp-spin{animation:edp-spin 0.85s linear infinite}`}</style>
  </div>
);

const NotFoundPage = ({ navigate }) => (
  <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
    <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
      <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(168,85,247,0.1))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <AlertCircle style={{ width: 36, height: 36, color: '#f97316' }}/>
      </div>
      <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, color: 'white', marginBottom: 10, fontFamily: FONT_VN, letterSpacing: '-0.02em' }}>Không tìm thấy sự kiện</h2>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>Sự kiện bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, padding: '12px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(249,115,22,0.28)' }}>
        <ArrowLeft style={{ width: 14, height: 14 }}/> Về trang chủ
      </button>
    </div>
  </div>
);

const ConflictModal = ({ cartEventName, onCancel, onConfirm }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 999,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: "'Be Vietnam Pro',sans-serif",
  }}>
    <div style={{
      background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 22, padding: '32px 28px', maxWidth: 400, width: '100%',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
    }}>
      <div style={{ width: 56, height: 56, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <ShoppingCart style={{ width: 24, height: 24, color: '#f97316' }}/>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: 10, fontFamily: FONT_VN, letterSpacing: '-0.02em' }}>
        Giỏ hàng đang có vé khác
      </h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.7, marginBottom: 8 }}>
        Giỏ hàng đang có vé của
      </p>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#fb923c', textAlign: 'center', marginBottom: 20, lineHeight: 1.4, fontFamily: FONT_VN }}>
        "{cartEventName}"
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.7, marginBottom: 24 }}>
        Bạn có muốn xóa giỏ hàng hiện tại và thêm vé mới không?
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Be Vietnam Pro',sans-serif" }}
          className="edp-outline-btn">
          Hủy
        </button>
        <button onClick={onConfirm}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 18px rgba(249,115,22,0.28)', transition: 'all 0.2s', fontFamily: "'Be Vietnam Pro',sans-serif" }}
          className="edp-cta-btn">
          <Trash2 style={{ width: 13, height: 13 }}/> Xóa & thêm mới
        </button>
      </div>
    </div>
  </div>
);

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem, clearCart } = useCartStore();
  const cartEvent = useCartStore(state => state.event);

  const [event, setEventData] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [wishlisted, setWishlisted] = useState(false);
  const [showConflict, setShowConflict] = useState(false);

  useEffect(() => { fetchEventDetails(); }, [id]);

  useEffect(() => {
    if (!event || !isAuthenticated || !user) {
      setWishlisted(false);
      return;
    }
    const eventId = getEntityId(event?._id || event?.id);
    const favorites = readFavorites(user);
    const isFavorited = favorites.some((item) => getFavoriteEventId(item) === eventId);
    setWishlisted(isFavorited);
  }, [event, isAuthenticated, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventRes = await axios.get(`${API_URL}/api/events`);
      const allEvents = eventRes.data?.data || eventRes.data || [];
      const currentEvent = allEvents.find(e => getEntityId(e?._id || e?.id) === id);
      if (!currentEvent) { setEventData(null); setLoading(false); return; }

      setEventData(currentEvent);
      const eventTickets = await fetchTicketTypesByEvent(id);
      setTicketTypes(eventTickets);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (ticketId, delta) => {
    setSelectedTickets(prev => {
      const cur = prev[ticketId] || 0;
      const ticket = ticketTypes.find(t => t._id === ticketId);
      const { remaining } = getTicketAvailability(ticket);
      const next = Math.max(0, Math.min(cur + delta, remaining));
      return { ...prev, [ticketId]: next };
    });
  };

  const doAddToCart = () => {
    Object.entries(selectedTickets).forEach(([tid, qty]) => {
      if (qty > 0) {
        const t = ticketTypes.find(t => t._id === tid);
        const { remaining } = getTicketAvailability(t);
        const safeQty = Math.min(qty, remaining);
        if (safeQty > 0) addItem(t, safeQty, event);
      }
    });
    toast.success('Đã thêm vào giỏ hàng!');
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt vé');
      navigate('/login');
      return;
    }
    const hasAny = Object.values(selectedTickets).some(q => q > 0);
    if (!hasAny) {
      toast.error('Vui lòng chọn ít nhất một loại vé');
      return;
    }
    if (cartEvent && cartEvent._id !== event._id) {
      setShowConflict(true);
      return;
    }
    doAddToCart();
  };

  const handleConflictConfirm = () => {
    clearCart();
    setShowConflict(false);
    doAddToCart();
  };

  const toggleFavorite = () => {
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để thêm yêu thích');
      navigate('/login');
      return;
    }

    const eventId = getEntityId(event?._id || event?.id);
    if (!eventId) {
      toast.error('Không thể thêm yêu thích cho sự kiện này');
      return;
    }

    const favorites = readFavorites(user);
    const existed = favorites.some((item) => getFavoriteEventId(item) === eventId);

    if (existed) {
      const nextFavorites = favorites.filter((item) => getFavoriteEventId(item) !== eventId);
      writeFavorites(user, nextFavorites);
      setWishlisted(false);
      toast.success('Đã bỏ khỏi yêu thích');
      return;
    }

    const favoriteItem = {
      _id: event._id || event.id || eventId,
      title: event.title || '',
      image: event.image || '',
      startDate: event.startDate || null,
      location: event.location || '',
      category: event.category || '',
      addedAt: new Date().toISOString(),
    };

    writeFavorites(user, [...favorites, favoriteItem]);
    setWishlisted(true);
    toast.success('Đã thêm vào yêu thích');
  };

  const getTotalPrice = () =>
    Object.entries(selectedTickets).reduce((sum, [tid, qty]) => {
      const t = ticketTypes.find(t => t._id === tid);
      return sum + (t?.price || 0) * qty;
    }, 0);

  const totalSelected = Object.values(selectedTickets).reduce((s, q) => s + q, 0);

  if (loading) return <LoadingPage />;
  if (!event) return <NotFoundPage navigate={navigate} />;

  const status = getStatusInfo(event.status);
  const heroImg = getImageUrl(event.image);
  const startTimeStr = fmtTime(event.startDate);
  const endTimeStr = fmtTime(event.endDate);

  const startDay = event.startDate ? new Date(event.startDate).toDateString() : null;
  const endDay = event.endDate ? new Date(event.endDate).toDateString() : null;
  const endDateDifferent = endDay && startDay !== endDay;

  return (
    <div style={{ minHeight: '100svh', background: '#060606', fontFamily: "'Be Vietnam Pro',sans-serif", color: 'white' }}>

      {showConflict && (
        <ConflictModal
          cartEventName={cartEvent?.title || 'sự kiện khác'}
          onCancel={() => setShowConflict(false)}
          onConfirm={handleConflictConfirm}
        />
      )}

      {/* Hero */}
      <section style={{ position: 'relative', height: 'clamp(420px,55vw,620px)', overflow: 'hidden', background: '#0a0a0a' }}>
        <img src={heroImg} alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&auto=format&fit=crop'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(6,6,6,1) 0%,rgba(6,6,6,0.55) 40%,rgba(6,6,6,0.1) 80%,transparent 100%)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,6,6,0.6) 0%,transparent 50%,rgba(168,85,247,0.08) 100%)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,6,6,0.4) 0%,transparent 60%)' }}/>

        <button onClick={() => navigate('/', { state: { scrollTo: 'all-events' } })}
          style={{ position: 'absolute', top: 50, left: 28, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
          className="edp-back-btn">
          <ArrowLeft style={{ width: 13, height: 13 }}/> Quay lại
        </button>

        <div style={{ position: 'absolute', top: 50, right: 28, display: 'flex', gap: 8, zIndex: 10 }}>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Đã sao chép link!'); }}
            style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            className="edp-icon-btn">
            <Share2 style={{ width: 14, height: 14 }}/>
          </button>
          <button onClick={toggleFavorite}
            style={{ width: 38, height: 38, borderRadius: '50%', background: wishlisted ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: `1px solid ${wishlisted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`, color: wishlisted ? '#f87171' : 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
            <Heart style={{ width: 14, height: 14, fill: wishlisted ? 'currentColor' : 'none' }}/>
          </button>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px,4vw,48px) clamp(20px,5vw,60px)', zIndex: 5 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: status.bg, color: status.color, border: `1px solid ${status.color}40`, backdropFilter: 'blur(8px)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{status.label}</span>
            {event.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>{event.category}</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,3.2rem)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em', fontFamily: FONT_VN, maxWidth: 760, marginBottom: 16, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar style={{ width: 13, height: 13, color: '#f97316', flexShrink: 0 }}/>{fmtDate(event.startDate)}
            </span>
            {startTimeStr && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock style={{ width: 13, height: 13, color: '#a855f7', flexShrink: 0 }}/>{startTimeStr}{endTimeStr ? ` – ${endTimeStr}` : ''}
              </span>
            )}
            {event.location && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin style={{ width: 13, height: 13, color: '#ec4899', flexShrink: 0 }}/>{event.location}
              </span>
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '40px 24px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 28, alignItems: 'start' }} className="edp-layout">

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="edp-info-grid">
            {[
              { icon: Calendar, color: '#f97316', label: 'Ngày diễn ra',  value: fmtDate(event.startDate) },
              { icon: Clock,    color: '#a855f7', label: 'Giờ bắt đầu',  value: startTimeStr || '19:00' },
              { icon: Clock,    color: '#10b981', label: 'Giờ kết thúc',
                value: event.endDate
                  ? (endDateDifferent ? `${fmtDate(event.endDate)} ${endTimeStr}` : endTimeStr || 'Chưa cập nhật')
                  : 'Chưa cập nhật'
              },
              { icon: MapPin,   color: '#ec4899', label: 'Địa điểm',     value: event.location || 'Chưa cập nhật' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'linear-gradient(180deg,#1e1e20 0%,#18181a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' }} className="edp-info-card">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon style={{ width: 16, height: 16, color: item.color }}/>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{item.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ background: 'linear-gradient(180deg,#1a1a1c 0%,#161618 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: FONT_VN, letterSpacing: '-0.01em' }}>Giới thiệu sự kiện</h2>
              <Sparkles style={{ width: 14, height: 14, color: '#f97316' }}/>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.85, whiteSpace: 'pre-wrap', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
              {event.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
            </div>
          </div>

          {/* Ticket detail */}
          <div style={{ background: 'linear-gradient(180deg,#1a1a1c 0%,#161618 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: FONT_VN, letterSpacing: '-0.01em' }}>Chi tiết hạng vé</h2>
              <Ticket style={{ width: 14, height: 14, color: '#f97316' }}/>
            </div>

            {ticketTypes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ticketTypes.map((ticket) => {
                  const { quantity, remaining, sold } = getTicketAvailability(ticket);
                  const detail = (ticket.description || '').split('\n').map((line) => line.trim()).filter(Boolean);
                  return (
                    <div key={`detail-${ticket._id}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: 'white', fontFamily: FONT_VN }}>{ticket.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#fb923c', marginTop: 2 }}>{fmtPrice(ticket.price)}</p>
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Space Mono',monospace", textAlign: 'right' }}>
                          Đã bán {sold}/{quantity || sold} · Còn {remaining}
                        </span>
                      </div>
                      {detail.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {detail.map((line, index) => (
                            <p key={`${ticket._id}-line-${index}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>
                          Quyền lợi của hạng vé này đang được cập nhật.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>
                Chưa có thông tin chi tiết hạng vé cho sự kiện này.
              </p>
            )}
          </div>

          {/* Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }} className="edp-badge-grid">
            {[
              { icon: Shield,    color: '#10b981', title: 'Vé chính hãng',   desc: 'Mã QR độc nhất, chống giả mạo' },
              { icon: Zap,       color: '#f97316', title: 'Đặt vé siêu tốc', desc: 'Nhận vé điện tử ngay lập tức'  },
              { icon: BadgeCheck,color: '#a855f7', title: 'Hoàn tiền 100%',  desc: 'Nếu sự kiện bị huỷ'           },
            ].map((b, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${b.color}14`, border: `1px solid ${b.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <b.icon style={{ width: 14, height: 14, color: b.color }}/>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'white', marginBottom: 3, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{b.title}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, fontFamily: "'Be Vietnam Pro',sans-serif" }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — ticket selector */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: 'linear-gradient(180deg,#1c1c1e 0%,#171719 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset' }}>
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#f97316,#a855f7)', borderRadius: 2 }}/>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: FONT_VN, letterSpacing: '-0.01em' }}>Chọn loại vé</h2>
              </div>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#f97316,#a855f7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart style={{ width: 15, height: 15, color: 'white' }}/>
              </div>
            </div>

            <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ticketTypes.length > 0 ? (
                <>
                  {ticketTypes.map(ticket => {
                    const { quantity, remaining, pct } = getTicketAvailability(ticket);
                    const isAvailable = ticket.isActive !== false && remaining > 0;
                    const qty = selectedTickets[ticket._id] || 0;

                    return (
                      <div key={ticket._id}
                        style={{ background: qty > 0 ? 'rgba(249,115,22,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${qty > 0 ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '16px 18px', transition: 'all 0.25s', boxShadow: qty > 0 ? '0 0 0 1px rgba(249,115,22,0.1)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Ticket style={{ width: 12, height: 12, color: '#f97316', flexShrink: 0 }}/>
                              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'white', fontFamily: FONT_VN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.name}</h3>
                            </div>
                            <p style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: FONT_VN, letterSpacing: '-0.01em' }}>
                              {fmtPrice(ticket.price)}
                            </p>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: isAvailable ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isAvailable ? '#34d399' : '#f87171', border: `1px solid ${isAvailable ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`, flexShrink: 0, marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                            {isAvailable ? 'Còn vé' : 'Hết vé'}
                          </span>
                        </div>

                        {quantity > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#f97316,#a855f7)', borderRadius: 3, transition: 'width 0.6s ease' }}/>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'Space Mono',monospace" }}>{remaining} vé còn lại</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 80 ? '#f87171' : 'rgba(255,255,255,0.25)', fontFamily: "'Space Mono',monospace" }}>{fmtPercent(pct)} đã bán</span>
                            </div>
                          </div>
                        )}

                        {isAvailable && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Số lượng</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                              <button onClick={() => handleQuantityChange(ticket._id, -1)} disabled={qty === 0}
                                style={{ width: 34, height: 34, border: 'none', background: 'transparent', color: qty === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)', cursor: qty === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                <Minus style={{ width: 12, height: 12 }}/>
                              </button>
                              <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 800, color: qty > 0 ? '#fb923c' : 'rgba(255,255,255,0.6)', fontFamily: "'Space Mono',monospace", borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', lineHeight: '34px' }}>
                                {qty}
                              </span>
                              <button onClick={() => handleQuantityChange(ticket._id, 1)} disabled={qty >= remaining}
                                style={{ width: 34, height: 34, border: 'none', background: 'transparent', color: qty >= remaining ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)', cursor: qty >= remaining ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                <Plus style={{ width: 12, height: 12 }}/>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 12, padding: '12px 16px' }}>
                      <div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Be Vietnam Pro',sans-serif" }}>Tổng cộng</p>
                        {totalSelected > 0 && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{totalSelected} vé đã chọn</p>}
                      </div>
                      <span style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: FONT_VN, letterSpacing: '-0.01em' }}>
                        {fmtPrice(getTotalPrice())}
                      </span>
                    </div>

                    <button onClick={handleAddToCart}
                      style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#f97316,#a855f7)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 28px rgba(249,115,22,0.28)', transition: 'all 0.25s' }}
                      className="edp-cta-btn">
                      Đặt vé ngay <ArrowRight style={{ width: 15, height: 15 }}/>
                    </button>

                    <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                      <Shield style={{ width: 10, height: 10 }}/> Thanh toán bảo mật · Hoàn tiền nếu sự kiện huỷ
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <AlertCircle style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.15)' }}/>
                  </div>
                  <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Chưa mở bán vé</p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: "'Be Vietnam Pro',sans-serif" }}>Sự kiện này chưa có thông tin vé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        @keyframes edp-spin { to { transform:rotate(360deg) } }
        .edp-spin { animation: edp-spin 0.85s linear infinite; }

        .edp-back-btn:hover { background:rgba(249,115,22,0.18) !important; border-color:rgba(249,115,22,0.4) !important; color:white !important; }
        .edp-icon-btn:hover { background:rgba(255,255,255,0.12) !important; border-color:rgba(255,255,255,0.2) !important; }
        .edp-info-card:hover { border-color:rgba(255,255,255,0.14) !important; }
        .edp-cta-btn:hover { transform:translateY(-2px); box-shadow:0 10px 36px rgba(249,115,22,0.38) !important; }
        .edp-cta-btn:active { transform:translateY(0); }
        .edp-outline-btn:hover { border-color:rgba(255,255,255,0.2) !important; color:white !important; }

        @media (max-width:860px) {
          .edp-layout { grid-template-columns:1fr !important; }
          .edp-info-grid { grid-template-columns:1fr 1fr !important; }
          .edp-badge-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width:520px) {
          .edp-info-grid { grid-template-columns:1fr 1fr !important; }
        }

        * { scrollbar-width:none; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
};

export default EventDetailPage;
