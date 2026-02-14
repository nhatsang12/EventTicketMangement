import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Ticket, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-gray-900 text-white font-body overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600" />

      <div className="relative z-10 container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">

          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-purple-600 rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-lg">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                TicketHub
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nền tảng đặt vé sự kiện trực tuyến hàng đầu Việt Nam. Khám phá và sở hữu vé cho những khoảnh khắc đáng nhớ.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href}
                  className="w-9 h-9 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
              Liên kết nhanh
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Trang chủ' },
                { to: '/events', label: 'Sự kiện' },
                { to: '/my-tickets', label: 'Vé của tôi' },
                { to: '/ticket-history', label: 'Lịch sử vé' },
                { to: '/create-event', label: 'Tạo sự kiện' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}
                    className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-orange-400 transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
              Hỗ trợ
            </h3>
            <ul className="space-y-3">
              {[
                'Trung tâm trợ giúp',
                'Điều khoản sử dụng',
                'Chính sách bảo mật',
                'Chính sách hoàn tiền',
              ].map((label) => (
                <li key={label}>
                  <a href="#"
                    className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-purple-400 transition-colors" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
              Liên hệ
            </h3>
            <ul className="space-y-4">
              {[
                { Icon: MapPin, text: '123 Đường ABC, Quận 1, TP.HCM' },
                { Icon: Phone, text: '1900 1234' },
                { Icon: Mail, text: 'support@tickethub.vn' },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gradient-to-r group-hover:from-orange-500/20 group-hover:to-purple-500/20 group-hover:border-orange-400/30 transition-all">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <span className="text-sm text-gray-400 leading-relaxed pt-1">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} TicketHub. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-current" /> in Ho Chi Minh City
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;