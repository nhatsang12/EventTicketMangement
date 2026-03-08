import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QrCode, CheckCircle, XCircle, Search, Download, Users, RefreshCw, Loader2, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import API_URL from '../../config/api';

const normalizeTicket = (t) => {
  const isCheckedIn =
    t.status === 'used' ||
    t.status === 'checked' ||
    t.isCheckedIn === true ||
    t.checkedIn === true ||
    !!t.checkedInAt;

  const eventDate    = t.event?.startDate || t.event?.date || t.event?.eventDate || null;
  const eventEndDate = t.event?.endDate || null;

  let dateStatus = 'valid';
  if (eventDate) {
    const now   = new Date();
    const start = new Date(eventDate);
    const end   = eventEndDate
      ? new Date(eventEndDate)
      : (() => { const e = new Date(eventDate); e.setHours(23, 59, 59, 999); return e; })();

    if (now > end) {
      dateStatus = 'expired'; // quá giờ kết thúc
    } else if (now.toDateString() !== start.toDateString() && now < start) {
      dateStatus = 'upcoming'; // khác ngày, chưa tới
    } else {
      dateStatus = 'valid'; // đúng ngày → cho quét dù chưa tới giờ
    }
  }

  return {
    ...t,
    id: t._id || t.id,
    eventName:
      t.event?.title || t.event?.name || t.eventName || t.eventTitle || '—',
    eventDate,
    eventEndDate,
    dateStatus,
    customerName:
      t.user?.name || t.user?.fullName ||
      t.customerInfo?.fullName || t.buyerName || t.holderName || '—',
    customerEmail:
      t.user?.email || t.customerInfo?.email || t.buyerEmail || '—',
    ticketTypeName:
      t.ticketType?.name || t.type?.name || t.typeName || 'Standard',
    isCheckedIn,
    checkedInAt: t.checkedInAt || t.checkInAt || t.usedAt || null,
  };
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
      })
    : '—';

const formatDateOnly = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const DateBadge = ({ dateStatus, eventDate }) => {
  if (!eventDate) return null;
  const cfg = {
    valid:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Hôm nay',   Icon: CheckCircle },
    expired:  { cls: 'bg-red-50 text-red-600 border-red-200',            label: 'Đã qua',    Icon: XCircle },
    upcoming: { cls: 'bg-blue-50 text-blue-600 border-blue-200',         label: 'Chưa tới',  Icon: Clock },
  }[dateStatus] || {};

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-0.5 ${cfg.cls}`}>
      {cfg.Icon && <cfg.Icon className="w-2.5 h-2.5" />}
      {cfg.label} · {formatDateOnly(eventDate)}
    </span>
  );
};

const AdminCheckIn = () => {
  const [allTickets, setAllTickets]     = useState([]);
  const [scanInput, setScanInput]       = useState('');
  const [scanResult, setScanResult]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [verifying, setVerifying]       = useState(false);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate]     = useState('all');

  const token = useAuthStore((state) => state.accessToken || state.token);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/admin/analytics/tickets`, config);
      const raw = res.data?.data?.allTickets || [];
      setAllTickets(raw.map(normalizeTicket));
    } catch {
      toast.error('Không thể tải danh sách vé!');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);

  const validateBeforeScan = (code) => {
    const ticket = allTickets.find(
      (t) => t.qrCode === code || String(t.id) === code
    );

    if (!ticket) return { valid: true };

    if (ticket.isCheckedIn) {
      return { valid: false, reason: 'used', message: 'Vé này đã được sử dụng rồi!' };
    }
    if (ticket.dateStatus === 'upcoming') {
      return {
        valid: false, reason: 'upcoming',
        message: `Sự kiện chưa tới (${formatDateOnly(ticket.eventDate)}). Không thể check-in.`,
      };
    }
    if (ticket.dateStatus === 'expired') {
      return {
        valid: false, reason: 'expired',
        message: `Sự kiện đã kết thúc (${formatDateOnly(ticket.eventDate)}). Không thể check-in.`,
      };
    }
    return { valid: true, ticket };
  };

  const handleScan = async () => {
    const code = scanInput.trim();
    if (!code) { toast.error('Nhập mã vé để xác minh'); return; }

    const check = validateBeforeScan(code);
    if (!check.valid) {
      setScanResult({ status: check.reason, message: check.message, ticket: null });
      toast.error(check.message);
      return;
    }

    setVerifying(true);
    setScanResult(null);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(
        `${API_URL}/api/tickets/check-in`,
        { qrCode: code },
        config
      );

      if (res.data.success) {
        const checkedTicket = normalizeTicket(res.data.data);
        const checkedAt = checkedTicket.checkedInAt || new Date().toISOString();

        setAllTickets((prev) =>
          prev.map((t) =>
            t.id === checkedTicket.id
              ? { ...t, isCheckedIn: true, checkedInAt: checkedAt }
              : t
          )
        );

        setScanResult({ status: 'success', message: 'Check-in thành công!', ticket: checkedTicket });
        toast.success('Xác minh thành công!');
        setScanInput('');
        loadData();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi xác minh vé';
      const isUsed    = msg.toLowerCase().includes('đã sử dụng') || msg.toLowerCase().includes('used');
      const isExpired = msg.toLowerCase().includes('kết thúc') || msg.toLowerCase().includes('expired');

      setScanResult({
        status: isUsed ? 'used' : isExpired ? 'expired' : 'invalid',
        message: msg,
        ticket: error.response?.data?.ticket ? normalizeTicket(error.response.data.ticket) : null,
      });
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Ticket ID', 'Loại vé', 'Sự kiện', 'Ngày SK', 'Khách hàng', 'Email', 'Trạng thái', 'Check-in lúc'],
      ...allTickets.map((t) => [
        t.id, t.ticketTypeName, t.eventName, formatDateOnly(t.eventDate),
        t.customerName, t.customerEmail,
        t.isCheckedIn ? 'Đã check-in' : 'Chưa check-in',
        t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('vi-VN') : '—',
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `attendees_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Xuất danh sách thành công!');
  };

  const checkedInCount = allTickets.filter((t) => t.isCheckedIn).length;
  const totalCount     = allTickets.length;
  const expiredCount   = allTickets.filter((t) => t.dateStatus === 'expired' && !t.isCheckedIn).length;
  const progressPct    = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const filtered = allTickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.customerName.toLowerCase().includes(q) ||
      t.customerEmail.toLowerCase().includes(q) ||
      String(t.id).toLowerCase().includes(q) ||
      t.eventName.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'checked' ? t.isCheckedIn : !t.isCheckedIn);
    const matchDate =
      filterDate === 'all' || t.dateStatus === filterDate;
    return matchSearch && matchStatus && matchDate;
  });

  const scanResultStyle = {
    success:  'bg-emerald-50 border-emerald-200',
    used:     'bg-yellow-50 border-yellow-200',
    expired:  'bg-red-50 border-red-200',
    upcoming: 'bg-blue-50 border-blue-200',
    invalid:  'bg-red-50 border-red-200',
  };

  if (loading && allTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu khách mời...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng vé',     value: totalCount,                                 color: 'text-gray-900',    bg: 'bg-gray-50',    border: 'border-gray-200' },
          { label: 'Đã check-in', value: checkedInCount,                             color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Chờ vào',     value: totalCount - checkedInCount - expiredCount, color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
          { label: 'Vé hết hạn',  value: expiredCount,                               color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center shadow-sm`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Tiến độ tham gia</span>
          <span className="text-xs font-black text-gray-900">{progressPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%` }} />
        </div>
        {expiredCount > 0 && (
          <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {expiredCount} vé không thể check-in do sự kiện đã qua
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cổng soát vé */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-orange-500" /> Cổng soát vé
          </h3>

          <div className="flex gap-2 mb-4">
            <input type="text" value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Quét mã QR hoặc nhập ID..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all" />
            <button onClick={handleScan} disabled={verifying}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg shadow-orange-200">
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Xác minh
            </button>
          </div>

          {scanResult && (
            <div className={`rounded-xl p-4 border ${scanResultStyle[scanResult.status] || 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {scanResult.status === 'success'
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  : scanResult.status === 'upcoming'
                  ? <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{scanResult.message}</p>
                  {scanResult.ticket && (
                    <div className="mt-2 space-y-0.5 text-[10px] font-medium text-gray-500">
                      <p>🎫 {scanResult.ticket.ticketTypeName} · 👤 {scanResult.ticket.customerName}</p>
                      {scanResult.ticket.eventDate && (
                        <p>📅 Ngày sự kiện: {formatDateOnly(scanResult.ticket.eventDate)}</p>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => setScanResult(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Vừa vào cổng</p>
            <div className="space-y-2">
              {allTickets
                .filter((t) => t.isCheckedIn && t.checkedInAt)
                .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))
                .slice(0, 3)
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs">OK</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{t.customerName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{t.eventName}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">{formatDate(t.checkedInAt)}</span>
                  </div>
                ))}
              {allTickets.filter((t) => t.isCheckedIn && t.checkedInAt).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có ai vào cổng</p>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách điểm danh */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Danh sách điểm danh
            </h3>
            <button onClick={handleExportCSV}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, email, sự kiện..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500" />
          </div>

          <div className="flex gap-2 mb-4">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none">
              <option value="all">Tất cả trạng thái</option>
              <option value="checked">Đã vào</option>
              <option value="pending">Chờ vào</option>
            </select>
            <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none">
              <option value="all">Tất cả ngày</option>
              <option value="valid">Hôm nay</option>
              <option value="upcoming">Chưa tới</option>
              <option value="expired">Đã qua</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Không tìm thấy kết quả</p>
            ) : (
              filtered.map((t) => (
                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  t.isCheckedIn               ? 'bg-gray-50 border-transparent hover:border-gray-200' :
                  t.dateStatus === 'expired'  ? 'bg-red-50/50 border-red-100'                        :
                  t.dateStatus === 'upcoming' ? 'bg-blue-50/40 border-blue-100'                      :
                                                'bg-emerald-50/40 border-emerald-100'
                }`}>
                  <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                    t.isCheckedIn               ? 'bg-emerald-500' :
                    t.dateStatus === 'expired'  ? 'bg-red-300'     :
                    t.dateStatus === 'upcoming' ? 'bg-blue-300'    :
                                                  'bg-emerald-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{t.customerName}</p>
                    <p className="text-[10px] text-gray-400 truncate mb-0.5">{t.eventName}</p>
                    <DateBadge dateStatus={t.dateStatus} eventDate={t.eventDate} />
                  </div>
                  <div className="text-right shrink-0">
                    {t.isCheckedIn ? (
                      <>
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Vào</span>
                        {t.checkedInAt && <p className="text-[9px] text-gray-400 mt-0.5">{formatDate(t.checkedInAt)}</p>}
                      </>
                    ) : t.dateStatus === 'expired' ? (
                      <span className="text-[10px] font-black text-red-400 uppercase flex items-center gap-0.5 justify-end">
                        <XCircle className="w-2.5 h-2.5" /> Hết hạn
                      </span>
                    ) : t.dateStatus === 'upcoming' ? (
                      <span className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-0.5 justify-end">
                        <Clock className="w-2.5 h-2.5" /> Chưa tới
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-500 uppercase">Chờ vào</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCheckIn;