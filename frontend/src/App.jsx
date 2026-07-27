import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useUserStore from './stores/useUserStore';

import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import QuestionCuration from './components/Questioncuration';
import ProtectedRoute from './components/ProtectedRoute'
import './App.css';

function App() { 
  const { checkAuth, user } = useUserStore();

 
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* PUBLIC ROUTES: Load instantly for everyone */}
      <Route path="/" element={<Homepage />} />
      
      {/* Redirect logged-in users away from auth pages */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

      {/* PRIVATE ROUTES: Guarded by ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quizcreate" element={<QuestionCuration />} />
      </Route>
    </Routes>
  );
}

export default App;