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

- TODO: remove import v1 data button before release
- TODO: obscure balances/lock screen

## Installation on Linux

- Download the latest release as a .AppImage file
- make it executable: `chmod +x sat-tracker-in-rust-x86_64_0.1.0_amd64.AppImage`
- add it to our users binaires and path: ~/.local/bin
- make it availbale in applications: create a .desktop file in ~/.local/share/applications

## Building

### Linux AppImage

The AppImage is built using Docker with Ubuntu 22.04 LTS as the base to ensure compatibility with LTS distributions. This approach was necessary because:

- **Supported**: Ubuntu 22.04+ and equivalent distributions (Linux Mint 21+, etc.)
- **Not Supported**: Older distributions like Ubuntu 20.04/Mint 20.2 due to glibc version requirements
- **Why Docker**: Building on newer distributions (like Arch Linux) creates AppImages that won't run on LTS systems due to glibc version mismatches

If you're on Ubuntu 22.04+ or equivalent, the AppImage should work fine. If you're on an older distribution and encounter glibc errors, you'll need to build from source perform updates to your system glibc.

To build the AppImage, run the following command:

```bash
yarn build:docker
```

This will build the AppImage and copy it to the `build-output` directory in the project root.

If you want to skip the Docker build and build the AppImage natively, you can run the following command:

```bash
yarn build:release
```

This will build the AppImage and copy it to the default output directory (`src-tauri/target/release/bundle/appimage`).
