import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentFail = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-600 mb-6">Giao dịch đã bị hủy hoặc có lỗi xảy ra. Đừng lo, tiền của bạn chưa bị trừ.</p>
        <button 
          onClick={() => navigate('/checkout')}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Thử lại thanh toán
        </button>
      </div>
    </div>
  );
};

export default PaymentFail; // Nhớ dòng này để không bị lỗi export!