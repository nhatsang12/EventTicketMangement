import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, ToggleLeft, ToggleRight, Save, X, Tag, ChevronLeft, ChevronRight, Search, PlusCircle, BanIcon, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import API_URL from '../../config/api';

const ITEMS_PER_PAGE = 10;

const emptyForm = { name: '', price: '', quantity: '', description: '', isActive: true, eventId: '' };

const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.$oid) return String(value.$oid);
    if (value._id) return getEntityId(value._id);
    if (value.id) return String(value.id);
  }
  return '';
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTicketStats = (ticket) => {
  const quantity = Math.max(0, toNumber(ticket?.quantity, 0));
  const soldRaw = Number(ticket?.sold);
  const sold = Number.isFinite(soldRaw) && soldRaw >= 0 ? soldRaw : null;
  const remainingRaw = Number(ticket?.remaining);
  const hasRemaining = ticket?.remaining !== undefined && ticket?.remaining !== null && Number.isFinite(remainingRaw);
  let remaining = hasRemaining ? remainingRaw : Math.max(0, quantity - (sold ?? 0));
  if (hasRemaining && remaining === 0 && quantity > 0 && sold === 0) remaining = quantity;
  remaining = Math.max(0, Math.min(quantity || remaining, remaining));
  const soldCount = sold ?? Math.max(0, quantity - remaining);
  return { quantity, sold: soldCount, remaining };
};

const isEventInactive = (ticket, events) => {
  const eventId = getEntityId(ticket?.event?._id || ticket?.event);
  const event = events.find(e => getEntityId(e?._id) === eventId);
  if (!event) return false;
  const status = (event.status || '').toLowerCase();
  if (['cancelled', 'canceled', 'refunded', 'ended'].includes(status)) return true;
  if (event.endDate) return new Date(event.endDate) < new Date();
  if (event.startDate) {
    const fallbackEnd = new Date(event.startDate);
    fallbackEnd.setHours(23, 59, 59, 999);
    return fallbackEnd < new Date();
  }
  return false;
};

const isOrphanTicket = (ticket, events) => {
  const eventId = getEntityId(ticket?.event?._id || ticket?.event);
  if (!eventId) return true;
  return !events.some((eventItem) => getEntityId(eventItem?._id) === eventId);
};

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
  const [showEventEnded, setShowEventEnded] = useState(true);
  const [showOrphanTickets, setShowOrphanTickets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fillModal, setFillModal] = useState(null);
  const [fillAmount, setFillAmount] = useState('');
  const [fillLoading, setFillLoading] = useState(false);

  const { accessToken } = useAuthStore();

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const evRes = await axios.get(`${API_URL}/api/admin/events/`, config);
      const allEvents = Array.isArray(evRes.data?.data) ? evRes.data.data : evRes.data || [];
      setEvents(allEvents);
      const tcRes = await axios.get(`${API_URL}/api/admin/ticket-types/`, config);
      setTicketTypes(Array.isArray(tcRes.data?.data) ? tcRes.data.data : tcRes.data || []);
      setCurrentPage(1);
    } catch {
      toast.error('Lỗi khi tải dữ liệu từ server');
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filterEvent, statusFilter, sortPrice, searchTicketName, showEventEnded, showOrphanTickets, ticketTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity || !form.eventId) {
      toast.error('Vui lòng điền đầy đủ và chọn Sự kiện');
      return;
    }

    // Kiểm tra trùng tên loại vé (case-insensitive) trong cùng sự kiện
    const editingTicket = editing ? ticketTypes.find((t) => getEntityId(t?._id) === editing) : null;

    const isDuplicate = ticketTypes.some((t) => {
      const sameEvent = getEntityId(t?.event?._id || t?.event) === getEntityId(form.eventId);
      const sameName = t.name?.trim().toLowerCase() === form.name.trim().toLowerCase();
      const isItself = editingTicket ? getEntityId(t?._id) === getEntityId(editingTicket?._id) : false;
      return sameEvent && sameName && !isItself;
    });
    if (isDuplicate) {
      toast.error(`Loại vé "${form.name}" đã tồn tại trong sự kiện này`);
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const quantity = Number(form.quantity);
      const payload = {
        event: form.eventId,
        name: form.name,
        price: Number(form.price),
        quantity,
        description: form.description,
        isActive: form.isActive,
      };
      if (editingTicket) {
        const currentStats = getTicketStats(editingTicket);
        payload.remaining = Math.max(0, quantity - currentStats.sold);
      } else {
        payload.remaining = quantity;
      }
      if (editingTicket) {
        await axios.put(`${API_URL}/api/admin/ticket-types/${editingTicket._id}`, payload, config);
        toast.success('Cập nhật loại vé thành công!');
      } else {
        await axios.post(`${API_URL}/api/admin/ticket-types/`, payload, config);
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

  const handleEdit = (ticket) => {
    const t = ticket;
    if (isOrphanTicket(t, events)) {
      toast.error('Vé mồ côi không thể chỉnh sửa, vui lòng xóa');
      return;
    }
    if (isEventInactive(t, events)) {
      toast.error('Không thể chỉnh sửa vé của sự kiện đã kết thúc hoặc bị hủy');
      return;
    }
    setEditing(getEntityId(t?._id));
    setForm({ ...t, eventId: getEntityId(t?.event?._id || t?.event) });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (ticket) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa loại vé này?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      await axios.delete(`${API_URL}/api/admin/ticket-types/${ticket._id}`, config);
      toast.success('Đã xóa loại vé');
      fetchData();
    } catch {
      toast.error('Lỗi khi xóa loại vé');
    }
  };

  const handleToggle = async (ticket) => {
    if (isOrphanTicket(ticket, events)) {
      toast.error('Vé mồ côi không thể đổi trạng thái, vui lòng xóa');
      return;
    }
    if (isEventInactive(ticket, events)) {
      toast.error('Không thể thay đổi trạng thái vé của sự kiện đã kết thúc hoặc bị hủy');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const newStatus = !ticket.isActive;
      await axios.put(`${API_URL}/api/admin/ticket-types/${ticket._id}`, { isActive: newStatus }, config);
      toast.success(newStatus ? 'Đã bật loại vé' : 'Đã tắt loại vé');
      fetchData();
    } catch {
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const openFillModal = (ticket) => {
    if (isOrphanTicket(ticket, events)) {
      toast.error('Vé mồ côi không thể thêm số lượng, vui lòng xóa');
      return;
    }
    if (isEventInactive(ticket, events)) {
      toast.error('Không thể thêm vé cho sự kiện đã kết thúc hoặc bị hủy');
      return;
    }
    setFillModal({ ticket });
    setFillAmount('');
  };

  const closeFillModal = () => { setFillModal(null); setFillAmount(''); };

  const handleFillSubmit = async () => {
    const amount = Number(fillAmount);
    if (!fillAmount || isNaN(amount) || amount <= 0) { toast.error('Vui lòng nhập số lượng hợp lệ (> 0)'); return; }
    try {
      setFillLoading(true);
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const ticket = fillModal.ticket;
      const currentStats = getTicketStats(ticket);
      await axios.put(`${API_URL}/api/admin/ticket-types/${ticket._id}`,
        { quantity: currentStats.quantity + amount, remaining: currentStats.remaining + amount }, config);
      toast.success(`Đã thêm ${amount} vé vào "${ticket.name}"`);
      fetchData();
      closeFillModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật số lượng vé');
    } finally {
      setFillLoading(false);
    }
  };

  const handleCleanupOrphanTickets = async () => {
    const orphanTickets = ticketTypes.filter((ticket) => isOrphanTicket(ticket, events));
    if (orphanTickets.length === 0) {
      toast.success('Không còn vé mồ côi');
      return;
    }

    const ok = window.confirm(`Bạn có chắc muốn xóa ${orphanTickets.length} vé mồ côi (không còn sự kiện gốc)?`);
    if (!ok) return;

    try {
      setCleanupLoading(true);
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const results = await Promise.allSettled(
        orphanTickets.map((ticket) =>
          axios.delete(`${API_URL}/api/admin/ticket-types/${ticket._id}`, config)
        )
      );

      const successCount = results.filter((item) => item.status === 'fulfilled').length;
      const failedCount = orphanTickets.length - successCount;

      if (successCount > 0) {
        toast.success(`Đã xóa ${successCount}/${orphanTickets.length} vé mồ côi`);
      }
      if (failedCount > 0) {
        toast.error(`Có ${failedCount} vé mồ côi chưa xóa được`);
      }

      await fetchData();
    } catch {
      toast.error('Lỗi khi dọn vé mồ côi');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  let processed = ticketTypes;
  if (!showOrphanTickets) processed = processed.filter(t => !isOrphanTicket(t, events));
  if (filterEvent !== 'all') {
    processed = processed.filter(t => getEntityId(t?.event?._id || t?.event) === getEntityId(filterEvent));
  }
  if (statusFilter === 'active') processed = processed.filter(t => !isOrphanTicket(t, events) && t.isActive !== false && !isEventInactive(t, events));
  else if (statusFilter === 'inactive') processed = processed.filter(t => !isOrphanTicket(t, events) && t.isActive === false && !isEventInactive(t, events));
  else if (statusFilter === 'event_dead') processed = processed.filter(t => !isOrphanTicket(t, events) && isEventInactive(t, events));
  if (!showEventEnded) processed = processed.filter(t => !isEventInactive(t, events));
  if (searchTicketName.trim()) processed = processed.filter(t => t.name?.toLowerCase().includes(searchTicketName.toLowerCase()));
  if (sortPrice !== 'none') {
    processed = [...processed].sort((a, b) => sortPrice === 'asc' ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price));
  }

  const orphanCount = ticketTypes.filter(t => isOrphanTicket(t, events)).length;
  const activeCount = ticketTypes.filter(t => !isOrphanTicket(t, events) && t.isActive !== false && !isEventInactive(t, events)).length;
  const deadCount = ticketTypes.filter(t => !isOrphanTicket(t, events) && isEventInactive(t, events)).length;
  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = processed.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const getEventMeta = (eventId) => {
    const id = getEntityId(eventId?._id || eventId);
    const event = events.find(e => getEntityId(e?._id) === id);
    if (!id || !event) {
      return { label: 'Sự kiện đã bị xóa', isOrphan: true };
    }
    return { label: event.title || 'Sự kiện không tên', isOrphan: false };
  };
  const typeBadgeColor = (name) => {
    const s = name || '';
    if (/vip/i.test(s)) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (/early/i.test(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (/standard/i.test(s)) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  // Real-time duplicate check
  const isDuplicateName = form.name.trim() !== '' && form.eventId !== ''
    ? ticketTypes.some((t) => {
      const sameEvent = getEntityId(t?.event?._id || t?.event) === getEntityId(form.eventId);
      const sameName = t.name?.trim().toLowerCase() === form.name.trim().toLowerCase();
      const isItself = editing !== null && getEntityId(t?._id) === getEntityId(editing);
      return sameEvent && sameName && !isItself;
    })
    : false;

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản lý loại vé</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {ticketTypes.length} loại vé
            {' · '}<span className="text-emerald-600 font-semibold">{activeCount} đang bán</span>
            {deadCount > 0 && <> · <span className="text-gray-400">{deadCount} tắt do event hủy</span></>}
            {orphanCount > 0 && <> · <span className="text-red-500 font-semibold">{orphanCount} vé mồ côi</span></>}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-md">
          <Plus className="w-4 h-4" /> Thêm loại vé
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTicketName} onChange={e => setSearchTicketName(e.target.value)}
            placeholder="Tìm tên loại vé..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" />
        </div>
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[190px]">
          <option value="all">Tất cả sự kiện</option>
          <optgroup label="── Đang hoạt động">
            {events.filter(ev => {
              const s = (ev.status || '').toLowerCase();
              if (['cancelled', 'canceled', 'refunded', 'ended'].includes(s)) return false;
              if (ev.endDate) return new Date(ev.endDate) >= new Date();
              if (ev.startDate) { const d = new Date(ev.startDate); d.setHours(23, 59, 59, 999); return d >= new Date(); }
              return true;
            }).map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
          </optgroup>
          <optgroup label="── Đã kết thúc / Hủy">
            {events.filter(ev => {
              const s = (ev.status || '').toLowerCase();
              if (['cancelled', 'canceled', 'refunded', 'ended'].includes(s)) return true;
              if (ev.endDate) return new Date(ev.endDate) < new Date();
              if (ev.startDate) { const d = new Date(ev.startDate); d.setHours(23, 59, 59, 999); return d < new Date(); }
              return false;
            }).map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
          </optgroup>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[180px]">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Đã tắt</option>
          <option value="event_dead">Tắt do event hủy</option>
        </select>
        <select value={sortPrice} onChange={e => setSortPrice(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]">
          <option value="none">Sắp xếp giá</option>
          <option value="asc">Giá thấp → cao</option>
          <option value="desc">Giá cao → thấp</option>
        </select>
        {deadCount > 0 && (
          <button onClick={() => setShowEventEnded(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${showEventEnded ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'}`}>
            <BanIcon className="w-3.5 h-3.5" />
            {showEventEnded ? 'Ẩn vé event hủy' : 'Hiện vé event hủy'}
          </button>
        )}
        {orphanCount > 0 && (
          <>
            <button
              onClick={() => setShowOrphanTickets(v => !v)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${showOrphanTickets ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {showOrphanTickets ? 'Ẩn vé mồ côi' : `Hiện vé mồ côi (${orphanCount})`}
            </button>
            <button
              onClick={handleCleanupOrphanTickets}
              disabled={cleanupLoading}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all bg-red-50 border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {cleanupLoading ? 'Đang dọn...' : 'Dọn vé mồ côi'}
            </button>
          </>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">{editing !== null ? 'Chỉnh sửa loại vé' : 'Thêm loại vé mới'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên loại vé *</label>
              <input
                required type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="VIP, Standard, Early Bird..."
                className={`w-full px-3 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all border ${isDuplicateName
                    ? 'border-red-400 bg-red-50 focus:border-red-400'
                    : 'bg-gray-50 border-gray-200 focus:border-orange-400 focus:bg-white'
                  }`}
              />
              {isDuplicateName && (
                <p className="mt-1 text-xs text-red-500 font-medium">Tên này đã tồn tại trong sự kiện đã chọn</p>
              )}
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
              <input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Số lượng *</label>
              <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="100" className={inputCls} />
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
                {form.isActive !== false ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                <span className={`text-xs font-semibold ${form.isActive !== false ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {form.isActive !== false ? 'Đang bán' : 'Tắt'}
                </span>
              </button>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" disabled={loading || isDuplicateName}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
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
          <p className="text-gray-500 text-sm">
            {!showOrphanTickets && orphanCount > 0
              ? 'Đang ẩn vé mồ côi. Bật "Hiện vé mồ côi" để xem.'
              : 'Chưa có loại vé nào'}
          </p>
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
                {paginatedTickets.map((t) => {
                  const stats = getTicketStats(t);
                  const remaining = stats.remaining;
                  const pct = stats.quantity ? Math.round((stats.sold / stats.quantity) * 100) : 0;
                  const eventMeta = getEventMeta(t.event);
                  const orphanTicket = eventMeta.isOrphan;
                  const eventDead = isEventInactive(t, events);
                  const lockedTicket = eventDead || orphanTicket;
                  return (
                    <tr key={t._id} className={`transition-colors ${orphanTicket ? 'bg-red-50/40' : eventDead ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border w-fit ${lockedTicket ? 'bg-gray-100 text-gray-400 border-gray-200' : typeBadgeColor(t.name)}`}>
                            <Tag className="w-3 h-3" />{t.name}
                          </span>
                          {orphanTicket && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                              <AlertTriangle className="w-3 h-3" />Vé mồ côi
                            </span>
                          )}
                          {!orphanTicket && eventDead && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                              <BanIcon className="w-3 h-3" />Sự kiện đã kết thúc / hủy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-xs max-w-[180px] truncate ${orphanTicket ? 'text-red-500 font-semibold' : eventDead ? 'text-gray-400' : 'text-gray-500'}`}>{eventMeta.label}</td>
                      <td className={`px-4 py-3 text-xs font-bold whitespace-nowrap ${lockedTicket ? 'text-gray-400' : 'text-orange-600'}`}>{formatPrice(t.price)}</td>
                      <td className={`px-4 py-3 text-xs font-medium ${lockedTicket ? 'text-gray-400' : 'text-gray-700'}`}>{stats.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${lockedTicket ? 'bg-gray-300' : 'bg-gradient-to-r from-orange-500 to-purple-600'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${lockedTicket ? 'text-gray-400' : 'text-gray-600'}`}>{stats.sold}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${lockedTicket ? 'text-gray-400' : remaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{remaining}</span>
                      </td>
                      <td className="px-4 py-3">
                        {lockedTicket ? (
                          <div className="flex items-center gap-1.5 cursor-not-allowed opacity-50">
                            <ToggleLeft className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">{orphanTicket ? 'Mồ côi' : 'Tắt'}</span>
                          </div>
                        ) : (
                          <button onClick={() => handleToggle(t)} className="flex items-center gap-1.5">
                            {t.isActive !== false
                              ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-xs text-emerald-600 font-semibold">Bật</span></>
                              : <><ToggleLeft className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">Tắt</span></>}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => !lockedTicket && openFillModal(t)} disabled={lockedTicket}
                            title={orphanTicket ? 'Vé mồ côi, chỉ có thể xóa' : eventDead ? 'Sự kiện đã kết thúc' : 'Thêm số lượng vé'}
                            className={`p-1.5 rounded-lg transition-colors ${lockedTicket ? 'bg-gray-100 cursor-not-allowed opacity-40' : 'bg-emerald-50 hover:bg-emerald-100'}`}>
                            <PlusCircle className={`w-3 h-3 ${lockedTicket ? 'text-gray-400' : 'text-emerald-600'}`} />
                          </button>
                          <button onClick={() => !lockedTicket && handleEdit(t)} disabled={lockedTicket}
                            title={orphanTicket ? 'Vé mồ côi, chỉ có thể xóa' : eventDead ? 'Sự kiện đã kết thúc' : 'Chỉnh sửa'}
                            className={`p-1.5 rounded-lg transition-colors ${lockedTicket ? 'bg-gray-100 cursor-not-allowed opacity-40' : 'bg-gray-100 hover:bg-gray-200'}`}>
                            <Edit2 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button onClick={() => handleDelete(t)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Xóa">
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

      {/* Modal fill */}
      {fillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900">Thêm số lượng vé</h3>
              <button onClick={closeFillModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Loại vé: <span className="font-semibold text-gray-800">{fillModal.ticket.name}</span></p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Tổng hiện tại</p>
                <p className="text-sm font-bold text-gray-800">{getTicketStats(fillModal.ticket).quantity}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Còn lại</p>
                <p className="text-sm font-bold text-emerald-600">{getTicketStats(fillModal.ticket).remaining}</p>
              </div>
              <div className="flex-1 bg-orange-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Sau khi thêm</p>
                <p className="text-sm font-bold text-orange-600">
                  {fillAmount && Number(fillAmount) > 0 ? getTicketStats(fillModal.ticket).quantity + Number(fillAmount) : '—'}
                </p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Số lượng cần thêm *</label>
              <input type="number" min="1" value={fillAmount} onChange={e => setFillAmount(e.target.value)} placeholder="Nhập số lượng..." autoFocus
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={closeFillModal} disabled={fillLoading} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
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
