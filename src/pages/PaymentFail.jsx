import { XCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentFail = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100svh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro',sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse,rgba(239,68,68,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 340, height: 340, background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{ width: 80, height: 80, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(239,68,68,0.08)' }}>
          <XCircle style={{ width: 36, height: 36, color: '#f87171' }}/>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, color: 'white', marginBottom: 10, fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", letterSpacing: '-0.02em' }}>
          Thanh toán thất bại
        </h1>

        {/* Description */}
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 32, lineHeight: 1.75, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
          Giao dịch đã bị hủy hoặc có lỗi xảy ra.<br/>
          <span style={{ color: '#34d399', fontWeight: 700 }}>Đừng lo — tiền của bạn chưa bị trừ.</span>
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('/checkout')}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 24px rgba(249,115,22,0.28)', transition: 'all 0.25s' }}
            className="pfail-cta">
            <RefreshCw style={{ width: 15, height: 15 }}/> Thử lại thanh toán
          </button>

          <button onClick={() => navigate('/')}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
            className="pfail-outline">
            <ArrowLeft style={{ width: 13, height: 13 }}/> Về trang chủ
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');
        .pfail-cta:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(249,115,22,0.36) !important}
        .pfail-cta:active{transform:translateY(0)}
        .pfail-outline:hover{border-color:rgba(249,115,22,0.25) !important;color:white !important}
        *{scrollbar-width:none}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
};

export default PaymentFail;