# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Setup

### install dependencies and start desktop development

```bash
yarn
yarn seed
yarn start:dev
```

**Common Issue:** The Tauri window may open blank initially while Vite finishes compiling. Simply right-click in the window and select "Reload" to refresh the page and the app will load properly. This is normal Tauri development behavior.

- TODO: csv importing. (no duplicates - coinbase, river)
- TODO: remove import v1 data button before release
- TODO: btc <-> sats in events/charts (low priority)

## App Architecture & Tool System

### **Flexible Tool-Based Design**

The app uses a contextual tool system where each tool makes intelligent use of the available screen sections:

- **🔧 Tool Selector**: Single dropdown to switch between different analysis modes
- **📊 Chart Section**: Visual representation changes based on selected tool
- **📋 Insights Section**: Contextual analytics and patterns (scrollable, with future premium insights)
- **📝 Events Section**: Always visible transaction list for cross-referencing data

### **Current Tools**

- **📊 Overview**: Portfolio dashboard with key metrics and balance chart
- **🔥 Activity**: GitHub-style stacking heatmap with habit insights and streak tracking
- **📈 Trends**: Time-based growth analysis and patterns
- **🎯 Focus**: Deep-dive analysis tools for specific aspects

### **Design Philosophy**

This architecture allows unlimited expansion in any direction based on user needs:

- **Bitcoin data platform**, not just a chart viewer
- **Contextual intelligence** - each tool provides relevant insights
- **Premium-ready** - easy integration of advanced features without UI redesign
- **User-driven growth** - tools can evolve based on actual usage patterns

### **Future Expansion Possibilities**

- Tax reporting and export tools
- Hardware wallet integration
- Lightning network tracking
- Social comparison features
- Market timing analysis
- Goal setting and milestone tracking
- AI-powered insights and recommendations

### **Free vs Premium Strategy**

- **Free**: Full-featured tools with generic insights and pattern recognition
- **Premium**: Advanced AI insights, historical price analysis, and specialized tools
- **No feature gating** - free users get complete value, premium adds intelligence
