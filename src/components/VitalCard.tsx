'use client';

import { ReactNode, useState } from 'react';

interface VitalCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical' | 'neutral';
  icon: ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  children?: ReactNode;
  onClick?: () => void;
  infoTooltip?: string;
}

const statusColors = {
  healthy: {
    bg: 'bg-x-gray-dark',
    border: 'border-x-gray-border',
    text: 'text-vital-healthy',
    glow: '',
  },
  warning: {
    bg: 'bg-x-gray-dark',
    border: 'border-x-gray-border',
    text: 'text-vital-warning',
    glow: '',
  },
  critical: {
    bg: 'bg-x-gray-dark',
    border: 'border-x-gray-border',
    text: 'text-vital-critical',
    glow: '',
  },
  neutral: {
    bg: 'bg-x-gray-dark',
    border: 'border-x-gray-border',
    text: 'text-vital-neutral',
    glow: '',
  },
};

const trendIcons = {
  up: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5" />
    </svg>
  ),
  down: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-5 5-5-5" />
    </svg>
  ),
  stable: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  ),
};

export default function VitalCard({
  title,
  value,
  unit,
  status,
  icon,
  subtitle,
  trend,
  children,
  onClick,
  infoTooltip,
}: VitalCardProps) {
  const colors = statusColors[status];
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`vital-card relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-5 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200' : ''
      }`}
    >
      {/* Info icon with tooltip */}
      {infoTooltip && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="w-5 h-5 rounded-full bg-[#2F3336] hover:bg-[#3E4144] flex items-center justify-center transition-colors"
          >
            <svg className="w-3 h-3 text-[#71767B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </button>
          {showTooltip && (
            <div className="absolute top-7 left-0 w-64 p-3 bg-[#16181C] border border-[#2F3336] rounded-lg shadow-xl z-20">
              <p className="text-[#E7E9EA] text-xs leading-relaxed">{infoTooltip}</p>
            </div>
          )}
        </div>
      )}

      {/* Status indicator dot */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {trend && (
          <span className={`${colors.text} opacity-70`}>
            {trendIcons[trend]}
          </span>
        )}
        <div className={`w-2 h-2 rounded-full ${colors.text} bg-current status-pulse`} />
      </div>

      {/* Icon */}
      <div className={`${colors.text} mb-3`}>
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-x-gray-text text-sm font-medium uppercase tracking-wider mb-2">
        {title}
      </h3>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${colors.text}`}>
          {value}
        </span>
        {unit && (
          <span className="text-x-gray-text text-sm">
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-x-gray-text text-xs mt-1">
          {subtitle}
        </p>
      )}

      {/* Optional children (charts, etc.) */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
