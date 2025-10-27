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

- TODO: double check the metrics caluluations (should gain be 0 when bitcoin price is equal to avg buy price?)
- TODO: add a help page to show how to use the app and how the metrics are calculated 

- TODO: create a chart to show sat holdings over time

- TODO: better metrics design (UI)
- TODO: ability to show a description on the metric (api provider, fiat extracted, etc)
- TODO: "preview" full memo on hover in events list

- TODO: now that we have a ui and refined data model, lets do some csv importing. (no duplicates - coinbase, river)

- TODO: think about the method to add a "starter balance" in the event you dont have the individual receipts but you know you bought x sats with y fiat. This is so metrics still work and your chart is not badly skewed.

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
