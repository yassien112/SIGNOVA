import React from 'react';
import { VoiceActionButton } from './VoiceActionButton';
import { useVoiceToSign } from '../hooks/useVoiceToSign';

export function VoiceToSignButton({ language = 'ar-EG', onSignReady }) {
  const {
    isListening,
    isProcessing,
    isSupported,
    error,
    startRecognition,
    clearError
  } = useVoiceToSign({
    language,
    onSignReady
  });

  const handleVoiceClick = () => {
    clearError();
    startRecognition();
  };

  return (
    <VoiceActionButton
      label={'\uD83C\uDFA4\uD83E\uDD1F Voice to Sign'}
      title="Click and speak to turn your voice into sign animations."
      isListening={isListening}
      isProcessing={isProcessing}
      isSupported={isSupported}
      error={error}
      onStart={handleVoiceClick}
      onClearError={clearError}
    />
  );
}
