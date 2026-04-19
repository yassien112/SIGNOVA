import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera, StopCircle, Send, RefreshCw, CheckCircle, Loader2, X, Zap
} from 'lucide-react';
import { useAICamera } from '../../hooks/useAICamera';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuthStore } from '../../store/authStore';
import { TEXT_TO_SIGN_API_URL } from '../../lib/config';

const STABLE_DELAY_MS  = 900;   // ms before auto-appending to input
const APPEND_COOLDOWN_MS = 2500; // min gap between auto-appends of same phrase

export default function InlineCameraPanel({
  open,
  onClose,
  onAppendText,
  onSendSign,
  disabled,
}) {
  const {
    videoRef, canvasRef,
    isCapturing, detectedText, confidence,
    status, modelReady, rtConnected,
    startCamera, stopCamera, clearTranslation, getLatestText,
  } = useAICamera();

  const { t }     = useLanguage();
  const { token } = useAuthStore();

  /* ── stable-text tracking ── */
  const lastAppended   = useRef('');      // last phrase sent to input
  const lastAppendedAt = useRef(0);      // timestamp of last append
  const stableTimer    = useRef(null);   // debounce handle
  const [displayAdded, setDisplayAdded] = useState('');

  /* ── send-as-sign state ── */
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  /* open / close side-effects */
  useEffect(() => {
    if (!open) {
      clearTimeout(stableTimer.current);
      stableTimer.current = null;
      lastAppended.current   = '';
      lastAppendedAt.current = 0;
      setDisplayAdded('');
      setSendErr('');
      if (isCapturing) stopCamera();
      return;
    }
    if (!disabled && modelReady && !isCapturing) startCamera();
  }, [open, disabled, modelReady]);

  /* smart auto-append: fires only when text is NEW and stable */
  useEffect(() => {
    if (!open) return;
    const raw = detectedText?.trim();
    if (!raw) return;

    clearTimeout(stableTimer.current);
    stableTimer.current = setTimeout(() => {
      const latest  = getLatestText()?.trim();
      if (!latest) return;

      const now  = Date.now();
      const same = latest === lastAppended.current;
      const tooSoon = now - lastAppendedAt.current < APPEND_COOLDOWN_MS;

      if (same && tooSoon) return;   // skip: same phrase too soon

      lastAppended.current   = latest;
      lastAppendedAt.current = now;
      setDisplayAdded(latest);
      onAppendText?.(latest);

      // clear the chip label after 3 s
      setTimeout(() => setDisplayAdded(''), 3000);
    }, STABLE_DELAY_MS);

    return () => clearTimeout(stableTimer.current);
  }, [detectedText, open]);

  /* send current text as real sign-language card via text-to-sign API */
  const handleSendAsSign = useCallback(async () => {
    const latest = getLatestText()?.trim();
    if (!latest || sending) return;

    setSending(true);
    setSendErr('');

    try {
      const res = await fetch(TEXT_TO_SIGN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: latest }),
      });

      const payload = res.ok ? await res.json().catch(() => ({})) : {};

      onSendSign?.({
        sourceText: latest,
        text:         payload.text         ?? latest,
        signs:        payload.signs        ?? [],
        segments:     payload.segments     ?? [],
        matchedWords: payload.matchedWords ?? [],
        missingWords: payload.missingWords ?? [],
      });

      clearTranslation();
      lastAppended.current   = '';
      lastAppendedAt.current = 0;
      setDisplayAdded('');
      onClose?.();
    } catch {
      setSendErr('Could not fetch sign images — sending as text.');
      onSendSign?.({
        sourceText: latest, text: latest,
        signs: [], segments: [], matchedWords: [], missingWords: [],
      });
      onClose?.();
    } finally {
      setSending(false);
    }
  }, [getLatestText, sending, token, onSendSign, clearTranslation, onClose]);

  /* add text to input manually (without auto-timing) */
  const handleAddToInput = useCallback(() => {
    const latest = getLatestText()?.trim();
    if (!latest) return;
    lastAppended.current   = latest;
    lastAppendedAt.current = Date.now();
    setDisplayAdded(latest);
    onAppendText?.(latest);
    setTimeout(() => setDisplayAdded(''), 3000);
  }, [getLatestText, onAppendText]);

  const handleClose = () => { stopCamera(); onClose?.(); };

  if (!open) return null;

  const hasText = !!getLatestText()?.trim();

  return (
    <div className="inline-camera-panel animate-slide-up">

      {/* Top bar */}
      <div className="inline-camera-topbar">
        <div>
          <p className="inline-camera-title">Sign camera</p>
          <p className="inline-camera-status">
            <span className={`inline-camera-dot ${rtConnected ? 'online' : 'offline'}`} />
            {status}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.375rem', alignItems: 'center' }}>
          <span className={`inline-camera-rt-badge ${rtConnected ? 'connected' : 'disconnected'}`}>
            <Zap size={11} />
            {rtConnected ? 'Realtime' : 'Local'}
          </span>
          <button type="button" className="btn-ghost inline-camera-close" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Video stage */}
      <div className="inline-camera-stage">
        <video ref={videoRef} autoPlay playsInline muted className="inline-camera-video" />
        <canvas ref={canvasRef} className="inline-camera-canvas" />

        {/* Start overlay */}
        {!isCapturing && (
          <div className="inline-camera-overlay">
            <button
              type="button"
              className="btn-primary"
              onClick={startCamera}
              disabled={!modelReady || disabled}
            >
              {modelReady ? <><Camera size={15} /> Start</> : <><Loader2 size={15} className="spinner" /> Loading...</>}
            </button>
          </div>
        )}

        {/* Live translation chip */}
        <div className={`inline-camera-preview-chip${detectedText ? ' has-text' : ''}`}>
          {detectedText?.trim() || <span style={{ opacity: .45 }}>Waiting for sign...</span>}
        </div>

        {/* Confidence */}
        {confidence > 0 && isCapturing && (
          <div className="inline-camera-confidence">
            <CheckCircle size={11} /> {confidence}%
          </div>
        )}
      </div>

      {/* Auto-append feedback */}
      {displayAdded && (
        <div className="inline-camera-feedback">
          ✓ Added to message: <strong>{displayAdded}</strong>
        </div>
      )}

      {sendErr && <p className="inline-camera-err">{sendErr}</p>}

      {/* Actions */}
      <div className="inline-camera-actions">
        <button type="button" className="btn-secondary" onClick={clearTranslation} disabled={!hasText}>
          <RefreshCw size={14} /> Clear
        </button>

        <button type="button" className="btn-secondary" onClick={handleAddToInput} disabled={!hasText}>
          <Send size={14} /> Add to input
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSendAsSign}
          disabled={!hasText || sending}
          title="Convert to sign images and send"
        >
          {sending
            ? <><Loader2 size={14} className="spinner" /> Sending...</>
            : <><Send size={14} /> Send as sign</>}
        </button>

        <button type="button" className="btn-danger" onClick={stopCamera} disabled={!isCapturing}
          style={{ marginLeft: 'auto' }}>
          <StopCircle size={14} />
        </button>
      </div>
    </div>
  );
}
