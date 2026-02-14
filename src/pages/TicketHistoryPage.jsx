import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, QrCode, ChevronDown, ChevronUp, ShoppingBag, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';

const TicketHistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/ticket-history' } }); return; }
    const stored = JSON.parse(localStorage.getItem('ticketHistory') || '[]');
    setOrders(stored);
  }, [isAuthenticated, navigate]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusColor = (status) => ({
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    used: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  }[status] || 'bg-blue-100 text-blue-700 border-blue-200');

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
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order header */}
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{order.id}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(order.status)}`}>
                        {order.status === 'confirmed' ? '✓ Đã xác nhận' : order.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base truncate">{order.event?.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{order.event?.location}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3 h-3" />{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-lg bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">{formatPrice(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{order.tickets?.length || 0} vé</p>
                  </div>
                </div>

                <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
                  {expandedOrder === order.id ? <><ChevronUp className="w-4 h-4" /> Ẩn vé</> : <><ChevronDown className="w-4 h-4" /> Xem vé ({order.tickets?.length})</>}
                </button>
              </div>

              {/* Tickets */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {order.tickets?.map((ticket, idx) => (
                    <div key={ticket.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">E-Ticket #{idx + 1} — {ticket.ticketType?.name}</p>
                          <p className="text-xs font-mono text-gray-400 mt-0.5">{ticket.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(ticket.status)}`}>
                            {ticket.status === 'active' ? '✓ Active' : ticket.status}
                          </span>
                          <button onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                            className="p-1.5 bg-gradient-to-r from-orange-100 to-purple-100 rounded-lg hover:from-orange-200 hover:to-purple-200 transition-colors">
                            <QrCode className="w-4 h-4 text-orange-600" />
                          </button>
                        </div>
                      </div>

                      {/* QR Code expand */}
                      {expandedTicket === ticket.id && (
                        <div className="flex flex-col items-center py-4 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl border border-orange-100">
                          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Mã QR Check-in</p>
                          <img src={ticket.qrCode} alt="QR Code" className="w-40 h-40 rounded-xl border-2 border-white shadow-md" />
                          <p className="text-xs text-gray-500 mt-3 font-mono text-center px-4 break-all">{ticket.id}</p>
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