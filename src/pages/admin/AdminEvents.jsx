import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Calendar, MapPin, Search, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const ITEMS_PER_PAGE = 6;

const emptyForm = { 
  title: '', 
  description: '', 
  date: '', 
  time: '19:00', 
  location: '', 
  category: '', 
  imageFile: null,
  imagePreview: ''
};

const categories = ['Âm nhạc', 'Công nghệ', 'Thể thao', 'Nghệ thuật', 'Ẩm thực', 'Giáo dục', 'Khác'];

const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'draft', label: 'Nháp' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'ended', label: 'Đã kết thúc' },
];

const dateFilterOptions = [
  { value: 'all', label: 'Tất cả ngày' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'thisWeek', label: 'Tuần này' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const fileRef = useRef();
  const { accessToken } = useAuthStore();

  const api = axios.create({
    baseURL: 'http://localhost:8000/api/admin/events',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/');
      setEvents(res.data.data || []);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu sự kiện');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 5MB).');
      return;
    }
    setForm(f => ({ 
      ...f, 
      imageFile: file, 
      imagePreview: URL.createObjectURL(file) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.date || !form.location?.trim()) {
      toast.error('Vui lòng điền đầy đủ: tên, ngày, địa điểm');
      return;
    }
    if (form.date < todayStr()) {
      toast.error('Ngày tổ chức không thể là ngày trong quá khứ');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('category', form.category);
      
      const eventDateTime = new Date(`${form.date}T${form.time}`).toISOString();
      formData.append('startDate', eventDateTime);
      formData.append('endDate', eventDateTime);

      if (form.imageFile) {
        formData.append('image', form.imageFile);
      }

      if (editing !== null) {
        const eventId = events[editing]._id;
        await api.put(`/${eventId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Cập nhật sự kiện thành công!');
      } else {
        await api.post('', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Tạo sự kiện thành công!');
      }

      fetchEvents();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (i) => {
    setEditing(i);
    const ev = events[i];
    let dateStr = '';
    let timeStr = '19:00';

    if (ev.startDate) {
      const d = new Date(ev.startDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().split('T')[0];
        timeStr = d.toTimeString().substring(0, 5);
      }
    }

    setForm({ 
      title: ev.title || '',
      description: ev.description || '',
      location: ev.location || '',
      category: ev.category || '',
      date: dateStr,
      time: timeStr,
      imageFile: null,
      // ✅ FIX: Tránh double prefix URL
      imagePreview: ev.image
        ? ev.image.startsWith("http")
          ? ev.image
          : `http://localhost:8000${ev.image}`
        : ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (i) => {
    try {
      const eventId = events[i]._id;
      await api.delete(`/${eventId}`);
      toast.success('Đã xóa sự kiện');
      fetchEvents();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Lỗi khi xóa sự kiện');
    }
  };

  const closeForm = () => { 
    setShowForm(false); 
    setEditing(null); 
    setForm(emptyForm); 
  };

  // Filter + Pagination
  const filtered = events.filter(e => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchLocation = locationFilter === '' || e.location?.toLowerCase().includes(locationFilter.toLowerCase());

    let matchDate = true;
    if (dateFilter !== 'all') {
      if (!e.startDate) {
        matchDate = false;
      } else {
        const eventDate = new Date(e.startDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
          const todayEnd = new Date(now);
          todayEnd.setDate(todayEnd.getDate() + 1);
          matchDate = eventDate >= now && eventDate < todayEnd;
        } else if (dateFilter === 'thisWeek') {
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          matchDate = eventDate >= now && eventDate <= weekEnd;
        } else if (dateFilter === 'thisMonth') {
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          matchDate = eventDate >= now && eventDate <= monthEnd;
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          matchDate = eventDate >= start && eventDate <= end;
        }
      }
    }

    return matchSearch && matchCategory && matchStatus && matchLocation && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản lý sự kiện</h2>
          <p className="text-xs text-gray-500 mt-0.5">{events.length} sự kiện</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-md">
          <Plus className="w-4 h-4" /> Tạo sự kiện
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col gap-3">
        {/* Hàng 1: Tìm kiếm + Danh mục + Trạng thái */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Tìm theo tên sự kiện..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" 
            />
          </div>

          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Hàng 2: Lọc ngày + Địa điểm */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <select 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]"
          >
            {dateFilterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {dateFilter === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all"
              />
              <span className="text-gray-500">đến</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all"
              />
            </div>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={locationFilter} 
              onChange={e => setLocationFilter(e.target.value)} 
              placeholder="Lọc theo địa điểm..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" 
            />
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">{editing !== null ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Image */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ảnh sự kiện</label>
              <div 
                onClick={() => !loading && fileRef.current?.click()}
                className={`relative h-48 border-2 border-dashed rounded-xl overflow-hidden transition-all group bg-gray-50 cursor-pointer hover:border-orange-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {form.imagePreview ? (
                  <>
                    <img 
                      src={form.imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-semibold">Đổi ảnh</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 group-hover:text-orange-500 transition-colors">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs font-medium">Click để tải ảnh lên (tối đa 5MB)</p>
                  </div>
                )}
                <input 
                  ref={fileRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>
            </div>

            {/* Tên */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên sự kiện <span className="text-red-400">*</span></label>
              <input 
                required 
                type="text" 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                placeholder="Nhập tên sự kiện..." 
                className={inputCls} 
              />
            </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả sự kiện..." 
                rows={3} 
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white resize-none transition-all" 
              />
            </div>

            {/* Ngày và Giờ */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ngày tổ chức <span className="text-red-400">*</span></label>
              <input 
                required 
                type="date" 
                value={form.date} 
                min={todayStr()}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                className={inputCls} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Giờ bắt đầu</label>
              <input 
                type="time" 
                value={form.time} 
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} 
                className={inputCls} 
              />
            </div>

            {/* Địa điểm và Danh mục */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Địa điểm <span className="text-red-400">*</span></label>
              <input 
                required 
                type="text" 
                value={form.location} 
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Địa điểm tổ chức..." 
                className={inputCls} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select 
                value={form.category} 
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={closeForm} 
                disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Đang lưu...' : editing !== null ? 'Cập nhật' : 'Tạo sự kiện'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách + Pagination */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {events.length === 0 ? 'Chưa có sự kiện nào. Tạo sự kiện đầu tiên!' : 'Không tìm thấy sự kiện phù hợp.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedEvents.map((event, i) => {
              const globalIndex = startIndex + i;
              const d = new Date(event.startDate);
              const displayDate = d.toLocaleDateString('vi-VN');
              const displayTime = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

              // ✅ FIX: Xử lý URL ảnh trong card
              const imageUrl = event.image
                ? event.image.startsWith("http")
                  ? event.image
                  : `http://localhost:8000${event.image}`
                : null;

              return (
                <div key={event._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-md transition-all group">
                  <div className="relative h-36 bg-gray-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl}
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>{displayDate} · {displayTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* ✅ FIX: Xóa <img> nhét nhầm trong nút Sửa */}
                      <button 
                        onClick={() => handleEdit(globalIndex)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(globalIndex)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <span className="text-sm font-medium px-5 py-2.5 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-100">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-xs text-gray-500 mb-5">
              Bạn có chắc muốn xóa sự kiện <span className="text-gray-900 font-semibold">"{events[deleteConfirm]?.title}"</span>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;