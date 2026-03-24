import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, Ticket, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* 404 Number with gradient */}
        <div className="relative mb-6">
          <h1 className="text-[180px] md:text-[220px] font-black leading-none bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 bg-clip-text text-transparent select-none">
            404
          </h1>
          {/* Floating ticket icon */}
         
        </div>

        {/* Text content */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {t('notFound.pageNotFound')}
        </h2>
        <p className="text-gray-600 mb-8 text-base md:text-lg max-w-md mx-auto leading-relaxed">
          {t('notFound.pageNotFoundDesc')}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all hover:scale-105 text-base"
          >
            <Home className="w-5 h-5" />
            {t('notFound.backToHome')}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border-2 border-gray-200 hover:border-orange-400 transition-all hover:shadow-md text-base"
          >
            <Search className="w-5 h-5" />
            {t('notFound.findEvent')}
          </Link>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('notFound.goBack')}
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;