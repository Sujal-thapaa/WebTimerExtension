// Core Types for TimeSetu Demo
export interface TimeData {
  sites: Record<string, number>;
  categories: Record<string, number>;
}

export interface DemoScenario {
  name: string;
  timeData: Record<string, TimeData>;
  goals: Goals;
}

export interface Goals {
  productiveHours: number;
  entertainmentHours: number;
  socialMediaHours: number;
  streak: number;
}

export interface CategoryInfo {
  description: string;
  examples: string[];
}

export interface SiteData {
  name: string;
  time: string;
  category: string;
  favicon: string;
  domain?: string;
}

export interface AppData {
  name: string;
  time: string;
  category: string;
  icon: string;
  logo?: string;
  percentage?: number;
}

export interface DeviceData {
  totalTime: string;
  todayTime: string;
  weekTime: string;
}

export interface BrowserData extends DeviceData {
  categories: Record<string, CategoryData>;
  topSites: SiteData[];
  apps: AppData[];
  weeklyData: WeeklyData;
}

export interface MobileData extends DeviceData {
  pickups: number;
  avgSession: string;
  notifications: number;
  mostUsed: string;
  apps: AppData[];
  weeklyStats: WeeklyStats;
  topSites: SiteData[];
}

export interface LaptopData extends DeviceData {
  activeTime: string;
  idleTime: string;
  batteryRemaining: string;
  dataUsed: string;
  applications: AppData[];
  weeklyProductivity: WeeklyProductivity;
}

export interface OverallData extends DeviceData {
  devices: {
    laptop: DeviceUsage;
    mobile: DeviceUsage;
    browser: DeviceUsage;
  };
  focusScore: number;
  weeklyBreakdown: WeeklyBreakdown;
  topSites: SiteData[];
  topApps: AppData[];
}

export interface CategoryData {
  time: string;
  percentage: number;
  color: string;
}

export interface DeviceUsage {
  time: string;
  percentage: number;
  usage: string;
}

export interface WeeklyData {
  labels: string[];
  productive: number[];
  entertainment: number[];
  social: number[];
}

export interface WeeklyStats {
  labels: string[];
  screenTime: number[];
  pickups: number[];
}

export interface WeeklyProductivity {
  labels: string[];
  productive: number[];
  idle: number[];
}

export interface WeeklyBreakdown {
  labels: string[];
  laptop: number[];
  mobile: number[];
  browser: number[];
}

export interface ChartData {
  labels: string[];
  data: number[];
  colors: string[];
}

export interface GoalItem {
  name: string;
  goal: string;
  actual: string;
  status: 'good' | 'complete' | 'over';
}

export interface ShareData {
  totalScreenTime: string;
  productiveTime: string;
  focusScore: number;
  goalsMet: string;
  weeklyHighlights: string[];
  recentShares: ShareItem[];
}

export interface ShareItem {
  title: string;
  platform: string;
  time: string;
}

export interface SettingsData {
  categories: CategorySetting[];
}

export interface CategorySetting {
  name: string;
  color: string;
  count: number;
}

export interface FocusModeData {
  isActive: boolean;
  blockedSites: string[];
  sessionsToday: number;
  totalFocusTime: string;
  longestSession: string;
}

// Event Types
export interface ViewChangeEvent {
  view: 'today' | 'week';
  data: any;
}

export interface ChartClickEvent {
  category: string;
  value: number;
}

// Chrome API Types (for demo compatibility)
export interface ChromeStorage {
  local: {
    get: (keys: string | string[] | Record<string, any>, callback?: (result: any) => void) => Promise<any>;
    set: (data: Record<string, any>, callback?: () => void) => Promise<void>;
    remove: (keys: string | string[], callback?: () => void) => Promise<void>;
  };
  sync: ChromeStorage['local'];
  onChanged: {
    addListener: (callback: (changes: any, area: string) => void) => void;
  };
}

export interface ChromeRuntime {
  getURL: (path: string) => string;
  sendMessage: (message: any, callback?: (response: any) => void) => void;
}

export interface ChromeTabs {
  create: (options: { url?: string }) => void;
  query: (queryInfo: any, callback: (tabs: any[]) => void) => void;
  get: (tabId: number, callback: (tab: any) => void) => void;
  update: (tabId: number, updateProperties: any, callback?: () => void) => void;
}

export interface ChromeNotifications {
  create: (notificationId: string, options: any, callback?: () => void) => void;
}

export interface ChromeAlarms {
  create: (name: string, alarmInfo: any, callback?: () => void) => void;
  onAlarm: {
    addListener: (callback: (alarm: any) => void) => void;
  };
}

export interface ChromeWindows {
  WINDOW_ID_NONE: number;
  onFocusChanged: {
    addListener: (callback: (windowId: number) => void) => void;
  };
}

export interface ChromeAPI {
  storage: ChromeStorage;
  runtime: ChromeRuntime;
  tabs: ChromeTabs;
  notifications: ChromeNotifications;
  alarms: ChromeAlarms;
  windows: ChromeWindows;
}

// Utility Types
export type TimeUnit = 'minutes' | 'hours' | 'days';
export type ViewType = 'today' | 'week' | 'month';
export type ChartType = 'doughnut' | 'bar' | 'line';
export type DeviceType = 'browser' | 'mobile' | 'laptop' | 'overall';