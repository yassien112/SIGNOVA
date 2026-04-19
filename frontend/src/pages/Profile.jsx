import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Save, Camera } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import '../styles/Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name:user?.name||'', bio:user?.bio||'', avatar:user?.avatar||'', preferredLang:user?.preferredLang||'en' });
  const [fetching, setFetching] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.get('/api/profile/me')
      .then((data) => { updateUser(data.user); setForm({ name:data.user.name||'', bio:data.user.bio||'', avatar:data.user.avatar||'', preferredLang:data.user.preferredLang||'en' }); })
      .catch(() => {}).finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => { setForm((p)=>({...p,[e.target.name]:e.target.value})); setSuccess(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess(false);
    try { const data = await api.patch('/api/profile/me', form); updateUser(data.user); setSuccess(true); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const initials = (user?.name||'U').split(' ').map((w)=>w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="profile-wrapper">
      <div>
        <h1 className="page-title">{t('myProfile')}</h1>
        <p className="page-subtitle">{t('manageAccount')}</p>
      </div>

      <div className="profile-grid">
        <div className="profile-sidebar">
          <div className="avatar-wrap">
            {form.avatar
              ? <img src={form.avatar} alt={form.name} className="avatar-img" />
              : <div className="avatar-initials">{initials}</div>}
            <div className="avatar-overlay"><Camera size={20} color="white" /></div>
          </div>
          <div>
            <p className="profile-name">{user?.name}</p>
            <p className="profile-email"><Mail size={13} /> {user?.email}</p>
            <span className={`mt-2 ${user?.role==='Admin' ? 'badge-purple' : 'badge-blue'}`} style={{marginTop:'.5rem',display:'inline-flex'}}>
              <Shield size={11} /> {user?.role}
            </span>
          </div>
          <div className="profile-meta">
            <div className="profile-meta-row"><span>{t('memberSince')}</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString([],{year:'numeric',month:'short'}) : '—'}</span>
            </div>
            <div className="profile-meta-row"><span>{t('preferredLanguage')}</span>
              <span>{form.preferredLang==='ar' ? t('arabic') : t('english')}</span>
            </div>
          </div>
        </div>

        <div className="profile-form-card">
          <div className="panel-header">
            <h3 className="panel-title"><User size={17} style={{display:'inline',marginRight:'.5rem'}} />{t('editProfile')}</h3>
          </div>
          {fetching ? <p style={{color:'#6b7280',fontSize:'.875rem'}}>{t('loading')}</p> : (
            <form onSubmit={handleSubmit} className="profile-form">
              {success && <div className="alert-success">{t('saveChanges')} — done!</div>}
              {error   && <div className="alert-error">{error}</div>}
              <div className="form-field">
                <label className="form-label">{t('fullName')}</label>
                <input name="name" value={form.name} onChange={handleChange} className="field" placeholder={t('fullName')} required />
              </div>
              <div className="form-field">
                <label className="form-label">{t('avatarUrl')}</label>
                <input name="avatar" type="url" value={form.avatar} onChange={handleChange} className="field" placeholder="https://example.com/photo.jpg" />
              </div>
              <div className="form-field">
                <label className="form-label">{t('bio')}</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} className="field" style={{resize:'none'}} placeholder={t('bio')} />
              </div>
              <div className="form-field">
                <label className="form-label">{t('preferredLanguage')}</label>
                <select name="preferredLang" value={form.preferredLang} onChange={handleChange} className="field">
                  <option value="en">{t('english')}</option>
                  <option value="ar">{t('arabic')}</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{alignSelf:'flex-start'}}>
                <Save size={15} /> {loading ? t('saving') : t('saveChanges')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
