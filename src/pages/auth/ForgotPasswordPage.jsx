import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';

import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success(t('auth.resetEmailSent'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 font-body">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600"
          alt="Background"
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">
            {t('auth.forgotPassword')}
          </h1>
          <h2 className="text-4xl font-bold text-gray-600">
            {t('auth.resetPassword')}
          </h2>
        </div>

        {!sent ? (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('auth.email')}
                className="w-full pl-10 px-3 py-3 text-sm border border-gray-300 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-semibold text-white
                         bg-orange-600 hover:bg-orange-600
                         disabled:opacity-50 rounded-md"
            >
              {loading ? t('common.loading') : t('common.next')}
            </button>
          </form>
        ) : (
          /* Success */
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t('auth.resetEmailSent')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('auth.checkEmail')}<br />
              <strong>{email}</strong>
            </p>

            <Link
              to="/login"
              className="w-full block py-3 text-lg font-semibold text-white
                         bg-orange-600 hover:bg-orange-600
                         rounded-md"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        )}

        {/* Back */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-orange-600 hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('auth.signIn')}
          </Link>
        </div>
        
        {/* Back */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-orange-600 hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
