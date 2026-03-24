import { useEffect, useState } from 'react';
import { XCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API_URL from '../config/api';

const PaymentFail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(30);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) return undefined;

    let isMounted = true;

    const markCancelled = async () => {
      try {
        await fetch(`${API_URL}/api/payments/mark-cancelled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
      } catch {
        // silent fallback
      }
    };

    markCancelled();

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (!isMounted) return;
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 30 - elapsedSeconds);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [orderId]);

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
          {t('paymentPage.paymentFailed')}
        </h1>

        {/* Description */}
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 32, lineHeight: 1.75, fontFamily: "'Be Vietnam Pro',sans-serif" }}>
          {t('paymentPage.paymentFailedDesc')}<br/>
          <span style={{ color: '#34d399', fontWeight: 700 }}>{t('paymentPage.dontWorry')}</span>
        </p>

        {orderId ? (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: -16, marginBottom: 22, lineHeight: 1.6 }}>
            Đã ghi nhận hủy thanh toán. Vé sẽ được hoàn lại sau khoảng <strong>{secondsLeft}s</strong>.
          </p>
        ) : null}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('/checkout')}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#a855f7)', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 24px rgba(249,115,22,0.28)', transition: 'all 0.25s' }}
            className="pfail-cta">
            <RefreshCw style={{ width: 15, height: 15 }}/> {t('common.retry')}
          </button>

          <button onClick={() => navigate('/')}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
            className="pfail-outline">
            <ArrowLeft style={{ width: 13, height: 13 }}/> {t('footer.home')}
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
