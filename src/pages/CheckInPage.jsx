import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QrCode, CheckCircle, XCircle, Ticket, ArrowLeft, RefreshCw, Loader2, Clock, AlertTriangle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const CheckInPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const token = useAuthStore(state => state.accessToken || state.token);
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scanResult, setScanResult] = useState(null); 
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:8000/api/orders/my-orders', config);
      const orders = res.data?.data || res.data || [];
      
      const allTickets = orders.flatMap((o) =>
        (o.tickets || []).map((t) => ({ 
          ...t, 
          eventName: o.event?.title || o.event?.name, 
          eventLocation: o.event?.location,
          // ── Lưu ngày sự kiện để validate ──
          eventDate: o.event?.startDate || o.event?.date || null,
          orderId: o._id 
        }))
      );
      
      setTickets(allTickets);
    } catch (error) {
      console.error("Lỗi lấy danh sách vé:", error);
      toast.error("Không thể tải danh sách vé");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { 
      navigate('/login', { state: { from: '/checkin' } }); 
      return; 
    }
    fetchTickets();
  }, [isAuthenticated, navigate, token]);

  const getQRCodeImage = (qrString) => {
    if (!qrString) return '';
    if (qrString.startsWith('http')) return qrString;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;
  };

  const formatDateOnly = (iso) =>
    iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  // ── Kiểm tra ngày sự kiện ────────────────────────────────────────────────
  const getDateStatus = (eventDate) => {
    if (!eventDate) return 'unknown';
    const evDay = new Date(new Date(eventDate).toDateString());
    const today  = new Date(new Date().toDateString());
    if (evDay < today) return 'expired';
    if (evDay > today) return 'upcoming';
    return 'today';
  };

  const handleSimulateScan = async (ticket) => {
    // ── Validate ngày trước khi gọi API ─────────────────────────────────────
    const dateStatus = getDateStatus(ticket.eventDate);

    if (dateStatus === 'expired') {
      setScanResult('date_error');
      setScanMessage(`Sự kiện đã kết thúc ngày ${formatDateOnly(ticket.eventDate)}. Vé không còn hiệu lực.`);
      return;
    }

    if (dateStatus === 'upcoming') {
      setScanResult('date_error');
      setScanMessage(`Sự kiện chưa diễn ra (${formatDateOnly(ticket.eventDate)}). Chỉ được check-in đúng ngày tổ chức.`);
      return;
    }

    setScanning(true);
    setScanResult(null);
    setScanMessage("");

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { qrCode: ticket.qrCode || ticket._id };
      const res = await axios.post('http://localhost:8000/api/admin/ticket-types/checkin', payload, config);
      
      if (res.data.success) {
        setScanResult('success');
        setScanMessage(res.data.message);
        setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, isCheckedIn: true } : t));
        setSelectedTicket(prev => prev ? { ...prev, isCheckedIn: true } : prev);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi quét vé';
      if (errorMessage.includes('ĐÃ ĐƯỢC SỬ DỤNG') || errorMessage.toLowerCase().includes('used')) {
        setScanResult('used');
      } else {
        setScanResult('error');
      }
      setScanMessage(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => { 
    setScanResult(null); 
    setSelectedTicket(null); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Check-in</h1>
            <p className="text-sm text-gray-500">Mô phỏng quét QR vào cổng sự kiện</p>
          </div>
        </div>

        {/* Scan result overlay */}
        {scanResult && (
          <div className={`mb-6 p-6 rounded-2xl border-2 text-center animate-fade-in-up ${
            scanResult === 'success'
              ? 'bg-green-50 border-green-300'
              : scanResult === 'date_error' || scanResult === 'upcoming'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-red-50 border-red-300'
          }`}>
            {scanResult === 'success' ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-xl font-bold text-green-800">Check-in thành công!</p>
                <p className="text-sm text-green-600 mt-1">{scanMessage || "Chào mừng! Bạn đã vào sự kiện."}</p>
                <p className="text-xs text-gray-500 mt-2 font-mono">{selectedTicket?._id}</p>
              </>
            ) : scanResult === 'date_error' ? (
              <>
                {scanMessage.includes('chưa') ? (
                  <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                )}
                <p className="text-xl font-bold text-gray-800">Không thể check-in</p>
                <p className="text-sm text-gray-600 mt-1">{scanMessage}</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-xl font-bold text-red-800">
                  {scanResult === 'used' ? 'Vé đã được sử dụng!' : 'Lỗi xác thực vé!'}
                </p>
                <p className="text-sm text-red-600 mt-1">{scanMessage}</p>
              </>
            )}
            <button onClick={resetScan} className="mt-6 flex items-center justify-center gap-2 mx-auto px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
              <RefreshCw className="w-4 h-4" /> Quét vé khác
            </button>
          </div>
        )}

        {/* Ticket selector */}
        {!scanResult && (
          <>
            {tickets.length === 0 ? (
              <div className="text-center py-16">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Không có vé nào để check-in</p>
                <button onClick={() => navigate('/')} className="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline">Đặt vé ngay</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm inline-block mb-2">
                  👉 Chọn một vé bên dưới để giả lập máy quét mã QR của bảo vệ:
                </p>
                {tickets.map((ticket) => {
                  const dateStatus = getDateStatus(ticket.eventDate);
                  const canCheckIn = !ticket.isCheckedIn && dateStatus === 'today';

                  return (
                    <div key={ticket._id}
                      onClick={() => !scanning && setSelectedTicket(ticket)}
                      className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedTicket?._id === ticket._id ? 'border-orange-400 shadow-md ring-2 ring-orange-100' : 'border-gray-100 hover:border-gray-200'
                      } ${!canCheckIn && !selectedTicket ? 'opacity-70' : ''}`}>
                      <div className="flex items-center gap-4">
                        {/* Mini QR */}
                        <img src={getQRCodeImage(ticket.qrCode || ticket._id)} alt="QR" className="w-14 h-14 rounded-xl border border-gray-200 shrink-0 bg-white p-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{ticket.eventName || 'Sự kiện chưa rõ'}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{ticket.ticketType?.name} — {ticket.eventLocation}</p>
                          {/* Badge ngày sự kiện */}
                          {ticket.eventDate && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 ${
                              dateStatus === 'today'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              dateStatus === 'expired'  ? 'bg-red-50 text-red-600 border-red-200' :
                              dateStatus === 'upcoming' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''
                            }`}>
                              {dateStatus === 'today'    && <><CheckCircle className="w-2.5 h-2.5" /> Hôm nay</>}
                              {dateStatus === 'expired'  && <><XCircle className="w-2.5 h-2.5" /> Đã qua</>}
                              {dateStatus === 'upcoming' && <><Clock className="w-2.5 h-2.5" /> Chưa tới</>}
                              {' · '}{formatDateOnly(ticket.eventDate)}
                            </span>
                          )}
                          <p className="text-xs font-mono text-gray-400 mt-1 truncate" title={ticket._id}>ID: {ticket._id}</p>
                        </div>
                        <div className="shrink-0">
                          {ticket.isCheckedIn ? (
                            <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200">Đã dùng</span>
                          ) : dateStatus === 'expired' ? (
                            <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-500 rounded-full border border-red-200">Hết hạn</span>
                          ) : dateStatus === 'upcoming' ? (
                            <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-600 rounded-full border border-blue-200">Chưa tới</span>
                          ) : (
                            <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200 shadow-sm">Active</span>
                          )}
                        </div>
                      </div>

                      {/* QR expanded when selected — chỉ show nút nếu đúng ngày */}
                      {selectedTicket?._id === ticket._id && !ticket.isCheckedIn && (
                        <div className="mt-4 pt-5 border-t border-orange-100 flex flex-col items-center bg-gradient-to-b from-orange-50/50 to-transparent rounded-b-xl -mx-4 -mb-4 pb-6">
                          <img src={getQRCodeImage(ticket.qrCode || ticket._id)} alt="QR large" className="w-44 h-44 rounded-2xl border-4 border-white shadow-lg mb-5 bg-white p-2" />
                          
                          {/* Cảnh báo nếu không phải hôm nay */}
                          {dateStatus === 'upcoming' && (
                            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-center max-w-xs">
                              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                              <p className="text-xs font-semibold text-blue-700">Sự kiện chưa diễn ra</p>
                              <p className="text-[11px] text-blue-500 mt-0.5">Ngày tổ chức: {formatDateOnly(ticket.eventDate)}</p>
                            </div>
                          )}
                          {dateStatus === 'expired' && (
                            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-center max-w-xs">
                              <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                              <p className="text-xs font-semibold text-red-700">Sự kiện đã kết thúc</p>
                              <p className="text-[11px] text-red-400 mt-0.5">Vé không còn hiệu lực từ {formatDateOnly(ticket.eventDate)}</p>
                            </div>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); handleSimulateScan(ticket); }}
                            disabled={scanning}
                            className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-full shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 ${
                              dateStatus === 'today'
                                ? 'bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:scale-100'
                            }`}>
                            {scanning ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Đang quét hệ thống...</>
                            ) : dateStatus !== 'today' ? (
                              <><XCircle className="w-5 h-5" /> Không thể check-in</>
                            ) : (
                              <><QrCode className="w-5 h-5" /> Bấm để Check-in vé này</>
                            )}
                          </button>
                        </div>
                      )}

                      {selectedTicket?._id === ticket._id && ticket.isCheckedIn && (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                          <p className="text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
                            <XCircle className="w-4 h-4 text-gray-400" /> Vé này đã được sử dụng
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CheckInPage;