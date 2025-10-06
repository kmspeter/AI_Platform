import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Bot } from 'lucide-react';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const name = searchParams.get('name');

        console.log('OAuth 콜백 데이터:', { token: token ? '있음' : '없음', userId, email, name });

        if (!token || !userId) {
          throw new Error('로그인 정보가 올바르지 않습니다.');
        }

        const userData = {
          id: userId,
          email: decodeURIComponent(email || ''),
          name: decodeURIComponent(name || '')
        };

        console.log('로그인 처리 시작');
        await login(userData, token);
        
        // URL에서 토큰 제거 (보안)
        window.history.replaceState({}, '', '/oauth/callback');
        
        console.log('로그인 성공, 홈으로 이동');
        navigate('/home');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">로그인 페이지로 돌아갑니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot className="h-9 w-9 text-white" />
          </div>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요</p>
      </div>
    </div>
  );
};