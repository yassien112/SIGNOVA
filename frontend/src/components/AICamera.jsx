import React from 'react';
import { Camera, RefreshCw, Send, CheckCircle, Zap, StopCircle } from 'lucide-react';
import { useAICamera } from '../hooks/useAICamera';
import { useLanguage } from '../lib/LanguageContext';
import { useNavigate } from 'react-router-dom';

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
    // Store pending message in sessionStorage then redirect to chat
    sessionStorage.setItem('signova_pending_sign', JSON.stringify({
      sourceText: text,
      text,
      signs: [],
      segments: [],
      matchedWords: [],
      missingWords: [],
    }));
    clearTranslation();
    navigate('/chat');
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">

      {/* Header */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white">{t('aiTranslator')}</h2>
        <p className="text-gray-400 text-sm">{t('aiSubtitle')}</p>

        {/* Status row */}
        <div className="flex items-center justify-center gap-3 flex-wrap mt-1">
          <span className="text-gray-400 text-sm">{status}</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                           ${ rtConnected
                               ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40'
                               : 'bg-red-900/20 text-red-400 border border-red-700/40'
                           }`}>
            <Zap size={12} />
            {rtConnected ? t('realtimeOnline') : t('realtimeOffline')}
          </span>
        </div>
      </div>

      {/* Camera */}
      <div className="relative bg-gray-800 border-2 border-gray-700 rounded-2xl overflow-hidden
                      flex justify-center items-center min-h-[360px]
                      shadow-xl shadow-black/50">
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }}
          width="640" height="360"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ transform: 'scaleX(-1)' }}
          width="640" height="360"
        />

        {/* Overlay when camera is off */}
        {!isCapturing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5
                          bg-gray-900/80 backdrop-blur-sm z-20">
            <Camera size={52} className="text-gray-600" />
            <button
              onClick={startCamera}
              disabled={!modelReady}
              className="btn-primary text-base px-6 py-3 rounded-xl shadow-lg
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:-translate-y-0.5 transition-all"
            >
              {modelReady ? t('startRecognition') : t('loadingModel')}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="card flex flex-col gap-4">
        {/* Translation box */}
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-4 min-h-[90px]">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            {t('detectedTranslation')}
          </p>
          <p className="text-white text-xl font-medium">
            {detectedText || <span className="text-gray-600">{t('waitingForSigns')}</span>}
          </p>
          {confidence > 0 && isCapturing && (
            <span className="absolute top-3 end-3 inline-flex items-center gap-1
                             bg-emerald-900/30 text-emerald-400 border border-emerald-700/40
                             px-2.5 py-1 rounded-full text-xs font-semibold">
              <CheckCircle size={12} />
              {confidence}%
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            onClick={clearTranslation}
            className="btn-secondary"
          >
            <RefreshCw size={16} />
            {t('clear')}
          </button>
          <button
            onClick={handleSendToChat}
            disabled={!detectedText}
            className="btn-primary"
          >
            <Send size={16} />
            {t('sendToChat')}
          </button>
          <button
            onClick={stopCamera}
            disabled={!isCapturing}
            className="btn-danger"
          >
            <StopCircle size={16} />
            {t('stopCamera')}
          </button>
        </div>
      </div>
    </div>
  );
}
