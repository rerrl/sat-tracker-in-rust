# Sat Tracker in Rust

<img width="1913" height="1037" alt="image" src="https://github.com/user-attachments/assets/ad5faefa-0db6-4efc-8fb2-17864de97e16" />

<img width="1914" height="1031" alt="image" src="https://github.com/user-attachments/assets/dc7ebca7-f6df-4780-8335-6dbbe8bc6160" />


Sat Tracker in Rust is a free and open source bitcoin acquisition tracker. I was buying bitcoin from different exchanges and wanted a way to track how much I've been allocating to my purchases across all exchanges. I used to use a spreadsheet but have since evolved to this. I do plan to add more (premium) analytics that are entirely optional as I intend to keep this core offering free. 

There are no ads, no trackers, and absolutely no data is sent to any servers.  In fact, the only network requests this app makes is to my server (api.dprogram.me) to get the current bitcoin price and app updates (for the banner at the top of the screen).

Download the latest version from the releases page or on my website.

If you intend to verify the authenticity of the sha256sums file, you can grab my public gpg key below, and you can cross reference the fingerprint from my twitter bio.

[my public gpg key](https://dprogram.me/andrew-dprogram-me_public-gpg-key.asc)

[my twitter](https://x.com/BitReverser)

## Features:
- Live bitcoin price pulled from api.dprogram.me (thank you CoinGecko)
- Import CSV data from Coinbase, or River
- Optional DB password encryption
- Sat holdings chart overtime
- Activity Heatmap
- More features coming soon. Let me know what you want to see (email: andrew@dprogram.me)


## Local Development

### install dependencies and start desktop development

```bash
yarn
yarn seed
yarn start:dev
```


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
