import React from 'react';
import { LoaderCircle, Mic } from 'lucide-react';

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
    <div className="voice-button-panel">
      <div className="composer-voice-cluster" aria-label={`${label} controls`}>
        <button
          type="button"
          className={`voice-write-btn${isListening ? ' recording' : ''}`}
          onClick={onStart}
          disabled={!isSupported || isBusy}
          title={!isSupported ? 'Voice input is not supported in this browser.' : title}
        >
          <Mic size={15} aria-hidden="true" />
          <span className="voice-btn-label">{label}</span>
        </button>

        {isBusy && (
          <div className="voice-inline-status" role="status" aria-live="polite">
            {isListening ? (
              <>
                <span className="recording-dot" aria-hidden="true" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <LoaderCircle size={13} className="spinner" aria-hidden="true" />
                <span>Processing...</span>
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
            className="voice-error-dismiss"
            onClick={onClearError}
            aria-label="Dismiss voice error"
          >
            {'\u00D7'}
          </button>
        </div>
      )}
    </div>
  );
}
