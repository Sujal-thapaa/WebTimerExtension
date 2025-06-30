# TimeSetu - Digital Wellness Platform

A comprehensive digital wellness platform that helps you track and manage your screen time across all devices. TimeSetu includes a Chrome extension for browser tracking, a mobile app for phone usage, and a unified dashboard for complete digital wellness insights.

## 🚀 Quick Start Guide

### Option 1: Chrome Extension (Easiest to Start)

#### Prerequisites
- Google Chrome browser
- Basic computer knowledge

#### Installation Steps
1. **Download the Extension**
   - Clone or download this repository to your computer
   - Open Chrome and go to `chrome://extensions/`

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner
   - This allows you to load unpacked extensions

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the main project folder (not the MobileApp or demo folders)
   - The TimeSetu extension should now appear in your extensions list

4. **Start Using**
   - Click the TimeSetu icon in your Chrome toolbar
   - The extension will start tracking your browsing automatically
   - Set goals, view analytics, and manage your digital wellness

#### Features Available
- ✅ Real-time browsing time tracking
- ✅ Category-based analytics (Social Media, Productivity, etc.)
- ✅ Website-specific goals and notifications
- ✅ Focus mode with site blocking
- ✅ Daily and weekly reports
- ✅ Goal setting and progress tracking

### Option 2: Mobile App

#### Prerequisites
- Node.js (version 18.18 or higher) - [Download here](https://nodejs.org/)
- Expo CLI (will be installed automatically)
- iOS Simulator (for Mac) or Android Studio (for Android development)

#### Installation Steps
1. **Install Node.js**
   - Download and install Node.js from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` (should show 18.18+)

2. **Start the Mobile App**
   ```bash
   # Navigate to the mobile app directory
   cd MobileApp
   
   # Install dependencies (first time only)
   npm install
   
   # Start the development server
   npm run dev
   ```

3. **Run on Device/Simulator**
   - The Expo development server will start
   - Scan the QR code with your phone (Expo Go app) or press 'i' for iOS simulator
   - The app will load and start tracking your mobile usage

#### Mobile App Features
- ✅ Cross-platform (iOS & Android)
- ✅ Screen time tracking
- ✅ App usage analytics
- ✅ Goal setting and notifications
- ✅ Sync with web dashboard
- ✅ Offline support

### Option 3: Demo Dashboard (No Setup Required)

#### Quick Start
```bash
# Navigate to demo directory
cd demo

# Start demo server
python3 -m http.server 8080

# Open in browser
# http://localhost:8080
```

#### Demo Features
- ✅ Full dashboard simulation
- ✅ All device views (Browser, Mobile, Laptop, Overall)
- ✅ Interactive charts and analytics
- ✅ Goal management interface
- ✅ Focus mode simulation
- ✅ Multi-language support

## 📱 Complete Platform Overview

### Chrome Extension
**Location**: Main project folder
- **Purpose**: Track browser usage and provide real-time insights
- **Key Files**: `popup.js`, `background.js`, `manifest.json`
- **Features**: Website tracking, category classification, goal setting, notifications

### Mobile App
**Location**: `MobileApp/` folder
- **Purpose**: Track mobile device usage and app analytics
- **Technology**: React Native with Expo
- **Key Files**: `app/`, `components/`, `package.json`
- **Features**: Screen time tracking, app usage, cross-platform support

### Demo Dashboard
**Location**: `demo/` folder
- **Purpose**: Showcase all features without setup
- **Technology**: HTML/CSS/JavaScript
- **Key Files**: `index.html`, `demo-data.js`, various view files
- **Features**: Complete UI simulation with dummy data

## 🔧 Development Setup

### For Chrome Extension Development
```bash
# No build process required - edit files directly
# Main files to modify:
# - popup.js (UI logic)
# - background.js (tracking logic)
# - popup.html (UI structure)
# - popup.css (styling)
```

### For Mobile App Development
```bash
cd MobileApp
npm install
npm run dev

# Available commands:
# npm run dev - Start development server
# npm run build:web - Build for web
# npm run lint - Check code quality
```

### For Demo Development
```bash
cd demo
# Edit HTML/CSS/JS files directly
# No build process required
```

## 📊 Data Structure

### Chrome Extension Data
- **Storage**: Chrome's local storage
- **Data Types**: Time tracking, goals, settings, categories
- **Sync**: Local only (can be extended to cloud)

### Mobile App Data
- **Storage**: Supabase database
- **Data Types**: App usage, screen time, goals
- **Sync**: Real-time cloud synchronization

### Demo Data
- **Storage**: Static JavaScript objects
- **Data Types**: Comprehensive dummy data
- **Sync**: None (simulation only)

## 🎯 Use Cases

### For End Users
- **Digital Wellness**: Track and reduce screen time
- **Productivity**: Set goals and monitor progress
- **Focus**: Block distracting sites during work
- **Insights**: Understand your digital habits

### For Developers
- **Hackathon Projects**: Quick setup with demo
- **Portfolio Showcase**: Complete digital wellness solution
- **Learning**: React Native, Chrome extensions, data visualization
- **Customization**: Easy to modify and extend

### For Organizations
- **Employee Wellness**: Monitor work-life balance
- **Productivity Analysis**: Understand team digital habits
- **Wellness Programs**: Integrate with existing initiatives

## 🛠️ Troubleshooting

### Chrome Extension Issues
- **Extension not loading**: Check Developer mode is enabled
- **Not tracking**: Ensure extension has necessary permissions
- **Goals not working**: Reload extension and check console for errors

### Mobile App Issues
- **Node.js version**: Ensure you have Node.js 18.18+
- **Expo issues**: Run `npx expo install --fix`
- **Build errors**: Clear cache with `npx expo start --clear`

### Demo Issues
- **Port conflicts**: Change port in command (e.g., `python3 -m http.server 8081`)
- **CORS issues**: Use a local server (not file:// protocol)

## 📁 Project Structure

```
TimeSetu/
├── 📁 Main Extension Files
│   ├── popup.js              # Extension UI logic
│   ├── background.js         # Tracking and notifications
│   ├── popup.html           # Extension interface
│   ├── popup.css            # Extension styling
│   └── manifest.json        # Extension configuration
│
├── 📁 MobileApp/            # React Native mobile app
│   ├── app/                 # Main app screens
│   ├── components/          # Reusable UI components
│   ├── config/             # Supabase configuration
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── package.json        # Dependencies and scripts
│
├── 📁 demo/                # Standalone demo dashboard
│   ├── index.html          # Device selection page
│   ├── browser-view.html   # Browser analytics view
│   ├── mobile-view.html    # Mobile usage view
│   ├── laptop-view.html    # Desktop analytics view
│   ├── overall-view.html   # Combined analytics view
│   ├── demo-data.js        # Comprehensive dummy data
│   └── README.md           # Demo-specific instructions
│
└── README.md               # This file
```

## 🌟 Features Overview

### Cross-Platform Tracking
- **Browser**: Chrome extension with real-time tracking
- **Mobile**: React Native app for iOS/Android
- **Desktop**: Application usage monitoring
- **Unified Dashboard**: Combined analytics across all devices

### Smart Analytics
- **Category Classification**: Automatic content categorization
- **Goal Setting**: Customizable daily/weekly targets
- **Progress Tracking**: Visual progress bars and streaks
- **Notifications**: Smart alerts for goal completion

### Focus & Wellness
- **Focus Mode**: Block distracting sites during work
- **Screen Time Limits**: Set boundaries for different categories
- **Wellness Insights**: Understand your digital habits
- **Productivity Scoring**: Measure and improve efficiency

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Make your changes**
4. **Test thoroughly** (extension, mobile app, and demo)
5. **Submit a pull request**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Documentation**: Check the demo for usage examples
- **Community**: Join our discussions for help and ideas

---

**Built with ❤️ using modern web technologies and a focus on digital wellness** 