const DEFAULT_BASE_URL = 'https://kau-capstone.duckdns.org';
const DEFAULT_IPFS_BASE_URL = 'http://52.79.235.41:3001'; // IPFS 노드 서버 기본값

export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/$/, '');

export const IPFS_BASE_URL = (
  import.meta.env?.VITE_IPFS_BASE_URL || DEFAULT_IPFS_BASE_URL
).replace(/\/$/, ''); // ← 이 줄이 누락돼서 ReferenceError가 발생했던 것임

export const resolveApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const resolveIpfsUrl = (path = '') => {
  if (!path) return IPFS_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${IPFS_BASE_URL}${normalizedPath}`;
};
