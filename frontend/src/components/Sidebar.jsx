import React from 'react';
import { BookOpen, Sparkles, User, LogOut, Database } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useUserStore from '../stores/useUserStore';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { logout } = useUserStore();

  const navItems = [
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'create-quiz', label: 'Create a Quiz', icon: Sparkles },
    { id: 'documents', label: 'Documents', icon: Database },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-800/40 backdrop-blur-md border-r border-gray-500/30 h-screen flex flex-col justify-between p-6 shrink-0">
      <div>
        {/* Brand / Header */}
        <div className="mb-10">
           <Link to="/" className="text-xl font-extrabold tracking-widest uppercase text-white hover:opacity-80 transition-opacity">
          Synthe<span className="text-blue-500">Quiz</span>
        </Link>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="pt-6 border-t border-gray-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;