import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Shield, Save, Loader2 } from 'lucide-react';
import { useAuthStore }   from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useLanguage }    from '../lib/LanguageContext';
import AvatarUpload       from '../components/AvatarUpload';
import '../styles/Profile.css';

export default function Profile() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const { profile, fetchProfile, updateProfile, isSaving, error, clearError } = useProfileStore();
  const { t } = useLanguage();

  const src = profile || user;
  const [form, setForm] = useState({
    name:          src?.name          || '',
    bio:           src?.bio           || '',
    preferredLang: src?.preferredLang || 'en',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name:          profile.name          || '',
        bio:           profile.bio           || '',
        preferredLang: profile.preferredLang || 'en',
      });
    }
  }, [profile?.id]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSuccess(false);
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess(false);
    try {
      await updateProfile(form);
      setSuccess(true);
    } catch { /* error in store */ }
  };

  const displayUser = profile || user;

  return (
    <div className="profile-wrapper">
      <div>
        <h1 className="page-title">{t('myProfile')}</h1>
        <p className="page-subtitle">{t('manageAccount')}</p>
      </div>

      <div className="profile-grid">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <AvatarUpload
            currentAvatar={displayUser?.avatar}
            userName={displayUser?.name}
            size={88}
          />
          <div>
            <p className="profile-name">{displayUser?.name}</p>
            <p className="profile-email"><Mail size={13} /> {displayUser?.email}</p>
            <span className={`mt-2 ${displayUser?.role === 'Admin' ? 'badge-purple' : 'badge-blue'}`}
              style={{ marginTop: '.5rem', display: 'inline-flex' }}>
              <Shield size={11} /> {displayUser?.role}
            </span>
          </div>
          <div className="profile-meta">
            <div className="profile-meta-row">
              <span>{t('memberSince')}</span>
              <span>{displayUser?.createdAt
                ? new Date(displayUser.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short' })
                : '—'}
              </span>
            </div>
            <div className="profile-meta-row">
              <span>{t('preferredLanguage')}</span>
              <span>{form.preferredLang === 'ar' ? t('arabic') : t('english')}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="profile-form-card">
          <div className="panel-header">
            <h3 className="panel-title">{t('editProfile')}</h3>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {success && <div className="alert-success">Profile updated ✓</div>}
            {error   && <div className="alert-error">{error}</div>}

            <div className="form-field">
              <label className="form-label">{t('fullName')}</label>
              <input
                name="name" value={form.name} onChange={handleChange}
                className="field" placeholder={t('fullName')} required
              />
            </div>

            <div className="form-field">
              <label className="form-label">{t('bio')}</label>
              <textarea
                name="bio" value={form.bio} onChange={handleChange}
                rows={3} className="field" style={{ resize: 'none' }}
                placeholder={t('bio')}
              />
            </div>

            <div className="form-field">
              <label className="form-label">{t('preferredLanguage')}</label>
              <select name="preferredLang" value={form.preferredLang} onChange={handleChange} className="field">
                <option value="en">{t('english')}</option>
                <option value="ar">{t('arabic')}</option>
              </select>
            </div>

            <button type="submit" disabled={isSaving} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              {isSaving
                ? <><Loader2 size={14} className="spin" /> {t('saving')}</>
                : <><Save size={14} /> {t('saveChanges')}</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
