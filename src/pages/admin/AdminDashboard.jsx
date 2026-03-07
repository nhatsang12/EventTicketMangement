import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Ticket, ShoppingBag, Calendar, ChevronRight, ArrowUp, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = useAuthStore(state => state.accessToken || state.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_URL}/api/orders`, config);
        const data = res.data?.data || res.data || [];
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        toast.error("Không thể tải dữ liệu thống kê từ server!");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const totalRevenue     = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalOrders      = orders.length;
  const totalTicketsSold = orders.reduce(
    (s, o) => s + (Array.isArray(o.tickets) ? o.tickets.length : 0), 0
  );

  const eventMap = {};
  orders.forEach((o) => {
    const eventId   = o.event?._id || o.event || 'unknown';
    const eventName = o.event?.title || o.event?.name || 'Sự kiện';
    if (!eventMap[eventId]) {
      eventMap[eventId] = { eventName, revenue: 0, orders: 0, tickets: 0 };
    }
    eventMap[eventId].revenue += o.totalAmount || 0;
    eventMap[eventId].orders  += 1;
    eventMap[eventId].tickets += Array.isArray(o.tickets) ? o.tickets.length : 0;
  });

  const eventRows = Object.values(eventMap).sort((a, b) => b.revenue - a.revenue);
  const totalEvents = eventRows.length;
  const maxRevenue  = eventRows[0]?.revenue || 1;

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('vi-VN');

  const stats = [
    { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Đơn hàng',       value: totalOrders,               icon: ShoppingBag, from: 'from-purple-500', to: 'to-purple-600' },
    { label: 'Vé đã bán',      value: totalTicketsSold,          icon: Ticket,      from: 'from-blue-500',   to: 'to-blue-600' },
    { label: 'Sự kiện có DT',  value: totalEvents,               icon: Calendar,    from: 'from-emerald-500', to: 'to-emerald-600' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center shadow-md`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                <ArrowUp className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-none mb-1">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu theo sự kiện */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">Doanh thu theo sự kiện</h3>
            <Link to="/admin/analytics" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {eventRows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventRows.slice(0, 5).map((e, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-700 font-medium truncate max-w-[60%]">{e.eventName}</p>
                    <p className="text-xs font-bold text-orange-600">{formatPrice(e.revenue)}</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${(e.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-400">{e.orders} đơn</span>
                    <span className="text-xs text-gray-400">{e.tickets} vé</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Đơn gần đây */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">Đơn gần đây</h3>
            <span className="text-xs text-gray-400">{totalOrders} tổng</span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có đơn hàng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div key={o._id || o.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50/50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {o.event?.title || o.event?.name || 'Sự kiện'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                  </div>
                  <p className="text-xs font-bold text-orange-600 shrink-0">{formatPrice(o.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/events',    label: 'Tạo sự kiện', desc: 'Thêm sự kiện mới',    color: 'from-orange-500 to-orange-600',   bg: 'bg-orange-50 hover:bg-orange-100' },
          { to: '/admin/tickets',   label: 'Loại vé',     desc: 'Quản lý ticket types', color: 'from-purple-500 to-purple-600',   bg: 'bg-purple-50 hover:bg-purple-100' },
          { to: '/admin/checkin',   label: 'Check-in',    desc: 'Quét vé khách',        color: 'from-blue-500 to-blue-600',       bg: 'bg-blue-50 hover:bg-blue-100' },
          { to: '/admin/analytics', label: 'Analytics',   desc: 'Báo cáo chi tiết',     color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
        ].map((a) => (
          <Link key={a.to} to={a.to}
            className={`${a.bg} border border-gray-200 rounded-2xl p-4 group transition-all hover:-translate-y-0.5 hover:shadow-sm`}>
            <div className={`w-9 h-9 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">{a.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;