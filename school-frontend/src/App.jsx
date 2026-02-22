import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ModeratorDashboard from './pages/ModeratorDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import './App.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'moderator' ? <ModeratorDashboard /> : <TeacherDashboard />}
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #2d2d4e' }
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}