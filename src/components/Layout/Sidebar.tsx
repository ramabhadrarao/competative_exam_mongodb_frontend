import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  GraduationCap,
  PlusCircle,
  Brain
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const commonItems = [
      { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    ];

    if (user?.role === 'student') {
      return [
        ...commonItems,
        { icon: FileText, label: 'My Tests', path: '/tests' },
        { icon: BookOpen, label: 'Test Results', path: '/results' },
        { icon: Settings, label: 'Profile', path: '/profile' },
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...commonItems,
        { icon: BookOpen, label: 'Questions', path: '/questions' },
        { icon: PlusCircle, label: 'Create Question', path: '/questions/create' },
        { icon: Brain, label: 'AI Generate', path: '/questions/generate' },
        { icon: FileText, label: 'Tests', path: '/tests' },
        { icon: PlusCircle, label: 'Create Test', path: '/tests/create' },
        { icon: Users, label: 'Students', path: '/students' },
        { icon: Settings, label: 'Profile', path: '/profile' },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...commonItems,
        { icon: BookOpen, label: 'Questions', path: '/questions' },
        { icon: FileText, label: 'Tests', path: '/tests' },
        { icon: Users, label: 'Users', path: '/users' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EduPlatform</h1>
            <p className="text-sm text-gray-500">AI-Powered Learning</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;