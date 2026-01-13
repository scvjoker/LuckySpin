
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

  useEffect(() => {
    activePrizes.forEach(prize => {
      if (prize.image && !imageElements[prize.id]) {
        const img = new Image();
        img.src = prize.image;
        img.onload = () => setImageElements(prev => ({ ...prev, [prize.id]: img }));
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
    const radius = size / 2 - 20;

    ctx.clearRect(0, 0, size, size);

    // 外環木質框
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
    const woodGradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 15);
    woodGradient.addColorStop(0, '#5c3d2e');
    woodGradient.addColorStop(1, '#2d1b0d');
    ctx.fillStyle = woodGradient;
    ctx.fill();
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (activePrizes.length === 0) return;

    let startAngle = rotationRef.current;

    activePrizes.forEach((prize) => {
      const sliceAngle = (prize.probability / totalWeight) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      
      // 扇形內陰影，營造紙張層次
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = prize.color === '#dcd7c9' ? '#2d1b0d' : '#fcfaf2';
      ctx.font = 'bold 15px "Noto Serif TC"';
      ctx.fillText(prize.label, radius - 55, 6);

      const img = imageElements[prize.id];
      if (img) {
        ctx.drawImage(img, radius - 50, -18, 36, 36);
      }
      
      ctx.restore();
      startAngle += sliceAngle;
    });

    // 中心黃銅裝飾
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    const brassGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 30);
    brassGradient.addColorStop(0, '#f9f3cc');
    brassGradient.addColorStop(0.5, '#d4af37');
    brassGradient.addColorStop(1, '#8b7355');
    ctx.fillStyle = brassGradient;
    ctx.fill();
    ctx.strokeStyle = '#5c3d2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 裝飾小點
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#2d1b0d';
    ctx.fill();
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
      if (randomVal <= accumulated) { winnerIndex = i; break; }
    }
    let winnerStartWeight = 0;
    for (let i = 0; i < winnerIndex; i++) winnerStartWeight += activePrizes[i].probability;
    const winnerMidAngle = ((winnerStartWeight + activePrizes[winnerIndex].probability/2) / totalWeight) * 2 * Math.PI;
    const baseRotations = config.rotations * 2 * Math.PI;
    const directionMult = config.direction === 'cw' ? 1 : -1;
    const targetTarget = (2 * Math.PI - winnerMidAngle) - (Math.PI / 2);
    const targetRotation = directionMult * (baseRotations + (targetTarget > 0 ? targetTarget : targetTarget + 2 * Math.PI));
    const startRot = rotationRef.current;
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 5); // 更平滑的 easeOutQuint
      const currentRot = startRot + (targetRotation * ease);
      setRotation(currentRot);
      rotationRef.current = currentRot;
      if (progress < 1) requestAnimationFrame(animate);
      else onSpinEnd(activePrizes[winnerIndex]);
    };
    animate();
  }, [isSpinning]);

  return (
    <div className="relative">
      {/* 復古指標 */}
      <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 z-20">
        <div className="w-10 h-16 bg-[#fcfaf2] rounded-t-full shadow-xl flex flex-col items-center border border-[#8d7b68]">
           <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#9a3b3b] mt-8" />
        </div>
      </div>
      <canvas ref={canvasRef} width={540} height={540} className="rounded-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]" />
    </div>
  );
};

export default Wheel;
