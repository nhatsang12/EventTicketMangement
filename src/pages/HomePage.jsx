import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, Heart, ChevronDown, ChevronRight, Star, Users, Award, Clock, Search, Ticket, Shield, CheckCircle } from "lucide-react";
import toast from 'react-hot-toast';

const EventCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-48 md:h-56 bg-gray-200"></div>
    <div className="p-4 md:p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-6 bg-gray-200 rounded w-1/3 mt-4"></div>
    </div>
  </div>
);

const UpcomingEventSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden flex flex-col sm:flex-row animate-pulse">
    <div className="w-full sm:w-48 h-48 sm:h-auto bg-gray-200"></div>
    <div className="p-5 flex-1 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleSections, setVisibleSections] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(false);
  const INITIAL_CAT_COUNT = 3;

  // FETCH EVENTS FROM API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get("http://localhost:8000/api/events");
        let data = res.data?.data || res.data || [];

        const categoryFilter = searchParams.get("category");
        if (categoryFilter) data = data.filter((e) => e.category === categoryFilter);

        const searchQuery = searchParams.get("search");
        if (searchQuery) {
          data = data.filter((e) => 
            e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setEvents(data);
        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories.map(name => ({ name })));

      } catch (error) {
        console.error("Lỗi tải sự kiện:", error);
        setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
        toast.error("Không thể tải sự kiện");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchParams]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, showAllCategories]);

  const getEventsByCategory = () => {
    if (searchParams.get("category")) {
      return [{ category: searchParams.get("category"), events: events.slice(0, 8) }];
    }
    return categories
      .map((cat) => ({ category: cat.name, events: events.filter((e) => e.category === cat.name).slice(0, 8) }))
      .filter((group) => group.events.length > 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa cập nhật";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80";
    return imagePath.startsWith('http') ? imagePath : `http://localhost:8000${imagePath}`;
  };

  const anim = (sectionId) => {
    return `transition-all duration-1000 ${visibleSections[sectionId] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`;
  };

  const groupedEvents = getEventsByCategory();
  const hotEvents = [...events].slice(0, 6);
  const upcomingEvents = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 4);

  const featuredOrganizers = [
    { id: 1, name: "Vietnam Music Events", avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80", totalEvents: 45, followers: "12K", description: "Tổ chức các sự kiện âm nhạc hàng đầu tại Việt Nam" },
    { id: 2, name: "Tech Conference VN", avatar: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80", totalEvents: 28, followers: "8.5K", description: "Hội nghị công nghệ và đổi mới sáng tạo" },
    { id: 3, name: "Saigon Arts Hub", avatar: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&auto=format&fit=crop&q=80", totalEvents: 62, followers: "15K", description: "Nghệ thuật và văn hóa đương đại" },
    { id: 4, name: "Sports Arena VN", avatar: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&auto=format&fit=crop&q=80", totalEvents: 34, followers: "20K", description: "Sự kiện thể thao và giải trí" },
  ];

  const testimonials = [
    { id: 1, name: "Nguyễn Minh Anh", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", rating: 5, comment: "Trải nghiệm tuyệt vời! Đã tham gia nhiều sự kiện qua nền tảng này và không bao giờ thất vọng. Quy trình đặt vé rất dễ dàng.", event: "Monsoon Music Festival 2024" },
    { id: 2, name: "Trần Quốc Huy", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", rating: 5, comment: "Nền tảng rất chuyên nghiệp. Tôi đã tìm được nhiều sự kiện công nghệ thú vị và kết nối với cộng đồng startup.", event: "Tech Summit Vietnam" },
    { id: 3, name: "Lê Thu Hà", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80", rating: 5, comment: "Giao diện đẹp, dễ sử dụng. Thông tin sự kiện rõ ràng, chi tiết. Rất hài lòng với dịch vụ khách hàng.", event: "Saigon Food Festival" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-orange-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-all">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body bg-white text-black overflow-x-hidden">
      {/* HERO */}
      <div className="relative h-[300px] md:h-[380px] lg:h-[550px] w-full overflow-hidden shadow-lg mb-0 group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 animate-gradient-x"></div>
        <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&auto=format&fit=crop&q=80" alt="hero"
          className="absolute inset-0 w-full h-full object-cover brightness-75 transform group-hover:scale-105 transition-transform duration-[3000ms]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-float-delayed"></div>
        </div>
        <div className="relative h-full flex flex-col justify-center px-6 md:px-12 text-white">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-heading font-bold mb-3 md:mb-4 tracking-tight drop-shadow-lg text-white">
              Những sự kiện hay nhất<br />
              <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">ở Việt Nam</span>
            </h1>
            <p className="text-sm md:text-base lg:text-lg mb-4 md:mb-6 max-w-2xl drop-shadow-md leading-relaxed text-white/90">
              Dù bạn là người địa phương hay mới đến, chúng tôi có rất nhiều sự kiện phù hợp với bạn.
            </p>
            <button className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-black font-medium px-6 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 text-sm md:text-base group">
              <MapPin className="w-4 h-4 text-orange-600 group-hover:animate-bounce" />
              <span>Việt Nam</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* TRUST BADGES */}
      <div className="bg-white py-8 border-b border-gray-100">
        <div id="trust-section" data-animate className={`container-custom transition-all duration-700 ${visibleSections['trust-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: <Shield className="w-6 h-6 text-white" />, title: "Thanh toán an toàn", desc: "Bảo mật SSL 256-bit", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
              { icon: <Ticket className="w-6 h-6 text-white" />, title: "Vé điện tử", desc: "QR code tức thì", color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
              { icon: <Clock className="w-6 h-6 text-white" />, title: "Hỗ trợ 24/7", desc: "Luôn sẵn sàng phục vụ", color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
              { icon: <CheckCircle className="w-6 h-6 text-white" />, title: "Đã xác minh", desc: "1000+ sự kiện uy tín", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" }
            ].map((badge, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 ${badge.bg} rounded-2xl border border-gray-100/50 hover:shadow-md transition-all duration-300 group`}>
                <div className={`shrink-0 w-12 h-12 bg-gradient-to-br ${badge.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{badge.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOT EVENTS */}
      <div className="bg-orange-50/60 py-16">
        <div id="hot-events" data-animate className={`container-custom transition-all duration-1000 ${visibleSections['hot-events'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-orange-400 uppercase mb-2">Được yêu thích</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 leading-tight">Sự kiện nổi bật</h2>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors group shrink-0">
              Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : hotEvents.length > 0 ? (
            <>
              <Link to={`/event/${hotEvents[0]._id}`} className="group relative block w-full rounded-3xl overflow-hidden mb-8 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="relative h-[280px] md:h-[400px] lg:h-[460px]">
                  <img src={getImageUrl(hotEvents[0].image)} alt={hotEvents[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x600?text=Event'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-5 left-5 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">✦ Nổi bật</div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    {hotEvents[0].category && (
                      <span className="inline-block px-2.5 py-0.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 text-xs rounded-full mb-3">
                        {hotEvents[0].category}
                      </span>
                    )}
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-3 leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors">{hotEvents[0].title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-white/50" />{formatDate(hotEvents[0].startDate)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-white/50" /><span className="line-clamp-1">{hotEvents[0].location}</span></span>
                    </div>
                  </div>
                </div>
              </Link>
            </>
          ) : <div className="text-center py-10 text-gray-500">Chưa có sự kiện nào</div>}
        </div>

        {!loading && hotEvents.length > 1 && (
          <div className="relative w-full">
            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#fff7ed] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#fff7ed] to-transparent z-10 pointer-events-none" />
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-8 lg:px-16" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {hotEvents.slice(1).map((event) => (
                <Link key={event._id} to={`/event/${event._id}`} className="group flex-none w-[220px] md:w-[260px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100/60">
                  <div className="relative h-[145px] md:h-[165px] overflow-hidden">
                    <img src={getImageUrl(event.image)} alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Event'; }} />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-sm font-semibold mb-2 line-clamp-2 text-gray-900 group-hover:text-purple-600 transition-colors leading-snug">{event.title}</h3>
                    <div className="space-y-1 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 shrink-0 text-gray-300" /><span>{formatDate(event.startDate)}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0 text-gray-300" /><span className="line-clamp-1">{event.location}</span></div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link to="/events" className="flex-none w-[150px] rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center gap-3 text-orange-400 hover:border-orange-400 hover:bg-white/60 transition-all duration-300 group mr-4">
                <div className="w-10 h-10 rounded-full border-2 border-orange-200 group-hover:border-orange-400 flex items-center justify-center transition-colors"><ChevronRight className="w-5 h-5" /></div>
                <span className="text-xs font-semibold text-center px-3 leading-snug">Xem tất cả</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* UPCOMING */}
      <div className="relative bg-gray-900 py-16 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div id="upcoming-events" data-animate className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['upcoming-events'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-white" /></div>
              <h2 className="text-2xl md:text-3xl font-heading font-semibold text-white">Sự kiện sắp diễn ra</h2>
            </div>
            <Link to="/events" className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-400 transition-colors group">
              <span>Xem thêm</span><ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <UpcomingEventSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map((event, index) => (
                <Link key={event._id} to={`/event/${event._id}`} className="group cursor-pointer bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-orange-400/40 transition-all duration-500 flex flex-col sm:flex-row hover:-translate-y-1">
                  <div className="relative w-full sm:w-44 h-44 sm:h-auto overflow-hidden shrink-0">
                    <img src={getImageUrl(event.image)} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Event'; }} />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">{formatDate(event.startDate)}</div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full mb-3 border border-white/10">{event.category}</span>
                      <h3 className="text-base font-semibold mb-2 line-clamp-2 text-white group-hover:text-orange-400 transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="w-4 h-4 shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="bg-white py-16">
        <div className="container-custom">
          {searchParams.get("category") && (
            <h1 className="text-3xl font-heading font-bold mb-10 text-center text-gray-900">Sự kiện: {searchParams.get("category")}</h1>
          )}

          {!loading && groupedEvents.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Không tìm thấy sự kiện nào...</div>
          ) : (
            <>
              {(showAllCategories ? groupedEvents : groupedEvents.slice(0, INITIAL_CAT_COUNT)).map((group, groupIndex) => (
                <section key={group.category} id={`category-${groupIndex}`} data-animate className={`mb-14 transition-all duration-1000 ${visibleSections[`category-${groupIndex}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-purple-600 rounded-full"></div>
                      <h2 className="text-xl md:text-2xl font-heading font-semibold text-gray-800">{group.category}</h2>
                    </div>
                    <Link to={`/?category=${encodeURIComponent(group.category)}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors group">
                      <span>Xem thêm</span><ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.events.map((event) => (
                      <Link key={event._id} to={`/event/${event._id}`} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                        <div className="relative h-48 overflow-hidden">
                          <img src={getImageUrl(event.image)} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Event'; }} />
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-semibold mb-2 line-clamp-2 text-gray-900 group-hover:text-purple-600 transition-colors">{event.title}</h3>
                          <div className="space-y-1.5 text-sm text-gray-500">
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0" /><span>{formatDate(event.startDate)}</span></div>
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {!searchParams.get("category") && groupedEvents.length > INITIAL_CAT_COUNT && (
                <div className="flex justify-center mt-2 mb-4">
                  <button onClick={() => { if (showAllCategories) { setShowAllCategories(false); document.getElementById("category-0")?.scrollIntoView({ behavior: "smooth", block: "start" }); } else { setShowAllCategories(true); } }}
                    className="group inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-200 hover:border-orange-400 text-gray-600 hover:text-orange-500 font-medium rounded-full transition-all duration-300 shadow-sm hover:shadow-md text-sm">
                    {showAllCategories ? <><ChevronDown className="w-4 h-4 rotate-180 transition-transform duration-300" /> Thu gọn</> : <><ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" /> Xem thêm {groupedEvents.length - INITIAL_CAT_COUNT} danh mục khác</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ORGANIZERS */}
      <div className="relative bg-gray-900 py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
        </div>

        <div id="organizers" data-animate className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['organizers'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold mb-3 text-white">Nhà tổ chức nổi tiếng</h2>
            <p className="text-gray-400 text-sm md:text-base">Những đơn vị tổ chức uy tín và chuyên nghiệp</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredOrganizers.map((organizer, index) => (
              <div key={organizer.id} className="group cursor-pointer bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/15 hover:border-orange-400/30 transition-all duration-500 hover:-translate-y-2">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <img src={organizer.avatar} alt={organizer.name} className="relative w-full h-full rounded-full object-cover border-4 border-white/10 group-hover:border-orange-400/50 transition-all duration-500 group-hover:scale-110" onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=O'; }} />
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-purple-600 p-1.5 rounded-full shadow-lg"><Award className="w-4 h-4 text-white" /></div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-white group-hover:text-orange-400 transition-colors">{organizer.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{organizer.description}</p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{organizer.totalEvents}</span></div>
                  <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{organizer.followers}</span></div>
                </div>
                <button className="w-full bg-white/10 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 text-white font-medium py-2.5 rounded-full transition-all duration-300 text-sm border border-white/20 hover:border-transparent">Theo dõi</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="relative bg-white py-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>

        <div id="testimonials" data-animate className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['testimonials'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold mb-3 text-gray-900">Đánh giá từ người dùng</h2>
            <p className="text-gray-500 text-base flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              Hàng ngàn khách hàng hài lòng đã tin tưởng chúng tôi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((t, index) => (
              <div key={t.id} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-orange-100/50">
                <div className="text-5xl font-serif text-orange-200 leading-none mb-2 select-none">"</div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-gray-700 mb-6 text-sm leading-relaxed">{t.comment}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border-2 border-orange-200 shadow-sm" onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=U'; }} />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.event}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOCATIONS */}
      <div className="bg-white py-14">
        <div id="locations" data-animate className={`container-custom ${anim("locations")}`}>
          <div className="text-center mb-8">
            <p className="text-xs font-medium text-orange-500 mb-1 uppercase tracking-widest">Khám phá</p>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-2">Địa điểm phổ biến</h2>
            <p className="text-gray-400 text-sm">Tìm sự kiện theo thành phố bạn yêu thích</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { name: "TP. Hồ Chí Minh", img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&auto=format&fit=crop&q=80", count: 120 },
              { name: "Hà Nội", img: "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&auto=format&fit=crop&q=80", count: 85 },
              { name: "Đà Nẵng", img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=80", count: 47 },
              { name: "Nha Trang", img: "https://images.unsplash.com/photo-1573968694073-5af7d6dfe5e0?w=600&auto=format&fit=crop&q=80", count: 32 },
              { name: "Phú Quốc", img: "https://images.unsplash.com/photo-1540541338537-1220059af4dc?w=600&auto=format&fit=crop&q=80", count: 28 },
              { name: "Cần Thơ", img: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&auto=format&fit=crop&q=80", count: 19 },
            ].map((loc, i) => (
              <Link key={loc.name} to={`/?location=${encodeURIComponent(loc.name)}`} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                <div className={`relative w-full overflow-hidden ${i === 0 ? "h-[220px] md:h-full md:min-h-[280px]" : "h-[140px] md:h-[130px]"}`}>
                  <img src={loc.img} alt={loc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className={`font-bold text-white leading-tight ${i === 0 ? "text-lg md:text-2xl" : "text-sm md:text-base"}`}>{loc.name}</h3>
                        <p className="text-white/70 text-xs mt-0.5">{loc.count} sự kiện</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm border border-white/20 p-1.5 rounded-full group-hover:bg-orange-500 group-hover:border-orange-500 transition-all">
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease-out forwards; }
        .overflow-x-auto::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HomePage;