import React, { useRef, useEffect, useCallback } from "react";
import { useImageStore } from "../../store/imageStore";
import { useViewportStore } from "../../store/viewportStore";
import { useSettingsStore } from "../../store/settingsStore";
import "./ImageCanvas.css";

const CHECKERBOARD_SIZE = 8;
const GRID_MIN_ZOOM = 8;
// Checkerboard tile size in screen pixels (pre-rendered once)
const CHECKER_TILE_PX = CHECKERBOARD_SIZE * 2;

export const ImageCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const isDraggingRef = useRef(false);
  const mouseDownRef = useRef<{ x: number; y: number; button: number; ctrlKey: boolean; metaKey: boolean } | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number>(0);
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const DRAG_THRESHOLD = 3;

  const { imageInfo, pixelData } = useImageStore();
  const { zoom, panX, panY, cursorX, cursorY, cursorActive, selectedPixels, setZoom, setPan, setCursor, toggleSelectedPixel, clearSelectedPixels } =
    useViewportStore();
  const { showGrid, showCrosshair, showCheckerboard } = useSettingsStore();

  // Cached offscreen canvas for the image (created once per image load)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  // Cached checkerboard pattern
  const checkerPatternRef = useRef<CanvasPattern | null>(null);

  // Build offscreen canvas from pixelData when it changes
  useEffect(() => {
    if (!imageInfo || !pixelData) {
      offscreenRef.current = null;
      return;
    }

    const { width, height } = imageInfo;
    console.log("[canvas] Building offscreen canvas:", width, "x", height, "pixelData length:", pixelData.length);
    const imgData = new ImageData(width, height);
    const u8 = imgData.data;

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      u8[idx] = Math.round(Math.max(0, Math.min(1, pixelData[idx])) * 255);
      u8[idx + 1] = Math.round(Math.max(0, Math.min(1, pixelData[idx + 1])) * 255);
      u8[idx + 2] = Math.round(Math.max(0, Math.min(1, pixelData[idx + 2])) * 255);
      u8[idx + 3] = Math.round(Math.max(0, Math.min(1, pixelData[idx + 3])) * 255);
    }

    const osc = document.createElement("canvas");
    osc.width = width;
    osc.height = height;
    const octx = osc.getContext("2d")!;
    octx.putImageData(imgData, 0, 0);
    offscreenRef.current = osc;
    console.log("[canvas] Offscreen canvas ready");

    // Auto-fit: calculate zoom to fit image in viewport, then set viewport state.
    // The viewport state change will trigger store subscription → scheduleRender.
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const scaleX = rect.width / width;
      const scaleY = rect.height / height;
      const fitZoom = Math.min(scaleX, scaleY, 1) * 0.95;
      const clampedZoom = Math.max(0.1, Math.min(256, fitZoom));
      const panX = (rect.width - width * clampedZoom) / 2;
      const panY = (rect.height - height * clampedZoom) / 2;
      useViewportStore.setState({ zoom: clampedZoom, panX, panY });
    }
  }, [imageInfo, pixelData]);

  // Pre-render checkerboard pattern tile (zoom-independent)
  useEffect(() => {
    checkerPatternRef.current = null;
    if (!showCheckerboard) return;

    const tile = document.createElement("canvas");
    const s = CHECKER_TILE_PX;
    tile.width = s;
    tile.height = s;
    const tctx = tile.getContext("2d")!;
    const half = s / 2;
    tctx.fillStyle = "#cccccc";
    tctx.fillRect(0, 0, s, s);
    tctx.fillStyle = "#999999";
    tctx.fillRect(half, 0, half, half);
    tctx.fillRect(0, half, half, half);

    // We'll create the pattern in render since ctx is needed
    // Store the tile canvas instead
    checkerPatternRef.current = null;
    // Store tile as a ref for pattern creation
    (checkerPatternRef as any)._tile = tile;
  }, [showCheckerboard]);

  // Resize canvas only when container size actually changes
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return false;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (canvasSizeRef.current.w !== w || canvasSizeRef.current.h !== h) {
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
      return true;
    }
    return false;
  }, []);

  // Core render — reads from refs/zustand directly, no dependency array needed
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    syncCanvasSize();

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear with dark background
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, cw, ch);

    const info = useImageStore.getState().imageInfo;
    const osc = offscreenRef.current;
    if (!info || !osc) return;

    const { width: imgW, height: imgH } = info;

    // Read viewport state directly from store (avoid stale closures)
    const vs = useViewportStore.getState();
    const z = vs.zoom;
    const px = vs.panX;
    const py = vs.panY;

    const settings = useSettingsStore.getState();

    ctx.save();
    ctx.translate(px, py);

    // Draw checkerboard via pattern (much faster than per-pixel fillRect)
    if (settings.showCheckerboard) {
      const tile = (checkerPatternRef as any)?._tile as HTMLCanvasElement | undefined;
      if (tile) {
        // Scale the pattern so each checker cell = CHECKERBOARD_SIZE * zoom screen pixels
        const patternScale = (CHECKERBOARD_SIZE * z) / (CHECKER_TILE_PX / 2);
        ctx.save();
        ctx.scale(patternScale, patternScale);
        const pat = ctx.createPattern(tile, "repeat");
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, (imgW * z) / patternScale, (imgH * z) / patternScale);
        }
        ctx.restore();
      }
    }

    // Draw the image using cached offscreen canvas
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(osc, 0, 0, imgW * z, imgH * z);

    // Draw pixel grid when zoom >= 8 (only visible lines)
    if (settings.showGrid && z >= GRID_MIN_ZOOM) {
      const startX = Math.max(0, Math.floor(-px / z));
      const startY = Math.max(0, Math.floor(-py / z));
      const endX = Math.min(imgW, Math.ceil((cw - px) / z));
      const endY = Math.min(imgH, Math.ceil((ch - py) / z));

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = startX; x <= endX; x++) {
        const sx = x * z;
        ctx.moveTo(sx, startY * z);
        ctx.lineTo(sx, endY * z);
      }
      for (let y = startY; y <= endY; y++) {
        const sy = y * z;
        ctx.moveTo(startX * z, sy);
        ctx.lineTo(endX * z, sy);
      }
      ctx.stroke();
    }

    // Draw multi-selected pixels
    const selPixels = vs.selectedPixels;
    if (selPixels.length > 0) {
      ctx.lineWidth = 2;
      for (const sp of selPixels) {
        const spx = sp.x * z;
        const spy = sp.y * z;
        ctx.strokeStyle = "#ff8800";
        ctx.strokeRect(spx, spy, z, z);
        ctx.fillStyle = "rgba(255, 136, 0, 0.15)";
        ctx.fillRect(spx, spy, z, z);
      }
    }

    // Draw crosshair on primary cursor pixel
    if (settings.showCrosshair && vs.cursorActive) {
      const cpx = vs.cursorX * z;
      const cpy = vs.cursorY * z;

      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(cpx, cpy, z, z);

      ctx.strokeStyle = "rgba(0, 255, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(0, cpy + z / 2);
      ctx.lineTo(imgW * z, cpy + z / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cpx + z / 2, 0);
      ctx.lineTo(cpx + z / 2, imgH * z);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [syncCanvasSize]);

  // Schedule a render via requestAnimationFrame (coalesces rapid updates)
  const scheduleRender = useCallback(() => {
    if (rafIdRef.current) return; // already scheduled
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      renderFrame();
    });
  }, [renderFrame]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Subscribe to ALL store changes and schedule render
  useEffect(() => {
    const unsubs = [
      useImageStore.subscribe(scheduleRender),
      useViewportStore.subscribe(scheduleRender),
      useSettingsStore.subscribe(scheduleRender),
    ];
    return () => unsubs.forEach((u) => u());
  }, [scheduleRender]);

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => scheduleRender());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [scheduleRender]);

  // Mouse wheel zoom — direct store mutation, bypasses React render
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const state = useViewportStore.getState();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.max(0.1, Math.min(256, state.zoom * zoomFactor));

      const scale = newZoom / state.zoom;
      const newPanX = mouseX - (mouseX - state.panX) * scale;
      const newPanY = mouseY - (mouseY - state.panY) * scale;

      // Batch both updates into one store mutation
      useViewportStore.setState({ zoom: newZoom, panX: newPanX, panY: newPanY });
    },
    []
  );

  // Mouse pan (any button drag) & click (left button release without drag)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle click or Alt+Left → immediate pan mode
        isPanningRef.current = true;
        e.preventDefault();
      } else if (e.button === 0) {
        // Left click → record for potential drag or click
        mouseDownRef.current = { x: e.clientX, y: e.clientY, button: 0, ctrlKey: e.ctrlKey, metaKey: e.metaKey };
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        const state = useViewportStore.getState();
        useViewportStore.setState({ panX: state.panX + dx, panY: state.panY + dy });
        return;
      }

      // Left button held: check if drag threshold exceeded to start panning
      if (mouseDownRef.current && (e.buttons & 1)) {
        const dx = e.clientX - mouseDownRef.current.x;
        const dy = e.clientY - mouseDownRef.current.y;
        if (!isDraggingRef.current && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
          isDraggingRef.current = true;
          isPanningRef.current = true;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }
        if (isPanningRef.current) {
          const moveDx = e.clientX - lastMouseRef.current.x;
          const moveDy = e.clientY - lastMouseRef.current.y;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
          const state = useViewportStore.getState();
          useViewportStore.setState({ panX: state.panX + moveDx, panY: state.panY + moveDy });
        }
      }
    },
    []
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const wasDragging = isDraggingRef.current;
      const downInfo = mouseDownRef.current;
      isPanningRef.current = false;
      isDraggingRef.current = false;
      mouseDownRef.current = null;

      // If left button released without dragging → treat as click
      if (e.button === 0 && !wasDragging && downInfo) {
        const canvas = canvasRef.current;
        const info = useImageStore.getState().imageInfo;
        if (!canvas || !info) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const vs = useViewportStore.getState();
        const pixelX = Math.floor((mouseX - vs.panX) / vs.zoom);
        const pixelY = Math.floor((mouseY - vs.panY) / vs.zoom);

        if (pixelX >= 0 && pixelX < info.width && pixelY >= 0 && pixelY < info.height) {
          if (downInfo.ctrlKey || downInfo.metaKey) {
            toggleSelectedPixel(pixelX, pixelY);
          } else {
            setCursor(pixelX, pixelY);
            clearSelectedPixels();
          }
        }
      }
    },
    [setCursor, toggleSelectedPixel, clearSelectedPixels]
  );

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        className="image-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isPanningRef.current = false; isDraggingRef.current = false; mouseDownRef.current = null; }}
        onContextMenu={(e) => e.preventDefault()}
      />
      {!imageInfo && (
        <div className="canvas-placeholder">
          <div className="placeholder-text">
            <span className="placeholder-icon">🖼️</span>
            <p>Open an image to start inspecting pixels</p>
            <p className="placeholder-hint">File → Open Image or Ctrl+O</p>
          </div>
        </div>
      )}
    </div>
  );
};
