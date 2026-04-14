import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../lib/config';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setLogin = useAuthStore(state => state.login);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
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
            <UserPlus size={32} color="white" />
          </div>
          <h2>Create Account</h2>
          <p>Join the Signova community</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password" 
              required 
            />
          </div>

          <div className="form-group role-selector">
            <label>Select Role</label>
            <div className="radio-group">
                <label className="radio-label">
                    <input 
                        type="radio" 
                        name="role" 
                        id="role" 
                        value="User" 
                        checked={formData.role === 'User'} 
                        onChange={handleChange} 
                    /> User
                </label>
                <label className="radio-label">
                    <input 
                        type="radio" 
                        name="role" 
                        id="role" 
                        value="Admin" 
                        checked={formData.role === 'Admin'} 
                        onChange={handleChange} 
                    /> Admin
                </label>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>

      <style jsx="true">{`
        /* Reuse styles from Login but define radio group specific styles */
        .auth-container { display: flex; justify-content: center; alignItems: center; min-height: calc(100vh - 120px); }
        .auth-card { background-color: var(--bg-secondary); width: 100%; max-width: 440px; padding: 2.5rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .auth-header { text-align: center; margin-bottom: 2rem; }
        .logo-icon-large { width: 64px; height: 64px; background: linear-gradient(135deg, var(--primary), var(--primary-hover)); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 8px 20px rgba(30, 58, 138, 0.4); }
        .auth-header h2 { font-size: 1.75rem; margin-bottom: 0.5rem; color: white; }
        .auth-header p { color: var(--text-secondary); }
        .error-message { background-color: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 1.5rem; text-align: center; font-size: 0.9rem; }
        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); }
        .form-group input[type="text"], .form-group input[type="email"], .form-group input[type="password"] { padding: 0.75rem 1rem; background-color: var(--main-bg, var(--bg-main)); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-size: 1rem; transition: border-color 0.2s; }
        .form-group input:focus { border-color: var(--primary); }
        .radio-group { display: flex; gap: 1.5rem; margin-top: 0.25rem; }
        .radio-label { display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; }
        .auth-submit { width: 100%; padding: 0.875rem; border-radius: 8px; font-size: 1rem; font-weight: 600; margin-top: 0.5rem; background-color: var(--primary); color: white; border: none; cursor: pointer; transition: background-color 0.2s; }
        .auth-submit:hover:not(:disabled) { background-color: var(--primary-hover); }
        .auth-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .auth-footer { text-align: center; margin-top: 2rem; font-size: 0.9rem; color: var(--text-secondary); }
        .auth-footer a { color: var(--primary); font-weight: 500; transition: color 0.2s; }
        .auth-footer a:hover { color: var(--primary-hover); text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default Register;
