import React, { useState } from 'react';
import {
  Camera, RefreshCw, Send, CheckCircle, Zap, StopCircle, Loader2
} from 'lucide-react';
import { useAICamera } from '../hooks/useAICamera';
import { useLanguage } from '../lib/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TEXT_TO_SIGN_API_URL } from '../lib/config';
import '../styles/AICamera.css';

export default function AICamera() {
  const {
    videoRef, canvasRef,
    isCapturing, detectedText, confidence, status, modelReady, rtConnected,
    startCamera, stopCamera, clearTranslation, getLatestText,
  } = useAICamera();

  const { t }       = useLanguage();
  const navigate    = useNavigate();
  const { token }   = useAuthStore();
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const handleSendToChat = async () => {
    const text = getLatestText();
    if (!text) return;

    setSending(true);
    setSendErr('');

    try {
      // Convert detected text → sign images before navigating to chat
      const res = await fetch(TEXT_TO_SIGN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text })
      });

      const payload = res.ok ? await res.json().catch(() => ({})) : {};

      sessionStorage.setItem(
        'signova_pending_sign',
        JSON.stringify({
          sourceText: text,
          text: payload.text ?? text,
          signs:        payload.signs        ?? [],
          segments:     payload.segments     ?? [],
          matchedWords: payload.matchedWords ?? [],
          missingWords: payload.missingWords ?? [],
        })
      );

      clearTranslation();
      navigate('/chat');
    } catch {
      setSendErr('Could not prepare signs. Sending as text.');
      // Fallback: send as plain text sign
      sessionStorage.setItem(
        'signova_pending_sign',
        JSON.stringify({ sourceText: text, text, signs: [], segments: [], matchedWords: [], missingWords: [] })
      );
      clearTranslation();
      navigate('/chat');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ai-camera-page">
      {/* Header */}
      <div className="ai-camera-header">
        <h2 className="ai-camera-title">{t('aiTranslator')}</h2>
        <p className="ai-camera-subtitle">{t('aiSubtitle')}</p>
        <div className="ai-camera-status-row">
          <span className="ai-status-text">{status}</span>
          <span className={`ai-badge ${rtConnected ? 'online' : 'offline'}`}>
            <Zap size={12} />
            {rtConnected ? t('realtimeOnline') : t('realtimeOffline')}
          </span>
        </div>
      </div>

      {/* Camera viewport */}
      <div
        className={`ai-camera-viewport${isCapturing ? ' active' : ''}`}
        style={{ position: 'relative', width: '100%', height: '100%' }}>

        <video
          className="ai-video"
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
        />

        {isCapturing && (
          <>
            <div className="ai-scan-line" />
            <div className="ai-bracket tl" />
            <div className="ai-bracket tr" />
            <div className="ai-bracket bl" />
            <div className="ai-bracket br" />
          </>
        )}

        {!isCapturing && (
          <div className="ai-camera-overlay">
            <Camera size={52} className="ai-camera-icon" />
            <button onClick={startCamera} disabled={!modelReady} className="btn-primary"
              style={{ fontSize: '1rem', padding: '.75rem 1.5rem', borderRadius: '12px' }}>
              {modelReady ? t('startRecognition') : t('loadingModel')}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="ai-controls">
        <div className={`ai-result-box${detectedText ? ' has-text' : ''}`}>
          <p className="ai-result-label">{t('detectedTranslation')}</p>
          <p className="ai-result-text">
            {detectedText
              ? detectedText
              : <span className="ai-result-empty">{t('waitingForSigns')}</span>}
          </p>
          {confidence > 0 && isCapturing && (
            <span className="ai-confidence">
              <CheckCircle size={12} />
              {confidence}%
            </span>
          )}
        </div>

        {sendErr && (
          <p style={{ color: '#f87171', fontSize: '.75rem', textAlign: 'center' }}>{sendErr}</p>
        )}

        <div className="ai-actions">
          <button onClick={clearTranslation} className="btn-secondary">
            <RefreshCw size={16} />
            {t('clear')}
          </button>

          <button onClick={handleSendToChat} disabled={!detectedText || sending} className="btn-primary">
            {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {sending ? t('loading') : t('sendToChat')}
          </button>

          <button onClick={stopCamera} disabled={!isCapturing} className="btn-danger">
            <StopCircle size={16} />
            {t('stopCamera')}
          </button>
        </div>
      </div>
    </div>
  );
}
