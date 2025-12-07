'use client';

import { useEffect, useRef } from 'react';

interface EKGLineProps {
  color?: string;
  height?: number;
  speed?: number;
  className?: string;
}

export default function EKGLine({
  color = '#00D4FF',
  height = 60,
  speed = 2,
  className = ''
}: EKGLineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const draw = () => {
      const width = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, width, h);

      // Draw the EKG line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;

      for (let x = 0; x < width; x++) {
        const adjustedX = (x + offset) % width;
        let y = midY;

        // Create EKG-like pattern
        const patternX = adjustedX % 120;

        if (patternX > 40 && patternX < 50) {
          // Small bump up
          y = midY - 5;
        } else if (patternX > 50 && patternX < 55) {
          // Sharp spike up (R wave)
          y = midY - (h * 0.35);
        } else if (patternX > 55 && patternX < 60) {
          // Sharp dip down (S wave)
          y = midY + (h * 0.15);
        } else if (patternX > 60 && patternX < 70) {
          // Return to baseline
          y = midY;
        } else if (patternX > 80 && patternX < 95) {
          // T wave (gentle bump)
          const t = (patternX - 80) / 15;
          y = midY - Math.sin(t * Math.PI) * 10;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Add glow effect at the leading edge
      const leadingX = (width - offset) % width;
      ctx.beginPath();
      ctx.arc(leadingX, midY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fill();

      offset += speed;
      animationId = requestAnimationFrame(draw);
    };

    // Set canvas size
    const resizeCanvas = () => {
      const width = canvas.offsetWidth || canvas.clientWidth || 0;
      if (width === 0) return; // Skip if dimensions not available yet

      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
    };

    resizeCanvas();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas);
    }
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeCanvas);
      }
    };
  }, [color, height, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
    />
  );
}
