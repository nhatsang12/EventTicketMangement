import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  QrCode,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Ticket as TicketIcon,
  Users 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Quản lý sự kiện', icon: CalendarDays },
  { to: '/admin/tickets', label: 'Loại vé', icon: Ticket },
  { to: '/admin/checkin', label: 'Check-in', icon: QrCode },
  { to: '/admin/analytics', label: 'Thống kê', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },

];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (to, end) => end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 shadow-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-100">
            <TicketIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">TicketHub</p>
            <p className="text-xs text-orange-500 font-semibold">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const active = isActive(to, end);
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md shadow-orange-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 lg:flex-none">
            <h1 className="text-sm font-bold text-gray-900 ml-2 lg:ml-0">
              {navItems.find(n => isActive(n.to, n.end))?.label || 'Admin'}
            </h1>
          </div>
          <Link to="/"
            className="text-xs text-gray-400 hover:text-orange-500 transition-colors font-medium flex items-center gap-1">
            ← Về trang chủ
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;