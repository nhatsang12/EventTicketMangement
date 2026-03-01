import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, Ticket, ArrowRight, XCircle, Download } from 'lucide-react';
import useAuthStore from '../store/authStore';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.accessToken || state.token);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('unknown');

  const generateQRCode = (dataString) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dataString)}`;

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        setLoading(true);

        // ✅ CASE 1: PayOS callback
        const payosCode = searchParams.get('code');
        const payosStatus = searchParams.get('status');
        
        if (payosCode === '00' && payosStatus === 'PAID') {
          console.log("✓ Phát hiện PayOS callback thành công");
          setPaymentMethod('payos');
          
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const ordersRes = await axios.get('http://localhost:8000/api/orders/my-orders', config);
          
          const orders = ordersRes.data?.data || ordersRes.data || [];
          const latestOrder = orders[0];
          
          if (latestOrder) {
            setOrder(latestOrder);
            console.log("✓ Đã load order từ PayOS:", latestOrder._id);
          }
          
          setLoading(false);
          return;
        }

        // ✅ CASE 2: Stripe callback
        const stripeSessionId = searchParams.get('session_id');
        
        if (stripeSessionId) {
          console.log("✓ Phát hiện Stripe callback, session_id:", stripeSessionId);
          setPaymentMethod('stripe');
          
          const config = { headers: { Authorization: `Bearer ${token}` } };
          
          console.log("🔄 Đang gọi API verify Stripe session...");
          
          try {
            // Verify session và update order
            const verifyRes = await axios.post(
              'http://localhost:8000/api/payments/verify-stripe-session',
              { session_id: stripeSessionId },
              config
            );
            
            console.log("✓ Response từ verify API:", verifyRes.data);
            
            if (verifyRes.data?.success) {
              setOrder(verifyRes.data.data);
              console.log("✓ Order đã được verify và update:", verifyRes.data.data._id);
            } else {
              throw new Error(verifyRes.data?.message || 'Xác minh thanh toán thất bại');
            }
          } catch (apiError) {
            console.error("❌ Lỗi khi gọi verify API:", apiError);
            
            // Fallback: Nếu API verify lỗi, vẫn lấy order mới nhất
            console.log("⚠️ Fallback: Lấy order mới nhất thay thế...");
            const ordersRes = await axios.get('http://localhost:8000/api/orders/my-orders', config);
            const orders = ordersRes.data?.data || ordersRes.data || [];
            const latestOrder = orders[0];
            
            if (latestOrder) {
              setOrder(latestOrder);
              console.log("✓ Đã load order (fallback):", latestOrder._id);
            } else {
              throw new Error('Không tìm thấy đơn hàng');
            }
          }
          
          setLoading(false);
          return;
        }

        throw new Error('Không tìm thấy thông tin thanh toán');

      } catch (err) {
        console.error("❌ Lỗi xử lý callback:", err);
        setError(err.message || "Đã có lỗi xảy ra");
        setLoading(false);
      }
    };

    handlePaymentCallback();
  }, [searchParams, token]);

  const downloadQRCode = (qrUrl, ticketId) => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `ticket-${ticketId}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Đang xác nhận thanh toán...</p>
        <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
        <p className="text-gray-600 mb-6 text-center">{error || 'Không tìm thấy thông tin đơn hàng.'}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/ticket-history')} 
            className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-700 transition-all"
          >
            Xem lịch sử vé
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full font-bold hover:border-orange-500 transition-all"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header Success */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt vé thành công!</h1>
          <p className="text-gray-600">
            Mã đơn hàng: <span className="font-bold text-orange-600">#{order._id?.slice(-8).toUpperCase()}</span>
          </p>
          {paymentMethod === 'payos' && (
            <p className="text-sm text-green-600 mt-2">✓ Thanh toán qua PayOS thành công</p>
          )}
          {paymentMethod === 'stripe' && (
            <p className="text-sm text-blue-600 mt-2">✓ Thanh toán qua Stripe thành công</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin đơn hàng</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sự kiện</span>
              <span className="font-semibold text-gray-900">{order.event?.title || order.event?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Địa điểm</span>
              <span className="font-medium text-gray-700">{order.event?.location}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số lượng vé</span>
              <span className="font-semibold text-gray-900">{order.tickets?.length || 0} vé</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600 font-semibold">Tổng tiền</span>
              <span className="font-bold text-orange-600 text-lg">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Trạng thái</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status === 'paid' ? 'ĐÃ THANH TOÁN' : 'ĐANG XỬ LÝ'}
              </span>
            </div>
          </div>
          
          {/* Cảnh báo nếu status vẫn pending */}
          {order.status === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 font-medium mb-2">⏳ Đơn hàng đang chờ xác nhận</p>
              <p className="text-xs text-yellow-700">
                Thanh toán đã thành công nhưng hệ thống đang cập nhật. Vui lòng kiểm tra lại sau vài phút hoặc liên hệ hỗ trợ nếu vẫn chưa cập nhật.
              </p>
            </div>
          )}
        </div>

        {/* Tickets with QR Codes */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900">Vé của bạn ({order.tickets?.length || 0})</h2>
          
          {order.tickets?.map((ticket, idx) => (
            <div key={ticket._id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-orange-600 to-purple-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80 uppercase tracking-widest">E-Ticket #{idx + 1}</p>
                    <p className="font-bold text-lg mt-0.5">{order.event?.title || order.event?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Loại vé</p>
                    <p className="font-semibold">{ticket.ticketType?.name || 'Standard'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-24 text-gray-400 font-medium">Địa điểm</span>
                    <span className="text-gray-800">{order.event?.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-24 text-gray-400 font-medium">Email</span>
                    <span className="text-gray-800 truncate">{order.customerInfo?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-24 text-gray-400 font-medium">Ticket ID</span>
                    <span className="text-gray-800 font-mono text-xs">{ticket._id?.slice(-12)}</span>
                  </div>
                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    ✓ {ticket.status === 'active' ? 'Active' : ticket.status}
                  </div>
                </div>

                {/* QR Code */}
                <div className="shrink-0 text-center">
                  <img 
                    src={generateQRCode(ticket.qrCode || ticket._id)} 
                    alt="QR Code" 
                    className="w-32 h-32 rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                  <button
                    onClick={() => downloadQRCode(generateQRCode(ticket.qrCode || ticket._id), ticket._id)}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 mx-auto"
                  >
                    <Download className="w-3 h-3" /> Tải QR
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Quét để check-in</p>
                </div>
              </div>

              <div className="mx-6 border-t-2 border-dashed border-gray-200" />
              <div className="px-6 py-3 bg-gray-50 flex justify-between text-xs text-gray-500">
                <span>Giá: <span className="font-bold text-gray-800">{formatPrice(ticket.price || ticket.ticketType?.price)}</span></span>
                <span>{new Date(ticket.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/ticket-history')}
            className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Ticket className="w-5 h-5" /> Xem tất cả vé <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;