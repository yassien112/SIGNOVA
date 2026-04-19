import React from 'react';
import { LoaderCircle, Mic, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export function VoiceActionButton({
  label,
  title,
  isListening,
  isProcessing,
  isSupported,
  error,
  onStart,
  onClearError
}) {
  const isBusy = isListening || isProcessing;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <button
          type="button"
          className={`voice-write-btn${isListening ? ' recording' : ''}`}
          onClick={onStart}
          disabled={!isSupported || isBusy}
          title={!isSupported ? 'Voice input is not supported in this browser.' : title}
        >
          <Mic size={14} aria-hidden="true" />
          <span>{label}</span>
        </button>

        {isBusy && (
          <div className="voice-inline-status" role="status" aria-live="polite">
            {isListening ? (
              <>
                <span className="recording-dot" aria-hidden="true" />
                <span style={{ fontSize:'0.75rem', color:'#9ca3af' }}>Listening...</span>
              </>
            ) : (
              <>
                <LoaderCircle size={12} style={{ color:'#9ca3af', animation:'spin 0.75s linear infinite' }} aria-hidden="true" />
                <span style={{ fontSize:'0.75rem', color:'#9ca3af' }}>Processing...</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="voice-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            style={{ color:'#f87171', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'1rem', lineHeight:1, display:'flex' }}
            onClick={onClearError}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
