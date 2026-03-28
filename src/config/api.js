const LOCAL_API_URL = 'http://localhost:8000';

const normalizeBaseUrl = (value = '') => String(value).trim().replace(/\/+$/, '');
const ENV_API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

const isLocalHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Quy tắc:
// 1) Nếu có VITE_API_URL -> luôn dùng.
// 2) Nếu chạy local mà không có env -> fallback backend local.
// 3) Mọi môi trường khác bắt buộc phải có VITE_API_URL.
const API_URL = ENV_API_URL || (isLocalHost ? LOCAL_API_URL : '');

if (!API_URL) {
  throw new Error(
    'Missing VITE_API_URL: non-local deployments must define VITE_API_URL (e.g. on Vercel).'
  );
}

export default API_URL;
