import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../lib/config';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate  = useNavigate();
  const setLogin  = useAuthStore((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
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
      if (!response.ok)  throw new Error(data.message || `Login failed (HTTP ${response.status})`);
      if (!data.user || !data.token) throw new Error('Server response is missing user data.');
      setLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    /* full-page centering */
    <div className="flex justify-center items-center min-h-[calc(100vh-120px)] px-4">

      {/* card */}
      <div className="w-full max-w-[440px] bg-[#1F2937] border border-[#374151]
                      rounded-2xl p-10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">

        {/* header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                          bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]
                          shadow-[0_8px_20px_rgba(30,58,138,0.4)]">
            <LogIn size={32} color="white" />
          </div>
          <h2 className="text-[1.75rem] font-bold text-white mb-1">Welcome Back</h2>
          <p className="text-[#9CA3AF]">Login to your Signova account</p>
        </div>

        {/* error */}
        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]
                          rounded-lg px-3 py-3 mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#9CA3AF]">Email</label>
            <input
              type="email" id="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-4 py-3 bg-[#0F172A] border border-[#374151] rounded-lg
                         text-white text-base placeholder-[#6B7280]
                         focus:border-[#1E3A8A] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[#9CA3AF]">Password</label>
            <input
              type="password" id="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="px-4 py-3 bg-[#0F172A] border border-[#374151] rounded-lg
                         text-white text-base placeholder-[#6B7280]
                         focus:border-[#1E3A8A] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-[0.875rem] rounded-lg text-base font-semibold mt-2
                       bg-[#1E3A8A] text-white border-none cursor-pointer
                       hover:bg-[#1e40af] disabled:opacity-70 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* footer */}
        <div className="text-center mt-8 text-sm text-[#9CA3AF]">
          <p>Don&apos;t have an account?{' '}
            <Link to="/register" className="text-[#1E3A8A] font-medium hover:text-[#1e40af] hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
