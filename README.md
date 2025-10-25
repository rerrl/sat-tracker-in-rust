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




- work on the UI (consider we want to be able to calculate total dca, gain from trades, etc)
- now that we have a ui and refined data model, lets do some csv importing. (importing the same data from multiple csvs should not duplicate data)





### android development (no focus on mobile, keeping this for future reference)

```bash
yarn tauri android init
yarn tauri android dev
```
