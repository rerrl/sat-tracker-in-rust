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

- TODO: get btc/usd price
- TODO: double check the metrics caluluations (should gain be 0 when bitcoin price is equal to avg buy price?)
- TODO: add a help page to show how to use the app and how the metrics are calculated

- TODO: better metrics

  - better general design
  - metrics explainer tooltip
  - maybe a pie chart showing balance changes by type/percentage
  - sats stacked this month
  - weekly streak / average sats stacked per week per rolling month, 12 month chart

- TODO: events section

  - edit event date
  - view full memo in events list somehow (hover? click and expand?)

- TODO: now that we have a ui and refined data model, lets do some csv importing. (no duplicates - coinbase, river)

- TODO: (LOW PRIORITY) Trading Feature - Track Bitcoin-denominated investments
  - Add new `trades` table to track sats sent out and received back
  - Open Trade: Record sats sent + memo (e.g., "Lent to friend", "Mining equipment", "Lightning channel")
  - Close Trade: Record sats received back to calculate sat P&L
  - Trade Metrics: Active trades, sats at risk, trade P&L, best trade performance
  - UI: Trade management in top-right section, trade events in events list
  - Focus: Measure success in sats gained/lost, not fiat - true Bitcoin standard

### android development (no focus on mobile, keeping this for future reference)

```bash
yarn tauri android init
yarn tauri android dev
```
