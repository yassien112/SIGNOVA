import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';

export default function AvatarUpload({ currentAvatar, userName, size = 80 }) {
  const { uploadAvatar, removeAvatar, isSaving } = useProfileStore();
  const fileRef  = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error,   setError]   = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) { setError('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('Image must be under 5MB'); return; }

    setError('');
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    try {
      await uploadAvatar(file);
      setPreview(null);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreview(null);
    }
  };

  const handleRemove = async () => {
    setError('');
    setPreview(null);
    await removeAvatar();
  };

  const displaySrc = preview || currentAvatar;
  const initials   = userName
    ? userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="avatar-upload-wrap" style={{ '--avatar-size': `${size}px` }}>
      <div className="avatar-upload-ring" onClick={() => fileRef.current?.click()}>
        {displaySrc ? (
          <img src={displaySrc} alt={userName} className="avatar-upload-img" />
        ) : (
          <div className="avatar-upload-placeholder">
            {initials || <User size={size * 0.4} />}
          </div>
        )}

        <div className="avatar-upload-overlay">
          {isSaving
            ? <Loader2 size={20} className="spin" />
            : <Camera size={20} />
          }
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
        disabled={isSaving}
      />

      {displaySrc && !isSaving && (
        <button
          type="button"
          className="avatar-remove-btn"
          onClick={handleRemove}
          title="Remove avatar"
        >
          <Trash2 size={13} />
        </button>
      )}

      {error && <span className="avatar-upload-error">{error}</span>}
    </div>
  );
}
