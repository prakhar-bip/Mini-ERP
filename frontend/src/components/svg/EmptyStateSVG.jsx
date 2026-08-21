import React from 'react';

export default function EmptyStateSVG({
  title = "No Records Found",
  subtitle = "Try adjusting your search criteria or create a new entry to get started.",
  actionText = null,
  onAction = null,
  className = "py-12"
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${className} select-none`}>
      <div className="relative w-48 h-36 mb-4">
        <svg
          viewBox="0 0 200 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="emptyBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3F4F6" />
              <stop offset="100%" stopColor="#E5E7EB" />
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FA541C" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
          </defs>

          {/* Isometric Shadow Platform */}
          <ellipse cx="100" cy="130" rx="70" ry="16" fill="#000000" opacity="0.06" />

          {/* Floating Empty Open Box */}
          <g className="animate-float" style={{ transformOrigin: '100px 90px' }}>
            {/* Box Body */}
            <polygon points="100,60 145,82 100,105 55,82" fill="#E5E7EB" />
            <polygon points="55,82 100,105 100,135 55,112" fill="#D1D5DB" />
            <polygon points="145,82 100,105 100,135 145,112" fill="#9CA3AF" />

            {/* Open Flaps */}
            <polygon points="55,82 30,68 65,55 100,60" fill="#E5E7EB" opacity="0.9" />
            <polygon points="145,82 170,68 135,55 100,60" fill="#D1D5DB" opacity="0.9" />
            <polygon points="100,105 100,125 70,115 55,82" fill="#CBD5E1" opacity="0.7" />

            {/* Glowing Accent Tape / Badge */}
            <rect x="94" y="98" width="12" height="24" rx="2" fill="url(#accentGrad)" opacity="0.9" />

            {/* Floating Dotted Cloud Particles */}
            <circle cx="50" cy="40" r="3" fill="#FA541C" opacity="0.6" className="animate-pulseSlow" />
            <circle cx="150" cy="45" r="4" fill="#3B82F6" opacity="0.5" className="animate-pulseSlow" />
            <circle cx="100" cy="30" r="2.5" fill="#10B981" opacity="0.7" className="animate-pulseSlow" />
            <circle cx="165" cy="95" r="2" fill="#9CA3AF" opacity="0.5" />
          </g>

          {/* Magnifier Glass floating over box */}
          <g className="animate-float" style={{ animationDelay: '-1.5s', transformOrigin: '140px 50px' }}>
            <circle cx="135" cy="45" r="14" stroke="#FA541C" strokeWidth="3" fill="#FFFFFF" fillOpacity="0.8" />
            <line x1="145" y1="55" x2="160" y2="70" stroke="#FA541C" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="132" cy="42" r="4" fill="#FA541C" fillOpacity="0.2" />
          </g>
        </svg>
      </div>

      <h3 className="text-sm font-bold text-gray-800 tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed">{subtitle}</p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-brand-orange hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-md shadow-orange-500/20 interactive-btn flex items-center gap-1.5 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
