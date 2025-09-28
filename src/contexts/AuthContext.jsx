import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsWalletConnection, setNeedsWalletConnection] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // 지갑 연결 상태 확인
        if (!userData.wallet?.connected) {
          setNeedsWalletConnection(true);
        }
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (userData, token) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      
      // 새 사용자의 경우 지갑 연결 필요
      if (!userData.wallet?.connected) {
        setNeedsWalletConnection(true);
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setNeedsWalletConnection(false);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('wallet');
  };

  const updateUser = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
    
    // 지갑이 연결되면 needsWalletConnection을 false로 설정
    if (updatedData.wallet?.connected) {
      setNeedsWalletConnection(false);
    }
  };

  const skipWalletConnection = () => {
    setNeedsWalletConnection(false);
  };
  const value = {
    user,
    isAuthenticated,
    loading,
    needsWalletConnection,
    login,
    logout,
    updateUser,
    skipWalletConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};