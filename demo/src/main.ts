import { DemoDataManager } from './core/DemoDataManager';
import { EventManager } from './core/EventManager';
import { ViewSwitcher } from './components/ViewSwitcher';
import { CategoryChartComponent, DeviceChartComponent } from './components/ChartComponent';
import { Modal, GoalsModal } from './components/Modal';
import { StorageUtils } from './utils/storageUtils';

/**
 * Main application class
 */
class TimeSetuDemo {
  private dataManager: DemoDataManager;
  private eventManager: EventManager;
  private components: Map<string, any> = new Map();

  constructor() {
    this.dataManager = DemoDataManager.getInstance();
    this.eventManager = EventManager.getInstance();
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    console.log('🚀 Initializing TimeSetu Demo...');
    
    // Initialize storage
    StorageUtils.initChromeAPI();
    
    // Load default scenario
    await this.dataManager.loadScenario('productive');
    
    // Initialize components based on current page
    this.initializeComponents();
    
    // Setup global event listeners
    this.setupGlobalEventListeners();
    
    console.log('✅ TimeSetu Demo initialized successfully');
  }

  /**
   * Initialize components based on current page
   */
  private initializeComponents(): void {
    const currentPage = this.getCurrentPage();
    
    switch (currentPage) {
      case 'browser-view':
        this.initBrowserView();
        break;
      case 'mobile-view':
        this.initMobileView();
        break;
      case 'laptop-view':
        this.initLaptopView();
        break;
      case 'overall-view':
        this.initOverallView();
        break;
      case 'share-stats':
        this.initShareView();
        break;
      default:
        this.initHomePage();
    }
    
    // Initialize common components
    this.initCommonComponents();
  }

  /**
   * Get current page identifier
   */
  private getCurrentPage(): string {
    const path = window.location.pathname;
    const filename = path.split('/').pop()?.replace('.html', '') || 'index';
    return filename;
  }

  /**
   * Initialize browser view components
   */
  private initBrowserView(): void {
    console.log('Initializing browser view...');
    
    // View switcher
    const viewSwitcherEl = document.querySelector('.time-period');
    if (viewSwitcherEl) {
      const viewSwitcher = new ViewSwitcher(viewSwitcherEl as HTMLElement);
      this.components.set('viewSwitcher', viewSwitcher);
    }
    
    // Category chart
    const categoryChartEl = document.getElementById('categoryChart');
    if (categoryChartEl) {
      const categoryChart = new CategoryChartComponent(categoryChartEl.parentElement as HTMLElement);
      this.components.set('categoryChart', categoryChart);
    }
    
    // Setup browser-specific event listeners
    this.setupBrowserEventListeners();
  }

  /**
   * Initialize mobile view components
   */
  private initMobileView(): void {
    console.log('Initializing mobile view...');
    
    // Similar to browser view but with mobile-specific components
    const viewSwitcherEl = document.querySelector('.time-period');
    if (viewSwitcherEl) {
      const viewSwitcher = new ViewSwitcher(viewSwitcherEl as HTMLElement);
      this.components.set('viewSwitcher', viewSwitcher);
    }
  }

  /**
   * Initialize laptop view components
   */
  private initLaptopView(): void {
    console.log('Initializing laptop view...');
    
    const viewSwitcherEl = document.querySelector('.time-period');
    if (viewSwitcherEl) {
      const viewSwitcher = new ViewSwitcher(viewSwitcherEl as HTMLElement);
      this.components.set('viewSwitcher', viewSwitcher);
    }
  }

  /**
   * Initialize overall view components
   */
  private initOverallView(): void {
    console.log('Initializing overall view...');
    
    // View switcher
    const viewSwitcherEl = document.querySelector('.time-period');
    if (viewSwitcherEl) {
      const viewSwitcher = new ViewSwitcher(viewSwitcherEl as HTMLElement);
      this.components.set('viewSwitcher', viewSwitcher);
    }
    
    // Device chart
    const deviceChartEl = document.getElementById('deviceChart');
    if (deviceChartEl) {
      const deviceChart = new DeviceChartComponent(deviceChartEl.parentElement as HTMLElement);
      this.components.set('deviceChart', deviceChart);
    }
    
    // Category chart
    const categoryChartEl = document.getElementById('categoryChart');
    if (categoryChartEl) {
      const categoryChart = new CategoryChartComponent(categoryChartEl.parentElement as HTMLElement);
      this.components.set('categoryChart', categoryChart);
    }
  }

  /**
   * Initialize share view components
   */
  private initShareView(): void {
    console.log('Initializing share view...');
    // Share-specific initialization
  }

  /**
   * Initialize home page components
   */
  private initHomePage(): void {
    console.log('Initializing home page...');
    this.setupScenarioButtons();
  }

  /**
   * Initialize common components (modals, etc.)
   */
  private initCommonComponents(): void {
    // Goals modal
    const goalsModalEl = document.getElementById('goalsModal');
    if (goalsModalEl) {
      const goalsModal = new GoalsModal(goalsModalEl);
      this.components.set('goalsModal', goalsModal);
    }
    
    // More modal
    const moreModalEl = document.getElementById('moreModal');
    if (moreModalEl) {
      const moreModal = new Modal(moreModalEl);
      this.components.set('moreModal', moreModal);
    }
    
    // Settings modal
    const settingsModalEl = document.getElementById('settingsModal');
    if (settingsModalEl) {
      const settingsModal = new Modal(settingsModalEl);
      this.components.set('settingsModal', settingsModal);
    }
  }

  /**
   * Setup global event listeners
   */
  private setupGlobalEventListeners(): void {
    // Modal triggers
    const goalsBtn = document.getElementById('goalsBtn');
    if (goalsBtn) {
      goalsBtn.addEventListener('click', () => {
        const modal = this.components.get('goalsModal');
        if (modal) modal.open();
      });
    }
    
    const moreBtn = document.getElementById('moreBtn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const modal = this.components.get('moreModal');
        if (modal) modal.open();
      });
    }
    
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        const modal = this.components.get('settingsModal');
        if (modal) modal.open();
      });
    }
    
    // Dashboard navigation
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  }

  /**
   * Setup browser-specific event listeners
   */
  private setupBrowserEventListeners(): void {
    // Browser-specific logic
    this.eventManager.onViewChange((event) => {
      this.updateBrowserView(event.view);
    });
  }

  /**
   * Update browser view for time period change
   */
  private updateBrowserView(view: 'today' | 'week'): void {
    const browserData = this.dataManager.getBrowserData(view);
    
    // Update total time
    const totalTimeEl = document.getElementById('totalTime');
    if (totalTimeEl) {
      totalTimeEl.textContent = browserData.totalTime;
    }
    
    // Update title
    const titleEl = document.querySelector('.total-time-card h2');
    if (titleEl) {
      titleEl.textContent = view === 'today' ? 'Total Time Today' : 'Total Time This Week';
    }
    
    // Update chart
    const categoryChart = this.components.get('categoryChart');
    if (categoryChart) {
      categoryChart.updateForView(view);
    }
  }

  /**
   * Setup scenario buttons on home page
   */
  private setupScenarioButtons(): void {
    const scenarioButtons = document.querySelectorAll('.scenario-btn');
    scenarioButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = (e.target as HTMLElement).dataset.scenario;
        if (scenario) {
          this.dataManager.loadScenario(scenario);
          this.updateScenarioButtons(scenario);
        }
      });
    });
  }

  /**
   * Update scenario button states
   */
  private updateScenarioButtons(activeScenario: string): void {
    const scenarioButtons = document.querySelectorAll('.scenario-btn');
    scenarioButtons.forEach(btn => {
      const scenario = (btn as HTMLElement).dataset.scenario;
      btn.classList.toggle('active', scenario === activeScenario);
    });
  }

  /**
   * Destroy application
   */
  destroy(): void {
    // Destroy all components
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    
    // Clear event manager
    this.eventManager.clear();
    
    console.log('TimeSetu Demo destroyed');
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new TimeSetuDemo();
  await app.init();
  
  // Make app globally available for debugging
  (window as any).timeSetuDemo = app;
});

// Export for module usage
export { TimeSetuDemo };