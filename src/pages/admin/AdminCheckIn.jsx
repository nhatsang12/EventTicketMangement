import { useState, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, Search, Download, Users, Clock, RefreshCw } from 'lucide-react';
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

    // Mark as used
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
          { label: 'Tổng vé', value: total, color: 'text-white', bg: 'from-gray-700 to-gray-800' },
          { label: 'Đã check-in', value: checkedIn, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-700/20' },
          { label: 'Chưa vào', value: total - checkedIn, color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-700/20' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-white/5 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {total > 0 && s.label !== 'Tổng vé' && (
              <p className="text-xs text-gray-600 mt-1">{Math.round((s.value / total) * 100)}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Tiến độ check-in</span>
            <span className="text-xs font-bold text-white">{checkedIn}/{total}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${total > 0 ? (checkedIn / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-orange-400" /> Xác minh vé
          </h3>

          <div className="flex gap-2 mb-4">
            <input type="text" value={scanInput} onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Nhập Ticket ID hoặc quét QR..."
              className="flex-1 px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            <button onClick={handleScan} disabled={scanning}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-purple-700 disabled:opacity-60 transition-all flex items-center gap-1.5">
              {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {scanning ? '' : 'Xác minh'}
            </button>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div className={`rounded-xl p-4 border ${
              scanResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
              scanResult.status === 'used' ? 'bg-yellow-500/10 border-yellow-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.status === 'success'
                  ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${
                    scanResult.status === 'success' ? 'text-emerald-400' :
                    scanResult.status === 'used' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{scanResult.message}</p>
                  {scanResult.ticket && (
                    <div className="mt-2 space-y-1 text-xs text-gray-400">
                      <p>🎫 {scanResult.ticket.ticketType?.name}</p>
                      <p>📍 {scanResult.ticket.eventName}</p>
                      <p>👤 {scanResult.ticket.customerName}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => { setScanResult(null); setScanInput(''); }} className="text-gray-600 hover:text-white">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Recent check-ins */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Check-in gần đây</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allTickets.filter(t => t.status === 'used' && t.checkedInAt).sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt)).slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{t.customerName}</p>
                    <p className="text-xs text-gray-500">{t.ticketType?.name} · {t.eventName}</p>
                  </div>
                  <p className="text-xs text-gray-600 shrink-0">{formatDate(t.checkedInAt)}</p>
                </div>
              ))}
              {allTickets.filter(t => t.status === 'used').length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">Chưa có check-in nào</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendee list */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Danh sách khách
            </h3>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-xl border border-emerald-500/20 transition-colors">
              <Download className="w-3 h-3" /> Xuất CSV
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khách..."
                className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-white/8 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-400/50" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-2 py-2 bg-gray-800 border border-white/8 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-orange-400/50">
              <option value="all">Tất cả</option>
              <option value="checked">Đã vào</option>
              <option value="pending">Chưa vào</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Không có kết quả</p>
              </div>
            ) : filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'used' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{t.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{t.customerEmail}</p>
                  <p className="text-xs text-gray-600 truncate">{t.ticketType?.name} · {t.eventName}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-medium ${t.status === 'used' ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {t.status === 'used' ? '✓ Đã vào' : 'Chờ'}
                  </span>
                  {t.checkedInAt && <p className="text-xs text-gray-600 mt-0.5">{formatDate(t.checkedInAt)}</p>}
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