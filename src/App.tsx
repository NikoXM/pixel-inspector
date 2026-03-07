import React, { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ImageCanvas } from "./components/Canvas/ImageCanvas";
import { PixelInspector } from "./components/Inspector/PixelInspector";
import { CoordinateInput } from "./components/Navigation/CoordinateInput";
import { useImageStore, ImageInfo } from "./store/imageStore";
import { useViewportStore } from "./store/viewportStore";
import { usePixelNavigation } from "./hooks/usePixelNavigation";

const SMALL_IMAGE_THRESHOLD = 16 * 1024 * 1024; // 16MP

function App() {
  const { imageInfo, loading, setImageInfo, setPixelData, setLoading, clear } = useImageStore();
  const { zoom, cursorX, cursorY, cursorActive, selectedPixels, reset: resetViewport } = useViewportStore();

  // Enable keyboard navigation
  usePixelNavigation();

  const openImage = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: [
              "png", "jpg", "jpeg", "gif", "bmp", "tga", "tiff", "tif", "webp",
              "exr", "hdr", "dds", "psd", "psb",
            ],
          },
        ],
      });

      if (!selected) return;

      const filePath = typeof selected === "string" ? selected : selected;
      if (!filePath) return;

      setLoading(true);
      clear();
      resetViewport();

      // Load image in Rust backend
      console.log("[open] Invoking open_image with path:", filePath);
      const info = await invoke<{
        width: number;
        height: number;
        is_hdr: boolean;
        format_name: string;
        file_path: string;
        pixel_count: number;
      }>("open_image", { path: filePath });

      console.log("[open] Image info:", info);

      const imageInfo: ImageInfo = {
        width: info.width,
        height: info.height,
        isHdr: info.is_hdr,
        formatName: info.format_name,
        filePath: info.file_path,
        pixelCount: info.pixel_count,
      };

      setImageInfo(imageInfo);

      // For small images, transfer all pixel data to frontend
      if (info.pixel_count <= SMALL_IMAGE_THRESHOLD) {
        console.log("[open] Fetching all pixels for small image...");
        const pixels = await invoke<number[]>("get_all_pixels");
        console.log("[open] Got pixels:", pixels.length, "values, first 8:", pixels.slice(0, 8));
        setPixelData(new Float32Array(pixels));
        console.log("[open] Pixel data set");
      } else {
        console.log("[open] Large image, pixel_count:", info.pixel_count, "> threshold:", SMALL_IMAGE_THRESHOLD);
      }

      setLoading(false);
    } catch (err) {
      console.error("[open] Failed to open image:", err);
      setLoading(false);
    }
  }, [setImageInfo, setPixelData, setLoading, clear, resetViewport]);

  // Keyboard shortcut: Ctrl+O to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault();
        openImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openImage]);

  // Handle file drop
  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        // In Tauri, we need the actual file path, which isn't available via web DragEvent.
        // File drop handling would need Tauri's drag-drop plugin for proper path access.
        // For now, users should use Ctrl+O or the menu.
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragover", handleDragOver);
    return () => {
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragover", handleDragOver);
    };
  }, []);

  return (
    <div className="app">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={openImage} title="Open Image (Ctrl+O)">
            Open
          </button>
          {imageInfo && (
            <span className="toolbar-filename" title={imageInfo.filePath}>
              {imageInfo.filePath.split("/").pop() || imageInfo.filePath.split("\\").pop()}
            </span>
          )}
        </div>
        <div className="toolbar-center">
          <CoordinateInput />
        </div>
        <div className="toolbar-right">
          <span className="toolbar-zoom">{Math.round(zoom * 100)}%</span>
          {cursorActive && (
            <span className="toolbar-coords">
              ({cursorX}, {cursorY})
            </span>
          )}
          {selectedPixels.length > 0 && (
            <span className="toolbar-selected-count">
              +{selectedPixels.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <ImageCanvas />
        <PixelInspector />
      </div>

      {/* Status bar */}
      <div className="statusbar">
        {loading && <span className="status-loading">Loading...</span>}
        {imageInfo && (
          <>
            <span>{imageInfo.width} x {imageInfo.height}</span>
            <span className="status-sep">|</span>
            <span>{imageInfo.formatName}</span>
            {imageInfo.isHdr && (
              <>
                <span className="status-sep">|</span>
                <span className="status-hdr">HDR</span>
              </>
            )}
            <span className="status-sep">|</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </>
        )}
        <div className="status-spacer" />
        <span className="status-hint">Arrow keys: navigate | Scroll: zoom | Alt+Drag: pan | Click: select | Ctrl+Click: multi-select | Esc: clear</span>
      </div>
    </div>
  );
}

export default App;
