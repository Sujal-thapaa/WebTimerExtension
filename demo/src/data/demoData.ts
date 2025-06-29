import type { 
  DemoScenario, 
  BrowserData, 
  MobileData, 
  LaptopData, 
  OverallData, 
  ShareData, 
  Goals, 
  CategoryInfo,
  SettingsData,
  FocusModeData,
  ChartData
} from '../types';

// Demo scenarios with comprehensive data
export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  productive: {
    name: "📚 Productive Day",
    timeData: {
      "2025-01-20": {
        sites: {
          "github.com": 7200000, // 2 hours
          "stackoverflow.com": 3600000, // 1 hour
          "docs.google.com": 5400000, // 1.5 hours
          "notion.so": 3600000, // 1 hour
          "leetcode.com": 1800000, // 30 minutes
          "chat.openai.com": 1800000, // 30 minutes
          "wikipedia.org": 900000, // 15 minutes
          "medium.com": 900000 // 15 minutes
        },
        categories: {
          "Productive / Educational": 23400000, // 6.5 hours
          "News": 900000, // 15 minutes
          "Other / Uncategorized": 900000 // 15 minutes
        }
      }
    },
    goals: {
      productiveHours: 4,
      entertainmentHours: 2,
      socialMediaHours: 1,
      streak: 5
    }
  },
  
  social: {
    name: "📱 Social Media Day",
    timeData: {
      "2025-01-20": {
        sites: {
          "facebook.com": 7200000, // 2 hours
          "instagram.com": 5400000, // 1.5 hours
          "twitter.com": 3600000, // 1 hour
          "tiktok.com": 5400000, // 1.5 hours
          "reddit.com": 1800000, // 30 minutes
          "youtube.com": 3600000, // 1 hour
          "netflix.com": 1800000, // 30 minutes
          "spotify.com": 900000 // 15 minutes
        },
        categories: {
          "Social Media": 19800000, // 5.5 hours
          "Entertainment": 6300000, // 1.75 hours
          "Other / Uncategorized": 900000 // 15 minutes
        }
      }
    },
    goals: {
      productiveHours: 2,
      entertainmentHours: 3,
      socialMediaHours: 4,
      streak: 1
    }
  },
  
  mixed: {
    name: "🔄 Mixed Usage",
    timeData: {
      "2025-01-20": {
        sites: {
          "github.com": 3600000, // 1 hour
          "youtube.com": 5400000, // 1.5 hours
          "facebook.com": 1800000, // 30 minutes
          "stackoverflow.com": 1800000, // 30 minutes
          "netflix.com": 3600000, // 1 hour
          "docs.google.com": 2700000, // 45 minutes
          "instagram.com": 1800000, // 30 minutes
          "wikipedia.org": 900000, // 15 minutes
          "amazon.com": 900000, // 15 minutes
          "reddit.com": 900000 // 15 minutes
        },
        categories: {
          "Productive / Educational": 9000000, // 2.5 hours
          "Entertainment": 9000000, // 2.5 hours
          "Social Media": 3600000, // 1 hour
          "Shopping": 900000, // 15 minutes
          "Other / Uncategorized": 900000 // 15 minutes
        }
      }
    },
    goals: {
      productiveHours: 3,
      entertainmentHours: 2,
      socialMediaHours: 2,
      streak: 3
    }
  },
  
  gaming: {
    name: "🎮 Gaming Day",
    timeData: {
      "2025-01-20": {
        sites: {
          "twitch.tv": 7200000, // 2 hours
          "steampowered.com": 5400000, // 1.5 hours
          "roblox.com": 3600000, // 1 hour
          "epicgames.com": 1800000, // 30 minutes
          "chess.com": 1800000, // 30 minutes
          "youtube.com": 3600000, // 1 hour (gaming content)
          "reddit.com": 1800000, // 30 minutes (gaming subreddits)
          "discord.com": 1800000, // 30 minutes
          "github.com": 900000, // 15 minutes
          "stackoverflow.com": 900000 // 15 minutes
        },
        categories: {
          "Games": 19800000, // 5.5 hours
          "Entertainment": 5400000, // 1.5 hours
          "Social Media": 1800000, // 30 minutes
          "Productive / Educational": 1800000 // 30 minutes
        }
      }
    },
    goals: {
      productiveHours: 1,
      entertainmentHours: 4,
      socialMediaHours: 1,
      streak: 2
    }
  },
  
  work: {
    name: "💼 Work Day",
    timeData: {
      "2025-01-20": {
        sites: {
          "slack.com": 7200000, // 2 hours
          "docs.google.com": 5400000, // 1.5 hours
          "trello.com": 3600000, // 1 hour
          "github.com": 3600000, // 1 hour
          "linkedin.com": 1800000, // 30 minutes
          "stackoverflow.com": 1800000, // 30 minutes
          "notion.so": 2700000, // 45 minutes
          "zoom.us": 1800000, // 30 minutes
          "gmail.com": 900000, // 15 minutes
          "calendar.google.com": 900000, // 15 minutes
          "youtube.com": 900000, // 15 minutes (break)
          "facebook.com": 900000 // 15 minutes (break)
        },
        categories: {
          "Productive / Educational": 27000000, // 7.5 hours
          "Social Media": 1800000, // 30 minutes
          "Entertainment": 900000, // 15 minutes
          "Other / Uncategorized": 900000 // 15 minutes
        }
      }
    },
    goals: {
      productiveHours: 6,
      entertainmentHours: 1,
      socialMediaHours: 1,
      streak: 7
    }
  }
};

// Demo categories
export const DEMO_CATEGORIES: Record<string, CategoryInfo> = {
  'Productive / Educational': {
    description: 'Websites that promote learning, work, coding, and personal growth',
    examples: ['wikipedia.org','khanacademy.org','coursera.org','udemy.com','edx.org','leetcode.com','notion.so','trello.com','slack.com','linkedin.com','docs.google.com','chat.openai.com']
  },
  'Entertainment': {
    description: 'Time-pass, media consumption, and fun-focused websites',
    examples: ['youtube.com','netflix.com','spotify.com','twitch.tv','hotstar.com','primevideo.com','disneyplus.com','9gag.com']
  },
  'News': {
    description: 'Websites focused on current events, politics, and general news',
    examples: ['cnn.com','bbc.com','nytimes.com','reuters.com','foxnews.com','aljazeera.com']
  },
  'Social Media': {
    description: 'Websites focused on social interaction and communication',
    examples: ['facebook.com','instagram.com','twitter.com','tiktok.com','snapchat.com','linkedin.com','reddit.com','pinterest.com']
  },
  'Games': {
    description: 'Online gaming platforms or game-related content',
    examples: ['roblox.com','epicgames.com','steampowered.com','miniclip.com','ign.com','chess.com']
  },
  'Shopping': {
    description: 'E-commerce and online retail platforms',
    examples: ['amazon.com','ebay.com','aliexpress.com','walmart.com','flipkart.com','etsy.com']
  },
  'Other / Uncategorized': {
    description: 'Anything that doesn\'t clearly fit the above or is new/unknown',
    examples: ['medium.com','quora.com','openai.com','duckduckgo.com']
  }
};

// Comprehensive demo data for all views
export const DEMO_DATA = {
  // Browser View Data
  browser: {
    totalTime: "3h 38m",
    todayTime: "3h 38m",
    weekTime: "25h 26m",
    categories: {
      "Entertainment": { time: "1h 23m 29s", percentage: 38, color: "#FF6B6B" },
      "Games": { time: "0h 58m 4s", percentage: 26, color: "#9C27B0" },
      "Social Media": { time: "0h 39m 17s", percentage: 18, color: "#E4405F" },
      "Other / Uncategorized": { time: "0h 37m 56s", percentage: 18, color: "#9E9E9E" }
    },
    topSites: [
      { name: "YouTube", time: "1h 23m", category: "Entertainment", favicon: "📺" },
      { name: "GitHub", time: "1h 12m", category: "Work & Productivity", favicon: "💻" },
      { name: "Twitter", time: "58m", category: "Social Media", favicon: "🐦" },
      { name: "Stack Overflow", time: "33m", category: "Work & Productivity", favicon: "📚" },
      { name: "Reddit", time: "28m", category: "Entertainment", favicon: "🔗" },
      { name: "LinkedIn", time: "19m", category: "Social Media", favicon: "💼" }
    ],
    apps: [
      { name: "uBlock Origin", time: "5m", category: "Productivity", icon: "🔒" },
      { name: "Grammarly", time: "4m", category: "Productivity", icon: "✍️" },
      { name: "Honey", time: "3m", category: "Shopping", icon: "🛒" },
      { name: "LastPass", time: "2m", category: "Security", icon: "🔑" }
    ],
    weeklyData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      productive: [3.2, 4.1, 3.8, 4.5, 3.9, 1.2, 2.1],
      entertainment: [1.8, 1.5, 2.2, 1.9, 2.1, 3.5, 4.2],
      social: [1.1, 0.8, 1.5, 1.2, 1.3, 2.8, 3.1]
    }
  } as BrowserData,

  // Mobile View Data
  mobile: {
    totalTime: "4h 23m",
    todayTime: "4h 23m",
    weekTime: "28h 45m",
    pickups: 47,
    avgSession: "5m 36s",
    notifications: 23,
    mostUsed: "Instagram",
    apps: [
      { name: "Instagram", time: "1h 23m", category: "Social Media", icon: "📷", logo: "https://logo.clearbit.com/instagram.com", percentage: 32 },
      { name: "WhatsApp", time: "45m", category: "Messaging", icon: "💬", logo: "https://logo.clearbit.com/whatsapp.com", percentage: 17 },
      { name: "Spotify", time: "38m", category: "Music", icon: "🎵", logo: "https://logo.clearbit.com/spotify.com", percentage: 15 },
      { name: "YouTube", time: "32m", category: "Entertainment", icon: "📺", logo: "https://logo.clearbit.com/youtube.com", percentage: 12 },
      { name: "Subway Surfers", time: "28m", category: "Games", icon: "🎮", logo: "https://logo.clearbit.com/kiloo.com", percentage: 11 },
      { name: "Gmail", time: "17m", category: "Productivity", icon: "📧", logo: "https://logo.clearbit.com/gmail.com", percentage: 6 },
      { name: "TikTok", time: "12m", category: "Social Media", icon: "🎬", logo: "https://logo.clearbit.com/tiktok.com", percentage: 5 },
      { name: "Maps", time: "8m", category: "Navigation", icon: "🗺️", logo: "https://logo.clearbit.com/google.com", percentage: 2 }
    ],
    weeklyStats: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      screenTime: [3.2, 4.1, 3.8, 4.5, 3.9, 6.2, 5.8],
      pickups: [35, 42, 38, 45, 41, 58, 52]
    },
    topSites: [
      { name: "YouTube", time: "58m", category: "Entertainment", favicon: "📺" },
      { name: "Wikipedia", time: "35m", category: "Information", favicon: "📚" },
      { name: "Reddit", time: "27m", category: "Social", favicon: "🔗" },
      { name: "Instagram", time: "25m", category: "Social", favicon: "📸" },
      { name: "X", time: "21m", category: "Social", favicon: "🐦" }
    ]
  } as MobileData,

  // Laptop View Data
  laptop: {
    totalTime: "6h 45m",
    todayTime: "6h 45m",
    weekTime: "45h 20m",
    activeTime: "5h 12m",
    idleTime: "1h 33m",
    batteryRemaining: "3h 45m",
    dataUsed: "2.4GB",
    applications: [
      { name: "Visual Studio Code", time: "2h 15m", category: "Development", icon: "💻", logo: "https://logo.clearbit.com/code.visualstudio.com", percentage: 33 },
      { name: "Google Chrome", time: "1h 45m", category: "Web Browser", icon: "🌐", logo: "https://logo.clearbit.com/google.com", percentage: 26 },
      { name: "Microsoft Outlook", time: "45m", category: "Email", icon: "📧", logo: "https://logo.clearbit.com/outlook.com", percentage: 11 },
      { name: "Microsoft Excel", time: "38m", category: "Productivity", icon: "📊", logo: "https://logo.clearbit.com/microsoft.com", percentage: 9 },
      { name: "Spotify", time: "32m", category: "Music", icon: "🎵", logo: "https://logo.clearbit.com/spotify.com", percentage: 8 },
      { name: "Slack", time: "25m", category: "Communication", icon: "💬", logo: "https://logo.clearbit.com/slack.com", percentage: 6 },
      { name: "Figma", time: "18m", category: "Design", icon: "🎨", logo: "https://logo.clearbit.com/figma.com", percentage: 4 },
      { name: "Terminal", time: "12m", category: "Development", icon: "⚡", logo: "https://logo.clearbit.com/apple.com", percentage: 3 }
    ],
    weeklyProductivity: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      productive: [5.2, 6.1, 5.8, 6.5, 5.9, 2.2, 3.1],
      idle: [1.8, 1.5, 2.2, 1.9, 2.1, 3.5, 2.8]
    }
  } as LaptopData,

  // Overall View Data
  overall: {
    totalTime: "12h 34m",
    todayTime: "12h 34m",
    weekTime: "87h 45m",
    devices: {
      laptop: { time: "6h 45m", percentage: 54, usage: "Work & Productivity" },
      mobile: { time: "4h 23m", percentage: 35, usage: "Social & Apps" },
      browser: { time: "1h 26m", percentage: 11, usage: "Web Browsing" }
    },
    focusScore: 87,
    weeklyBreakdown: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      laptop: [5.2, 6.1, 5.8, 6.5, 5.9, 2.2, 3.1],
      mobile: [3.2, 4.1, 3.8, 4.5, 3.9, 6.2, 5.8],
      browser: [1.1, 1.3, 1.2, 1.4, 1.1, 2.1, 1.8]
    },
    topSites: [
      { name: "YouTube", time: "58m", category: "Entertainment", favicon: "📺" },
      { name: "Wikipedia", time: "35m", category: "Information", favicon: "📚" },
      { name: "Reddit", time: "27m", category: "Social", favicon: "🔗" },
      { name: "Instagram", time: "25m", category: "Social", favicon: "📸" },
      { name: "X", time: "21m", category: "Social", favicon: "🐦" }
    ],
    topApps: [
      { name: "Instagram", time: "25m", category: "Social Media", icon: "📸" },
      { name: "WhatsApp", time: "45m", category: "Messaging", icon: "💬" },
      { name: "Spotify", time: "38m", category: "Music", icon: "🎵" },
      { name: "YouTube", time: "32m", category: "Entertainment", icon: "📺" },
      { name: "Subway Surfers", time: "28m", category: "Games", icon: "🎮" },
      { name: "Gmail", time: "17m", category: "Productivity", icon: "📧" },
      { name: "TikTok", time: "12m", category: "Social Media", icon: "🎬" },
      { name: "Maps", time: "8m", category: "Navigation", icon: "🗺️" }
    ]
  } as OverallData,

  // Share Stats Data
  share: {
    totalScreenTime: "8h 23m",
    productiveTime: "5h 12m",
    focusScore: 87,
    goalsMet: "4/7",
    weeklyHighlights: [
      "Met productivity goals 5 out of 7 days",
      "Reduced social media usage by 15%",
      "Increased focused work time by 20%",
      "Maintained good digital wellness balance"
    ],
    recentShares: [
      { title: "Yesterday's Progress", platform: "Twitter", time: "2 hours ago" },
      { title: "Weekly Summary", platform: "WhatsApp", time: "1 day ago" },
      { title: "Focus Mode Achievement", platform: "Instagram", time: "3 days ago" }
    ]
  } as ShareData,

  // Goals Data
  goals: {
    streak: 5,
    totalGoals: 7,
    metToday: 4,
    categories: {
      "Social Media": { goal: "2h", actual: "1h 45m", status: "good" },
      "Work & Productivity": { goal: "4h", actual: "4h 20m", status: "complete" },
      "Entertainment": { goal: "1h", actual: "1h 15m", status: "over" },
      "Total Screen Time": { goal: "8h", actual: "6h 23m", status: "good" }
    }
  } as Goals,

  // Focus Mode Data
  focusMode: {
    isActive: false,
    blockedSites: ["facebook.com", "twitter.com", "instagram.com", "youtube.com"],
    sessionsToday: 3,
    totalFocusTime: "2h 45m",
    longestSession: "1h 15m"
  } as FocusModeData,

  // Settings Data
  settings: {
    categories: [
      { name: "Social Media", color: "#E4405F", count: 12 },
      { name: "Work & Productivity", color: "#4CAF50", count: 8 },
      { name: "Entertainment", color: "#FF9800", count: 15 },
      { name: "News & Information", color: "#2196F3", count: 6 },
      { name: "Shopping", color: "#9C27B0", count: 4 },
      { name: "Other", color: "#9E9E9E", count: 3 }
    ]
  } as SettingsData
};

// Demo blocked sites
export const DEMO_BLOCKED_SITES = [
  { url: 'facebook.com', expiresAt: Date.now() + 86400000 },
  { url: 'instagram.com', expiresAt: Date.now() + 86400000 },
  { url: 'tiktok.com', expiresAt: Date.now() + 86400000 }
];

// Demo focus block list
export const DEMO_FOCUS_BLOCK_LIST = ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'youtube.com'];