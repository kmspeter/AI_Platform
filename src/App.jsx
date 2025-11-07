import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts';
import { LoginPage } from '@/pages/auth/LoginPage';
import { WalletConnectPage } from '@/pages/auth/WalletConnectPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Market } from './pages/Market';
import { ModelDetail } from './pages/ModelDetail';
import { Datasets } from './pages/Datasets';
import { DatasetDetail } from './pages/DatasetDetail';
import { Playground } from './pages/Playground';
import { Creator } from './pages/Creator';
import { FineTune } from './pages/FineTune';
import { Billing } from './pages/Billing';
import { Personal } from './pages/Personal';
import { Checkout } from './pages/Checkout';
import { PurchaseComplete } from './pages/PurchaseComplete';
import { OAuthCallback } from './pages/OAuthCallback'; // 추가
import { ModelRegister } from './pages/ModelRegister';

const AppContent = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, needsWalletConnection, skipWalletConnection } = useAuth();

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

  useEffect(() => {
    if (isAuthenticated && needsWalletConnection) {
      navigate('/wallet-connect', { replace: true });
    }
  }, [isAuthenticated, needsWalletConnection, navigate]);

  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/wallet-connect"
        element={
          isAuthenticated && needsWalletConnection ? (
            <WalletConnectPage
              onComplete={() => navigate('/', { replace: true })}
              onSkip={() => {
                skipWalletConnection();
                navigate('/', { replace: true });
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route element={<Layout />}>
        <Route index element={<Market />} />
        <Route path="models" element={<Market />} />
        <Route path="model/:id" element={<ModelDetail />} />
        <Route
          path="models/register"
          element={
            <ProtectedRoute>
              <ModelRegister />
            </ProtectedRoute>
          }
        />
        <Route path="datasets" element={<Datasets />} />
        <Route path="datasets/:id" element={<DatasetDetail />} />
        <Route path="playground" element={<Playground />} />
        <Route
          path="creator"
          element={
            <ProtectedRoute>
              <Creator />
            </ProtectedRoute>
          }
        />
        <Route
          path="creator/new"
          element={
            <ProtectedRoute>
              <Creator />
            </ProtectedRoute>
          }
        />
        <Route
          path="finetune"
          element={
            <ProtectedRoute>
              <FineTune />
            </ProtectedRoute>
          }
        />
        <Route
          path="finetune/wizard"
          element={
            <ProtectedRoute>
              <FineTune />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="personal"
          element={
            <ProtectedRoute>
              <Personal />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout/:id"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchase/:txId"
          element={
            <ProtectedRoute>
              <PurchaseComplete />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={<div className="p-6"><h1 className="text-2xl font-bold">알림</h1><p>개발 중입니다</p></div>}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
