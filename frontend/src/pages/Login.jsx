import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../lib/config';
import '../styles/Auth.css';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const setLogin = useAuthStore((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      let response;
      try {
        response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        throw new Error('Cannot connect to the server. Make sure the backend is running.');
      }
      let data = {};
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try { data = await response.json(); } catch { throw new Error('Server returned an invalid response.'); }
      }
      if (!response.ok) throw new Error(data.message || `Login failed (HTTP ${response.status})`);
      if (!data.user || !data.token) throw new Error('Server response is missing user data.');
      setLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon-large"><LogIn size={32} color="white" /></div>
          <h2>Welcome Back</h2>
          <p>Login to your Signova account</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don&apos;t have an account? <Link to="/register">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}
