import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Bell, ChevronDown, RefreshCw, User, Wallet, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, useNotifications } from '@/contexts';
import { resolveApiUrl } from '@/config/api';
import { phantomWallet } from '@/utils/phantomWallet';
import { SearchOverlay } from '../search/SearchOverlay';

export const Header = ({ onWalletConnect }) => {
  const { user, updateUser, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [searchValue, setSearchValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStatusDetail, setShowStatusDetail] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: {
      state: 'loading',
      latency: null,
      message: '확인 중',
      checkedAt: null,
      statusCode: null,
      raw: null
    },
    blockchain: {
      state: 'loading',
      latency: null,
      message: '확인 중',
      checkedAt: null,
      statusCode: null,
      raw: null
    }
  });

  const backendHealthUrl = useMemo(() => resolveApiUrl('/health'), []);
  const blockchainHealthUrl = '/health/blockchain';

  const formatRelativeTime = useCallback((dateInput) => {
    if (!dateInput) return '방금 전';
    const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return '방금 전';
    }

    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return '방금 전';

    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  }, []);

  const formatCheckedAt = useCallback((timestamp) => {
    if (!timestamp) return '확인 중';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '확인 중';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const interpretHealthState = useCallback((responseOk, payloadText, payloadObject) => {
    let message = '';
    if (payloadObject && typeof payloadObject === 'object') {
      message = payloadObject.message
        || payloadObject.status
        || payloadObject.state
        || payloadObject.health
        || '';
    }

    if (!message && typeof payloadText === 'string' && payloadText.trim().length > 0) {
      message = payloadText.trim();
    }

    if (!message) {
      message = responseOk ? '정상 응답' : '응답 오류';
    }

    let normalized = null;
    if (payloadObject && typeof payloadObject === 'object') {
      const candidate = payloadObject.status ?? payloadObject.state ?? payloadObject.health ?? payloadObject.ok ?? payloadObject.healthy;
      if (typeof candidate === 'string') {
        normalized = candidate.toLowerCase();
      } else if (typeof candidate === 'boolean') {
        normalized = candidate;
      }
    }

    if (normalized === null && typeof message === 'string') {
      normalized = message.toLowerCase();
    }

    let state;
    if (!responseOk) {
      state = 'error';
    } else if (typeof normalized === 'boolean') {
      state = normalized ? 'healthy' : 'error';
    } else if (typeof normalized === 'string') {
      if (['ok', 'healthy', 'up', 'pass', 'success', 'ready'].some((token) => normalized.includes(token))) {
        state = 'healthy';
      } else if (['warn', 'warning', 'degraded', 'slow'].some((token) => normalized.includes(token))) {
        state = 'degraded';
      } else if (['down', 'fail', 'error', 'critical'].some((token) => normalized.includes(token))) {
        state = 'error';
      } else {
        state = 'healthy';
      }
    } else {
      state = 'healthy';
    }

    return { state, message };
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    setIsFetchingStatus(true);
    const endpoints = [
      { key: 'backend', url: backendHealthUrl },
      { key: 'blockchain', url: blockchainHealthUrl },
    ];

    try {
      await Promise.all(endpoints.map(async ({ key, url }) => {
        const start = performance.now();

        try {
          // ⚡ 블록체인 노드는 CORS 이슈 대비 이중 시도
          let response, text = '', payloadObject = null;

          if (key === 'blockchain') {
            try {
              // 정상 fetch 시도
              response = await fetch(url, { method: 'GET', cache: 'no-store' });
              text = await response.text();
            } catch (corsErr) {
              // CORS 에러일 경우 no-cors 모드로 재시도
              console.warn('[Blockchain health] CORS 차단 감지, no-cors 모드로 재시도');
              response = await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
              // 이 모드에서는 body 읽기 불가, 대신 상태만 기록
              text = '';
            }
          } else {
            // 일반 백엔드 체크
            response = await fetch(url, { method: 'GET', cache: 'no-store' });
            text = await response.text();
          }

          const latency = Math.round(performance.now() - start);
          if (text) {
            try {
              payloadObject = JSON.parse(text);
            } catch {
              payloadObject = null;
            }
          }

          const { state, message } = interpretHealthState(response.ok, text, payloadObject);

          setSystemStatus((prev) => ({
            ...prev,
            [key]: {
              state: state ?? 'error',
              latency,
              message: message || '응답 없음',
              checkedAt: Date.now(),
              statusCode: response.status ?? null,
              raw: payloadObject ?? text ?? null,
            },
          }));
        } catch (error) {
          const latency = Math.round(performance.now() - start);
          setSystemStatus((prev) => ({
            ...prev,
            [key]: {
              state: 'error',
              latency,
              message: key === 'blockchain'
                ? '블록체인 노드 연결 실패 (CORS 또는 SSL 문제 가능)'
                : error.message || '연결 실패',
              checkedAt: Date.now(),
              statusCode: null,
              raw: null,
            },
          }));
        }
      }));
    } finally {
      setIsFetchingStatus(false);
    }
  }, [backendHealthUrl, blockchainHealthUrl, interpretHealthState]);

  useEffect(() => {
    fetchSystemStatus();
    const intervalId = setInterval(fetchSystemStatus, 60000);
    return () => clearInterval(intervalId);
  }, [fetchSystemStatus]);

  useEffect(() => {
    if (showStatusDetail) {
      fetchSystemStatus();
    }
  }, [showStatusDetail, fetchSystemStatus]);

  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
  }, [showNotifications, unreadCount, markAllAsRead]);

  const overallStatus = useMemo(() => {
    const states = Object.values(systemStatus).map((item) => item.state);
    if (states.some((state) => state === 'error')) return 'error';
    if (states.some((state) => state === 'degraded')) return 'degraded';
    if (states.some((state) => state === 'loading')) return 'loading';
    return 'healthy';
  }, [systemStatus]);

  const badgeState = isFetchingStatus ? 'loading' : overallStatus;

  const badgeConfig = {
    healthy: { label: '정상', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
    degraded: { label: '주의', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    error: { label: '장애', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
    loading: { label: '확인중', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  };

  const stateStyles = {
    healthy: { dot: 'bg-green-500', text: 'text-green-700' },
    degraded: { dot: 'bg-yellow-500', text: 'text-yellow-700' },
    error: { dot: 'bg-red-500', text: 'text-red-700' },
    loading: { dot: 'bg-gray-400', text: 'text-gray-600' },
  };

  const stateLabels = {
    healthy: '정상',
    degraded: '주의',
    error: '오류',
    loading: '확인중',
  };

  const notificationTypeLabels = {
    model: '모델',
    payment: '결제',
    system: '시스템',
    info: '일반'
  };

  const notificationLevelClasses = {
    success: 'bg-green-100 text-green-800',
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  const badge = badgeConfig[badgeState] || badgeConfig.loading;
  const statusEntries = useMemo(() => ([
    {
      key: 'backend',
      label: '백엔드 API',
      url: backendHealthUrl,
      ...systemStatus.backend,
    },
    {
      key: 'blockchain',
      label: '블록체인 노드',
      url: blockchainHealthUrl,
      ...systemStatus.blockchain,
    },
  ]), [systemStatus, backendHealthUrl, blockchainHealthUrl]);
  const lastCheckedAt = useMemo(() => {
    const timestamps = statusEntries
      .map((entry) => entry.checkedAt)
      .filter((timestamp) => typeof timestamp === 'number' && !Number.isNaN(timestamp));
    if (timestamps.length === 0) {
      return null;
    }
    return Math.max(...timestamps);
  }, [statusEntries]);
  const hasUnread = unreadCount > 0;

  const shortenUrl = useCallback((url) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '');
  }, []);

  const connectPhantomWallet = async () => {
    if (!phantomWallet.isPhantomInstalled()) {
      alert('팬텀 지갑이 설치되지 않았습니다. https://phantom.app/ 에서 설치해주세요.');
      return;
    }

    try {
      const connection = await phantomWallet.connect();
      const address = connection.publicKey;
      
      updateUser({
        wallet: {
          connected: true,
          address: address,
          network: 'Solana',
          provider: 'Phantom'
        }
      });
    } catch (error) {
      console.error('Phantom wallet connection failed:', error);
      if (error.code === 4001) {
        alert('지갑 연결이 거부되었습니다.');
      } else {
        alert('지갑 연결에 실패했습니다.');
      }
    }
  };

  const handleWalletConnect = () => {
    if (user?.wallet?.connected) {
      // 지갑 연결 해제
      phantomWallet.disconnect();
      updateUser({
        wallet: {
          connected: false,
          address: null,
          network: null,
          provider: null
        }
      });
    } else {
      // 팬텀 지갑 연결 시도
      connectPhantomWallet();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Global Search */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-bold text-gray-900">ModelHub</span>
              </div>
            </Link>

            {/* Global Search - Fixed 480px width */}
            <div className="relative w-[480px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (e.target.value.trim()) {
                    setShowSearch(true);
                  }
                }}
                onFocus={() => {
                  if (searchValue.trim()) {
                    setShowSearch(true);
                  }
                }}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="모델 검색 (자연어·태그 혼합)"
              />
              
              {/* Search Overlay */}
              {showSearch && (
                <SearchOverlay
                  query={searchValue}
                  onClose={() => setShowSearch(false)}
                  onSelect={(item) => {
                    setSearchValue('');
                    setShowSearch(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* Right: Status, Notifications, Wallet, Avatar with 12px spacing */}
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDetail(!showStatusDetail)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${badge.className}`}
              >
                <span className="flex items-center space-x-2">
                  {isFetchingStatus && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>{badge.label}</span>
                </span>
              </button>

              {showStatusDetail && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">시스템 상태</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {lastCheckedAt ? `마지막 확인: ${formatCheckedAt(lastCheckedAt)}` : '마지막 확인: 확인 중'}
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    {statusEntries.map((entry) => {
                      const styles = stateStyles[entry.state] || stateStyles.loading;
                      return (
                        <div key={entry.key} className="rounded-lg border border-gray-100 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex h-2 w-2 rounded-full ${styles.dot}`}></span>
                              <span className="text-sm font-medium text-gray-900">{entry.label}</span>
                            </div>
                            <span className={`text-xs font-medium ${styles.text}`}>
                              {stateLabels[entry.state] || stateLabels.loading}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 break-words">
                            {entry.message}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>응답 시간: {entry.latency != null ? `${entry.latency}ms` : '-'}</span>
                            <span>확인 시각: {formatCheckedAt(entry.checkedAt)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span>HTTP: {entry.statusCode ?? '-'}</span>
                            <span className="truncate max-w-[160px]" title={entry.url}>{shortenUrl(entry.url)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={fetchSystemStatus}
                      className="inline-flex items-center space-x-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      <RefreshCw className={`h-3 w-3 ${isFetchingStatus ? 'animate-spin' : ''}`} />
                      <span>다시 확인</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors"
              >
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {Math.min(unreadCount, 99)}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">알림</h3>
                    <span className="text-xs text-gray-500">{Math.min(notifications.length, 5)}개</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto overflow-x-hidden">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => {
                        const levelClass = notificationLevelClasses[notification.level] || notificationLevelClasses.info;
                        const typeLabel = notificationTypeLabels[notification.type] || '알림';
                        const displayTitle = notification.title || notification.message || '새로운 알림';
                        const displayMessage = notification.title ? notification.message : '';
                        const isUnread = !notification.read;

                        return (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 transition-colors ${isUnread ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50`}
                          >
                            <div className="flex items-start justify-between space-x-2">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${levelClass}`}>
                                    {typeLabel}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{displayTitle}</span>
                                </div>
                                {displayMessage && (
                                  <p className="text-sm text-gray-600">{displayMessage}</p>
                                )}
                                {notification.metadata?.modelName && (
                                  <p className="text-xs text-gray-500">모델: {notification.metadata.modelName}</p>
                                )}
                                {notification.metadata?.amountSol !== undefined && (
                                  <p className="text-xs text-gray-500">결제 금액: {notification.metadata.amountSol} SOL</p>
                                )}
                                {notification.metadata?.txId && (
                                  <p className="text-[11px] text-gray-400 break-all">TX: {notification.metadata.txId}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Connection - Text Button with Icon */}
            <button
              onClick={handleWalletConnect}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                user?.wallet?.connected 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>
                {user?.wallet?.connected 
                  ? `${user.wallet.address?.slice(0, 4)}...${user.wallet.address?.slice(-4)}` 
                  : '지갑 연결'
                }
              </span>
            </button>

            {/* User Avatar */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                    {user?.wallet?.connected && (
                      <p className="text-xs text-purple-600 mt-1">
                        {user.wallet.provider} 연결됨
                      </p>
                    )}
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Overlay Background */}
      {showSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setShowSearch(false)}
        />
      )}
    </header>
  );
};