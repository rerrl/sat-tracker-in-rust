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
- TODO: add ability to manually set the bitcoin price to see how the metrics change

- TODO: better metrics

  - better general design
  - metrics explainer tooltip
  - maybe a pie chart showing balance changes by type/percentage
  - sats stacked this month
  - weekly streak / average sats stacked per week per rolling month, 12 month chart

- TODO: now that we have a ui and refined data model, lets do some csv importing. (no duplicates - coinbase, river)

### android development (no focus on mobile, keeping this for future reference)

```bash
yarn tauri android init
yarn tauri android dev
```
