import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Trash2, CreditCard, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);
  const { items, event, clearCart, removeItem, getTotalPrice } = useCartStore();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [orderResponse, setOrderResponse] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    paymentMethod: 'credit_card',
    cardNumber: '4242 4242 4242 4242',
    cardExpiry: '12/26',
    cardCVV: '123',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const generateQRCode = (dataString) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dataString)}`;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Giỏ hàng trống'); return; }

    try {
      setLoading(true);
      const payload = {
        eventId: event._id || event.id,
        tickets: items.map(item => ({
          ticketTypeId: item.ticketType._id,
          quantity: item.quantity
        })),
        customerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod
      };

      const config = {
        headers: { Authorization: `Bearer ${token}` } 
      };

      const res = await axios.post('http://localhost:8000/api/orders/buy', payload, config);  

      const orderData = res.data?.data || res.data;
      setOrderResponse(orderData);
      
      clearCart();
      setStep(3);
      toast.success('Đặt vé thành công!');
    } catch (err) {
      console.error("Lỗi đặt vé:", err);
      toast.error(err.response?.data?.message || 'Thanh toán thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MÀN HÌNH 3: ĐẶT VÉ THÀNH CÔNG (ĐÃ FIX LỖI ẨN VÉ)
  // ==========================================
  if (step === 3 && orderResponse) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt vé thành công!</h1>
            <p className="text-gray-600">Mã đơn hàng: <span className="font-bold text-orange-600">{orderResponse._id || orderResponse.id}</span></p>
          </div>

          <div className="space-y-4 mb-6">
            {/* Vòng lặp lấy trực tiếp mảng tickets từ Backend trả về */}
            {orderResponse.tickets?.map((ticket, idx) => (
              <div key={ticket._id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-orange-600 to-purple-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80 uppercase tracking-widest">E-Ticket #{idx + 1}</p>
                      <p className="font-bold text-lg mt-0.5">{orderResponse.event?.title || orderResponse.event?.name || event?.title || event?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">Loại vé</p>
                      <p className="font-semibold">{ticket.ticketType?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-20 text-gray-400 font-medium">Địa điểm</span>
                      <span className="text-gray-800">{orderResponse.event?.location || event?.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-20 text-gray-400 font-medium">Email</span>
                      <span className="text-gray-800 truncate">{orderResponse.customerInfo?.email || formData.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-20 text-gray-400 font-medium">Ticket ID</span>
                      <span className="text-gray-800 font-mono text-xs">{ticket._id || ticket.id}</span>
                    </div>
                    <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✓ Active
                    </div>
                  </div>

                  <div className="shrink-0 text-center">
                    {/* Render mã QR code thật từ Backend */}
                    <img src={generateQRCode(ticket.qrCode || ticket._id)} alt="QR" className="w-24 h-24 rounded-lg border border-gray-200" />
                    <p className="text-xs text-gray-400 mt-1">Quét để check-in</p>
                  </div>
                </div>

                <div className="mx-6 border-t-2 border-dashed border-gray-200" />
                <div className="px-6 py-3 bg-gray-50 flex justify-between text-xs text-gray-500">
                  <span>Giá: <span className="font-bold text-gray-800">{formatPrice(ticket.price || ticket.ticketType?.price)}</span></span>
                  <span>{new Date(orderResponse.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate('/ticket-history')} className="flex-1 py-3 border-2 border-gray-300 rounded-full text-gray-700 font-medium hover:border-orange-500 hover:bg-orange-50 transition-all text-sm">
              Xem lịch sử vé
            </button>
            <button onClick={() => navigate('/')} className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-full font-medium hover:from-orange-700 hover:to-purple-700 transition-all text-sm">
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center px-4">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">Hãy chọn sự kiện và đặt vé ngay!</p>
          <button onClick={() => navigate('/')} className="bg-gradient-to-r from-orange-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-purple-700 transition-all">
            Khám phá sự kiện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center justify-center mb-8 gap-2">
          {[['1', 'Thông tin'], ['2', 'Thanh toán'], ['3', 'Hoàn tất']].map(([num, label], i) => (
            <div key={num} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-gradient-to-r from-orange-600 to-purple-600 text-white' :
                'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? '✓' : num}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <div className={`w-12 h-1 rounded-full ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin đơn hàng</h2>
                {event && (
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl mb-4 border border-orange-100">
                    <p className="font-semibold text-gray-900">{event.title || event.name}</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.ticketType._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.ticketType.name}</p>
                        <p className="text-xs text-gray-500">{formatPrice(item.ticketType.price)} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-orange-600 text-sm">{formatPrice(item.ticketType.price * item.quantity)}</p>
                        <button type="button" onClick={() => removeItem(item.ticketType._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin người đặt</h3>
                <div className="space-y-4">
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Họ và tên"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email"
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Số điện thoại"
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-500" /> Thanh toán bảo mật
                </h3>
                <div className="space-y-3 mb-4">
                  {[
                    { value: 'credit_card', label: '💳 Thẻ tín dụng / Ghi nợ' },
                    { value: 'bank_transfer', label: '🏦 Chuyển khoản ngân hàng' },
                    { value: 'e_wallet', label: '📱 Ví điện tử (Momo, ZaloPay)' },
                  ].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === opt.value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="paymentMethod" value={opt.value} checked={formData.paymentMethod === opt.value} onChange={handleChange} className="text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                
                {formData.paymentMethod === 'credit_card' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Thông tin thẻ (Mock)</p>
                    <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="Số thẻ"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM/YY"
                        className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" />
                      <input type="text" name="cardCVV" value={formData.cardCVV} onChange={handleChange} placeholder="CVV"
                        className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-60">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Xác nhận thanh toán</>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Tổng đơn hàng</h3>
              <div className="space-y-2 py-4 border-y border-gray-100 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí dịch vụ</span>
                  <span className="font-medium text-green-600">Miễn phí</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">Bằng cách thanh toán, bạn đồng ý với điều khoản dịch vụ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;