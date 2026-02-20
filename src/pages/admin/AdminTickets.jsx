import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, ToggleLeft, ToggleRight, Save, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const emptyForm = { name: '', price: '', quantity: '', description: '', isActive: true, eventId: '' };

const AdminTickets = () => {
  const [events, setEvents] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterEvent, setFilterEvent] = useState('all');
  const [loading, setLoading] = useState(false);

  // Lấy Access Token từ Store
  const { accessToken } = useAuthStore();

  // Cấu hình Axios
 // Cấu hình Axios trỏ thẳng tới Backend
  const apiTickets = axios.create({
    baseURL: 'http://localhost:8000/api/admin/ticket-types',
  });

  const apiEvents = axios.create({
    baseURL: 'http://localhost:8000/api/admin/events',
  });

  // 1. TẢI DỮ LIỆU TỪ BACKEND (Phiên bản chống Crash)
 // 1. TẢI DỮ LIỆU TỪ BACKEND
  const fetchData = async () => {
    try {
      // Ép Token vào config để đảm bảo 100% luôn có thẻ VIP khi gọi API
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` }
      };

      // Gắn config vào các hàm GET
      const evRes = await apiEvents.get('/', config);
      const eventsData = evRes.data?.data || evRes.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);

      const tcRes = await apiTickets.get('/', config);
      const ticketsData = tcRes.data?.data || tcRes.data || [];
      setTicketTypes(Array.isArray(ticketsData) ? ticketsData : []);
      
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
      toast.error('Lỗi khi tải dữ liệu từ server (Xem console)');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. TẠO HOẶC CẬP NHẬT LOẠI VÉ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity || !form.eventId) { 
      toast.error('Vui lòng điền đầy đủ và chọn Sự kiện'); 
      return; 
    }

    try {
      setLoading(true);
      const payload = {
        event: form.eventId, 
        name: form.name,
        price: Number(form.price),
        quantity: Number(form.quantity),
        description: form.description,
        isActive: form.isActive
      };

      // Cấu hình nhét Token vào
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };

      if (editing !== null) {
        const ticketId = ticketTypes[editing]._id;
        await apiTickets.put(`/${ticketId}`, payload, config); // 👈 Cập nhật có Token
        toast.success('Cập nhật loại vé thành công!');
      } else {
        await apiTickets.post('/', payload, config); // 👈 Tạo mới có Token
        toast.success('Tạo loại vé thành công!');
      }

      fetchData(); 
      setShowForm(false); 
      setEditing(null); 
      setForm(emptyForm);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu loại vé');
    } finally {
      setLoading(false);
    }
  };

  // 3. MỞ FORM CHỈNH SỬA
  const handleEdit = (i) => { 
    setEditing(i); 
    const t = ticketTypes[i];
    setForm({ 
      ...t, 
      eventId: t.event?._id || t.event // Xử lý trường hợp populate
    }); 
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. XÓA LOẠI VÉ
  const handleDelete = async (i) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa loại vé này?")) return;
    try {
      const ticketId = ticketTypes[i]._id;
      // Nhét Token vào lúc xóa
      await apiTickets.delete(`/${ticketId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      toast.success('Đã xóa loại vé');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa loại vé');
    }
  };
 // 5. BẬT/TẮT TRẠNG THÁI VÉ
  const handleToggle = async (i) => {
    try {
      const ticket = ticketTypes[i];
      const ticketId = ticket._id;
      const newStatus = !ticket.isActive;
      
      // Nhét Token vào lúc cập nhật trạng thái
      await apiTickets.put(`/${ticketId}`, { isActive: newStatus }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      toast.success(newStatus ? 'Đã bật loại vé' : 'Đã tắt loại vé');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  // Lọc vé theo sự kiện (Dùng _id)
  const filtered = filterEvent === 'all' 
    ? ticketTypes 
    : ticketTypes.filter(t => (t.event?._id || t.event) === filterEvent);
    
  const getEventName = (eventId) => {
    const id = eventId?._id || eventId; // Trường hợp API ticket đã populate event
    return events.find(e => e._id === id)?.title || '—'; // Backend của bạn dùng 'title' thay vì 'name' cho Event
  };

  const typeBadgeColor = (name) => {
    const safeName = name || ''; // 👈 Thêm dòng này để chống lỗi name bị undefined
    if (/vip/i.test(name)) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (/early/i.test(name)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (/standard/i.test(name)) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản lý loại vé</h2>
          <p className="text-xs text-gray-500 mt-0.5">{ticketTypes.length} loại vé</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-md">
          <Plus className="w-4 h-4" /> Thêm loại vé
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">{editing !== null ? 'Chỉnh sửa loại vé' : 'Thêm loại vé mới'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên loại vé *</label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="VIP, Standard, Early Bird..." className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sự kiện *</label>
              <select required value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all">
                <option value="">Chọn sự kiện</option>
                {/* Lấy title và _id từ Backend */}
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Giá (VND) *</label>
              <input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="500000" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Số lượng *</label>
              <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="100" className={inputCls} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả quyền lợi loại vé..." rows={2}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white resize-none transition-all" />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className="flex items-center gap-2">
                {form.isActive !== false // Default true nếu chưa set
                  ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                  : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                <span className={`text-xs font-semibold ${form.isActive !== false ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {form.isActive !== false ? 'Đang bán' : 'Tắt'}
                </span>
              </button>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-60">
                <Save className="w-4 h-4" /> {loading ? 'Đang xử lý...' : (editing !== null ? 'Cập nhật' : 'Tạo loại vé')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all">
        <option value="all">Tất cả sự kiện</option>
        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
      </select>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chưa có loại vé nào</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Loại vé', 'Sự kiện', 'Giá', 'Số lượng', 'Đã bán', 'Còn lại', 'Trạng thái', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t, i) => {
                  const remaining = t.remaining !== undefined ? t.remaining : (t.quantity - (t.sold || 0));
                  const pct = Math.round(((t.sold || 0) / t.quantity) * 100);
                  
                  return (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${typeBadgeColor(t.name)}`}>
                          <Tag className="w-3 h-3" />{t.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{getEventName(t.event)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-orange-600 whitespace-nowrap">{formatPrice(t.price)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 font-medium">{t.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{t.sold || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${remaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{remaining}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggle(ticketTypes.indexOf(t))} className="flex items-center gap-1.5">
                          {t.isActive !== false
                            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-xs text-emerald-600 font-semibold">Bật</span></>
                            : <><ToggleLeft className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">Tắt</span></>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(ticketTypes.indexOf(t))}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            <Edit2 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button onClick={() => handleDelete(ticketTypes.indexOf(t))}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 className="w-3 h-3 text-red-500" />
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