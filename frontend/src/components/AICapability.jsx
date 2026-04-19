import React from 'react';
import { Zap, Hand, MessageSquare, Globe } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Hand,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    title: 'Real-Time Sign Detection',
    description: 'MediaPipe detects hand gestures at up to 30 fps with bounding-box feedback.',
  },
  {
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Backend Sentence Smoothing',
    description: 'Socket.IO streams predictions to the backend which assembles coherent sentences.',
  },
  {
    icon: Globe,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    title: 'Arabic & English Support',
    description: 'Sign labels and chat output support both Arabic and English interfaces.',
  },
  {
    icon: MessageSquare,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: 'Send to Chat',
    description: 'Detected signs are sent directly to the active chat as sign messages.',
  },
];

export default function AICapability() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CAPABILITIES.map((cap) => (
        <div key={cap.title} className="card flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cap.bg} ${cap.color}`}>
            <cap.icon size={20} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-1">{cap.title}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{cap.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
