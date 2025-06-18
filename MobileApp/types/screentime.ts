export interface AppUsage {
  app: string;
  time: string;
  minutes: number;
  color: string;
}

export interface ScreenTimeData {
  device: string;
  date: string;
  data: { app: string; time: string }[];
}