import React, { useState } from 'react';
import { User, Mail, Calendar, MapPin, Link as LinkIcon, CreditCard as Edit3, Save, X, Camera, Shield, Award, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/contexts';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    company: user?.company || '',
    twitter: user?.twitter || '',
    github: user?.github || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      company: user?.company || '',
      twitter: user?.twitter || '',
      github: user?.github || ''
    });
    setIsEditing(false);
  };

  const stats = [
    { label: '업로드한 모델', value: '12', icon: TrendingUp, color: 'text-blue-600' },
    { label: '총 다운로드', value: '2.4K', icon: Users, color: 'text-green-600' },
    { label: '평균 평점', value: '4.8', icon: Award, color: 'text-yellow-600' },
    { label: '총 수익', value: '$1,240', icon: TrendingUp, color: 'text-purple-600' }
  ];

  const achievements = [
    { title: '첫 모델 업로드', description: '첫 번째 AI 모델을 성공적으로 업로드했습니다', date: '2024-01-15', earned: true },
    { title: '인기 제작자', description: '모델이 1000회 이상 다운로드되었습니다', date: '2024-01-20', earned: true },
    { title: '품질 인증', description: '모든 모델이 4.5점 이상의 평점을 받았습니다', date: null, earned: false },
    { title: '커뮤니티 기여자', description: '10개 이상의 모델을 업로드했습니다', date: '2024-01-25', earned: true }
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                      placeholder="이름"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                      placeholder="이메일"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{formData.name}</h1>
                    <p className="text-gray-600 mt-1">{formData.email}</p>
                    {formData.bio && (
                      <p className="text-gray-700 mt-2">{formData.bio}</p>
                    )}
                  </div>
                )}

                {/* Wallet Info */}
                {user?.wallet?.connected && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {user.wallet.provider} 지갑 연결됨
                    </span>
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {user.wallet.address?.slice(0, 6)}...{user.wallet.address?.slice(-4)}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>저장</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>취소</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>편집</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">통계</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">업적</h2>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`flex items-start space-x-4 p-4 rounded-lg ${
                    achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.earned ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      <Award className={`h-5 w-5 ${
                        achievement.earned ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        achievement.earned ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        {achievement.title}
                      </h3>
                      <p className={`text-sm ${
                        achievement.earned ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {achievement.description}
                      </p>
                      {achievement.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          획득일: {achievement.date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Additional Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">추가 정보</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">소개</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="자신을 소개해주세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">위치</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="서울, 대한민국"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">회사</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="회사명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">웹사이트</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                    <input
                      type="text"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                    <input
                      type="text"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="username"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{formData.location}</span>
                    </div>
                  )}
                  {formData.company && (
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{formData.company}</span>
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center space-x-3">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                      <a 
                        href={formData.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {formData.website}
                      </a>
                    </div>
                  )}
                  {formData.twitter && (
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-400">𝕏</span>
                      <a 
                        href={`https://twitter.com/${formData.twitter.replace('@', '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {formData.twitter}
                      </a>
                    </div>
                  )}
                  {formData.github && (
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700">⚡</span>
                      <a 
                        href={`https://github.com/${formData.github}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {formData.github}
                      </a>
                    </div>
                  )}
                  
                  {!formData.location && !formData.company && !formData.website && !formData.twitter && !formData.github && (
                    <p className="text-sm text-gray-500 italic">추가 정보를 입력하려면 편집 버튼을 클릭하세요</p>
                  )}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">계정 정보</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-700">가입일</div>
                    <div className="text-xs text-gray-500">2024년 1월 15일</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-700">이메일 인증</div>
                    <div className="text-xs text-green-600">인증 완료</div>
                  </div>
                </div>
                {user?.wallet?.connected && (
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-700">지갑 연결</div>
                      <div className="text-xs text-green-600">
                        {user.wallet.provider} ({user.wallet.network})
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};