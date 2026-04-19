import React from 'react';
import { VoiceActionButton } from './VoiceActionButton';
import { useVoiceToWrite } from '../hooks/useVoiceToWrite';
import { useLanguage } from '../lib/LanguageContext';

export function VoiceButton({ language = 'ar-EG', onTranscript }) {
  const { t } = useLanguage();
  const { isListening, isProcessing, isSupported, error, startRecognition, clearError } =
    useVoiceToWrite({ language, onTranscription: onTranscript });

  return (
    <VoiceActionButton
      label={t('voiceToText')}
      title="Click and speak to convert your voice into chat text."
      isListening={isListening}
      isProcessing={isProcessing}
      isSupported={isSupported}
      error={error}
      onStart={() => { clearError(); startRecognition(); }}
      onClearError={clearError}
    />
  );
}
