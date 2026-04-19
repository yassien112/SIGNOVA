import React, { useRef, useState, useCallback } from 'react';
import { Send, Smile, Mic, Hand, Camera, Sticker } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { VoiceButton } from '../VoiceButton';
import { VoiceToSignButton } from '../VoiceToSignButton';
import InlineCameraPanel from './InlineCameraPanel';
import StickerPicker from './StickerPicker';

const MODES = { TEXT: 'text', SIGN: 'sign' };

export default function ChatInput({ chatId, onSendText, onSendSign, onSendSticker, disabled, onTyping, onStopTyping }) {
  const { t }          = useLanguage();
  const inputRef       = useRef(null);
  const [text, setText]               = useState('');
  const [mode, setMode]               = useState(MODES.TEXT);
  const [cameraOpen, setCameraOpen]   = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);

  const handleChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) onTyping?.();
    else onStopTyping?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendText?.(text.trim());
    setText('');
    onStopTyping?.();
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
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

  const handleSelectSticker = useCallback((sign) => {
    onSendSticker?.(sign);
  }, [onSendSticker]);

  return (
    <div className="chat-input-wrap">

      <InlineCameraPanel
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onAppendText={handleAppendCameraText}
        onSendSign={handleSendCameraSign}
        disabled={disabled}
      />

      <StickerPicker
        isOpen={stickerOpen}
        onClose={() => setStickerOpen(false)}
        onSelectSticker={handleSelectSticker}
      />

      {/* Toolbar */}
      <div className="chat-input-toolbar">
        <div className="chat-mode-toggle">
          <button type="button" onClick={() => setMode(MODES.TEXT)}
            className={`chat-mode-btn${mode === MODES.TEXT ? ' active' : ''}`}>
            <Mic size={13} />{t('voiceToText')}
          </button>
          <button type="button" onClick={() => setMode(MODES.SIGN)}
            className={`chat-mode-btn${mode === MODES.SIGN ? ' active' : ''}`}>
            <Hand size={13} />{t('voiceToSign')}
          </button>
        </div>
        <div className="chat-voice-action">
          <button type="button"
            className={`btn-secondary inline-camera-trigger${cameraOpen ? ' active' : ''}`}
            onClick={() => setCameraOpen((v) => !v)}
            disabled={disabled}
            title="Sign Camera">
            <Camera size={15} /><span>Sign Camera</span>
          </button>
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
          className={`btn-ghost chat-sticker-btn${stickerOpen ? ' active' : ''}`}
          onClick={() => setStickerOpen((v) => !v)}
          disabled={disabled}
          title="Signs & Stickers"
        >
          <Sticker size={19} />
        </button>

        <div className="chat-input-box">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKey}
            onBlur={() => onStopTyping?.()}
            placeholder={disabled ? 'Select a chat…' : t('typeMessage')}
            disabled={disabled}
            autoComplete="off"
          />
        </div>

        <button type="submit" disabled={!text.trim() || disabled} className="chat-send-btn">
          <Send size={16} /><span>{t('send')}</span>
        </button>
      </form>
    </div>
  );
}
