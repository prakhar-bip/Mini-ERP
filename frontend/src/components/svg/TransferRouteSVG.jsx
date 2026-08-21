import React from 'react';

export default function TransferRouteSVG({
  sourceName = "Warehouse A",
  destName = "Warehouse B",
  status = "DISPATCHED", // 'REQUESTED' | 'DISPATCHED' | 'RECEIVED'
  quantity = 10,
  unit = "PCS",
  className = "w-full h-24"
}) {
  const isDispatched = status === 'DISPATCHED';
  const isReceived = status === 'RECEIVED';
  const isRequested = status === 'REQUESTED';

  return (
    <div className={`relative flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r from-gray-50 via-white to-gray-50 overflow-hidden ${
      isDispatched ? 'border-amber-300 bg-amber-50/30' : isReceived ? 'border-emerald-300 bg-emerald-50/20' : 'border-blue-200'
    } ${className}`}>
      {/* SVG Canvas for Flow Lines and Animation */}
      <svg
        viewBox="0 0 400 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDispatched ? "#F59E0B" : isReceived ? "#10B981" : "#3B82F6"} stopOpacity="0.4" />
            <stop offset="50%" stopColor={isDispatched ? "#FA541C" : isReceived ? "#059669" : "#2563EB"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isReceived ? "#10B981" : "#6B7280"} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Base Background Path */}
        <line
          x1="80"
          y1="30"
          x2="320"
          y2="30"
          stroke="#E5E7EB"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Animated Active Route Path */}
        <line
          x1="80"
          y1="30"
          x2="320"
          y2="30"
          stroke="url(#routeGrad)"
          strokeWidth="3"
          strokeDasharray={isDispatched ? "6 6" : "0"}
          className={isDispatched ? "animate-dash" : ""}
          strokeLinecap="round"
        />

        {/* Moving Flow Dots when In-Transit */}
        {isDispatched && (
          <>
            <circle cx="160" cy="30" r="3.5" fill="#FA541C" className="animate-pulse" />
            <circle cx="240" cy="30" r="3.5" fill="#F59E0B" className="animate-pulse" />
          </>
        )}
      </svg>

      {/* Source Warehouse Node */}
      <div className="relative z-10 flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
          isRequested ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Source Origin</div>
          <div className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{sourceName}</div>
        </div>
      </div>

      {/* Central Interactive Status Pill / Transit Indicator */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-xs border transition-all duration-300 ${
          isDispatched
            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulseSlow'
            : isReceived
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
            : 'bg-blue-100 text-blue-900 border-blue-300'
        }`}>
          {isDispatched ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>In Transit: {quantity} {unit}</span>
            </>
          ) : isReceived ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Delivered ({quantity} {unit})</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Requested ({quantity} {unit})</span>
            </>
          )}
        </div>
        <span className="text-[9px] text-gray-400 font-mono mt-0.5">ACID Double-Entry</span>
      </div>

      {/* Destination Warehouse Node */}
      <div className="relative z-10 flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs">
        <div className="text-right">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Destination</div>
          <div className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{destName}</div>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
          isReceived ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-700'
        }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
