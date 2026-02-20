import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, MapPin, Clock, Share2, Heart,
  Minus, Plus, ShoppingCart, AlertCircle, Sparkles, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, setEvent } = useCartStore();

  const [event, setEventData] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Lấy danh sách sự kiện Public và tìm sự kiện hiện tại
      const eventRes = await axios.get("http://localhost:8000/api/events");
      const allEvents = eventRes.data?.data || eventRes.data || [];
      const currentEvent = allEvents.find(e => e._id === id);

      if (!currentEvent) {
        setEventData(null);
        setLoading(false);
        return;
      }

      // 2. Lấy danh sách vé Public và lọc ra những vé thuộc về sự kiện này
      const ticketRes = await axios.get("http://localhost:8000/api/tickets");
      const allTickets = ticketRes.data?.data || ticketRes.data || [];
      const eventTickets = allTickets.filter(t => (t.event?._id || t.event) === id);

      setEventData(currentEvent);
      setTicketTypes(eventTickets);
      setEvent(currentEvent); // Lưu vào store giỏ hàng

    } catch (error) {
      console.error('Lỗi tải chi tiết sự kiện:', error);
      toast.error('Không thể tải thông tin sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (ticketTypeId, change) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketTypeId] || 0;
      const newQuantity = Math.max(0, current + change);
      return { ...prev, [ticketTypeId]: newQuantity };
    });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt vé');
      navigate('/login');
      return;
    }

    const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);
    if (!hasSelectedTickets) {
      toast.error('Vui lòng chọn ít nhất một loại vé');
      return;
    }

    Object.entries(selectedTickets).forEach(([ticketTypeId, quantity]) => {
      if (quantity > 0) {
        const ticketType = ticketTypes.find(t => t._id === ticketTypeId);
        addItem(ticketType, quantity);
      }
    });

    toast.success('Đã thêm vào giỏ hàng');
    navigate('/checkout'); // Chuyển sang trang thanh toán
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(t => t._id === ticketTypeId);
      return total + (ticketType?.price || 0) * quantity;
    }, 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return format(new Date(dateString), 'EEEE, dd MMMM yyyy', { locale: vi });
    } catch {
      return 'TBA';
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/1200x600?text=No+Image";
    return imagePath.startsWith('http') ? imagePath : `http://localhost:8000${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-orange-600 border-r-purple-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Đang tải sự kiện...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Không tìm thấy sự kiện</h2>
          <p className="text-gray-600 mb-6">Sự kiện bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button onClick={() => navigate('/')} className="bg-gradient-to-r from-orange-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px] bg-gray-900 overflow-hidden">
        <img src={getImageUrl(event.image)} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 animate-gradient-x" />
      </div>

      <div className="container-custom -mt-32 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 space-y-6 animate-fade-in-up">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-black mb-6 leading-tight">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-orange-600" /></div>
                  <div><p className="text-sm text-gray-500 font-medium mb-1">Ngày diễn ra</p><p className="font-semibold text-gray-900 text-lg">{formatDate(event.startDate)}</p></div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-purple-600" /></div>
                  <div><p className="text-sm text-gray-500 font-medium mb-1">Thời gian</p><p className="font-semibold text-gray-900 text-lg">{event.time || '19:00'}</p></div>
                </div>
                <div className="flex items-start space-x-4 md:col-span-2 group">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center"><MapPin className="w-6 h-6 text-pink-600" /></div>
                  <div><p className="text-sm text-gray-500 font-medium mb-1">Địa điểm</p><p className="font-semibold text-gray-900 text-lg">{event.location}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-6"><Sparkles className="w-6 h-6 text-orange-500" /> Giới thiệu sự kiện</h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                {event.description || 'Chưa có mô tả chi tiết.'}
              </div>
            </div>
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 sticky top-24 space-y-6 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-heading font-bold text-black">Chọn loại vé</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-white" /></div>
              </div>

              {ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => {
                    // Cập nhật lại logic remaining (còn lại)
                    const remaining = ticketType.remaining !== undefined ? ticketType.remaining : (ticketType.quantity - (ticketType.sold || 0));
                    const isAvailable = ticketType.isActive !== false && remaining > 0;

                    return (
                      <div key={ticketType._id} className="border-2 border-gray-200 hover:border-orange-300 rounded-2xl p-5 space-y-4 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{ticketType.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{ticketType.description}</p>
                            <p className="text-2xl font-bold text-orange-600 mt-2">{formatPrice(ticketType.price)}</p>
                          </div>
                          {isAvailable ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Còn vé</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Hết vé/Đã tắt</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" /> Còn lại: <span className="font-bold">{remaining}</span> vé
                        </div>

                        {isAvailable && (
                          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                            <span className="text-sm font-semibold text-gray-700">Số lượng:</span>
                            <div className="flex items-center space-x-3">
                              <button onClick={() => handleQuantityChange(ticketType._id, -1)} disabled={!selectedTickets[ticketType._id]} className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                              <span className="w-8 text-center font-bold text-lg">{selectedTickets[ticketType._id] || 0}</span>
                              <button onClick={() => handleQuantityChange(ticketType._id, 1)} disabled={(selectedTickets[ticketType._id] || 0) >= remaining} className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Sự kiện này chưa mở bán vé.</p>
                </div>
              )}

              {/* Total & Checkout */}
              {ticketTypes.length > 0 && (
                <div className="space-y-4 pt-6 border-t-2 border-gray-100">
                  <div className="flex items-center justify-between bg-orange-50 rounded-2xl p-4">
                    <span className="text-gray-700 font-semibold">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-orange-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <button onClick={handleAddToCart} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg">
                    Đặt vé ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;