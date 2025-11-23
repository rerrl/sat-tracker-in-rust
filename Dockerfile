FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libclang-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libjavascriptcoregtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    wget \
    unzip \
    libssl-dev \
    ca-certificates \
    libglib2.0-dev \
    libgdk-pixbuf2.0-dev \
    libpango1.0-dev \
    libatk1.0-dev \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libsoup-3.0-dev \
    libwebkit2gtk-4.1-0 \
    libjavascriptcoregtk-4.1-0 \
    xdg-utils \
    file \
    desktop-file-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and Yarn
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Tauri CLI v2
RUN cargo install tauri-cli

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock ./
COPY src-tauri/Cargo.toml ./src-tauri/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the project (excluding what's in .dockerignore)
COPY . .

# Build the application
ENV NO_STRIP=true
ENV LINUXDEPLOY_OUTPUT_VERSION=1
ENV DISABLE_COPYRIGHT_FILES_DEPLOYMENT=1
RUN yarn build:release

# Default command to copy AppImage to mounted volume
CMD ["sh", "-c", "mkdir -p /output && find /app/src-tauri/target/release/bundle -name '*.AppImage' -exec cp {} /output/ \\; && if [ -n \"$HOST_UID\" ] && [ -n \"$HOST_GID\" ]; then chown -R $HOST_UID:$HOST_GID /output/*; else chown -R 1000:1000 /output/*; fi && echo 'AppImage copied to /output with correct ownership'"]
