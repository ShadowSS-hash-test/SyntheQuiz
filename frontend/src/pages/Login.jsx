import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Sparkles, GraduationCap, Presentation } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student'); 

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with:", { email, password, userType });
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      
      {/* Decorative Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-blue-600 opacity-20 blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-indigo-500 opacity-10 blur-3xl animate-pulse-slow pointer-events-none" />

      {/* Main Wrapper */}
      <div className="w-full max-w-md animate-fade-in-up delay-200 relative z-10">
        
        {/* Logo Head */}
        <div className="text-center mb-8">
         
          {/* Clicks back to home */}
          <Link to="/" className="block">
            <h2 className="text-3xl font-extrabold uppercase tracking-widest text-white hover:opacity-80 transition-opacity">
              Synthe<span className="text-blue-500">Quiz</span>
            </h2>
          </Link>
          
          <p className="text-sm text-gray-400 mt-2">Welcome back! Sign in to access your account.</p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* User Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 ${
                    userType === 'student'
                      ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-gray-900/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <GraduationCap size={18} />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('educator')}
                  className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 ${
                    userType === 'educator'
                      ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-gray-900/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <Presentation size={18} />
                  Educator
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Password
                </label>
            
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>

   

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
            >
              Sign In <ArrowRight size={16} />
            </button>
          </form>

      

        
        </div>

        {/* Bottom Redirect Link */}
        <p className="text-center text-xs text-gray-500 mt-6">
          New to SyntheQuiz?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;