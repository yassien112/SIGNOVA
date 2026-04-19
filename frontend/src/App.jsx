import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider }  from './lib/LanguageContext';
import { useAuthStore }      from './store/authStore';
import { useNotifications }  from './hooks/useNotifications';
import Navbar        from './components/Navbar';
import Home          from './pages/Home';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import Chat          from './pages/Chat';
import Profile       from './pages/Profile';
import AICameraPage  from './pages/AICameraPage';
import './styles/App.css';
import './styles/components.css';

function AppInner() {
  const { isAuthenticated, fetchMe } = useAuthStore();

  // Re-hydrate user on refresh
  useEffect(() => {
    if (isAuthenticated) fetchMe();
  }, []);

  // Connect notification socket
  useNotifications(isAuthenticated);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat"      element={<Chat />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="/ai-camera" element={<AICameraPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </LanguageProvider>
  );
}
