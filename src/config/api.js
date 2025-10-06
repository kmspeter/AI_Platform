const DEFAULT_BASE_URL = 'https://kau-capstone.duckdns.org';

export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

export const resolveApiUrl = (path = '') => {
  if (!path) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
