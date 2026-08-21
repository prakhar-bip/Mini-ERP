import React from 'react';

export default function ERPLogoSVG({ className = "w-8 h-8", animated = true }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}
    >
      <defs>
        <linearGradient id="erpGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FA541C" />
          <stop offset="50%" stopColor="#FB8C00" />
          <stop offset="100%" stopColor="#FFA940" />
        </linearGradient>
        <linearGradient id="erpGradSecondary" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E429F" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id="erpGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagon Shield Base */}
      <polygon
        points="50,6 90,28 90,72 50,94 10,72 10,28"
        fill="url(#erpGradPrimary)"
        className={animated ? "animate-pulseSlow" : ""}
        opacity="0.95"
      />

      {/* Inner Accent Facets */}
      <polygon
        points="50,14 82,32 50,50 18,32"
        fill="#FFFFFF"
        opacity="0.28"
      />
      <polygon
        points="18,32 50,50 50,86 18,68"
        fill="#000000"
        opacity="0.18"
      />
      <polygon
        points="82,32 50,50 50,86 82,68"
        fill="#FFFFFF"
        opacity="0.12"
      />

      {/* Central Interlocking Core */}
      <circle
        cx="50"
        cy="50"
        r="14"
        fill="#0B1941"
        stroke="#FFFFFF"
        strokeWidth="2.5"
      />

      {/* Core Node Indicator */}
      <circle
        cx="50"
        cy="50"
        r="6"
        fill="url(#erpGradPrimary)"
      />

      {/* Orbiting Ring Particles */}
      {animated && (
        <g className="animate-spin-slow origin-center" style={{ transformOrigin: '50px 50px' }}>
          <circle cx="50" cy="20" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="76" cy="65" r="2.5" fill="#FFE58F" opacity="0.8" />
          <circle cx="24" cy="65" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}
