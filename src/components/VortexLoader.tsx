'use client';

interface VortexLoaderProps {
  message?: string;
  stage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VortexLoader({ message, stage, size = 'lg' }: VortexLoaderProps) {
  const sizeConfig = {
    sm: { container: 'w-6 h-6', logo: 'w-4 h-4' },
    md: { container: 'w-10 h-10', logo: 'w-6 h-6' },
    lg: { container: 'w-16 h-16', logo: 'w-10 h-10' }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* X logo with pulsing ring */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <div
          className={`${sizeConfig[size].container} absolute inset-0 rounded-full border-2 border-[#1D9BF0]/30 animate-ping`}
          style={{ animationDuration: '1.5s' }}
        />

        {/* Spinning gradient ring */}
        <div className={`${sizeConfig[size].container} relative`}>
          <svg className="w-full h-full animate-spin" style={{ animationDuration: '1s' }} viewBox="0 0 50 50">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1D9BF0" />
                <stop offset="50%" stopColor="#1D9BF0" stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Center X logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className={`${sizeConfig[size].logo} text-[#E7E9EA]`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status text */}
      {(message || stage) && (
        <div className="mt-6 text-center space-y-1">
          {message && (
            <p className="text-[#E7E9EA] font-medium text-[15px]">{message}</p>
          )}
          {stage && (
            <p className="text-[#71767B] text-sm">{stage}</p>
          )}
        </div>
      )}

      {/* Three dot loading indicator */}
      <div className="flex gap-1.5 mt-4">
        <div
          className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
        />
      </div>
    </div>
  );
}
