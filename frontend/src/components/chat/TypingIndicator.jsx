import React from 'react';

export default function TypingIndicator({ label }) {
  if (!label) return null;
  return (
    <div className="typing-indicator-wrap">
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="typing-label">{label}</span>
    </div>
  );
}
