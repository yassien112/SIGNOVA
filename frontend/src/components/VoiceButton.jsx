import React from 'react';
import { VoiceActionButton } from './VoiceActionButton';
import { useVoiceToWrite } from '../hooks/useVoiceToWrite';

export function VoiceButton({ language = 'ar-EG', onTranscript }) {
  const {
    isListening,
    isProcessing,
    isSupported,
    error,
    startRecognition,
    clearError,
  } = useVoiceToWrite({
    language,
    onTranscription: onTranscript,
  });

  const handleVoiceClick = () => {
    clearError();
    startRecognition();
  };

  return (
    <VoiceActionButton
      label={'\uD83C\uDFA4 Voice to Write'}
      title="Click and speak to convert your voice into chat text."
      isListening={isListening}
      isProcessing={isProcessing}
      isSupported={isSupported}
      error={error}
      onStart={handleVoiceClick}
      onClearError={clearError}
    />
  );
}
