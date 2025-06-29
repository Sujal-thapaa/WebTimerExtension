import type { ViewChangeEvent, ChartClickEvent } from '../types';

/**
 * Event management system for the demo
 */
export class EventManager {
  private static instance: EventManager;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * View change event
   */
  onViewChange(callback: (event: ViewChangeEvent) => void): void {
    this.on('viewChange', callback);
  }

  /**
   * Chart click event
   */
  onChartClick(callback: (event: ChartClickEvent) => void): void {
    this.on('chartClick', callback);
  }

  /**
   * Scenario change event
   */
  onScenarioChange(callback: (scenario: string) => void): void {
    this.on('scenarioChange', callback);
  }

  /**
   * Modal events
   */
  onModalOpen(callback: (modalId: string) => void): void {
    this.on('modalOpen', callback);
  }

  onModalClose(callback: (modalId: string) => void): void {
    this.on('modalClose', callback);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}