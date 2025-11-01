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

- TODO: btc <-> sats in events/charts
- TODO: add ability to manually set the bitcoin price to see how the metrics change
- TODO: csv importing. (no duplicates - coinbase, river)

## Chart Ideas & Features

### FREE Charts (No External Data Required)

- **Interactive Sat Balance Chart Enhancements:**

  - Hover tooltips showing exact date, sat balance
  - Zoom and pan functionality for different time ranges
  - Highlight buy/sell events as dots on the line with different colors
  - Time range selectors (7D, 30D, 90D, 1Y, All)
  - Toggle between sat balance and event count views

- **Buy/Sell Activity Chart:**

  - Bar chart showing buy vs sell volume over time
  - Color-coded bars (green for buys, red for sells)
  - Shows trading frequency and patterns

- **Monthly Stacking Summary:**

  - Bar chart of sats accumulated per month
  - Shows consistency of stacking habits
  - Could include event count per month as secondary bars

- **Stacking Frequency Heatmap:**

  - Calendar-style heatmap showing buy frequency
  - Darker colors = more activity that day/week
  - Great for visualizing DCA consistency

- **Event Type Distribution:**
  - Pie chart showing percentage of buys vs sells vs fees
  - Bar chart of total sats by event type

### PREMIUM Charts (Requires External/Historical Price Data)

- **Dollar Cost Average Performance:**

  - Line showing your average buy price over time
  - Compare against Bitcoin's actual price at those times
  - Shows if you're buying the dips or peaks

- **Price vs Your Buys Scatter Plot:**

  - Each buy plotted as a dot (Bitcoin price vs date)
  - Shows if you tend to buy at high or low prices
  - Bitcoin price line in background

- **Profit/Loss Timeline:**

  - Shows unrealized gains/losses over time
  - Based on your average cost basis vs historical Bitcoin prices
  - Color-coded areas (green for profit, red for loss)

- **USD Value Chart:**

  - Toggle between sat balance and USD value views
  - Requires historical Bitcoin price data for accurate USD values at each point

- **Performance vs Bitcoin:**
  - Compare your portfolio growth vs just holding Bitcoin
  - Show if your DCA strategy outperformed lump sum buying

### android development (no focus on mobile, keeping this for future reference)

```bash
yarn tauri android init
yarn tauri android dev
```
