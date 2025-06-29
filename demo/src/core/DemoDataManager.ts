import type { 
  DemoScenario, 
  BrowserData, 
  MobileData, 
  LaptopData, 
  OverallData, 
  ChartData,
  ViewType 
} from '../types';
import { DEMO_DATA, DEMO_SCENARIOS, DEMO_CATEGORIES } from '../data/demoData';
import { TimeUtils } from '../utils/timeUtils';
import { StorageUtils } from '../utils/storageUtils';

/**
 * Centralized demo data management
 */
export class DemoDataManager {
  private static instance: DemoDataManager;
  private currentScenario: string = 'productive';
  private currentView: ViewType = 'today';

  private constructor() {}

  static getInstance(): DemoDataManager {
    if (!DemoDataManager.instance) {
      DemoDataManager.instance = new DemoDataManager();
    }
    return DemoDataManager.instance;
  }

  /**
   * Load demo scenario
   */
  async loadScenario(scenario: string): Promise<void> {
    this.currentScenario = scenario;
    
    const demoData = DEMO_SCENARIOS[scenario];
    if (!demoData) {
      console.error(`Scenario ${scenario} not found`);
      return;
    }

    // Store demo data in storage
    await StorageUtils.set({
      timeData: demoData.timeData,
      goals: demoData.goals,
      categories: DEMO_CATEGORIES,
      demoMode: true,
      demoScenario: scenario
    });

    this.showNotification(`Loaded ${demoData.name} scenario`);
  }

  /**
   * Get browser data with view-specific adjustments
   */
  getBrowserData(view: ViewType = this.currentView): BrowserData {
    const data = { ...DEMO_DATA.browser };
    
    if (view === 'week') {
      data.totalTime = data.weekTime;
      // Multiply daily data by 7 for weekly view
      Object.keys(data.categories).forEach(key => {
        const minutes = TimeUtils.parseTimeToMinutes(data.categories[key].time);
        data.categories[key].time = TimeUtils.formatMinutes(minutes * 7);
      });
      
      data.topSites = data.topSites.map(site => ({
        ...site,
        time: TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(site.time) * 7)
      }));
    }
    
    return data;
  }

  /**
   * Get mobile data with view-specific adjustments
   */
  getMobileData(view: ViewType = this.currentView): MobileData {
    const data = { ...DEMO_DATA.mobile };
    
    if (view === 'week') {
      data.totalTime = data.weekTime;
      data.pickups = data.pickups * 7;
      data.notifications = data.notifications * 7;
      
      data.apps = data.apps.map(app => ({
        ...app,
        time: TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(app.time) * 7)
      }));
    }
    
    return data;
  }

  /**
   * Get laptop data with view-specific adjustments
   */
  getLaptopData(view: ViewType = this.currentView): LaptopData {
    const data = { ...DEMO_DATA.laptop };
    
    if (view === 'week') {
      data.totalTime = data.weekTime;
      data.activeTime = TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(data.activeTime) * 7);
      data.idleTime = TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(data.idleTime) * 7);
      
      data.applications = data.applications.map(app => ({
        ...app,
        time: TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(app.time) * 7)
      }));
    }
    
    return data;
  }

  /**
   * Get overall data with view-specific adjustments
   */
  getOverallData(view: ViewType = this.currentView): OverallData {
    const data = { ...DEMO_DATA.overall };
    
    if (view === 'week') {
      data.totalTime = data.weekTime;
      data.devices.laptop.time = TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(data.devices.laptop.time) * 7);
      data.devices.mobile.time = TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(data.devices.mobile.time) * 7);
      data.devices.browser.time = TimeUtils.formatMinutes(TimeUtils.parseTimeToMinutes(data.devices.browser.time) * 7);
    }
    
    return data;
  }

  /**
   * Get chart data for categories
   */
  getCategoryChartData(view: ViewType = this.currentView): ChartData {
    const browserData = this.getBrowserData(view);
    const categories = browserData.categories;
    
    return {
      labels: Object.keys(categories),
      data: Object.values(categories).map(cat => cat.percentage),
      colors: Object.values(categories).map(cat => cat.color)
    };
  }

  /**
   * Get chart data for mobile apps
   */
  getMobileChartData(view: ViewType = this.currentView): ChartData {
    const mobileData = this.getMobileData(view);
    const apps = mobileData.apps.slice(0, 6);
    
    return {
      labels: apps.map(app => app.name),
      data: apps.map(app => app.percentage || 0),
      colors: ['#E4405F', '#25D366', '#1DB954', '#FF0000', '#FF6B6B', '#EA4335']
    };
  }

  /**
   * Get chart data for laptop applications
   */
  getLaptopChartData(view: ViewType = this.currentView): ChartData {
    const laptopData = this.getLaptopData(view);
    const apps = laptopData.applications.slice(0, 6);
    
    return {
      labels: apps.map(app => app.name),
      data: apps.map(app => app.percentage || 0),
      colors: ['#007ACC', '#4285F4', '#0078D4', '#217346', '#1DB954', '#4A154B']
    };
  }

  /**
   * Get chart data for overall device usage
   */
  getOverallChartData(view: ViewType = this.currentView): ChartData {
    const overallData = this.getOverallData(view);
    const devices = overallData.devices;
    
    return {
      labels: ['Laptop', 'Mobile', 'Browser'],
      data: [devices.laptop.percentage, devices.mobile.percentage, devices.browser.percentage],
      colors: ['#007ACC', '#E4405F', '#4285F4']
    };
  }

  /**
   * Get weekly chart data
   */
  getWeeklyChartData(): any {
    return DEMO_DATA.browser.weeklyData;
  }

  /**
   * Set current view
   */
  setCurrentView(view: ViewType): void {
    this.currentView = view;
  }

  /**
   * Get current scenario
   */
  getCurrentScenario(): string {
    return this.currentScenario;
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios(): Record<string, DemoScenario> {
    return DEMO_SCENARIOS;
  }

  /**
   * Show notification
   */
  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #4caf50, #45a049);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Generate random data variation for live demo feel
   */
  addRandomVariation<T extends Record<string, any>>(data: T, variation: number = 0.1): T {
    const result = { ...data };
    
    // Add variation to time values
    if (result.totalTime) {
      const minutes = TimeUtils.parseTimeToMinutes(result.totalTime);
      const varied = TimeUtils.addRandomVariation(minutes, variation);
      result.totalTime = TimeUtils.formatMinutes(varied);
    }
    
    return result;
  }
}