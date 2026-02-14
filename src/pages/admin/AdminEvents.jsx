import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Image, Calendar, MapPin, Search, X, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', date: '', time: '19:00', location: '', category: '', imageUrl: '', imagePreview: '' };

const categories = ['Âm nhạc', 'Công nghệ', 'Thể thao', 'Nghệ thuật', 'Ẩm thực', 'Giáo dục', 'Khác'];

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('adminEvents') || '[]');
    setEvents(stored);
  }, []);

  const save = (data) => {
    localStorage.setItem('adminEvents', JSON.stringify(data));
    setEvents(data);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, imageUrl: ev.target.result, imagePreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.location) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }

    if (editing !== null) {
      const updated = events.map((ev, i) => i === editing ? { ...ev, ...form, updatedAt: new Date().toISOString() } : ev);
      save(updated);
      toast.success('Cập nhật sự kiện thành công!');
    } else {
      const newEvent = { ...form, id: 'evt-' + Date.now(), createdAt: new Date().toISOString(), ticketTypes: [] };
      save([newEvent, ...events]);
      toast.success('Tạo sự kiện thành công!');
    }
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (i) => {
    setEditing(i);
    setForm({ ...events[i], imagePreview: events[i].imageUrl || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (i) => {
    const updated = events.filter((_, idx) => idx !== i);
    save(updated);
    setDeleteConfirm(null);
    toast.success('Đã xóa sự kiện');
  };

  const filtered = events.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Quản lý sự kiện</h2>
          <p className="text-xs text-gray-500 mt-0.5">{events.length} sự kiện</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg">
          <Plus className="w-4 h-4" /> Tạo sự kiện
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">{editing !== null ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ảnh sự kiện</label>
              <div onClick={() => fileRef.current?.click()}
                className="relative h-36 border-2 border-dashed border-white/10 hover:border-orange-400/50 rounded-xl overflow-hidden cursor-pointer transition-all group">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600 group-hover:text-gray-400 transition-colors">
                    <Image className="w-8 h-8" />
                    <p className="text-xs">Click để tải ảnh lên</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {form.imagePreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs font-medium">Đổi ảnh</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">hoặc nhập URL:</p>
              <input type="url" placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value, imagePreview: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-white/8 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên sự kiện *</label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nhập tên sự kiện..."
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả sự kiện..." rows={3}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Ngày *</label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-orange-400/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Giờ</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-orange-400/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Địa điểm *</label>
              <input required type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Địa điểm tổ chức..."
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-orange-400/50">
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}
                className="flex-1 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm hover:bg-white/5 transition-colors">Hủy</button>
              <button type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-purple-700 transition-all">
                <Save className="w-4 h-4" /> {editing !== null ? 'Cập nhật' : 'Tạo sự kiện'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sự kiện..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
      </div>

      {/* Event list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-white/5 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chưa có sự kiện nào. Tạo sự kiện đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <div key={event.id} className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group">
              <div className="relative h-36 bg-gray-800">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-10 h-10 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                {event.category && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full border border-white/10">
                    {event.category}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{event.name}</h3>
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{event.date} {event.time && `· ${event.time}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(i)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">
                    <Edit2 className="w-3 h-3" /> Sửa
                  </button>
                  <button onClick={() => setDeleteConfirm(i)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold text-white mb-2">Xác nhận xóa</h3>
            <p className="text-xs text-gray-400 mb-5">Bạn có chắc muốn xóa sự kiện <span className="text-white font-medium">"{events[deleteConfirm]?.name}"</span>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-white/10 text-gray-400 rounded-xl text-sm hover:bg-white/5">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;