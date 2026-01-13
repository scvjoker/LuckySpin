
export interface Prize {
  id: string;
  label: string;
  probability: number; // Weight
  color: string;
}

export interface AppTheme {
  name: string;
  description: string;
  prizes: Partial<Prize>[];
}
