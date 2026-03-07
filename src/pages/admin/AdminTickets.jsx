import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, ToggleLeft, ToggleRight, Save, X, Tag, ChevronLeft, ChevronRight, Search, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import API_URL from '../../config/api';

const ITEMS_PER_PAGE = 10;

const emptyForm = { name: '', price: '', quantity: '', description: '', isActive: true, eventId: '' };

const AdminTickets = () => {
  const [events, setEvents] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterEvent, setFilterEvent] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortPrice, setSortPrice] = useState('none');
  const [searchTicketName, setSearchTicketName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fill quantity modal ──
  const [fillModal, setFillModal] = useState(null); // { index, ticket }
  const [fillAmount, setFillAmount] = useState('');
  const [fillLoading, setFillLoading] = useState(false);

  const { accessToken } = useAuthStore();

  const apiTickets = axios.create({ baseURL: `${API_URL}/api/admin/ticket-types` });
  const apiEvents  = axios.create({ baseURL: `${API_URL}/api/admin/events` });

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const evRes = await apiEvents.get('/', config);
      setEvents(Array.isArray(evRes.data?.data ?? evRes.data) ? (evRes.data?.data ?? evRes.data) : []);
      const tcRes = await apiTickets.get('/', config);
      setTicketTypes(Array.isArray(tcRes.data?.data ?? tcRes.data) ? (tcRes.data?.data ?? tcRes.data) : []);
      setCurrentPage(1);
    } catch {
      toast.error('Lỗi khi tải dữ liệu từ server');
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filterEvent, statusFilter, sortPrice, searchTicketName, ticketTypes]);

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
        isActive: form.isActive,
      };
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      if (editing !== null) {
        await apiTickets.put(`/${ticketTypes[editing]._id}`, payload, config);
        toast.success('Cập nhật loại vé thành công!');
      } else {
        await apiTickets.post('/', payload, config);
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

  const handleEdit = (i) => {
    setEditing(i);
    const t = ticketTypes[i];
    setForm({ ...t, eventId: t.event?._id || t.event });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (i) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa loại vé này?')) return;
    try {
      await apiTickets.delete(`/${ticketTypes[i]._id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast.success('Đã xóa loại vé');
      fetchData();
    } catch {
      toast.error('Lỗi khi xóa loại vé');
    }
  };

  const handleToggle = async (i) => {
    try {
      const ticket = ticketTypes[i];
      const newStatus = !ticket.isActive;
      await apiTickets.put(`/${ticket._id}`, { isActive: newStatus }, { headers: { Authorization: `Bearer ${accessToken}` } });
      toast.success(newStatus ? 'Đã bật loại vé' : 'Đã tắt loại vé');
      fetchData();
    } catch {
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  // ── Fill quantity handler ──
  const openFillModal = (globalIndex) => {
    setFillModal({ index: globalIndex, ticket: ticketTypes[globalIndex] });
    setFillAmount('');
  };

  const closeFillModal = () => {
    setFillModal(null);
    setFillAmount('');
  };

  const handleFillSubmit = async () => {
    const amount = Number(fillAmount);
    if (!fillAmount || isNaN(amount) || amount <= 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ (> 0)');
      return;
    }
    try {
      setFillLoading(true);
      const ticket = fillModal.ticket;
      const newQuantity = ticket.quantity + amount;
      const currentRemaining = ticket.remaining !== undefined
        ? ticket.remaining
        : ticket.quantity - (ticket.sold || 0);
      const newRemaining = currentRemaining + amount;

      await apiTickets.put(
        `/${ticket._id}`,
        { quantity: newQuantity, remaining: newRemaining },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`Đã thêm ${amount} vé vào "${ticket.name}"`);
      fetchData();
      closeFillModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật số lượng vé');
    } finally {
      setFillLoading(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  // Filter + Sort
  let processed = ticketTypes;
  if (filterEvent !== 'all') processed = processed.filter(t => (t.event?._id || t.event) === filterEvent);
  if (statusFilter !== 'all') processed = processed.filter(t => t.isActive === (statusFilter === 'active'));
  if (searchTicketName.trim()) processed = processed.filter(t => t.name?.toLowerCase().includes(searchTicketName.toLowerCase()));
  if (sortPrice !== 'none') {
    processed = [...processed].sort((a, b) =>
      sortPrice === 'asc' ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price)
    );
  }

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = processed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const getEventName = (eventId) => {
    const id = eventId?._id || eventId;
    return events.find(e => e._id === id)?.title || '—';
  };

  const typeBadgeColor = (name) => {
    const s = name || '';
    if (/vip/i.test(s))    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (/early/i.test(s))  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (/standard/i.test(s)) return 'bg-blue-50 text-blue-700 border-blue-200';
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

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTicketName} onChange={e => setSearchTicketName(e.target.value)}
            placeholder="Tìm theo tên loại vé..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" />
        </div>
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[180px]">
          <option value="all">Tất cả sự kiện</option>
          {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Tắt</option>
        </select>
        <select value={sortPrice} onChange={e => setSortPrice(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]">
          <option value="none">Sắp xếp giá</option>
          <option value="asc">Giá thấp → cao</option>
          <option value="desc">Giá cao → thấp</option>
        </select>
      </div>

      {/* Form tạo/sửa vé */}
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
                {form.isActive !== false
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

      {/* Table */}
      {processed.length === 0 ? (
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
                {paginatedTickets.map((t, i) => {
                  const remaining = t.remaining !== undefined ? t.remaining : (t.quantity - (t.sold || 0));
                  const pct = Math.round(((t.sold || 0) / t.quantity) * 100);
                  const globalIndex = startIndex + i;

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
                        <button onClick={() => handleToggle(globalIndex)} className="flex items-center gap-1.5">
                          {t.isActive !== false
                            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-xs text-emerald-600 font-semibold">Bật</span></>
                            : <><ToggleLeft className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">Tắt</span></>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openFillModal(globalIndex)}
                            title="Thêm số lượng vé"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                          </button>
                          <button onClick={() => handleEdit(globalIndex)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            <Edit2 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button onClick={() => handleDelete(globalIndex)}
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

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-100">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="p-2.5 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium px-5 py-2.5 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-100">
                Trang {currentPage} / {totalPages}
              </span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="p-2.5 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal fill số lượng vé ── */}
      {fillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900">Thêm số lượng vé</h3>
              <button onClick={closeFillModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Loại vé:&nbsp;
              <span className="font-semibold text-gray-800">{fillModal.ticket.name}</span>
            </p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Tổng hiện tại</p>
                <p className="text-sm font-bold text-gray-800">{fillModal.ticket.quantity}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Còn lại</p>
                <p className="text-sm font-bold text-emerald-600">
                  {fillModal.ticket.remaining !== undefined
                    ? fillModal.ticket.remaining
                    : fillModal.ticket.quantity - (fillModal.ticket.sold || 0)}
                </p>
              </div>
              <div className="flex-1 bg-orange-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Sau khi thêm</p>
                <p className="text-sm font-bold text-orange-600">
                  {fillAmount && Number(fillAmount) > 0
                    ? fillModal.ticket.quantity + Number(fillAmount)
                    : '—'}
                </p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Số lượng cần thêm *
              </label>
              <input
                type="number"
                min="1"
                value={fillAmount}
                onChange={e => setFillAmount(e.target.value)}
                placeholder="Nhập số lượng..."
                autoFocus
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={closeFillModal} disabled={fillLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={handleFillSubmit} disabled={fillLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                <PlusCircle className="w-4 h-4" />
                {fillLoading ? 'Đang lưu...' : 'Xác nhận thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;