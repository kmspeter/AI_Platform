import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts';
import { LoginPage } from '@/pages/auth/LoginPage';
import { WalletConnectPage } from '@/pages/auth/WalletConnectPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Market } from './pages/Market';
import { ModelDetail } from './pages/ModelDetail';
import { Datasets } from './pages/Datasets';
import { Playground } from './pages/Playground';
import { Creator } from './pages/Creator';
import { FineTune } from './pages/FineTune';
import { Billing } from './pages/Billing';
import { Personal } from './pages/Personal';
import { Checkout } from './pages/Checkout';
import { PurchaseComplete } from './pages/PurchaseComplete';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { OAuthCallback } from './pages/OAuthCallback'; // 추가
import { ModelRegister } from './pages/ModelRegister';

const AppContent = () => {
  const { isAuthenticated, loading, needsWalletConnection, skipWalletConnection, updateUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // OAuth 콜백은 인증 여부와 관계없이 처리
  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (needsWalletConnection) {
    return (
      <WalletConnectPage 
        onComplete={() => {
          // 지갑 연결 완료 후 메인 앱으로 이동
        }}
        onSkip={skipWalletConnection}
      />
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Market />} />
        <Route path="/models" element={<Market />} />
        <Route path="/model/:id" element={<ModelDetail />} />
        <Route path="/models/register" element={<ModelRegister />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/creator" element={<Creator />} />
        <Route path="/creator/new" element={<Creator />} />
        <Route path="/finetune" element={<FineTune />} />
        <Route path="/finetune/wizard" element={<FineTune />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/purchase/:txId" element={<PurchaseComplete />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">알림</h1><p>개발 중입니다</p></div>} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;