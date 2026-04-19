import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../lib/config';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'User' });
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

  const inputCls = `px-4 py-3 bg-[#0F172A] border border-[#374151] rounded-lg
    text-white text-base placeholder-[#6B7280]
    focus:border-[#1E3A8A] focus:outline-none transition-colors w-full`;

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-120px)] px-4">

      <div className="w-full max-w-[440px] bg-[#1F2937] border border-[#374151]
                      rounded-2xl p-10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">

        {/* header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                          bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]
                          shadow-[0_8px_20px_rgba(30,58,138,0.4)]">
            <UserPlus size={32} color="white" />
          </div>
          <h2 className="text-[1.75rem] font-bold text-white mb-1">Create Account</h2>
          <p className="text-[#9CA3AF]">Join the Signova community</p>
        </div>

        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]
                          rounded-lg px-3 py-3 mb-6 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-[#9CA3AF]">Full Name</label>
            <input type="text" id="name" value={formData.name} onChange={handleChange}
                   placeholder="Enter your name" required className={inputCls} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#9CA3AF]">Email</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange}
                   placeholder="Enter your email" required className={inputCls} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[#9CA3AF]">Password</label>
            <input type="password" id="password" value={formData.password} onChange={handleChange}
                   placeholder="Create a password" required className={inputCls} />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#9CA3AF]">Select Role</label>
            <div className="flex gap-6 mt-1">
              {['User', 'Admin'].map((r) => (
                <label key={r} className="flex items-center gap-2 text-white cursor-pointer">
                  <input type="radio" name="role" value={r}
                         checked={formData.role === r} onChange={handleRole}
                         className="accent-[#1E3A8A]" />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-[0.875rem] rounded-lg text-base font-semibold mt-2
                       bg-[#1E3A8A] text-white border-none cursor-pointer
                       hover:bg-[#1e40af] disabled:opacity-70 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-[#9CA3AF]">
          <p>Already have an account?{' '}
            <Link to="/login" className="text-[#1E3A8A] font-medium hover:text-[#1e40af] hover:underline transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
