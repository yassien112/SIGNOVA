import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './lib/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AICameraPage from './pages/AICameraPage';
import './styles/App.css';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </LanguageProvider>
  );
}
