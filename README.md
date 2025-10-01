# imgtopdf

Offline-first desktop app for converting image batches into high-quality PDF documents. Built with Electron, React, Vite, pdf-lib, and sharp.

## Features

- Drag-and-drop or file dialog image selection with live validation
- Support for JPEG, PNG, WebP, HEIC/HEIF, TIFF, and BMP formats (GIF excluded)
- Sharp-powered preprocessing with automatic rotation and optional DPI-aware resizing
- Configurable PDF settings: page size presets, margins, scaling modes, JPEG quality, metadata preservation
- Real-time conversion progress updates, cancellation, and warning reporting
- Automatic output naming with configurable save location

## Getting Started

Install dependencies:

```bash
npm install
```

Start the app in development mode:

```bash
npm run dev
```

Run linting and formatting helpers:

```bash
npm run lint
npm run format
```

### Building Distributables

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

> **Note:** sharp bundles native binaries. Use the platform-specific build commands on the target OS to ensure compatible artifacts.

## Architecture Overview

- `src/main` – Electron main process, IPC handlers, conversion pipeline
- `src/preload` – Secure context bridge exposing the limited API surface to the renderer
- `src/renderer` – React UI with drag-and-drop workflow, options panel, progress feedback
- `src/common` – Shared TypeScript types between processes

## Development Tips

- Ensure Node.js 20.19+ (or 22.12+) is installed for electron-vite compatibility
- HEIC/HEIF conversion requires libvips/libheif support packaged with sharp (included via electron-builder)
- When testing large batches, monitor memory usage; the controller processes images sequentially to balance performance and resource usage

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
