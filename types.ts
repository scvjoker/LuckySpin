
export interface Prize {
  id: string;
  label: string;
  probability: number;
  color: string;
  enabled: boolean;
  image?: string; // Base64 獎品圖片
}

export interface Participant {
  id: string;
  name: string;
  entries: number;
}

export interface SpinRecord {
  id: string;
  timestamp: number;
  person: string;
  prizeLabel: string;
  prizeImage?: string;
}

export interface WheelConfig {
  duration: number;
  rotations: number;
  direction: 'cw' | 'ccw';
  winnerEffectImage?: string; // 中獎時的背景特效圖
  title: string;
  subtitle: string;
}
