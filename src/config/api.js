const DEFAULT_BASE_URL = 'https://kau-capstone.duckdns.org';
const DEFAULT_IPFS_BASE_URL = 'http://52.79.235.41:3001'; // IPFS 노드 서버 기본값

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
