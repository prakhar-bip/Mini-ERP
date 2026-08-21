import React from 'react';

export default function StockGaugeSVG({
  physical = 100,
  reserved = 20,
  available = 80,
  size = 110,
  strokeWidth = 10,
  title = "Stock Ratio",
  showLabels = true
}) {
  const total = Math.max(physical, 1);
  const reservedPercent = Math.min(Math.round((reserved / total) * 100), 100);
  const availablePercent = Math.min(Math.round((available / total) * 100), 100);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Semicircle / 3/4 circle parameters
  const strokeDashoffset = circumference - (availablePercent / 100) * circumference;
  const reservedDashoffset = circumference - (reservedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center transition-all duration-700"
        >
          <defs>
            <linearGradient id="availGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="rsvdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FA541C" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Reserved Qty segment */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#rsvdGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={reservedDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            opacity="0.85"
          />

          {/* Available Qty segment */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#availGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold text-gray-900 leading-none">{availablePercent}%</span>
          <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-tight mt-0.5">Avail</span>
        </div>
      </div>

      {showLabels && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Avail: <strong>{available}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
            <span>Rsvd: <strong>{reserved}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
