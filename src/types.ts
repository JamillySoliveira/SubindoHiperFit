export interface User {
  id: string;
  name: string;
  email: string;
  targetBMI: number;
  initialWeight?: number;
  photoURL?: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  height: number; // in cm
  bmi: number;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface ChartPoint {
  dateLabel: string;
  bmi: number;
  weight: number;
  isToday?: boolean;
}

export interface DashboardStats {
  currentWeight: number;
  currentBMI: number;
  bmiDeltaThisWeek: number; // e.g. -0.5
  goalProgressPercent: number; // e.g. 78
  targetBMI: number;
  monthlyChangePercent: number; // e.g. -1.8
  monthlyChangeKgLost: number; // e.g. -1.2
  trendData: ChartPoint[];
  recentHistory: WeightEntry[];
  healthInsight: string;
  hasCaloricDeficitDays: number;
}
