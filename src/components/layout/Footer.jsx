import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Ticket, Heart, ArrowRight, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ position:'relative', background:'linear-gradient(180deg,#070707 0%,#040404 100%)', color:'white', overflow:'hidden', fontFamily:"'Be Vietnam Pro',sans-serif" }}>

      {/* Ambient glows */}
      <div style={{ position:'absolute', top:-120, left:'15%', width:480, height:480, background:'radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, right:'10%', width:400, height:400, background:'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents:'none' }}/>

      {/* Dot grid */}
      <div style={{ position:'absolute', inset:0, opacity:0.018, backgroundImage:'radial-gradient(circle,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>

      {/* Top glow line */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent 0%,rgba(249,115,22,0.55) 25%,rgba(168,85,247,0.55) 75%,transparent 100%)' }}/>

      <div style={{ maxWidth:1152, margin:'0 auto', padding:'64px 24px 0' }}>

        {/* ── MAIN GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1.2fr', gap:40, marginBottom:56 }} className="ft-grid">

          {/* Brand */}
          <div>
            <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:20 }} className="ft-logo">
              <div style={{
                width:38, height:38, borderRadius:10,
                background:'linear-gradient(135deg,#f97316,#a855f7)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 18px rgba(249,115,22,0.3)',
                transition:'transform 0.25s, box-shadow 0.25s',
              }} className="ft-logo-icon">
                <Ticket style={{ width:17, height:17, color:'white' }}/>
              </div>
              <span style={{
                fontSize:20, fontWeight:900, letterSpacing:'-0.04em',
                background:'linear-gradient(90deg,#fff 30%,rgba(255,255,255,0.5))',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                fontFamily:"'Clash Display','Be Vietnam Pro',sans-serif",
              }}>TicketHub</span>
            </Link>

            <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.8, marginBottom:22, maxWidth:260 }}>
              Nền tảng đặt vé sự kiện trực tuyến hàng đầu Việt Nam. Khám phá và sở hữu vé cho những khoảnh khắc đáng nhớ.
            </p>

            {/* Social */}
            <div style={{ display:'flex', gap:8, marginBottom:28 }}>
              {[
                { Icon: Facebook, href:'#', label:'Facebook' },
                { Icon: Instagram, href:'#', label:'Instagram' },
                { Icon: Twitter, href:'#', label:'Twitter' },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="ft-social"
                  style={{
                    width:34, height:34, borderRadius:9,
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.09)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'rgba(255,255,255,0.4)',
                    textDecoration:'none', transition:'all 0.22s',
                  }}>
                  <Icon style={{ width:14, height:14 }}/>
                </a>
              ))}
            </div>

            {/* Mini badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(249,115,22,0.07)',
              border:'1px solid rgba(249,115,22,0.18)',
              borderRadius:999, padding:'5px 12px',
              fontSize:10, fontWeight:700, color:'#fb923c', letterSpacing:'0.06em',
            }}>
              <Sparkles style={{ width:10, height:10 }}/> Nền tảng #1 Việt Nam
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:18 }}>
              Liên kết nhanh
            </h3>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:2 }}>
              {[
                { to:'/',               label:'Trang chủ' },
                { to:'/events',         label:'Sự kiện' },
                { to:'/my-tickets',     label:'Vé của tôi' },
                { to:'/ticket-history', label:'Lịch sử vé' },
                { to:'/create-event',   label:'Tạo sự kiện' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="ft-link" style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'7px 0', fontSize:13, fontWeight:500,
                    color:'rgba(255,255,255,0.45)', textDecoration:'none',
                    transition:'all 0.18s',
                  }}>
                    <span style={{
                      width:4, height:4, borderRadius:'50%',
                      background:'rgba(255,255,255,0.15)',
                      flexShrink:0, transition:'background 0.18s',
                    }} className="ft-dot"/>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:18 }}>
              Hỗ trợ
            </h3>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:2 }}>
              {[
                'Trung tâm trợ giúp',
                'Điều khoản sử dụng',
                'Chính sách bảo mật',
                'Chính sách hoàn tiền',
              ].map((label) => (
                <li key={label}>
                  <a href="#" className="ft-link ft-link-purple" style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'7px 0', fontSize:13, fontWeight:500,
                    color:'rgba(255,255,255,0.45)', textDecoration:'none',
                    transition:'all 0.18s',
                  }}>
                    <span style={{
                      width:4, height:4, borderRadius:'50%',
                      background:'rgba(255,255,255,0.15)',
                      flexShrink:0, transition:'background 0.18s',
                    }} className="ft-dot ft-dot-purple"/>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:18 }}>
              Liên hệ
            </h3>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { Icon: MapPin, text:'123 Đường ABC, Quận 1, TP.HCM', accent:'#f97316' },
                { Icon: Phone, text:'1900 1234', accent:'#a855f7' },
                { Icon: Mail,  text:'support@tickethub.vn', accent:'#10b981' },
              ].map(({ Icon, text, accent }) => (
                <li key={text} style={{ display:'flex', alignItems:'flex-start', gap:10 }} className="ft-contact-item">
                  <div style={{
                    width:32, height:32, borderRadius:9, flexShrink:0,
                    background:`${accent}12`,
                    border:`1px solid ${accent}22`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.22s',
                  }} className="ft-contact-icon">
                    <Icon style={{ width:13, height:13, color: accent }}/>
                  </div>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.7, paddingTop:6 }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div style={{
          borderTop:'1px solid rgba(255,255,255,0.06)',
          padding:'20px 0 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:12,
        }}>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.22)', fontFamily:"'Space Mono',monospace" }}>
            © {new Date().getFullYear()} TicketHub. All rights reserved.
          </p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', gap:5 }}>
            Made with <Heart style={{ width:11, height:11, color:'#f43f5e', fill:'#f43f5e' }}/> in Ho Chi Minh City
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        .ft-logo:hover .ft-logo-icon {
          transform: rotate(-8deg) scale(1.08) !important;
          box-shadow: 0 6px 24px rgba(249,115,22,0.5) !important;
        }
        .ft-social:hover {
          background: linear-gradient(135deg,#f97316,#a855f7) !important;
          border-color: transparent !important;
          color: white !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(249,115,22,0.25);
        }
        .ft-link:hover {
          color: #fb923c !important;
          padding-left: 4px !important;
        }
        .ft-link:hover .ft-dot { background: #f97316 !important; }
        .ft-link-purple:hover { color: #c084fc !important; }
        .ft-link-purple:hover .ft-dot-purple { background: #a855f7 !important; }
        .ft-contact-item:hover .ft-contact-icon {
          transform: scale(1.1);
        }

        @media (max-width: 900px) {
          .ft-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .ft-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;