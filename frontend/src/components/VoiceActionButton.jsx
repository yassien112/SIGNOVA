import React from 'react';
import { LoaderCircle, Mic } from 'lucide-react';
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`voice-write-btn ${isListening ? 'recording' : ''}`}
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
                <span className="text-xs text-gray-400">Listening...</span>
              </>
            ) : (
              <>
                <LoaderCircle size={12} className="spinner text-gray-400" aria-hidden="true" />
                <span className="text-xs text-gray-400">Processing...</span>
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
            className="text-red-400 hover:text-red-300 font-bold text-base leading-none"
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
