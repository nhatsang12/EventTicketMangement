import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Calendar, MapPin, Search, X, Save, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Ticket, ToggleRight, ToggleLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import API_URL from '../../config/api';

const ITEMS_PER_PAGE = 6;
const emptyForm = { title: '', description: '', date: '', time: '19:00', endDate: '', endTime: '21:00', location: '', category: '', imageFile: null, imagePreview: '' };
const emptyTicketRow = () => ({ name: '', price: '', quantity: '', description: '', isActive: true });
const categories = ['Âm nhạc', 'Công nghệ', 'Thể thao', 'Nghệ thuật', 'Ẩm thực', 'Giáo dục', 'Khác'];
const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang mở' },
  { value: 'draft', label: 'Nháp' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
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

const toLocalISO = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const t = timeStr && timeStr.length === 5 ? timeStr : '00:00';
  const d = new Date(`${dateStr}T${t}:00`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const toLocalDateStr = (d) => {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toLocalTimeStr = (d) => {
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getStatusBadge = (status) => {
  const map = {
    active: { cls: 'bg-emerald-100 text-emerald-700', label: 'Đang mở' },
    ended: { cls: 'bg-gray-100 text-gray-500', label: 'Đã kết thúc' },
    draft: { cls: 'bg-yellow-100 text-yellow-700', label: 'Nháp' },
    cancelled: { cls: 'bg-red-100 text-red-600', label: 'Đã hủy' },
    refunded: { cls: 'bg-blue-100 text-blue-700', label: 'Đã hoàn tiền' },
  };
  return map[status] || map['active'];
};

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

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

const isCancelledOrRefundedStatus = (value) => {
  const status = normalizeStatus(value);
  return ['cancelled', 'canceled', 'refunded', 'refund', 'refund_completed'].includes(status);
};

const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.message || data?.error || data?.details || fallback;
};

const getEventOrderStats = (orders) => {
  const map = {};
  const safeOrders = Array.isArray(orders) ? orders : [];

  safeOrders.forEach((order) => {
    const eventId = getEntityId(order?.event?._id || order?.event);
    if (!eventId) return;

    const orderStatus = normalizeStatus(order?.status);
    const ticketCount = Array.isArray(order?.tickets) ? order.tickets.length : Number(order?.ticketCount || 0);
    const isResolved = isCancelledOrRefundedStatus(orderStatus);

    if (!map[eventId]) {
      map[eventId] = { soldTickets: 0, paidOrders: 0, totalOrders: 0 };
    }

    map[eventId].totalOrders += 1;
    if (!isResolved) {
      map[eventId].paidOrders += 1;
      map[eventId].soldTickets += Math.max(0, Number(ticketCount) || 0);
    }
  });

  return map;
};

const getSoldTicketsCount = (event, orderStats) => {
  const eventId = getEntityId(event?._id || event?.id);
  if (eventId && orderStats?.[eventId]?.soldTickets !== undefined) {
    return Math.max(0, Number(orderStats[eventId].soldTickets) || 0);
  }

  const directFields = [
    event?.soldTickets,
    event?.ticketsSold,
    event?.soldCount,
    event?.totalSold,
    event?.stats?.soldTickets,
    event?.stats?.ticketsSold,
  ];
  for (const value of directFields) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  return 0;
};

const createEventCancelAttempts = (eventId, reason) => [
  { method: 'post', url: `${API_URL}/api/admin/events/${eventId}/cancel-refund`, data: { reason } },
  { method: 'put', url: `${API_URL}/api/admin/events/${eventId}`, data: { status: 'cancelled', reason } },
];

const createEventStatusAttempts = (eventId, reason) => [
  { method: 'put', url: `${API_URL}/api/admin/events/${eventId}`, data: { status: 'cancelled', reason } },
];

const createOrderRefundAttempts = (orderId, reason) => [
  { method: 'post', url: `${API_URL}/api/orders/${orderId}/cancel`, data: { reason } },
  { method: 'post', url: `${API_URL}/api/orders/cancel`, data: { orderId, reason } },
];

const runApiAttempts = async (attempts, config) => {
  let lastError = null;
  for (const attempt of attempts) {
    try {
      const response = await axios.request({
        method: attempt.method,
        url: attempt.url,
        data: attempt.data,
        headers: config?.headers,
      });
      return { ok: true, response };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (![400, 404, 405, 409, 422].includes(status)) break;
    }
  }
  return { ok: false, error: lastError };
};

// Tắt toàn bộ ticket types của một event (gọi sau khi event bị hủy/xóa)
const disableEventTickets = async (eventId, accessToken) => {
  if (!eventId) return;
  try {
    const config = { headers: { Authorization: `Bearer ${accessToken}` } };
    const tcRes = await axios.get(`${API_URL}/api/admin/ticket-types/`, config);
    const allTickets = Array.isArray(tcRes.data?.data) ? tcRes.data.data : tcRes.data || [];
    const eventTickets = allTickets.filter(t => {
      const tid = t?.event?._id || t?.event;
      return String(tid) === String(eventId) && t.isActive !== false;
    });
    if (eventTickets.length === 0) return;
    await Promise.allSettled(
      eventTickets.map(t =>
        axios.put(`${API_URL}/api/admin/ticket-types/${t._id}`, { isActive: false }, config)
      )
    );
  } catch {
    // Không làm crash flow chính nếu lỗi disable ticket
  }
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
  const [ticketRows, setTicketRows] = useState([emptyTicketRow()]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [eventOrderStats, setEventOrderStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileRef = useRef();
  const { accessToken } = useAuthStore();

  const fetchEvents = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const [eventRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/events/`, config),
        axios.get(`${API_URL}/api/orders`, config).catch(() => ({ data: [] })),
      ]);

      const allEvents = Array.isArray(eventRes.data?.data) ? eventRes.data.data : (eventRes.data || []);
      const allOrders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : (ordersRes.data || []);

      setEvents(Array.isArray(allEvents) ? allEvents : []);
      setEventOrderStats(getEventOrderStats(allOrders));
      setCurrentPage(1);
    } catch {
      toast.error('Lỗi khi tải dữ liệu sự kiện');
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 5MB).'); return; }
    setForm(f => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const closeRefundModal = () => {
    if (refundLoading) return;
    setRefundTarget(null);
    setRefundReason('');
  };

  const openRefundModal = (eventIndex, fromDateChange = false) => {
    const event = events[eventIndex];
    if (!event) return;
    const soldCount = getSoldTicketsCount(event, eventOrderStats);
    setRefundTarget({ eventIndex, fromDateChange, soldCount });
    setRefundReason(`Huỷ sự kiện để hoàn tiền tự động cho các vé đã bán. Lý do: đổi lịch / vận hành.`);
  };

  const handleCancelAndRefund = async () => {
    if (!refundTarget) return;
    const event = events[refundTarget.eventIndex];
    const eventId = getEntityId(event?._id || event?.id);
    if (!event || !eventId) {
      toast.error('Không tìm thấy sự kiện cần xử lý');
      return;
    }

    const reason = (refundReason || '').trim() || 'event_cancelled_by_admin';
    const config = { headers: { Authorization: `Bearer ${accessToken}` } };

    try {
      setRefundLoading(true);
      let refundedCount = 0;
      let impactedOrders = 0;
      let usedDirectEndpoint = false;

      const directResult = await runApiAttempts(createEventCancelAttempts(eventId, reason), config);
      if (directResult.ok) {
        usedDirectEndpoint = true;
        const payload = directResult.response?.data?.data || directResult.response?.data || {};
        refundedCount = Number(payload.refundedOrders || payload.refundedCount || payload.refunds || 0);
        impactedOrders = Number(payload.impactedOrders || payload.ordersAffected || payload.totalOrders || refundedCount || 0);
      } else {
        await runApiAttempts(createEventStatusAttempts(eventId, reason), config);
      }

      if (!usedDirectEndpoint) {
        const ordersRes = await axios.get(`${API_URL}/api/orders`, config).catch(() => ({ data: [] }));
        const allOrders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : (ordersRes.data || []);
        const targetOrders = (Array.isArray(allOrders) ? allOrders : []).filter((order) => {
          const orderEventId = getEntityId(order?.event?._id || order?.event);
          return orderEventId === eventId && !isCancelledOrRefundedStatus(order?.status);
        });

        impactedOrders = targetOrders.length;
        for (const order of targetOrders) {
          const orderId = getEntityId(order?._id || order?.id || order?.orderId);
          if (!orderId) continue;
          const refundResult = await runApiAttempts(createOrderRefundAttempts(orderId, reason), config);
          if (refundResult.ok) refundedCount += 1;
        }
      }

      // ✅ Tự động tắt toàn bộ ticket types của event vừa bị hủy
      await disableEventTickets(eventId, accessToken);

      await fetchEvents();
      closeRefundModal();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);

      if (impactedOrders === 0) {
        toast.success('Đã hủy sự kiện và tắt toàn bộ vé. Không có đơn cần hoàn tiền.');
        return;
      }
      if (refundedCount >= impactedOrders) {
        toast.success(`Đã hủy sự kiện, tắt toàn bộ vé và hoàn tiền thành công ${refundedCount}/${impactedOrders} đơn.`);
        return;
      }
      if (refundedCount > 0) {
        toast.error(`Đã hủy sự kiện nhưng mới hoàn tiền ${refundedCount}/${impactedOrders} đơn. Cần xử lý phần còn lại.`);
        return;
      }
      toast.error('Đã hủy sự kiện nhưng chưa hoàn tiền tự động. Vui lòng kiểm tra backend refund.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi hủy sự kiện và hoàn tiền'));
    } finally {
      setRefundLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.date || !form.location?.trim()) {
      toast.error('Vui lòng điền đầy đủ: tên, ngày, địa điểm'); return;
    }
    if (editing === null && form.date < todayStr()) {
      toast.error('Ngày tổ chức không thể là ngày trong quá khứ'); return;
    }
    if (form.endDate && form.endDate < form.date) {
      toast.error('Ngày kết thúc không thể trước ngày bắt đầu'); return;
    }

    if (editing !== null) {
      const existing = events[editing];
      const existingStart = existing?.startDate ? new Date(existing.startDate).getTime() : null;
      const existingEnd = existing?.endDate ? new Date(existing.endDate).getTime() : null;
      const nextStartIso = toLocalISO(form.date, form.time || '19:00');
      const nextEndIso = toLocalISO(form.endDate || form.date, form.endTime || '23:59');
      const nextStart = nextStartIso ? new Date(nextStartIso).getTime() : null;
      const nextEnd = nextEndIso ? new Date(nextEndIso).getTime() : null;
      const hasDateChanged = existingStart !== nextStart || existingEnd !== nextEnd;
      const soldCount = getSoldTicketsCount(existing, eventOrderStats);

      if (hasDateChanged && soldCount > 0) {
        openRefundModal(editing, true);
        toast.error(`Sự kiện đã có ${soldCount} vé bán. Cần huỷ + hoàn tiền thay vì đổi ngày trực tiếp.`);
        return;
      }
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const startDateTime = toLocalISO(form.date, form.time || '19:00');
      const endDateTime = toLocalISO(form.endDate || form.date, form.endTime || '23:59');

      const basePayload = {
        title: form.title,
        description: form.description || '',
        location: form.location,
        category: form.category || '',
        date: form.date,
        time: form.time || '19:00',
        endTime: form.endTime || '21:00',
        startDate: startDateTime,
        endDate: endDateTime,
      };

      if (editing !== null) {
        const newEnd = new Date(`${form.endDate || form.date}T${form.endTime || '23:59'}`);
        if (newEnd > new Date()) basePayload.status = 'active';
      }

      const hasImageUpload = !!form.imageFile;
      const requestData = hasImageUpload ? new FormData() : basePayload;
      if (hasImageUpload) {
        Object.entries(basePayload).forEach(([key, value]) => {
          requestData.append(key, value);
        });
        requestData.append('image', form.imageFile);
      }

      const requestConfig = hasImageUpload
        ? { headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } }
        : config;

      if (editing !== null) {
        const eventId = events[editing]._id;
        await axios.put(`${API_URL}/api/admin/events/${eventId}`, requestData, requestConfig);
        toast.success('Cập nhật sự kiện thành công!');
      } else {
        const eventRes = await axios.post(`${API_URL}/api/admin/events/`, requestData, requestConfig);
        const newEventId = eventRes.data?.data?._id || eventRes.data?._id;

        const validTickets = ticketRows.filter(r => r.name.trim() && Number(r.price) >= 0 && Number(r.quantity) > 0);
        if (newEventId && validTickets.length > 0) {
          const ticketResults = await Promise.allSettled(
            validTickets.map(r =>
              axios.post(`${API_URL}/api/admin/ticket-types/`, {
                event: newEventId,
                name: r.name.trim(),
                price: Number(r.price),
                quantity: Number(r.quantity),
                remaining: Number(r.quantity),
                description: r.description,
                isActive: r.isActive,
              }, config)
            )
          );
          const failed = ticketResults.filter(r => r.status === 'rejected').length;
          if (failed === 0) {
            toast.success(`Tạo sự kiện và ${validTickets.length} loại vé thành công!`);
          } else {
            toast.success(`Tạo sự kiện thành công! (${validTickets.length - failed}/${validTickets.length} loại vé được tạo)`);
          }
        } else {
          toast.success('Tạo sự kiện thành công!');
        }
        setTicketRows([emptyTicketRow()]);
      }
      fetchEvents();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      console.error('CREATE/UPDATE EVENT ERROR:', error?.response?.data || error);
      toast.error(getApiErrorMessage(error, 'Có lỗi xảy ra khi lưu sự kiện'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (i) => {
    setEditing(i);
    const ev = events[i];

    let dateStr = '', timeStr = '19:00';
    if (ev.startDate) {
      const d = new Date(ev.startDate);
      if (!isNaN(d.getTime())) {
        dateStr = toLocalDateStr(d);
        timeStr = toLocalTimeStr(d);
      }
    }

    let endDateStr = '', endTimeStr = '21:00';
    if (ev.endDate) {
      const ed = new Date(ev.endDate);
      if (!isNaN(ed.getTime())) {
        endDateStr = toLocalDateStr(ed);
        endTimeStr = toLocalTimeStr(ed);
      }
    }

    setForm({
      title: ev.title || '', description: ev.description || '',
      location: ev.location || '', category: ev.category || '',
      date: dateStr, time: timeStr,
      endDate: endDateStr, endTime: endTimeStr,
      imageFile: null,
      imagePreview: ev.image ? (ev.image.startsWith('http') ? ev.image : `${API_URL}${ev.image}`) : '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (i) => {
    const soldCount = getSoldTicketsCount(events[i], eventOrderStats);
    if (soldCount > 0) {
      setDeleteConfirm(null);
      openRefundModal(i, false);
      toast.error(`Sự kiện đã có ${soldCount} vé bán. Không thể xóa trực tiếp, hãy dùng "Hủy + hoàn tiền".`);
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const eventId = events[i]._id;

      // ✅ Tắt toàn bộ ticket types trước khi xóa event
      await disableEventTickets(eventId, accessToken);

      await axios.delete(`${API_URL}/api/admin/events/${eventId}`, config);
      toast.success('Đã xóa sự kiện và tắt toàn bộ vé liên quan');
      fetchEvents();
      setDeleteConfirm(null);
    } catch {
      toast.error('Lỗi khi xóa sự kiện');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setTicketRows([emptyTicketRow()]);
    setRefundTarget(null);
    setRefundReason('');
  };

  const filtered = events.filter(e => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchLocation = locationFilter === '' || e.location?.toLowerCase().includes(locationFilter.toLowerCase());
    let matchDate = true;
    if (dateFilter !== 'all') {
      if (!e.startDate) { matchDate = false; } else {
        const eventDate = new Date(e.startDate);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (dateFilter === 'today') {
          const todayEnd = new Date(now); todayEnd.setDate(todayEnd.getDate() + 1);
          matchDate = eventDate >= now && eventDate < todayEnd;
        } else if (dateFilter === 'thisWeek') {
          const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
          matchDate = eventDate >= now && eventDate <= weekEnd;
        } else if (dateFilter === 'thisMonth') {
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          matchDate = eventDate >= now && eventDate <= monthEnd;
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
          matchDate = eventDate >= start && eventDate <= end;
        }
      }
    }
    return matchSearch && matchCategory && matchStatus && matchLocation && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all';

  const now = new Date();
  const endedCount = events.filter(e =>
    e.status === 'ended' || e.status === 'cancelled' || e.status === 'refunded' ||
    (e.endDate ? new Date(e.endDate) < now : e.startDate && (() => { const d = new Date(e.startDate); d.setHours(23, 59, 59, 999); return d < now; })())
  ).length;
  const activeCount = events.length - endedCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản lý sự kiện</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {events.length} sự kiện · <span className="text-emerald-600 font-semibold">{activeCount} đang mở</span>
            {endedCount > 0 && <> · <span className="text-gray-400">{endedCount} đã kết thúc</span></>}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-md">
          <Plus className="w-4 h-4" /> Tạo sự kiện
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên sự kiện..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]">
            <option value="all">Tất cả danh mục</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]">
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all min-w-[160px]">
            {dateFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {dateFilter === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all" />
              <span className="text-gray-500">đến</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-all" />
            </div>
          )}
          <div className="relative flex-1 min-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Lọc theo địa điểm..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all" />
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
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ảnh sự kiện</label>
              <div onClick={() => !loading && fileRef.current?.click()}
                className={`relative h-48 border-2 border-dashed rounded-xl overflow-hidden transition-all group bg-gray-50 cursor-pointer hover:border-orange-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {form.imagePreview ? (
                  <>
                    <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
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
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên sự kiện <span className="text-red-400">*</span></label>
              <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nhập tên sự kiện..." className={inputCls} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả sự kiện..." rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white resize-none transition-all" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ngày bắt đầu <span className="text-red-400">*</span></label>
              <input required type="date" value={form.date}
                min={editing === null ? todayStr() : undefined}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Giờ bắt đầu</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ngày kết thúc</label>
              <input type="date" value={form.endDate} min={form.date || todayStr()}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Giờ kết thúc</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Địa điểm <span className="text-red-400">*</span></label>
              <input required type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Địa điểm tổ chức..." className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all">
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {editing === null && (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-orange-400" /> Loại vé
                  </label>
                  <button type="button"
                    onClick={() => setTicketRows(r => [...r, emptyTicketRow()])}
                    className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Thêm loại vé
                  </button>
                </div>
                <div className="space-y-3">
                  {ticketRows.map((row, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500">Loại vé #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => setTicketRows(r => r.map((x, i) => i === idx ? { ...x, isActive: !x.isActive } : x))}
                            className="flex items-center gap-1">
                            {row.isActive
                              ? <><ToggleRight className="w-4 h-4 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Đang bán</span></>
                              : <><ToggleLeft className="w-4 h-4 text-gray-300" /><span className="text-[10px] text-gray-400">Tắt</span></>}
                          </button>
                          {ticketRows.length > 1 && (
                            <button type="button"
                              onClick={() => setTicketRows(r => r.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tên loại vé *</label>
                          <input type="text" value={row.name} placeholder="VIP, Standard..." required={idx === 0}
                            onChange={e => setTicketRows(r => r.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                            className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giá (VNĐ) *</label>
                            <input type="number" min="0" value={row.price} placeholder="500000" required={idx === 0}
                              onChange={e => setTicketRows(r => r.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Số lượng *</label>
                            <input type="number" min="1" value={row.quantity} placeholder="100" required={idx === 0}
                              onChange={e => setTicketRows(r => r.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))}
                              className={inputCls} />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mô tả quyền lợi</label>
                          <input type="text" value={row.description} placeholder="Bao gồm meet &amp; greet, chỗ ngồi VIP..."
                            onChange={e => setTicketRows(r => r.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                            className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">💡 Bạn có thể thêm/sửa loại vé sau trong tab "Quản lý vé"</p>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={closeForm} disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                <Save className="w-4 h-4" />
                {loading ? 'Đang lưu...' : editing !== null ? 'Cập nhật' : 'Tạo sự kiện'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Event list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{events.length === 0 ? 'Chưa có sự kiện nào. Tạo sự kiện đầu tiên!' : 'Không tìm thấy sự kiện phù hợp.'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedEvents.map((event, i) => {
              const globalIndex = startIndex + i;
              const soldTicketsCount = getSoldTicketsCount(event, eventOrderStats);
              const isEnded = event.status === 'ended' || event.status === 'cancelled' || event.status === 'refunded' ||
                (event.endDate
                  ? new Date(event.endDate) < new Date()
                  : event.startDate && (() => {
                    const e = new Date(event.startDate);
                    e.setHours(23, 59, 59, 999);
                    return e < new Date();
                  })()
                );

              const effectiveStatus = isEnded && event.status === 'active' ? 'ended' : event.status;
              const badge = getStatusBadge(effectiveStatus);
              const canCancelAndRefund = soldTicketsCount > 0 && !isCancelledOrRefundedStatus(event.status) && event.status !== 'ended';

              const d = new Date(event.startDate);
              const displayDate = d.toLocaleDateString('vi-VN');
              const displayTime = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const endD = event.endDate ? new Date(event.endDate) : null;
              const displayEndDate = endD ? endD.toLocaleDateString('vi-VN') : null;
              const displayEndTime = endD ? endD.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
              const imageUrl = event.image ? (event.image.startsWith('http') ? event.image : `${API_URL}${event.image}`) : null;

              return (
                <div key={event._id}
                  className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all group ${isEnded ? 'opacity-60' : 'hover:border-orange-300'
                    }`}>
                  <div className="relative h-36 bg-gray-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={event.title}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isEnded ? 'grayscale' : ''}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                    <div className="space-y-1 mb-4">
                      {soldTicketsCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                          <AlertTriangle className="h-3 w-3" />
                          Đã bán {soldTicketsCount} vé
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>Bắt đầu: {displayDate} · {displayTime}</span>
                      </div>
                      {displayEndDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 text-green-400" />
                          <span>Kết thúc: {displayEndDate} · {displayEndTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(globalIndex)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                        <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                      {canCancelAndRefund ? (
                        <button onClick={() => openRefundModal(globalIndex, false)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-red-50 hover:bg-red-100 text-red-600">
                          <RefreshCw className="w-3 h-3" />
                          Hủy + hoàn tiền
                        </button>
                      ) : (
                        <button onClick={() => setDeleteConfirm(globalIndex)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${isEnded
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                              : 'bg-red-50 hover:bg-red-100 text-red-600'
                            }`}>
                          <Trash2 className="w-3 h-3" />
                          {isEnded ? 'Dọn dẹp' : 'Xóa'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
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
        </>
      )}

      {/* Cancel + Refund confirm */}
      {refundTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Hủy sự kiện và hoàn tiền</h3>
            <p className="text-xs text-gray-500 mb-4">
              Sự kiện{' '}
              <span className="font-semibold text-gray-800">
                "{events[refundTarget.eventIndex]?.title}"
              </span>{' '}
              đã có{' '}
              <span className="font-semibold text-red-600">
                {refundTarget.soldCount || 0} vé
              </span>{' '}
              được bán. Hệ thống sẽ hủy sự kiện, <span className="font-semibold text-orange-600">tắt toàn bộ vé</span> và cố gắng hoàn tiền tự động cho các đơn liên quan.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Lý do hủy / hoàn tiền
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: thay đổi lịch đột xuất, vấn đề vận hành..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white resize-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeRefundModal}
                disabled={refundLoading}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={handleCancelAndRefund}
                disabled={refundLoading}
                className="flex-1 py-2 text-white rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refundLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hủy + hoàn tiền'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              {(() => {
                const ev = events[deleteConfirm];
                const expired = ev && ((ev.status === 'ended' || ev.status === 'cancelled' || ev.status === 'refunded') || (ev.endDate ? new Date(ev.endDate) < new Date() : false));
                return expired ? 'Xác nhận dọn dẹp' : 'Xác nhận xóa';
              })()}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              {(() => {
                const ev = events[deleteConfirm];
                const expired = ev && ((ev.status === 'ended' || ev.status === 'cancelled' || ev.status === 'refunded') || (ev.endDate ? new Date(ev.endDate) < new Date() : false));
                return expired
                  ? <span>Sự kiện <span className="text-gray-900 font-semibold">"{ev?.title}"</span> đã kết thúc. Toàn bộ vé liên quan sẽ được tắt trước khi xóa.</span>
                  : <span>Bạn có chắc muốn xóa sự kiện <span className="text-gray-900 font-semibold">"{ev?.title}"</span>? Toàn bộ vé liên quan sẽ bị tắt.</span>;
              })()}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className={`flex-1 py-2 text-white rounded-xl text-sm font-semibold transition-colors ${(() => {
                    const ev = events[deleteConfirm];
                    return ev && ((ev.status === 'ended' || ev.status === 'cancelled' || ev.status === 'refunded') || (ev.endDate ? new Date(ev.endDate) < new Date() : false))
                      ? 'bg-gray-500 hover:bg-gray-600'
                      : 'bg-red-500 hover:bg-red-600';
                  })()
                  }`}>
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
