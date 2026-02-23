# Flash Player

A cross-platform Electron-based Flash player using Clean Flash Player.

## Quick Start

```bash
# Install dependencies
npm install

# Run the app
npm start
```

## Setup

### 1. Check for Updated Plugins (Optional)

You should get the latest PPAPI Flash plugins available.

If the latest Windows and macOS version is 34.0.0.330, skip to step 3.

https://github.com/darktohka/clean-flash-builds

### 2. Update Bundled Plugins (Optional)

Copy any updated plugins to the `plugins/` directory:

```
plugins/
├── pepflashplayer.dll        (Windows 32-bit)
├── pepflashplayer64.dll      (Windows 64-bit)
├── flash.plugin              (macOS 64-bit)
└── libpepflashplayer.so      (Linux 32-bit)
└── libpepflashplayer64.so    (Linux 64-bit)
```

### 3. Configure Game URL

By default, the app connects to `https://example.com/flash-game`.

Change via environment variable (Windows):
```batch
set GAME_URL=https://your-server.com/game && npm start
```

Change via environment variable (macOS / Linux):
```bash
GAME_URL=https://your-server.com/game npm start
```

## Building Distributable

### Prerequisites for macOS

Install `create-dmg` for creating DMG installers:

```bash
brew install create-dmg
```

### Build Commands

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

Outputs go to the `dist/` directory.

## Requirements

- Node.js 20+
- PPAPI Flash plugins

## Notes

- This app uses Electron 11.5.0 for PPAPI support.
- The latest Flash Player updates are provided by an Adobe partner.
- This is for personal/educational use with your own Flash content.

## License

MIT
