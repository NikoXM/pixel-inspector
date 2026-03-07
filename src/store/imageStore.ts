import { create } from "zustand";

export interface ImageInfo {
  width: number;
  height: number;
  isHdr: boolean;
  formatName: string;
  filePath: string;
  pixelCount: number;
}

interface ImageState {
  imageInfo: ImageInfo | null;
  /** f32 pixel data cached in frontend (for small images ≤16MP) */
  pixelData: Float32Array | null;
  /** Whether pixel data is fully loaded in frontend */
  hasLocalPixels: boolean;
  loading: boolean;

  setImageInfo: (info: ImageInfo) => void;
  setPixelData: (data: Float32Array) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  imageInfo: null,
  pixelData: null,
  hasLocalPixels: false,
  loading: false,

  setImageInfo: (info) => set({ imageInfo: info }),
  setPixelData: (data) => set({ pixelData: data, hasLocalPixels: true }),
  setLoading: (loading) => set({ loading }),
  clear: () =>
    set({
      imageInfo: null,
      pixelData: null,
      hasLocalPixels: false,
      loading: false,
    }),
}));
