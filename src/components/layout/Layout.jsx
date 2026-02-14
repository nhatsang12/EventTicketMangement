import { Outlet } from 'react-router-dom';
import Navbar from '../layout/Navbar.jsx';
import Footer from '../layout/Footer.jsx';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col font-body bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <Navbar />
      <main className="flex-grow pt-4 md:pt-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;