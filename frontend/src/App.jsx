import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useUserStore from './stores/useUserStore';

import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() { 
 
  const { checkAuth, user, checkingAuth } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

 
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Homepage />} />
      
      {/* Redirect logged-in users away from auth pages */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* PRIVATE ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;