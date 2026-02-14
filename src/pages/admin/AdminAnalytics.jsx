import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Ticket, BarChart3, Download, Calendar, ArrowUp } from 'lucide-react';

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem('ticketHistory') || '[]'));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
  const formatDate = (iso) => new Date(iso).toLocaleDateString('vi-VN');

  const filterByPeriod = (orders) => {
    if (period === 'all') return orders;
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return orders.filter(o => new Date(o.createdAt) >= cutoff);
  };

  const filteredOrders = filterByPeriod(orders);

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalTickets = filteredOrders.reduce((s, o) => s + (o.tickets?.length || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // By event
  const byEvent = filteredOrders.reduce((acc, o) => {
    const name = o.event?.name || 'Unknown';
    if (!acc[name]) acc[name] = { name, revenue: 0, orders: 0, tickets: 0, checkedIn: 0 };
    acc[name].revenue += o.totalAmount || 0;
    acc[name].orders += 1;
    acc[name].tickets += o.tickets?.length || 0;
    acc[name].checkedIn += (o.tickets || []).filter(t => t.status === 'used').length;
    return acc;
  }, {});

  const eventRows = Object.values(byEvent).sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = eventRows[0]?.revenue || 1;

  // By date (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const dayOrders = orders.filter(o => formatDate(o.createdAt) === d.toLocaleDateString('vi-VN'));
    return { label: key, revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), count: dayOrders.length };
  });
  const maxDay = Math.max(...last7.map(d => d.revenue), 1);

  const handleExport = () => {
    const rows = [
      ['Sự kiện', 'Doanh thu', 'Đơn hàng', 'Vé bán', 'Check-in'],
      ...eventRows.map(e => [e.name, e.revenue, e.orders, e.tickets, e.checkedIn])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analytics_${Date.now()}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Thống kê & Phân tích</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tổng quan hiệu suất</p>
        </div>
        <div className="flex gap-2">
          {[['all', 'Tất cả'], ['7d', '7 ngày'], ['30d', '30 ngày'], ['90d', '90 ngày']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === val ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' : 'bg-gray-900 border border-white/8 text-gray-400 hover:text-white'
              }`}>{label}</button>
          ))}
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 transition-colors">
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'from-orange-500 to-orange-700', sub: 'tất cả sự kiện' },
          { label: 'Đơn hàng', value: totalOrders, icon: ShoppingBag, color: 'from-purple-500 to-purple-700', sub: `trung bình ${formatPrice(avgOrderValue)}` },
          { label: 'Vé đã bán', value: totalTickets, icon: Ticket, color: 'from-blue-500 to-blue-700', sub: `${totalOrders} đơn hàng` },
          { label: 'Sự kiện có doanh thu', value: eventRows.length, icon: Calendar, color: 'from-emerald-500 to-emerald-700', sub: 'đang hoạt động' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-white/5 rounded-2xl p-5">
            <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily revenue chart (bar) */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" /> Doanh thu 7 ngày gần nhất
          </h3>
          <div className="flex items-end gap-2 h-40">
            {last7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end justify-center" style={{ height: '120px' }}>
                  <div className="w-full bg-gradient-to-t from-orange-500 to-purple-600 rounded-t-lg transition-all duration-700 hover:opacity-80"
                    style={{ height: `${maxDay > 0 ? (d.revenue / maxDay) * 100 : 0}%`, minHeight: d.revenue > 0 ? '4px' : '0' }} />
                  {d.revenue > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-gray-500">{d.count}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600">{d.label}</span>
              </div>
            ))}
          </div>
          {last7.every(d => d.revenue === 0) && (
            <p className="text-xs text-gray-600 text-center mt-4">Chưa có dữ liệu 7 ngày qua</p>
          )}
        </div>

        {/* Top events */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-emerald-400" /> Top sự kiện theo doanh thu
          </h3>
          {eventRows.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventRows.slice(0, 5).map((e, i) => (
                <div key={e.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-gray-500/20 text-gray-400' :
                        i === 2 ? 'bg-orange-800/30 text-orange-600' : 'bg-white/5 text-gray-500'
                      }`}>{i + 1}</span>
                      <p className="text-xs text-gray-300 truncate max-w-[140px]">{e.name}</p>
                    </div>
                    <p className="text-xs font-bold text-orange-400">{formatPrice(e.revenue)}</p>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full"
                      style={{ width: `${(e.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-600">{e.orders} đơn</span>
                    <span className="text-xs text-gray-600">{e.tickets} vé</span>
                    <span className="text-xs text-emerald-600">{e.checkedIn} check-in</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Chi tiết theo sự kiện</h3>
        </div>
        {eventRows.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chưa có dữ liệu. Hãy tạo đơn hàng để xem thống kê.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['#', 'Sự kiện', 'Doanh thu', 'Đơn hàng', 'Vé bán', 'Check-in', 'Tỷ lệ'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {eventRows.map((e, i) => {
                  const checkInRate = e.tickets > 0 ? Math.round((e.checkedIn / e.tickets) * 100) : 0;
                  return (
                    <tr key={e.name} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600">{i + 1}</td>
                      <td className="px-4 py-3 text-xs font-medium text-white max-w-[200px] truncate">{e.name}</td>
                      <td className="px-4 py-3 text-xs font-bold text-orange-400 whitespace-nowrap">{formatPrice(e.revenue)}</td>
                      <td className="px-4 py-3 text-xs text-gray-300">{e.orders}</td>
                      <td className="px-4 py-3 text-xs text-gray-300">{e.tickets}</td>
                      <td className="px-4 py-3 text-xs text-emerald-400">{e.checkedIn}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${checkInRate}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{checkInRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;