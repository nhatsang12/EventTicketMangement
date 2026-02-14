import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Menu, X, Ticket, User, LogOut, ShoppingCart, ChevronDown, History, QrCode, Settings } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useCartStore from '../../store/cartStore.js';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalQuantity } = useCartStore();
  const navigate = useNavigate();
  const totalItems = getTotalQuantity();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-[60px] gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 bg-gradient-to-r from-orange-600 to-purple-600 rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                TicketHub
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-2xl relative">
              <div className="flex items-center w-full border border-gray-300 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all shadow-sm bg-white">
                <div className="flex items-center pl-4 pr-2 text-gray-400"><Search className="w-4 h-4" /></div>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events"
                  className="flex-1 py-2.5 px-2 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm" />
                <div className="flex items-center px-4 border-l border-gray-200 text-gray-500 text-sm cursor-pointer hover:text-orange-500 transition-colors whitespace-nowrap">
                  <MapPin className="w-4 h-4 mr-1.5" /><span>Your Location</span>
                </div>
                <button type="submit" className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white px-3 py-2.5 m-1 rounded-full transition-all">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Right nav */}
            <div className="hidden md:flex items-center gap-6 shrink-0">
              <Link to="/" className="text-gray-700 text-sm font-medium hover:text-orange-500 transition-colors whitespace-nowrap">Find Events</Link>
              <Link to="/create-event" className="text-gray-700 text-sm font-medium hover:text-orange-500 transition-colors whitespace-nowrap">Create Events</Link>

              {/* Help dropdown */}
              <div className="relative">
                <button onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)} className="flex items-center gap-1 text-gray-700 text-sm font-medium hover:text-orange-500 transition-colors whitespace-nowrap">
                  Help Centre <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHelpMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isHelpMenuOpen && (
                  <><div className="fixed inset-0 z-10" onClick={() => setIsHelpMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                      <Link to="/help" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors" onClick={() => setIsHelpMenuOpen(false)}>Help Center</Link>
                      <Link to="/contact" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors" onClick={() => setIsHelpMenuOpen(false)}>Contact Us</Link>
                    </div>
                  </>
                )}
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  {/* Cart */}
                  {totalItems > 0 && (
                    <button onClick={() => navigate('/checkout')} className="relative text-gray-700 hover:text-orange-500 transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-600 to-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">{totalItems}</span>
                    </button>
                  )}

                  {/* Avatar */}
                  <div className="relative">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-1.5 group">
                      <div className="w-9 h-9 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-105 transition-transform">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserMenuOpen && (
                      <><div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
                          {/* User header */}
                          <div className="px-4 py-4 bg-gradient-to-r from-orange-50 to-purple-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="py-2">
                            {user?.role === 'admin' && (
                              <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-orange-50 to-purple-50 text-orange-600 hover:from-orange-100 hover:to-purple-100 transition-colors border-b border-orange-100 mb-1" onClick={() => setIsUserMenuOpen(false)}>
                                <span className="w-4 h-4 text-center">⚙️</span> Admin Panel
                              </Link>
                            )}
                            {[
                              { to: '/profile', icon: <User className="w-4 h-4" />, label: 'My Profile' },
                              { to: '/my-tickets', icon: <Ticket className="w-4 h-4" />, label: 'My Tickets' },
                              { to: '/ticket-history', icon: <History className="w-4 h-4" />, label: 'View Ticket History' },
                              { to: '/checkin', icon: <QrCode className="w-4 h-4" />, label: 'QR Check-in' },
                              { to: '/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
                            ].map(({ to, icon, label }) => (
                              <Link key={to} to={to} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                {icon}{label}
                              </Link>
                            ))}
                            <hr className="my-2 border-gray-100" />
                            <button onClick={() => { logout(); navigate('/login'); setIsUserMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                              <LogOut className="w-4 h-4" /> Log Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/my-tickets" className="text-gray-700 text-sm font-medium hover:text-orange-500 transition-colors whitespace-nowrap">Find my tickets</Link>
                  <Link to="/login" className="text-gray-700 text-sm font-medium hover:text-orange-500 transition-colors whitespace-nowrap">Log In</Link>
                  <Link to="/register" className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white px-5 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap">Sign Up</Link>
                </>
              )}
            </div>

            {/* Mobile icons */}
            <div className="md:hidden flex items-center gap-3">
              <button className="text-gray-700 hover:text-orange-500"><Search className="w-5 h-5" /></button>
              {totalItems > 0 && (
                <button onClick={() => navigate('/checkout')} className="relative text-gray-700 hover:text-orange-500">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-600 to-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">{totalItems}</span>
                </button>
              )}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-orange-500">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
          <div className="px-4 py-4 space-y-3">
            <form onSubmit={handleSearch} className="flex">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-400 text-sm" />
              <button type="submit" className="bg-gradient-to-r from-orange-600 to-purple-600 text-white px-4 rounded-r-full"><Search className="w-4 h-4" /></button>
            </form>
            <div className="space-y-1 pt-1">
              {[['/', 'Find Events'], ['/create-event', 'Create Events'], ['/my-tickets', 'Find my tickets'], ['/help', 'Help Centre']].map(([to, label]) => (
                <Link key={to} to={to} className="block py-2.5 px-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-sm font-medium" onClick={() => setIsMenuOpen(false)}>{label}</Link>
              ))}
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 py-3 px-3 border-t border-gray-100 mt-2">
                    <div className="w-9 h-9 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div><p className="font-medium text-gray-800 text-sm">{user?.name}</p><p className="text-xs text-gray-500">{user?.email}</p></div>
                  </div>
                  <Link to="/ticket-history" className="flex items-center gap-2 py-2.5 px-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-sm" onClick={() => setIsMenuOpen(false)}><History className="w-4 h-4" /> View Ticket History</Link>
                  <Link to="/checkin" className="flex items-center gap-2 py-2.5 px-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-sm" onClick={() => setIsMenuOpen(false)}><QrCode className="w-4 h-4" /> QR Check-in</Link>
                  <button onClick={() => { logout(); setIsMenuOpen(false); navigate('/login'); }} className="flex items-center gap-2 w-full py-2.5 px-3 text-red-500 hover:bg-red-50 rounded-lg text-sm"><LogOut className="w-4 h-4" /> Log Out</button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 mt-2">
                  <Link to="/login" className="text-center py-2.5 border border-gray-300 rounded-full text-gray-700 text-sm hover:border-orange-500 hover:bg-orange-50" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                  <Link to="/register" className="text-center py-2.5 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-full text-sm" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;