import React, { useState } from 'react';
import { Search, Bell, ChevronDown, User, Wallet, Wifi, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { phantomWallet } from '@/utils/phantomWallet';
import { SearchOverlay } from '../search/SearchOverlay';

export const Header = ({ onWalletConnect }) => {
  const { user, updateUser, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStatusDetail, setShowStatusDetail] = useState(false);

  const notifications = [
    { id: 1, type: 'system', message: '새로운 모델이 업데이트되었습니다', time: '30분 전' },
    { id: 2, type: 'payment', message: '결제가 처리되었습니다', time: '1시간 전' },
    { id: 3, type: 'session', message: '새 세션이 생성되었습니다', time: '2시간 전' }
  ];

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
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
              >
                정상
              </button>
              
              {showStatusDetail && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">시스템 상태</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">체인 연결</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">정상</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">게이트웨이</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">정상</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">응답 시간</span>
                      <span className="text-sm text-gray-900">120ms</span>
                    </div>
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
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">알림</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                    ))}
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
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    프로필
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    설정
                  </Link>
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