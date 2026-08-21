import React from 'react';

export default function SupplyChainHeroSVG({ className = "w-full max-w-md h-auto" }) {
  return (
    <svg
      viewBox="0 0 500 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E429F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FA541C" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="nodeGradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FA541C" />
          <stop offset="100%" stopColor="#FB8C00" />
        </linearGradient>
        <linearGradient id="nodeGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="nodeGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Isometric Floor Grid */}
      <g opacity="0.35">
        <path d="M 50 160 L 250 50 L 450 160 L 250 270 Z" stroke="#3B82F6" strokeWidth="1" fill="url(#gridGrad)" />
        <path d="M 100 160 L 250 80 L 400 160 L 250 240 Z" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="3 3" />
        <path d="M 150 160 L 250 110 L 350 160 L 250 210 Z" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="50" y1="160" x2="450" y2="160" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="250" y1="50" x2="250" y2="270" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="4 4" />
      </g>

      {/* Dynamic Animated Data Connection Paths */}
      {/* Route 1: Central Hub -> Warehouse East */}
      <path
        d="M 250 150 Q 320 130 380 180"
        stroke="#FA541C"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        className="animate-dash"
      />
      {/* Route 2: Central Hub -> Warehouse West */}
      <path
        d="M 250 150 Q 180 120 120 170"
        stroke="#3B82F6"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        className="animate-dash"
      />
      {/* Route 3: Warehouse West -> Southern Terminal */}
      <path
        d="M 120 170 Q 180 230 250 235"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        className="animate-dash"
      />
      {/* Route 4: Warehouse East -> Southern Terminal */}
      <path
        d="M 380 180 Q 320 230 250 235"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        className="animate-dash"
      />

      {/* Central Command Tower / Hub */}
      <g className="animate-float" style={{ transformOrigin: '250px 140px' }}>
        {/* Isometric Pillar */}
        <polygon points="250,85 275,100 275,135 250,120" fill="#1E429F" />
        <polygon points="250,85 225,100 225,135 250,120" fill="#2563EB" />
        <polygon points="250,85 275,100 250,115 225,100" fill="#60A5FA" />
        {/* Floating Glowing Core Ring */}
        <circle cx="250" cy="72" r="14" fill="url(#nodeGradOrange)" filter="url(#heroGlow)" />
        <circle cx="250" cy="72" r="6" fill="#FFFFFF" className="animate-pulseSlow" />
        {/* Text tag */}
        <rect x="215" y="40" width="70" height="18" rx="9" fill="#0B1941" stroke="#FA541C" strokeWidth="1" />
        <text x="250" y="52" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">CORE ERP</text>
      </g>

      {/* Node West: Manufacturing Plant / Raw Materials */}
      <g style={{ transformOrigin: '120px 170px' }}>
        <polygon points="120,140 142,152 142,175 120,163" fill="#1E293B" />
        <polygon points="120,140 98,152 98,175 120,163" fill="#334155" />
        <polygon points="120,140 142,152 120,164 98,152" fill="#64748B" />
        {/* Pulse beacon */}
        <circle cx="120" cy="132" r="7" fill="url(#nodeGradBlue)" />
        <circle cx="120" cy="132" r="12" stroke="#3B82F6" strokeWidth="1" opacity="0.6" className="animate-ping origin-center" style={{ transformOrigin: '120px 132px' }} />
        {/* Label */}
        <rect x="85" y="185" width="70" height="16" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1" opacity="0.9" />
        <text x="120" y="196" fill="#93C5FD" fontSize="7.5" fontWeight="600" textAnchor="middle">PLANT #1 (WH-MAIN)</text>
      </g>

      {/* Node East: Distribution Warehouse */}
      <g style={{ transformOrigin: '380px 180px' }}>
        <polygon points="380,150 402,162 402,185 380,173" fill="#7C2D12" />
        <polygon points="380,150 358,162 358,185 380,173" fill="#C2410C" />
        <polygon points="380,150 402,162 380,174 358,162" fill="#FB923C" />
        {/* Pulse beacon */}
        <circle cx="380" cy="142" r="7" fill="url(#nodeGradOrange)" />
        <circle cx="380" cy="142" r="12" stroke="#FA541C" strokeWidth="1" opacity="0.6" className="animate-ping origin-center" style={{ transformOrigin: '380px 142px' }} />
        {/* Label */}
        <rect x="345" y="195" width="70" height="16" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1" opacity="0.9" />
        <text x="380" y="206" fill="#FDBA74" fontSize="7.5" fontWeight="600" textAnchor="middle">OUTLET (WH-NORTH)</text>
      </g>

      {/* Node South: Concurrency Order Terminal */}
      <g style={{ transformOrigin: '250px 240px' }}>
        <polygon points="250,210 270,222 270,242 250,230" fill="#064E3B" />
        <polygon points="250,210 230,222 230,242 250,230" fill="#047857" />
        <polygon points="250,210 270,222 250,234 230,222" fill="#34D399" />
        {/* Shield Indicator */}
        <circle cx="250" cy="202" r="7" fill="url(#nodeGradEmerald)" />
        {/* Label */}
        <rect x="205" y="252" width="90" height="16" rx="4" fill="#0F172A" stroke="#047857" strokeWidth="1" opacity="0.9" />
        <text x="250" y="263" fill="#6EE7B7" fontSize="7.5" fontWeight="600" textAnchor="middle">ACID RESERVATIONS</text>
      </g>

      {/* Moving Signal Dots */}
      <circle cx="315" cy="155" r="3.5" fill="#FFA940" className="animate-pulseSlow" />
      <circle cx="185" cy="145" r="3.5" fill="#60A5FA" className="animate-pulseSlow" />
      <circle cx="285" cy="232" r="3.5" fill="#34D399" className="animate-pulseSlow" />
    </svg>
  );
}
