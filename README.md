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

- TODO: river buy, sells, fees import
- TODO: events return consolidated events (exchange_transactions and onchain_fees combined)
- TODO: events better subtotal + fee input UX
- TODO: events edit/add fees

- TODO: remove import v1 data button before release


## Installation on Linux

- Download the latest release as a .AppImage file
- make it executable: `chmod +x sat-tracker-in-rust-x86_64_0.1.0_amd64.AppImage`
- add it to our users binaires and path: ~/.local/bin
- make it availbale in applications: create a .desktop file in ~/.local/share/applications
