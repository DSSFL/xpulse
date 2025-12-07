'use client';

import { useEffect, useRef } from 'react';

interface VortexLoaderProps {
  message?: string;
  stage?: string;
}

export default function VortexLoader({ message = 'Connecting to X...', stage }: VortexLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;

    // Particle system for vortex
    const particles: Array<{
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    // Create particles in spiral pattern
    const numParticles = 120;
    const colors = [
      '#8B5CF6', // pulse-purple
      '#3B82F6', // pulse-blue
      '#10B981', // pulse-green
      '#06B6D4', // cyan
    ];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        angle: (i / numParticles) * Math.PI * 8,
        radius: (i / numParticles) * 120 + 10,
        speed: 0.02 + (i / numParticles) * 0.01,
        size: 2 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Connection lines between particles
    const connections: Array<[number, number]> = [];
    for (let i = 0; i < numParticles; i++) {
      // Connect to next few particles
      if (i < numParticles - 1) connections.push([i, i + 1]);
      if (i < numParticles - 5) connections.push([i, i + 5]);
      if (i < numParticles - 10) connections.push([i, i + 10]);
    }

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.016; // ~60fps

      // Clear with fade effect for trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, size, size);

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Rotate particle
        particle.angle += particle.speed;

        // Pulsing radius
        const radiusPulse = Math.sin(time * 2 + index * 0.1) * 5;
        const currentRadius = particle.radius + radiusPulse;

        // Calculate position
        const x = centerX + Math.cos(particle.angle) * currentRadius;
        const y = centerY + Math.sin(particle.angle) * currentRadius;

        // Draw glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 3);
        gradient.addColorStop(0, particle.color + 'AA');
        gradient.addColorStop(1, particle.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - particle.size * 3, y - particle.size * 3, particle.size * 6, particle.size * 6);

        // Draw particle core
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Store position for connections
        (particle as any).x = x;
        (particle as any).y = y;
      });

      // Draw connections
      ctx.globalAlpha = 0.2;
      connections.forEach(([i1, i2]) => {
        const p1 = particles[i1] as any;
        const p2 = particles[i2] as any;

        // Only draw if particles are close enough
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) {
          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, p1.color);
          gradient.addColorStop(1, p2.color);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // Draw center glow
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
      centerGradient.addColorStop(0, '#8B5CF6' + '40');
      centerGradient.addColorStop(0.5, '#8B5CF6' + '20');
      centerGradient.addColorStop(1, '#8B5CF6' + '00');
      ctx.fillStyle = centerGradient;
      ctx.fillRect(centerX - 50, centerY - 50, 100, 100);

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-xl"
          style={{
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />

        {/* Center X logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pulse-purple to-pulse-blue flex items-center justify-center shadow-lg shadow-pulse-purple/50">
            <span className="text-white font-bold text-3xl">X</span>
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className="mt-8 text-center space-y-2">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-2 h-2 rounded-full bg-pulse-purple animate-pulse" />
          <p className="text-x-white font-medium text-lg">{message}</p>
        </div>
        {stage && (
          <p className="text-x-gray-text text-sm">{stage}</p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-pulse-purple/30"
            style={{
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
