// Chrome API compatibility layer for demo dashboard
(function() {
    'use strict';
    
    // Migration function to handle old localStorage keys
    function migrateLocalStorageKeys() {
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
            
            // Only migrate if the new key doesn't already exist
            if (!localStorage.getItem(newKey)) {
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
    
    // Create chrome object if it doesn't exist
    if (typeof chrome === 'undefined') {
        window.chrome = {};
    }
    
    // Create storage API
    if (!chrome.storage) {
        chrome.storage = {};
    }
    
    if (!chrome.storage.local) {
        chrome.storage.local = {
            get: function(keys, callback) {
                const result = {};
                
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
                
                if (callback) {
                    callback(result);
                }
                return Promise.resolve(result);
            },
            
            set: function(data, callback) {
                Object.keys(data).forEach(key => {
                    localStorage.setItem(`timesetu_${key}`, JSON.stringify(data[key]));
                });
                
                if (callback) {
                    callback();
                }
                return Promise.resolve();
            },
            
            remove: function(keys, callback) {
                if (typeof keys === 'string') {
                    keys = [keys];
                }
                
                keys.forEach(key => {
                    localStorage.removeItem(`timesetu_${key}`);
                });
                
                if (callback) {
                    callback();
                }
                return Promise.resolve();
            }
        };
    }
    
    if (!chrome.storage.sync) {
        chrome.storage.sync = chrome.storage.local;
    }
    
    // Create runtime API
    if (!chrome.runtime) {
        chrome.runtime = {
            getURL: function(path) {
                return path;
            },
            sendMessage: function(message, callback) {
                console.log('Demo: Runtime message sent:', message);
                if (callback) {
                    callback({ success: true });
                }
            }
        };
    }
    
    // Create tabs API
    if (!chrome.tabs) {
        chrome.tabs = {
            create: function(options) {
                console.log('Demo: Would create tab with:', options);
                if (options.url) {
                    window.open(options.url, '_blank');
                }
            },
            query: function(queryInfo, callback) {
                console.log('Demo: Would query tabs with:', queryInfo);
                if (callback) {
                    callback([{
                        id: 1,
                        url: 'https://demo.example.com',
                        title: 'Demo Tab',
                        active: true
                    }]);
                }
            },
            get: function(tabId, callback) {
                console.log('Demo: Would get tab:', tabId);
                if (callback) {
                    callback({
                        id: tabId,
                        url: 'https://demo.example.com',
                        title: 'Demo Tab',
                        active: true
                    });
                }
            },
            update: function(tabId, updateProperties, callback) {
                console.log('Demo: Would update tab:', tabId, updateProperties);
                if (callback) {
                    callback();
                }
            }
        };
    }
    
    // Create notifications API
    if (!chrome.notifications) {
        chrome.notifications = {
            create: function(notificationId, options, callback) {
                console.log('Demo: Would create notification:', options);
                
                // Show a demo notification
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
                    <div style="font-weight: bold; margin-bottom: 5px;">${options.title || 'Notification'}</div>
                    <div>${options.message || 'Demo notification'}</div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }, 5000);
                
                if (callback) {
                    callback();
                }
            }
        };
    }
    
    // Create alarms API
    if (!chrome.alarms) {
        chrome.alarms = {
            create: function(name, alarmInfo, callback) {
                console.log('Demo: Would create alarm:', name, alarmInfo);
                if (callback) {
                    callback();
                }
            },
            onAlarm: {
                addListener: function(callback) {
                    console.log('Demo: Alarm listener added');
                }
            }
        };
    }
    
    // Create windows API
    if (!chrome.windows) {
        chrome.windows = {
            WINDOW_ID_NONE: -1,
            onFocusChanged: {
                addListener: function(callback) {
                    console.log('Demo: Window focus listener added');
                }
            }
        };
    }
    
    console.log('Demo: Chrome API compatibility layer loaded');
})(); 