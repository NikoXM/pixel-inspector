# Pixel Inspector

一款用于查看图片每个像素 RGBA 值的桌面应用。基于 **Tauri 2**（Rust 后端 + React 前端）构建。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 功能特性

- **像素级检查** — 点击任意像素，以多种格式查看 RGBA 值（0–255、0.0–1.0、HDR 原始值）
- **坐标导航** — 输入 X/Y 坐标快速跳转到指定像素
- **键盘导航** — 方向键移动光标，Shift+方向键每次移动 10 像素
- **多选像素** — Ctrl/Cmd+点击选择多个像素，并排对比数值
- **缩放与平移** — 滚轮缩放（0.1x–256x），拖拽平移画布
- **像素网格** — 缩放≥8x 时自动显示网格线
- **十字准星** — 选中像素的视觉指示器
- **棋盘格背景** — 可视化透明区域
- **HDR 支持** — 色调映射（Linear/Reinhard/ACES/AgX）+ 曝光控制（-10 到 +10 档）
- **广泛格式支持** — PNG、JPEG、GIF、BMP、TGA、TIFF、WebP、OpenEXR、Radiance HDR、DDS、PSD/PSB

## 支持的图片格式

| 格式 | 扩展名 |
|------|--------|
| PNG | `.png` |
| JPEG | `.jpg`、`.jpeg` |
| GIF | `.gif` |
| BMP | `.bmp` |
| TGA | `.tga` |
| TIFF | `.tiff`、`.tif` |
| WebP | `.webp` |
| OpenEXR | `.exr` |
| Radiance HDR | `.hdr` |
| DirectDraw Surface | `.dds` |
| Photoshop | `.psd`、`.psb` |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + O` | 打开图片文件 |
| `方向键` | 移动光标 1 像素 |
| `Shift + 方向键` | 移动光标 10 像素 |
| `Home` | 跳转到 (0, 0) |
| `End` | 跳转到右下角 |
| `Escape` | 清除所有选中像素 |
| `Ctrl/Cmd + 点击` | 多选/取消选中像素 |

## 技术栈

- **后端**：Rust + Tauri 2
- **前端**：React 19 + TypeScript + Vite 7
- **状态管理**：Zustand
- **图像处理**：`image` crate、`exr`、`ddsfile`（全部在 Rust 端解码）

## 开发

### 环境要求

- [Node.js](https://nodejs.org/)（v18+）
- [Rust](https://rustup.rs/)（stable）
- Tauri 系统依赖（[参见 Tauri 文档](https://v2.tauri.app/start/prerequisites/)）

### 启动开发

```bash
npm install
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`，包含各平台安装包（Windows `.exe`/`.msi`、macOS `.dmg`、Linux `.deb`/`.AppImage`）。

## macOS 安装说明

本应用未使用 Apple 开发者证书签名。macOS 可能提示"应用已损坏"，运行以下命令即可解决：

```bash
xattr -cr /Applications/Pixel\ Inspector.app
```

## 许可证

MIT
