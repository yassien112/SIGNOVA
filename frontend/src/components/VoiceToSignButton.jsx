import React from 'react';
import { VoiceActionButton } from './VoiceActionButton';
import { useVoiceToSign } from '../hooks/useVoiceToSign';
import { useLanguage } from '../lib/LanguageContext';

export function VoiceToSignButton({ language = 'ar-EG', onSignReady }) {
  const { t } = useLanguage();
  const {
    isListening,
    isProcessing,
    isSupported,
    error,
    startRecognition,
    clearError,
  } = useVoiceToSign({ language, onSignReady });

  return (
    <VoiceActionButton
      label={t('voiceToSign')}
      title="Click and speak to convert your voice into sign language."
      isListening={isListening}
      isProcessing={isProcessing}
      isSupported={isSupported}
      error={error}
      onStart={() => { clearError(); startRecognition(); }}
      onClearError={clearError}
    />
  );
}
