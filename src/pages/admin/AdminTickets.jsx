import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, ToggleLeft, ToggleRight, Save, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', price: '', quantity: '', description: '', isEnabled: true, eventId: '' };

const AdminTickets = () => {
  const [events, setEvents] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterEvent, setFilterEvent] = useState('all');

  useEffect(() => {
    setEvents(JSON.parse(localStorage.getItem('adminEvents') || '[]'));
    setTicketTypes(JSON.parse(localStorage.getItem('adminTicketTypes') || '[]'));
  }, []);

  const saveTickets = (data) => {
    localStorage.setItem('adminTicketTypes', JSON.stringify(data));
    setTicketTypes(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity) { toast.error('Vui lòng điền đầy đủ'); return; }

    if (editing !== null) {
      const updated = ticketTypes.map((t, i) => i === editing ? { ...t, ...form, price: Number(form.price), quantity: Number(form.quantity) } : t);
      saveTickets(updated);
      toast.success('Cập nhật loại vé thành công!');
    } else {
      const newTicket = { ...form, id: 'tt-' + Date.now(), price: Number(form.price), quantity: Number(form.quantity), sold: 0, createdAt: new Date().toISOString() };
      saveTickets([newTicket, ...ticketTypes]);
      toast.success('Tạo loại vé thành công!');
    }
    setShowForm(false); setEditing(null); setForm(emptyForm);
  };

  const handleEdit = (i) => { setEditing(i); setForm({ ...ticketTypes[i] }); setShowForm(true); };

  const handleDelete = (i) => {
    saveTickets(ticketTypes.filter((_, idx) => idx !== i));
    toast.success('Đã xóa loại vé');
  };

  const handleToggle = (i) => {
    const updated = ticketTypes.map((t, idx) => idx === i ? { ...t, isEnabled: !t.isEnabled } : t);
    saveTickets(updated);
    toast.success(updated[i].isEnabled ? 'Đã bật loại vé' : 'Đã tắt loại vé');
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const filtered = filterEvent === 'all' ? ticketTypes : ticketTypes.filter(t => t.eventId === filterEvent);

  const getEventName = (id) => events.find(e => e.id === id)?.name || '—';

  const typeBadgeColor = (name) => {
    if (/vip/i.test(name)) return 'from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/20';
    if (/early/i.test(name)) return 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/20';
    if (/standard/i.test(name)) return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/20';
    return 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/20';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Quản lý loại vé</h2>
          <p className="text-xs text-gray-500 mt-0.5">{ticketTypes.length} loại vé</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg">
          <Plus className="w-4 h-4" /> Thêm loại vé
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">{editing !== null ? 'Chỉnh sửa loại vé' : 'Thêm loại vé mới'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên loại vé *</label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VIP, Standard, Early Bird..."
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Sự kiện</label>
              <select value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-orange-400/50">
                <option value="">Chọn sự kiện</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Giá (VND) *</label>
              <input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500000"
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Số lượng *</label>
              <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="100"
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả quyền lợi loại vé..." rows={2}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50 resize-none" />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, isEnabled: !f.isEnabled }))} className="flex items-center gap-2">
                {form.isEnabled
                  ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                  : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                <span className={`text-xs font-medium ${form.isEnabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {form.isEnabled ? 'Đang bán' : 'Tắt'}
                </span>
              </button>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}
                className="flex-1 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm hover:bg-white/5">Hủy</button>
              <button type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-semibold">
                <Save className="w-4 h-4" /> {editing !== null ? 'Cập nhật' : 'Tạo loại vé'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
        className="px-3 py-2 bg-gray-900 border border-white/8 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-orange-400/50">
        <option value="all">Tất cả sự kiện</option>
        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
      </select>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-white/5 rounded-2xl">
          <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chưa có loại vé nào</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Loại vé', 'Sự kiện', 'Giá', 'Số lượng', 'Đã bán', 'Còn lại', 'Trạng thái', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t, i) => {
                  const remaining = t.quantity - (t.sold || 0);
                  const pct = Math.round(((t.sold || 0) / t.quantity) * 100);
                  return (
                    <tr key={t.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r border ${typeBadgeColor(t.name)}`}>
                            <Tag className="w-3 h-3" />{t.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[140px] truncate">{getEventName(t.eventId)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-orange-400 whitespace-nowrap">{formatPrice(t.price)}</td>
                      <td className="px-4 py-3 text-xs text-gray-300">{t.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{t.sold || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{remaining}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggle(ticketTypes.indexOf(t))} className="flex items-center gap-1.5 group">
                          {t.isEnabled
                            ? <><ToggleRight className="w-5 h-5 text-emerald-400" /><span className="text-xs text-emerald-400">Bật</span></>
                            : <><ToggleLeft className="w-5 h-5 text-gray-600" /><span className="text-xs text-gray-500">Tắt</span></>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(ticketTypes.indexOf(t))} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <Edit2 className="w-3 h-3 text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(ticketTypes.indexOf(t))} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;