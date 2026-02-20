import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QrCode, CheckCircle, XCircle, Search, Download, Users, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const AdminCheckIn = () => {
  const [allTickets, setAllTickets] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const token = useAuthStore((state) => state.accessToken || state.token);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:8000/api/admin/analytics/tickets', config);
      
      const tickets = (res.data?.data?.allTickets || []).map(t => ({
        ...t,
        id: t._id || t.id,
        eventName: t.event?.name || t.event?.title || '—',
        customerName: t.user?.name || t.customerInfo?.fullName || '—',
        customerEmail: t.user?.email || t.customerInfo?.email || '—',
      }));
      setAllTickets(tickets);
    } catch (error) {
      toast.error('Không thể tải danh sách vé!');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);

  const handleScan = async () => {
    const code = scanInput.trim();
    if (!code) {
        toast.error('Nhập mã vé để xác minh');
        return;
    }

    setVerifying(true);
    setScanResult(null);

    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Gửi yêu cầu check-in tới server
        const res = await axios.post(`http://localhost:8000/api/tickets/check-in`, { qrCode: code }, config);

        if (res.data.success) {
            // 1. Cập nhật trạng thái hiển thị kết quả quét
            setScanResult({
                status: 'success',
                message: 'Check-in thành công!',
                ticket: res.data.data
            });

            toast.success('Xác minh thành công!');
            
            // 2. QUAN TRỌNG: Xóa nội dung trong ô nhập để sẵn sàng cho lượt quét tiếp theo
            setScanInput(''); 

            // 3. QUAN TRỌNG: Gọi lại loadData để cập nhật các con số thống kê (Tổng vé, Đã check-in)
            // Việc này giúp cập nhật dữ liệu real-time trên Dashboard mà không cần F5
            await loadData(); 
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi xác minh vé';
        const isUsed = msg.toLowerCase().includes('đã sử dụng') || msg.toLowerCase().includes('used');

        setScanResult({
            status: isUsed ? 'used' : 'invalid',
            message: msg,
            ticket: error.response?.data?.ticket || null
        });
        toast.error(msg);
        
        // Gọi loadData ngay cả khi lỗi (nếu cần thiết) để đảm bảo danh sách đồng bộ
        await loadData();
    } finally {
        setVerifying(false);
    }
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

  const checkedInCount = allTickets.filter(t => t.status === 'used').length;
  const totalCount = allTickets.length;

  const filtered = allTickets.filter(t => {
    const matchSearch = t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'checked' ? t.status === 'used' : t.status !== 'used');
    return matchSearch && matchStatus;
  });

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—';

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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng vé', value: totalCount, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: 'Đã check-in', value: checkedInCount, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Chưa vào', value: totalCount - checkedInCount, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center shadow-sm`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Tiến độ tham gia</span>
          <span className="text-xs font-black text-gray-900">{Math.round((checkedInCount / totalCount) * 100 || 0)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
            style={{ width: `${totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-orange-500" /> Cổng soát vé
          </h3>

          <div className="flex gap-2 mb-4">
            <input type="text" value={scanInput} onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Quét mã QR hoặc nhập ID..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all" />
            <button onClick={handleScan} disabled={verifying}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg shadow-orange-200">
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Xác minh
            </button>
          </div>

          {scanResult && (
            <div className={`rounded-xl p-4 border animate-in fade-in slide-in-from-top-2 ${
              scanResult.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
              scanResult.status === 'used' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.status === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{scanResult.message}</p>
                  {scanResult.ticket && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-medium text-gray-500">
                      <p>🎫 {scanResult.ticket.ticketType?.name || 'Standard'}</p>
                      <p>👤 {scanResult.ticket.user?.name || 'Khách hàng'}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setScanResult(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Vừa vào cổng</p>
            <div className="space-y-2">
              {allTickets.filter(t => t.status === 'used' && t.checkedInAt)
                .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))
                .slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs italic">OK</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{t.customerName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{t.eventName}</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{formatDate(t.checkedInAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Danh sách điểm danh
            </h3>
            <button onClick={handleExportCSV} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, email, ID..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none">
              <option value="all">Tất cả</option>
              <option value="checked">Đã vào</option>
              <option value="pending">Chờ</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[340px] pr-1 scrollbar-thin">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                <div className={`w-1.5 h-8 rounded-full ${t.status === 'used' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{t.customerName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{t.customerEmail}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase ${t.status === 'used' ? 'text-emerald-600' : 'text-gray-300'}`}>
                    {t.status === 'used' ? 'Vào' : 'Chờ'}
                  </span>
                  {t.checkedInAt && <p className="text-[9px] text-gray-400 mt-0.5">{formatDate(t.checkedInAt)}</p>}
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