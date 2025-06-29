# TimeSetu Demo

This is a **standalone demo** of the TimeSetu dashboard that showcases all features without requiring the Chrome extension or any backend services.

## 🚀 Quick Start

1. **Start the demo server:**
   ```bash
   cd demo
   python3 -m http.server 8080
   ```

2. **Open in browser:**
   ```
   http://localhost:8080
   ```

## 📱 Demo Features

### Device Views
- **Overall View** - Combined analytics across all devices
- **Browser View** - Chrome extension simulation with charts and top sites
- **Mobile View** - Mobile app usage with screen time stats
- **Laptop View** - Desktop application tracking and productivity metrics
- **Share Stats** - Social sharing options and progress summaries

### Interactive Elements
- **Charts & Graphs** - Pie charts, bar graphs, and weekly trends
- **Modal Windows** - Goals, Settings, and Weekly Summary popups
- **Focus Mode** - Site blocking simulation
- **Voice Review** - AI-powered weekly summaries
- **Language Support** - Multi-language flag selector

## 📊 Dummy Data

All views use comprehensive dummy data including:

- **Time Tracking**: Realistic daily/weekly usage patterns
- **Applications**: Popular apps and websites with usage times
- **Statistics**: Screen time, pickups, notifications, productivity scores
- **Goals**: Progress tracking with streaks and achievements
- **Categories**: Color-coded content classification

## 🎨 Design Features

- **Full-width responsive layout** matching the actual dashboard
- **Professional dark theme** with gradient backgrounds
- **Interactive hover effects** and smooth animations
- **Consistent typography** using Inter font family
- **Proper spacing and grid layouts**

## 🔧 Technical Details

- **No dependencies** on Chrome extension or backend
- **Pure HTML/CSS/JavaScript** with Chart.js for visualizations
- **Responsive design** works on desktop and mobile
- **Modular data structure** for easy customization

## 🎯 Use Cases

- **Hackathon presentations** - Show full functionality quickly
- **Portfolio showcase** - Demonstrate UI/UX design skills
- **User testing** - Get feedback without complex setup
- **Public demos** - Share with anyone without installation

## 📁 File Structure

```
demo/
├── index.html              # Device selection homepage
├── browser-view.html       # Chrome extension simulation
├── mobile-view.html        # Mobile app usage tracking
├── laptop-view.html        # Desktop application monitoring
├── overall-view.html       # Combined device analytics
├── share-stats.html        # Social sharing features
├── demo-data.js           # Comprehensive dummy data
├── chrome-compat-demo.js  # Chrome API compatibility layer
└── README.md              # This file
```

## 🌟 Built with Bolt.new

This demo was created to showcase the TimeSetu digital wellness platform. Perfect for demonstrating the full user experience without any technical setup requirements. 