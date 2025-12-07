'use client';

interface SentimentGaugeProps {
  value: number; // -100 to 100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SentimentGauge({
  value,
  label = 'Sentiment',
  size = 'md',
}: SentimentGaugeProps) {
  // Validate and sanitize value to prevent NaN
  const safeValue = typeof value === 'number' && !isNaN(value) ? Math.max(-100, Math.min(100, value)) : 0;

  // Normalize value to 0-180 degrees for the gauge
  const normalizedValue = ((safeValue + 100) / 200) * 180;

  // Determine color based on value
  const getColor = () => {
    if (safeValue > 30) return '#00FF88';
    if (safeValue < -30) return '#FF3B3B';
    return '#00D4FF';
  };

  const sizeConfig = {
    sm: { width: 80, height: 50, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, height: 70, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, height: 90, strokeWidth: 10, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${config.strokeWidth / 2} ${config.height - 5} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.height - 5}`}
          fill="none"
          stroke="#2F3336"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${config.strokeWidth / 2} ${config.height - 5} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.height - 5}`}
          fill="none"
          stroke={getColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (normalizedValue / 180) * circumference}
          style={{
            filter: `drop-shadow(0 0 6px ${getColor()})`,
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />

        {/* Indicator needle */}
        <line
          x1={config.width / 2}
          y1={config.height - 5}
          x2={config.width / 2 + Math.cos((Math.PI * (180 - normalizedValue)) / 180) * (radius - 10)}
          y2={config.height - 5 - Math.sin((Math.PI * (180 - normalizedValue)) / 180) * (radius - 10)}
          stroke={getColor()}
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${getColor()})`,
            transition: 'all 0.5s ease-out',
          }}
        />

        {/* Center dot */}
        <circle
          cx={config.width / 2}
          cy={config.height - 5}
          r={4}
          fill={getColor()}
          style={{ filter: `drop-shadow(0 0 4px ${getColor()})` }}
        />
      </svg>

      {/* Value display */}
      <span
        className={`${config.fontSize} font-bold mt-2`}
        style={{ color: getColor() }}
      >
        {safeValue > 0 ? '+' : ''}{safeValue}
      </span>

      {/* Label */}
      <span className="text-x-gray-text text-xs mt-1">{label}</span>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-x-gray-text">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-vital-critical" />
          Negative
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-vital-neutral" />
          Neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-vital-healthy" />
          Positive
        </span>
      </div>
    </div>
  );
}
