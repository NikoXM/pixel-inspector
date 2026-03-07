import { create } from "zustand";

export interface PixelCoord {
  x: number;
  y: number;
}

interface ViewportState {
  /** Current zoom level (1 = 100%) */
  zoom: number;
  /** Pan offset in canvas pixels */
  panX: number;
  panY: number;
  /** Currently selected pixel coordinate (primary cursor) */
  cursorX: number;
  cursorY: number;
  /** Whether cursor is active (an image is loaded and a pixel is selected) */
  cursorActive: boolean;
  /** Multi-selected pixels (Ctrl/Cmd+Click) */
  selectedPixels: PixelCoord[];

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setCursor: (x: number, y: number) => void;
  setCursorActive: (active: boolean) => void;
  /** Toggle a pixel in the multi-selection list */
  toggleSelectedPixel: (x: number, y: number) => void;
  /** Clear all multi-selected pixels */
  clearSelectedPixels: () => void;
  reset: () => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  cursorX: 0,
  cursorY: 0,
  cursorActive: false,
  selectedPixels: [],

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(256, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  setCursor: (cursorX, cursorY) => set({ cursorX, cursorY, cursorActive: true }),
  setCursorActive: (cursorActive) => set({ cursorActive }),
  toggleSelectedPixel: (x, y) =>
    set((state) => {
      const exists = state.selectedPixels.findIndex((p) => p.x === x && p.y === y);
      if (exists >= 0) {
        return { selectedPixels: state.selectedPixels.filter((_, i) => i !== exists) };
      }
      return { selectedPixels: [...state.selectedPixels, { x, y }] };
    }),
  clearSelectedPixels: () => set({ selectedPixels: [] }),
  reset: () =>
    set({
      zoom: 1,
      panX: 0,
      panY: 0,
      cursorX: 0,
      cursorY: 0,
      cursorActive: false,
      selectedPixels: [],
    }),
}));
