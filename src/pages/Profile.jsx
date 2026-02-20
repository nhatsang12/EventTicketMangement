import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Save, X,
  Ticket, History, QrCode, LogOut, Camera, Shield,
  TrendingUp, Star, Award, ChevronRight, Check, Sparkles
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setAuth } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);
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

  // 👇 ĐÂY LÀ ĐOẠN LẤY DỮ LIỆU THẬT TỪ BACKEND ĐÃ ĐƯỢC THÊM VÀO AN TOÀN
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }

    const savedAvatar = localStorage.getItem(`avatar_${user?.id}`);
    if (savedAvatar) setAvatarPreview(savedAvatar);

    const fetchRecentOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:8000/api/orders/my-orders', config);
        
        let ordersData = res.data?.data || res.data || [];
        ordersData = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
        setRecentOrders(ordersData);
      } catch (error) {
        console.error("Lỗi lấy đơn hàng gần đây:", error);
      }
    };

    fetchRecentOrders();
  }, [isAuthenticated, navigate, user?.id, token]);

  // 👇 CÁC HÀM NÀY BỊ BẠN LỠ TAY XÓA MẤT NAY ĐÃ ĐƯỢC PHỤC HỒI
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
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
      <div className="relative h-52 md:h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-rose-500 to-purple-700" />
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-orange-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 right-1/3 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl" />
        <div className="absolute top-6 right-10 w-40 h-40 bg-rose-300/20 rounded-full blur-2xl" />
        <Sparkles className="absolute top-8 right-24 w-6 h-6 text-white/20" />
        <Sparkles className="absolute bottom-10 left-16 w-4 h-4 text-white/15" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4">

        {/* ── PROFILE CARD overlapping banner ── */}
        <div className="relative -mt-20 md:-mt-24 mb-8 z-10">
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100/80 p-6 md:p-8">

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-6">
              {/* Avatar */}
              <div className="relative shrink-0 -mt-16 md:-mt-20">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-4xl font-bold text-white tracking-tight">{initials}</span>
                  }
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
                {editing && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-7 h-7 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
              </div>

              {/* Name & meta */}
              <div className="flex-1 text-center sm:text-left pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{user?.name}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-100 to-purple-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200/60 self-center sm:self-auto">
                    <Award className="w-3 h-3" /> Member
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{user?.email}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    {formData.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Tham gia 2025
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0 pb-1">
                {editing ? (
                  <>
                    <button onClick={handleCancel}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                      <X className="w-4 h-4" /> Hủy
                    </button>
                    <button onClick={handleSave}
                      className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg shadow-orange-200">
                      <Save className="w-4 h-4" /> Lưu
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-all">
                    <Edit3 className="w-4 h-4" /> Chỉnh sửa
                  </button>
                )}
              </div>
            </div>

            {/* ── STATS STRIP ── */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-gray-100">
              {[
                { label: 'Đơn hàng', value: recentOrders.length, from: 'from-orange-500', to: 'to-orange-600', bg: 'bg-orange-50', text: 'text-orange-600' },
                { label: 'Vé đã mua', value: totalTickets, from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
                { label: 'Đã chi tiêu', value: formatPrice(totalSpent), from: 'from-rose-500', to: 'to-rose-600', bg: 'bg-rose-50', text: 'text-rose-600' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                  <p className={`text-xl md:text-2xl font-bold ${s.text} leading-tight`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">

          {/* LEFT SIDEBAR */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Truy cập nhanh</p>
              <div className="space-y-1">
                {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all group">
                    <div className="w-9 h-9 bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0">
                      <Icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">{label}</p>
                      <p className="text-xs text-gray-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-20 bg-white/5 rounded-full blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-bold text-yellow-300">Member</span>
                </div>
                <p className="text-white/90 text-xs leading-relaxed">
                  Tích lũy điểm thưởng qua mỗi vé để nhận ưu đãi độc quyền!
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-white/70">Tiến độ lên hạng Silver</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-[30%] bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>

          {/* RIGHT CONTENT */}
          <div className="md:col-span-2">
            <div className="flex gap-1 bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl mb-5">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md shadow-orange-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* ── TAB: THÔNG TIN ── */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-base">Thông tin cá nhân</h3>
                  {!editing && (
                    <button onClick={() => setEditing(true)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Họ và tên', name: 'name', icon: User, type: 'text' },
                    { label: 'Email', name: 'email', icon: Mail, type: 'email' },
                    { label: 'Số điện thoại', name: 'phone', icon: Phone, type: 'tel', placeholder: 'Chưa cập nhật' },
                    { label: 'Địa điểm', name: 'location', icon: MapPin, type: 'text' },
                  ].map(({ label, name, icon: Icon, type, placeholder }) => (
                    <div key={name}>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
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
                              ? 'border-orange-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-gray-900'
                              : 'border-gray-100 bg-gray-50/80 text-gray-700 cursor-default'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Giới thiệu</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Viết vài dòng giới thiệu về bạn..."
                    rows={3}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all resize-none ${
                      editing
                        ? 'border-orange-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-gray-900'
                        : 'border-gray-100 bg-gray-50/80 text-gray-700 cursor-default'
                    }`}
                  />
                </div>

                {editing && (
                  <div className="flex gap-3 pt-1">
                    <button onClick={handleCancel}
                      className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                      Hủy
                    </button>
                    <button onClick={handleSave}
                      className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: VÉ GẦN ĐÂY ── */}
            {activeTab === 'tickets' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-base">Vé gần đây</h3>
                  <Link to="/ticket-history"
                    className="text-sm text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1 group">
                    Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-14">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Ticket className="w-10 h-10 text-orange-400" />
                    </div>
                    <p className="text-gray-700 font-bold mb-1">Chưa có vé nào</p>
                    <p className="text-gray-400 text-sm mb-5">Hãy đặt vé sự kiện đầu tiên của bạn!</p>
                    <Link to="/"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-orange-600 hover:to-purple-700 transition-all">
                      Khám phá sự kiện →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order._id || order.id}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-orange-100">
                          <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Hỗ trợ trường title hoặc name tùy backend của bạn */}
                          <p className="text-sm font-bold text-gray-900 truncate">{order.event?.title || order.event?.name || 'Sự kiện chưa rõ'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{order.tickets?.length || 0} vé · {formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                            {formatPrice(order.totalAmount)}
                          </p>
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold mt-0.5">
                            <Check className="w-3 h-3" /> Đã xác nhận
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: BẢO MẬT ── */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-base mb-4">Bảo mật tài khoản</h3>

                {[
                  { label: 'Đổi mật khẩu', desc: 'Cập nhật mật khẩu của bạn', icon: Shield, action: 'Đổi ngay', color: 'from-blue-100 to-blue-200', iconColor: 'text-blue-600' },
                  { label: 'Xác thực 2 bước', desc: 'Bảo vệ tài khoản với OTP', icon: Star, action: 'Bật', badge: 'Khuyến nghị', color: 'from-orange-100 to-orange-200', iconColor: 'text-orange-600' },
                  { label: 'Phiên đăng nhập', desc: 'Quản lý thiết bị đang đăng nhập', icon: TrendingUp, action: 'Xem', color: 'from-purple-100 to-purple-200', iconColor: 'text-purple-600' },
                ].map(({ label, desc, icon: Icon, action, badge, color, iconColor }) => (
                  <div key={label}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{label}</p>
                          {badge && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-bold">
                              {badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toast('Tính năng đang phát triển 🚧')}
                      className="text-sm font-bold text-orange-500 hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 px-4 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap border border-orange-200 hover:border-transparent">
                      {action}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;