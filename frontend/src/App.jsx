import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AICamera from './components/AICamera';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

const Profile = () => <div className="page-container"><h2>User Profile Coming Soon...</h2></div>;

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/ai-camera" element={<div className="page-container"><AICamera /></div>} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
      
      <style jsx="true">{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>
    </BrowserRouter>
  );
}

export default App;
