import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Ticket, ShoppingBag, Users, ChevronRight, Calendar, MapPin, ArrowUp, ArrowDown } from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('ticketHistory') || '[]');
    setOrders(stored);
    const storedEvents = JSON.parse(localStorage.getItem('adminEvents') || '[]');
    setEvents(storedEvents);
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalTickets = orders.reduce((s, o) => s + (o.tickets?.length || 0), 0);
  const totalOrders = orders.length;

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  const formatDate = (iso) => new Date(iso).toLocaleDateString('vi-VN');

  const stats = [
    { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, change: '+12%', up: true, from: 'from-orange-500', to: 'to-orange-600' },
    { label: 'Đơn hàng', value: totalOrders, icon: ShoppingBag, change: '+8%', up: true, from: 'from-purple-500', to: 'to-purple-600' },
    { label: 'Vé đã bán', value: totalTickets, icon: Ticket, change: '+15%', up: true, from: 'from-blue-500', to: 'to-blue-600' },
    { label: 'Sự kiện', value: events.length, icon: Calendar, change: '0%', up: false, from: 'from-emerald-500', to: 'to-emerald-600' },
  ];

  const revenueByEvent = orders.reduce((acc, order) => {
    const name = order.event?.name || 'Unknown';
    if (!acc[name]) acc[name] = { revenue: 0, tickets: 0, orders: 0 };
    acc[name].revenue += order.totalAmount || 0;
    acc[name].tickets += order.tickets?.length || 0;
    acc[name].orders += 1;
    return acc;
  }, {});

  const eventStats = Object.entries(revenueByEvent)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const maxRevenue = eventStats[0]?.[1]?.revenue || 1;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center shadow-md`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${s.up ? 'text-emerald-600' : 'text-gray-400'}`}>
                {s.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-none mb-1">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by event */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">Doanh thu theo sự kiện</h3>
            <Link to="/admin/analytics" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {eventStats.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventStats.map(([name, data]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-700 font-medium truncate max-w-[60%]">{name}</p>
                    <p className="text-xs font-bold text-orange-600">{formatPrice(data.revenue)}</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-400">{data.orders} đơn</span>
                    <span className="text-xs text-gray-400">{data.tickets} vé</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
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
                <div key={o.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50/50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{o.event?.name}</p>
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
          { to: '/admin/events', label: 'Tạo sự kiện', desc: 'Thêm sự kiện mới', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 hover:bg-orange-100' },
          { to: '/admin/tickets', label: 'Loại vé', desc: 'Quản lý ticket types', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
          { to: '/admin/checkin', label: 'Check-in', desc: 'Quét vé khách', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
          { to: '/admin/analytics', label: 'Analytics', desc: 'Báo cáo chi tiết', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
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