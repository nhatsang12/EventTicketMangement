import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Save, X,
  Ticket, History, QrCode, LogOut, Camera, Shield,
  TrendingUp, Star, Award, ChevronRight, Check
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setAuth } = useAuthStore();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [recentOrders, setRecentOrders] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || 'Ho Chi Minh City',
    bio: user?.bio || '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }
    // Load recent orders from localStorage
    const stored = JSON.parse(localStorage.getItem('ticketHistory') || '[]');
    setRecentOrders(stored.slice(0, 3));

    // Load saved avatar
    const savedAvatar = localStorage.getItem(`avatar_${user?.id}`);
    if (savedAvatar) setAvatarPreview(savedAvatar);
  }, [isAuthenticated, navigate, user?.id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    // Update user in store
    const updatedUser = { ...user, ...formData };
    setAuth(updatedUser, 'fake-access-token', 'fake-refresh-token');
    if (avatarPreview) localStorage.setItem(`avatar_${user?.id}`, avatarPreview);
    setEditing(false);
    toast.success('Cập nhật hồ sơ thành công!');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || 'Ho Chi Minh City',
      bio: user?.bio || '',
    });
    setEditing(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalSpent = recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalTickets = recentOrders.reduce((sum, o) => sum + (o.tickets?.length || 0), 0);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const tabs = [
    { key: 'info', label: 'Thông tin', icon: User },
    { key: 'tickets', label: 'Vé gần đây', icon: Ticket },
    { key: 'security', label: 'Bảo mật', icon: Shield },
  ];

  const quickLinks = [
    { to: '/ticket-history', icon: History, label: 'Lịch sử vé', desc: 'Tất cả đơn hàng & vé' },
    { to: '/checkin', icon: QrCode, label: 'QR Check-in', desc: 'Mô phỏng vào sự kiện' },
    { to: '/my-tickets', icon: Ticket, label: 'Vé của tôi', desc: 'Vé đang active' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-[60px]">

      {/* ── COVER BANNER ── */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-orange-500 via-rose-500 to-purple-700 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* ── PROFILE CARD overlapping banner ── */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  )}
                </div>
                {editing && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
              </div>

              {/* Name & meta */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-orange-100 to-purple-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                    <Award className="w-3 h-3" /> Member
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-400" />{formData.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-purple-400" />Tham gia 2025</span>
                </div>
              </div>

              {/* Edit button */}
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <button onClick={handleCancel}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <X className="w-4 h-4" /> Hủy
                    </button>
                    <button onClick={handleSave}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-full text-sm font-medium hover:from-orange-700 hover:to-purple-700 transition-all shadow-md">
                      <Save className="w-4 h-4" /> Lưu
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border-2 border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-all">
                    <Edit3 className="w-4 h-4" /> Chỉnh sửa
                  </button>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              {[
                { label: 'Đơn hàng', value: recentOrders.length, color: 'text-orange-600' },
                { label: 'Vé đã mua', value: totalTickets, color: 'text-purple-600' },
                { label: 'Đã chi', value: formatPrice(totalSpent), color: 'text-rose-600' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">

          {/* LEFT: Quick links */}
          <div className="md:col-span-1 space-y-4">
            {/* Quick nav */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Nhanh đến</p>
              <div className="space-y-1">
                {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors group">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-purple-100 group-hover:from-orange-500 group-hover:to-purple-600 rounded-lg flex items-center justify-center transition-all">
                      <Icon className="w-4 h-4 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600">{label}</p>
                      <p className="text-xs text-gray-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>

          {/* RIGHT: Tabs content */}
          <div className="md:col-span-2">
            {/* Tab bar */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h3 className="font-bold text-gray-900 text-base">Thông tin cá nhân</h3>

                {[
                  { label: 'Họ và tên', name: 'name', icon: User, type: 'text' },
                  { label: 'Email', name: 'email', icon: Mail, type: 'email' },
                  { label: 'Số điện thoại', name: 'phone', icon: Phone, type: 'tel', placeholder: 'Chưa cập nhật' },
                  { label: 'Địa điểm', name: 'location', icon: MapPin, type: 'text' },
                ].map(({ label, name, icon: Icon, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder={placeholder || label}
                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all ${
                          editing
                            ? 'border-orange-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900'
                            : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                ))}

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Giới thiệu</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Viết vài dòng giới thiệu về bạn..."
                    rows={3}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all resize-none ${
                      editing
                        ? 'border-orange-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900'
                        : 'border-gray-100 bg-gray-50 text-gray-700 cursor-default'
                    }`}
                  />
                </div>

                {editing && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
                    <button onClick={handleSave} className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-orange-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Recent Tickets */}
            {activeTab === 'tickets' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-base">Vé gần đây</h3>
                  <Link to="/ticket-history" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group">
                    Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Ticket className="w-8 h-8 text-orange-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Chưa có vé nào</p>
                    <p className="text-gray-400 text-sm mb-4">Hãy đặt vé sự kiện đầu tiên của bạn!</p>
                    <Link to="/" className="text-sm text-orange-600 hover:underline font-medium">Khám phá sự kiện →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-orange-50/50 transition-colors">
                        {/* Event thumb */}
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                          <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{order.event?.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{order.tickets?.length} vé · {formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">{formatPrice(order.totalAmount)}</p>
                          <span className="text-xs text-green-600 font-medium">✓ Đã xác nhận</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Security */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-base">Bảo mật tài khoản</h3>

                {[
                  { label: 'Đổi mật khẩu', desc: 'Cập nhật mật khẩu của bạn', icon: Shield, action: 'Đổi ngay' },
                  { label: 'Xác thực 2 bước', desc: 'Bảo vệ tài khoản với OTP', icon: Star, action: 'Bật', badge: 'Khuyến nghị' },
                  { label: 'Phiên đăng nhập', desc: 'Quản lý thiết bị đang đăng nhập', icon: TrendingUp, action: 'Xem' },
                ].map(({ label, desc, icon: Icon, action, badge }) => (
                  <div key={label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-purple-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{label}</p>
                          {badge && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <button onClick={() => toast('Tính năng đang phát triển 🚧')}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap">
                      {action}
                    </button>
                  </div>
                ))}

                {/* Danger zone */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vùng nguy hiểm</p>
                  <button onClick={() => toast.error('Tính năng đang phát triển')}
                    className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors">
                    Xóa tài khoản
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;