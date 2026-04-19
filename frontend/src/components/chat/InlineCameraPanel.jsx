import React, { useEffect, useState } from 'react';
import {
  Camera, StopCircle, Send, RefreshCw, CheckCircle, Loader2, X
} from 'lucide-react';
import { useAICamera } from '../../hooks/useAICamera';
import { useLanguage } from '../../lib/LanguageContext';

export default function InlineCameraPanel({
  open,
  onClose,
  onAppendText,
  onSendSign,
  disabled,
}) {
  const {
    videoRef,
    canvasRef,
    isCapturing,
    detectedText,
    confidence,
    status,
    modelReady,
    rtConnected,
    startCamera,
    stopCamera,
    clearTranslation,
    getLatestText,
  } = useAICamera();

  const { t } = useLanguage();
  const [stableText, setStableText] = useState('');
  const [autoApplyLabel, setAutoApplyLabel] = useState('');

  useEffect(() => {
    if (!open) {
      setStableText('');
      setAutoApplyLabel('');
      if (isCapturing) stopCamera();
      return;
    }
    if (!disabled && modelReady && !isCapturing) {
      startCamera();
    }
  }, [open, disabled, modelReady]);

  useEffect(() => {
    if (!open) return;
    if (!detectedText?.trim()) return;

    const timer = setTimeout(() => {
      const latest = getLatestText()?.trim();
      if (!latest) return;
      setStableText(latest);
      setAutoApplyLabel(latest);
      onAppendText?.(latest);
    }, 900);

    return () => clearTimeout(timer);
  }, [detectedText, open]);

  const handleSendNow = () => {
    const latest = getLatestText()?.trim();
    if (!latest) return;
    onAppendText?.(latest);
  };

  const handleSendAsSign = () => {
    const latest = getLatestText()?.trim();
    if (!latest) return;
    onSendSign?.({
      sourceText: latest,
      text: latest,
      signs: [],
      segments: [],
      matchedWords: [],
      missingWords: [],
    });
    onClose?.();
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="inline-camera-panel animate-slide-up">
      <div className="inline-camera-topbar">
        <div>
          <p className="inline-camera-title">Sign camera</p>
          <p className="inline-camera-status">
            <span className={`inline-camera-dot ${rtConnected ? 'online' : 'offline'}`} />
            {status}
          </p>
        </div>
        <button type="button" className="btn-ghost inline-camera-close" onClick={handleClose}>
          <X size={16} />
        </button>
      </div>

      <div className="inline-camera-stage">
        <video ref={videoRef} autoPlay playsInline muted className="inline-camera-video" />
        <canvas ref={canvasRef} className="inline-camera-canvas" />

        {!isCapturing && (
          <div className="inline-camera-overlay">
            <button
              type="button"
              className="btn-primary"
              onClick={startCamera}
              disabled={!modelReady || disabled}
            >
              <Camera size={15} />
              {modelReady ? t('startRecognition') : t('loadingModel')}
            </button>
          </div>
        )}

        <div className="inline-camera-preview-chip">
          {detectedText?.trim() || 'Waiting for sign...'}
        </div>
      </div>

      <div className="inline-camera-meta">
        <span className="badge-green">
          <CheckCircle size={12} /> {confidence}%
        </span>
        {autoApplyLabel && (
          <span className="inline-camera-autofill">Added to input: {autoApplyLabel}</span>
        )}
      </div>

      <div className="inline-camera-actions">
        <button type="button" className="btn-secondary" onClick={clearTranslation}>
          <RefreshCw size={15} /> {t('clear')}
        </button>
        <button type="button" className="btn-secondary" onClick={handleSendNow} disabled={!stableText}>
          <Loader2 size={15} className="spinner" /> Add text
        </button>
        <button type="button" className="btn-primary" onClick={handleSendAsSign} disabled={!stableText}>
          <Send size={15} /> Send sign
        </button>
        <button type="button" className="btn-danger" onClick={stopCamera} disabled={!isCapturing}>
          <StopCircle size={15} /> {t('stopCamera')}
        </button>
      </div>
    </div>
  );
}
