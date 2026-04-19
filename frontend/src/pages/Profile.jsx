import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Save, Camera } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export default function Profile() {
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    preferredLang: user?.preferredLang || 'en'
  });
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/api/profile/me')
      .then((data) => {
        const u = data.user;
        updateUser(u);
        setForm({
          name: u.name || '',
          bio: u.bio || '',
          avatar: u.avatar || '',
          preferredLang: u.preferredLang || 'en'
        });
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const data = await api.patch('/api/profile/me', form);
      updateUser(data.user);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your account information and preferences.</p>
      </div>

      <div className="profile-grid">
        <div className="profile-sidebar">
          <div className="avatar-section">
            {form.avatar ? (
              <img src={form.avatar} alt={form.name} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">{initials}</div>
            )}
            <div className="avatar-overlay">
              <Camera size={20} />
            </div>
          </div>

          <div className="profile-info">
            <h3>{user?.name}</h3>
            <p className="email">
              <Mail size={14} /> {user?.email}
            </p>
            <span className={`role-badge ${user?.role?.toLowerCase()}`}>
              <Shield size={12} /> {user?.role}
            </span>
          </div>

          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Member since</span>
              <span className="meta-value">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long' })
                  : '—'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Preferred language</span>
              <span className="meta-value">
                {form.preferredLang === 'ar' ? '🇪🇬 Arabic' : '🇬🇧 English'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-form-panel">
          <div className="panel-header">
            <User size={18} />
            <h3>Edit Profile</h3>
          </div>

          {fetching ? (
            <p className="muted">Loading profile…</p>
          ) : (
            <form onSubmit={handleSubmit} className="edit-form">
              {success && (
                <div className="success-banner">✅ Profile updated successfully!</div>
              )}
              {error && <div className="error-banner">{error}</div>}

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar">Avatar URL</label>
                <input
                  id="avatar"
                  name="avatar"
                  type="url"
                  value={form.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us a bit about yourself…"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredLang">Preferred Language</label>
                <select
                  id="preferredLang"
                  name="preferredLang"
                  value={form.preferredLang}
                  onChange={handleChange}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="ar">🇪🇬 Arabic</option>
                </select>
              </div>

              <button type="submit" className="btn-save" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .profile-container { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }
        .profile-header h2 { font-size: 2rem; color: white; margin-bottom: 0.4rem; }
        .profile-header p { color: var(--text-secondary); }
        .profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
        @media(max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }

        .profile-sidebar { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .avatar-section { position: relative; cursor: pointer; }
        .avatar-img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); }
        .avatar-placeholder { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #60a5fa); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: white; border: 3px solid rgba(255,255,255,0.1); }
        .avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.2s; }
        .avatar-section:hover .avatar-overlay { opacity: 1; }

        .profile-info { text-align: center; }
        .profile-info h3 { color: white; font-size: 1.15rem; margin-bottom: 0.4rem; }
        .email { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--text-secondary); font-size: 0.85rem; }
        .role-badge { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.6rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .role-badge.admin { background: rgba(139,92,246,0.2); color: #C4B5FD; border: 1px solid rgba(139,92,246,0.4); }
        .role-badge.user { background: rgba(59,130,246,0.2); color: #93C5FD; border: 1px solid rgba(59,130,246,0.4); }

        .profile-meta { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 1rem; }
        .meta-item { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
        .meta-label { color: var(--text-secondary); font-size: 0.82rem; }
        .meta-value { color: white; font-size: 0.85rem; font-weight: 500; }

        .profile-form-panel { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 2rem; }
        .panel-header { display: flex; align-items: center; gap: 0.6rem; color: white; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
        .panel-header h3 { font-size: 1.1rem; }

        .edit-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.45rem; }
        .form-group label { color: var(--text-secondary); font-size: 0.88rem; font-weight: 500; }
        .form-group input, .form-group textarea, .form-group select { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; color: white; padding: 0.7rem 1rem; font-size: 0.95rem; transition: border-color 0.2s; resize: vertical; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: var(--primary); }

        .btn-save { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 10px; background: var(--primary); color: white; font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; transition: 0.2s; align-self: flex-start; }
        .btn-save:hover:not(:disabled) { background: var(--primary-hover); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        .success-banner { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); color: #6EE7B7; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; }
        .error-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #FCA5A5; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; }
        .muted { color: var(--text-secondary); font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
