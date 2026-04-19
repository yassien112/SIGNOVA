import React, { useRef, useState } from 'react';
import { Send, Smile, Mic, Hand, Camera } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { VoiceButton } from '../VoiceButton';
import { VoiceToSignButton } from '../VoiceToSignButton';
import InlineCameraPanel from './InlineCameraPanel';

const MODES = { TEXT: 'text', SIGN: 'sign' };

export default function ChatInput({ onSendText, onSendSign, disabled }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState(MODES.TEXT);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendText(text.trim());
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setText((prev) => prev.trim() ? `${prev.trimEnd()} ${transcript}` : transcript);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleAppendCameraText = (transcript) => {
    if (!transcript?.trim()) return;
    setText((prev) => prev.trim() ? `${prev.trimEnd()} ${transcript}` : transcript);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSendCameraSign = (payload) => {
    onSendSign?.(payload);
    setCameraOpen(false);
  };

  return (
    <div className="chat-input-wrap">
      <InlineCameraPanel
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onAppendText={handleAppendCameraText}
        onSendSign={handleSendCameraSign}
        disabled={disabled}
      />

      <div className="chat-input-toolbar">
        <div className="chat-mode-toggle">
          <button
            type="button"
            onClick={() => setMode(MODES.TEXT)}
            className={`chat-mode-btn${mode === MODES.TEXT ? ' active' : ''}`}
            title="Voice to Text"
          >
            <Mic size={13} />
            {t('voiceToText')}
          </button>
          <button
            type="button"
            onClick={() => setMode(MODES.SIGN)}
            className={`chat-mode-btn${mode === MODES.SIGN ? ' active' : ''}`}
            title="Voice to Sign"
          >
            <Hand size={13} />
            {t('voiceToSign')}
          </button>
        </div>

        <div className="chat-voice-action">
          <button
            type="button"
            className={`btn-secondary inline-camera-trigger${cameraOpen ? ' active' : ''}`}
            onClick={() => setCameraOpen((v) => !v)}
            disabled={disabled}
            title="Open sign camera"
          >
            <Camera size={15} />
            <span>Sign Camera</span>
          </button>

          {mode === MODES.TEXT
            ? <VoiceButton language="ar-EG" onTranscript={handleVoiceTranscript} />
            : <VoiceToSignButton language="ar-EG" onSignReady={onSendSign} />
          }
        </div>
      </div>

      <form onSubmit={handleSubmit} className="chat-composer">
        <button
          type="button"
          className="btn-ghost chat-emoji-btn"
          disabled={disabled}
          title="Emoji (coming soon)"
        >
          <Smile size={19} />
        </button>

        <div className="chat-input-box">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={disabled ? 'Select a chat to start messaging' : t('typeMessage')}
            disabled={disabled}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="chat-send-btn"
          title="Send"
        >
          <Send size={16} />
          <span>{t('send')}</span>
        </button>
      </form>
    </div>
  );
}
