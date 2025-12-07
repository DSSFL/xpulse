'use client';

interface VelocityMeterProps {
  current: number;
  max: number;
  label?: string;
}

export default function VelocityMeter({
  current,
  max,
  label = 'posts/min',
}: VelocityMeterProps) {
  const percentage = Math.min((current / max) * 100, 100);

  // Determine status color
  const getColor = () => {
    if (percentage > 80) return '#FF3B3B';
    if (percentage > 50) return '#FFD700';
    return '#00FF88';
  };

  const color = getColor();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-x-gray-text text-xs uppercase tracking-wider">
          Velocity
        </span>
        <span className="text-x-white font-mono text-sm">
          {current.toLocaleString()} <span className="text-x-gray-text">{label}</span>
        </span>
      </div>

      {/* Bar container */}
      <div className="relative h-3 bg-x-gray-light rounded-full overflow-hidden">
        {/* Background segments */}
        <div className="absolute inset-0 flex">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-x-gray-dark last:border-r-0"
            />
          ))}
        </div>

        {/* Fill bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 10px ${color}80`,
          }}
        />

        {/* Animated pulse at the end */}
        <div
          className="absolute top-0 bottom-0 w-1 rounded-full animate-pulse"
          style={{
            left: `calc(${percentage}% - 2px)`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>

      {/* Scale markers */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-x-gray-text">0</span>
        <span className="text-[10px] text-x-gray-text">{(max / 2).toLocaleString()}</span>
        <span className="text-[10px] text-x-gray-text">{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
