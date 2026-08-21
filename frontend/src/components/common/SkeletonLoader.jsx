import React from 'react';

export function SkeletonRow({ cols = 6 }) {
  return (
    <tr className="border-b border-surface-border">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="py-4 px-3">
          <div className="h-4 rounded skeleton-shimmer w-full max-w-[85%]"></div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 bg-surface-card rounded-xl border border-surface-border space-y-3">
      <div className="h-4 skeleton-shimmer rounded w-1/3"></div>
      <div className="h-8 skeleton-shimmer rounded w-2/3"></div>
      <div className="h-3 skeleton-shimmer rounded w-1/2"></div>
    </div>
  );
}

export default function SkeletonLoader({ type = "table", rows = 5, cols = 6 }) {
  if (type === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-surface-border bg-surface-muted/50">
          {Array.from({ length: cols }).map((_, idx) => (
            <th key={idx} className="py-3 px-3">
              <div className="h-3.5 skeleton-shimmer rounded w-20"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, idx) => (
          <SkeletonRow key={idx} cols={cols} />
        ))}
      </tbody>
    </table>
  );
}
