// src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-white">
      <Outlet /> {/* Render các trang con như Login, Register */}
    </div>
  );
};

export default AuthLayout;