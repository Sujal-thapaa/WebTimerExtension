import { EventManager } from '../core/EventManager';
import { DemoDataManager } from '../core/DemoDataManager';

/**
 * Base component class for all UI components
 */
export abstract class BaseComponent {
  protected element: HTMLElement;
  protected eventManager: EventManager;
  protected dataManager: DemoDataManager;

  constructor(element: HTMLElement) {
    this.element = element;
    this.eventManager = EventManager.getInstance();
    this.dataManager = DemoDataManager.getInstance();
    this.init();
  }

  /**
   * Initialize component
   */
  protected abstract init(): void;

  /**
   * Render component
   */
  protected abstract render(): void;

  /**
   * Destroy component
   */
  destroy(): void {
    // Override in subclasses if needed
  }

  /**
   * Add event listener to element
   */
  protected addEventListener(
    event: string, 
    handler: EventListener, 
    element: HTMLElement = this.element
  ): void {
    element.addEventListener(event, handler);
  }

  /**
   * Query selector within component
   */
  protected querySelector<T extends HTMLElement>(selector: string): T | null {
    return this.element.querySelector(selector);
  }

  /**
   * Query all selectors within component
   */
  protected querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return this.element.querySelectorAll(selector);
  }

  /**
   * Create element with classes and content
   */
  protected createElement(
    tag: string, 
    classes: string[] = [], 
    content: string = ''
  ): HTMLElement {
    const element = document.createElement(tag);
    element.className = classes.join(' ');
    element.innerHTML = content;
    return element;
  }

  /**
   * Show/hide element
   */
  protected toggleVisibility(element: HTMLElement, show: boolean): void {
    element.style.display = show ? '' : 'none';
  }

  /**
   * Add CSS classes
   */
  protected addClass(element: HTMLElement, ...classes: string[]): void {
    element.classList.add(...classes);
  }

  /**
   * Remove CSS classes
   */
  protected removeClass(element: HTMLElement, ...classes: string[]): void {
    element.classList.remove(...classes);
  }

  /**
   * Toggle CSS class
   */
  protected toggleClass(element: HTMLElement, className: string, force?: boolean): void {
    element.classList.toggle(className, force);
  }

  /**
   * Set element text content safely
   */
  protected setTextContent(element: HTMLElement | null, text: string): void {
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Set element HTML content safely
   */
  protected setHTMLContent(element: HTMLElement | null, html: string): void {
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Animate element
   */
  protected animate(
    element: HTMLElement, 
    keyframes: Keyframe[], 
    options: KeyframeAnimationOptions
  ): Animation {
    return element.animate(keyframes, options);
  }

  /**
   * Debounce function calls
   */
  protected debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function calls
   */
  protected throttle(func: Function, limit: number): Function {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

export { BaseComponent }