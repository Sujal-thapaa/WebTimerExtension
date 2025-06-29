import type { ChartData, ChartType } from '../types';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Utility class for chart operations
 */
export class ChartUtils {
  private static defaultColors = [
    '#4285F4', '#34A853', '#FBBC05', '#EA4335', 
    '#9C27B0', '#FF9800', '#607D8B', '#795548'
  ];

  /**
   * Create a chart with common configuration
   */
  static createChart(
    canvas: HTMLCanvasElement, 
    type: ChartType, 
    data: ChartData,
    options: Partial<ChartConfiguration['options']> = {}
  ): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const config: ChartConfiguration = {
      type,
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors || this.defaultColors,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: '#ffffff',
              boxWidth: 15,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value}${type === 'doughnut' ? '%' : ''}`;
              }
            }
          }
        },
        ...options
      }
    };

    return new Chart(ctx, config);
  }

  /**
   * Create a doughnut chart for categories
   */
  static createDoughnutChart(
    canvas: HTMLCanvasElement, 
    data: ChartData,
    onClick?: (category: string, value: number) => void
  ): Chart {
    const options: Partial<ChartConfiguration['options']> = {};
    
    if (onClick) {
      options.onClick = (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const category = data.labels[index];
          const value = data.data[index];
          onClick(category, value);
        }
      };
    }

    return this.createChart(canvas, 'doughnut', data, options);
  }

  /**
   * Create a bar chart for time series data
   */
  static createBarChart(
    canvas: HTMLCanvasElement, 
    data: ChartData,
    stacked: boolean = false
  ): Chart {
    const options: Partial<ChartConfiguration['options']> = {
      scales: {
        x: {
          stacked,
          ticks: { color: '#ffffff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          stacked,
          ticks: { 
            color: '#ffffff',
            callback: function(value) {
              return `${value}h`;
            }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    };

    return this.createChart(canvas, 'bar', data, options);
  }

  /**
   * Update chart data dynamically
   */
  static updateChart(chart: Chart, newData: ChartData): void {
    chart.data.labels = newData.labels;
    chart.data.datasets[0].data = newData.data;
    if (newData.colors) {
      chart.data.datasets[0].backgroundColor = newData.colors;
    }
    chart.update();
  }

  /**
   * Destroy chart safely
   */
  static destroyChart(chart: Chart | null): void {
    if (chart) {
      chart.destroy();
    }
  }

  /**
   * Generate colors for chart data
   */
  static generateColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(this.defaultColors[i % this.defaultColors.length]);
    }
    return colors;
  }

  /**
   * Convert data for chart consumption
   */
  static prepareChartData(
    labels: string[], 
    values: number[], 
    colors?: string[]
  ): ChartData {
    return {
      labels,
      data: values,
      colors: colors || this.generateColors(values.length)
    };
  }
}