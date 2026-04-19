import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuthStore } from './store/authStore';

import Home        from './pages/Home';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Chat        from './pages/Chat';
import Profile     from './pages/Profile';
import AICameraPage from './pages/AICameraPage';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-950">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />

            <Route path="/dashboard" element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />

            <Route path="/chat" element={
              <PrivateRoute><Chat /></PrivateRoute>
            } />

            <Route path="/ai-camera" element={
              <PrivateRoute><AICameraPage /></PrivateRoute>
            } />

            <Route path="/profile" element={
              <PrivateRoute><Profile /></PrivateRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
