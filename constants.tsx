
import { Prize } from './types';

export const DEFAULT_PRIZES: Prize[] = [
  { id: '1', label: '特賞：手沖咖啡組', probability: 5, color: '#8d7b68', enabled: true },
  { id: '2', label: '貳賞：精裝筆記本', probability: 10, color: '#627254', enabled: true },
  { id: '3', label: '參賞：木質杯墊', probability: 15, color: '#a27b5c', enabled: true },
  { id: '4', label: '肆賞：文青帆布袋', probability: 20, color: '#3f4e4f', enabled: true },
  { id: '5', label: '再接再厲', probability: 50, color: '#dcd7c9', enabled: true },
];

export const PRESET_COLORS = [
  '#8d7b68', '#627254', '#a27b5c', '#3f4e4f', '#2c3639', 
  '#765827', '#435334', '#9a3b3b', '#526d82', '#643843'
];
