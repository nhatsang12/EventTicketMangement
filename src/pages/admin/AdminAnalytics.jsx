import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, ShoppingBag, Ticket, BarChart3, Download, Calendar, ArrowUp, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [ticketStats, setTicketStats] = useState({});
  const [checkinStats, setCheckinStats] = useState({});
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const token = useAuthStore((state) => state.accessToken || state.token);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Gọi đồng thời các API thống kê chuyên sâu từ Backend của bạn
        const [revenueRes, ticketsRes, checkinsRes, ordersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/admin/analytics/revenue', config),
          axios.get('http://localhost:8000/api/admin/analytics/tickets', config),
          axios.get('http://localhost:8000/api/admin/analytics/checkins', config),
          axios.get('http://localhost:8000/api/orders', config)
        ]);

        setRevenueStats(revenueRes.data?.data || []);
        setTicketStats(ticketsRes.data?.data || {});
        setCheckinStats(checkinsRes.data?.data || {});
        setOrders(ordersRes.data?.data || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Không thể tải dữ liệu phân tích!");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalyticsData();
    }
  }, [token]);

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
  const formatDate = (iso) => new Date(iso).toLocaleDateString('vi-VN');

  // Logic lọc dữ liệu theo thời gian (Frontend)
  const filterByPeriod = (data) => {
    if (period === 'all') return data;
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return data.filter(o => new Date(o.createdAt) >= cutoff);
  };

  const filteredOrders = filterByPeriod(orders);
  
  // Tính toán các chỉ số dựa trên dữ liệu từ API
  const totalRevenue = revenueStats.reduce((s, item) => s + (item.revenue || item.totalRevenue || 0), 0);
  const totalTicketsSold = ticketStats.totalSold || filteredOrders.reduce((s, o) => s + (o.tickets?.length || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Tổng hợp dữ liệu hiển thị bảng từ các nguồn API
  const eventRows = revenueStats.map(stat => ({
    name: stat.eventName || stat.event?.title || 'Sự kiện',
    revenue: stat.revenue || stat.totalRevenue || 0,
    orders: stat.orders || 0,
    tickets: stat.ticketsSold || stat.tickets || 0,
    checkedIn: stat.checkins || 0
  })).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = eventRows[0]?.revenue || 1;

  // Dữ liệu biểu đồ 7 ngày gần nhất
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const dayOrders = orders.filter(o => formatDate(o.createdAt) === d.toLocaleDateString('vi-VN'));
    return { 
      label, 
      revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), 
      count: dayOrders.length 
    };
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang phân tích dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Thống kê & Phân tích</h2>
          <p className="text-xs text-gray-500 mt-0.5">Dữ liệu thời gian thực từ hệ thống</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all', 'Tất cả'], ['7d', '7 ngày'], ['30d', '30 ngày'], ['90d', '90 ngày']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === val
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
              }`}>{label}</button>
          ))}
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'from-orange-500 to-orange-600', sub: 'tất cả sự kiện' },
          { label: 'Đơn hàng', value: totalOrders, icon: ShoppingBag, color: 'from-purple-500 to-purple-600', sub: `TB ${formatPrice(avgOrderValue)}` },
          { label: 'Vé đã bán', value: totalTicketsSold, icon: Ticket, color: 'from-blue-500 to-blue-600', sub: `${totalOrders} đơn hàng` },
          { label: 'Sự kiện có DT', value: eventRows.length, icon: Calendar, color: 'from-emerald-500 to-emerald-600', sub: 'đang hoạt động' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-2">{s.label}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily revenue chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-8 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" /> Doanh thu 7 ngày gần nhất
          </h3>
          <div className="flex items-end gap-2 h-40 px-2">
            {last7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex items-end justify-center h-32">
                  <div className="w-full max-w-[32px] bg-gradient-to-t from-orange-500 to-purple-500 rounded-t-md transition-all duration-500 group-hover:opacity-80"
                    style={{ height: `${maxDay > 0 ? (d.revenue / maxDay) * 100 : 0}%` }} />
                  {d.revenue > 0 && (
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {formatPrice(d.revenue)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top events with progress bars */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-emerald-500" /> Hiệu suất theo sự kiện
          </h3>
          <div className="space-y-5">
            {eventRows.slice(0, 4).map((e, i) => (
              <div key={e.name} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">{e.name}</span>
                  <span className="text-xs font-bold text-orange-600">{formatPrice(e.revenue)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(e.revenue / maxRevenue) * 100}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">{e.tickets} vé bán ra</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{e.checkedIn} đã tham gia</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full detail table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">Chi tiết dữ liệu sự kiện</h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{eventRows.length} sự kiện</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Thứ hạng', 'Tên sự kiện', 'Doanh thu', 'Đơn', 'Vé', 'Check-in', 'Tỷ lệ'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {eventRows.map((e, i) => {
                const checkInRate = e.tickets > 0 ? Math.round((e.checkedIn / e.tickets) * 100) : 0;
                return (
                  <tr key={e.name} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-400">#{i + 1}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-800">{e.name}</td>
                    <td className="px-6 py-4 text-xs font-black text-orange-600">{formatPrice(e.revenue)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">{e.orders}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">{e.tickets}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600">{e.checkedIn}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-16 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${checkInRate}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">{checkInRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;