import type { ChromeAPI } from '../types';

/**
 * Storage utility class with Chrome API compatibility
 */
export class StorageUtils {
  private static chrome: ChromeAPI | null = null;

  /**
   * Initialize Chrome API compatibility
   */
  static initChromeAPI(): void {
    if (typeof window !== 'undefined' && !(window as any).chrome) {
      (window as any).chrome = this.createChromeAPIShim();
    }
    this.chrome = (window as any).chrome;
  }

  /**
   * Create Chrome API shim for demo mode
   */
  private static createChromeAPIShim(): ChromeAPI {
    return {
      storage: {
        local: {
          get: async (keys: string | string[] | Record<string, any>) => {
            const result: Record<string, any> = {};
            
            if (typeof keys === 'string') {
              keys = [keys];
            }
            
            if (Array.isArray(keys)) {
              keys.forEach(key => {
                const data = localStorage.getItem(`timesetu_${key}`);
                if (data) {
                  try {
                    result[key] = JSON.parse(data);
                  } catch (e) {
                    result[key] = data;
                  }
                }
              });
            } else if (typeof keys === 'object') {
              Object.keys(keys).forEach(key => {
                const data = localStorage.getItem(`timesetu_${key}`);
                if (data) {
                  try {
                    result[key] = JSON.parse(data);
                  } catch (e) {
                    result[key] = keys[key]; // default value
                  }
                } else {
                  result[key] = keys[key]; // default value
                }
              });
            }
            
            return result;
          },
          
          set: async (data: Record<string, any>) => {
            Object.keys(data).forEach(key => {
              localStorage.setItem(`timesetu_${key}`, JSON.stringify(data[key]));
            });
          },
          
          remove: async (keys: string | string[]) => {
            if (typeof keys === 'string') {
              keys = [keys];
            }
            
            keys.forEach(key => {
              localStorage.removeItem(`timesetu_${key}`);
            });
          }
        },
        sync: {} as any, // Will be set to local
        onChanged: {
          addListener: (callback: (changes: any, area: string) => void) => {
            // Demo implementation
            console.log('Storage change listener added');
          }
        }
      },
      runtime: {
        getURL: (path: string) => path,
        sendMessage: (message: any, callback?: (response: any) => void) => {
          console.log('Demo: Runtime message sent:', message);
          if (callback) {
            callback({ success: true });
          }
        }
      },
      tabs: {
        create: (options: { url?: string }) => {
          console.log('Demo: Would create tab with:', options);
          if (options.url) {
            window.open(options.url, '_blank');
          }
        },
        query: (queryInfo: any, callback: (tabs: any[]) => void) => {
          console.log('Demo: Would query tabs with:', queryInfo);
          callback([{
            id: 1,
            url: 'https://demo.example.com',
            title: 'Demo Tab',
            active: true
          }]);
        },
        get: (tabId: number, callback: (tab: any) => void) => {
          console.log('Demo: Would get tab:', tabId);
          callback({
            id: tabId,
            url: 'https://demo.example.com',
            title: 'Demo Tab',
            active: true
          });
        },
        update: (tabId: number, updateProperties: any, callback?: () => void) => {
          console.log('Demo: Would update tab:', tabId, updateProperties);
          if (callback) callback();
        }
      },
      notifications: {
        create: (notificationId: string, options: any, callback?: () => void) => {
          console.log('Demo: Would create notification:', options);
          this.showDemoNotification(options.title || 'Notification', options.message || 'Demo notification');
          if (callback) callback();
        }
      },
      alarms: {
        create: (name: string, alarmInfo: any, callback?: () => void) => {
          console.log('Demo: Would create alarm:', name, alarmInfo);
          if (callback) callback();
        },
        onAlarm: {
          addListener: (callback: (alarm: any) => void) => {
            console.log('Demo: Alarm listener added');
          }
        }
      },
      windows: {
        WINDOW_ID_NONE: -1,
        onFocusChanged: {
          addListener: (callback: (windowId: number) => void) => {
            console.log('Demo: Window focus listener added');
          }
        }
      }
    };
  }

  /**
   * Show demo notification
   */
  private static showDemoNotification(title: string, message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2196f3, #1976d2);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
      <div>${message}</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Get data from storage
   */
  static async get(keys: string | string[] | Record<string, any>): Promise<any> {
    if (!this.chrome) this.initChromeAPI();
    return this.chrome!.storage.local.get(keys);
  }

  /**
   * Set data in storage
   */
  static async set(data: Record<string, any>): Promise<void> {
    if (!this.chrome) this.initChromeAPI();
    return this.chrome!.storage.local.set(data);
  }

  /**
   * Remove data from storage
   */
  static async remove(keys: string | string[]): Promise<void> {
    if (!this.chrome) this.initChromeAPI();
    return this.chrome!.storage.local.remove(keys);
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('timesetu_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }
}

// Migration function to handle old localStorage keys
function migrateLocalStorageKeys(): void {
    const oldPrefix = 'webtimewise_';
    const newPrefix = 'timesetu_';
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find keys that start with the old prefix
    const oldKeys = keys.filter(key => key.startsWith(oldPrefix));
    
    // Migrate each old key to the new prefix
    oldKeys.forEach(oldKey => {
        const newKey = oldKey.replace(oldPrefix, newPrefix);
        const value = localStorage.getItem(oldKey);
        
        // Only migrate if the new key doesn't already exist and value is not null
        if (value !== null && !localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, value);
        }
        
        // Remove the old key
        localStorage.removeItem(oldKey);
    });
    
    if (oldKeys.length > 0) {
        console.log(`Migrated ${oldKeys.length} localStorage keys from ${oldPrefix} to ${newPrefix}`);
    }
}

// Run migration on load
migrateLocalStorageKeys();

// Initialize Chrome API on module load
StorageUtils.initChromeAPI();