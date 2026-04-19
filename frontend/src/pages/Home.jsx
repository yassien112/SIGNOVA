import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MessageSquare, ShieldCheck, Accessibility } from 'lucide-react';

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Sign Recognition',
    desc: 'Our camera tool detects your hand gestures and translates them to text in real-time to send into the chat.',
  },
  {
    icon: MessageSquare,
    title: 'Instant Messaging',
    desc: 'Fast, reliable real-time messaging with online status tracking and instant notifications.',
  },
  {
    icon: Accessibility,
    title: 'Accessibility First',
    desc: 'Built carefully with high-contrast theming, large tap targets, and RTL language support (Arabic).',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    desc: 'Your data is securely authenticated with role-based dashboard access protecting your information.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-24 pb-16">

      {/* ===== HERO ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center
                          min-h-[calc(100vh-120px)]">

        {/* Left — copy */}
        <div className="flex flex-col gap-6 z-10">
          {/* Badge */}
          <span className="self-start px-4 py-2 rounded-[20px] text-sm font-semibold
                           bg-[rgba(30,58,138,0.2)] text-[#1E3A8A]
                           border border-[rgba(30,58,138,0.4)]">
            New AI Communication Platform
          </span>

          <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] font-extrabold text-white">
            Breaking Barriers with <br />
            <span className="bg-gradient-to-r from-[#60A5FA] to-[#1E3A8A]
                             bg-clip-text text-transparent">
              Signova
            </span>
          </h1>

          <p className="text-[1.25rem] text-[#9CA3AF] leading-relaxed max-w-[90%]">
            A modern communication platform designed to help people with disabilities
            connect seamlessly through AI-powered sign language recognition and
            real-time messaging.
          </p>

          <div className="flex gap-4 mt-4 flex-wrap">
            <Link to="/register"
                  className="px-8 py-4 text-[1.1rem] font-semibold rounded-xl
                             bg-[#1E3A8A] text-white inline-flex items-center justify-center
                             hover:bg-[#1e40af] hover:-translate-y-0.5
                             transition-all duration-300">
              Get Started
            </Link>
            <Link to="/login"
                  className="px-8 py-4 text-[1.1rem] font-semibold rounded-xl
                             bg-transparent text-white inline-flex items-center justify-center
                             border-2 border-[#374151]
                             hover:border-[#1E3A8A]
                             transition-all duration-300">
              Login to Account
            </Link>
          </div>
        </div>

        {/* Right — mockup card */}
        <div className="relative h-[500px] flex items-center justify-center">
          {/* Glow blobs */}
          <div className="absolute w-[300px] h-[300px] rounded-full
                          bg-[rgba(30,58,138,0.4)] blur-[80px] top-[10%] right-[20%]" />
          <div className="absolute w-[250px] h-[250px] rounded-full
                          bg-[rgba(16,185,129,0.2)] blur-[80px] bottom-[10%] left-[10%]" />

          {/* Glass card */}
          <div className="relative z-10 w-full max-w-[400px] h-[450px] flex flex-col
                          bg-[rgba(31,41,55,0.7)] backdrop-blur-xl
                          border border-[rgba(255,255,255,0.1)] rounded-[20px]
                          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-4 px-4 py-4
                            bg-[rgba(15,23,42,0.8)] border-b border-[rgba(255,255,255,0.05)]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              </div>
              <span className="text-sm font-medium text-[#9CA3AF] mx-auto pr-10">
                Signova Dashboard
              </span>
            </div>

            {/* Chat preview */}
            <div className="flex-1 flex flex-col justify-end px-6 py-6">
              <div className="flex flex-col gap-4">
                <div className="self-start max-w-[85%] px-4 py-4 rounded-xl text-[0.95rem]
                                bg-[#0F172A] border border-[#374151]
                                rounded-bl-sm animate-[slideIn_0.5s_ease_forwards] opacity-0">
                  Hello, nice to meet you!
                </div>
                <div className="self-end max-w-[85%] px-4 py-4 rounded-xl text-[0.95rem]
                                bg-[#1E3A8A] text-white rounded-br-sm
                                animate-[slideIn_0.5s_ease_0.5s_forwards] opacity-0">
                  Hi! The AI translated my sign!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="flex flex-col gap-12">
        <div className="text-center">
          <h2 className="text-[2.5rem] font-bold text-white mb-4">Core Features</h2>
          <p className="text-[#9CA3AF] text-[1.2rem]">Everything you need for seamless communication</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title}
                 className="bg-[#1F2937] border border-[#374151] rounded-2xl p-8
                            hover:-translate-y-1.5 hover:border-[#1E3A8A]
                            hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]
                            transition-all duration-300">
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-6
                              bg-[rgba(30,58,138,0.2)] text-[#60A5FA]">
                <Icon size={28} />
              </div>
              <h3 className="text-white text-[1.25rem] font-semibold mb-3">{title}</h3>
              <p className="text-[#9CA3AF] leading-relaxed text-[0.95rem]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* slideIn keyframe — only used on this page */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
