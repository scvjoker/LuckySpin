
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Prize } from '../types';

interface WheelProps {
  prizes: Prize[];
  onSpinEnd: (prize: Prize) => void;
  isSpinning: boolean;
}

const Wheel: React.FC<WheelProps> = ({ prizes, onSpinEnd, isSpinning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  const totalWeight = useMemo(() => prizes.reduce((sum, p) => sum + p.probability, 0), [prizes]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    let startAngle = rotationRef.current;

    prizes.forEach((prize) => {
      const sliceAngle = (prize.probability / totalWeight) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Inter';
      ctx.fillText(prize.label, radius - 30, 6);
      ctx.restore();

      startAngle += sliceAngle;
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel();
  }, [prizes, rotation]);

  // Handle animation
  useEffect(() => {
    if (!isSpinning) return;

    const startTime = Date.now();
    const duration = 5000;
    // Calculate winning prize before animation starts for fair logic
    const randomVal = Math.random() * totalWeight;
    let accumulated = 0;
    let winnerIndex = 0;
    for (let i = 0; i < prizes.length; i++) {
      accumulated += prizes[i].probability;
      if (randomVal <= accumulated) {
        winnerIndex = i;
        break;
      }
    }

    // Determine target rotation
    // We want the winner slice to end up at the top (-PI/2)
    // 1. Find winner slice boundaries
    let winnerStartWeight = 0;
    for (let i = 0; i < winnerIndex; i++) winnerStartWeight += prizes[i].probability;
    const winnerEndWeight = winnerStartWeight + prizes[winnerIndex].probability;

    const winnerMidAngle = ((winnerStartWeight + winnerEndWeight) / 2 / totalWeight) * 2 * Math.PI;
    
    // Target: current rotation + few full loops + adjustment to align mid-slice to top (-90deg)
    const extraLoops = 8 + Math.random() * 2;
    const targetRotation = rotationRef.current + (extraLoops * 2 * Math.PI) - winnerMidAngle - (Math.PI / 2);

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentRot = rotationRef.current + (targetRotation - rotationRef.current) * ease;
      
      setRotation(currentRot);
      rotationRef.current = currentRot;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onSpinEnd(prizes[winnerIndex]);
      }
    };

    animate();
  }, [isSpinning]);

  return (
    <div className="relative group">
      {/* Pointer */}
      <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-10 drop-shadow-lg">
        <div className="w-8 h-8 bg-white rotate-45 rounded-sm flex items-center justify-center">
           <div className="w-4 h-4 bg-red-500 rounded-full" />
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="max-w-full h-auto rounded-full border-8 border-slate-800"
      />
    </div>
  );
};

export default Wheel;
