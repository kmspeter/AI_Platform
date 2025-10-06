import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts';

export const Layout = ({ children }) => {
  const { user, updateUser } = useAuth();

  const handleWalletConnect = () => {
    if (user?.wallet?.connected) {
      updateUser({
        wallet: { connected: false, address: null, network: null }
      });
    } else {
      // Simulate wallet connection
      updateUser({
        wallet: { 
          connected: true, 
          address: '0x1234...5678', 
          network: 'Ethereum' 
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onWalletConnect={handleWalletConnect} />
      <Sidebar />
      
      <div className="lg:pl-64">
        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  );
};