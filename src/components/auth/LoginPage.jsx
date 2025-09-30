import React, { useState, useEffect } from 'react';
import { Bot, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = 'https://kau-capstone.duckdns.org';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // 로컬 이메일 로그인 (데모용)
  const handleEmailLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await new Promise(r => setTimeout(r, 500));
      await login(
        { id: 'local-demo', email: formData.email, name: formData.email },
        'demo-token'
      );
    } catch {
      setError('로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth 로그인 - 팝업 없이 현재 창에서 진행
  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    
    // 현재 URL을 저장 (로그인 후 돌아올 위치)
    sessionStorage.setItem('loginReturnUrl', window.location.pathname);
    
    // 현재 창에서 OAuth 시작
    window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
  };

  // 페이지 로드 시 OAuth 완료 여부 확인
  useEffect(() => {
    const checkOAuthComplete = async () => {
      // URL에서 돌아온 경로 확인
      const returnUrl = sessionStorage.getItem('loginReturnUrl');
      
      if (returnUrl) {
        sessionStorage.removeItem('loginReturnUrl');
        
        try {
          setLoading(true);
          
          // 백엔드에서 쿠키로 설정한 accessToken을 사용하여 사용자 정보 가져오기
          const response = await fetch(`${SERVER_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include', // 쿠키 포함
            headers: {
              'Accept': 'application/json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            // 쿠키에서 accessToken 읽기 (선택사항)
            const accessToken = getCookie('accessToken');
            
            // 로그인 처리
            await login(data.user, accessToken || data.accessToken);
            
            // 홈으로 이동
            navigate('/home');
          } else {
            throw new Error('인증 정보를 가져오는데 실패했습니다.');
          }
        } catch (err) {
          console.error('OAuth completion error:', err);
          setError('로그인 처리 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      }
    };

    checkOAuthComplete();
  }, [login, navigate]);

  // 쿠키에서 특정 값 읽기 헬퍼 함수
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ModelHub</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인</h2>
          <p className="text-gray-600">AI 모델 마켓플레이스에 오신 것을 환영합니다</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                <div>
                  <p className="text-blue-700 text-sm font-medium">Google 로그인 처리 중...</p>
                  <p className="text-blue-600 text-xs mt-1">잠시만 기다려주세요</p>
                </div>
              </div>
            </div>
          )}

          {/* Google 로그인 */}
          <div className="mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium">
                {loading ? '처리 중...' : 'Google로 계속하기'}
              </span>
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 이메일 로그인 (데모) */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이메일을 입력하세요"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인 (데모)'}
            </button>
          </form>
        </div>

        {/* 개발 환경 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p><strong>백엔드 서버:</strong> {SERVER_URL}</p>
            <p className="mt-2 text-blue-600">
              ℹ️ 현재 창에서 OAuth 진행 후 자동으로 로그인됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};