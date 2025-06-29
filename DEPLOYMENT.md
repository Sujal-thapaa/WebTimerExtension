# 🚀 TimeSetu Deployment Guide

## For Hackathon Submission

### Quick Deploy to Netlify

1. **Push to GitHub:**
```bash
git add .
git commit -m "Deploy TimeSetu for hackathon"
git push origin main
```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - Build command: (leave empty)
     - Publish directory: `.` (root)
   - Click "Deploy site"

3. **Your public URL will be:**
   ```
   https://your-project-name.netlify.app
   ```

### Demo Dashboard Features

The demo dashboard (`demo-dashboard.html`) includes:

✅ **5 Different Scenarios:**
- 📚 Productive Day (6.5 hours productive)
- 📱 Social Media Day (5.5 hours social)
- 🔄 Mixed Usage (balanced)
- 🎮 Gaming Day (5.5 hours gaming)
- 💼 Work Day (7.5 hours productive)

✅ **Full Functionality:**
- Real-time charts and analytics
- Goal setting and tracking
- Focus mode with site blocking
- Voice AI reviews
- Multi-language support
- Responsive design

✅ **Interactive Demo Controls:**
- Switch between scenarios instantly
- See different data patterns
- Test all features without extension

### Files to Deploy

Essential files for the demo:
- `demo-dashboard.html` - Main demo dashboard
- `demo-data.js` - Demo data and scenarios
- `chrome-compat-demo.js` - Chrome API compatibility
- `popup.css` - Styling
- `popup.js` - Dashboard functionality
- `voiceReview.js` - Voice AI features
- `focus-block.js` - Focus mode
- `lib/chart.min.js` - Charts
- `flags/` - Language flags
- `icons/` - Extension icons

### Testing the Demo

1. **Open the demo dashboard**
2. **Try different scenarios** using the demo controls
3. **Test all features:**
   - Click "🎯 Goals" to see goal setting
   - Click "⚙️ Settings" to see category management
   - Click "📊 More" to see weekly analytics
   - Try Focus Mode with site blocking
   - Test voice AI reviews

### Hackathon Submission URL

Use your Netlify URL as the public URL:
```
https://your-project-name.netlify.app/demo-dashboard.html
```

### Alternative: Vercel Deployment

```bash
npm install -g vercel
vercel --prod
```

### Local Testing

```bash
python3 -m http.server 8001
open http://localhost:8001/demo-dashboard.html
```

## 🎯 Perfect for Hackathon

This demo showcases:
- ✅ Cross-platform development
- ✅ AI integration (voice reviews)
- ✅ Real-time data visualization
- ✅ Modern web technologies
- ✅ Productivity and wellness focus
- ✅ Interactive demo experience
- ✅ Built with Bolt.new badge included 