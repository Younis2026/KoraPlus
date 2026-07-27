import React from 'react';

export function TeamLogo({ name, className = "" }: { name: string, className?: string }) {
  const initials = name.substring(0, 2);
  
  // Deterministic color based on name
  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const charCode = name.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
