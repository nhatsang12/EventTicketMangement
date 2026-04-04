import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const decodeBase64Url = (value = '') => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const safeRedirectPath = (value = '/') => {
  const path = String(value || '').trim();
  if (!path.startsWith('/') || path.startsWith('//')) return '/';
  return path;
};

const SocialAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  const isHandledRef = useRef(false);

  useEffect(() => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;

    const error = searchParams.get('error');
    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
      return;
    }

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const encodedUser = searchParams.get('user');
    const redirect = safeRedirectPath(searchParams.get('redirect') || '/');

    if (!accessToken || !refreshToken || !encodedUser) {
      toast.error(t('auth.socialLoginFailed'));
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeBase64Url(encodedUser));
      setAuth(user, accessToken, refreshToken);
      toast.success(t('auth.socialLoginSuccess'));

      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(t('auth.socialLoginFailed'));
      navigate('/login', { replace: true });
    }
  }, [navigate, searchParams, setAuth, t]);

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060606',
        color: 'white',
        fontFamily: "'Be Vietnam Pro',sans-serif",
      }}
    >
      {t('common.loading')}
    </div>
  );
};

export default SocialAuthCallbackPage;
