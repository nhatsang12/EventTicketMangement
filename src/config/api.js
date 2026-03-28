const PRODUCTION_API_URL = 'https://beservereventticketingplatform.onrender.com';
const LOCAL_API_URL = 'http://localhost:8000';

const isLocalHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Ưu tiên env explicit; nếu chạy local mà chưa set env thì mặc định gọi backend local.
const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? LOCAL_API_URL : PRODUCTION_API_URL);

export default API_URL;
