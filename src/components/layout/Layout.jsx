import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <div className="lg:pl-64">
        <main className="pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};