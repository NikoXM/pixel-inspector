import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useImageStore } from "../store/imageStore";
import { useViewportStore } from "../store/viewportStore";
import type { PixelCoord } from "../store/viewportStore";

export interface PixelRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PixelWithCoord extends PixelRGBA {
  x: number;
  y: number;
}

/**
 * Hook that provides pixel data reading functionality.
 * For small images (≤16MP), reads from local Float32Array.
 * For large images, reads from Rust backend via IPC.
 */
export function usePixelData() {
  const { pixelData, hasLocalPixels, imageInfo } = useImageStore();
  const { cursorX, cursorY, cursorActive } = useViewportStore();

  /**
   * Read pixel at (x, y) from local buffer or IPC.
   */
  const getPixel = useCallback(
    async (x: number, y: number): Promise<PixelRGBA | null> => {
      if (!imageInfo) return null;
      if (x < 0 || y < 0 || x >= imageInfo.width || y >= imageInfo.height) return null;

      // Fast path: read from local Float32Array
      if (hasLocalPixels && pixelData) {
        const idx = (y * imageInfo.width + x) * 4;
        return {
          r: pixelData[idx],
          g: pixelData[idx + 1],
          b: pixelData[idx + 2],
          a: pixelData[idx + 3],
        };
      }

      // Slow path: IPC to Rust
      try {
        const result = await invoke<{ r: number; g: number; b: number; a: number }>(
          "get_pixel",
          { x, y }
        );
        return result;
      } catch {
        return null;
      }
    },
    [imageInfo, hasLocalPixels, pixelData]
  );

  /**
   * Get the current cursor pixel data.
   */
  const getCurrentPixel = useCallback(async (): Promise<PixelRGBA | null> => {
    if (!cursorActive) return null;
    return getPixel(cursorX, cursorY);
  }, [cursorActive, cursorX, cursorY, getPixel]);

  /**
   * Get pixel data for multiple coordinates.
   */
  const getPixels = useCallback(
    async (coords: PixelCoord[]): Promise<PixelWithCoord[]> => {
      const results: PixelWithCoord[] = [];
      for (const { x, y } of coords) {
        const p = await getPixel(x, y);
        if (p) results.push({ ...p, x, y });
      }
      return results;
    },
    [getPixel]
  );

  /**
   * Format pixel to 0-255 integer values.
   */
  const toUint8 = useCallback((pixel: PixelRGBA) => ({
    r: Math.round(Math.max(0, Math.min(1, pixel.r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, pixel.g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, pixel.b)) * 255),
    a: Math.round(Math.max(0, Math.min(1, pixel.a)) * 255),
  }), []);

  /**
   * Format pixel to hex string #RRGGBBAA.
   */
  const toHex = useCallback((pixel: PixelRGBA) => {
    const u8 = toUint8(pixel);
    const hex = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
    return `#${hex(u8.r)}${hex(u8.g)}${hex(u8.b)}${hex(u8.a)}`;
  }, [toUint8]);

  return { getPixel, getPixels, getCurrentPixel, toUint8, toHex };
}
