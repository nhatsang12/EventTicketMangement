import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, Heart, ChevronDown, ChevronRight, Star, Users, Award, Clock, TrendingUp, Sparkles, Search, Ticket, Zap } from "lucide-react";

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
  const [visibleSections, setVisibleSections] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(false);
  const INITIAL_CAT_COUNT = 3;

  // 1. TẢI DỮ LIỆU SỰ KIỆN TỪ BACKEND
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Gọi API lấy danh sách sự kiện (Dùng URL tuyệt đối trỏ tới Backend)
        const res = await axios.get("http://localhost:8000/api/events");
        let data = res.data?.data || res.data || [];

        // Trích xuất danh sách các Category (duy nhất) từ dữ liệu thật
        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories.map(name => ({ name })));

        // Lọc theo query param nếu có
        const categoryFilter = searchParams.get("category");
        if (categoryFilter) {
          data = data.filter((e) => e.category === categoryFilter);
        }

        setEvents(data);
      } catch (error) {
        console.error("Lỗi tải sự kiện trang chủ:", error);
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

  const groupedEvents = getEventsByCategory();
  // Sắp xếp sự kiện nổi bật (Tạm thời xếp theo ngày tạo hoặc ID nếu không có minPrice)
  const hotEvents = [...events].slice(0, 6);
  // Sắp xếp sự kiện sắp diễn ra (Theo startDate)
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

  // Format ngày tháng an toàn
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa cập nhật";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Helper cho đường dẫn ảnh thật từ Backend
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/800x600?text=No+Image";
    return imagePath.startsWith('http') ? imagePath : `http://localhost:8000${imagePath}`;
  };

  const anim = (sectionId) => {
    return `transition-all duration-1000 ${visibleSections[sectionId] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`;
  };

  return (
    <div className="min-h-screen font-body bg-white text-black overflow-x-hidden">

      {/* ─── HERO ─── */}
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

      {/* ─── SEARCH + TAGS ─── */}
      <div className="bg-white py-10 border-b border-gray-100">
        <div
          id="search-section" data-animate
          className={`container-custom transition-all duration-700 ${visibleSections['search-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) window.location.href = `/?search=${encodeURIComponent(q)}`; }}
            className="flex items-center gap-2 max-w-2xl mx-auto mb-6"
          >
            <div className="flex flex-1 items-center bg-gray-50 border-2 border-gray-200 focus-within:border-orange-400 focus-within:bg-white rounded-2xl px-4 py-3 gap-3 transition-all shadow-sm focus-within:shadow-md">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input name="q" type="text" placeholder="Tìm sự kiện, nghệ sĩ, địa điểm..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm md:text-base" />
            </div>
            <button type="submit"
              className="shrink-0 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm md:text-base">
              Tìm kiếm
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-gray-400 mr-1 shrink-0">Phổ biến:</span>
            {categories.slice(0, 8).map(({ name }) => (
              <Link key={name} to={`/?category=${encodeURIComponent(name)}`}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white text-gray-600 text-xs font-medium rounded-full transition-all duration-200 hover:shadow-md hover:scale-105">
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HOT EVENTS ─── */}
      <div className="bg-orange-50/60 py-16">
        <div id="hot-events" data-animate className={`container-custom transition-all duration-1000 ${visibleSections['hot-events'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-orange-400 uppercase mb-2">Được yêu thích</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 leading-tight">Sự kiện nổi bật</h2>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors group shrink-0">
              Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : hotEvents.length > 0 ? (
            <>
              {/* FEATURED CARD */}
              <Link to={`/event/${hotEvents[0]._id}`} className="group relative block w-full rounded-3xl overflow-hidden mb-8 shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="relative h-[280px] md:h-[400px] lg:h-[460px]">
                  <img src={getImageUrl(hotEvents[0].image)} alt={hotEvents[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x600?text=Event'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-5 left-5 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">✦ Nổi bật</div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {hotEvents[0].category && (
                        <span className="px-2.5 py-0.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 text-xs rounded-full">{hotEvents[0].category}</span>
                      )}
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-3 leading-snug line-clamp-2 group-hover:text-orange-200 transition-colors">{hotEvents[0].title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-white/50" />{formatDate(hotEvents[0].startDate)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-white/50" /><span className="line-clamp-1">{hotEvents[0].location}</span></span>
                    </div>
                  </div>
                </div>
              </Link>
            </>
          ) : (
             <div className="text-center py-10 text-gray-500">Chưa có sự kiện nào nổi bật</div>
          )}
        </div>

        {/* HORIZONTAL SCROLL */}
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
                    <h3 className="text-sm font-semibold mb-2 line-clamp-2 text-gray-900 group-hover:text-orange-600 transition-colors leading-snug">{event.title}</h3>
                    <div className="space-y-1 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 shrink-0 text-gray-300" /><span>{formatDate(event.startDate)}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0 text-gray-300" /><span className="line-clamp-1">{event.location}</span></div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link to="/events" className="flex-none w-[150px] rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center gap-3 text-orange-400 hover:border-orange-400 hover:bg-white/60 transition-all duration-300 group mr-4">
                <div className="w-10 h-10 rounded-full border-2 border-orange-200 group-hover:border-orange-400 flex items-center justify-center transition-colors"><ChevronRight className="w-5 h-5" /></div>
                <span className="text-xs font-semibold text-center px-3 leading-snug">Xem tất cả sự kiện</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── UPCOMING ─── */}
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
                <Link key={event._id} to={`/event/${event._id}`} className="group cursor-pointer bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-orange-400/40 transition-all duration-500 flex flex-col sm:flex-row hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
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

      {/* ─── CATEGORIES ─── */}
      <div className="bg-white py-16">
        <div className="container-custom">
          {searchParams.get("category") && (
            <h1 className="text-3xl font-heading font-bold mb-10 text-center text-gray-900">
              Sự kiện: {searchParams.get("category")}
            </h1>
          )}

          {!loading && groupedEvents.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Chưa có sự kiện nào...</div>
          ) : (
            <>
              {(showAllCategories ? groupedEvents : groupedEvents.slice(0, INITIAL_CAT_COUNT)).map((group, groupIndex) => (
                <section key={group.category} id={`category-${groupIndex}`} data-animate className={`mb-14 transition-all duration-1000 ${visibleSections[`category-${groupIndex}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-purple-600 rounded-full"></div>
                      <h2 className="text-xl md:text-2xl font-heading font-semibold text-gray-800">{group.category}</h2>
                    </div>
                    <Link to={`/?category=${encodeURIComponent(group.category)}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors group">
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
                          <h3 className="text-base font-semibold mb-2 line-clamp-2 text-gray-900 group-hover:text-orange-600 transition-colors">{event.title}</h3>
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