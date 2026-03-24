import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Menu, X, Ticket, User, LogOut,
  ShoppingCart, ChevronDown, History, QrCode, Settings,
  Sparkles, HelpCircle, MessageSquare, Globe
} from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useCartStore from '../../store/cartStore.js';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [scrolled, setScrolled]             = useState(false);
  const [searchFocused, setSearchFocused]   = useState(false);

  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalQuantity }              = useCartStore();
  const navigate   = useNavigate();
  const location   = useLocation();
  const totalItems = getTotalQuantity();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsHelpMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ══ MAIN NAV ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(6,6,6,0.97)' : 'rgba(6,6,6,0.82)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: scrolled
          ? '1px solid rgba(249,115,22,0.12)'
          : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: 20 }}>

            {/* LOGO */}
            <Link to="/" className="nb-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
              <div className="nb-logo-icon" style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#f97316,#a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(249,115,22,0.35)',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}>
                <Ticket style={{ width: 17, height: 17, color: 'white' }} />
              </div>
              <span style={{
                fontSize: 19, fontWeight: 900, letterSpacing: '-0.04em',
                background: 'linear-gradient(90deg,#fff 30%,rgba(255,255,255,0.5))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif",
              }}>TicketHub</span>
            </Link>

            {/* SEARCH – desktop */}
            <form onSubmit={handleSearch} className="nb-search-form" style={{
              flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center',
              background: searchFocused ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
              border: searchFocused ? '1px solid rgba(249,115,22,0.45)' : '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12,
              boxShadow: searchFocused ? '0 0 0 3px rgba(249,115,22,0.08)' : 'none',
              transition: 'all 0.25s', overflow: 'hidden',
            }}>
              <Search style={{ width: 14, height: 14, marginLeft: 14, flexShrink: 0, transition: 'color 0.2s',
                color: searchFocused ? '#fb923c' : 'rgba(255,255,255,0.3)' }} />
              <input type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Tìm sự kiện, nghệ sĩ, địa điểm..."
                style={{
                  flex: 1, padding: '11px 10px', fontSize: 12,
                  color: 'white', background: 'transparent',
                  border: 'none', outline: 'none',
                  fontFamily: "'Be Vietnam Pro',sans-serif",
                }} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '0 12px', borderLeft: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.3)', fontSize: 11, whiteSpace: 'nowrap',
                fontFamily: "'Be Vietnam Pro',sans-serif",
              }}>
                <MapPin style={{ width: 11, height: 11 }} /> TP.HCM
              </div>
              <button type="submit" className="nb-search-btn" style={{
                background: 'linear-gradient(135deg,#f97316,#a855f7)',
                border: 'none', cursor: 'pointer', padding: '9px 16px', margin: 4,
                borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 700,
                fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'opacity 0.2s',
              }}>Tìm</button>
            </form>

            {/* RIGHT LINKS – desktop */}
            <div className="nb-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

              {[{ to: '/', label: 'Sự kiện' }, { to: '/create-event', label: 'Tổ chức' }].map(({ to, label }) => (
                <Link key={to} to={to} className="nb-nav-link" style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  color: isActive(to) ? '#fb923c' : 'rgba(255,255,255,0.55)',
                  background: isActive(to) ? 'rgba(249,115,22,0.1)' : 'transparent',
                  textDecoration: 'none', fontFamily: "'Be Vietnam Pro',sans-serif",
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>{label}</Link>
              ))}

              {/* Help dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setIsHelpMenuOpen(v => !v); setIsUserMenuOpen(false); }}
                  className="nb-nav-link"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: isHelpMenuOpen ? '#fb923c' : 'rgba(255,255,255,0.55)',
                    background: isHelpMenuOpen ? 'rgba(249,115,22,0.1)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s',
                  }}>
                  Hỗ trợ
                  <ChevronDown style={{ width: 13, height: 13, transition: 'transform 0.25s', transform: isHelpMenuOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {isHelpMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsHelpMenuOpen(false)} />
                    <div className="nb-dropdown" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, zIndex: 20,
                      background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden',
                    }}>
                      {[
                        { to: '/help',    icon: <HelpCircle style={{ width: 13, height: 13 }} />,    label: 'Trung tâm hỗ trợ' },
                        { to: '/contact', icon: <MessageSquare style={{ width: 13, height: 13 }} />, label: 'Liên hệ' },
                      ].map(({ to, icon, label }) => (
                        <Link key={to} to={to} onClick={() => setIsHelpMenuOpen(false)}
                          className="nb-dropdown-item"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 16px', fontSize: 12, fontWeight: 500,
                            color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                            fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.15s',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}>
                          <span style={{ color: '#fb923c' }}>{icon}</span>{label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

              {/* Language Toggle */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setIsLangMenuOpen(v => !v); setIsUserMenuOpen(false); setIsHelpMenuOpen(false); }}
                  className="nb-nav-link"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: isLangMenuOpen ? '#fb923c' : 'rgba(255,255,255,0.55)',
                    background: isLangMenuOpen ? 'rgba(249,115,22,0.1)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s',
                  }}>
                  <Globe style={{ width: 14, height: 14 }} />
                  {i18n.language === 'vi' ? 'VI' : 'EN'}
                </button>
                {isLangMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsLangMenuOpen(false)} />
                    <div className="nb-dropdown" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 140, zIndex: 20,
                      background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden',
                    }}>
                      <button onClick={() => { i18n.changeLanguage('vi'); setIsLangMenuOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', fontSize: 12, fontWeight: 500,
                          color: i18n.language === 'vi' ? '#fb923c' : 'rgba(255,255,255,0.6)',
                          background: 'transparent', border: 'none', width: '100%',
                          cursor: 'pointer', textAlign: 'left',
                          fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.15s',
                        }}>
                        🇻🇳 Tiếng Việt
                      </button>
                      <button onClick={() => { i18n.changeLanguage('en'); setIsLangMenuOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', fontSize: 12, fontWeight: 500,
                          color: i18n.language === 'en' ? '#fb923c' : 'rgba(255,255,255,0.6)',
                          background: 'transparent', border: 'none', width: '100%',
                          cursor: 'pointer', textAlign: 'left',
                          fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.15s',
                        }}>
                        🇬🇧 English
                      </button>
                    </div>
                  </>
                )}
              </div>

              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {totalItems > 0 && (
                    <button onClick={() => navigate('/checkout')} className="nb-icon-btn" style={{
                      position: 'relative', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s',
                    }}>
                      <ShoppingCart style={{ width: 15, height: 15 }} />
                      <span style={{
                        position: 'absolute', top: -5, right: -5,
                        background: 'linear-gradient(135deg,#f97316,#a855f7)',
                        color: 'white', fontSize: 9, fontWeight: 800,
                        width: 16, height: 16, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Space Mono',monospace",
                      }}>{totalItems}</span>
                    </button>
                  )}

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => { setIsUserMenuOpen(v => !v); setIsHelpMenuOpen(false); }}
                      className="nb-avatar-btn"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: isUserMenuOpen ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.06)',
                        border: isUserMenuOpen ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 10, padding: '5px 10px 5px 5px',
                        cursor: 'pointer', transition: 'all 0.22s',
                      }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg,#f97316,#a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 900, color: 'white',
                        fontFamily: "'Clash Display',sans-serif",
                      }}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                        maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                      }}>{user?.name?.split(' ')[0] || 'Tài khoản'}</span>
                      <ChevronDown style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)', transition: 'transform 0.25s', transform: isUserMenuOpen ? 'rotate(180deg)' : 'none' }} />
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsUserMenuOpen(false)} />
                        <div className="nb-dropdown" style={{
                          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 240, zIndex: 20,
                          background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.8)', overflow: 'hidden',
                        }}>
                          {/* User header */}
                          <div style={{
                            padding: '16px 18px',
                            background: 'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(168,85,247,0.08))',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                background: 'linear-gradient(135deg,#f97316,#a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 900, color: 'white',
                                fontFamily: "'Clash Display',sans-serif",
                              }}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                              <div style={{ minWidth: 0 }}>
                                <p style={{
                                  fontSize: 13, fontWeight: 800, color: 'white',
                                  fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif",
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{user?.name}</p>
                                <p style={{
                                  fontSize: 11, color: 'rgba(255,255,255,0.35)',
                                  fontFamily: "'Be Vietnam Pro',sans-serif",
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{user?.email}</p>
                              </div>
                            </div>
                          </div>

                          <div style={{ padding: '6px 0' }}>
                            {user?.role === 'admin' && (
                              <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 18px', marginBottom: 4,
                                background: 'linear-gradient(90deg,rgba(249,115,22,0.08),rgba(168,85,247,0.08))',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                fontSize: 12, fontWeight: 700, color: '#fb923c', textDecoration: 'none',
                                fontFamily: "'Be Vietnam Pro',sans-serif",
                              }}><span>⚙️</span> Admin Panel</Link>
                            )}
                            {[
                              { to: '/profile',        icon: <User style={{ width: 13, height: 13 }} />,    label: 'Hồ sơ của tôi' },
                              { to: '/my-tickets',     icon: <Ticket style={{ width: 13, height: 13 }} />,  label: 'Vé của tôi' },
                              { to: '/ticket-history', icon: <History style={{ width: 13, height: 13 }} />, label: 'Lịch sử vé' },
                              { to: '/checkin',        icon: <QrCode style={{ width: 13, height: 13 }} />,  label: 'QR Check-in' },
                              { to: '/settings',       icon: <Settings style={{ width: 13, height: 13 }} />,label: 'Cài đặt' },
                            ].map(({ to, icon, label }) => (
                              <Link key={to} to={to} onClick={() => setIsUserMenuOpen(false)}
                                className="nb-dropdown-item"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 18px', fontSize: 12, fontWeight: 500,
                                  color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
                                  fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.15s',
                                }}>
                                <span style={{ color: 'rgba(249,115,22,0.7)' }}>{icon}</span>{label}
                              </Link>
                            ))}
                            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
                            <button onClick={() => { logout(); navigate('/login'); setIsUserMenuOpen(false); }}
                              className="nb-logout-btn"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '10px 18px', fontSize: 12, fontWeight: 600,
                                color: 'rgba(239,68,68,0.75)', background: 'transparent',
                                border: 'none', cursor: 'pointer',
                                fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.15s',
                              }}>
                              <LogOut style={{ width: 13, height: 13 }} /> Đăng xuất
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link to="/my-tickets" className="nb-nav-link" style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                    fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'color 0.2s', whiteSpace: 'nowrap',
                  }}>Tìm vé</Link>
                  <Link to="/login" className="nb-login-btn" style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.09)', textDecoration: 'none',
                    fontFamily: "'Be Vietnam Pro',sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>Đăng nhập</Link>
                  <Link to="/register" className="nb-signup-btn" style={{
                    padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 800,
                    color: 'white', background: 'linear-gradient(135deg,#f97316,#a855f7)',
                    textDecoration: 'none', fontFamily: "'Be Vietnam Pro',sans-serif",
                    boxShadow: '0 4px 18px rgba(249,115,22,0.25)', transition: 'all 0.2s',
                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Sparkles style={{ width: 11, height: 11 }} /> Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE HAMBURGER */}
            <div className="nb-mobile-icons" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
              {totalItems > 0 && (
                <button onClick={() => navigate('/checkout')} style={{
                  position: 'relative', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 9, padding: '8px 9px', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  <ShoppingCart style={{ width: 15, height: 15 }} />
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: 'linear-gradient(135deg,#f97316,#a855f7)',
                    color: 'white', fontSize: 9, fontWeight: 800,
                    width: 16, height: 16, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{totalItems}</span>
                </button>
              )}
              <button onClick={() => setIsMenuOpen(v => !v)} style={{
                background: isMenuOpen ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.06)',
                border: isMenuOpen ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.09)',
                borderRadius: 9, padding: '8px 9px', cursor: 'pointer',
                color: isMenuOpen ? '#fb923c' : 'rgba(255,255,255,0.6)', transition: 'all 0.22s',
              }}>
                {isMenuOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ══ MOBILE MENU ══ */}
      <div className="nb-mobile-menu" style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 45,
        background: 'rgba(6,6,6,0.98)', backdropFilter: 'blur(28px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        transform: isMenuOpen ? 'translateY(0)' : 'translateY(-110%)',
        transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        display: 'none',
      }}>
        <div style={{ padding: '16px 16px', maxHeight: 'calc(100svh - 64px)', overflowY: 'auto' }}>
          {/* Mobile search */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12, overflow: 'hidden', marginBottom: 14,
          }}>
            <Search style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)', margin: '12px 10px 12px 14px', flexShrink: 0 }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm sự kiện..."
              style={{
                flex: 1, padding: '11px 0', fontSize: 13,
                color: 'white', background: 'transparent',
                border: 'none', outline: 'none',
                fontFamily: "'Be Vietnam Pro',sans-serif",
              }} />
            <button type="submit" style={{
              background: 'linear-gradient(135deg,#f97316,#a855f7)', border: 'none',
              cursor: 'pointer', padding: '0 18px', color: 'white',
              fontSize: 12, fontWeight: 700, fontFamily: "'Be Vietnam Pro',sans-serif",
            }}>Tìm</button>
          </form>

          {/* Mobile links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
            {[
              { to: '/',             label: 'Sự kiện' },
              { to: '/create-event', label: 'Tổ chức sự kiện' },
              { to: '/my-tickets',   label: 'Tìm vé của tôi' },
              { to: '/help',         label: 'Trung tâm hỗ trợ' },
              { to: '/contact',      label: 'Liên hệ' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                display: 'block', padding: '11px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                color: isActive(to) ? '#fb923c' : 'rgba(255,255,255,0.55)',
                background: isActive(to) ? 'rgba(249,115,22,0.08)' : 'transparent',
                textDecoration: 'none', fontFamily: "'Be Vietnam Pro',sans-serif",
              }}>{label}</Link>
            ))}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

          {/* Mobile Language Toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button onClick={() => i18n.changeLanguage('vi')}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: i18n.language === 'vi' ? 'linear-gradient(135deg,#f97316,#a855f7)' : 'rgba(255,255,255,0.05)',
                border: '1px solid', borderColor: i18n.language === 'vi' ? 'transparent' : 'rgba(255,255,255,0.09)',
                color: 'white', cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif",
              }}>
              🇻🇳 Tiếng Việt
            </button>
            <button onClick={() => i18n.changeLanguage('en')}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: i18n.language === 'en' ? 'linear-gradient(135deg,#f97316,#a855f7)' : 'rgba(255,255,255,0.05)',
                border: '1px solid', borderColor: i18n.language === 'en' ? 'transparent' : 'rgba(255,255,255,0.09)',
                color: 'white', cursor: 'pointer', fontFamily: "'Be Vietnam Pro',sans-serif",
              }}>
              🇬🇧 English
            </button>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

          {isAuthenticated ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', marginBottom: 8,
                background: 'linear-gradient(135deg,rgba(249,115,22,0.06),rgba(168,85,247,0.06))',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#f97316,#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: 'white',
                  fontFamily: "'Clash Display',sans-serif",
                }}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'white', fontFamily: "'Clash Display','Be Vietnam Pro',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Be Vietnam Pro',sans-serif" }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { to: '/ticket-history', icon: <History style={{ width: 14, height: 14 }} />,  label: 'Lịch sử vé' },
                  { to: '/checkin',        icon: <QrCode style={{ width: 14, height: 14 }} />,   label: 'QR Check-in' },
                  { to: '/settings',       icon: <Settings style={{ width: 14, height: 14 }} />, label: 'Cài đặt' },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    fontSize: 12, fontWeight: 500,
                    color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
                    fontFamily: "'Be Vietnam Pro',sans-serif",
                  }}>
                    <span style={{ color: 'rgba(249,115,22,0.65)' }}>{icon}</span>{label}
                  </Link>
                ))}
                <button onClick={() => { logout(); navigate('/login'); setIsMenuOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.75)',
                  width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: "'Be Vietnam Pro',sans-serif",
                }}>
                  <LogOut style={{ width: 14, height: 14 }} /> Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Link to="/login" style={{
                textAlign: 'center', padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 10, fontSize: 13, fontWeight: 700,
                color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                fontFamily: "'Be Vietnam Pro',sans-serif",
              }}>Đăng nhập</Link>
              <Link to="/register" style={{
                textAlign: 'center', padding: '12px',
                background: 'linear-gradient(135deg,#f97316,#a855f7)',
                borderRadius: 10, fontSize: 13, fontWeight: 800,
                color: 'white', textDecoration: 'none',
                fontFamily: "'Be Vietnam Pro',sans-serif",
                boxShadow: '0 4px 18px rgba(249,115,22,0.2)',
              }}>Đăng ký</Link>
            </div>
          )}
          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700,800,900&display=swap');

        @keyframes nb-fade-in {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .nb-dropdown { animation: nb-fade-in 0.18s ease; }

        .nb-logo:hover .nb-logo-icon { transform:rotate(-8deg) scale(1.08) !important; box-shadow:0 6px 24px rgba(249,115,22,0.5) !important; }
        .nb-nav-link:hover { color:rgba(255,255,255,0.9) !important; background:rgba(255,255,255,0.05) !important; }
        .nb-login-btn:hover { background:rgba(255,255,255,0.1) !important; border-color:rgba(255,255,255,0.18) !important; color:white !important; }
        .nb-signup-btn:hover { box-shadow:0 6px 28px rgba(249,115,22,0.4) !important; transform:translateY(-1px); }
        .nb-icon-btn:hover { border-color:rgba(249,115,22,0.35) !important; color:#fb923c !important; background:rgba(249,115,22,0.08) !important; }
        .nb-avatar-btn:hover { border-color:rgba(249,115,22,0.45) !important; background:rgba(249,115,22,0.1) !important; }
        .nb-dropdown-item:hover { background:rgba(249,115,22,0.07) !important; color:rgba(255,255,255,0.9) !important; padding-left:22px !important; }
        .nb-logout-btn:hover { background:rgba(239,68,68,0.08) !important; color:#f87171 !important; }
        .nb-search-btn:hover { opacity:0.88; }

        @media (max-width:900px) { .nb-search-form { display:none !important; } }
        @media (max-width:768px) {
          .nb-desktop-links { display:none !important; }
          .nb-mobile-icons  { display:flex !important; }
          .nb-mobile-menu   { display:block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;