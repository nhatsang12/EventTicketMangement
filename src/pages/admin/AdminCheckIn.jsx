import { useState, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, Search, Download, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCheckIn = () => {
  const [orders, setOrders] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const stored = JSON.parse(localStorage.getItem('ticketHistory') || '[]');
    setOrders(stored);
    const tickets = stored.flatMap(o =>
      (o.tickets || []).map(t => ({
        ...t,
        eventName: o.event?.name || '—',
        eventLocation: o.event?.location || '—',
        customerName: o.customerInfo?.fullName || o.customerInfo?.name || '—',
        customerEmail: o.customerInfo?.email || '—',
        orderId: o.id,
        orderDate: o.createdAt,
      }))
    );
    setAllTickets(tickets);
  };

  const handleScan = async () => {
    if (!scanInput.trim()) { toast.error('Nhập mã vé để xác minh'); return; }
    setScanning(true);
    setScanResult(null);
    await new Promise(r => setTimeout(r, 800));

    const ticket = allTickets.find(t => t.id === scanInput.trim() || t.id.includes(scanInput.trim()));
    if (!ticket) {
      setScanResult({ status: 'invalid', message: 'Không tìm thấy vé này', ticket: null });
      setScanning(false); return;
    }
    if (ticket.status === 'used') {
      setScanResult({ status: 'used', message: 'Vé đã được sử dụng!', ticket });
      setScanning(false); return;
    }

    const updated = JSON.parse(localStorage.getItem('ticketHistory') || '[]').map(o => ({
      ...o,
      tickets: (o.tickets || []).map(t =>
        t.id === ticket.id ? { ...t, status: 'used', checkedInAt: new Date().toISOString() } : t
      )
    }));
    localStorage.setItem('ticketHistory', JSON.stringify(updated));
    setScanResult({ status: 'success', message: 'Check-in thành công!', ticket });
    setScanning(false);
    loadData();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Ticket ID', 'Loại vé', 'Sự kiện', 'Khách hàng', 'Email', 'Trạng thái', 'Check-in lúc'],
      ...allTickets.map(t => [
        t.id, t.ticketType?.name || '—', t.eventName, t.customerName, t.customerEmail,
        t.status === 'used' ? 'Đã check-in' : 'Chưa check-in',
        t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('vi-VN') : '—'
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendees_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Xuất danh sách thành công!');
  };

  const checkedIn = allTickets.filter(t => t.status === 'used').length;
  const total = allTickets.length;

  const filtered = allTickets.filter(t => {
    const matchSearch = t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.eventName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'checked' ? t.status === 'used' : t.status !== 'used');
    return matchSearch && matchStatus;
  });

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng vé', value: total, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: 'Đã check-in', value: checkedIn, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Chưa vào', value: total - checkedIn, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            {total > 0 && s.label !== 'Tổng vé' && (
              <p className="text-xs text-gray-400 mt-1">{Math.round((s.value / total) * 100)}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-medium">Tiến độ check-in</span>
            <span className="text-xs font-bold text-gray-900">{checkedIn}/{total}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${total > 0 ? (checkedIn / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-orange-500" /> Xác minh vé
          </h3>

          <div className="flex gap-2 mb-4">
            <input type="text" value={scanInput} onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Nhập Ticket ID hoặc quét QR..."
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
            <button onClick={handleScan} disabled={scanning}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-purple-700 disabled:opacity-60 transition-all flex items-center gap-1.5 shadow-md">
              {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {scanning ? '' : 'Xác minh'}
            </button>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div className={`rounded-xl p-4 border ${
              scanResult.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
              scanResult.status === 'used' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.status === 'success'
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${
                    scanResult.status === 'success' ? 'text-emerald-700' :
                    scanResult.status === 'used' ? 'text-yellow-700' : 'text-red-700'
                  }`}>{scanResult.message}</p>
                  {scanResult.ticket && (
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p>🎫 {scanResult.ticket.ticketType?.name}</p>
                      <p>📍 {scanResult.ticket.eventName}</p>
                      <p>👤 {scanResult.ticket.customerName}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => { setScanResult(null); setScanInput(''); }} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Recent check-ins */}
          <div className="mt-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Check-in gần đây</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allTickets.filter(t => t.status === 'used' && t.checkedInAt)
                .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))
                .slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.customerName}</p>
                    <p className="text-xs text-gray-400">{t.ticketType?.name} · {t.eventName}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatDate(t.checkedInAt)}</p>
                </div>
              ))}
              {allTickets.filter(t => t.status === 'used').length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có check-in nào</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendee list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Danh sách khách
            </h3>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors">
              <Download className="w-3 h-3" /> Xuất CSV
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khách..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-orange-400">
              <option value="all">Tất cả</option>
              <option value="checked">Đã vào</option>
              <option value="pending">Chưa vào</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Không có kết quả</p>
              </div>
            ) : filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'used' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{t.customerName}</p>
                  <p className="text-xs text-gray-400 truncate">{t.customerEmail}</p>
                  <p className="text-xs text-gray-400 truncate">{t.ticketType?.name} · {t.eventName}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold ${t.status === 'used' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {t.status === 'used' ? '✓ Đã vào' : 'Chờ'}
                  </span>
                  {t.checkedInAt && <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.checkedInAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCheckIn;