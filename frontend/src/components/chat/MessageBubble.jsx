import React from 'react';
import { CheckCheck } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ msg, isMine }) {
  const { t } = useLanguage();
  const isSign = msg.kind === 'sign';

  const signs        = Array.isArray(msg.signs)        ? msg.signs        : [];
  const segments     = Array.isArray(msg.segments)     ? msg.segments     : [];
  const matchedWords = Array.isArray(msg.matchedWords) ? msg.matchedWords : [];
  const missingWords = Array.isArray(msg.missingWords) ? msg.missingWords : [];

  return (
    <div className={`flex flex-col max-w-[65%] ${ isMine ? 'self-end items-end' : 'self-start items-start' }
                     ${ isSign ? 'max-w-[85%]' : '' } animate-slide-up`}>
      {/* Sender name (others only) */}
      {!isMine && (
        <span className="text-xs text-gray-500 mb-1 ms-1">
          {msg.senderName || msg.sender?.name || 'User'}
        </span>
      )}

      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed flex flex-col gap-1
                       ${ isMine
                           ? 'bg-blue-700 text-white rounded-br-sm'
                           : 'bg-gray-700 text-gray-100 border border-gray-600 rounded-bl-sm'
                       }`}>
        {isSign ? (
          <>
            {/* Original text */}
            <p className="font-semibold text-sm opacity-90">{msg.sourceText || msg.text}</p>

            {/* Sign cards */}
            {signs.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-1">
                {signs.map((src, i) => (
                  <div key={i}
                       className="flex-shrink-0 flex flex-col items-center gap-1
                                  w-36 bg-black/20 border border-white/10 rounded-xl p-2"
                       style={{ animationDelay: `${i * 80}ms` }}>
                    <img
                      src={src}
                      alt={matchedWords[i] || `Sign ${i + 1}`}
                      className="w-full h-24 object-contain rounded-lg bg-black/30"
                      loading="lazy"
                    />
                    <span className="text-xs font-bold opacity-80 text-center">
                      {segments[i]?.label || matchedWords[i] || `Sign ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-70">No signs found for this phrase.</p>
            )}

            {missingWords.length > 0 && (
              <p className="text-xs opacity-60">
                {t('skipped')}: {missingWords.join(', ')}
              </p>
            )}
          </>
        ) : (
          <span>{msg.text}</span>
        )}

        {/* Timestamp + read */}
        <span className="text-[10px] opacity-50 self-end flex items-center gap-1 mt-0.5">
          {formatTime(msg.createdAt)}
          {isMine && <CheckCheck size={11} />}
        </span>
      </div>
    </div>
  );
}
