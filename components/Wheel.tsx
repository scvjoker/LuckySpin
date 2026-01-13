
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Prize, WheelConfig } from '../types';

interface WheelProps {
  prizes: Prize[];
  config: WheelConfig;
  onSpinEnd: (prize: Prize) => void;
  isSpinning: boolean;
}

const Wheel: React.FC<WheelProps> = ({ prizes, config, onSpinEnd, isSpinning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});

  const activePrizes = useMemo(() => prizes.filter(p => p.enabled), [prizes]);
  const totalWeight = useMemo(() => activePrizes.reduce((sum, p) => sum + p.probability, 0), [activePrizes]);

  // Pre-load images for canvas
  useEffect(() => {
    activePrizes.forEach(prize => {
      if (prize.image && !imageElements[prize.id]) {
        const img = new Image();
        img.src = prize.image;
        img.onload = () => {
          setImageElements(prev => ({ ...prev, [prize.id]: img }));
        };
      }
    });
  }, [activePrizes]);

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

    if (activePrizes.length === 0) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    let startAngle = rotationRef.current;

    activePrizes.forEach((prize) => {
      const sliceAngle = (prize.probability / totalWeight) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff22';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw content
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      
      // Draw Text
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 13px Inter';
      ctx.fillText(prize.label, radius - 45, 5);

      // Draw Image if exists
      const img = imageElements[prize.id];
      if (img) {
        ctx.drawImage(img, radius - 40, -15, 30, 30);
      }
      
      ctx.restore();
      startAngle += sliceAngle;
    });

    // Center decor
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel();
  }, [activePrizes, rotation, imageElements]);

  useEffect(() => {
    if (!isSpinning || activePrizes.length === 0) return;

    const startTime = Date.now();
    const duration = config.duration * 1000;
    const randomVal = Math.random() * totalWeight;
    let accumulated = 0;
    let winnerIndex = 0;
    
    for (let i = 0; i < activePrizes.length; i++) {
      accumulated += activePrizes[i].probability;
      if (randomVal <= accumulated) {
        winnerIndex = i;
        break;
      }
    }

    let winnerStartWeight = 0;
    for (let i = 0; i < winnerIndex; i++) winnerStartWeight += activePrizes[i].probability;
    const winnerEndWeight = winnerStartWeight + activePrizes[winnerIndex].probability;
    const winnerMidAngle = ((winnerStartWeight + winnerEndWeight) / 2 / totalWeight) * 2 * Math.PI;

    const baseRotations = config.rotations * 2 * Math.PI;
    const directionMult = config.direction === 'cw' ? 1 : -1;
    const targetTarget = (2 * Math.PI - winnerMidAngle) - (Math.PI / 2);
    const targetRotation = directionMult * (baseRotations + (targetTarget > 0 ? targetTarget : targetTarget + 2 * Math.PI));
    const startRot = rotationRef.current;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentRot = startRot + (targetRotation * ease);
      setRotation(currentRot);
      rotationRef.current = currentRot;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onSpinEnd(activePrizes[winnerIndex]);
      }
    };

    animate();
  }, [isSpinning]);

  return (
    <div className="relative">
      <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20">
        <div className="w-8 h-12 bg-white clip-path-triangle shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-start justify-center pt-1">
           <div className="w-3 h-5 bg-red-600 rounded-full" />
        </div>
      </div>
      <canvas ref={canvasRef} width={500} height={500} className="rounded-full border-[16px] border-slate-800 shadow-[0_0_60px_rgba(139,92,246,0.3)] scale-90 lg:scale-100" />
      <style>{`.clip-path-triangle { clip-path: polygon(100% 0, 0 0, 50% 100%); }`}</style>
    </div>
  );
};

export default Wheel;
