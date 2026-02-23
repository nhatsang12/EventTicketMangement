import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Calendar, MapPin, Clock, Search, Tag, Ticket,
  Users, ArrowRight, ChevronDown, ChevronRight,
  Flame, Sparkles, TrendingUp, Star, Music, Shield,
  Zap, HeartHandshake, Quote, BadgeCheck, Gift
} from "lucide-react";

// ─── HELPERS (đồng bộ với EventDetailPage) ────────────────────────────────
const getImageUrl = (p) => {
  if (!p) return "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1000&auto=format&fit=crop&q=80";
  return p.startsWith("http") ? p : `http://localhost:8000${p}`;
};

const fmtDate = (d) => {
  if (!d) return "Chưa cập nhật";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtTime = (d) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const fmtPrice = (price) => {
  if (price === null || price === undefined) return "Miễn phí";
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

const getMinPrice = (event) => {
  if (event.ticketTypes?.length) {
    const prices = event.ticketTypes.map(t => t.price).filter(p => typeof p === "number");
    if (prices.length) return Math.min(...prices);
  }
  if (typeof event.minPrice === "number") return event.minPrice;
  if (typeof event.price === "number") return event.price;
  return null;
};

const getStatusInfo = (status) => {
  const map = {
    published: { label: "Đang mở",     color: "#16a34a", bg: "#dcfce7" },
    active:    { label: "Đang mở",     color: "#16a34a", bg: "#dcfce7" },
    draft:     { label: "Sắp mở",      color: "#d97706", bg: "#fef3c7" },
    cancelled: { label: "Đã huỷ",      color: "#dc2626", bg: "#fee2e2" },
    ended:     { label: "Đã kết thúc", color: "#6b7280", bg: "#f3f4f6" },
  };
  return map[status] || map.published;
};

const getTotalTickets = (e) => {
  if (e.ticketTypes?.length) return e.ticketTypes.reduce((s, t) => s + (t.quantity || 0), 0);
  return e.totalTickets || e.capacity || null;
};

const getSoldTickets = (e) => {
  if (e.ticketTypes?.length) return e.ticketTypes.reduce((s, t) => s + (t.sold || 0), 0);
  return e.soldTickets || e.sold || 0;
};

// ─── SKELETONS ────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f0ece8", overflow: "hidden", animation: "hpPulse 1.6s ease-in-out infinite" }}>
    <div style={{ height: 188, background: "#f5f1ee" }} />
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div style={{ height: 10, background: "#f5f1ee", borderRadius: 999, width: "30%" }} />
      <div style={{ height: 16, background: "#f5f1ee", borderRadius: 8, width: "82%" }} />
      <div style={{ height: 13, background: "#f5f1ee", borderRadius: 8, width: "55%" }} />
      <div style={{ height: 13, background: "#f5f1ee", borderRadius: 8, width: "68%" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
        <div style={{ height: 18, background: "#f5f1ee", borderRadius: 999, width: "30%" }} />
        <div style={{ height: 18, background: "#f5f1ee", borderRadius: 999, width: "28%" }} />
      </div>
    </div>
  </div>
);

// ─── EVENT CARD ───────────────────────────────────────────────────────────
const EventCard = ({ event, delay = 0 }) => {
  const minPrice = getMinPrice(event);
  const status   = getStatusInfo(event.status);
  const total    = getTotalTickets(event);
  const sold     = getSoldTickets(event);
  const pct      = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;

  return (
    <Link to={`/event/${event._id}`} className="hp-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="hp-card-img-wrap">
        <img src={getImageUrl(event.image)} alt={event.title} className="hp-card-img"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop"; }} />
        <div className="hp-card-grad" />
        {event.category && (
          <span className="hp-card-cat"><Tag style={{ width: 9, height: 9 }} /> {event.category}</span>
        )}
        <span className="hp-card-status" style={{ color: status.color, background: status.bg }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: status.color, display: "inline-block", flexShrink: 0 }} />
          {status.label}
        </span>
      </div>
      <div className="hp-card-body">
        <h3 className="hp-card-title">{event.title}</h3>
        {event.description && <p className="hp-card-desc">{event.description}</p>}
        <div className="hp-card-meta">
          <span><Calendar style={{ width: 13, height: 13, color: "#d1d5db", flexShrink: 0 }} />
            {fmtDate(event.startDate)}{fmtTime(event.startDate) && <span style={{ color: "#d1d5db" }}> · {fmtTime(event.startDate)}</span>}
          </span>
          {event.endDate && <span><Clock style={{ width: 13, height: 13, color: "#d1d5db", flexShrink: 0 }} />Đến {fmtDate(event.endDate)}</span>}
          <span><MapPin style={{ width: 13, height: 13, color: "#d1d5db", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.location || "Chưa cập nhật"}</span>
          </span>
          {event.organizer && (
            <span><Users style={{ width: 13, height: 13, color: "#d1d5db", flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {typeof event.organizer === "string" ? event.organizer : event.organizer?.name}
              </span>
            </span>
          )}
        </div>
        {event.ticketTypes?.length > 0 && (
          <div className="hp-ticket-tags">
            {event.ticketTypes.slice(0, 2).map((t, i) => (
              <span key={i} className="hp-ticket-tag"><Ticket style={{ width: 10, height: 10 }} /> {t.name}: {fmtPrice(t.price)}</span>
            ))}
            {event.ticketTypes.length > 2 && (
              <span className="hp-ticket-tag" style={{ background: "#f3f4f6", color: "#6b7280" }}>+{event.ticketTypes.length - 2}</span>
            )}
          </div>
        )}
        {total > 0 && (
          <div style={{ marginBottom: "0.6rem" }}>
            <div style={{ height: 4, background: "#f0ece8", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#f97316,#a855f7)", borderRadius: 999 }} />
            </div>
            <p style={{ color: "#9ca3af", fontSize: "0.68rem", marginTop: "0.2rem" }}>{sold}/{total} vé · {pct}%</p>
          </div>
        )}
        <div className="hp-card-footer">
          <div>
            <span style={{ color: "#9ca3af", fontSize: "0.68rem", display: "block" }}>Từ</span>
            <span className="hp-card-price">{fmtPrice(minPrice)}</span>
          </div>
          <span className="hp-cta-btn">Đặt vé <ArrowRight style={{ width: 13, height: 13 }} /></span>
        </div>
      </div>
    </Link>
  );
};

// ─── FEATURED CARD ────────────────────────────────────────────────────────
const FeaturedCard = ({ event }) => {
  const minPrice  = getMinPrice(event);
  const status    = getStatusInfo(event.status);
  const total     = getTotalTickets(event);
  const sold      = getSoldTickets(event);
  const pct       = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const startTime = fmtTime(event.startDate);
  const endTime   = fmtTime(event.endDate);

  return (
    <Link to={`/event/${event._id}`} className="hp-featured">
      <img src={getImageUrl(event.image)} alt={event.title} className="hp-featured-img"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&auto=format&fit=crop"; }} />
      <div className="hp-featured-grad" />
      <div className="hp-featured-top">
        <span className="hp-featured-hot"><Flame style={{ width: 12, height: 12 }} /> Nổi bật</span>
        {event.category && (
          <span style={{ background: "rgba(255,255,255,0.13)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", fontSize: "0.7rem", padding: "0.25rem 0.7rem", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <Tag style={{ width: 10, height: 10 }} /> {event.category}
          </span>
        )}
        <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: "0.35rem", color: status.color, background: status.bg }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, display: "inline-block", animation: "hpPulse2 2s infinite" }} />{status.label}
        </span>
      </div>
      <div className="hp-featured-body">
        <h2 className="hp-featured-title">{event.title}</h2>
        {event.description && <p className="hp-featured-desc">{event.description}</p>}
        <div className="hp-featured-meta">
          <span><Calendar style={{ width: 14, height: 14 }} />{fmtDate(event.startDate)}{startTime && ` · ${startTime}`}{endTime && ` – ${endTime}`}</span>
          <span><MapPin style={{ width: 14, height: 14 }} />{event.location}</span>
          {event.organizer && (
            <span><Users style={{ width: 14, height: 14 }} />{typeof event.organizer === "string" ? event.organizer : event.organizer?.name}</span>
          )}
        </div>
        {event.ticketTypes?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.9rem" }}>
            {event.ticketTypes.map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", padding: "0.22rem 0.6rem", borderRadius: 999 }}>
                <Ticket style={{ width: 10, height: 10 }} /> {t.name}: {fmtPrice(t.price)}
              </span>
            ))}
          </div>
        )}
        {total > 0 && (
          <div style={{ marginBottom: "0.9rem" }}>
            <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 999, overflow: "hidden", marginBottom: "0.28rem" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#f97316,#a855f7)", borderRadius: 999 }} />
            </div>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem" }}>{sold}/{total} vé đã bán · {pct}%</span>
          </div>
        )}
        <div className="hp-featured-footer">
          <div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "block" }}>Từ</span>
            <span className="hp-featured-price">{fmtPrice(minPrice)}</span>
          </div>
          <span className="hp-featured-cta">Đặt vé ngay <ArrowRight style={{ width: 15, height: 15 }} /></span>
        </div>
      </div>
    </Link>
  );
};

// ─── UPCOMING CARD ────────────────────────────────────────────────────────
const UpcomingCard = ({ event }) => {
  const minPrice  = getMinPrice(event);
  const total     = getTotalTickets(event);
  const sold      = getSoldTickets(event);
  const pct       = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const startTime = fmtTime(event.startDate);

  return (
    <Link to={`/event/${event._id}`} className="hp-upcoming-card">
      <div className="hp-upcoming-img-wrap">
        <img src={getImageUrl(event.image)} alt={event.title} className="hp-upcoming-img"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop"; }} />
        <div className="hp-upcoming-date-badge">{fmtDate(event.startDate)}</div>
      </div>
      <div className="hp-upcoming-body">
        {event.category && (
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", padding: "0.18rem 0.6rem", borderRadius: 999, marginBottom: "0.35rem" }}>{event.category}</span>
        )}
        <h3 className="hp-upcoming-title">{event.title}</h3>
        {event.description && <p className="hp-upcoming-desc">{event.description}</p>}
        <div className="hp-upcoming-meta">
          {startTime && <span><Clock style={{ width: 12, height: 12 }} />{startTime}</span>}
          <span><MapPin style={{ width: 12, height: 12 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.location}</span>
          </span>
          {event.organizer && (
            <span><Users style={{ width: 12, height: 12 }} />
              {typeof event.organizer === "string" ? event.organizer : event.organizer?.name}
            </span>
          )}
        </div>
        {total > 0 && (
          <div style={{ margin: "0.45rem 0" }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden", marginBottom: "0.22rem" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#f97316,#a855f7)", borderRadius: 999 }} />
            </div>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>{sold}/{total} vé · {pct}%</span>
          </div>
        )}
        <div className="hp-upcoming-footer">
          <span className="hp-upcoming-price">{fmtPrice(minPrice)}</span>
          <span className="hp-upcoming-cta">Đặt vé <ArrowRight style={{ width: 12, height: 12 }} /></span>
        </div>
      </div>
    </Link>
  );
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────
const ARTISTS = [
  { id: 1, name: "Sơn Tùng M-TP",    genre: "V-Pop",          events: 12, color: "#f97316", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80" },
  { id: 2, name: "Hoàng Thùy Linh",  genre: "Pop / Electronic",events: 8,  color: "#a855f7", img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80" },
  { id: 3, name: "Đen Vâu",          genre: "Hip-hop / Rap",   events: 15, color: "#ec4899", img: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&auto=format&fit=crop&q=80" },
  { id: 4, name: "Mỹ Tâm",           genre: "Ballad / Pop",    events: 20, color: "#06b6d4", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80" },
  { id: 5, name: "MCK",              genre: "Hip-hop",          events: 6,  color: "#84cc16", img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&auto=format&fit=crop&q=80" },
  { id: 6, name: "Tlinh",            genre: "R&B / Rap",        events: 9,  color: "#f43f5e", img: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&auto=format&fit=crop&q=80" },
];

const TESTIMONIALS = [
  { id: 1, name: "Nguyễn Minh Anh",  role: "Tín đồ concert",     avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop", rating: 5, text: "Mua vé quá nhanh và tiện lợi! Đặt được vé show Sơn Tùng trong vòng 2 phút, không lo cháy vé như các nền tảng khác nữa.", event: "Sơn Tùng M-TP Concert 2024" },
  { id: 2, name: "Trần Đức Huy",     role: "Người yêu nhạc Jazz", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop", rating: 5, text: "Giao diện rõ ràng, thông tin sự kiện đầy đủ. Đặc biệt phần sơ đồ chỗ ngồi giúp tôi chọn vé dễ dàng hơn rất nhiều.", event: "Hà Nội Jazz Night" },
  { id: 3, name: "Lê Thị Phương",    role: "Fan K-Pop",           avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop", rating: 5, text: "Lần đầu dùng mà đã nghiện! Thanh toán an toàn, vé điện tử nhận ngay qua email. Sẽ giới thiệu cho bạn bè.", event: "Aespa World Tour – HCM" },
  { id: 4, name: "Phạm Quang Minh",  role: "Nhiếp ảnh sự kiện",  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop", rating: 5, text: "Là photographer hay đi sự kiện, tôi cần thông tin chính xác về địa điểm & giờ giấc. Trang này cung cấp đủ mọi thứ cần.", event: "Nhiều sự kiện" },
];

const WHY_US = [
  { icon: <Zap style={{width:22,height:22}} />,           title: "Đặt vé siêu tốc",    desc: "Chỉ 3 bước để hoàn tất: chọn vé → thanh toán → nhận vé. Toàn bộ dưới 2 phút.",    color: "#f97316" },
  { icon: <Shield style={{width:22,height:22}} />,         title: "Bảo mật tuyệt đối",  desc: "Cổng thanh toán đạt chuẩn PCI-DSS. Mã hóa SSL 256-bit. Hoàn tiền nếu sự kiện hủy.", color: "#a855f7" },
  { icon: <BadgeCheck style={{width:22,height:22}} />,     title: "Vé chính hãng 100%", desc: "Mỗi vé có mã QR độc nhất, chống làm giả. Được xác thực trực tiếp với ban tổ chức.",  color: "#ec4899" },
  { icon: <HeartHandshake style={{width:22,height:22}} />, title: "Hỗ trợ 24/7",        desc: "Đội ngũ CSKH luôn trực. Chat trực tiếp hoặc hotline — phản hồi trong vòng 5 phút.",  color: "#06b6d4" },
  { icon: <Gift style={{width:22,height:22}} />,           title: "Ưu đãi thành viên",  desc: "Tích điểm mỗi lần đặt vé. Đổi quà, vé VIP và nhiều phần thưởng hấp dẫn khác.",      color: "#84cc16" },
  { icon: <Music style={{width:22,height:22}} />,          title: "Sự kiện đa dạng",    desc: "Từ concert nhạc sống đến festival văn hóa, thể thao, hội thảo — tất cả một nơi.",    color: "#f43f5e" },
];

// ─── ARTIST CARD ─────────────────────────────────────────────────────────
const ArtistCard = ({ artist, idx }) => (
  <div className="hp-artist-card" style={{ animationDelay: `${idx * 70}ms` }}>
    <div className="hp-artist-img-wrap" style={{ "--ac": artist.color }}>
      <img src={artist.img} alt={artist.name} className="hp-artist-img"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop"; }} />
      <div className="hp-artist-overlay" />
      <div className="hp-artist-ring" />
    </div>
    <div className="hp-artist-info">
      <p className="hp-artist-name">{artist.name}</p>
      <p className="hp-artist-genre">{artist.genre}</p>
      <span className="hp-artist-badge" style={{ background: artist.color + "22", color: artist.color }}>
        <Music style={{ width: 9, height: 9 }} /> {artist.events} sự kiện
      </span>
    </div>
  </div>
);

// ─── TESTIMONIAL CARD ─────────────────────────────────────────────────────
const TestiCard = ({ t, idx }) => (
  <div className="hp-testi-card" style={{ animationDelay: `${idx * 80}ms` }}>
    <div className="hp-testi-quote-icon"><Quote style={{ width: 20, height: 20 }} /></div>
    <p className="hp-testi-text">"{t.text}"</p>
    <div className="hp-testi-stars">
      {[...Array(t.rating)].map((_, i) => (
        <Star key={i} style={{ width: 13, height: 13, fill: "#f97316", color: "#f97316" }} />
      ))}
    </div>
    <div className="hp-testi-footer">
      <img src={t.avatar} alt={t.name} className="hp-testi-avatar"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop"; }} />
      <div>
        <p className="hp-testi-name">{t.name}</p>
        <p className="hp-testi-role">{t.role} · <span style={{ opacity: 0.6 }}>{t.event}</span></p>
      </div>
    </div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
const HomePage = () => {
  const [events, setEvents]           = useState([]);
  const [categories, setCategories]   = useState([]);
  const [searchParams]                = useSearchParams();
  const [loading, setLoading]         = useState(true);
  const [showAllCats, setShowAllCats] = useState(false);
  const [visible, setVisible]         = useState(new Set());
  const observerRef                   = useRef(null);
  const INITIAL_CAT_COUNT             = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res  = await axios.get("http://localhost:8000/api/events");
        let data   = res.data?.data || res.data || [];
        if (!Array.isArray(data)) data = [];

        const cats = [...new Set(data.map(e => e.category).filter(Boolean))];
        setCategories(cats);

        const catFilter = searchParams.get("category");
        const search    = searchParams.get("search");
        if (catFilter) data = data.filter(e => e.category === catFilter);
        if (search)    data = data.filter(e =>
          e.title?.toLowerCase().includes(search.toLowerCase()) ||
          e.location?.toLowerCase().includes(search.toLowerCase())
        );
        setEvents(data);
      } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(prev => new Set([...prev, e.target.id])); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll("[data-anim]").forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, [loading, showAllCats]);

  const vis = (id) => ({
    opacity: visible.has(id) ? 1 : 0,
    transform: visible.has(id) ? "translateY(0)" : "translateY(28px)",
  });

  const catFilter = searchParams.get("category");
  const search    = searchParams.get("search");

  const groupedEvents = (() => {
    if (catFilter) return [{ category: catFilter, events: events.slice(0, 12) }];
    return categories
      .map(cat => ({ category: cat, events: events.filter(e => e.category === cat).slice(0, 8) }))
      .filter(g => g.events.length > 0);
  })();

  const featuredEvent  = events[0];
  const hotEvents      = events.slice(1, 7);
  const upcomingEvents = [...events]
    .filter(e => e.startDate && new Date(e.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 4);

  return (
    <div className="hp-root">
      <style>{CSS}</style>

      {/* ── HERO ─── */}
      <section className="hp-hero">
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1800&auto=format&fit=crop&q=80"
          alt="hero" className="hp-hero-img" />
        <div className="hp-hero-grad" />
        <div className="hp-hero-noise" />
        <div className="hp-hero-content">
          <div className="hp-hero-eyebrow">
            <Sparkles style={{ width: 14, height: 14 }} /> Nền tảng sự kiện hàng đầu Việt Nam
          </div>
          <h1 className="hp-hero-title">
            Khám phá sự kiện<br />
            <span className="hp-hero-accent">dành cho bạn</span>
          </h1>
          <p className="hp-hero-sub">
            Hàng trăm sự kiện âm nhạc, thể thao, văn hóa mỗi tháng —
            đặt vé nhanh chóng, an toàn, ngay hôm nay.
          </p>

          <form className="hp-search" onSubmit={e => {
            e.preventDefault();
            const q = e.target.q.value.trim();
            if (q) window.location.href = `/?search=${encodeURIComponent(q)}`;
          }}>
            <Search style={{ width: 18, height: 18, color: "#9ca3af", marginLeft: "1rem", flexShrink: 0 }} />
            <input name="q" placeholder="Tìm sự kiện, địa điểm, nghệ sĩ..."
              className="hp-search-input" defaultValue={search || ""} />
            <button type="submit" className="hp-search-btn">Tìm kiếm</button>
          </form>

          <div className="hp-stats">
            {[
              { icon: <TrendingUp style={{ width: 14, height: 14 }} />, val: `${events.length || "100"}+`, label: "Sự kiện" },
              { icon: <Users style={{ width: 14, height: 14 }} />,      val: "10K+",                      label: "Người dùng" },
              { icon: <Star style={{ width: 14, height: 14 }} />,       val: "4.9★",                      label: "Đánh giá" },
            ].map((s, i) => (
              <div key={i} className="hp-stat">
                {s.icon}
                <span className="hp-stat-val">{s.val}</span>
                <span className="hp-stat-div" />
                <span style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.78rem" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS (sticky) ─── */}
      <nav className="hp-cats-nav">
        <div className="hp-cats-inner">
          <span className="hp-cats-label"><Tag style={{ width: 12, height: 12 }} /> Danh mục:</span>
          <Link to="/" className={`hp-cat-pill${!catFilter ? " hp-cat-active" : ""}`}>Tất cả</Link>
          {categories.map(cat => (
            <Link key={cat} to={`/?category=${encodeURIComponent(cat)}`}
              className={`hp-cat-pill${catFilter === cat ? " hp-cat-active" : ""}`}>{cat}</Link>
          ))}
        </div>
      </nav>

      {/* ── FEATURED ─── */}
      <section className="hp-section" style={{ background: "#fffaf7" }}>
        <div id="hp-feat" data-anim className="hp-container"
          style={{ transition: "all 0.7s ease", ...vis("hp-feat") }}>
          <div className="hp-sec-header">
            <div>
              <p className="hp-sec-eye"><Flame style={{ width: 12, height: 12, display: "inline", marginRight: 3 }} />Được yêu thích nhất</p>
              <h2 className="hp-sec-title">Sự kiện nổi bật</h2>
            </div>
            <Link to="/events" className="hp-see-all">Xem tất cả <ChevronRight style={{ width: 15, height: 15 }} /></Link>
          </div>
          {loading
            ? <div style={{ height: "clamp(300px,44vw,500px)", background: "#f5f1ee", borderRadius: 22, animation: "hpPulse 1.6s ease-in-out infinite" }} />
            : featuredEvent ? <FeaturedCard event={featuredEvent} /> : <div className="hp-empty">Chưa có sự kiện nổi bật</div>
          }
        </div>

        {/* Horizontal scroll */}
        {!loading && hotEvents.length > 0 && (
          <div id="hp-hot" data-anim style={{ marginTop: "2rem", transition: "all 0.7s 0.12s ease", ...vis("hp-hot") }}>
            <div className="hp-scroll">
              {hotEvents.map(event => (
                <Link key={event._id} to={`/event/${event._id}`} className="hp-scroll-card">
                  <div style={{ height: 145, overflow: "hidden", position: "relative" }}>
                    <img src={getImageUrl(event.image)} alt={event.title} className="hp-scroll-img"
                      onError={e => { e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop"; }} />
                    {event.category && (
                      <span style={{ position: "absolute", bottom: "0.5rem", left: "0.5rem", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.62rem", padding: "0.16rem 0.48rem", borderRadius: 999 }}>{event.category}</span>
                    )}
                  </div>
                  <div style={{ padding: "0.8rem" }}>
                    <p className="hp-scroll-title">{event.title}</p>
                    <div className="hp-scroll-meta">
                      <span><Calendar style={{ width: 11, height: 11 }} />{fmtDate(event.startDate)}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />{event.location}
                      </span>
                    </div>
                    {/* Giá dùng gradient text */}
                    <p style={{ fontWeight: 800, fontSize: "0.8rem", marginTop: "0.35rem" }} className="hp-gradient-text">{fmtPrice(getMinPrice(event))}</p>
                  </div>
                </Link>
              ))}
              <Link to="/events" className="hp-scroll-more">
                <div className="hp-scroll-more-circle"><ChevronRight style={{ width: 18, height: 18 }} /></div>
                <span style={{ fontSize: "0.76rem", fontWeight: 600 }}>Xem thêm</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── UPCOMING ─── */}
      {(loading || upcomingEvents.length > 0) && (
        <section className="hp-section hp-dark">
          <div className="hp-blob hp-blob1" />
          <div className="hp-blob hp-blob2" />
          <div id="hp-upcoming" data-anim className="hp-container"
            style={{ position: "relative", zIndex: 10, transition: "all 0.7s ease", ...vis("hp-upcoming") }}>
            <div className="hp-sec-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#f97316,#a855f7)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Clock style={{ width: 20, height: 20, color: "#fff" }} />
                </div>
                <h2 className="hp-sec-title" style={{ color: "#fff" }}>Sắp diễn ra</h2>
              </div>
              <Link to="/events" className="hp-see-all" style={{ color: "rgba(255,255,255,0.38)" }}>
                Xem thêm <ChevronRight style={{ width: 15, height: 15 }} />
              </Link>
            </div>
            <div className="hp-upcoming-grid">
              {loading
                ? [...Array(4)].map((_, i) => <div key={i} style={{ height: 158, background: "rgba(255,255,255,0.06)", borderRadius: 18, animation: "hpPulse 1.6s ease-in-out infinite" }} />)
                : upcomingEvents.map(event => <UpcomingCard key={event._id} event={event} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* ── BY CATEGORY ─── */}
      <section className="hp-section" style={{ background: "#fff" }}>
        <div className="hp-container">
          {catFilter && (
            <h1 style={{ fontFamily: "var(--font-heading,'Playfair Display',serif)", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 900, textAlign: "center", color: "#1a1a1a", marginBottom: "2.5rem" }}>
              Sự kiện: {catFilter}
            </h1>
          )}

          {!loading && groupedEvents.length === 0 && (
            <div className="hp-empty" style={{ padding: "5rem 1rem" }}>
              <Search style={{ width: 44, height: 44, color: "#e5e7eb", marginBottom: "1rem" }} />
              <p style={{ fontWeight: 600, color: "#9ca3af", marginBottom: "0.5rem" }}>Không tìm thấy sự kiện nào</p>
              <Link to="/" style={{ fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }} className="hp-gradient-text">Xem tất cả sự kiện →</Link>
            </div>
          )}

          {(showAllCats ? groupedEvents : groupedEvents.slice(0, INITIAL_CAT_COUNT)).map((group, gi) => (
            <section key={group.category} id={`hp-cat-${gi}`} data-anim
              style={{ marginBottom: "3.5rem", transition: `all 0.7s ${gi * 80}ms ease`, ...vis(`hp-cat-${gi}`) }}>
              <div className="hp-cat-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 4, height: 28, background: "linear-gradient(180deg,#f97316,#a855f7)", borderRadius: 999 }} />
                  <h2 style={{ fontFamily: "var(--font-heading,'Playfair Display',serif)", fontSize: "clamp(1.15rem,2.5vw,1.4rem)", fontWeight: 800, color: "#1a1a1a" }}>{group.category}</h2>
                  <span style={{ background: "linear-gradient(135deg,#fff3e8,#f3e8ff)", color: "#a855f7", fontSize: "0.68rem", fontWeight: 700, padding: "0.14rem 0.48rem", borderRadius: 999 }}>{group.events.length}</span>
                </div>
                <Link to={`/?category=${encodeURIComponent(group.category)}`} className="hp-see-all">
                  Xem thêm <ChevronRight style={{ width: 15, height: 15 }} />
                </Link>
              </div>
              <div className="hp-grid">
                {loading
                  ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
                  : group.events.map((event, i) => <EventCard key={event._id} event={event} delay={i * 50} />)
                }
              </div>
            </section>
          ))}

          {!catFilter && groupedEvents.length > INITIAL_CAT_COUNT && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "0.5rem" }}>
              <button onClick={() => {
                if (showAllCats) {
                  setShowAllCats(false);
                  document.getElementById("hp-cat-0")?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else setShowAllCats(true);
              }} className="hp-show-more">
                {showAllCats
                  ? <><ChevronDown style={{ width: 15, height: 15, transform: "rotate(180deg)" }} /> Thu gọn</>
                  : <><ChevronDown style={{ width: 15, height: 15 }} /> Xem thêm {groupedEvents.length - INITIAL_CAT_COUNT} danh mục</>
                }
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── NGHỆ SĨ NỔI BẬT ─── */}
      <section className="hp-section hp-artists-section">
        <div className="hp-artists-noise" />
        <div id="hp-artists" data-anim className="hp-container"
          style={{ position: "relative", zIndex: 2, transition: "all 0.7s ease", ...vis("hp-artists") }}>
          <div className="hp-sec-header">
            <div>
              <p className="hp-sec-eye"><Music style={{ width: 12, height: 12, display: "inline", marginRight: 3 }} />Line-up đặc sắc</p>
              <h2 className="hp-sec-title">Nghệ sĩ nổi bật</h2>
            </div>
            <Link to="/events" className="hp-see-all">
              Khám phá thêm <ChevronRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
          <div className="hp-artists-grid">
            {ARTISTS.map((a, i) => <ArtistCard key={a.id} artist={a} idx={i} />)}
          </div>
        </div>
      </section>

      {/* ── TẠI SAO CHỌN CHÚNG TÔI ─── */}
      <section className="hp-section hp-why-section">
        <div className="hp-why-blob1" /><div className="hp-why-blob2" />
        <div id="hp-why" data-anim className="hp-container"
          style={{ position: "relative", zIndex: 2, transition: "all 0.7s ease", ...vis("hp-why") }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p className="hp-sec-eye" style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Cam kết của chúng tôi
            </p>
            <h2 className="hp-sec-title" style={{ color: "#fff" }}>Tại sao chọn <span className="hp-hero-accent">TicketVN?</span></h2>
            <p style={{ color: "rgba(255,255,255,0.45)", marginTop: "0.6rem", fontSize: "0.95rem", maxWidth: 480, margin: "0.6rem auto 0" }}>
              Hơn 10.000 người dùng tin tưởng mỗi tháng. Đây là lý do.
            </p>
          </div>
          <div className="hp-why-grid">
            {WHY_US.map((w, i) => (
              <div key={i} className="hp-why-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="hp-why-icon" style={{ background: w.color + "22", color: w.color }}>
                  {w.icon}
                </div>
                <h3 className="hp-why-title">{w.title}</h3>
                <p className="hp-why-desc">{w.desc}</p>
                <div className="hp-why-line" style={{ background: `linear-gradient(90deg, ${w.color}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ĐÁNH GIÁ NGƯỜI DÙNG ─── */}
      <section className="hp-section" style={{ background: "#fffaf7", overflow: "hidden" }}>
        <div id="hp-testi" data-anim className="hp-container"
          style={{ transition: "all 0.7s ease", ...vis("hp-testi") }}>
          <div className="hp-sec-header">
            <div>
              <p className="hp-sec-eye"><Star style={{ width: 12, height: 12, display: "inline", marginRight: 3 }} />Khách hàng nói gì</p>
              <h2 className="hp-sec-title">Hàng nghìn người<br />đã tin tưởng chúng tôi</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fff", border: "1px solid #f0ece8", padding: "0.6rem 1.1rem", borderRadius: 999, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex" }}>
                {[...Array(5)].map((_, i) => <Star key={i} style={{ width: 14, height: 14, fill: "#f97316", color: "#f97316" }} />)}
              </div>
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>4.9</span>
              <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>/ 5.0</span>
            </div>
          </div>
          <div className="hp-testi-grid">
            {TESTIMONIALS.map((t, i) => <TestiCard key={t.id} t={t} idx={i} />)}
          </div>
        </div>
      </section>

      {/* ── TỔ CHỨC SỰ KIỆN / FOOTER CTA ─── */}
      <section className="hp-footer-cta-section">
        <div className="hp-footer-cta-bg" />

        {/* top split */}
        <div id="hp-cta" data-anim className="hp-container hp-footer-cta-split"
          style={{ transition: "all 0.7s ease", ...vis("hp-cta") }}>

          {/* LEFT – dành cho ban tổ chức */}
          <div className="hp-fcta-left">
            <span className="hp-fcta-tag"><Zap style={{ width: 12, height: 12 }} /> Dành cho ban tổ chức</span>
            <h2 className="hp-fcta-title">Bán vé sự kiện<br />của bạn cùng chúng tôi</h2>
            <p className="hp-fcta-desc">
              Tạo sự kiện, quản lý vé và theo dõi doanh thu — tất cả trong một nền tảng. 
              Miễn phí đăng ký, chỉ tính phí khi bán được vé.
            </p>
            <div className="hp-fcta-perks">
              {[
                { icon: <BadgeCheck style={{ width: 15, height: 15 }} />, text: "Tạo sự kiện không giới hạn" },
                { icon: <Shield style={{ width: 15, height: 15 }} />,     text: "Thanh toán an toàn, rút tiền nhanh" },
                { icon: <TrendingUp style={{ width: 15, height: 15 }} />, text: "Dashboard phân tích real-time" },
                { icon: <HeartHandshake style={{ width: 15, height: 15 }} />, text: "Hỗ trợ 24/7 từ đội ngũ chuyên nghiệp" },
              ].map((p, i) => (
                <div key={i} className="hp-fcta-perk">
                  <span className="hp-fcta-perk-icon">{p.icon}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
            <div className="hp-fcta-actions">
              <Link to="/register" className="hp-fcta-btn-primary">
                Bắt đầu miễn phí <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
              <Link to="/pricing" className="hp-fcta-btn-ghost">
                Xem bảng giá
              </Link>
            </div>
          </div>

          {/* RIGHT – mockup card */}
          <div className="hp-fcta-right">
            <div className="hp-fcta-mockup">
              <div className="hp-fcta-mockup-bar">
                <span /><span /><span />
                <div className="hp-fcta-mockup-url">ticketvn.vn/dashboard</div>
              </div>
              <div className="hp-fcta-mockup-body">
                <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tổng quan sự kiện</p>
                <div className="hp-fcta-stat-row">
                  {[
                    { label: "Vé đã bán", val: "1,284", up: true },
                    { label: "Doanh thu", val: "₫48.2M", up: true },
                    { label: "Lượt xem", val: "9,310", up: false },
                  ].map((s, i) => (
                    <div key={i} className="hp-fcta-stat-box">
                      <span className="hp-fcta-stat-val">{s.val}</span>
                      <span className="hp-fcta-stat-lbl">{s.label}</span>
                      <span style={{ fontSize: "0.58rem", color: s.up ? "#4ade80" : "#f87171" }}>{s.up ? "↑ 12%" : "↓ 3%"}</span>
                    </div>
                  ))}
                </div>
                {/* mini bar chart */}
                <div className="hp-fcta-bars">
                  {[40, 65, 50, 80, 70, 90, 60, 100, 75, 88, 55, 95].map((h, i) => (
                    <div key={i} className="hp-fcta-bar-wrap">
                      <div className="hp-fcta-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} />
                    </div>
                  ))}
                </div>
                {/* mini event list */}
                <div className="hp-fcta-events">
                  {[
                    { name: "Đêm nhạc acoustic Vol.3", sold: 87, total: 100 },
                    { name: "Workshop Nhiếp ảnh đường phố", sold: 43, total: 60 },
                    { name: "Comedy Night – HCM", sold: 210, total: 300 },
                  ].map((e, i) => (
                    <div key={i} className="hp-fcta-event-row">
                      <span className="hp-fcta-event-name">{e.name}</span>
                      <div className="hp-fcta-mini-bar">
                        <div style={{ width: `${Math.round(e.sold / e.total * 100)}%` }} className="hp-fcta-mini-fill" />
                      </div>
                      <span className="hp-fcta-event-pct">{Math.round(e.sold / e.total * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* floating badge */}
            <div className="hp-fcta-float-badge">
              <Star style={{ width: 12, height: 12, fill: "#fbbf24", color: "#fbbf24" }} />
              <span>4.9 · 2,400+ ban tổ chức tin dùng</span>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};

// ─── CSS ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap');

.hp-root { font-family: inherit; background:#fafaf9; color:#1a1a1a; overflow-x:hidden; }

/* ── GRADIENT UTILITY ── */
.hp-gradient-text {
  background: linear-gradient(135deg, #f97316, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* HERO */
.hp-hero { position:relative; height:clamp(520px,92svh,820px); overflow:hidden; background:#111; display:flex; align-items:flex-end; }
.hp-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:brightness(0.42) saturate(1.2); animation:hpZoom 14s ease-in-out infinite alternate; }
@keyframes hpZoom { from{transform:scale(1)} to{transform:scale(1.06)} }
.hp-hero-grad { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.45) 40%,rgba(0,0,0,0.08) 100%); }
.hp-hero-noise { position:absolute; inset:0; pointer-events:none; opacity:0.4; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"); }
.hp-hero-content { position:relative; z-index:10; padding:0 1.5rem 3.5rem; max-width:1200px; margin:0 auto; width:100%; }
@media(min-width:768px){ .hp-hero-content{ padding:0 2.5rem 5rem; } }
.hp-hero-eyebrow { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.18); backdrop-filter:blur(8px); color:rgba(255,255,255,0.85); font-size:0.74rem; font-weight:500; letter-spacing:0.04em; padding:0.35rem 0.9rem; border-radius:999px; margin-bottom:1rem; animation:hpFadeUp 0.6s ease both; }
.hp-hero-title { font-family:var(--font-heading,'Playfair Display',serif); font-size:clamp(2.4rem,7vw,5rem); font-weight:900; line-height:1.1; color:#fff; margin-bottom:1rem; animation:hpFadeUp 0.65s 0.08s ease both; }
.hp-hero-accent { background:linear-gradient(135deg,#f97316 0%,#a855f7 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-hero-sub { color:rgba(255,255,255,0.65); font-size:clamp(0.88rem,1.8vw,1.05rem); line-height:1.75; margin-bottom:1.85rem; animation:hpFadeUp 0.65s 0.15s ease both; }
@keyframes hpFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

/* SEARCH */
.hp-search { display:flex; align-items:center; background:rgba(255,255,255,0.97); border-radius:14px; max-width:540px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.3); animation:hpFadeUp 0.65s 0.22s ease both; }
.hp-search-input { flex:1; padding:0.95rem 0.8rem; background:transparent; outline:none; border:none; font-size:0.93rem; font-family:inherit; color:#111; }
.hp-search-input::placeholder { color:#9ca3af; }
.hp-search-btn { padding:0.95rem 1.5rem; flex-shrink:0; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; font-weight:700; font-size:0.88rem; border:none; cursor:pointer; font-family:inherit; transition:opacity 0.2s; }
.hp-search-btn:hover { opacity:0.9; }
.hp-stats { display:flex; flex-wrap:wrap; gap:0.5rem 1.4rem; margin-top:1.65rem; animation:hpFadeUp 0.65s 0.3s ease both; }
.hp-stat { display:flex; align-items:center; gap:0.4rem; color:rgba(255,255,255,0.6); font-size:0.8rem; }
.hp-stat-val { color:#fff; font-weight:700; font-size:0.93rem; }
.hp-stat-div { width:1px; height:11px; background:rgba(255,255,255,0.2); }

/* CATS NAV */
.hp-cats-nav { background:#fff; border-bottom:1px solid #f0ece8; position:sticky; top:0; z-index:40; backdrop-filter:blur(8px); }
.hp-cats-inner { max-width:1200px; margin:0 auto; padding:0.85rem 1.5rem; display:flex; align-items:center; gap:0.6rem; overflow-x:auto; scrollbar-width:none; }
.hp-cats-inner::-webkit-scrollbar { display:none; }
.hp-cats-label { display:flex; align-items:center; gap:0.3rem; color:#9ca3af; font-size:0.74rem; white-space:nowrap; flex-shrink:0; }
.hp-cat-pill { padding:0.35rem 1rem; border:1.5px solid #f0ece8; border-radius:999px; font-size:0.78rem; font-weight:500; color:#6b7280; white-space:nowrap; text-decoration:none; transition:all 0.18s; }
.hp-cat-pill:hover { background:linear-gradient(135deg,#f97316,#a855f7); border-color:transparent; color:#fff; }
.hp-cat-active { background:linear-gradient(135deg,#f97316,#a855f7) !important; border-color:transparent !important; color:#fff !important; }

/* SECTIONS */
.hp-section { padding:4.5rem 0; }
.hp-dark { background:#111118; position:relative; overflow:hidden; }
.hp-container { max-width:1200px; margin:0 auto; padding:0 1.5rem; }
@media(min-width:768px){ .hp-container{ padding:0 2.5rem; } }
.hp-sec-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:1.75rem; gap:1rem; }
.hp-sec-eye { color:#f97316; font-size:0.7rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:0.35rem; }
.hp-sec-title { font-family:var(--font-heading,'Playfair Display',serif); font-size:clamp(1.5rem,3vw,2.2rem); font-weight:900; color:#1a1a1a; line-height:1.15; }
.hp-see-all { display:flex; align-items:center; gap:0.25rem; color:#9ca3af; font-size:0.82rem; text-decoration:none; transition:color 0.2s; white-space:nowrap; flex-shrink:0; }
.hp-see-all:hover { background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-empty { text-align:center; padding:3rem 1rem; color:#9ca3af; }

/* FEATURED */
.hp-featured { display:block; position:relative; border-radius:22px; overflow:hidden; text-decoration:none; box-shadow:0 20px 60px rgba(0,0,0,0.1); transition:transform 0.5s,box-shadow 0.5s; }
.hp-featured:hover { transform:translateY(-3px); box-shadow:0 28px 72px rgba(0,0,0,0.15); }
.hp-featured-img { width:100%; height:clamp(300px,44vw,500px); object-fit:cover; filter:brightness(0.45) saturate(1.15); transition:transform 0.8s; }
.hp-featured:hover .hp-featured-img { transform:scale(1.04); }
.hp-featured-grad { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.2) 55%,transparent 100%); }
.hp-featured-top { position:absolute; top:1.25rem; left:1.25rem; display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap; }
.hp-featured-hot { display:inline-flex; align-items:center; gap:0.3rem; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; font-size:0.7rem; font-weight:800; padding:0.28rem 0.8rem; border-radius:999px; text-transform:uppercase; letter-spacing:0.05em; }
.hp-featured-body { position:absolute; bottom:0; left:0; right:0; padding:clamp(1.25rem,3vw,2.25rem); }
.hp-featured-title { font-family:var(--font-heading,'Playfair Display',serif); font-size:clamp(1.4rem,3.5vw,2.5rem); font-weight:900; color:#fff; line-height:1.15; margin-bottom:0.55rem; transition:color 0.3s; }
.hp-featured:hover .hp-featured-title { color:#fdba74; }
.hp-featured-desc { color:rgba(255,255,255,0.6); font-size:0.87rem; line-height:1.6; margin-bottom:0.85rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.hp-featured-meta { display:flex; flex-wrap:wrap; gap:0.5rem 1.5rem; margin-bottom:0.9rem; }
.hp-featured-meta span { display:flex; align-items:center; gap:0.4rem; color:rgba(255,255,255,0.6); font-size:0.8rem; }
.hp-featured-footer { display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.12); padding-top:0.95rem; }
.hp-featured-price { color:#fff; font-weight:800; font-size:1.35rem; }
.hp-featured-cta { display:inline-flex; align-items:center; gap:0.4rem; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; font-weight:700; font-size:0.88rem; padding:0.65rem 1.4rem; border-radius:12px; transition:opacity 0.2s,transform 0.2s; }
.hp-featured-cta:hover { opacity:0.9; transform:translateX(2px); }

/* SCROLL ROW */
.hp-scroll { display:flex; gap:0.85rem; overflow-x:auto; padding:0.5rem 1.5rem 1.25rem; scrollbar-width:none; }
@media(min-width:768px){ .hp-scroll{ padding:0.5rem 2.5rem 1.25rem; } }
.hp-scroll::-webkit-scrollbar { display:none; }
.hp-scroll-card { flex-shrink:0; width:208px; border-radius:18px; overflow:hidden; background:#fff; border:1px solid #f0ece8; box-shadow:0 2px 12px rgba(0,0,0,0.05); text-decoration:none; transition:transform 0.3s,box-shadow 0.3s; }
@media(min-width:640px){ .hp-scroll-card{ width:235px; } }
.hp-scroll-card:hover { transform:translateY(-4px); box-shadow:0 14px 36px rgba(0,0,0,0.1); }
.hp-scroll-img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s; }
.hp-scroll-card:hover .hp-scroll-img { transform:scale(1.08); }
.hp-scroll-title { font-weight:700; font-size:0.82rem; color:#1a1a1a; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition:color 0.2s; margin-bottom:0.35rem; }
.hp-scroll-card:hover .hp-scroll-title { background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-scroll-meta { display:flex; flex-direction:column; gap:0.2rem; font-size:0.68rem; color:#9ca3af; }
.hp-scroll-meta span { display:flex; align-items:center; gap:0.28rem; }
.hp-scroll-more { flex-shrink:0; width:125px; border-radius:18px; border:2px dashed #c4b5fd; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem; text-decoration:none; transition:border-color 0.2s,background 0.2s; margin-right:1rem; }
.hp-scroll-more { background: linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-scroll-more:hover { border-color:#a855f7; background:rgba(168,85,247,0.04); }
.hp-scroll-more-circle { width:38px; height:38px; border-radius:50%; border:2px solid #c4b5fd; display:flex; align-items:center; justify-content:center; transition:all 0.2s; color:#a855f7; -webkit-text-fill-color:initial; }
.hp-scroll-more:hover .hp-scroll-more-circle { border-color:transparent; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; }

/* BLOBS */
.hp-blob { position:absolute; border-radius:999px; filter:blur(80px); pointer-events:none; }
.hp-blob1 { width:480px; height:480px; background:#7c3aed; opacity:0.2; top:-100px; left:-80px; }
.hp-blob2 { width:380px; height:380px; background:#f97316; opacity:0.18; bottom:-60px; right:5%; }

/* UPCOMING */
.hp-upcoming-grid { display:grid; gap:1.1rem; grid-template-columns:1fr; }
@media(min-width:768px){ .hp-upcoming-grid{ grid-template-columns:1fr 1fr; } }
.hp-upcoming-card { display:flex; flex-direction:column; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:18px; overflow:hidden; text-decoration:none; transition:background 0.3s,border-color 0.3s,transform 0.3s; }
@media(min-width:480px){ .hp-upcoming-card{ flex-direction:row; } }
.hp-upcoming-card:hover { background:rgba(255,255,255,0.09); border-color:rgba(168,85,247,0.35); transform:translateY(-2px); }
.hp-upcoming-card:hover .hp-upcoming-img { transform:scale(1.06); }
.hp-upcoming-img-wrap { position:relative; width:100%; height:148px; flex-shrink:0; overflow:hidden; }
@media(min-width:480px){ .hp-upcoming-img-wrap{ width:155px; height:auto; } }
.hp-upcoming-img { width:100%; height:100%; object-fit:cover; transition:transform 0.6s; }
.hp-upcoming-card:hover .hp-upcoming-img { transform:scale(1.06); }
.hp-upcoming-date-badge { position:absolute; top:0.55rem; left:0.55rem; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; font-size:0.65rem; font-weight:800; padding:0.22rem 0.55rem; border-radius:999px; }
.hp-upcoming-body { padding:1rem; flex:1; display:flex; flex-direction:column; gap:0.32rem; }
.hp-upcoming-title { font-size:0.92rem; font-weight:700; color:#fff; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition:color 0.2s; }
.hp-upcoming-card:hover .hp-upcoming-title { color:#fdba74; }
.hp-upcoming-desc { color:rgba(255,255,255,0.4); font-size:0.73rem; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.hp-upcoming-meta { display:flex; flex-direction:column; gap:0.2rem; }
.hp-upcoming-meta span { display:flex; align-items:center; gap:0.3rem; color:rgba(255,255,255,0.42); font-size:0.71rem; }
.hp-upcoming-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:0.35rem; }
/* Giá upcoming dùng gradient text */
.hp-upcoming-price { font-weight:800; font-size:0.88rem; background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-upcoming-cta { display:flex; align-items:center; gap:0.25rem; color:rgba(255,255,255,0.38); font-size:0.73rem; transition:color 0.2s; }
.hp-upcoming-card:hover .hp-upcoming-cta { background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* EVENT CARDS */
.hp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(238px,1fr)); gap:1.15rem; }
.hp-card { background:#fff; border-radius:20px; overflow:hidden; border:1px solid #f0ece8; box-shadow:0 2px 14px rgba(0,0,0,0.04); text-decoration:none; display:block; transition:transform 0.4s,box-shadow 0.4s; animation:hpFadeUp 0.5s ease both; }
.hp-card:hover { transform:translateY(-5px); box-shadow:0 20px 50px rgba(0,0,0,0.1); }
.hp-card-img-wrap { position:relative; height:188px; overflow:hidden; }
.hp-card-img { width:100%; height:100%; object-fit:cover; transition:transform 0.6s; }
.hp-card:hover .hp-card-img { transform:scale(1.08); }
.hp-card-grad { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.42) 0%,transparent 60%); }
.hp-card-cat { position:absolute; bottom:0.55rem; left:0.55rem; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.15); color:#fff; font-size:0.63rem; font-weight:500; padding:0.18rem 0.5rem; border-radius:999px; display:inline-flex; align-items:center; gap:0.25rem; }
.hp-card-status { position:absolute; top:0.55rem; right:0.55rem; font-size:0.63rem; font-weight:700; padding:0.18rem 0.6rem; border-radius:999px; display:inline-flex; align-items:center; gap:0.3rem; }
.hp-card-body { padding:0.95rem 1.05rem 1.05rem; }
.hp-card-title { font-weight:700; font-size:0.93rem; color:#1a1a1a; margin-bottom:0.32rem; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition:color 0.2s; }
.hp-card:hover .hp-card-title { background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-card-desc { color:#9ca3af; font-size:0.75rem; line-height:1.5; margin-bottom:0.58rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.hp-card-meta { display:flex; flex-direction:column; gap:0.26rem; margin-bottom:0.62rem; }
.hp-card-meta span { display:flex; align-items:center; gap:0.32rem; color:#6b7280; font-size:0.75rem; }
.hp-ticket-tags { display:flex; flex-wrap:wrap; gap:0.28rem; margin-bottom:0.58rem; }
/* Ticket tag dùng gradient tím-cam nhẹ */
.hp-ticket-tag { display:inline-flex; align-items:center; gap:0.22rem; background:linear-gradient(135deg,#fff3e8,#f3e8ff); color:#a855f7; font-size:0.63rem; font-weight:600; padding:0.17rem 0.5rem; border-radius:999px; }
.hp-card-footer { display:flex; align-items:center; justify-content:space-between; border-top:1px solid #f9f0ea; padding-top:0.68rem; }
/* Giá card dùng gradient text */
.hp-card-price { font-weight:800; font-size:0.95rem; background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
/* CTA button gradient cam → tím (giống EventDetailPage) */
.hp-cta-btn { display:inline-flex; align-items:center; gap:0.25rem; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; font-size:0.7rem; font-weight:700; padding:0.37rem 0.82rem; border-radius:8px; transition:opacity 0.2s; }
.hp-cta-btn:hover { opacity:0.88; }

/* CAT SECTION */
.hp-cat-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.2rem; gap:1rem; }
.hp-show-more { display:inline-flex; align-items:center; gap:0.45rem; padding:0.7rem 1.75rem; border:2px solid #f0ece8; border-radius:999px; background:#fff; color:#6b7280; font-size:0.85rem; font-weight:500; font-family:inherit; cursor:pointer; transition:all 0.22s; }
.hp-show-more:hover { border-color:transparent; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; }

/* see-all trong dark section */
.hp-dark .hp-see-all:hover { background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* ── ARTIST SECTION ── */
.hp-artists-section { background:#0d0d14; position:relative; overflow:hidden; }
.hp-artists-noise { position:absolute; inset:0; pointer-events:none; opacity:0.055; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.hp-artists-section .hp-sec-title { color:#fff; }
.hp-artists-section .hp-sec-eye { color:#f97316; }
.hp-artists-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1.4rem 1rem; }
@media(min-width:480px){ .hp-artists-grid{ grid-template-columns:repeat(3,1fr); } }
@media(min-width:900px){ .hp-artists-grid{ grid-template-columns:repeat(6,1fr); } }
.hp-artist-card { display:flex; flex-direction:column; align-items:center; gap:0.65rem; cursor:pointer; animation:hpFadeUp 0.5s ease both; }
.hp-artist-card:hover .hp-artist-img { transform:scale(1.07); }
.hp-artist-card:hover .hp-artist-ring { opacity:1; transform:scale(1.04); }
.hp-artist-img-wrap { position:relative; width:108px; height:108px; border-radius:50%; }
@media(min-width:640px){ .hp-artist-img-wrap{ width:128px; height:128px; } }
.hp-artist-img { width:100%; height:100%; border-radius:50%; object-fit:cover; transition:transform 0.5s; position:relative; z-index:1; display:block; }
.hp-artist-overlay { position:absolute; inset:0; border-radius:50%; background:linear-gradient(135deg,rgba(249,115,22,0.25),rgba(168,85,247,0.25)); z-index:2; opacity:0; transition:opacity 0.3s; }
.hp-artist-card:hover .hp-artist-overlay { opacity:1; }
.hp-artist-ring { position:absolute; inset:-4px; border-radius:50%; border:3px solid transparent; background:linear-gradient(#0d0d14,#0d0d14) padding-box, linear-gradient(135deg,#f97316,#a855f7) border-box; opacity:0; transition:all 0.4s; z-index:0; }
.hp-artist-info { text-align:center; }
.hp-artist-name { font-weight:700; font-size:0.84rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
.hp-artist-genre { font-size:0.67rem; color:rgba(255,255,255,0.35); margin:0.1rem 0 0.3rem; white-space:nowrap; }
.hp-artist-badge { display:inline-flex; align-items:center; gap:0.28rem; font-size:0.62rem; font-weight:700; padding:0.15rem 0.5rem; border-radius:999px; }

/* ── WHY US SECTION ── */
.hp-why-section { background:#0a0a10; position:relative; overflow:hidden; }
.hp-why-blob1 { position:absolute; width:500px; height:500px; background:#7c3aed; opacity:0.12; border-radius:50%; filter:blur(90px); top:-120px; right:-80px; pointer-events:none; }
.hp-why-blob2 { position:absolute; width:400px; height:400px; background:#f97316; opacity:0.1; border-radius:50%; filter:blur(90px); bottom:-80px; left:5%; pointer-events:none; }
.hp-why-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
@media(min-width:640px){ .hp-why-grid{ grid-template-columns:1fr 1fr; } }
@media(min-width:1024px){ .hp-why-grid{ grid-template-columns:repeat(3,1fr); } }
.hp-why-card { position:relative; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:1.6rem; transition:background 0.3s,transform 0.3s,border-color 0.3s; overflow:hidden; animation:hpFadeUp 0.5s ease both; }
.hp-why-card:hover { background:rgba(255,255,255,0.08); transform:translateY(-4px); border-color:rgba(168,85,247,0.25); }
.hp-why-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; transition:transform 0.3s; }
.hp-why-card:hover .hp-why-icon { transform:scale(1.1) rotate(-5deg); }
.hp-why-title { font-weight:800; font-size:0.97rem; color:#fff; margin-bottom:0.5rem; }
.hp-why-desc { font-size:0.79rem; color:rgba(255,255,255,0.4); line-height:1.7; }
.hp-why-line { position:absolute; bottom:0; left:0; height:2px; width:0; transition:width 0.45s ease; border-radius:0; }
.hp-why-card:hover .hp-why-line { width:100%; }

/* ── TESTIMONIALS ── */
.hp-testi-grid { display:grid; grid-template-columns:1fr; gap:1.1rem; }
@media(min-width:640px){ .hp-testi-grid{ grid-template-columns:1fr 1fr; } }
@media(min-width:1024px){ .hp-testi-grid{ grid-template-columns:repeat(4,1fr); } }
.hp-testi-card { background:#fff; border:1px solid #f0ece8; border-radius:20px; padding:1.4rem; display:flex; flex-direction:column; gap:0.7rem; box-shadow:0 2px 16px rgba(0,0,0,0.05); transition:transform 0.35s,box-shadow 0.35s,border-color 0.35s; animation:hpFadeUp 0.5s ease both; position:relative; overflow:hidden; }
.hp-testi-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(249,115,22,0.04),rgba(168,85,247,0.04)); opacity:0; transition:opacity 0.3s; pointer-events:none; }
.hp-testi-card:hover { transform:translateY(-5px); box-shadow:0 18px 44px rgba(0,0,0,0.1); border-color:rgba(168,85,247,0.2); }
.hp-testi-card:hover::before { opacity:1; }
.hp-testi-quote-icon { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#fff3e8,#f3e8ff); display:flex; align-items:center; justify-content:center; color:#a855f7; flex-shrink:0; }
.hp-testi-text { font-size:0.83rem; line-height:1.72; color:#374151; flex:1; font-style:italic; }
.hp-testi-stars { display:flex; gap:2px; }
.hp-testi-footer { display:flex; align-items:center; gap:0.7rem; border-top:1px solid #f3f4f6; padding-top:0.8rem; margin-top:auto; }
.hp-testi-avatar { width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid transparent; background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#f97316,#a855f7) border-box; flex-shrink:0; }
.hp-testi-name { font-weight:700; font-size:0.82rem; color:#111; }
.hp-testi-role { font-size:0.67rem; color:#9ca3af; }

/* ── FOOTER CTA / ORGANIZER ── */
.hp-footer-cta-section { position:relative; overflow:hidden; }
.hp-footer-cta-bg { position:absolute; inset:0; background:linear-gradient(160deg,#0c001e 0%,#0f0f1a 45%,#0d0800 100%); }
.hp-footer-cta-split { position:relative; z-index:2; display:grid; grid-template-columns:1fr; gap:3rem; padding-top:5rem; padding-bottom:5rem; align-items:center; }
@media(min-width:960px){ .hp-footer-cta-split{ grid-template-columns:1fr 1fr; gap:4rem; } }

/* LEFT */
.hp-fcta-tag { display:inline-flex; align-items:center; gap:0.35rem; background:linear-gradient(135deg,rgba(249,115,22,0.18),rgba(168,85,247,0.18)); border:1px solid rgba(249,115,22,0.3); color:#fb923c; font-size:0.72rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; padding:0.32rem 0.85rem; border-radius:999px; margin-bottom:1.2rem; display:inline-flex; }
.hp-fcta-title { font-family:var(--font-heading,'Playfair Display',serif); font-size:clamp(1.9rem,4.5vw,3rem); font-weight:900; color:#fff; line-height:1.15; margin-bottom:1rem; }
.hp-fcta-desc { color:rgba(255,255,255,0.45); font-size:0.9rem; line-height:1.8; margin-bottom:1.8rem; max-width:440px; }
.hp-fcta-perks { display:flex; flex-direction:column; gap:0.7rem; margin-bottom:2rem; }
.hp-fcta-perk { display:flex; align-items:center; gap:0.65rem; color:rgba(255,255,255,0.7); font-size:0.84rem; }
.hp-fcta-perk-icon { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,rgba(249,115,22,0.2),rgba(168,85,247,0.2)); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; color:#fb923c; flex-shrink:0; }
.hp-fcta-actions { display:flex; flex-wrap:wrap; gap:0.8rem; align-items:center; }
.hp-fcta-btn-primary { display:inline-flex; align-items:center; gap:0.45rem; background:linear-gradient(135deg,#f97316,#a855f7); color:#fff; font-weight:700; font-size:0.9rem; padding:0.82rem 1.6rem; border-radius:14px; text-decoration:none; transition:opacity 0.2s,transform 0.2s; }
.hp-fcta-btn-primary:hover { opacity:0.88; transform:translateY(-2px); }
.hp-fcta-btn-ghost { display:inline-flex; align-items:center; gap:0.35rem; border:1.5px solid rgba(255,255,255,0.18); color:rgba(255,255,255,0.55); font-size:0.88rem; padding:0.8rem 1.4rem; border-radius:14px; text-decoration:none; transition:border-color 0.2s,color 0.2s; }
.hp-fcta-btn-ghost:hover { border-color:rgba(168,85,247,0.5); color:#fff; }

/* RIGHT – mockup */
.hp-fcta-right { position:relative; }
.hp-fcta-mockup { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:20px; overflow:hidden; backdrop-filter:blur(12px); box-shadow:0 32px 80px rgba(0,0,0,0.5); }
.hp-fcta-mockup-bar { background:rgba(255,255,255,0.06); padding:0.6rem 0.9rem; display:flex; align-items:center; gap:0.35rem; border-bottom:1px solid rgba(255,255,255,0.07); }
.hp-fcta-mockup-bar span { width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,0.15); flex-shrink:0; }
.hp-fcta-mockup-url { flex:1; background:rgba(255,255,255,0.06); border-radius:5px; padding:0.18rem 0.65rem; font-size:0.62rem; color:rgba(255,255,255,0.3); margin-left:0.5rem; }
.hp-fcta-mockup-body { padding:1.2rem 1.3rem 1.4rem; }
.hp-fcta-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:0.6rem; margin-bottom:1.1rem; }
.hp-fcta-stat-box { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:0.7rem 0.6rem; display:flex; flex-direction:column; gap:0.2rem; }
.hp-fcta-stat-val { font-weight:800; font-size:0.95rem; background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-fcta-stat-lbl { font-size:0.6rem; color:rgba(255,255,255,0.35); }
.hp-fcta-bars { display:flex; align-items:flex-end; gap:3px; height:52px; margin-bottom:1.1rem; }
.hp-fcta-bar-wrap { flex:1; height:100%; display:flex; align-items:flex-end; }
.hp-fcta-bar { width:100%; border-radius:3px 3px 0 0; background:linear-gradient(180deg,#a855f7,#f97316); opacity:0.7; animation:hpBarGrow 0.6s ease both; }
@keyframes hpBarGrow { from{height:0} }
.hp-fcta-events { display:flex; flex-direction:column; gap:0.55rem; }
.hp-fcta-event-row { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:0.5rem; }
.hp-fcta-event-name { font-size:0.66rem; color:rgba(255,255,255,0.55); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hp-fcta-mini-bar { width:70px; height:4px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; }
.hp-fcta-mini-fill { height:100%; background:linear-gradient(90deg,#f97316,#a855f7); border-radius:999px; }
.hp-fcta-event-pct { font-size:0.62rem; font-weight:700; color:#a855f7; width:28px; text-align:right; }

/* float badge */
.hp-fcta-float-badge { position:absolute; bottom:-14px; left:50%; transform:translateX(-50%); background:#fff; border-radius:999px; padding:0.4rem 1rem; display:inline-flex; align-items:center; gap:0.4rem; font-size:0.72rem; font-weight:600; color:#1a1a1a; box-shadow:0 8px 28px rgba(0,0,0,0.25); white-space:nowrap; }

/* footer strip */
.hp-footer-strip { border-top:1px solid rgba(255,255,255,0.07); position:relative; z-index:2; }
.hp-footer-strip-inner { display:flex; flex-direction:column; gap:0.8rem; padding-top:1.6rem; padding-bottom:1.8rem; align-items:center; text-align:center; }
@media(min-width:768px){ .hp-footer-strip-inner{ flex-direction:row; justify-content:space-between; text-align:left; gap:1rem; } }
.hp-footer-logo { font-weight:800; font-size:1rem; color:#fff; letter-spacing:-0.01em; }
.hp-footer-links { display:flex; flex-wrap:wrap; gap:0.3rem 1.2rem; justify-content:center; }
.hp-footer-link { color:rgba(255,255,255,0.38); font-size:0.8rem; text-decoration:none; transition:color 0.2s; }
.hp-footer-link:hover { background:linear-gradient(135deg,#f97316,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.hp-footer-copy { color:rgba(255,255,255,0.22); font-size:0.75rem; white-space:nowrap; }

@keyframes hpPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
@keyframes hpPulse2 { 0%,100%{opacity:1} 50%{opacity:0.35} }
`;

export default HomePage;