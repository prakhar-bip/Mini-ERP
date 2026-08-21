import React from 'react';

export default function ConcurrencyShieldSVG({ className = "w-6 h-6", animated = true }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#1E429F" />
          <stop offset="100%" stopColor="#0B1941" />
        </linearGradient>
        <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FA541C" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Outer Protective Shield */}
      <path
        d="M 50 10 Q 75 10 90 25 C 90 60 50 90 50 90 C 50 90 10 60 10 25 Q 25 10 50 10 Z"
        fill="url(#shieldGrad)"
        stroke="#3B82F6"
        strokeWidth="2.5"
      />

      {/* Inner Energy Rings */}
      <path
        d="M 50 20 Q 70 20 80 32 C 80 58 50 80 50 80 C 50 80 20 58 20 32 Q 30 20 50 20 Z"
        fill="none"
        stroke="#60A5FA"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className={animated ? "animate-dash" : ""}
        opacity="0.7"
      />

      {/* Lock Shackle */}
      <path
        d="M 38 48 V 38 C 38 31.5 43.5 26 50 26 C 56.5 26 62 31.5 62 38 V 48"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Lock Body */}
      <rect
        x="32"
        y="46"
        width="36"
        height="28"
        rx="6"
        fill="url(#lockGrad)"
        stroke="#FFFFFF"
        strokeWidth="2"
      />

      {/* Keyhole */}
      <circle cx="50" cy="57" r="3.5" fill="#0B1941" />
      <path d="M 48.5 57 L 47 67 H 53 L 51.5 57 Z" fill="#0B1941" />

      {/* Shimmer sparkle */}
      {animated && (
        <circle cx="62" cy="48" r="2.5" fill="#FFFFFF" className="animate-ping" />
      )}
    </svg>
  );
}
