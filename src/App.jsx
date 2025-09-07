import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Market } from './pages/Market';
import { ModelDetail } from './pages/ModelDetail';
import { Datasets } from './pages/Datasets';
import { Playground } from './pages/Playground';
import { Creator } from './pages/Creator';
import { FineTune } from './pages/FineTune';
import { Billing } from './pages/Billing';
import { Personal } from './pages/Personal';
import { Organization } from './pages/Organization';
import { Checkout } from './pages/Checkout';
import { PurchaseComplete } from './pages/PurchaseComplete';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Market />} />
          <Route path="/models" element={<Market />} />
          <Route path="/model/:id" element={<ModelDetail />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/creator" element={<Creator />} />
          <Route path="/creator/new" element={<Creator />} />
          <Route path="/finetune" element={<FineTune />} />
          <Route path="/finetune/wizard" element={<FineTune />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/purchase/:txId" element={<PurchaseComplete />} />
          <Route path="/profile" element={<div className="p-6"><h1 className="text-2xl font-bold">프로필</h1><p>개발 중입니다</p></div>} />
          <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">설정</h1><p>개발 중입니다</p></div>} />
          <Route path="/notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">알림</h1><p>개발 중입니다</p></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;