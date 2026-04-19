import React, { useRef, useState } from 'react';
import { Send, Smile, Mic, Hand } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { VoiceButton } from '../VoiceButton';
import { VoiceToSignButton } from '../VoiceToSignButton';

const MODES = { TEXT: 'text', SIGN: 'sign' };

export default function ChatInput({ onSendText, onSendSign, disabled }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState(MODES.TEXT);

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

  return (
    <div className="chat-input-wrap">
      {/* Mode + Voice row */}
      <div className="chat-input-toolbar">
        {/* Mode toggle */}
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

        {/* Voice action button */}
        <div className="chat-voice-action">
          {mode === MODES.TEXT
            ? <VoiceButton language="ar-EG" onTranscript={handleVoiceTranscript} />
            : <VoiceToSignButton language="ar-EG" onSignReady={onSendSign} />
          }
        </div>
      </div>

      {/* Composer */}
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
