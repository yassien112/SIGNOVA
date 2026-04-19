import React from 'react';
import { CheckCheck } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ msg, isMine }) {
  const { t } = useLanguage();
  const isSign       = msg.kind === 'sign';
  const signs        = Array.isArray(msg.signs)        ? msg.signs        : [];
  const segments     = Array.isArray(msg.segments)     ? msg.segments     : [];
  const matchedWords = Array.isArray(msg.matchedWords) ? msg.matchedWords : [];
  const missingWords = Array.isArray(msg.missingWords) ? msg.missingWords : [];

  return (
    <div className={`msg-wrapper ${isMine ? 'mine' : 'theirs'}${isSign ? ' is-sign' : ''}`}>
      {!isMine && (
        <span className="msg-sender-name">
          {msg.senderName || msg.sender?.name || 'User'}
        </span>
      )}
      <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
        {isSign ? (
          <>
            <p style={{fontWeight:600,fontSize:'.875rem',opacity:.9}}>{msg.sourceText || msg.text}</p>
            {signs.length > 0 ? (
              <div className="msg-sign-cards">
                {signs.map((src, i) => (
                  <div key={i} className="msg-sign-card" style={{animationDelay:`${i*80}ms`}}>
                    <img src={src} alt={matchedWords[i] || `Sign ${i+1}`} className="msg-sign-img" loading="lazy" />
                    <span className="msg-sign-label">{segments[i]?.label || matchedWords[i] || `Sign ${i+1}`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{fontSize:'.75rem',opacity:.7}}>No signs found for this phrase.</p>
            )}
            {missingWords.length > 0 && (
              <p style={{fontSize:'.75rem',opacity:.6}}>{t('skipped')}: {missingWords.join(', ')}</p>
            )}
          </>
        ) : (
          <span>{msg.text}</span>
        )}
        <span className="msg-time">
          {formatTime(msg.createdAt)}
          {isMine && <CheckCheck size={11} />}
        </span>
      </div>
    </div>
  );
}
