import React from 'react';
import { Camera, RefreshCw, Send, CheckCircle, Zap, StopCircle } from 'lucide-react';
import { useAICamera } from '../hooks/useAICamera';
import { useLanguage } from '../lib/LanguageContext';
import { useNavigate } from 'react-router-dom';
import '../styles/AICamera.css';

export default function AICamera() {
  const {
    videoRef, canvasRef,
    isCapturing, detectedText, confidence, status, modelReady, rtConnected,
    startCamera, stopCamera, clearTranslation,
    getLatestText,
  } = useAICamera();

  const { t }    = useLanguage();
  const navigate = useNavigate();

  const handleSendToChat = () => {
    const text = getLatestText();
    if (!text) return;
    sessionStorage.setItem('signova_pending_sign', JSON.stringify({
      sourceText: text, text,
      signs: [], segments: [], matchedWords: [], missingWords: [],
    }));
    clearTranslation();
    navigate('/chat');
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
      <div className={`ai-camera-viewport${isCapturing ? ' active' : ''}`}>
        <video ref={videoRef} autoPlay playsInline muted
          className="ai-video" width="640" height="360" />
        <canvas ref={canvasRef} className="ai-canvas" width="640" height="360" />

        {/* Corner brackets when active */}
        {isCapturing && (
          <>
            <div className="ai-scan-line" />
            <div className="ai-bracket tl" />
            <div className="ai-bracket tr" />
            <div className="ai-bracket bl" />
            <div className="ai-bracket br" />
          </>
        )}

        {/* Overlay when camera is off */}
        {!isCapturing && (
          <div className="ai-camera-overlay">
            <Camera size={52} className="ai-camera-icon" />
            <button onClick={startCamera} disabled={!modelReady} className="btn-primary"
              style={{fontSize:'1rem',padding:'.75rem 1.5rem',borderRadius:'12px'}}>
              {modelReady ? t('startRecognition') : t('loadingModel')}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="ai-controls">
        {/* Result box */}
        <div className={`ai-result-box${detectedText ? ' has-text' : ''}`}>
          <p className="ai-result-label">{t('detectedTranslation')}</p>
          <p className="ai-result-text">
            {detectedText
              ? detectedText
              : <span className="ai-result-empty">{t('waitingForSigns')}</span>
            }
          </p>
          {confidence > 0 && isCapturing && (
            <span className="ai-confidence">
              <CheckCircle size={12} />{confidence}%
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="ai-actions">
          <button onClick={clearTranslation} className="btn-secondary">
            <RefreshCw size={16} />{t('clear')}
          </button>
          <button onClick={handleSendToChat} disabled={!detectedText} className="btn-primary">
            <Send size={16} />{t('sendToChat')}
          </button>
          <button onClick={stopCamera} disabled={!isCapturing} className="btn-danger">
            <StopCircle size={16} />{t('stopCamera')}
          </button>
        </div>
      </div>
    </div>
  );
}
