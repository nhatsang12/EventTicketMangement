import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Search, Tag, Ticket,
  Users, ArrowRight, ChevronDown, ChevronRight,
  Flame, Sparkles, TrendingUp, Star, Music, Shield,
  Zap, HeartHandshake, Quote, BadgeCheck, Gift, BarChart3,
  SlidersHorizontal, X, Check, DollarSign, ArrowUpDown
} from "lucide-react";


const TICKETS_JSON = [
  {
    "_id": { "$oid": "699879e3368dece455a7b336" },
    "event": { "$oid": "6998676d583716785f91782b" },
    "price": 100,
    // ... các field khác
  },
  {
    "_id": { "$oid": "699998a685ed6156a6221fb2" },
    "event": { "$oid": "69998c4a85ed6156a6221ef9" },
    "price": 100000,
  },

];

// Group tickets by event ID để tính min/max price nhanh
const ticketsByEvent = TICKETS_JSON.reduce((acc, ticket) => {
  const eventId = ticket.event?.$oid || ticket.event;
  if (!acc[eventId]) acc[eventId] = [];
  if (typeof ticket.price === 'number') {
    acc[eventId].push(ticket.price);
  }
  return acc;
}, {});

// ─── HELPERS ──────────────────────────────────────────────────────────────
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
  if (price === null || price === undefined || price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

// Lấy range giá (min - max) từ tickets JSON hoặc fallback ticketTypes
const getPriceRange = (event) => {
  const eventId = event._id?.$oid || event._id; // hỗ trợ cả object OID và string
  const ticketPrices = ticketsByEvent[eventId] || [];

  if (ticketPrices.length > 0) {
    const validPrices = ticketPrices.filter(p => typeof p === 'number' && p >= 0);
    if (validPrices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...validPrices),
      max: Math.max(...validPrices),
    };
  }

  // Fallback ticketTypes từ API event
  if (event.ticketTypes?.length) {
    const prices = event.ticketTypes
      .map(t => t.price)
      .filter(p => typeof p === 'number' && p !== null && p !== undefined);
    if (prices.length > 0) {
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    }
  }

  // Fallback minPrice / price đơn lẻ
  if (typeof event.minPrice === 'number') {
    return { min: event.minPrice, max: event.minPrice };
  }
  if (typeof event.price === 'number') {
    return { min: event.price, max: event.price };
  }

  return { min: null, max: null }; // Miễn phí
};

// Format hiển thị range giá: "Từ 100.000₫ - 500.000₫" hoặc "100.000₫" hoặc "Miễn phí"
const fmtPriceRange = ({ min, max }) => {
  if (min === null || min === undefined) return "Miễn phí";
  const minFmt = fmtPrice(min);
  if (min === max || max === null || max === min) return minFmt;
  const maxFmt = fmtPrice(max);
  return `Từ ${minFmt} - ${maxFmt}`;
};

const getStatusInfo = (status) => {
  const map = {
    published: { label: "Đang mở",     color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
    active:    { label: "Đang mở",     color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
    draft:     { label: "Sắp mở",      color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-400"   },
    cancelled: { label: "Đã huỷ",      color: "text-red-700",     bg: "bg-red-50",      dot: "bg-red-500"     },
    ended:     { label: "Đã kết thúc", color: "text-gray-500",    bg: "bg-gray-100",    dot: "bg-gray-400"    },
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

// ─── STATIC DATA ──────────────────────────────────────────────────────────
const ARTISTS = [
  { id: 1, name: "Sơn Tùng M-TP",   genre: "V-Pop",            events: 12, img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80" },
  { id: 2, name: "Hoàng Thùy Linh", genre: "Pop / Electronic",  events: 8,  img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80" },
  { id: 3, name: "Đen Vâu",         genre: "Hip-hop / Rap",     events: 15, img: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&auto=format&fit=crop&q=80" },
  { id: 4, name: "Mỹ Tâm",          genre: "Ballad / Pop",      events: 20, img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80" },
  { id: 5, name: "MCK",             genre: "Hip-hop",            events: 6,  img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&auto=format&fit=crop&q=80" },
  { id: 6, name: "Tlinh",           genre: "R&B / Rap",          events: 9,  img: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&auto=format&fit=crop&q=80" },
];

const TESTIMONIALS = [
  { id: 1, name: "Nguyễn Minh Anh",  role: "Tín đồ concert",      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop", rating: 5, text: "Mua vé quá nhanh và tiện lợi! Đặt được vé show Sơn Tùng trong vòng 2 phút, không lo cháy vé như các nền tảng khác.", event: "Sơn Tùng Concert 2024" },
  { id: 2, name: "Trần Đức Huy",     role: "Người yêu nhạc Jazz",  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop", rating: 5, text: "Giao diện rõ ràng, thông tin đầy đủ. Phần sơ đồ chỗ ngồi rất hữu ích khi chọn vé cho cả nhóm.", event: "Hà Nội Jazz Night" },
  { id: 3, name: "Lê Thị Phương",    role: "Fan K-Pop",             avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop", rating: 5, text: "Lần đầu dùng mà đã nghiện! Thanh toán an toàn, vé điện tử nhận ngay qua email. Sẽ giới thiệu cho bạn bè.", event: "Aespa World Tour – HCM" },
  { id: 4, name: "Phạm Quang Minh",  role: "Nhiếp ảnh sự kiện",    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop", rating: 5, text: "Trang cung cấp đầy đủ thông tin địa điểm & giờ giấc — rất cần thiết cho công việc của tôi mỗi tuần.", event: "Nhiều sự kiện" },
];

const WHY_US = [
  { icon: Zap,            title: "Đặt vé siêu tốc",    desc: "3 bước: chọn vé → thanh toán → nhận vé. Dưới 2 phút.", from: "from-orange-500", to: "to-orange-600" },
  { icon: Shield,         title: "Bảo mật tuyệt đối",  desc: "Cổng thanh toán PCI-DSS. Hoàn tiền 100% nếu sự kiện hủy.", from: "from-purple-500", to: "to-purple-600" },
  { icon: BadgeCheck,     title: "Vé chính hãng 100%", desc: "Mã QR độc nhất, chống giả. Xác thực trực tiếp ban tổ chức.", from: "from-blue-500",    to: "to-blue-600"   },
  { icon: HeartHandshake, title: "Hỗ trợ 24/7",        desc: "Chat trực tiếp hoặc hotline — phản hồi trong vòng 5 phút.", from: "from-emerald-500", to: "to-emerald-600" },
  { icon: Gift,           title: "Ưu đãi thành viên",  desc: "Tích điểm mỗi lần đặt. Đổi quà, vé VIP và nhiều hơn nữa.", from: "from-pink-500",   to: "to-pink-600"   },
  { icon: Music,          title: "Sự kiện đa dạng",    desc: "Concert, festival, thể thao, hội thảo — tất cả một nơi.", from: "from-amber-500",  to: "to-amber-600"  },
];

// ─── FILTER CONFIG ────────────────────────────────────────────────────────
const PRICE_OPTIONS = [
  { value: "all",       label: "Tất cả mức giá" },
  { value: "free",      label: "Miễn phí" },
  { value: "under500",  label: "Dưới 500.000₫" },
  { value: "500-2000",  label: "500K – 2.000.000₫" },
  { value: "over2000",  label: "Trên 2.000.000₫" },
];

const DATE_OPTIONS = [
  { value: "all",       label: "Tất cả ngày" },
  { value: "today",     label: "Hôm nay" },
  { value: "thisweek",  label: "Tuần này" },
  { value: "thismonth", label: "Tháng này" },
  { value: "next3",     label: "3 tháng tới" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất" },
  { value: "soonest",    label: "Sắp diễn ra" },
  { value: "price_asc",  label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
];

// ─── FILTER DROPDOWN (đã fix dính với button khi scroll) ──────────────────
const FilterDropdown = ({ label, icon: Icon, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!buttonRef.current || !dropdownRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      dropdownRef.current.style.top = `${rect.bottom + 6}px`;
      dropdownRef.current.style.left = `${rect.left}px`;
      dropdownRef.current.style.minWidth = `${rect.width}px`;
    };

    updatePosition();

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={buttonRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap select-none
          ${value !== options[0].value
            ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white border-transparent shadow-md"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span>{options.find(o => o.value === value)?.label || label}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-100 rounded-2xl shadow-2xl py-1.5 overflow-hidden z-[9999]"
          style={{ top: "0px", left: "0px", minWidth: "120px" }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors
                ${value === opt.value ? "bg-orange-50 font-bold" : "text-gray-600 hover:bg-gray-50 font-medium"}`}
            >
              <span className={value === opt.value ? "bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent" : ""}>
                {opt.label}
              </span>
              {value === opt.value && (
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SKELETON ─────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="h-44 bg-gray-100" />
    <div className="p-4 space-y-2">
      <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
      <div className="h-4 bg-gray-100 rounded-lg w-4/5" />
      <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
      <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
      <div className="flex justify-between pt-2">
        <div className="h-5 bg-gray-100 rounded-full w-1/4" />
        <div className="h-5 bg-gray-100 rounded-lg w-1/4" />
      </div>
    </div>
  </div>
);

// ─── EVENT CARD ───────────────────────────────────────────────────────────
const EventCard = ({ event }) => {
  const status = getStatusInfo(event.status);
  const total = getTotalTickets(event);
  const sold = getSoldTickets(event);
  const pct = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const { min, max } = getPriceRange(event);

  return (
    <Link to={`/event/${event._id}`}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-orange-200 hover:shadow-lg transition-all group block">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img src={getImageUrl(event.image)} alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {event.category && (
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" /> {event.category}
          </span>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color} ${status.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} inline-block`} /> {status.label}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
          {event.title}
        </h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{fmtDate(event.startDate)}</span>
            {fmtTime(event.startDate) && <span className="text-gray-300">· {fmtTime(event.startDate)}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{event.location || "Chưa cập nhật"}</span>
          </div>
          {event.organizer && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{typeof event.organizer === "string" ? event.organizer : event.organizer?.name}</span>
            </div>
          )}
        </div>
        {event.ticketTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.ticketTypes.slice(0, 2).map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-50 to-purple-50 text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-100">
                <Ticket className="w-2.5 h-2.5" /> {t.name}: {fmtPrice(t.price)}
              </span>
            ))}
            {event.ticketTypes.length > 2 && (
              <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">+{event.ticketTypes.length - 2}</span>
            )}
          </div>
        )}
        {total > 0 && (
          <div className="mb-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{sold}/{total} vé · {pct}%</p>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <p className="text-[10px] text-gray-400">Giá</p>
            <p className="text-sm font-black bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              {fmtPriceRange({ min, max })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
            Đặt vé <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};

// ─── FEATURED CARD ────────────────────────────────────────────────────────
const FeaturedCard = ({ event }) => {
  const status = getStatusInfo(event.status);
  const total = getTotalTickets(event);
  const sold = getSoldTickets(event);
  const pct = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const { min, max } = getPriceRange(event);

  return (
    <Link to={`/event/${event._id}`}
      className="relative block rounded-2xl overflow-hidden group border border-gray-200 hover:shadow-xl transition-all duration-500">
      <img src={getImageUrl(event.image)} alt={event.title}
        className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
        style={{ height: "clamp(280px,40vw,460px)" }}
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&auto=format&fit=crop"; }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          <Flame className="w-3 h-3" /> Nổi bật
        </span>
        {event.category && (
          <span className="bg-white/15 backdrop-blur border border-white/20 text-white text-[11px] px-2.5 py-1 rounded-full">{event.category}</span>
        )}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${status.color} ${status.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} inline-block`} />{status.label}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-white font-bold leading-tight mb-2 group-hover:bg-gradient-to-r group-hover:from-orange-300 group-hover:to-purple-300 group-hover:bg-clip-text group-hover:text-transparent transition-all"
          style={{ fontSize: "clamp(1.3rem,3vw,2.2rem)" }}>{event.title}</h2>
        {event.description && (
          <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-2">{event.description}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm text-white/60">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmtDate(event.startDate)}</span>
          {event.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.location}</span>}
        </div>
        {total > 0 && (
          <div className="mb-4">
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white/40 text-xs">{sold}/{total} vé đã bán · {pct}%</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-white/15 pt-4">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Giá</p>
            <p className="text-white font-black text-xl">
              {fmtPriceRange({ min, max })}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            Đặt vé ngay <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

// ─── UPCOMING CARD ────────────────────────────────────────────────────────
const UpcomingCard = ({ event }) => {
  const total = getTotalTickets(event);
  const sold = getSoldTickets(event);
  const pct = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const { min, max } = getPriceRange(event);

  return (
    <Link to={`/event/${event._id}`}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-orange-200 hover:shadow-sm transition-all group flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-36 h-36 shrink-0 overflow-hidden bg-gray-100">
        <img src={getImageUrl(event.image)} alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop"; }} />
        <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {fmtDate(event.startDate)}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1 min-w-0">
        {event.category && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">{event.category}</span>
        )}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all leading-snug">{event.title}</h3>
        <div className="flex flex-col gap-0.5 text-xs text-gray-500 mt-0.5">
          {fmtTime(event.startDate) && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{fmtTime(event.startDate)}</span>
          )}
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400 shrink-0" /><span className="truncate">{event.location}</span></span>
        </div>
        {total > 0 && (
          <div className="mt-1">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-gray-400">{sold}/{total} · {pct}%</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <span className="text-sm font-black bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            {fmtPriceRange({ min, max })}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-0.5 font-medium">
            Đặt vé <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};

// ─── ALL EVENTS SECTION ───────────────────────────────────────────────────
const INITIAL_SHOW = 12;

const AllEventsSection = ({ events, loading, clearFilters, catFilter }) => {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? events : events.slice(0, INITIAL_SHOW);
  const remaining = events.length - INITIAL_SHOW;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 bg-gradient-to-b from-orange-500 to-purple-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-900">
            {catFilter !== "all"
              ? <span>Sự kiện: <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">{catFilter}</span></span>
              : "Tất cả sự kiện"
            }
          </h2>
          {!loading && (
            <span className="text-xs font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
              {events.length} sự kiện
            </span>
          )}
        </div>
      </div>

      {!loading && events.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-bold text-gray-700 mb-1 text-base">Không tìm thấy sự kiện nào</p>
          <p className="text-gray-400 text-sm mb-5">Thử thay đổi bộ lọc hoặc tìm kiếm từ khoá khác</p>
          <button onClick={clearFilters}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <X className="w-3.5 h-3.5" /> Xoá bộ lọc
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : displayed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayed.map(event => <EventCard key={event._id} event={event} />)}
        </div>
      )}

      {!loading && events.length > INITIAL_SHOW && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {showAll ? (
              <><ChevronDown className="w-4 h-4 rotate-180" /> Thu gọn</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Xem thêm {remaining} sự kiện</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
const HomePage = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const [priceFilter, setPriceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8000/api/events");
        let data = res.data?.data || res.data || [];
        if (!Array.isArray(data)) data = [];
        const cats = [...new Set(data.map(e => e.category).filter(Boolean))];
        setCategories(cats);
        const search = searchParams.get("search");
        if (search) data = data.filter(e =>
          e.title?.toLowerCase().includes(search.toLowerCase()) ||
          e.location?.toLowerCase().includes(search.toLowerCase())
        );
        setAllEvents(data);
      } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    let data = [...allEvents];
    if (catFilter !== "all") data = data.filter(e => e.category === catFilter);

    if (priceFilter !== "all") {
      data = data.filter(e => {
        const { min } = getPriceRange(e);
        if (priceFilter === "free") return min === 0 || min === null;
        if (priceFilter === "under500") return min !== null && min > 0 && min < 500000;
        if (priceFilter === "500-2000") return min !== null && min >= 500000 && min <= 2000000;
        if (priceFilter === "over2000") return min !== null && min > 2000000;
        return true;
      });
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
      const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
      const next3End = new Date(today); next3End.setMonth(today.getMonth() + 3);
      data = data.filter(e => {
        if (!e.startDate) return false;
        const d = new Date(e.startDate);
        if (dateFilter === "today") return d >= today && d < new Date(today.getTime() + 86400000);
        if (dateFilter === "thisweek") return d >= today && d <= weekEnd;
        if (dateFilter === "thismonth") return d >= today && d <= monthEnd;
        if (dateFilter === "next3") return d >= today && d <= next3End;
        return true;
      });
    }

    if (sortFilter === "soonest") data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (sortFilter === "newest") data.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
    if (sortFilter === "price_asc") data.sort((a, b) => (getPriceRange(a).min ?? Infinity) - (getPriceRange(b).min ?? Infinity));
    if (sortFilter === "price_desc") data.sort((a, b) => (getPriceRange(b).min ?? -1) - (getPriceRange(a).min ?? -1));

    setEvents(data);
  }, [allEvents, priceFilter, dateFilter, catFilter, sortFilter]);

  const activeFilters = [priceFilter !== "all", dateFilter !== "all", catFilter !== "all", sortFilter !== "newest"].filter(Boolean).length;
  const clearFilters = () => {
    setPriceFilter("all");
    setDateFilter("all");
    setCatFilter("all");
    setSortFilter("newest");
  };

  const search = searchParams.get("search");
  const featuredEvent = events[0];
  const hotEvents = events.slice(1, 7);
  const upcomingEvents = [...allEvents]
    .filter(e => e.startDate && new Date(e.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gray-900" style={{ height: "clamp(480px,85svh,720px)" }}>
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1800&auto=format&fit=crop&q=80"
          alt="hero" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full max-w-6xl mx-auto px-6 pb-12 md:pb-16">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-4 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Nền tảng sự kiện hàng đầu Việt Nam
          </div>
          <h1 className="text-white font-bold leading-tight mb-3" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
            Khám phá sự kiện<br />
            <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">dành cho bạn</span>
          </h1>
          <p className="text-white/60 mb-6 max-w-xl" style={{ fontSize: "clamp(0.875rem,1.5vw,1rem)" }}>
            Hàng trăm sự kiện âm nhạc, thể thao, văn hóa mỗi tháng — đặt vé nhanh chóng, an toàn.
          </p>
          <form className="flex items-center bg-white rounded-xl max-w-lg overflow-hidden shadow-lg"
            onSubmit={e => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) window.location.href = `/?search=${encodeURIComponent(q)}`; }}>
            <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
            <input name="q" placeholder="Tìm sự kiện, địa điểm, nghệ sĩ..."
              defaultValue={search || ""}
              className="flex-1 px-3 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400" />
            <button type="submit"
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold px-5 py-3 shrink-0 hover:opacity-90 transition-opacity">
              Tìm kiếm
            </button>
          </form>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
            {[
              { icon: TrendingUp, val: `${allEvents.length || "100"}+`, label: "Sự kiện" },
              { icon: Users, val: "10K+", label: "Người dùng" },
              { icon: Star, val: "4.9★", label: "Đánh giá" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <s.icon className="w-3.5 h-3.5 text-white/50" />
                <span className="text-white font-bold text-sm">{s.val}</span>
                <span className="text-white/50">·</span>
                <span className="text-white/40">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <nav className="sticky top-0 z-40 bg-white rounded-b-2xl" style={{ boxShadow: "0 8px 32px -4px rgba(0,0,0,0.13)", marginBottom: "-24px" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-2 shrink-0 mr-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-sm">
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden sm:block">Bộ lọc</span>
            </div>

            <div className="h-6 w-px bg-gray-200 shrink-0" />

            <FilterDropdown label="Giá vé" icon={DollarSign} options={PRICE_OPTIONS} value={priceFilter} onChange={setPriceFilter} />
            <FilterDropdown label="Ngày" icon={Calendar} options={DATE_OPTIONS} value={dateFilter} onChange={setDateFilter} />
            <FilterDropdown label="Danh mục" icon={Tag}
              options={[{ value: "all", label: "Tất cả danh mục" }, ...categories.map(c => ({ value: c, label: c }))]}
              value={catFilter} onChange={setCatFilter} />
            <FilterDropdown label="Sắp xếp" icon={ArrowUpDown} options={SORT_OPTIONS} value={sortFilter} onChange={setSortFilter} />

            {activeFilters > 0 && (
              <>
                <div className="h-6 w-px bg-gray-200 shrink-0" />
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0">
                  <X className="w-3.5 h-3.5" />
                  Xoá lọc
                  <span className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white text-[9px] font-black flex items-center justify-center">{activeFilters}</span>
                </button>
              </>
            )}

            <span className="ml-auto shrink-0 text-xs text-gray-400 hidden md:block whitespace-nowrap">
              <span className="font-black bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">{events.length}</span> kết quả
            </span>
          </div>
        </div>
      </nav>

      {/* FEATURED */}
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Sự kiện nổi bật</h2>
          <Link to="/events"
            className="text-xs font-medium flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent hover:opacity-75 transition-opacity">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
          </Link>
        </div>
        {loading
          ? <div className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: "clamp(280px,40vw,460px)" }} />
          : featuredEvent ? <FeaturedCard event={featuredEvent} />
          : <div className="text-center py-12 text-gray-400 text-sm">Chưa có sự kiện nổi bật</div>
        }

        {!loading && hotEvents.length > 0 && (
          <div className="mt-4 -mx-6">
            <div
              className="overflow-x-scroll px-6 pb-3 cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent", WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {hotEvents.map(event => (
                  <Link key={event._id} to={`/event/${event._id}`}
                    className="w-48 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all group shrink-0">
                    <div className="h-32 overflow-hidden bg-gray-100 relative">
                      <img src={getImageUrl(event.image)} alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop"; }} />
                      {event.category && (
                        <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">{event.category}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{event.title}</p>
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{fmtDate(event.startDate)}</span>
                        {event.location && <span className="text-[10px] text-gray-400 flex items-center gap-1 truncate"><MapPin className="w-2.5 h-2.5 shrink-0" />{event.location}</span>}
                      </div>
                      <p className="text-xs font-black mt-1.5 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                        {fmtPriceRange(getPriceRange(event))}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link to="/events"
                  className="w-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 hover:border-orange-300 transition-all shrink-0 group min-h-[192px]">
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                  <span className="text-xs font-medium bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Xem thêm</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ALL EVENTS */}
      <AllEventsSection events={events} loading={loading} clearFilters={clearFilters} catFilter={catFilter} />

      {/* ARTISTS */}
      <div className="bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                <Music className="w-3 h-3 text-orange-500" /> Line-up đặc sắc
              </p>
              <h2 className="text-lg font-bold text-gray-900">Nghệ sĩ nổi bật</h2>
            </div>
            <Link to="/events"
              className="text-xs font-medium flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent hover:opacity-75 transition-opacity">
              Khám phá thêm <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
            {ARTISTS.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-2.5 group cursor-pointer">
                <img src={a.img} alt={a.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-200 group-hover:border-transparent group-hover:ring-2 group-hover:ring-orange-400 group-hover:ring-offset-2 transition-all duration-300 group-hover:scale-105"
                  onError={e => { e.target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop"; }} />
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900 truncate max-w-[80px]">{a.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[80px]">{a.genre}</p>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent bg-orange-50 px-1.5 py-0.5 rounded-full mt-1 border border-orange-100">
                    <Music className="w-2 h-2 text-orange-500" /> {a.events} SK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY US */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-gray-900">
            Tại sao chọn <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">TicketVN</span>?
          </h2>
          <p className="text-sm text-gray-500 mt-1">Hơn 10.000 người dùng tin tưởng mỗi tháng.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHY_US.map((w, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-200 hover:shadow-md transition-all group">
              <div className={`w-10 h-10 bg-gradient-to-br ${w.from} ${w.to} rounded-xl flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                <w.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{w.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                <Star className="w-3 h-3 text-orange-500" /> Khách hàng nói gì
              </p>
              <h2 className="text-lg font-bold text-gray-900">Hàng nghìn người tin tưởng</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-100 px-3 py-1.5 rounded-full">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-orange-500 text-orange-500" />)}
              <span className="text-xs font-black text-gray-900 ml-1">4.9</span>
              <span className="text-xs text-gray-400">/ 5.0</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-orange-200 hover:shadow-sm transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-50 to-purple-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <Quote className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="flex gap-0.5">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-orange-500 text-orange-500" />)}
                </div>
                <div className="flex items-center gap-2.5 border-t border-gray-100 pt-3">
                  <img src={t.avatar} alt={t.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-orange-100 shrink-0"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop"; }} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{t.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      

      {/* ORGANIZER CTA */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white leading-tight mb-3">
                Bán vé sự kiện<br />cùng chúng tôi
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Tạo sự kiện, quản lý vé và theo dõi doanh thu trong một nền tảng. Miễn phí đăng ký, chỉ tính phí khi bán được vé.
              </p>
              <div className="space-y-2.5 mb-7">
                {[
                  { icon: BadgeCheck, text: "Tạo sự kiện không giới hạn" },
                  { icon: Shield, text: "Thanh toán an toàn, rút tiền nhanh" },
                  { icon: BarChart3, text: "Dashboard phân tích real-time" },
                  { icon: HeartHandshake, text: "Hỗ trợ 24/7 chuyên nghiệp" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-white/70 text-sm">
                    <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <p.icon className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    {p.text}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                  Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/pricing"
                  className="inline-flex items-center gap-2 border border-white/20 text-white/60 font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-white/40 hover:text-white transition-all">
                  Xem bảng giá
                </Link>
              </div>
            </div>
            <div className="p-6 md:p-8 flex items-center bg-white/5 border-l border-white/10">
              <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-white/5 border-b border-white/10 px-4 py-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="flex-1 bg-white/10 rounded px-2 py-0.5 text-[10px] text-white/30 ml-2">ticketvn.vn/dashboard</span>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Tổng quan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Vé đã bán", val: "1,284" },
                      { label: "Doanh thu", val: "₫48.2M" },
                      { label: "Lượt xem", val: "9,310" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <p className="text-sm font-black bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">{s.val}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[40,65,50,80,70,90,60,100,75,88,55,95].map((h, i) => (
                      <div key={i} className="flex-1 flex items-end">
                        <div className="w-full rounded-t bg-gradient-to-t from-orange-500 to-purple-500 opacity-70" style={{ height: `${h}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Đêm nhạc Acoustic", pct: 87 },
                      { name: "Workshop Nhiếp ảnh", pct: 72 },
                      { name: "Comedy Night HCM", pct: 70 },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40 flex-1 truncate">{e.name}</span>
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full" style={{ width: `${e.pct}%` }} />
                        </div>
                        <span className="text-[9px] text-purple-400 font-bold w-6 text-right">{e.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;