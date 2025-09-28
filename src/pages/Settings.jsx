import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Key, 
  CreditCard,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Plus,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production API', key: 'sk-1234...5678', created: '2024-01-15', lastUsed: '2시간 전', permissions: ['read', 'write'] },
    { id: '2', name: 'Development API', key: 'sk-abcd...efgh', created: '2024-01-10', lastUsed: '1일 전', permissions: ['read'] }
  ]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState(['read']);

  const tabs = [
    { id: 'account', name: '계정', icon: User },
    { id: 'security', name: '보안', icon: Shield },
    { id: 'notifications', name: '알림', icon: Bell },
    { id: 'api', name: 'API 키', icon: Key },
    { id: 'billing', name: '결제', icon: CreditCard },
    { id: 'appearance', name: '외관', icon: Palette },
    { id: 'advanced', name: '고급', icon: Globe }
  ];

  const [settings, setSettings] = useState({
    // Account
    twoFactorEnabled: false,
    emailNotifications: true,
    marketingEmails: false,
    
    // Notifications
    modelUpdates: true,
    paymentAlerts: true,
    securityAlerts: true,
    weeklyDigest: false,
    
    // Appearance
    theme: 'light',
    language: 'ko',
    timezone: 'Asia/Seoul',
    
    // Privacy
    profileVisibility: 'public',
    showEmail: false,
    showStats: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateApiKey = () => {
    if (!newKeyName.trim()) return;
    
    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `sk-${Math.random().toString(36).substr(2, 8)}...${Math.random().toString(36).substr(2, 8)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: '방금 전',
      permissions: newKeyPermissions
    };
    
    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setNewKeyPermissions(['read']);
    setShowNewKeyModal(false);
  };

  const deleteApiKey = (keyId) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600 mt-2">계정 및 애플리케이션 설정을 관리하세요</p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 mr-8">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">계정 설정</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          onChange={(e) => updateUser({ name: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          onChange={(e) => updateUser({ email: e.target.value })}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">프로필 공개 설정</label>
                      <select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="public">공개</option>
                        <option value="private">비공개</option>
                        <option value="friends">친구만</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.showEmail}
                          onChange={(e) => handleSettingChange('showEmail', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">프로필에 이메일 표시</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.showStats}
                          onChange={(e) => handleSettingChange('showStats', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">프로필에 통계 표시</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">보안 설정</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">2단계 인증</h3>
                          <p className="text-sm text-gray-600">계정 보안을 강화하기 위해 2단계 인증을 활성화하세요</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.twoFactorEnabled}
                            onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                          <input
                            type="password"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                          <input
                            type="password"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          비밀번호 변경
                        </button>
                      </div>
                    </div>

                    {/* Wallet Connection */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">지갑 연결</h3>
                      {user?.wallet?.connected ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.wallet.provider} 지갑</div>
                              <div className="text-sm text-gray-600">
                                {user.wallet.address?.slice(0, 6)}...{user.wallet.address?.slice(-4)}
                              </div>
                            </div>
                          </div>
                          <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                            연결 해제
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">지갑이 연결되지 않았습니다</p>
                          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            지갑 연결
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">알림 설정</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">이메일 알림</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">모델 업데이트</div>
                            <div className="text-sm text-gray-600">새로운 모델이나 업데이트 알림</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.modelUpdates}
                            onChange={(e) => handleSettingChange('modelUpdates', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">결제 알림</div>
                            <div className="text-sm text-gray-600">결제 및 청구 관련 알림</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.paymentAlerts}
                            onChange={(e) => handleSettingChange('paymentAlerts', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">보안 알림</div>
                            <div className="text-sm text-gray-600">계정 보안 관련 중요 알림</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.securityAlerts}
                            onChange={(e) => handleSettingChange('securityAlerts', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">주간 요약</div>
                            <div className="text-sm text-gray-600">주간 활동 요약 이메일</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.weeklyDigest}
                            onChange={(e) => handleSettingChange('weeklyDigest', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === 'api' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">API 키 관리</h2>
                    <button
                      onClick={() => setShowNewKeyModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>새 API 키</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {apiKeys.map(apiKey => (
                      <div key={apiKey.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
                            <p className="text-sm text-gray-600">생성일: {apiKey.created} • 마지막 사용: {apiKey.lastUsed}</p>
                          </div>
                          <button
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-4">
                          <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm">
                            {apiKey.key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-2">
                          {apiKey.permissions.map(permission => (
                            <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">결제 설정</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">결제 방법</h3>
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">등록된 결제 방법이 없습니다</p>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          결제 방법 추가
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">청구 정보</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
                          <input
                            type="text"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="회사명 (선택사항)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">사업자등록번호</label>
                          <input
                            type="text"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="000-00-00000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">외관 설정</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">테마</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['light', 'dark', 'auto'].map(theme => (
                          <label key={theme} className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            settings.theme === theme ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <input
                              type="radio"
                              name="theme"
                              value={theme}
                              checked={settings.theme === theme}
                              onChange={(e) => handleSettingChange('theme', e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <div className={`w-12 h-8 rounded mb-2 ${
                                theme === 'light' ? 'bg-white border border-gray-300' :
                                theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-r from-white to-gray-900'
                              }`}></div>
                              <span className="text-sm font-medium capitalize">
                                {theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '자동'}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">시간대</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="Asia/Seoul">서울 (UTC+9)</option>
                        <option value="America/New_York">뉴욕 (UTC-5)</option>
                        <option value="Europe/London">런던 (UTC+0)</option>
                        <option value="Asia/Tokyo">도쿄 (UTC+9)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">고급 설정</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-red-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-red-900 mb-2">위험 구역</h3>
                          <p className="text-sm text-red-700 mb-4">
                            아래 작업들은 되돌릴 수 없습니다. 신중하게 진행하세요.
                          </p>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">모든 데이터 내보내기</div>
                                <div className="text-sm text-gray-600">계정의 모든 데이터를 JSON 형태로 다운로드</div>
                              </div>
                              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                내보내기
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">계정 비활성화</div>
                                <div className="text-sm text-gray-600">계정을 일시적으로 비활성화 (복구 가능)</div>
                              </div>
                              <button className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors">
                                비활성화
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">계정 삭제</div>
                                <div className="text-sm text-gray-600">계정과 모든 데이터를 영구적으로 삭제</div>
                              </div>
                              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                계정 삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowNewKeyModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">새 API 키 생성</h3>
                <button
                  onClick={() => setShowNewKeyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">키 이름</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="예: Production API"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">권한</label>
                  <div className="space-y-2">
                    {['read', 'write', 'admin'].map(permission => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyPermissions(prev => [...prev, permission]);
                            } else {
                              setNewKeyPermissions(prev => prev.filter(p => p !== permission));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewKeyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={generateApiKey}
                  disabled={!newKeyName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};