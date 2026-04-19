import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusIcon({ status, isMine }) {
  if (!isMine) return null;
  if (status === 'seen')      return <CheckCheck size={12} style={{ color: '#60a5fa' }} />;
  if (status === 'delivered') return <CheckCheck size={12} style={{ opacity: .6 }} />;
  if (status === 'sent')      return <Check size={12} style={{ opacity: .5 }} />;
  return <Clock size={11} style={{ opacity: .4 }} />;
}

export default function MessageBubble({ msg, isMine }) {
  const isSign = msg.kind === 'sign';
  return (
    <div className={`msg-wrapper ${isMine ? 'mine' : 'theirs'}${isSign ? ' is-sign' : ''}`}>
      {!isMine && <span className="msg-sender-name">{msg.senderName || 'User'}</span>}

      <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
        {/* text line */}
        {msg.text && !isSign && <span>{msg.text}</span>}

        {/* sign cards */}
        {isSign && (
          <>
            {msg.text && <span style={{ fontSize: '.8rem', opacity: .75 }}>{msg.text}</span>}
            {msg.signs?.length > 0 && (
              <div className="msg-sign-cards">
                {msg.signs.map((s, i) => (
                  <div key={i} className="msg-sign-card">
                    <img src={s.imageUrl} alt={s.word} className="msg-sign-img"
                         onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="msg-sign-label">{s.word}</span>
                  </div>
                ))}
              </div>
            )}
            {msg.missingWords?.length > 0 && (
              <span style={{ fontSize: '.7rem', opacity: .55 }}>
                No sign for: {msg.missingWords.join(', ')}
              </span>
            )}
          </>
        )}

        {/* timestamp + status */}
        <span className="msg-time">
          {formatTime(msg.createdAt)}
          <StatusIcon status={msg.status} isMine={isMine} />
        </span>
      </div>
    </div>
  );
}
