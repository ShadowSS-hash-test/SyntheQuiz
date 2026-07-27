import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import useUserStore from '../stores/useUserStore'; // Adjust this path based on your folder structure

const Navbar = () => {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Send them back to the homepage after logging out
  };

  return (
    <nav className="flex items-center justify-between px-6 py-5 lg:px-12 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center space-x-12">
        {/* Logo - Clicks back to Home */}
        <Link to="/" className="text-xl font-extrabold tracking-widest uppercase text-white hover:opacity-80 transition-opacity">
          Synthe<span className="text-blue-500">Quiz</span>
        </Link>
      </div>

      {/* Nav Actions */}
      <div className="hidden md:flex items-center space-x-6">
        {user ? (
          /* ----- LOGGED IN STATE ----- */
          <>
            <Link to="/dashboard" className="text-sm font-semibold text-gray-300 hover:text-blue-500 transition-colors flex items-center gap-1.5">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>

            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 text-sm font-semibold rounded-full border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:cursor-pointer flex items-center gap-1.5"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          /* ----- LOGGED OUT STATE ----- */
          <>
            <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-blue-500 transition-colors">
              Sign In
            </Link>

            <Link to="/signup">
              <button className="px-5 py-2.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm hover:cursor-pointer">
                Get started
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;