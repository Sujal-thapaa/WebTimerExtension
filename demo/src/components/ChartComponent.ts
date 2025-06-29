import { BaseComponent } from './BaseComponent';
import { ChartUtils } from '../utils/chartUtils';
import type { ChartData, ChartType, ViewType } from '../types';
import { Chart } from 'chart.js';

/**
 * Chart component for displaying data visualizations
 */
export class ChartComponent extends BaseComponent {
  private chart: Chart | null = null;
  private canvas: HTMLCanvasElement;
  private chartType: ChartType;
  private currentView: ViewType = 'today';

  constructor(element: HTMLElement, chartType: ChartType = 'doughnut') {
    super(element);
    this.chartType = chartType;
    this.canvas = this.querySelector('canvas') || this.createCanvas();
  }

  protected init(): void {
    this.setupEventListeners();
    this.render();
  }

  protected render(): void {
    // Will be called by specific chart implementations
  }

  /**
   * Create canvas element if not exists
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    this.element.appendChild(canvas);
    return canvas;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.eventManager.onViewChange((event) => {
      this.currentView = event.view;
      this.updateChart();
    });
  }

  /**
   * Create chart with data
   */
  createChart(data: ChartData, onClick?: (category: string, value: number) => void): void {
    if (this.chart) {
      ChartUtils.destroyChart(this.chart);
    }

    switch (this.chartType) {
      case 'doughnut':
        this.chart = ChartUtils.createDoughnutChart(this.canvas, data, onClick);
        break;
      case 'bar':
        this.chart = ChartUtils.createBarChart(this.canvas, data);
        break;
      default:
        this.chart = ChartUtils.createChart(this.canvas, this.chartType, data);
    }
  }

  /**
   * Update chart with new data
   */
  updateChart(data?: ChartData): void {
    if (this.chart && data) {
      ChartUtils.updateChart(this.chart, data);
    }
  }

  /**
   * Get current chart instance
   */
  getChart(): Chart | null {
    return this.chart;
  }

  /**
   * Destroy chart
   */
  destroy(): void {
    if (this.chart) {
      ChartUtils.destroyChart(this.chart);
      this.chart = null;
    }
  }
}

/**
 * Category chart component
 */
export class CategoryChartComponent extends ChartComponent {
  constructor(element: HTMLElement) {
    super(element, 'doughnut');
  }

  protected render(): void {
    const data = this.dataManager.getCategoryChartData(this.currentView);
    this.createChart(data, (category, value) => {
      this.eventManager.emit('chartClick', { category, value });
    });
  }

  /**
   * Update for view change
   */
  updateForView(view: ViewType): void {
    this.currentView = view;
    const data = this.dataManager.getCategoryChartData(view);
    this.updateChart(data);
  }
}

/**
 * Device usage chart component
 */
export class DeviceChartComponent extends ChartComponent {
  constructor(element: HTMLElement) {
    super(element, 'doughnut');
  }

  protected render(): void {
    const data = this.dataManager.getOverallChartData(this.currentView);
    this.createChart(data);
  }

  /**
   * Update for view change
   */
  updateForView(view: ViewType): void {
    this.currentView = view;
    const data = this.dataManager.getOverallChartData(view);
    this.updateChart(data);
  }
}

/**
 * Weekly chart component
 */
export class WeeklyChartComponent extends ChartComponent {
  constructor(element: HTMLElement) {
    super(element, 'bar');
  }

  protected render(): void {
    const weeklyData = this.dataManager.getWeeklyChartData();
    const data: ChartData = {
      labels: weeklyData.labels,
      data: weeklyData.productive,
      colors: ['#4caf50']
    };
    this.createChart(data);
  }
}