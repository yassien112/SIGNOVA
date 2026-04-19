import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Save, Camera } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    preferredLang: user?.preferredLang || 'en',
  });
  const [fetching, setFetching] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.get('/api/profile/me')
      .then((data) => {
        const u = data.user;
        updateUser(u);
        setForm({ name: u.name || '', bio: u.bio || '', avatar: u.avatar || '', preferredLang: u.preferredLang || 'en' });
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSuccess(false); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);
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

  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page-wrapper flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="page-title">{t('myProfile')}</h1>
        <p className="page-subtitle">{t('manageAccount')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5 items-start">
        {/* Sidebar */}
        <div className="card flex flex-col items-center gap-4 text-center">
          {/* Avatar */}
          <div className="relative cursor-pointer group">
            {form.avatar ? (
              <img src={form.avatar} alt={form.name}
                   className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-600" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-700 to-blue-500
                              flex items-center justify-center text-white text-3xl font-bold
                              ring-2 ring-blue-800">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition">
              <Camera size={20} className="text-white" />
            </div>
          </div>

          <div>
            <p className="text-white font-semibold text-base">{user?.name}</p>
            <p className="text-gray-400 text-sm flex items-center justify-center gap-1 mt-0.5">
              <Mail size={13} /> {user?.email}
            </p>
            <span className={`mt-2 inline-flex ${ user?.role === 'Admin' ? 'badge-purple' : 'badge-blue' }`}>
              <Shield size={11} /> {user?.role}
            </span>
          </div>

          <div className="w-full border-t border-gray-700 pt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>{t('memberSince')}</span>
              <span className="text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short' })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>{t('preferredLanguage')}</span>
              <span className="text-white">{form.preferredLang === 'ar' ? t('arabic') : t('english')}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <div className="panel-header">
            <h3 className="panel-title flex items-center gap-2"><User size={17} /> {t('editProfile')}</h3>
          </div>

          {fetching ? (
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {success && <div className="alert-success">{t('saveChanges')} — done!</div>}
              {error   && <div className="alert-error">{error}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-sm font-medium">{t('fullName')}</label>
                <input name="name" value={form.name} onChange={handleChange}
                       className="field" placeholder={t('fullName')} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-sm font-medium">{t('avatarUrl')}</label>
                <input name="avatar" type="url" value={form.avatar} onChange={handleChange}
                       className="field" placeholder="https://example.com/photo.jpg" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-sm font-medium">{t('bio')}</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                          className="field resize-none" placeholder={t('bio')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-sm font-medium">{t('preferredLanguage')}</label>
                <select name="preferredLang" value={form.preferredLang} onChange={handleChange} className="field">
                  <option value="en">{t('english')}</option>
                  <option value="ar">{t('arabic')}</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn-primary self-start">
                <Save size={15} />
                {loading ? t('saving') : t('saveChanges')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
