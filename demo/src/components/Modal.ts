import { BaseComponent } from './BaseComponent';

/**
 * Modal component for popup dialogs
 */
export class Modal extends BaseComponent {
  private isOpen: boolean = false;
  private closeBtn: HTMLElement | null = null;
  private modalContent: HTMLElement | null = null;

  protected init(): void {
    this.closeBtn = this.querySelector('.close-btn');
    this.modalContent = this.querySelector('.modal-content');
    this.setupEventListeners();
  }

  protected render(): void {
    // Modal content is rendered by specific implementations
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Close button
    if (this.closeBtn) {
      this.addEventListener('click', () => this.close(), this.closeBtn);
    }

    // Click outside to close
    this.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Open modal
   */
  open(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.element.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Animate in
    this.animate(this.element, [
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      easing: 'ease-out'
    });

    if (this.modalContent) {
      this.animate(this.modalContent, [
        { transform: 'translateY(-30px) scale(0.95)', opacity: 0 },
        { transform: 'translateY(0) scale(1)', opacity: 1 }
      ], {
        duration: 400,
        easing: 'ease-out'
      });
    }

    this.eventManager.emit('modalOpen', this.element.id);
  }

  /**
   * Close modal
   */
  close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    document.body.style.overflow = '';

    // Animate out
    const animation = this.animate(this.element, [
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in'
    });

    animation.addEventListener('finish', () => {
      this.element.style.display = 'none';
    });

    this.eventManager.emit('modalClose', this.element.id);
  }

  /**
   * Toggle modal
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Check if modal is open
   */
  isModalOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Set modal content
   */
  setContent(content: string): void {
    if (this.modalContent) {
      this.setHTMLContent(this.modalContent, content);
    }
  }
}

/**
 * Goals modal component
 */
export class GoalsModal extends Modal {
  protected init(): void {
    super.init();
    this.loadGoalsData();
  }

  /**
   * Load and display goals data
   */
  private async loadGoalsData(): void {
    // Implementation for goals data loading
    const goalsContainer = this.querySelector('.goals-container');
    if (goalsContainer) {
      // Render goals content
      this.renderGoals(goalsContainer);
    }
  }

  /**
   * Render goals content
   */
  private renderGoals(container: HTMLElement): void {
    const goalsData = [
      { name: 'Social Media', actual: '1h 37m', goal: '2h', status: 'good' },
      { name: 'Entertainment', actual: '30m', goal: '1h 30m', status: 'good' },
      { name: 'Productive / Educational', actual: '1h 54m', goal: '4h', status: 'under' },
      { name: 'Development', actual: '31m', goal: '3h', status: 'under' },
      { name: 'Games', actual: '1h 52m', goal: '2h', status: 'good' },
      { name: 'Communication', actual: '9m', goal: '1h', status: 'under' }
    ];

    const html = goalsData.map(goal => `
      <div class="goal-item">
        <div class="goal-header">
          <span class="goal-name">${goal.name}</span>
          <span class="goal-time">${goal.actual} / ${goal.goal}</span>
        </div>
        <div class="goal-progress">
          <div class="progress-bar progress-${goal.status}">
            <div style="width: ${this.calculateProgress(goal.actual, goal.goal)}%"></div>
          </div>
          <span class="goal-percentage">${this.calculateProgress(goal.actual, goal.goal)}%</span>
        </div>
      </div>
    `).join('');

    this.setHTMLContent(container, html);
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(actual: string, goal: string): number {
    const actualMinutes = this.parseTimeToMinutes(actual);
    const goalMinutes = this.parseTimeToMinutes(goal);
    return Math.min(100, Math.round((actualMinutes / goalMinutes) * 100));
  }

  /**
   * Parse time string to minutes
   */
  private parseTimeToMinutes(timeStr: string): number {
    let minutes = 0;
    const parts = timeStr.split(' ');
    for (const part of parts) {
      if (part.endsWith('h')) {
        minutes += parseInt(part) * 60;
      } else if (part.endsWith('m')) {
        minutes += parseInt(part);
      }
    }
    return minutes;
  }
}