# Pixel Inspector

A desktop application for inspecting individual pixel RGBA values in images. Built with **Tauri 2** (Rust backend + React frontend).

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Pixel-level inspection** — Click any pixel to view its RGBA values in multiple formats (0–255, 0.0–1.0, HDR raw)
- **Coordinate navigation** — Jump to any pixel by entering X/Y coordinates
- **Keyboard navigation** — Arrow keys to move cursor, Shift+Arrow for 10px steps
- **Multi-pixel selection** — Ctrl/Cmd+Click to select multiple pixels and compare values side by side
- **Zoom & Pan** — Mouse wheel to zoom (0.1x–256x), drag to pan
- **Pixel grid** — Auto-displayed grid lines at ≥8x zoom
- **Crosshair overlay** — Visual indicator on the selected pixel
- **Checkerboard background** — Visualize transparent areas
- **HDR support** — Tone mapping (Linear/Reinhard/ACES/AgX) with exposure control (-10 to +10 stops)
- **Wide format support** — PNG, JPEG, GIF, BMP, TGA, TIFF, WebP, OpenEXR, Radiance HDR, DDS, PSD/PSB

## Supported Image Formats

| Format | Extensions |
|--------|-----------|
| PNG | `.png` |
| JPEG | `.jpg`, `.jpeg` |
| GIF | `.gif` |
| BMP | `.bmp` |
| TGA | `.tga` |
| TIFF | `.tiff`, `.tif` |
| WebP | `.webp` |
| OpenEXR | `.exr` |
| Radiance HDR | `.hdr` |
| DirectDraw Surface | `.dds` |
| Photoshop | `.psd`, `.psb` |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + O` | Open image file |
| `Arrow Keys` | Move cursor by 1 pixel |
| `Shift + Arrow Keys` | Move cursor by 10 pixels |
| `Home` | Jump to (0, 0) |
| `End` | Jump to bottom-right corner |
| `Escape` | Clear all selected pixels |
| `Ctrl/Cmd + Click` | Toggle multi-select pixel |

## Tech Stack

- **Backend**: Rust + Tauri 2
- **Frontend**: React 19 + TypeScript + Vite 7
- **State Management**: Zustand
- **Image Processing**: `image` crate, `exr`, `ddsfile` (all decoding in Rust)

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (stable)
- Tauri system dependencies ([see Tauri docs](https://v2.tauri.app/start/prerequisites/))

### Setup

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Build outputs are located in `src-tauri/target/release/bundle/` — includes platform-specific installers (`.exe`/`.msi` on Windows, `.dmg` on macOS, `.deb`/`.AppImage` on Linux).

## macOS Installation Note

The app is not signed with an Apple Developer certificate. macOS may show "app is damaged" when you try to open it. Run this command to fix it:

```bash
xattr -cr /Applications/Pixel\ Inspector.app
```

## License

MIT
