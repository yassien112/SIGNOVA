import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MessageSquare, ShieldCheck, Accessibility } from 'lucide-react';
import '../styles/Home.css';

const FEATURES = [
  { icon: Camera,        title: 'AI Sign Recognition',  desc: 'Our camera tool detects your hand gestures and translates them to text in real-time to send into the chat.' },
  { icon: MessageSquare, title: 'Instant Messaging',     desc: 'Fast, reliable real-time messaging with online status tracking and instant notifications.' },
  { icon: Accessibility, title: 'Accessibility First',   desc: 'Built carefully with high-contrast theming, large tap targets, and RTL language support (Arabic).' },
  { icon: ShieldCheck,   title: 'Secure & Private',      desc: 'Your data is securely authenticated with role-based dashboard access protecting your information.' },
];

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">New AI Communication Platform</span>
          <h1>Breaking Barriers with <br /><span className="gradient-text">Signova</span></h1>
          <p className="hero-subtitle">
            A modern communication platform designed to help people with disabilities
            connect seamlessly through AI-powered sign language recognition and real-time messaging.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary btn-lg">Get Started</Link>
            <Link to="/login"    className="btn-secondary btn-lg">Login to Account</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="abstract-shape shape-1" />
          <div className="abstract-shape shape-2" />
          <div className="glass-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span /><span /><span />
              </div>
              <div className="mockup-title">Signova Dashboard</div>
            </div>
            <div className="mockup-body">
              <div className="mock-chat">
                <div className="mock-msg mock-receive">Hello, nice to meet you!</div>
                <div className="mock-msg mock-send">Hi! The AI translated my sign!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2>Core Features</h2>
          <p>Everything you need for seamless communication</p>
        </div>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={28} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
