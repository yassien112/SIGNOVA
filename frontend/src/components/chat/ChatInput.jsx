import React, { useRef, useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { VoiceButton } from '../VoiceButton';
import { VoiceToSignButton } from '../VoiceToSignButton';

const MODES = { TEXT: 'text', SIGN: 'sign' };

export default function ChatInput({ onSendText, onSendSign, disabled }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [text, setText]       = useState('');
  const [voiceLang, setVoiceLang] = useState('ar-EG');
  const [mode, setMode]       = useState(MODES.TEXT);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendText(text);
    setText('');
  };

  const handleVoiceTranscript = (transcript) => {
    setText((prev) => prev.trim() ? `${prev.trimEnd()} ${transcript}` : transcript);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800 px-4 py-3 flex flex-col gap-2.5">
      {/* Voice row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language select */}
          <label className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>{t('language')}</span>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-md text-white text-xs px-2 py-1"
            >
              <option value="ar-EG">{t('arabic')} (EG)</option>
              <option value="en-US">{t('english')} (US)</option>
            </select>
          </label>

          {/* Mode toggle */}
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-full p-0.5">
            {Object.values(MODES).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200
                            ${ mode === m
                                ? 'bg-blue-900/50 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
              >
                {m === MODES.TEXT ? t('voiceToText') : t('voiceToSign')}
              </button>
            ))}
          </div>
        </div>

        {/* Voice button */}
        {mode === MODES.TEXT
          ? <VoiceButton language={voiceLang} onTranscript={handleVoiceTranscript} />
          : <VoiceToSignButton language={voiceLang} onSignReady={onSendSign} />
        }
      </div>

      {/* Text composer */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button type="button" className="btn-ghost p-2 rounded-xl flex-shrink-0" disabled={disabled}>
          <Paperclip size={20} />
        </button>

        <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 rounded-2xl
                        px-4 py-2 gap-2 focus-within:border-blue-600 transition">
          <button type="button" className="text-gray-500 hover:text-gray-300 transition flex-shrink-0">
            <Smile size={18} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? '' : t('typeMessage')}
            disabled={disabled}
            autoComplete="off"
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="btn-primary rounded-xl px-4 py-2.5 flex-shrink-0"
        >
          <Send size={16} />
          <span className="hidden sm:inline">{t('send')}</span>
        </button>
      </form>
    </div>
  );
}
