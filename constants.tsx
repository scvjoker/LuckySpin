
import { Prize } from './types';

export const DEFAULT_PRIZES: Prize[] = [
  { id: '1', label: '大獎 iPhone 15', probability: 5, color: '#ef4444' },
  { id: '2', label: '二獎 iPad Air', probability: 10, color: '#f59e0b' },
  { id: '3', label: '三獎 禮券 $500', probability: 15, color: '#10b981' },
  { id: '4', label: '四獎 免費咖啡', probability: 20, color: '#3b82f6' },
  { id: '5', label: '銘謝惠顧', probability: 50, color: '#64748b' },
];

export const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e'
];
