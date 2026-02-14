import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { mockEvents, mockCategories } from "../data/mockData";
import { Calendar, MapPin, Heart, ChevronDown, ChevronRight, Star, Users, Award, Clock, TrendingUp, Sparkles, Search, ChevronUp } from "lucide-react";

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

const INITIAL_CATEGORY_COUNT = 5;

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let data = [...mockEvents];
      const category = searchParams.get("category");
      if (category) data = data.filter((e) => e.category === category);
      setEvents(data);
      setLoading(false);
    }, 1000);
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
    return mockCategories
      .map((cat) => ({ category: cat.name, events: events.filter((e) => e.category === cat.name).slice(0, 8) }))
      .filter((group) => group.events.length > 0);
  };

  const groupedEvents = getEventsByCategory();
  const hotEvents = [...events].sort((a, b) => b.minPrice - a.minPrice).slice(0, 6);
  const upcomingEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);

  const popularLocations = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Nha Trang", "Phú Quốc"];

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Categories to show: 5 initially, all when expanded
  const visibleCategories = showAllCategories
    ? groupedEvents
    : groupedEvents.slice(0, INITIAL_CATEGORY_COUNT);
  const hiddenCount = groupedEvents.length - INITIAL_CATEGORY_COUNT;

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
              <input
                name="q"
                type="text"
                placeholder="Tìm sự kiện, nghệ sĩ, địa điểm..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-gray-400 mr-1 shrink-0">Phổ biến:</span>
            {[
              { label: "🎵 Âm nhạc", cat: "Âm nhạc" },
              { label: "💻 Công nghệ", cat: "Công nghệ" },
              { label: "🎨 Nghệ thuật", cat: "Nghệ thuật" },
              { label: "⚽ Thể thao", cat: "Thể thao" },
              { label: "🍜 Ẩm thực", cat: "Ẩm thực" },
              { label: "📚 Giáo dục", cat: "Giáo dục" },
              { label: "🎭 Sân khấu", cat: "Sân khấu" },
            ].map(({ label, cat }) => (
              <Link
                key={cat}
                to={`/?category=${encodeURIComponent(cat)}`}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white text-gray-600 text-xs font-medium rounded-full transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HOT EVENTS ─── */}
      <div className="bg-orange-50/60 py-16">
        <div
          id="hot-events" data-animate
          className={`container-custom transition-all duration-1000 ${visibleSections['hot-events'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-orange-500 animate-pulse" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-center text-gray-900">Sự kiện nổi bật</h2>
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-orange-500 animate-pulse" />
          </div>
          <p className="text-center text-gray-500 text-sm mb-10">Những sự kiện được yêu thích nhất hiện nay</p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {hotEvents.map((event, index) => (
                <Link key={event._id} to={`/event/${event._id}`}
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    {event.minPrice > 1000000 && (
                      <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> HOT
                      </div>
                    )}
                    <img src={event.imageUrl} alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Event'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <button className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 p-2.5 rounded-full shadow-lg hover:scale-110">
                      <Heart className="w-5 h-5 text-orange-500" />
                    </button>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="text-base font-semibold mb-2 line-clamp-2 text-gray-900 group-hover:text-orange-600 transition-colors">{event.name}</h3>
                    <div className="space-y-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0" /><span>{formatDate(event.date)}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                      <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">{event.minPrice.toLocaleString("vi-VN")}₫</p>
                      <span className="text-xs text-gray-400">từ</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── UPCOMING ─── */}
      <div className="relative bg-gray-900 py-16 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div
          id="upcoming-events" data-animate
          className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['upcoming-events'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-heading font-semibold text-white">Sự kiện sắp diễn ra</h2>
            </div>
            <Link to="/events" className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-400 transition-colors group">
              <span>Xem thêm</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <UpcomingEventSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map((event, index) => (
                <Link key={event._id} to={`/event/${event._id}`}
                  className="group cursor-pointer bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-orange-400/40 transition-all duration-500 flex flex-col sm:flex-row hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative w-full sm:w-44 h-44 sm:h-auto overflow-hidden shrink-0">
                    <img src={event.imageUrl} alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Event'; }} />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {formatDate(event.date)}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full mb-3 border border-white/10">{event.category}</span>
                      <h3 className="text-base font-semibold mb-2 line-clamp-2 text-white group-hover:text-orange-400 transition-colors">{event.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1"><Clock className="w-4 h-4 shrink-0" /><span>{event.time}</span></div>
                      <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="w-4 h-4 shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-bold text-white">{event.minPrice.toLocaleString("vi-VN")}₫</p>
                      <span className="text-sm text-orange-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Xem chi tiết <ChevronRight className="w-4 h-4" /></span>
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

          {groupedEvents.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Không tìm thấy sự kiện nào...</div>
          ) : (
            <>
              {visibleCategories.map((group, groupIndex) => (
                <section key={group.category} id={`category-${groupIndex}`} data-animate
                  className={`mb-14 transition-all duration-1000 ${visibleSections[`category-${groupIndex}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-purple-600 rounded-full"></div>
                      <h2 className="text-xl md:text-2xl font-heading font-semibold text-gray-800">{group.category}</h2>
                    </div>
                    <Link to={`/?category=${encodeURIComponent(group.category)}`}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors group">
                      <span>Xem thêm</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.events.map((event) => (
                      <Link key={event._id} to={`/event/${event._id}`}
                        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                        <div className="relative h-48 overflow-hidden">
                          <img src={event.imageUrl} alt={event.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Event'; }} />
                          <button className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 p-2.5 rounded-full shadow-lg">
                            <Heart className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-semibold mb-2 line-clamp-2 text-gray-900 group-hover:text-orange-600 transition-colors">{event.name}</h3>
                          <div className="space-y-1.5 text-sm text-gray-500">
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0" /><span>{formatDate(event.date)}</span></div>
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
                          </div>
                          <div className="mt-4 flex items-baseline justify-between">
                            <p className="text-lg font-bold text-gray-900">{event.minPrice.toLocaleString("vi-VN")}₫</p>
                            <span className="text-xs text-gray-400">từ</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {/* ─── SHOW MORE / COLLAPSE BUTTON ─── */}
              {!searchParams.get("category") && hiddenCount > 0 && (
                <div className="flex justify-center mt-4 mb-6">
                  <button
                    onClick={() => {
                      if (showAllCategories) {
                        setShowAllCategories(false);
                        // scroll back up to categories section smoothly
                        document.getElementById("category-0")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      } else {
                        setShowAllCategories(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-orange-400 text-orange-500 font-semibold rounded-full hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105 text-sm md:text-base"
                  >
                    {showAllCategories ? (
                      <>
                        <ChevronUp className="w-5 h-5" />
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5" />
                        Xem thêm {hiddenCount} danh mục
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── ORGANIZERS ─── */}
      <div className="relative bg-gray-900 py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
        </div>

        <div
          id="organizers" data-animate
          className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['organizers'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold mb-3 text-white">Nhà tổ chức nổi tiếng</h2>
            <p className="text-gray-400 text-sm md:text-base">Những đơn vị tổ chức uy tín và chuyên nghiệp</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredOrganizers.map((organizer, index) => (
              <div key={organizer.id}
                className="group cursor-pointer bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/15 hover:border-orange-400/30 transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}>
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <img src={organizer.avatar} alt={organizer.name}
                    className="relative w-full h-full rounded-full object-cover border-4 border-white/10 group-hover:border-orange-400/50 transition-all duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=O'; }} />
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-purple-600 p-1.5 rounded-full shadow-lg">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-white group-hover:text-orange-400 transition-colors">{organizer.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{organizer.description}</p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{organizer.totalEvents}</span></div>
                  <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{organizer.followers}</span></div>
                </div>
                <button className="w-full bg-white/10 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 text-white font-medium py-2.5 rounded-full transition-all duration-300 text-sm border border-white/20 hover:border-transparent">
                  Theo dõi
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <div className="relative bg-white py-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>

        <div
          id="testimonials" data-animate
          className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['testimonials'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold mb-3 text-gray-900">Đánh giá từ người dùng</h2>
            <p className="text-gray-500 text-base flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              Hàng ngàn khách hàng hài lòng đã tin tưởng chúng tôi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((t, index) => (
              <div key={t.id}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-orange-100/50"
                style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-5xl font-serif text-orange-200 leading-none mb-2 select-none">"</div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-gray-700 mb-6 text-sm leading-relaxed">{t.comment}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border-2 border-orange-200 shadow-sm"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=U'; }} />
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

      {/* ─── LOCATIONS ─── */}
      <div className="relative bg-gray-900 py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
        <div
          id="locations" data-animate
          className={`container-custom relative z-10 transition-all duration-1000 ${visibleSections['locations'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-3 text-center text-white">Địa điểm phổ biến</h2>
          <p className="text-gray-400 text-sm text-center mb-8">Khám phá sự kiện theo thành phố bạn yêu thích</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {popularLocations.map((loc, index) => (
              <Link key={loc} to={`/?location=${encodeURIComponent(loc)}`}
                className="bg-white/10 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 border border-white/20 hover:border-transparent px-6 py-3 rounded-full text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-105 backdrop-blur-sm"
                style={{ animationDelay: `${index * 50}ms` }}>
                📍 {loc}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div
        id="cta" data-animate
        className={`relative bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 py-20 overflow-hidden transition-all duration-1000 ${visibleSections['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-bounce">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-white drop-shadow-lg">
            Sẵn sàng tạo sự kiện của riêng bạn?
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Đăng ký ngay để trở thành người tổ chức và kết nối với hàng ngàn người tham gia!
          </p>
          <Link to="/create-event"
            className="inline-block bg-white hover:bg-gray-100 text-purple-700 font-bold px-10 py-4 rounded-full text-base md:text-lg shadow-2xl transition-all hover:scale-105 transform">
            Bắt đầu ngay →
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(-15px); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 15s ease infinite; }
      `}</style>
    </div>
  );
};

export default HomePage;