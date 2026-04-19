import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../lib/config';
import '../styles/Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({ name:'', email:'', password:'', role:'User' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setLogin = useAuthStore((s) => s.login);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.id]: e.target.value }));
  const handleRole   = (e) => setFormData((p) => ({ ...p, role: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      setLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon-large"><UserPlus size={32} color="white" /></div>
          <h2>Create Account</h2>
          <p>Join the Signova community</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
          </div>
          <div className="form-group">
            <label>Select Role</label>
            <div className="radio-group">
              {['User','Admin'].map((r) => (
                <label key={r} className="radio-label">
                  <input type="radio" name="role" value={r} checked={formData.role===r} onChange={handleRole} /> {r}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}
