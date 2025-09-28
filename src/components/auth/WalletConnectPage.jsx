import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { phantomWallet } from '../../utils/phantomWallet';

export const WalletConnectPage = ({ onComplete, onSkip }) => {
  const { user, updateUser } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [phantomInstalled, setPhantomInstalled] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    // 팬텀 지갑 설치 여부 확인
    const checkPhantomInstalled = () => {
      // 더 안전한 방식으로 Phantom 확인
      const isPhantomInstalled = typeof window !== 'undefined' && 
        window.solana && 
        window.solana.isPhantom &&
        window.solana.connect;
      setPhantomInstalled(isPhantomInstalled);
    };

    // 페이지 로드 후 약간의 지연을 두고 확인 (Phantom이 완전히 로드되기를 기다림)
    setTimeout(checkPhantomInstalled, 500);
    
    // 페이지 포커스 시 다시 확인
    const handleFocus = () => {
      setTimeout(checkPhantomInstalled, 100);
    };
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const connectPhantomWallet = async () => {
    if (!phantomWallet.isPhantomInstalled()) {
      setError('팬텀 지갑이 설치되지 않았습니다.');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const connection = await phantomWallet.connect();
      const address = connection.publicKey;
      
      setWalletAddress(address);
      
      // 사용자 정보 업데이트
      await updateUser({
        wallet: {
          connected: true,
          address: address,
          network: 'Solana',
          provider: 'Phantom'
        }
      });

      // 연결 완료 후 잠시 대기
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err) {
      console.error('Phantom wallet connection error:', err);
      
      // 더 구체적인 에러 처리
      if (err.code === 4001 || err.message?.includes('User rejected')) {
        setError('사용자가 연결을 거부했습니다.');
      } else if (err.code === -32002) {
        setError('팬텀 지갑에서 이미 연결 요청을 처리 중입니다. 팬텀 창을 확인해주세요.');
      } else if (err.message?.includes('wallet not found') || err.message?.includes('not installed')) {
        setError('팬텀 지갑을 찾을 수 없습니다. 설치 후 페이지를 새로고침해주세요.');
      } else if (err.message?.includes('Unexpected error')) {
        setError('팬텀 지갑과 연결할 수 없습니다. 지갑을 잠금 해제하고 다시 시도해주세요.');
      } else {
        setError(`지갑 연결에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
      }
    } finally {
      setConnecting(false);
    }
  };

  const openPhantomDownload = () => {
    window.open('https://phantom.app/', '_blank');
  };

  // Phantom 지갑 상태 재확인
  const recheckPhantom = () => {
    setTimeout(() => {
      const isPhantomInstalled = phantomWallet.isPhantomInstalled();
      setPhantomInstalled(isPhantomInstalled);
      
      if (!isPhantomInstalled) {
        setError('팬텀 지갑이 아직 감지되지 않습니다. 확장 프로그램이 활성화되어 있는지 확인해주세요.');
      } else {
        setError('');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">지갑 연결</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            안녕하세요, {user?.name}님!
          </h2>
          <p className="text-gray-600">
            AI 모델을 구매하고 사용하기 위해 지갑을 연결해주세요
          </p>
        </div>

        {/* 지갑 연결 카드 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {walletAddress && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">지갑 연결 완료!</p>
              </div>
              <p className="text-green-700 text-sm font-mono break-all">
                {walletAddress}
              </p>
            </div>
          )}

          {!phantomInstalled ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                팬텀 지갑이 필요합니다
              </h3>
              <p className="text-gray-600 mb-6">
                Solana 네트워크의 모델을 사용하기 위해 팬텀 지갑을 설치해주세요
              </p>
              
              <button
                onClick={openPhantomDownload}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors mb-4"
              >
                팬텀 지갑 설치하기
              </button>
              
              <button
                onClick={recheckPhantom}
                className="flex items-center justify-center space-x-2 w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>설치 확인</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                팬텀 지갑 연결
              </h3>
              <p className="text-gray-600 mb-6">
                팬텀 지갑을 연결하여 Solana 기반 AI 모델을 사용하세요
              </p>
              
              <button
                onClick={connectPhantomWallet}
                disabled={connecting || walletAddress}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>연결 중...</span>
                  </>
                ) : walletAddress ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>연결됨</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>팬텀 지갑 연결</span>
                  </>
                )}
              </button>

              {/* 문제 해결 버튼 */}
              {!connecting && !walletAddress && (
                <div className="mt-4">
                  <button
                    onClick={recheckPhantom}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    연결에 문제가 있나요? 지갑 상태 다시 확인하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 지갑 연결의 이점 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">지갑 연결의 이점</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">AI 모델 라이선스 구매 및 관리</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">블록체인 기반 투명한 거래</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">탈중앙화된 AI 생태계 참여</p>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="mt-8 flex space-x-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              나중에 연결
            </button>
            {walletAddress && (
              <button
                onClick={onComplete}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>계속하기</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 문제 해결 안내 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">연결 문제 해결 방법</p>
              <ul className="space-y-1 text-xs">
                <li>• 팬텀 지갑이 잠금 해제되어 있는지 확인</li>
                <li>• 브라우저에서 팬텀 확장 프로그램 활성화 확인</li>
                <li>• 다른 dApp에서 지갑이 이미 연결 중인지 확인</li>
                <li>• 페이지 새로고침 후 다시 시도</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};