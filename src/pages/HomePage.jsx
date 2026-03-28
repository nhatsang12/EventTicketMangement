import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import API_URL from '../config/api';
import {
  Calendar, MapPin, Search, Tag, Ticket,
  Users, ArrowRight, ChevronDown, ChevronRight,
  Flame, Sparkles, TrendingUp, Music, Shield,
  Zap, HeartHandshake, BadgeCheck, Gift,
  SlidersHorizontal, X, Check, DollarSign, ArrowUpDown, Award,
  Eye, AlertTriangle, Timer, LayoutGrid, List, Filter
} from "lucide-react";

// ─── STATIC DATA ──────────────────────────────────────────────────────────
const getEntityId = (value) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (value.$oid) return String(value.$oid);
    if (value._id) return getEntityId(value._id);
    if (value.id) return String(value.id);
  }
  return null;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildMinPriceByEvent = (tickets) => (Array.isArray(tickets) ? tickets : []).reduce((acc, ticket) => {
  if (!ticket || ticket.isActive === false || ticket.isEnabled === false) return acc;
  const eventId = getEntityId(ticket.event);
  const price = toNumber(ticket.price);
  if (!eventId || price === null || price < 0) return acc;
  if (acc[eventId] === undefined || price < acc[eventId]) acc[eventId] = price;
  return acc;
}, {});

const FEATURED_ORGANIZERS = [
  { id:1, name:"LiveNation VN", description:"Đơn vị tổ chức concert quốc tế hàng đầu.", totalEvents:48, followers:"12.4K", avatar:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop" },
  { id:2, name:"Galaxy Events", description:"Chuyên tổ chức festival âm nhạc và sự kiện giải trí.", totalEvents:32, followers:"8.1K", avatar:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop" },
  { id:3, name:"YAN Entertainment", description:"Nhà sản xuất các chương trình âm nhạc V-Pop.", totalEvents:61, followers:"20K", avatar:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop" },
  { id:4, name:"Saigon Concert", description:"Tổ chức biểu diễn nghệ thuật tại TP.HCM.", totalEvents:27, followers:"6.5K", avatar:"https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&auto=format&fit=crop" },
];
const WHY_US = [
  { icon:Zap, title:"Đặt vé siêu tốc", desc:"3 bước: chọn vé → thanh toán → nhận vé. Dưới 2 phút.", accent:"#f97316" },
  { icon:Shield, title:"Bảo mật tuyệt đối", desc:"Cổng thanh toán PCI-DSS. Hoàn tiền 100% nếu sự kiện hủy.", accent:"#a855f7" },
  { icon:BadgeCheck, title:"Vé chính hãng 100%", desc:"Mã QR độc nhất, chống giả. Xác thực trực tiếp ban tổ chức.", accent:"#3b82f6" },
  { icon:HeartHandshake, title:"Hỗ trợ 24/7", desc:"Chat trực tiếp hoặc hotline — phản hồi trong vòng 5 phút.", accent:"#10b981" },
  { icon:Gift, title:"Ưu đãi thành viên", desc:"Tích điểm mỗi lần đặt. Đổi quà, vé VIP và nhiều hơn nữa.", accent:"#ec4899" },
  { icon:Music, title:"Sự kiện đa dạng", desc:"Concert, festival, thể thao, hội thảo — tất cả một nơi.", accent:"#f59e0b" },
];
const LOCATIONS = [
  { name:"TP. Hồ Chí Minh", img:"https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop&q=80", count:120 },
  { name:"Hà Nội", img:"https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800&auto=format&fit=crop&q=80", count:85 },
  { name:"Đà Nẵng", img:"https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80", count:47 },
  { name:"Nha Trang", img:"https://images.unsplash.com/photo-1573968694073-5af7d6dfe5e0?w=800&auto=format&fit=crop&q=80", count:32 },
  { name:"Phú Quốc", img:"https://images.unsplash.com/photo-1540541338537-1220059af4dc?w=800&auto=format&fit=crop&q=80", count:28 },
  { name:"Cần Thơ", img:"https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&auto=format&fit=crop&q=80", count:19 },
];

const PRICE_OPTIONS = [
  { value:"all", label:"Tất cả giá" },
  { value:"free", label:"Miễn phí" },
  { value:"under500", label:"< 500K" },
  { value:"500-2000", label:"500K–2M" },
  { value:"over2000", label:"> 2M" },
];
const CITY_OPTIONS = [
  { value:"all", label:"Tất cả TP", keywords:[] },
  { value:"hcm", label:"TP.HCM", keywords:["ho chi minh", "tp ho chi minh", "hcm", "sai gon", "saigon"] },
  { value:"hn", label:"Hà Nội", keywords:["ha noi", "hn"] },
  { value:"dn", label:"Đà Nẵng", keywords:["da nang", "danang"] },
  { value:"nt", label:"Nha Trang", keywords:["nha trang"] },
  { value:"pq", label:"Phú Quốc", keywords:["phu quoc"] },
  { value:"ct", label:"Cần Thơ", keywords:["can tho"] },
];
const DATE_OPTIONS = [
  { value:"all", label:"Tất cả ngày" },
  { value:"today", label:"Hôm nay" },
  { value:"thisweek", label:"Tuần này" },
  { value:"thismonth", label:"Tháng này" },
  { value:"next3", label:"3 tháng tới" },
];
const SORT_OPTIONS = [
  { value:"newest", label:"Mới nhất" },
  { value:"soonest", label:"Sắp diễn ra" },
  { value:"price_asc", label:"Giá tăng dần" },
  { value:"price_desc", label:"Giá giảm dần" },
];
const CAT_ICONS = {};

// ─── HELPERS ──────────────────────────────────────────────────────────────
const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const matchCity = (location = "", cityValue = "all") => {
  if (cityValue === "all") return true;
  const option = CITY_OPTIONS.find(item => item.value === cityValue);
  if (!option || option.keywords.length === 0) return true;
  const normalizedLocation = normalizeText(location);
  return option.keywords.some(keyword => normalizedLocation.includes(keyword));
};

const getImageUrl = p => !p ? "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1000&auto=format&fit=crop&q=80" : p.startsWith("http") ? p : `${API_URL}${p}`;
const fmtDate = d => { if (!d) return "Chưa cập nhật"; const dt = new Date(d); return isNaN(dt) ? "Chưa cập nhật" : dt.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" }); };
const fmtTime = d => { if (!d) return ""; try { const dt = new Date(d); return isNaN(dt) ? "" : dt.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" }); } catch { return ""; } };
const fmtPrice = p => (p === null || p === undefined || p === 0) ? "Miễn phí" : new Intl.NumberFormat("vi-VN", { style:"currency", currency:"VND" }).format(p);
const getPriceRange = event => {
  if (!event) return { min:null, max:null };
  if (event.ticketTypes?.length) {
    const prices = event.ticketTypes
      .filter(t => t?.isActive !== false && t?.isEnabled !== false)
      .map(t => toNumber(t?.price))
      .filter(p => p !== null && p >= 0);
    if (prices.length) return { min:Math.min(...prices), max:Math.max(...prices) };
  }
  if (typeof event.lowestPrice === "number") return { min:event.lowestPrice, max:event.lowestPrice };
  if (typeof event.minPrice === "number") return { min:event.minPrice, max:event.minPrice };
  if (typeof event.price === "number") return { min:event.price, max:event.price };
  return { min:null, max:null };
};
const fmtPriceRange = ({ min, max }) => { if (min === null || min === undefined) return "Miễn phí"; const m = fmtPrice(min); return (min === max || max === null) ? m : `${m} – ${fmtPrice(max)}`; };
const getStatusInfo = s => ({ published:{ label:"Đang mở", color:"#10b981", bg:"rgba(16,185,129,0.12)" }, active:{ label:"Đang mở", color:"#10b981", bg:"rgba(16,185,129,0.12)" }, draft:{ label:"Sắp mở", color:"#f59e0b", bg:"rgba(245,158,11,0.12)" }, cancelled:{ label:"Đã huỷ", color:"#ef4444", bg:"rgba(239,68,68,0.12)" }, ended:{ label:"Đã kết thúc", color:"#6b7280", bg:"rgba(107,114,128,0.12)" } }[s] || { label:"Đang mở", color:"#10b981", bg:"rgba(16,185,129,0.12)" });
const getTotalTickets = e => e.ticketTypes?.length ? e.ticketTypes.reduce((s,t) => s+(t.quantity||0),0) : e.totalTickets||e.capacity||null;
const getSoldTickets = e => e.ticketTypes?.length ? e.ticketTypes.reduce((s,t) => s+(t.sold||0),0) : e.soldTickets||e.sold||0;
const getUrgency = (pct, total, sold, startDate) => {
  const rem = total ? total-sold : null;
  const daysLeft = startDate ? (new Date(startDate)-Date.now())/86400000 : null;
  if (rem !== null && rem <= 10 && rem > 0) return { level:"critical", label:`Còn ${rem} vé!`, color:"#ef4444" };
  if (pct >= 90 && total > 0) return { level:"critical", label:"Gần hết vé!", color:"#ef4444" };
  if (pct >= 70 && total > 0) return { level:"hot", label:"🔥 Bán chạy", color:"#f97316" };
  if (pct >= 50 && total > 0) return { level:"warm", label:"Đang bán nhanh", color:"#f59e0b" };
  if (daysLeft !== null && daysLeft <= 3 && daysLeft > 0) return { level:"soon", label:"Sắp diễn ra", color:"#a855f7" };
  return null;
};
const getViewers = id => { const s=(id||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0); return 12+(s%87); };

// ─── SCROLL REVEAL HOOK ────────────────────────────────────────────────────
const useReveal = (opts = {}) => {
  const { threshold = 0.12, rootMargin = "0px 0px -60px 0px", once = true } = opts;
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); if (once) obs.disconnect(); }
      else if (!once) setVisible(false);
    }, { threshold, rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, once]);
  return [ref, visible];
};

const Reveal = ({ children, variant="fadeUp", delay=0, duration=700, threshold=0.12, rootMargin, style={}, className="", as:Tag="div" }) => {
  const [ref, visible] = useReveal({ threshold, rootMargin: rootMargin || "0px 0px -60px 0px" });
  const V = {
    fadeUp:   ["opacity:0;transform:translateY(48px)",              "opacity:1;transform:translateY(0)"],
    fadeDown: ["opacity:0;transform:translateY(-40px)",             "opacity:1;transform:translateY(0)"],
    fadeLeft: ["opacity:0;transform:translateX(-56px)",             "opacity:1;transform:translateX(0)"],
    fadeRight:["opacity:0;transform:translateX(56px)",              "opacity:1;transform:translateX(0)"],
    fadeIn:   ["opacity:0",                                         "opacity:1"],
    scaleUp:  ["opacity:0;transform:scale(0.85)",                   "opacity:1;transform:scale(1)"],
    scaleIn:  ["opacity:0;transform:scale(1.12)",                   "opacity:1;transform:scale(1)"],
    blur:     ["opacity:0;filter:blur(14px)",                       "opacity:1;filter:blur(0px)"],
    slideUp:  ["opacity:0;transform:translateY(72px) skewY(3deg)",  "opacity:1;transform:translateY(0) skewY(0deg)"],
    flipUp:   ["opacity:0;transform:perspective(600px) rotateX(24deg) translateY(32px)", "opacity:1;transform:perspective(600px) rotateX(0deg) translateY(0)"],
  };
  const parse = s => Object.fromEntries(s.split(";").filter(Boolean).map(p => { const [k,...v]=p.split(":"); return [k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()), v.join(":").trim()]; }));
  const [h,s2] = V[variant]||V.fadeUp;
  return <Tag ref={ref} style={{ transition:`all ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`, ...parse(visible?s2:h), ...style }} className={className}>{children}</Tag>;
};

// ─── COUNTDOWN ────────────────────────────────────────────────────────────
const useCountdown = target => {
  const calc = () => { const d=new Date(target).getTime()-Date.now(); return (!target||d<=0)?null:{ days:Math.floor(d/86400000), hours:Math.floor((d%86400000)/3600000), minutes:Math.floor((d%3600000)/60000), seconds:Math.floor((d%60000)/1000), total:d }; };
  const [t,setT] = useState(calc);
  useEffect(()=>{ const i=setInterval(()=>setT(calc()),1000); return ()=>clearInterval(i); },[target]);
  return t;
};

const CountdownCompact = ({ startDate }) => {
  const t = useCountdown(startDate);
  if (!t) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, color:"#c084fc", fontFamily:"'Space Mono',monospace" }}>
      <Timer style={{ width:9,height:9 }}/>
      {t.days > 0
        ? `${t.days}d ${String(t.hours).padStart(2,"0")}:${String(t.minutes).padStart(2,"0")}:${String(t.seconds).padStart(2,"0")}`
        : `${String(t.hours).padStart(2,"0")}:${String(t.minutes).padStart(2,"0")}:${String(t.seconds).padStart(2,"0")}`}
    </span>
  );
};

// ─── SKELETON ─────────────────────────────────────────────────────────────
const CardSkeleton = ({ tall }) => (
  <div style={{ background:"#111", borderRadius:16, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
    <div style={{ height:tall?260:180 }} className="hp2-shimmer"/>
    <div style={{ padding:16 }}>
      {[80,60,45].map((w,i) => <div key={i} style={{ height:10, borderRadius:99, width:`${w}%`, marginBottom:8 }} className="hp2-shimmer"/>)}
    </div>
  </div>
);

// ─── EVENT CARD ───────────────────────────────────────────────────────────
const EventCard = ({ event, index = 0 }) => {
  const status = getStatusInfo(event.status);
  const total = getTotalTickets(event);
  const sold = getSoldTickets(event);
  const pct = total ? Math.min(100,Math.round((sold/total)*100)) : 0;
  const { min, max } = getPriceRange(event);
  const urgency = getUrgency(pct, total, sold, event.startDate);
  return (
    <Reveal variant="fadeUp" delay={index * 60} threshold={0.06}><Link to={`/event/${event._id}`} className="hp2-card" style={{
      display:"block",
      background:"linear-gradient(180deg,#1e1e20 0%,#18181a 100%)",
      borderRadius:18, border:"1px solid rgba(255,255,255,0.1)",
      overflow:"hidden", textDecoration:"none", transition:"all 0.3s",
      boxShadow:"0 4px 28px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset",
    }}>
      <div style={{ position:"relative", height:188, overflow:"hidden", background:"#1c1c1e" }}>
        <img src={getImageUrl(event.image)} alt={event.title} className="hp2-card-img"
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s ease" }}
          onError={e=>{e.target.src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop";}}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.2) 50%,transparent 100%)" }}/>
        <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, background:status.bg, color:status.color, border:`1px solid ${status.color}40`, backdropFilter:"blur(6px)", fontFamily:"'Be Vietnam Pro',sans-serif" }}>{status.label}</span>
          {urgency?.level==="critical" && <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:999, background:"rgba(239,68,68,0.25)", color:"#f87171", border:"1px solid rgba(239,68,68,0.5)", fontFamily:"'Be Vietnam Pro',sans-serif" }} className="hp2-pulse">{urgency.label}</span>}
        </div>
        <span style={{ position:"absolute", bottom:10, right:10, fontSize:10, color:"rgba(255,255,255,0.55)", display:"flex", alignItems:"center", gap:3, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", padding:"3px 8px", borderRadius:999, fontFamily:"'Be Vietnam Pro',sans-serif" }}><Eye style={{ width:10,height:10 }}/>{getViewers(event._id?.$oid||event._id)}</span>
      </div>
      <div style={{ padding:"16px 18px 18px" }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:"white", lineHeight:1.35, marginBottom:10, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.02em" }}>{event.title}</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:6, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <Calendar style={{ width:11,height:11,color:"#f97316",flexShrink:0 }}/>
            Bắt đầu: {fmtDate(event.startDate)}
            {fmtTime(event.startDate) && <span style={{ color:"rgba(255,255,255,0.3)" }}> · {fmtTime(event.startDate)}</span>}
          </span>
          {event.endDate && (
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:6, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
              <Calendar style={{ width:11,height:11,color:"#10b981",flexShrink:0 }}/>
              Kết thúc: {fmtDate(event.endDate)}
              {fmtTime(event.endDate) && <span style={{ color:"rgba(255,255,255,0.3)" }}> · {fmtTime(event.endDate)}</span>}
            </span>
          )}
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:6, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <MapPin style={{ width:11,height:11,color:"#a855f7",flexShrink:0 }}/>
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{event.location||"Chưa cập nhật"}</span>
          </span>
          <CountdownCompact startDate={event.startDate}/>
        </div>
        {total > 0 && <div style={{ marginBottom:14 }}>
         
         
        </div>}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:14 }}>
          <div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'Be Vietnam Pro',sans-serif", marginBottom:2 }}>Từ</p>
            <span style={{ fontSize:16, fontWeight:900, background:"linear-gradient(90deg,#f97316,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif" }}>{fmtPriceRange({min,max})}</span>
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:"white", padding:"9px 20px", borderRadius:999, background:urgency?.level==="critical"?"linear-gradient(135deg,#ef4444,#f97316)":"linear-gradient(135deg,#f97316,#a855f7)", fontFamily:"'Be Vietnam Pro',sans-serif", boxShadow:"0 4px 18px rgba(249,115,22,0.3)", display:"flex", alignItems:"center", gap:5, transition:"all 0.2s" }} className="hp2-cta-btn">
            Đặt vé <ArrowRight style={{ width:12,height:12 }}/>
          </span>
        </div>
      </div>
    </Link></Reveal>
  );
};

// ─── EVENT CARD TALL ──────────────────────────────────────────────────────
const EventCardTall = ({ event }) => {
  const status = getStatusInfo(event.status);
  const total = getTotalTickets(event);
  const sold = getSoldTickets(event);
  const pct = total ? Math.min(100,Math.round((sold/total)*100)) : 0;
  const { min, max } = getPriceRange(event);
  const urgency = getUrgency(pct, total, sold, event.startDate);
  const t = useCountdown(event.startDate);
  return (
    <Reveal variant="fadeLeft" delay={0} duration={800} style={{height:"100%"}}><Link to={`/event/${event._id}`} className="hp2-tall-card" style={{
      display:"block", position:"relative", borderRadius:18, overflow:"hidden",
      textDecoration:"none", height:"100%",
    }}>
      <img src={getImageUrl(event.image)} alt={event.title} className="hp2-tall-img"
        style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.7s", minHeight:360 }}
        onError={e=>{e.target.src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop";}}/>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.97) 0%,rgba(0,0,0,0.4) 50%,rgba(0,0,0,0.05) 100%)" }}/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 0% 100%,rgba(249,115,22,0.1) 0%,transparent 60%)" }}/>
      <div style={{ position:"absolute", top:14, left:14, display:"flex", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:800, padding:"4px 10px", borderRadius:999, background:"linear-gradient(135deg,#f97316,#a855f7)", color:"white", fontFamily:"'Be Vietnam Pro',sans-serif", letterSpacing:"0.04em" }}><Flame style={{ width:10,height:10,display:"inline",marginRight:3 }}/>Nổi bật</span>
      </div>
      <div style={{ position:"absolute", top:14, right:14, fontSize:10, color:"rgba(255,255,255,0.45)", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.08)", padding:"4px 10px", borderRadius:999, display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
        <Eye style={{ width:11,height:11 }}/>{getViewers(event._id?.$oid||event._id)} đang xem
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"20px 20px" }}>
        {t && (
          <div style={{ display:"flex", gap:6, marginBottom:12, alignItems:"center", flexWrap:"wrap" }}>
            <Timer style={{ width:11,height:11,color:"#c084fc" }}/>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"'Be Vietnam Pro',sans-serif" }}>Bắt đầu sau</span>
            {[{v:t.days,l:"ngày"},{v:t.hours,l:"giờ"},{v:t.minutes,l:"phút"},{v:t.seconds,l:"giây"}].map(({v,l},i)=>(
              <span key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
                <span style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"white", fontWeight:800, fontSize:12, padding:"2px 7px", borderRadius:6, minWidth:28, textAlign:"center", fontFamily:"'Space Mono',monospace" }}>{String(v).padStart(2,"0")}</span>
                <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"'Be Vietnam Pro',sans-serif" }}>{l}</span>
                {i<3 && <span style={{ color:"rgba(255,255,255,0.15)", fontWeight:700 }}>:</span>}
              </span>
            ))}
          </div>
        )}
        <h2 style={{ color:"white", fontWeight:900, lineHeight:1.1, marginBottom:6, fontSize:"clamp(1.1rem,2vw,1.6rem)", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.02em" }}>{event.title}</h2>
        <div style={{ display:"flex", gap:12, marginBottom:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:"white", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <Calendar style={{ width:11,height:11,color:"#f97316" }}/>Bắt đầu: {fmtDate(event.startDate)} · {fmtTime(event.startDate)}
          </span>
        </div>
        {event.endDate && (
          <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
              <Calendar style={{ width:11,height:11,color:"#10b981" }}/>Kết thúc: {fmtDate(event.endDate)} · {fmtTime(event.endDate)}
            </span>
            {event.location && <span style={{ fontSize:11, color:"white", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}><MapPin style={{ width:11,height:11,color:"#a855f7" }}/>{event.location}</span>}
          </div>
        )}
        {!event.endDate && event.location && (
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:11, color:"white", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}><MapPin style={{ width:11,height:11,color:"#a855f7" }}/>{event.location}</span>
          </div>
        )}
        {total > 0 && <div style={{ marginBottom:14 }}>
        
        </div>}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:14 }}>
          <div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2, fontFamily:"'Be Vietnam Pro',sans-serif" }}>Từ</p>
            <p style={{ fontSize:18, fontWeight:900, color:"white", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.01em" }}>{fmtPriceRange({min,max})}</p>
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:"white", padding:"10px 20px", borderRadius:999, background:"linear-gradient(135deg,#f97316,#a855f7)", fontFamily:"'Be Vietnam Pro',sans-serif", boxShadow:"0 6px 24px rgba(249,115,22,0.3)", display:"flex", alignItems:"center", gap:5 }}>
            Đặt vé <ArrowRight style={{ width:13,height:13 }}/>
          </span>
        </div>
      </div>
    </Link></Reveal>
  );
};

// ─── LIST ROW VIEW ────────────────────────────────────────────────────────
const EventListRow = ({ event, index = 0 }) => {
  const status = getStatusInfo(event.status);
  const { min, max } = getPriceRange(event);
  const total = getTotalTickets(event);
  const sold = getSoldTickets(event);
  const pct = total ? Math.min(100,Math.round((sold/total)*100)) : 0;
  return (
    <Reveal variant="fadeRight" delay={index * 50} duration={600}><Link to={`/event/${event._id}`} className="hp2-list-row" style={{
      display:"flex", gap:0,
      background:"linear-gradient(135deg,#1e1e20 0%,#18181a 100%)",
      borderRadius:18, border:"1px solid rgba(255,255,255,0.1)",
      overflow:"hidden", textDecoration:"none", transition:"all 0.25s",
      boxShadow:"0 4px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ width:140, height:110, flexShrink:0, overflow:"hidden", background:"#1c1c1e", position:"relative" }}>
        <img src={getImageUrl(event.image)} alt={event.title} className="hp2-list-img"
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.4s" }}
          onError={e=>{e.target.src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop";}}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,transparent 60%,rgba(30,30,32,0.5))" }}/>
      </div>
      <div style={{ flex:1, padding:"14px 16px", minWidth:0, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ display:"flex", gap:6, marginBottom:7, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:10, fontWeight:700, color:status.color, background:status.bg, padding:"2px 8px", borderRadius:999, border:`1px solid ${status.color}35`, fontFamily:"'Be Vietnam Pro',sans-serif" }}>{status.label}</span>
          <CountdownCompact startDate={event.startDate}/>
        </div>
        <h3 style={{ fontSize:14, fontWeight:800, color:"white", marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.02em" }}>{event.title}</h3>
        <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:"white", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <Calendar style={{ width:11,height:11,color:"#f97316" }}/>Bắt đầu: {fmtDate(event.startDate)} · {fmtTime(event.startDate)}
          </span>
          {event.endDate && (
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
              <Calendar style={{ width:11,height:11,color:"#10b981" }}/>Kết thúc: {fmtDate(event.endDate)} · {fmtTime(event.endDate)}
            </span>
          )}
          {event.location && <span style={{ fontSize:11, color:"white", display:"flex", alignItems:"center", gap:4, fontFamily:"'Be Vietnam Pro',sans-serif" }}><MapPin style={{ width:11,height:11,color:"#a855f7" }}/>{event.location}</span>}
        </div>
        {total > 0 && <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
         
        </div>}
      </div>
      <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"flex-end", gap:10, flexShrink:0, borderLeft:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'Be Vietnam Pro',sans-serif", marginBottom:2 }}>Từ</p>
          <span style={{ fontSize:15, fontWeight:900, background:"linear-gradient(90deg,#f97316,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif" }}>{fmtPriceRange({min,max})}</span>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:"white", padding:"8px 18px", borderRadius:999, background:"linear-gradient(135deg,#f97316,#a855f7)", fontFamily:"'Be Vietnam Pro',sans-serif", boxShadow:"0 4px 16px rgba(249,115,22,0.25)", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>Đặt vé <ArrowRight style={{ width:11,height:11 }}/></span>
      </div>
    </Link></Reveal>
  );
};

// ─── ALL EVENTS SECTION ───────────────────────────────────────────────────
const EVENTS_PER_PAGE = 9;
const MAX_VISIBLE_PAGES = 5;

const AllEventsSection = ({
  events,
  loading,
  clearFilters,
  catFilter,
  setCatFilter,
  sortFilter,
  setSortFilter,
  priceFilter,
  setPriceFilter,
  cityFilter,
  dateFilter,
  setDateFilter,
  categories,
  sectionRef,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const hasPaginatedRef = useRef(false);
  const totalPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
  const pageStart = (currentPage - 1) * EVENTS_PER_PAGE;
  const pageEnd = pageStart + EVENTS_PER_PAGE;
  const displayed = events.slice(pageStart, pageEnd);

  const pageWindowStart = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  const pageWindowEnd = Math.min(totalPages, pageWindowStart + MAX_VISIBLE_PAGES - 1);
  const normalizedWindowStart = Math.max(1, pageWindowEnd - MAX_VISIBLE_PAGES + 1);
  const visiblePages = Array.from(
    { length: pageWindowEnd - normalizedWindowStart + 1 },
    (_, index) => normalizedWindowStart + index
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [catFilter, sortFilter, priceFilter, cityFilter, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!sectionRef?.current) return;
    if (!hasPaginatedRef.current) {
      hasPaginatedRef.current = true;
      return;
    }
    const navOffset = 112;
    const top = sectionRef.current.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [currentPage, sectionRef]);

  return (
    <section ref={sectionRef} style={{ background:"linear-gradient(180deg,#0a0f0e 0%,#080c0b 100%)", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth:1152, margin:"0 auto", padding:"52px 24px 28px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:24 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <div style={{ width:3, height:24, background:"linear-gradient(180deg,#f97316,#a855f7)", borderRadius:2 }}/>
              <h2 style={{ fontSize:"clamp(1.1rem,2.5vw,1.6rem)", fontWeight:900, color:"white", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.02em" }}>
                {catFilter !== "all" ? catFilter : "Tất cả sự kiện"}
              </h2>
              {!loading && <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:999, background:"rgba(249,115,22,0.1)", color:"#fb923c", border:"1px solid rgba(249,115,22,0.2)", fontFamily:"'Space Mono',monospace" }}>{events.length}</span>}
            </div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
              {!loading && events.length > 0
                ? `Đang hiển thị ${pageStart + 1}–${Math.min(pageEnd, events.length)} / ${events.length} sự kiện`
                : "Khám phá và đặt vé ngay hôm nay"}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden" }}>
              {SORT_OPTIONS.map(o => (
                <button key={o.value} onClick={()=>setSortFilter(o.value)} style={{
                  padding:"7px 12px", fontSize:11, fontWeight: sortFilter===o.value ? 700 : 500,
                  background: sortFilter===o.value ? "rgba(249,115,22,0.15)" : "transparent",
                  color: sortFilter===o.value ? "#fb923c" : "rgba(255,255,255,0.4)",
                  border:"none", cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap",
                  fontFamily:"'Be Vietnam Pro',sans-serif",
                  borderRight:"1px solid rgba(255,255,255,0.06)",
                }}>{o.label}</button>
              ))}
            </div>
            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden" }}>
              {[{ v:"grid", Icon:LayoutGrid },{ v:"list", Icon:List }].map(({ v, Icon }) => (
                <button key={v} onClick={()=>setViewMode(v)} style={{
                  padding:"7px 10px", background: viewMode===v ? "rgba(249,115,22,0.15)" : "transparent",
                  color: viewMode===v ? "#fb923c" : "rgba(255,255,255,0.35)",
                  border:"none", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center",
                }}><Icon style={{ width:14,height:14 }}/></button>
              ))}
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none", marginBottom:8 }}>
            {[{ value:"all", label:"Tất cả" }, ...categories.map(c=>({ value:c, label:c }))].map((opt) => (
              <button key={opt.value} onClick={()=>setCatFilter(opt.value)} style={{
                padding:"6px 14px", borderRadius:999, fontSize:11, fontWeight:600,
                border: catFilter===opt.value ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.09)",
                background: catFilter===opt.value ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.03)",
                color: catFilter===opt.value ? "#fb923c" : "rgba(255,255,255,0.5)",
                cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap", flexShrink:0,
                fontFamily:"'Be Vietnam Pro',sans-serif",
              }}>

                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px 60px" }}>
        {!loading && events.length === 0 && (
          <div style={{ textAlign:"center", padding:"72px 20px", background:"rgba(255,255,255,0.02)", borderRadius:20, border:"1px dashed rgba(255,255,255,0.08)" }}>
            <div style={{ width:56, height:56, background:"rgba(255,255,255,0.03)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <Search style={{ width:24,height:24,color:"rgba(255,255,255,0.12)" }}/>
            </div>
            <p style={{ fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:5, fontSize:14, fontFamily:"'Be Vietnam Pro',sans-serif" }}>Không tìm thấy sự kiện</p>
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:12, marginBottom:18, fontFamily:"'Be Vietnam Pro',sans-serif" }}>Thử thay đổi bộ lọc hoặc tìm kiếm từ khoá khác</p>
            <button onClick={clearFilters} style={{ display:"inline-flex", alignItems:"center", gap:5, background:"linear-gradient(135deg,#f97316,#a855f7)", color:"white", fontSize:12, fontWeight:700, padding:"9px 18px", borderRadius:999, border:"none", cursor:"pointer", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
              <X style={{ width:12,height:12 }}/> Xoá bộ lọc
            </button>
          </div>
        )}

        {loading && (
          viewMode === "grid" ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:14 }}>
              {[...Array(8)].map((_,i)=><CardSkeleton key={i}/>)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[...Array(6)].map((_,i)=><div key={i} style={{ height:100, borderRadius:14 }} className="hp2-shimmer"/>)}
            </div>
          )
        )}

        {!loading && displayed.length > 0 && viewMode === "grid" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gridAutoRows:"auto", gap:18 }}>
            <div style={{ gridColumn:"span 2", gridRow:"span 2" }}>
              <EventCardTall event={displayed[0]}/>
            </div>
            {displayed.slice(1).map((event, i) => (
              <EventCard key={event._id} event={event} index={i}/>
            ))}
          </div>
        )}

        {!loading && displayed.length > 0 && viewMode === "list" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {displayed.map((event, i) => <EventListRow key={event._id} event={event} index={i}/>)}
          </div>
        )}

        {!loading && events.length > EVENTS_PER_PAGE && (
          <div style={{ display:"flex", justifyContent:"center", marginTop:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:6, borderRadius:999, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  padding:"8px 12px", borderRadius:999, fontSize:11, fontWeight:700,
                  border:"none",
                  background: currentPage === 1 ? "transparent" : "rgba(255,255,255,0.06)",
                  color: currentPage === 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontFamily:"'Be Vietnam Pro',sans-serif",
                  transition:"all 0.2s",
                }}
              >
                <ChevronRight style={{ width:13, height:13, transform:"rotate(180deg)" }}/> Trước
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width:34, height:34, borderRadius:"50%", border:"none",
                    fontSize:11, fontWeight:800, cursor:"pointer", transition:"all 0.2s",
                    background: page === currentPage ? "linear-gradient(135deg,#f97316,#a855f7)" : "transparent",
                    color: page === currentPage ? "white" : "rgba(255,255,255,0.5)",
                    boxShadow: page === currentPage ? "0 4px 16px rgba(249,115,22,0.32)" : "none",
                    fontFamily:"'Space Mono',monospace",
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  padding:"8px 12px", borderRadius:999, fontSize:11, fontWeight:700,
                  border:"none",
                  background: currentPage === totalPages ? "transparent" : "rgba(255,255,255,0.06)",
                  color: currentPage === totalPages ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontFamily:"'Be Vietnam Pro',sans-serif",
                  transition:"all 0.2s",
                }}
              >
                Sau <ChevronRight style={{ width:13, height:13 }}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── WHY US ───────────────────────────────────────────────────────────────
const WhyUsSection = () => (
  <section style={{ background:"linear-gradient(135deg,#0f0d09 0%,#110e08 50%,#0d0b09 100%)", padding:"80px 0", borderTop:"1px solid rgba(249,115,22,0.08)" }}>
    <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
      <Reveal variant="blur" delay={0} duration={800}><div style={{ textAlign:"center", marginBottom:48 }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#a855f7", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.15em", fontFamily:"'Be Vietnam Pro',sans-serif" }}>Tại sao chọn chúng tôi</p>
        <h2 style={{ fontSize:"clamp(1.5rem,3vw,2.25rem)", fontWeight:900, color:"white", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.02em" }}>Trải nghiệm đặt vé tốt nhất</h2>
      </div></Reveal>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {WHY_US.map((item,i) => (
          <div key={i} className="hp2-why-card" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:24, display:"flex", gap:16, alignItems:"flex-start", transition:"all 0.3s" }}>
            <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:`${item.accent}15`,border:`1px solid ${item.accent}25`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <item.icon style={{ width:20,height:20,color:item.accent }}/>
            </div>
            <div>
              <h3 style={{ fontSize:14,fontWeight:800,color:"white",marginBottom:5,fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif" }}>{item.title}</h3>
              <p style={{ fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.7,fontFamily:"'Be Vietnam Pro',sans-serif" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── ORGANIZERS ───────────────────────────────────────────────────────────
const OrganizersSection = () => (
  <section style={{ background:"linear-gradient(135deg,#09090f 0%,#0b0a12 60%,#08080e 100%)", padding:"80px 0", position:"relative", overflow:"hidden", borderTop:"1px solid rgba(168,85,247,0.08)" }}>
    <div style={{ position:"absolute",top:-80,right:-80,width:400,height:400,background:"radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)",pointerEvents:"none" }}/>
    <div style={{ position:"absolute",bottom:-80,left:-80,width:400,height:400,background:"radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)",pointerEvents:"none" }}/>
    <div style={{ position:"absolute",inset:0,opacity:0.02,backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none" }}/>
    <div style={{ maxWidth:1152,margin:"0 auto",padding:"0 24px",position:"relative" }}>
      <Reveal variant="fadeUp" delay={0} duration={800}><div style={{ textAlign:"center",marginBottom:48 }}>
        <p style={{ fontSize:11,fontWeight:700,color:"#f97316",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Be Vietnam Pro',sans-serif" }}>Đối tác</p>
        <h2 style={{ fontSize:"clamp(1.5rem,3vw,2.25rem)",fontWeight:900,color:"white",marginBottom:8,fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif",letterSpacing:"-0.02em" }}>Nhà tổ chức nổi tiếng</h2>
        <p style={{ color:"rgba(255,255,255,0.3)",fontSize:14,fontFamily:"'Be Vietnam Pro',sans-serif" }}>Những đơn vị uy tín và chuyên nghiệp hàng đầu</p>
      </div></Reveal>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:20 }}>
        {FEATURED_ORGANIZERS.map((org, i) => (
          <Reveal key={org.id} variant="scaleUp" delay={i*100} duration={700} threshold={0.08}><div className="hp2-org-card" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:28,textAlign:"center",transition:"all 0.4s",cursor:"pointer" }}>
            <div style={{ position:"relative",width:88,height:88,margin:"0 auto 16px" }}>
              <div className="hp2-org-glow" style={{ position:"absolute",inset:-3,borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#a855f7)",opacity:0.4,filter:"blur(8px)",transition:"opacity 0.4s" }}/>
              <img src={org.avatar} alt={org.name} style={{ position:"relative",width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(255,255,255,0.1)" }} onError={e=>{e.target.src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=150&auto=format&fit=crop";}}/>
              <div style={{ position:"absolute",bottom:-4,right:-4,background:"linear-gradient(135deg,#f97316,#a855f7)",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center" }}><Award style={{ width:14,height:14,color:"white" }}/></div>
            </div>
            <h3 style={{ fontSize:15,fontWeight:800,color:"white",marginBottom:6,fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif" }}>{org.name}</h3>
            <p style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:16,lineHeight:1.6,fontFamily:"'Be Vietnam Pro',sans-serif" }}>{org.description}</p>
            <div style={{ display:"flex",justifyContent:"center",gap:24,marginBottom:20 }}>
              <div style={{ textAlign:"center" }}><p style={{ fontSize:16,fontWeight:800,color:"white",fontFamily:"'Space Mono',monospace" }}>{org.totalEvents}</p><p style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'Be Vietnam Pro',sans-serif" }}>Sự kiện</p></div>
              <div style={{ width:1,background:"rgba(255,255,255,0.08)" }}/>
              <div style={{ textAlign:"center" }}><p style={{ fontSize:16,fontWeight:800,color:"white",fontFamily:"'Space Mono',monospace" }}>{org.followers}</p><p style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'Be Vietnam Pro',sans-serif" }}>Theo dõi</p></div>
            </div>
            <button className="hp2-org-btn" style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.65)",borderRadius:999,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.25s",fontFamily:"'Be Vietnam Pro',sans-serif" }}>Theo dõi</button>
          </div></Reveal>
        ))}
      </div>
    </div>
  </section>
);

// ─── LOCATIONS ────────────────────────────────────────────────────────────
const LocationsSection = () => (
  <section style={{ background:"linear-gradient(135deg,#080f0d 0%,#090e0c 60%,#070c0a 100%)", padding:"80px 0", borderTop:"1px solid rgba(16,185,129,0.08)" }}>
    <div style={{ maxWidth:1152,margin:"0 auto",padding:"0 24px" }}>
      <Reveal variant="blur" delay={0} duration={900}><div style={{ textAlign:"center",marginBottom:36 }}>
        <p style={{ fontSize:11,fontWeight:700,color:"#10b981",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Be Vietnam Pro',sans-serif" }}>Khám phá</p>
        <h2 style={{ fontSize:"clamp(1.5rem,3vw,2.25rem)",fontWeight:900,color:"white",marginBottom:8,fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif",letterSpacing:"-0.02em" }}>Địa điểm phổ biến</h2>
        <p style={{ color:"rgba(255,255,255,0.3)",fontSize:14,fontFamily:"'Be Vietnam Pro',sans-serif" }}>Tìm sự kiện theo thành phố bạn yêu thích</p>
      </div></Reveal>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
        {LOCATIONS.map((loc,i) => (
          <Reveal key={loc.name} variant={i===0?"fadeLeft":i%2===0?"fadeRight":"fadeUp"} delay={i*70} duration={700} threshold={0.06}><Link to={`/?location=${encodeURIComponent(loc.name)}`} className="hp2-loc-card" style={{ position:"relative",overflow:"hidden",borderRadius:16,textDecoration:"none",gridColumn:i===0?"span 2":"span 1",gridRow:i===0?"span 2":"span 1",display:"block" }}>
            <img src={loc.img} alt={loc.name} className="hp2-loc-img" style={{ width:"100%",height:i===0?340:160,objectFit:"cover",display:"block",transition:"transform 0.6s" }} onError={e=>{e.target.src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop";}}/>
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.15) 60%,transparent 100%)" }}/>
            <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:i===0?"20px 22px":"14px 16px",display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
              <div><h3 style={{ color:"white",fontWeight:900,fontSize:i===0?20:14,fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif",letterSpacing:"-0.01em" }}>{loc.name}</h3><p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,marginTop:2,fontFamily:"'Be Vietnam Pro',sans-serif" }}>{loc.count} sự kiện</p></div>
              <div className="hp2-loc-arrow" style={{ width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s" }}><ChevronRight style={{ width:13,height:13,color:"white" }}/></div>
            </div>
          </Link></Reveal>
        ))}
      </div>
    </div>
  </section>
);

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
const HomePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");
  const allEventsSectionRef = useRef(null);
  const scrollToAllEventsSection = (behavior = "smooth") => {
    if (!allEventsSectionRef.current) return;
    const navOffset = 112;
    const top = allEventsSectionRef.current.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, top), behavior });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventRes, ticketRes] = await Promise.all([
          axios.get(`${API_URL}/api/events`),
          axios.get(`${API_URL}/api/tickets`).catch(() => ({ data: [] })),
        ]);

        let data = eventRes.data?.data || eventRes.data || [];
        if (!Array.isArray(data)) data = [];

        const allTickets = ticketRes.data?.data || ticketRes.data || [];
        const minPriceByEvent = buildMinPriceByEvent(allTickets);

        data = data.map(event => {
          const eventId = getEntityId(event?._id || event?.id);
          const minPrice = eventId ? minPriceByEvent[eventId] : undefined;
          if (typeof minPrice !== "number") return event;
          return { ...event, minPrice, lowestPrice: minPrice };
        });

        // ── Ẩn event đã hủy hoặc đã hết hạn dựa trên endDate/startDate ──
        const now = new Date();
        data = data.filter(e => {
          if (e.status === 'cancelled') return false;
          if (e.endDate && new Date(e.endDate) < now) return false;
          if (!e.endDate && e.startDate && new Date(e.startDate) < now) return false;
          return true;
        });

        setCategories([...new Set(data.map(e => e.category).filter(Boolean))]);
        const q = searchParams.get("search");
        if (q) data = data.filter(
          e =>
            e.title?.toLowerCase().includes(q.toLowerCase()) ||
            e.location?.toLowerCase().includes(q.toLowerCase()) ||
            e.category?.toLowerCase().includes(q.toLowerCase())
        );
        setAllEvents(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    let data = [...allEvents];
    if (catFilter !== "all") data = data.filter(e => e.category === catFilter);
    if (priceFilter !== "all") data = data.filter(e => {
      const { min } = getPriceRange(e);
      if (priceFilter === "free") return min === 0 || min === null;
      if (priceFilter === "under500") return min !== null && min > 0 && min < 500000;
      if (priceFilter === "500-2000") return min !== null && min >= 500000 && min <= 2000000;
      if (priceFilter === "over2000") return min !== null && min > 2000000;
      return true;
    });
    if (cityFilter !== "all") data = data.filter(e => matchCity(e.location, cityFilter));
    if (dateFilter !== "all") {
      const today = new Date(); today.setHours(0,0,0,0);
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate()+7);
      const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth()+1);
      const next3End = new Date(today); next3End.setMonth(today.getMonth()+3);
      data = data.filter(e => {
        if (!e.startDate) return false;
        const d = new Date(e.startDate);
        if (dateFilter === "today") return d >= today && d < new Date(today.getTime()+86400000);
        if (dateFilter === "thisweek") return d >= today && d <= weekEnd;
        if (dateFilter === "thismonth") return d >= today && d <= monthEnd;
        if (dateFilter === "next3") return d >= today && d <= next3End;
        return true;
      });
    }
    if (sortFilter === "soonest") data.sort((a,b) => new Date(a.startDate)-new Date(b.startDate));
    if (sortFilter === "newest") data.sort((a,b) => new Date(b.createdAt||b.startDate)-new Date(a.createdAt||a.startDate));
    if (sortFilter === "price_asc") data.sort((a,b) => (getPriceRange(a).min??Infinity)-(getPriceRange(b).min??Infinity));
    if (sortFilter === "price_desc") data.sort((a,b) => (getPriceRange(b).min??-1)-(getPriceRange(a).min??-1));
    setEvents(data);
  }, [allEvents, priceFilter, cityFilter, dateFilter, catFilter, sortFilter]);

  useEffect(() => {
    if (!searchParams.get("search")) return;
    const timer = setTimeout(() => scrollToAllEventsSection("smooth"), 80);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (location.state?.scrollTo !== "all-events") return;
    const timer = setTimeout(() => scrollToAllEventsSection("smooth"), 80);
    return () => clearTimeout(timer);
  }, [location.state]);

  const clearFilters = () => { setPriceFilter("all"); setCityFilter("all"); setDateFilter("all"); setCatFilter("all"); setSortFilter("newest"); };
  const activeFilters = [priceFilter!=="all", cityFilter!=="all", dateFilter!=="all", catFilter!=="all", sortFilter!=="newest"].filter(Boolean).length;
  const search = searchParams.get("search");

  return (
    <div className="hp2-root">

      {/* ── HERO ── */}
      <section style={{ position:"relative", background:"#060606", overflow:"hidden", minHeight:"100svh", display:"grid", gridTemplateColumns:"1fr 1fr", alignItems:"stretch" }}>
        <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"center", padding:"80px 48px 80px 60px" }}>
          <Reveal variant="fadeDown" delay={100} duration={700} threshold={0}><div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)", color:"#fb923c", fontSize:10, fontWeight:700, padding:"6px 12px", borderRadius:999, marginBottom:28, width:"fit-content", fontFamily:"'Be Vietnam Pro',sans-serif", letterSpacing:"0.08em", textTransform:"uppercase" }}>
            <Sparkles style={{ width:11,height:11 }}/> Nền tảng sự kiện #1 Việt Nam
          </div></Reveal>
          <Reveal variant="fadeUp" delay={220} duration={800} threshold={0}><h1 style={{ color:"white", fontWeight:900, lineHeight:1.0, marginBottom:20, fontSize:"clamp(2.8rem,4.5vw,5rem)", fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif", letterSpacing:"-0.035em" }}>
            Sự kiện<br/>
            <span style={{ WebkitTextStroke:"2px rgba(249,115,22,0.6)", WebkitTextFillColor:"transparent", fontStyle:"italic" }}>đặc biệt</span><br/>
            <span style={{ background:"linear-gradient(135deg,#f97316,#ec4899,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>dành cho bạn</span>
          </h1></Reveal>
          <Reveal variant="fadeUp" delay={340} duration={700} threshold={0}><p style={{ color:"rgba(255,255,255,0.4)", marginBottom:36, maxWidth:400, fontSize:14, lineHeight:1.8, fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            Hàng trăm sự kiện âm nhạc, thể thao, văn hóa mỗi tháng - đặt vé nhanh chóng, an toàn, không rủi ro.
          </p></Reveal>
          <form style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.06)", backdropFilter:"blur(16px)", borderRadius:14, maxWidth:460, border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 8px 32px rgba(0,0,0,0.3)", marginBottom:28 }}
            onSubmit={e => {
              e.preventDefault();
              const q = e.target.q.value.trim();
              const nextParams = new URLSearchParams(searchParams);
              if (q) nextParams.set("search", q);
              else nextParams.delete("search");
              setSearchParams(nextParams);
              setTimeout(() => scrollToAllEventsSection("smooth"), 0);
            }}>
            <Search style={{ width:15,height:15,color:"rgba(255,255,255,0.35)",marginLeft:18,flexShrink:0 }}/>
            <input name="q" placeholder="Tìm sự kiện, địa điểm, nghệ sĩ..." defaultValue={search||""} style={{ flex:1,padding:"14px 12px",fontSize:13,color:"white",background:"transparent",border:"none",outline:"none",fontFamily:"'Be Vietnam Pro',sans-serif" }}/>
            <button type="submit" style={{ background:"linear-gradient(135deg,#f97316,#a855f7)",color:"white",fontSize:12,fontWeight:700,padding:"10px 20px",border:"none",cursor:"pointer",borderRadius:10,margin:4,fontFamily:"'Be Vietnam Pro',sans-serif",whiteSpace:"nowrap" }}>Tìm ngay</button>
          </form>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[{ val:`${allEvents.length||"100"}+`, label:"Sự kiện", color:"#f97316" }, { val:"10K+", label:"Người dùng", color:"#a855f7" }, { val:"4.9★", label:"Đánh giá", color:"#fbbf24" }].map((s,i) => (
              <div key={i} style={{ textAlign:"center", padding:"12px 16px", background:"rgba(255,255,255,0.04)", borderRadius:12, border:"1px solid rgba(255,255,255,0.07)", minWidth:80 }}>
                <p style={{ fontSize:20,fontWeight:900,color:s.color,fontFamily:"'Space Mono',monospace",letterSpacing:"-0.02em" }}>{s.val}</p>
                <p style={{ fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"'Be Vietnam Pro',sans-serif",marginTop:2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <Reveal variant="scaleIn" delay={0} duration={1100} threshold={0} style={{position:"relative",overflow:"hidden"}}>
          <div style={{ position:"absolute", inset:0, zIndex:2, background:"#060606", clipPath:"polygon(0 0,12% 0,0 100%)" }}/>
          <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&auto=format&fit=crop&q=80" alt="hero"
            style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }}/>
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(6,6,6,0.5) 0%,rgba(0,0,0,0.1) 60%,rgba(168,85,247,0.12) 100%)" }}/>
          <div style={{ position:"absolute",top:50,right:32,zIndex:3,display:"flex",alignItems:"center",gap:6,background:"rgba(239,68,68,0.15)",backdropFilter:"blur(10px)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:999,padding:"6px 14px" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#ef4444",display:"inline-block" }} className="hp2-pulse"/>
            <span style={{ fontSize:11,fontWeight:700,color:"#f87171",fontFamily:"'Be Vietnam Pro',sans-serif" }}>LIVE NOW</span>
          </div>
        </Reveal>
        <div style={{ position:"absolute",bottom:-60,left:-60,width:280,height:280,borderRadius:"50%",border:"1px solid rgba(249,115,22,0.08)",pointerEvents:"none",zIndex:1 }}/>
        <div style={{ position:"absolute",bottom:-30,left:-30,width:160,height:160,borderRadius:"50%",border:"1px solid rgba(249,115,22,0.12)",pointerEvents:"none",zIndex:1 }}/>
      </section>

      {/* ── FILTER BAR ── */}
      <nav style={{ position:"sticky", top:0, zIndex:40 }}>
        <div style={{ height:1, background:"linear-gradient(90deg,transparent 0%,rgba(249,115,22,0.6) 30%,rgba(168,85,247,0.6) 70%,transparent 100%)" }}/>
        <div style={{ background:"rgba(10,8,6,0.96)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderBottom:"1px solid rgba(249,115,22,0.1)", boxShadow:"0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(249,115,22,0.06) inset" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"12px 0 0", overflowX:"auto", scrollbarWidth:"none", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {DATE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={()=>setDateFilter(opt.value)} style={{
                  padding:"7px 16px", borderRadius:999, fontSize:11, fontWeight:700,
                  border: dateFilter===opt.value ? "none" : "1px solid rgba(255,255,255,0.1)",
                  background: dateFilter===opt.value ? "linear-gradient(135deg,#f97316,#a855f7)" : "rgba(255,255,255,0.04)",
                  color: dateFilter===opt.value ? "white" : "rgba(255,255,255,0.5)",
                  cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap", flexShrink:0,
                  fontFamily:"'Be Vietnam Pro',sans-serif", marginBottom:10,
                  boxShadow: dateFilter===opt.value ? "0 4px 16px rgba(249,115,22,0.3)" : "none",
                  transform: dateFilter===opt.value ? "translateY(-1px)" : "none",
                }}>{opt.label}</button>
              ))}
              <div style={{ flex:1 }}/>
              <div style={{ display:"flex", gap:3, marginBottom:10, flexShrink:0, background:"rgba(255,255,255,0.03)", borderRadius:999, border:"1px solid rgba(255,255,255,0.08)", padding:"3px 4px" }}>
                {PRICE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={()=>setPriceFilter(opt.value)} style={{
                    padding:"4px 11px", borderRadius:999, fontSize:10, fontWeight:700, border:"none",
                    background: priceFilter===opt.value ? "linear-gradient(135deg,rgba(249,115,22,0.3),rgba(168,85,247,0.3))" : "transparent",
                    color: priceFilter===opt.value ? "#fb923c" : "rgba(255,255,255,0.38)",
                    cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap",
                    fontFamily:"'Be Vietnam Pro',sans-serif",
                    boxShadow: priceFilter===opt.value ? "inset 0 0 0 1px rgba(249,115,22,0.4)" : "none",
                  }}>
                    {priceFilter===opt.value && <DollarSign style={{ width:8,height:8,display:"inline",marginRight:2 }}/>}
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:3, marginBottom:10, marginLeft:6, flexShrink:0, background:"rgba(255,255,255,0.03)", borderRadius:999, border:"1px solid rgba(255,255,255,0.08)", padding:"3px 4px" }}>
                {CITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={()=>setCityFilter(opt.value)} style={{
                    padding:"4px 10px", borderRadius:999, fontSize:10, fontWeight:700, border:"none",
                    background: cityFilter===opt.value ? "linear-gradient(135deg,rgba(249,115,22,0.3),rgba(168,85,247,0.3))" : "transparent",
                    color: cityFilter===opt.value ? "#fb923c" : "rgba(255,255,255,0.38)",
                    cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap",
                    fontFamily:"'Be Vietnam Pro',sans-serif",
                    boxShadow: cityFilter===opt.value ? "inset 0 0 0 1px rgba(249,115,22,0.4)" : "none",
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0 10px", overflowX:"auto", scrollbarWidth:"none" }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono',monospace", flexShrink:0 }}>
                <span style={{ fontWeight:900, fontSize:13, background:"linear-gradient(90deg,#f97316,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{events.length}</span>
                <span style={{ color:"rgba(255,255,255,0.25)" }}> kết quả</span>
              </span>
              {activeFilters > 0 && (
                <button onClick={clearFilters} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:999, fontSize:10, fontWeight:700, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#f87171", cursor:"pointer", fontFamily:"'Be Vietnam Pro',sans-serif", flexShrink:0, transition:"all 0.2s" }}>
                  <X style={{ width:10,height:10 }}/> Xoá {activeFilters} bộ lọc
                </button>
              )}
              <div style={{ flex:1 }}/>
              <div style={{ display:"flex", alignItems:"center", gap:2, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:999, padding:"3px 4px", flexShrink:0 }}>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:"'Be Vietnam Pro',sans-serif", padding:"0 6px" }}>Sắp xếp</span>
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} onClick={()=>setSortFilter(o.value)} style={{
                    padding:"4px 12px", borderRadius:999, fontSize:10, fontWeight:700, border:"none",
                    background: sortFilter===o.value ? "linear-gradient(135deg,rgba(249,115,22,0.25),rgba(168,85,247,0.25))" : "transparent",
                    color: sortFilter===o.value ? "#fb923c" : "rgba(255,255,255,0.35)",
                    cursor:"pointer", transition:"all 0.18s", whiteSpace:"nowrap", flexShrink:0,
                    fontFamily:"'Be Vietnam Pro',sans-serif",
                    boxShadow: sortFilter===o.value ? "inset 0 0 0 1px rgba(249,115,22,0.35)" : "none",
                  }}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── FEATURED STRIP ── */}
      {!loading && events.length > 0 && (
        <div style={{ background:"linear-gradient(180deg,#0e0c0a 0%,#0b0a08 100%)", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ maxWidth:1152,margin:"0 auto",padding:"32px 24px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:3,height:22,background:"linear-gradient(180deg,#f97316,#a855f7)",borderRadius:2 }}/>
                <span style={{ fontSize:14,fontWeight:800,color:"white",fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif",letterSpacing:"-0.01em" }}>Sự kiện nổi bật</span>
              </div>
              <Link to="/events" style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.35)",textDecoration:"none",display:"flex",alignItems:"center",gap:3,fontFamily:"'Be Vietnam Pro',sans-serif" }}>Xem tất cả <ChevronRight style={{ width:13,height:13 }}/></Link>
            </div>
            <div style={{ overflowX:"scroll",marginLeft:-24,marginRight:-24,paddingLeft:24,paddingRight:24,scrollbarWidth:"none" }}>
              <div style={{ display:"flex",gap:12,width:"max-content" }}>
                {events.slice(0,7).map((event) => (
                  <Link key={event._id} to={`/event/${event._id}`} className="hp2-strip-card" style={{ width:200,background:"#151311",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",textDecoration:"none",flexShrink:0,display:"block",transition:"all 0.28s" }}>
                    <div style={{ height:120,overflow:"hidden",background:"#1a1a1a",position:"relative" }}>
                      <img src={getImageUrl(event.image)} alt={event.title} className="hp2-strip-img" style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.5s" }} onError={e=>{e.target.src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop";}}/>
                      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 55%)" }}/>
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <p style={{ fontSize:12,fontWeight:700,color:"white",lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif" }}>{event.title}</p>
                      <span style={{ fontSize:10,color:"rgba(255,255,255,0.35)",display:"flex",alignItems:"center",gap:3,marginBottom:2,fontFamily:"'Be Vietnam Pro',sans-serif" }}>
                        <Calendar style={{ width:9,height:9,color:"#f97316" }}/>Bắt đầu: {fmtDate(event.startDate)} · {fmtTime(event.startDate)}
                      </span>
                      {event.endDate && (
                        <span style={{ fontSize:10,color:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",gap:3,marginBottom:4,fontFamily:"'Be Vietnam Pro',sans-serif" }}>
                          <Calendar style={{ width:9,height:9,color:"#10b981" }}/>Kết thúc: {fmtDate(event.endDate)} · {fmtTime(event.endDate)}
                        </span>
                      )}
                      <CountdownCompact startDate={event.startDate}/>
                      <p style={{ fontSize:11,fontWeight:800,background:"linear-gradient(90deg,#f97316,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:"'Be Vietnam Pro','Clash Display',sans-serif",marginTop:4 }}>{fmtPriceRange(getPriceRange(event))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AllEventsSection
        events={events} loading={loading} clearFilters={clearFilters}
        catFilter={catFilter} setCatFilter={setCatFilter}
        sortFilter={sortFilter} setSortFilter={setSortFilter}
        priceFilter={priceFilter} setPriceFilter={setPriceFilter}
        cityFilter={cityFilter}
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        categories={categories}
        sectionRef={allEventsSectionRef}
      />

      <WhyUsSection/>
      <OrganizersSection/>
      <LocationsSection/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700,800,900&display=swap');
        .hp2-root *, .hp2-root { box-sizing:border-box; }
        @keyframes hp2-shimmer { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
        .hp2-shimmer { background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 37%,rgba(255,255,255,0.03) 63%) !important; background-size:1600px 100% !important; animation:hp2-shimmer 1.4s ease infinite; }
        @keyframes hp2-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .hp2-pulse { animation:hp2-pulse 1.4s ease infinite; }
        @media (max-width:768px) { .hp2-root section:first-child { grid-template-columns:1fr !important; } .hp2-root section:first-child > div:last-child { display:none !important; } }
        .hp2-card:hover { border-color:rgba(249,115,22,0.3) !important; transform:translateY(-5px) !important; box-shadow:0 20px 56px rgba(0,0,0,0.65), 0 0 0 1px rgba(249,115,22,0.12) !important; }
        .hp2-card:hover .hp2-card-img { transform:scale(1.08); }
        .hp2-tall-card:hover .hp2-tall-img { transform:scale(1.04); }
        .hp2-list-row:hover { border-color:rgba(249,115,22,0.28) !important; transform:translateX(3px) !important; box-shadow:0 8px 32px rgba(0,0,0,0.5), -3px 0 0 rgba(249,115,22,0.3) !important; }
        .hp2-list-row:hover .hp2-list-img { transform:scale(1.06); }
        .hp2-cta-btn:hover { opacity:0.88; transform:scale(0.97); }
        .hp2-strip-card:hover { border-color:rgba(249,115,22,0.22) !important; transform:translateY(-2px); }
        .hp2-strip-card:hover .hp2-strip-img { transform:scale(1.08); }
        .hp2-org-card:hover { border-color:rgba(249,115,22,0.2) !important; background:rgba(255,255,255,0.05) !important; transform:translateY(-5px); box-shadow:0 20px 60px rgba(0,0,0,0.3); }
        .hp2-org-card:hover .hp2-org-glow { opacity:0.75 !important; }
        .hp2-org-btn:hover { background:linear-gradient(135deg,#f97316,#a855f7) !important; border-color:transparent !important; color:white !important; }
        .hp2-why-card:hover { border-color:rgba(255,255,255,0.1) !important; background:rgba(255,255,255,0.04) !important; transform:translateY(-2px); }
        .hp2-testi-card:hover { border-color:rgba(249,115,22,0.18) !important; transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.4); }
        .hp2-loc-card:hover .hp2-loc-img { transform:scale(1.07); }
        .hp2-loc-card:hover .hp2-loc-arrow { background:linear-gradient(135deg,#f97316,#a855f7) !important; border-color:transparent !important; }
        @media (prefers-reduced-motion:reduce) { *{ transition-duration:0.01ms !important; animation-duration:0.01ms !important; } }
        * { scrollbar-width:none; } ::-webkit-scrollbar { display:none; }
        input::placeholder { color:rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
};

export default HomePage;
