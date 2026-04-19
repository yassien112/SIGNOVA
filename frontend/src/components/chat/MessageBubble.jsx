import React, { useState } from 'react';
import { Check, CheckCheck, Clock, SmilePlus } from 'lucide-react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusIcon({ status, isMine }) {
  if (!isMine) return null;
  if (status === 'seen')      return <CheckCheck size={12} className="text-blue-400" />;
  if (status === 'delivered') return <CheckCheck size={12} className="opacity-60" />;
  if (status === 'sent')      return <Check size={12} className="opacity-50" />;
  return <Clock size={11} className="opacity-40" />;
}

/* ── Sticker bubble ── */
function StickerBubble({ msg }) {
  return (
    <div className="msg-sticker-wrap">
      {msg.signs?.length > 0 ? (
        <div className="msg-sticker-grid">
          {msg.signs.map((s, i) => (
            <div key={i} className="msg-sticker-card">
              <img
                src={s.thumbUrl || s.imageUrl}
                alt={s.word || s.label}
                className="msg-sticker-img"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="msg-sticker-label">{s.word || s.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="msg-sticker-text">{msg.text}</span>
      )}
    </div>
  );
}

/* ── Sign bubble ── */
function SignBubble({ msg }) {
  return (
    <>
      {msg.text && <span className="msg-sign-source">{msg.text}</span>}
      {msg.signs?.length > 0 && (
        <div className="msg-sign-cards">
          {msg.signs.map((s, i) => (
            <div key={i} className="msg-sign-card">
              <img
                src={s.imageUrl}
                alt={s.word}
                className="msg-sign-img"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="msg-sign-label">{s.word}</span>
            </div>
          ))}
        </div>
      )}
      {msg.missingWords?.length > 0 && (
        <span className="msg-missing-words">No sign for: {msg.missingWords.join(', ')}</span>
      )}
    </>
  );
}

export default function MessageBubble({ msg, isMine, onToggleReaction }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isSticker = msg.kind === 'sticker';
  const isSign    = msg.kind === 'sign';

  return (
    <div className={`msg-wrapper ${isMine ? 'mine' : 'theirs'}${isSticker ? ' is-sticker' : ''}${isSign ? ' is-sign' : ''}`}>
      {!isMine && <span className="msg-sender-name">{msg.senderName || 'User'}</span>}

      <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}${isSticker ? ' sticker' : ''}`}>

        {isSticker && <StickerBubble msg={msg} />}
        {isSign    && <SignBubble    msg={msg} />}
        {!isSticker && !isSign && <span>{msg.text}</span>}

        <div className="msg-meta-row">
          <span className="msg-time">
            {formatTime(msg.createdAt)}
            <StatusIcon status={msg.status} isMine={isMine} />
          </span>
          <div className="msg-reaction-tools">
            <button
              type="button"
              className="msg-react-btn"
              onClick={() => setPickerOpen((v) => !v)}
              title="React"
            >
              <SmilePlus size={13} />
            </button>
            {pickerOpen && (
              <div className="msg-reaction-picker">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="msg-reaction-option"
                    onClick={() => { onToggleReaction?.(msg.id, emoji); setPickerOpen(false); }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {msg.reactions?.length > 0 && (
        <div className={`msg-reaction-bar ${isMine ? 'mine' : 'theirs'}`}>
          {msg.reactions.map((group) => (
            <button
              key={group.emoji}
              type="button"
              className="msg-reaction-chip"
              onClick={() => onToggleReaction?.(msg.id, group.emoji)}
              title={group.users?.map((u) => u.name).join(', ')}
            >
              <span>{group.emoji}</span>
              <span>{group.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
