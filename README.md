# Sat Tracker in Rust

## Local Development

### install dependencies and start desktop development

```bash
yarn
yarn seed
yarn start:dev
```

TODO: on windows, even though we never use it, a folder is being created at: `C:\Users\<username>\.sat-tracker-in-rust`

## Building The App

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

In any case, all data is stored in:
`~/.sat-tracker-in-rust/sat_tracker.db`

### MacOS:
Build for MacOS: 
`yarn build:mac`

the built installer is now located at:
`src-tauri/target/universal-apple-darwin/release/bundle/dmg/sat-tracker-in-rust_x.y.z_universal.dmg`

all app data is stored in:
`~/.sat-tracker-in-rust/sat_tracker.db`

### Windows:
Build for windows: 
`yarn build:win`

the built installer is now located at:
`src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/sat-tracker-in-rust_x.y.z_x64-setup.exe`

When installed on a windows machine, the db that stores all the data is located at:
`C:\Users\<username>\AppData\Local\sat-tracker-in-rust\sat_tracker.db`