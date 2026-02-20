import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore'; // 👉 BẠN PHẢI THÊM DÒNG NÀY (Đường dẫn có thể thay đổi tùy thư mục của bạn)

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;