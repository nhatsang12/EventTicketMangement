import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Image, Calendar, MapPin, Search, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', date: '', time: '19:00', location: '', category: '', imageUrl: '', imagePreview: '' };
const categories = ['Âm nhạc', 'Công nghệ', 'Thể thao', 'Nghệ thuật', 'Ẩm thực', 'Giáo dục', 'Khác'];

// Nén ảnh xuống max 800px, quality 0.7 → giảm ~90% dung lượng so với base64 gốc
const compressImage = (file, maxWidth = 800, quality = 0.7) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// Lưu an toàn — bắt lỗi quota, tự động xóa ảnh base64 nếu tràn
const safeLocalStorageSave = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    try {
      const stripped = data.map(ev => ({
        ...ev,
        imageUrl: ev.imageUrl?.startsWith('data:') ? '' : ev.imageUrl,
        imagePreview: '',
      }));
      localStorage.setItem(key, JSON.stringify(stripped));
      toast('Ảnh upload quá lớn nên đã bị bỏ. Hãy dùng URL ảnh thay vì tải lên.', { icon: '⚠️' });
      return true;
    } catch {
      toast.error('Không thể lưu: bộ nhớ trình duyệt đầy. Hãy xóa bớt sự kiện cũ.');
      return false;
    }
  }
};

// Notify HomePage (same tab) để reload data ngay
const notifyHomePage = () => {
  try { window.dispatchEvent(new CustomEvent("tickethub:events-updated")); } catch {}
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('adminEvents') || '[]');
      setEvents(stored);
    } catch {
      setEvents([]);
    }
  }, []);

  const save = (data) => {
    const ok = safeLocalStorageSave('adminEvents', data);
    if (ok) setEvents(data);
    return ok;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 5MB). Hãy chọn ảnh nhỏ hơn hoặc dùng URL.');
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setForm((f) => ({ ...f, imageUrl: compressed, imagePreview: compressed }));
    } catch {
      toast.error('Không thể xử lý ảnh, hãy thử ảnh khác.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.date || !form.location?.trim()) {
      toast.error('Vui lòng điền đầy đủ: tên, ngày, địa điểm');
      return;
    }
    if (form.date < todayStr()) {
      toast.error('Ngày tổ chức không thể là ngày trong quá khứ');
      return;
    }
    if (editing !== null) {
      const updated = events.map((ev, i) =>
        i === editing ? { ...ev, ...form, imagePreview: '', updatedAt: new Date().toISOString() } : ev
      );
      const ok = save(updated);
      if (ok) { toast.success('Cập nhật sự kiện thành công!'); notifyHomePage(); }
    } else {
      const newEvent = { ...form, imagePreview: '', id: 'evt-' + Date.now(), createdAt: new Date().toISOString(), ticketTypes: [] };
      const ok = save([newEvent, ...events]);
      if (ok) { toast.success('Tạo sự kiện thành công!'); notifyHomePage(); }
    }
    setShowForm(false); setEditing(null); setForm(emptyForm);
  };

  const handleEdit = (i) => {
    setEditing(i);
    setForm({ ...events[i], imagePreview: events[i].imageUrl || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (i) => {
    const deletedEvent = events[i];
    const updatedEvents = events.filter((_, idx) => idx !== i);
    save(updatedEvents);
    setDeleteConfirm(null);
    notifyHomePage();
    if (deletedEvent?.id) {
      try {
        const tickets = JSON.parse(localStorage.getItem("adminTicketTypes") || "[]");
        const remaining = tickets.filter(t => t.eventId !== deletedEvent.id);
        const removed = tickets.length - remaining.length;
        localStorage.setItem("adminTicketTypes", JSON.stringify(remaining));
        toast.success(removed > 0 ? `Đã xóa sự kiện và ${removed} loại vé liên quan` : "Đã xóa sự kiện");
      } catch { toast.success("Đã xóa sự kiện"); }
    } else { toast.success("Đã xóa sự kiện"); }
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); };
  const filtered = events.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));
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
              <div onClick={() => !compressing && fileRef.current?.click()}
                className={`relative h-36 border-2 border-dashed rounded-xl overflow-hidden transition-all group bg-gray-50 ${compressing ? 'border-gray-200 cursor-wait' : 'border-gray-200 hover:border-orange-400 cursor-pointer'}`}>
                {compressing ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs">Đang nén ảnh...</p>
                  </div>
                ) : form.imagePreview ? (
                  <>
                    <img src={form.imagePreview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-semibold">Đổi ảnh</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 group-hover:text-orange-500 transition-colors">
                    <Image className="w-8 h-8" />
                    <p className="text-xs font-medium">Click để tải ảnh lên (tối đa 5MB)</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 mb-1">Hoặc nhập URL ảnh:</p>
              <input type="url" placeholder="https://example.com/image.jpg"
                value={form.imageUrl?.startsWith('data:') ? '' : form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value, imagePreview: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white" />
            </div>

            {/* Tên */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên sự kiện <span className="text-red-400">*</span></label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nhập tên sự kiện..." className={inputCls} />
            </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả sự kiện..." rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white resize-none transition-all" />
            </div>

            {/* Ngày — min = hôm nay */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ngày tổ chức <span className="text-red-400">*</span></label>
              <input required type="date" value={form.date} min={todayStr()}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
              {form.date && form.date < todayStr() && (
                <p className="text-xs text-red-500 mt-1">Ngày không thể là ngày trong quá khứ</p>
              )}
            </div>

            {/* Giờ */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Giờ bắt đầu</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
            </div>

            {/* Địa điểm */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Địa điểm <span className="text-red-400">*</span></label>
              <input required type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Địa điểm tổ chức..." className={inputCls} />
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all">
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={closeForm}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" disabled={compressing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                <Save className="w-4 h-4" />
                {compressing ? 'Đang xử lý...' : editing !== null ? 'Cập nhật' : 'Tạo sự kiện'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sự kiện..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{events.length === 0 ? 'Chưa có sự kiện nào. Tạo sự kiện đầu tiên!' : 'Không tìm thấy sự kiện phù hợp.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-md transition-all group">
              <div className="relative h-36 bg-gray-100">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Image className="w-10 h-10 text-gray-300" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {event.category && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs rounded-full font-semibold border border-gray-200">{event.category}</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-1">{event.name}</h3>
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3 text-orange-400" /><span>{event.date}{event.time ? ` · ${event.time}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 text-purple-400" /><span className="truncate">{event.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(i)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                    <Edit2 className="w-3 h-3" /> Sửa
                  </button>
                  <button onClick={() => setDeleteConfirm(i)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-xs text-gray-500 mb-5">Bạn có chắc muốn xóa sự kiện <span className="text-gray-900 font-semibold">"{events[deleteConfirm]?.name}"</span>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;