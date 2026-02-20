import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ticket, Calendar, MapPin, QrCode, ChevronDown, ChevronUp, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

const TicketHistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token); // Lấy token an toàn
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { 
      navigate('/login', { state: { from: '/ticket-history' } }); 
      return; 
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        const res = await axios.get('http://localhost:8000/api/orders/my-orders', config);
        
        // Backend trả về res.data.data hoặc res.data tùy cách bạn viết, ta bao lô cả 2
        let ordersData = res.data?.data || res.data || [];
        
        // Sắp xếp đơn hàng mới nhất lên đầu
        ordersData = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setOrders(ordersData);
      } catch (error) {
        console.error("Lỗi lấy lịch sử vé:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate, token]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusColor = (status) => ({
    paid: 'bg-green-100 text-green-700 border-green-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    used: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
    active: 'bg-green-100 text-green-700 border-green-200',
  }[status] || 'bg-blue-100 text-blue-700 border-blue-200');

  // Hàm tạo link ảnh QR code từ chuỗi text
  const getQRCodeImage = (qrString) => {
    if (!qrString) return '';
    if (qrString.startsWith('http')) return qrString;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải lịch sử vé...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có vé nào</h2>
          <p className="text-gray-600 mb-6">Bạn chưa đặt vé sự kiện nào. Hãy khám phá ngay!</p>
          <button onClick={() => navigate('/')} className="bg-gradient-to-r from-orange-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-purple-700 transition-all">
            Khám phá sự kiện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lịch sử vé</h1>
            <p className="text-sm text-gray-500 mt-1">{orders.length} đơn hàng</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Order header */}
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded" title={order._id}>
                        {order._id.substring(0, 10).toUpperCase()}...
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(order.status)}`}>
                        {order.status === 'paid' || order.status === 'confirmed' ? '✓ Đã thanh toán' : order.status}
                      </span>
                    </div>
                    {/* Hỗ trợ trường title hoặc name của event */}
                    <h3 className="font-bold text-gray-900 text-base truncate">{order.event?.title || order.event?.name || 'Sự kiện không xác định'}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{order.event?.location || 'Đang cập nhật'}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3 h-3" />{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-lg bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">{formatPrice(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{order.tickets?.length || 0} vé</p>
                  </div>
                </div>

                <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
                  {expandedOrder === order._id ? <><ChevronUp className="w-4 h-4" /> Ẩn vé</> : <><ChevronDown className="w-4 h-4" /> Xem vé ({order.tickets?.length})</>}
                </button>
              </div>

              {/* Tickets */}
              {expandedOrder === order._id && (
                <div className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50/50">
                  {order.tickets?.map((ticket, idx) => (
                    <div key={ticket._id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">E-Ticket #{idx + 1} — {ticket.ticketType?.name}</p>
                          <p className="text-xs font-mono text-gray-400 mt-0.5" title={ticket._id}>ID: {ticket._id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(ticket.status || 'active')}`}>
                            {!ticket.status || ticket.status === 'active' ? '✓ Có hiệu lực' : ticket.status}
                          </span>
                          <button onClick={() => setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id)}
                            className="p-1.5 bg-gradient-to-r from-orange-100 to-purple-100 rounded-lg hover:from-orange-200 hover:to-purple-200 transition-colors shadow-sm">
                            <QrCode className="w-4 h-4 text-orange-600" />
                          </button>
                        </div>
                      </div>

                      {/* QR Code expand */}
                      {expandedTicket === ticket._id && (
                        <div className="flex flex-col items-center py-5 bg-white rounded-xl border border-orange-100 shadow-sm mt-2">
                          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Mã QR Check-in</p>
                          <img src={getQRCodeImage(ticket.qrCode)} alt="QR Code" className="w-40 h-40 rounded-xl border-2 border-white shadow-md" />
                          <p className="text-xs text-gray-500 mt-3 font-mono text-center px-4 break-all bg-gray-100 py-1 rounded">Mã vé: {ticket.qrCode}</p>
                          <p className="text-xs text-orange-600 mt-2 font-medium">Xuất trình QR này khi vào cổng</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TicketHistoryPage;