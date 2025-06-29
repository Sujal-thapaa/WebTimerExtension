import type { TimeUnit } from '../types';

/**
 * Utility functions for time parsing and formatting
 */
export class TimeUtils {
  /**
   * Parse time string like "1h 23m" to minutes
   */
  static parseTimeToMinutes(timeStr: string): number {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
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

  /**
   * Format minutes to readable time string
   */
  static formatMinutes(minutes: number): string {
    if (minutes < 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Format time for speech synthesis
   */
  static formatTimeForSpeech(timeStr: string): string {
    if (!timeStr || timeStr.trim() === '') return '0 minutes';
    
    const match = timeStr.match(/(\d+)h\s*(\d+)m/);
    if (!match) return timeStr;
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours === 0 && minutes === 0) {
      return '0 minutes';
    } else if (hours === 0) {
      return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    } else if (minutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    } else {
      const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
      const minuteText = minutes === 1 ? '1 minute' : `${minutes} minutes`;
      return `${hourText} ${minuteText}`;
    }
  }

  /**
   * Convert milliseconds to hours with decimal
   */
  static msToHours(ms: number): number {
    return Math.round((ms / 3600000) * 10) / 10;
  }

  /**
   * Add random variation to base value for demo purposes
   */
  static addRandomVariation(baseValue: number, variation: number = 0.1): number {
    const randomFactor = 1 + (Math.random() - 0.5) * variation;
    return Math.round(baseValue * randomFactor);
  }

  /**
   * Get current week number
   */
  static getWeekNumber(date: Date = new Date()): number {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /**
   * Calculate percentage of time spent
   */
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Sum time values from array of objects with time property
   */
  static sumTimeValues(items: Array<{ time: string }>): number {
    return items.reduce((acc, item) => {
      return acc + this.parseTimeToMinutes(item.time);
    }, 0);
  }

  /**
   * Get time ago string
   */
  static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Validate time string format
   */
  static isValidTimeString(timeStr: string): boolean {
    const timeRegex = /^(\d+h\s*)?(\d+m)?$/;
    return timeRegex.test(timeStr.trim());
  }

  /**
   * Convert time string to different unit
   */
  static convertTime(timeStr: string, toUnit: TimeUnit): number {
    const minutes = this.parseTimeToMinutes(timeStr);
    
    switch (toUnit) {
      case 'minutes':
        return minutes;
      case 'hours':
        return minutes / 60;
      case 'days':
        return minutes / (60 * 24);
      default:
        return minutes;
    }
  }
}