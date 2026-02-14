import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn btn-primary btn-lg">
            <Home className="w-5 h-5 mr-2" />
            Về trang chủ
          </Link>
          <Link to="/" className="btn btn-secondary btn-lg">
            <Search className="w-5 h-5 mr-2" />
            Tìm sự kiện
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;