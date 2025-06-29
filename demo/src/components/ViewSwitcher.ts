import { BaseComponent } from './BaseComponent';
import type { ViewType } from '../types';

/**
 * View switcher component for Today/Week toggle
 */
export class ViewSwitcher extends BaseComponent {
  private todayBtn: HTMLButtonElement | null = null;
  private weekBtn: HTMLButtonElement | null = null;
  private currentView: ViewType = 'today';

  protected init(): void {
    this.todayBtn = this.querySelector('#todayBtn');
    this.weekBtn = this.querySelector('#weekBtn');
    this.setupEventListeners();
  }

  protected render(): void {
    // Initial state is already set in HTML
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (this.todayBtn) {
      this.addEventListener('click', () => this.switchView('today'), this.todayBtn);
    }

    if (this.weekBtn) {
      this.addEventListener('click', () => this.switchView('week'), this.weekBtn);
    }
  }

  /**
   * Switch to specified view
   */
  private switchView(view: ViewType): void {
    if (this.currentView === view) return;

    this.currentView = view;
    this.updateButtonStates();
    
    // Emit view change event
    this.eventManager.emit('viewChange', {
      view,
      data: this.getViewData(view)
    });
  }

  /**
   * Update button active states
   */
  private updateButtonStates(): void {
    if (this.todayBtn && this.weekBtn) {
      this.toggleClass(this.todayBtn, 'active', this.currentView === 'today');
      this.toggleClass(this.weekBtn, 'active', this.currentView === 'week');
    }
  }

  /**
   * Get data for current view
   */
  private getViewData(view: ViewType): any {
    // This will be overridden by specific implementations
    return {};
  }

  /**
   * Get current view
   */
  getCurrentView(): ViewType {
    return this.currentView;
  }

  /**
   * Set view programmatically
   */
  setView(view: ViewType): void {
    this.switchView(view);
  }
}