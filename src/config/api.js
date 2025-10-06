const DEFAULT_BASE_URL = 'https://kau-capstone.duckdns.org';
// 기본값을 빈 문자열로 두어 동일 출처의 프록시(예: Vercel rewrite)를 통해
// IPFS 노드 서버에 접근하도록 한다. 필요 시 환경변수로 직접 노드 주소를 주입.
const DEFAULT_IPFS_BASE_URL = '';

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
