import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  LogOut,
  User,
  LogIn,
  UserPlus
} from 'lucide-react';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1">
            <h1 className="text-xl font-bold text-gray-900">打卡工具</h1>
          </div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* 首页按钮 */}
            <Link
              to="/"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Home className="h-5 w-5 mr-2" />
              首页
            </Link>
            
            {/* 用户信息或登录注册按钮 */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <div className="flex items-center text-sm text-gray-700">
                    <User className="h-4 w-4 mr-1" />
                    {user?.username}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    登出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center px-3 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div>
        {/* 页面内容 */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout; 