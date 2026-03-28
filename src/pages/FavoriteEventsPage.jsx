import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Heart, MapPin, Trash2 } from 'lucide-react';
import API_URL from '../config/api';
import useAuthStore from '../store/authStore';

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

const sortFavorites = (items) =>
  [...items].sort((a, b) => new Date(b?.addedAt || 0) - new Date(a?.addedAt || 0));

const getImageUrl = (path) =>
  !path
    ? 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&auto=format&fit=crop&q=80'
    : path.startsWith('http')
      ? path
      : `${API_URL}${path}`;

const fmtDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const d = new Date(value);
  if (isNaN(d)) return 'Chưa cập nhật';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const FavoriteEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(sortFavorites(readFavorites(user)));
  }, [user]);

  useEffect(() => {
    const storageKey = getFavoriteStorageKey(user);
    const onStorage = (event) => {
      if (event.key !== storageKey) return;
      setFavorites(sortFavorites(readFavorites(user)));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  const removeFavorite = (eventId) => {
    const next = readFavorites(user).filter((item) => getFavoriteEventId(item) !== eventId);
    writeFavorites(user, next);
    setFavorites(sortFavorites(next));
  };

  const clearAllFavorites = () => {
    writeFavorites(user, []);
    setFavorites([]);
  };

  return (
    <div style={{ minHeight: '100svh', background: '#060606', color: 'white', fontFamily: "'Be Vietnam Pro',sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 26,
          }}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} />
          Về trang chủ
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 22,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 3,
                  height: 22,
                  borderRadius: 2,
                  background: 'linear-gradient(180deg,#f97316,#a855f7)',
                }}
              />
              <h1
                style={{
                  fontSize: 'clamp(1.2rem,2.7vw,1.7rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif",
                }}
              >
                Sự kiện đã yêu thích
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'rgba(249,115,22,0.12)',
                  color: '#fb923c',
                  border: '1px solid rgba(249,115,22,0.24)',
                  fontFamily: "'Space Mono',monospace",
                }}
              >
                <Heart style={{ width: 11, height: 11, fill: 'currentColor' }} />
                {favorites.length}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>
              Danh sách sự kiện bạn đã lưu để xem lại sau.
            </p>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={clearAllFavorites}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.26)',
                color: '#f87171',
                borderRadius: 999,
                padding: '9px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              Xóa tất cả
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '74px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: 16,
                margin: '0 auto 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.18)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.56)', marginBottom: 6 }}>
              Chưa có sự kiện yêu thích
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 18 }}>
              Bạn có thể bấm tim trong trang chi tiết sự kiện để lưu lại.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                textDecoration: 'none',
                padding: '10px 18px',
                color: 'white',
                fontSize: 12,
                fontWeight: 800,
                background: 'linear-gradient(135deg,#f97316,#a855f7)',
                boxShadow: '0 4px 18px rgba(249,115,22,0.3)',
              }}
            >
              Khám phá sự kiện <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {favorites.map((item) => {
              const eventId = getFavoriteEventId(item);
              const hasTarget = Boolean(eventId);
              return (
                <div
                  key={`${eventId || item.title}-${item.addedAt || ''}`}
                  style={{
                    background: 'linear-gradient(180deg,#1b1b1d 0%,#161618 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'relative', height: 152, background: '#131315', overflow: 'hidden' }}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title || 'favorite-event'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75),transparent)' }} />
                    <button
                      onClick={() => eventId && removeFavorite(eventId)}
                      disabled={!eventId}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1px solid rgba(239,68,68,0.35)',
                        background: 'rgba(239,68,68,0.22)',
                        color: '#fca5a5',
                        cursor: hasTarget ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Heart style={{ width: 13, height: 13, fill: 'currentColor' }} />
                    </button>
                  </div>

                  <div style={{ padding: '14px 15px 15px' }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        lineHeight: 1.45,
                        marginBottom: 8,
                        color: 'white',
                        fontFamily: "'Be Vietnam Pro','Clash Display',sans-serif",
                      }}
                    >
                      {item.title || 'Sự kiện chưa có tiêu đề'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar style={{ width: 11, height: 11, color: '#f97316' }} />
                        {fmtDate(item.startDate)}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin style={{ width: 11, height: 11, color: '#a855f7' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.location || 'Chưa cập nhật'}
                        </span>
                      </span>
                    </div>

                    {hasTarget ? (
                      <Link
                        to={`/event/${eventId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          color: '#fb923c',
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        Xem chi tiết <ArrowRight style={{ width: 12, height: 12 }} />
                      </Link>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.26)' }}>Không có liên kết sự kiện</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');
      `}</style>
    </div>
  );
};

export default FavoriteEventsPage;
