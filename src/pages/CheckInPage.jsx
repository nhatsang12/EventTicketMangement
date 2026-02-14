import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CheckCircle, XCircle, Ticket, ArrowLeft, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';

const CheckInPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scanResult, setScanResult] = useState(null); // null | 'success' | 'used' | 'invalid'
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/checkin' } }); return; }
    // Load all tickets from history
    const orders = JSON.parse(localStorage.getItem('ticketHistory') || '[]');
    const allTickets = orders.flatMap((o) =>
      (o.tickets || []).map((t) => ({ ...t, eventName: o.event?.name, eventLocation: o.event?.location, orderId: o.id }))
    );
    setTickets(allTickets);
  }, [isAuthenticated, navigate]);

  const handleSimulateScan = async (ticket) => {
    setScanning(true);
    setScanResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setScanning(false);

    if (ticket.status === 'used') {
      setScanResult('used');
      return;
    }

    // Mark as used in localStorage
    const orders = JSON.parse(localStorage.getItem('ticketHistory') || '[]');
    const updated = orders.map((o) => ({
      ...o,
      tickets: (o.tickets || []).map((t) =>
        t.id === ticket.id ? { ...t, status: 'used', checkedInAt: new Date().toISOString() } : t
      ),
    }));
    localStorage.setItem('ticketHistory', JSON.stringify(updated));

    // Update local state
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: 'used', checkedInAt: new Date().toISOString() } : t));
    setSelectedTicket((prev) => prev ? { ...prev, status: 'used', checkedInAt: new Date().toISOString() } : prev);
    setScanResult('success');
  };

  const resetScan = () => { setScanResult(null); setSelectedTicket(null); };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
          <div className={`mb-6 p-6 rounded-2xl border-2 text-center ${
            scanResult === 'success' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            {scanResult === 'success' ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-xl font-bold text-gren-8e00">Check-in thành công!</p>
                <p className="text-sm text-white mt-1">Chào mừng! Bạn đã vào sự kiện.</p>
                <p className="text-xs text-white mt-2 font-mono">{selectedTicket?.id}</p>
              </>
            ) : scanResult === 'used' ? (
              <>
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-xl font-bold text-red-800">Vé đã được sử dụng!</p>
                <p className="text-sm text-red-600 mt-1">Vé này đã check-in trước đó.</p>
              </>
            ) : null}
            <button onClick={resetScan} className="mt-4 flex items-center gap-2 mx-auto text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
                <button onClick={() => navigate('/')} className="mt-4 text-sm text-orange-600 hover:underline">Đặt vé ngay</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium">Chọn vé để mô phỏng check-in:</p>
                {tickets.map((ticket) => (
                  <div key={ticket.id}
                    onClick={() => !scanning && setSelectedTicket(ticket)}
                    className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedTicket?.id === ticket.id ? 'border-orange-400 shadow-md' : 'border-gray-100 hover:border-gray-200'
                    } ${ticket.status === 'used' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      {/* Mini QR */}
                      <img src={ticket.qrCode} alt="QR" className="w-14 h-14 rounded-lg border border-gray-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{ticket.eventName}</p>
                        <p className="text-xs text-gray-500 truncate">{ticket.ticketType?.name} — {ticket.eventLocation}</p>
                        <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">{ticket.id}</p>
                      </div>
                      <div className="shrink-0">
                        {ticket.status === 'used' ? (
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200">Đã dùng</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">Active</span>
                        )}
                      </div>
                    </div>

                    {/* QR expanded when selected */}
                    {selectedTicket?.id === ticket.id && ticket.status !== 'used' && (
                      <div className="mt-4 pt-4 border-t border-orange-100 flex flex-col items-center">
                        <img src={ticket.qrCode} alt="QR large" className="w-44 h-44 rounded-xl border-2 border-orange-200 shadow-sm mb-4" />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSimulateScan(ticket); }}
                          disabled={scanning}
                          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-bold rounded-full shadow-md transition-all disabled:opacity-60">
                          {scanning ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang quét...</>
                          ) : (
                            <><QrCode className="w-4 h-4" /> Mô phỏng Check-in</>
                          )}
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Nhấn để giả lập quét QR vào sự kiện</p>
                      </div>
                    )}

                    {selectedTicket?.id === ticket.id && ticket.status === 'used' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">Vé này đã được sử dụng lúc {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString('vi-VN') : 'N/A'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;