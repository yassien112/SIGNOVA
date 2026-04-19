import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AICamera from '../components/AICamera';

export default function AICameraPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, navigate]);

  // Don't render AICamera until auth is confirmed — prevents unmount/remount
  if (!checked) return null;

  return <AICamera />;
}
