import React, { useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

const MOCK_SIGN_TRANSLATIONS = [
  "Hello, how are you?",
  "I am doing great!",
  "Nice to meet you.",
  "What time are we meeting?",
  "Thank you so much."
];

const AICapability = ({ onInjectText }) => {
  const [isActive, setIsActive] = useState(false);
  const [translationText, setTranslationText] = useState("");

  const handleSimulateSign = () => {
    const randomText = MOCK_SIGN_TRANSLATIONS[Math.floor(Math.random() * MOCK_SIGN_TRANSLATIONS.length)];
    setTranslationText("Translating...");
    setTimeout(() => {
        setTranslationText(randomText);
    }, 800);
  };

  const handleSendToChat = () => {
    if (translationText && translationText !== "Translating...") {
        onInjectText(translationText);
        setTranslationText("");
        setIsActive(false);
    }
  };

  if (!isActive) {
    return (
      <div style={{ padding: '0 20px', textAlign: 'right' }}>
        <button className="icon-button" onClick={() => setIsActive(true)} title="AI Sign Language Translation">
           <Camera size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="ai-mock-panel">
      <div className="ai-header">
         <Camera size={18} />
         <span>AI Sign Language Camera (Simulated)</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
         <div style={{ flex: 1, backgroundColor: 'black', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', borderRadius: '4px' }}>
            [Camera Feed]
         </div>
      </div>

      {translationText && (
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '12px' }}>
          <strong>Detected: </strong> {translationText}
        </div>
      )}

      <div className="ai-actions">
        <button type="button" className="btn-secondary" onClick={handleSimulateSign}>
           <RefreshCw size={14} style={{ display: 'inline', marginRight: '4px' }} /> Simulate Sign
        </button>
        <button type="button" className="btn-secondary" onClick={handleSendToChat} disabled={!translationText || translationText === "Translating..."}>
           Use Translation
        </button>
        <button type="button" className="btn-secondary" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }} onClick={() => setIsActive(false)}>
           Close
        </button>
      </div>
    </div>
  );
};

export default AICapability;
