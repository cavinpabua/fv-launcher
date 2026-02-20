# Flash Player

A cross-platform Electron-based Flash player using Pepper Flash.

## Quick Start

```bash
# Install dependencies
npm install

# Run the app
npm start
```

## Setup

### 1. Get Pepper Flash Plugin

You need the Pepper Flash plugin (version 32.0.0.465 - the last version before EOL).

**macOS:**
- Check: `/Library/Internet Plug-Ins/PepperFlashPlayer/PepperFlashPlayer.plugin`
- Or extract from Chrome 87 or earlier

**Windows:**
- Check: `C:\Windows\System32\Macromed\Flash\pepflashplayer64_32_0_0_465.dll`
- Or extract from old Chrome installation

**Linux:**
- Search for `libpepflashplayer.so`

**Can't find it?** Search Internet Archive for "Pepper Flash 32.0.0.465"

### 2. Install Plugin

Copy the plugin to the `plugins/` directory:

```
plugins/
├── PepperFlashPlayer.plugin  (macOS)
├── pepflashplayer64.dll      (Windows 64-bit)
├── pepflashplayer.dll        (Windows 32-bit)
└── libpepflashplayer.so      (Linux)
```

### 3. Configure Game URL

By default connects to `https://example.com/flash-game`

Change via environment variable:
```bash
GAME_URL=https://your-server.com/game npm start
```

## Building Distributable

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

Outputs go to `dist/` folder.

## Requirements

- Node.js 14+
- Pepper Flash plugin (32.0.0.465)

## Notes

- Uses Electron 12.2.3 (last version with Pepper Flash support)
- Flash reached End of Life in December 2020
- This is for personal/educational use with your own Flash content

## License

MIT
