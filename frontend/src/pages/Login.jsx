import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../lib/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setLogin = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      try {
        response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        throw new Error(
          '❌ Cannot connect to the server. Make sure the backend is running (npm run dev in backend folder).'
        );
      }

      // Safely parse JSON — proxy errors may return empty or HTML bodies
      let data = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Server returned an invalid response. Please try again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed (HTTP ${response.status})`);
      }

      if (!data.user || !data.token) {
        throw new Error('Server response is missing user data. Please try again.');
      }

      setLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon-large">
            <LogIn size={32} color="white" />
          </div>
          <h2>Welcome Back</h2>
          <p>Login to your Signova account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" 
              required 
            />
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
        </div>
      </div>

      <style jsx="true">{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 120px);
        }

        .auth-card {
          background-color: var(--bg-secondary);
          width: 100%;
          max-width: 440px;
          padding: 2.5rem;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon-large {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 8px 20px rgba(30, 58, 138, 0.4);
        }

        .auth-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: white;
        }

        .auth-header p {
          color: var(--text-secondary);
        }

        .error-message {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group input {
          padding: 0.75rem 1rem;
          background-color: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          border-color: var(--primary);
        }

        .auth-submit {
          width: 100%;
          padding: 0.875rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0.5rem;
          background-color: var(--primary);
          color: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .auth-submit:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        
        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .auth-footer a {
          color: var(--primary);
          font-weight: 500;
          transition: color 0.2s;
        }

        .auth-footer a:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
