import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Bot, 
  PlayCircle, 
  Settings2, 
  BarChart3, 
  Users, 
  Shield,
  Database,
  User
} from 'lucide-react';

const navigation = [
  { name: '모델', href: '/models', icon: Bot },
  { name: '데이터셋', href: '/datasets', icon: Database },
  { name: '플레이그라운드', href: '/playground', icon: PlayCircle },
  { name: '파인튜닝', href: '/finetune', icon: Settings2 },
  { name: '사용량/청구', href: '/billing', icon: BarChart3 },
  { name: '개인', href: '/personal', icon: User },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-16">
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 px-4 py-8 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};