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
    { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, change: '+12%', up: true, from: 'from-orange-500', to: 'to-orange-700' },
    { label: 'Đơn hàng', value: totalOrders, icon: ShoppingBag, change: '+8%', up: true, from: 'from-purple-500', to: 'to-purple-700' },
    { label: 'Vé đã bán', value: totalTickets, icon: Ticket, change: '+15%', up: true, from: 'from-blue-500', to: 'to-blue-700' },
    { label: 'Sự kiện', value: events.length, icon: Calendar, change: '0%', up: false, from: 'from-emerald-500', to: 'to-emerald-700' },
  ];

  // Revenue by event
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
          <div key={s.label} className="bg-gray-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${s.up ? 'text-emerald-400' : 'text-gray-500'}`}>
                {s.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <p className="text-xl font-bold text-white leading-none mb-1">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by event */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Doanh thu theo sự kiện</h3>
            <Link to="/admin/analytics" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {eventStats.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventStats.map(([name, data]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-300 truncate max-w-[60%]">{name}</p>
                    <p className="text-xs font-bold text-orange-400">{formatPrice(data.revenue)}</p>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-600">{data.orders} đơn</span>
                    <span className="text-xs text-gray-600">{data.tickets} vé</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Đơn gần đây</h3>
            <span className="text-xs text-gray-500">{totalOrders} tổng</span>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có đơn hàng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{o.event?.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <p className="text-xs font-bold text-orange-400 shrink-0">{formatPrice(o.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/events', label: 'Tạo sự kiện', desc: 'Thêm sự kiện mới', color: 'from-orange-500 to-orange-700' },
          { to: '/admin/tickets', label: 'Loại vé', desc: 'Quản lý ticket types', color: 'from-purple-500 to-purple-700' },
          { to: '/admin/checkin', label: 'Check-in', desc: 'Quét vé khách', color: 'from-blue-500 to-blue-700' },
          { to: '/admin/analytics', label: 'Analytics', desc: 'Báo cáo chi tiết', color: 'from-emerald-500 to-emerald-700' },
        ].map((a) => (
          <Link key={a.to} to={a.to}
            className="bg-gray-900 border border-white/5 hover:border-white/15 rounded-2xl p-4 group transition-all hover:-translate-y-0.5">
            <div className={`w-9 h-9 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-semibold text-white">{a.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;