'use client';

import { ReactNode } from 'react';

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
}

const statusColors = {
  healthy: {
    bg: 'bg-vital-healthy/10',
    border: 'border-vital-healthy/30',
    text: 'text-vital-healthy',
    glow: 'shadow-glow-green',
  },
  warning: {
    bg: 'bg-vital-warning/10',
    border: 'border-vital-warning/30',
    text: 'text-vital-warning',
    glow: '',
  },
  critical: {
    bg: 'bg-vital-critical/10',
    border: 'border-vital-critical/30',
    text: 'text-vital-critical',
    glow: 'shadow-glow-red',
  },
  neutral: {
    bg: 'bg-vital-neutral/10',
    border: 'border-vital-neutral/30',
    text: 'text-vital-neutral',
    glow: 'shadow-glow-blue',
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
}: VitalCardProps) {
  const colors = statusColors[status];

  return (
    <div
      onClick={onClick}
      className={`vital-card relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-5 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200' : ''
      }`}
    >
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
