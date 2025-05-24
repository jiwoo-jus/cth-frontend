// src/api/index.js
import axios from 'axios';

// Ensure BASE_URL defaults to HTTPS if it's missing or starts with HTTP
const BASE_URL = (() => {
  const url = process.env.REACT_APP_API_URL;
  if (!url || url.startsWith('http://')) {
    return 'https://cth-backend-103266204202.us-central1.run.app';
  }
  return url;
})();

console.log('API Base URL:', BASE_URL); // 확인용 로그

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;
