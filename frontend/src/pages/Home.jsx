import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MessageSquare, ShieldCheck, Accessibility } from 'lucide-react';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">New AI Communication Platform</div>
          <h1>Breaking Barriers with <br/><span className="gradient-text">Signova</span></h1>
          <p className="hero-subtitle">
            A modern communication platform designed to help people with disabilities connect seamlessly through AI-powered sign language recognition and real-time messaging.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary btn-lg">Get Started</Link>
            <Link to="/login" className="btn-secondary btn-lg">Login to Account</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="abstract-shape shape-1"></div>
          <div className="abstract-shape shape-2"></div>
          <div className="glass-card mockup">
            <div className="mockup-header">
                <div className="dots"><span></span><span></span><span></span></div>
                <div className="title">Signova Dashboard</div>
            </div>
            <div className="mockup-body">
              <div className="mock-chat">
                <div className="mock-msg receive">Hello, nice to meet you!</div>
                <div className="mock-msg send">Hi! The AI translated my sign!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Core Features</h2>
          <p>Everything you need for seamless communication</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Camera size={28} /></div>
            <h3>AI Sign Recognition</h3>
            <p>Our camera tool detects your hand gestures and translates them to text in real-time to send into the chat.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><MessageSquare size={28} /></div>
            <h3>Instant Messaging</h3>
            <p>Fast, reliable real-time messaging with online status tracking and instant notifications.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><Accessibility size={28} /></div>
            <h3>Accessibility First</h3>
            <p>Built carefully with high-contrast theming, large tap targets, and RTL language support (Arabic).</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><ShieldCheck size={28} /></div>
            <h3>Secure & Private</h3>
            <p>Your data is securely authenticated with role-based dashboard access protecting your information.</p>
          </div>
        </div>
      </section>

      {/* CSS in JS for component specific styles */}
      <style jsx="true">{`
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 6rem;
          padding-bottom: 4rem;
        }

        /* Hero Section */
        .hero-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          min-height: calc(100vh - 120px);
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          z-index: 10;
        }

        .badge {
          display: inline-flex;
          align-self: flex-start;
          padding: 0.5rem 1rem;
          background-color: rgba(30,58,138,0.2);
          color: var(--primary);
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.875rem;
          border: 1px solid rgba(30,58,138,0.4);
        }

        .hero-section h1 {
          font-size: 4rem;
          line-height: 1.1;
          font-weight: 800;
          color: white;
        }

        .gradient-text {
          background: linear-gradient(to right, #60A5FA, #1E3A8A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 90%;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .btn-primary { background: var(--primary); color: white; transition: 0.3s; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-secondary { background: transparent; border: 2px solid var(--border-color); transition: 0.3s; }
        .btn-secondary:hover { border-color: var(--primary); color: white; }

        .hero-visual {
          position: relative;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .abstract-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
        }

        .shape-1 {
          width: 300px;
          height: 300px;
          background: rgba(30,58,138,0.4);
          top: 10%;
          right: 20%;
        }

        .shape-2 {
          width: 250px;
          height: 250px;
          background: rgba(16,185,129,0.2);
          bottom: 10%;
          left: 10%;
        }

        .glass-card {
          background: rgba(31, 41, 55, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          height: 450px;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .mockup-header {
          background: rgba(15,23,42,0.8);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .dots { display: flex; gap: 6px; }
        .dots span { width: 10px; height: 10px; border-radius: 50%; background: #EF4444; }
        .dots span:nth-child(2) { background: #F59E0B; }
        .dots span:nth-child(3) { background: #10B981; }
        
        .mockup-header .title { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); margin: 0 auto; padding-right: 40px; }

        .mockup-body {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .mock-chat { display: flex; flex-direction: column; gap: 1rem; }
        .mock-msg { padding: 1rem; border-radius: 12px; font-size: 0.95rem; max-width: 85%; animation: slideIn 0.5s ease forwards; opacity: 0; }
        .receive { background: var(--bg-main); border: 1px solid var(--border-color); align-self: flex-start; border-bottom-left-radius: 4px; }
        .send { background: var(--primary); color: white; align-self: flex-end; border-bottom-right-radius: 4px; animation-delay: 0.5s; }

        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Features Section */
        .features-section {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .section-header { text-align: center; }
        .section-header h2 { font-size: 2.5rem; color: white; margin-bottom: 1rem; }
        .section-header p { color: var(--text-secondary); font-size: 1.2rem; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: var(--bg-secondary);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          transition: 0.3s;
        }

        .feature-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: rgba(30,58,138,0.2);
          color: #60A5FA;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 { color: white; font-size: 1.25rem; margin-bottom: 0.75rem; }
        .feature-card p { color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; }

        @media(max-width: 900px) {
          .hero-section { grid-template-columns: 1fr; text-align: center; }
          .hero-content { align-items: center; }
          .hero-actions { justify-content: center; }
          .hero-subtitle { text-align: center; }
          .badge { align-self: center; }
        }
      `}</style>
    </div>
  );
};

export default Home;
