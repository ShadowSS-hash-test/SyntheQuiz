import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-5 lg:px-12 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center space-x-12">
        {/* Logo - Now clicks back to Home */}
        <Link to="/" className="text-xl font-extrabold tracking-widest uppercase text-white hover:opacity-80 transition-opacity">
          Synthe<span className="text-blue-500">Quiz</span>
        </Link>
        
 
      </div>

      {/* Nav Actions */}
      <div className="hidden md:flex items-center space-x-6">
    
        <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-blue-500 transition-colors">
          Sign In
        </Link>


          <Link to = "/signup">

        <button className="px-5 py-2.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm hover:cursor-pointer">
            Get started
        
        </button>
        
          </Link>
       
   
      </div>
    </nav>
  );
};

export default Navbar;