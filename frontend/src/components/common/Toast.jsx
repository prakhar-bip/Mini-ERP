import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ notification, onClose }) {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideInRight max-w-sm w-full select-none">
      <div
        className={`relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-md p-3.5 flex items-start gap-3 transition-all duration-300 ${
          isSuccess
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10'
            : isError
            ? 'bg-red-50/95 border-red-300 text-red-900 shadow-red-500/10'
            : 'bg-blue-50/95 border-blue-300 text-blue-900 shadow-blue-500/10'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess ? (
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : isError ? (
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Info className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 pr-2">
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
            {isSuccess ? 'Success' : isError ? 'Attention Required' : 'Notice'}
          </div>
          <div className="text-xs font-medium leading-snug mt-0.5">
            {notification.message}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-black/5 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Live Auto-close Countdown Bar */}
        <div
          className={`absolute bottom-0 left-0 h-1 animate-progress-countdown ${
            isSuccess ? 'bg-emerald-500' : isError ? 'bg-red-500' : 'bg-blue-500'
          }`}
        />
      </div>
    </div>
  );
}
