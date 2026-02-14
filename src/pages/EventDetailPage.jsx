import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  Users,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { eventAPI } from '../services/eventService';
import { mockEvents, mockTicketTypes } from '../data/mockData'; // Import mock data
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
      
      // Try to fetch from API first
      try {
        const [eventRes, ticketsRes] = await Promise.all([
          eventAPI.getEventById(id),
          eventAPI.getEventTicketTypes(id),
        ]);
        setEventData(eventRes.data);
        setTicketTypes(ticketsRes.data || []);
        setEvent(eventRes.data);
      } catch (apiError) {
        // If API fails, use mock data
        console.log('Using mock data for event:', id);
        const mockEvent = mockEvents.find(e => e._id === id);
        const mockTickets = mockTicketTypes[id] || [];
        
        if (mockEvent) {
          setEventData(mockEvent);
          setTicketTypes(mockTickets);
          setEvent(mockEvent);
        } else {
          throw new Error('Event not found in mock data');
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
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
    navigate('/checkout');
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(t => t._id === ticketTypeId);
      return total + (ticketType?.price || 0) * quantity;
    }, 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: vi });
    } catch {
      return 'TBA';
    }
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
          <button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image with Gradient Overlay */}
      <div className="relative h-[400px] md:h-[500px] bg-gray-900 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500 via-purple-600 to-pink-600 animate-gradient-x" />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 animate-gradient-x" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-56 h-56 bg-purple-500/30 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        {/* Event Badge */}
        {event.category && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="inline-flex items-center ">
             
            </div>
          </div>
        )}
      </div>

      <div className="container-custom -mt-32 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 space-y-6 animate-fade-in-up">
              <div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold text-black mb-6 leading-tight">
                  {event.name}
                </h1>
              </div>

              {/* Info Grid với Gradient Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-purple-100 group-hover:from-orange-500 group-hover:to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300">
                    <Calendar className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Ngày diễn ra</p>
                    <p className="font-semibold text-gray-900 text-lg">{formatDate(event.date)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-500 group-hover:to-pink-600 rounded-xl flex items-center justify-center transition-all duration-300">
                    <Clock className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Thời gian</p>
                    <p className="font-semibold text-gray-900 text-lg">{event.time || '19:00'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 md:col-span-2 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-orange-100 group-hover:from-pink-500 group-hover:to-orange-600 rounded-xl flex items-center justify-center transition-all duration-300">
                    <MapPin className="w-6 h-6 text-pink-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Địa điểm</p>
                    <p className="font-semibold text-gray-900 text-lg">{event.location}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons với Gradient */}
              <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-orange-100 hover:to-purple-100 text-gray-700 hover:text-orange-600 rounded-full transition-all duration-300 font-medium border border-gray-200 hover:border-orange-300 hover:shadow-md">
                  <Heart className="w-5 h-5" />
                  Yêu thích
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-purple-100 hover:to-pink-100 text-gray-700 hover:text-purple-600 rounded-full transition-all duration-300 font-medium border border-gray-200 hover:border-purple-300 hover:shadow-md">
                  <Share2 className="w-5 h-5" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                Giới thiệu sự kiện
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed text-base">
                <p>{event.description || 'Chưa có mô tả cho sự kiện này.'}</p>
              </div>
            </div>
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 sticky top-24 space-y-6 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-heading font-bold text-black">
                  Chọn loại vé
                </h2>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>

              {ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {ticketTypes.map((ticketType, index) => (
                    <div
                      key={ticketType._id}
                      className="border-2 border-gray-200 hover:border-orange-300 rounded-2xl p-5 space-y-4 transition-all duration-300 hover:shadow-lg"
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {ticketType.name}
                          </h3>
                          {ticketType.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {ticketType.description}
                            </p>
                          )}
                          <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mt-2">
                            {formatPrice(ticketType.price)}
                          </p>
                        </div>
                        {ticketType.isEnabled ? (
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                            Còn vé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                            Hết vé
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          Còn lại: <span className="font-bold text-gray-900">{ticketType.quantity}</span> vé
                        </span>
                      </div>

                      {ticketType.isEnabled && ticketType.quantity > 0 && (
                        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                          <span className="text-sm font-semibold text-gray-700">
                            Số lượng:
                          </span>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleQuantityChange(ticketType._id, -1)}
                              disabled={!selectedTickets[ticketType._id]}
                              className="w-10 h-10 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 hover:from-orange-500 hover:to-purple-600 border-2 border-gray-200 hover:border-transparent flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <Minus className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </button>
                            <span className="w-14 text-center font-bold text-xl text-gray-900">
                              {selectedTickets[ticketType._id] || 0}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(ticketType._id, 1)}
                              disabled={(selectedTickets[ticketType._id] || 0) >= ticketType.quantity}
                              className="w-10 h-10 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 hover:from-orange-500 hover:to-purple-600 border-2 border-gray-200 hover:border-transparent flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <Plus className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Chưa có loại vé nào</p>
                </div>
              )}

              {/* Total & Checkout */}
              {ticketTypes.length > 0 && (
                <div className="space-y-4 pt-6 border-t-2 border-gray-100">
                  <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl p-4">
                    <span className="text-gray-700 font-semibold text-lg">Tổng cộng:</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-lg"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Đặt vé ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-30px) translateX(-15px);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default EventDetailPage;