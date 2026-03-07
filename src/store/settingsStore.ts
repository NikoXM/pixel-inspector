import { create } from "zustand";

export type ToneMapOperator = "Linear" | "Reinhard" | "Aces" | "AgX";

interface SettingsState {
  /** Show pixel grid when zoom >= 8 */
  showGrid: boolean;
  /** Show crosshair on selected pixel */
  showCrosshair: boolean;
  /** Show checkerboard for transparent areas */
  showCheckerboard: boolean;
  /** Tone mapping operator for HDR images */
  toneMapOperator: ToneMapOperator;
  /** Exposure adjustment for HDR (in stops) */
  exposure: number;

  setShowGrid: (show: boolean) => void;
  setShowCrosshair: (show: boolean) => void;
  setShowCheckerboard: (show: boolean) => void;
  setToneMapOperator: (op: ToneMapOperator) => void;
  setExposure: (exposure: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  showGrid: true,
  showCrosshair: true,
  showCheckerboard: true,
  toneMapOperator: "Linear",
  exposure: 0,

  setShowGrid: (showGrid) => set({ showGrid }),
  setShowCrosshair: (showCrosshair) => set({ showCrosshair }),
  setShowCheckerboard: (showCheckerboard) => set({ showCheckerboard }),
  setToneMapOperator: (toneMapOperator) => set({ toneMapOperator }),
  setExposure: (exposure) => set({ exposure: Math.max(-10, Math.min(10, exposure)) }),
}));
