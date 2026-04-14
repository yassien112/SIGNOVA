import { useCallback, useEffect, useRef, useState } from 'react';

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionConstructor() !== null;
}

function mapRecognitionError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Please allow microphone permission and try again.';
    case 'audio-capture':
      return 'No microphone was found. Please connect a microphone and try again.';
    case 'no-speech':
      return 'No speech was detected. Please speak clearly and try again.';
    case 'network':
      return 'Speech recognition hit a network problem. Please check your connection and try again.';
    case 'aborted':
      return '';
    case 'language-not-supported':
      return 'The selected voice language is not supported by this browser.';
    default:
      return code
        ? `Voice recognition failed (${code}). Please try again.`
        : 'Voice recognition failed. Please try again.';
  }
}

function isInsecureLanOrigin() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    !window.isSecureContext &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  );
}

export function useSpeechRecognition({ language = 'ar-EG', onTranscript } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const callbackPendingRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isInsecureLanOrigin()) {
      setError('Voice features on mobile require HTTPS. Open the secure app link and try again.');
      return;
    }

    if (isListening || isProcessing) {
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setError('');
    callbackPendingRef.current = false;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language || 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setIsProcessing(false);
    };

    recognition.onspeechend = () => {
      setIsListening(false);
      setIsProcessing(true);
      recognition.stop();
    };

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (!transcript) {
        setError('No speech was detected. Please speak clearly and try again.');
        return;
      }

      callbackPendingRef.current = true;
      setIsProcessing(true);

      try {
        await onTranscriptRef.current?.(transcript);
      } catch (transcriptError) {
        setError(transcriptError?.message || 'Could not process the spoken message. Please try again.');
      } finally {
        callbackPendingRef.current = false;
        if (!recognitionRef.current) {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = (event) => {
      const message =
        isInsecureLanOrigin() && (event.error === 'not-allowed' || event.error === 'service-not-allowed')
          ? 'Voice features on mobile require HTTPS. Open the secure app link and try again.'
          : mapRecognitionError(event.error);

      recognitionRef.current = null;
      callbackPendingRef.current = false;
      setIsListening(false);
      setIsProcessing(false);

      if (message) {
        setError(message);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);

      if (!callbackPendingRef.current) {
        setIsProcessing(false);
      }
    };

    try {
      recognition.start();
    } catch (startError) {
      recognitionRef.current = null;
      callbackPendingRef.current = false;
      setIsListening(false);
      setIsProcessing(false);
      setError('Voice recognition could not start. Please try again.');
    }
  }, [language, isListening, isProcessing]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isProcessing,
    isSupported: isSpeechRecognitionSupported(),
    error,
    startRecognition,
    stopRecognition,
    clearError: () => setError('')
  };
}
