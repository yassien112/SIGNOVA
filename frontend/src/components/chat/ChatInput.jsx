import React, { useRef, useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { VoiceButton } from '../VoiceButton';
import { VoiceToSignButton } from '../VoiceToSignButton';

const MODES = { TEXT: 'text', SIGN: 'sign' };

export default function ChatInput({ onSendText, onSendSign, disabled }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [text,      setText]      = useState('');
  const [voiceLang, setVoiceLang] = useState('ar-EG');
  const [mode,      setMode]      = useState(MODES.TEXT);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendText(text); setText('');
  };

  const handleVoiceTranscript = (transcript) => {
    setText((prev) => prev.trim() ? `${prev.trimEnd()} ${transcript}` : transcript);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="chat-input-wrap">
      <div className="chat-input-toolbar">
        <div className="chat-input-toolbar-left">
          <label className="chat-lang-label">
            <span>{t('language')}</span>
            <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} className="chat-lang-select">
              <option value="ar-EG">{t('arabic')} (EG)</option>
              <option value="en-US">{t('english')} (US)</option>
            </select>
          </label>
          <div className="chat-mode-toggle">
            {Object.values(MODES).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`chat-mode-btn${mode === m ? ' active' : ''}`}>
                {m === MODES.TEXT ? t('voiceToText') : t('voiceToSign')}
              </button>
            ))}
          </div>
        </div>
        {mode === MODES.TEXT
          ? <VoiceButton language={voiceLang} onTranscript={handleVoiceTranscript} />
          : <VoiceToSignButton language={voiceLang} onSignReady={onSendSign} />
        }
      </div>

      <form onSubmit={handleSubmit} className="chat-composer">
        <button type="button" className="btn-ghost" style={{padding:'.5rem',borderRadius:'12px',flexShrink:0}} disabled={disabled}>
          <Paperclip size={20} />
        </button>
        <div className="chat-input-box">
          <button type="button" style={{color:'#6b7280',background:'none',border:'none',cursor:'pointer',flexShrink:0,display:'flex'}}>
            <Smile size={18} />
          </button>
          <input ref={inputRef} type="text" value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? '' : t('typeMessage')}
            disabled={disabled} autoComplete="off" />
        </div>
        <button type="submit" disabled={!text.trim() || disabled} className="chat-send-btn">
          <Send size={16} />
          <span>{t('send')}</span>
        </button>
      </form>
    </div>
  );
}
