import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useSignStore } from '../../store/signStore';

export default function StickerPicker({ isOpen, onClose, onSelectSticker }) {
  const { packs, signs, fetchPacks, fetchStickers, fetchSignsByPack, searchSigns, searchResults, isSearching, isLoading } = useSignStore();
  const [activeTab, setActiveTab]   = useState('stickers');
  const [query, setQuery]           = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  // Load packs + stickers on first open
  useEffect(() => {
    if (!isOpen) return;
    if (!packs.length) fetchPacks();
    if (!signs['stickers_ar']) fetchStickers('ar');
  }, [isOpen]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debouncedQ.trim()) searchSigns(debouncedQ);
  }, [debouncedQ]);

  // Load pack signs when tab changes
  useEffect(() => {
    if (activeTab !== 'stickers' && activeTab !== 'search') {
      const slug = activeTab;
      if (!signs[slug]) fetchSignsByPack(slug);
    }
  }, [activeTab]);

  const displaySigns = useMemo(() => {
    if (debouncedQ.trim()) return searchResults;
    if (activeTab === 'stickers') return signs['stickers_ar'] || [];
    return signs[activeTab] || [];
  }, [debouncedQ, searchResults, activeTab, signs]);

  if (!isOpen) return null;

  return (
    <div className="sticker-picker-overlay" onClick={onClose}>
      <div className="sticker-picker" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticker-picker-header">
          <span className="sticker-picker-title">Signs & Stickers</span>
          <button type="button" className="btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="sticker-search-wrap">
          <Search size={14} className="sticker-search-icon" />
          <input
            type="text"
            className="sticker-search-input"
            placeholder="Search signs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button type="button" className="btn-ghost" onClick={() => setQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tabs */}
        {!query && (
          <div className="sticker-tabs">
            <button
              className={`sticker-tab${activeTab === 'stickers' ? ' active' : ''}`}
              onClick={() => setActiveTab('stickers')}
            >
              ⭐ Stickers
            </button>
            {packs.map((pack) => (
              <button
                key={pack.slug}
                className={`sticker-tab${activeTab === pack.slug ? ' active' : ''}`}
                onClick={() => setActiveTab(pack.slug)}
              >
                {pack.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="sticker-grid-wrap">
          {(isLoading || isSearching) ? (
            <div className="sticker-loading">
              <Loader2 size={22} className="spin" />
            </div>
          ) : displaySigns.length === 0 ? (
            <div className="sticker-empty">
              {debouncedQ ? `No signs found for "${debouncedQ}"` : 'No signs yet'}
            </div>
          ) : (
            <div className="sticker-grid">
              {displaySigns.map((sign) => (
                <button
                  key={sign.id}
                  type="button"
                  className="sticker-item"
                  onClick={() => { onSelectSticker(sign); onClose(); }}
                  title={sign.word}
                >
                  <img
                    src={sign.thumbUrl || sign.imageUrl}
                    alt={sign.word}
                    className="sticker-item-img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="sticker-item-label">{sign.word}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
