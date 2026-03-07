import { useCallback, useEffect } from "react";
import { useImageStore } from "../store/imageStore";
import { useViewportStore } from "../store/viewportStore";

/**
 * Hook that handles keyboard navigation for pixel cursor.
 * - Arrow keys: move 1 pixel
 * - Shift + Arrow: move 10 pixels
 * - Home: jump to (0, 0)
 * - End: jump to bottom-right corner
 * - Escape: clear multi-selected pixels
 */
export function usePixelNavigation() {
  const imageInfo = useImageStore((s) => s.imageInfo);
  const { cursorX, cursorY, setCursor, setCursorActive, clearSelectedPixels } = useViewportStore();

  const moveCursor = useCallback(
    (dx: number, dy: number) => {
      if (!imageInfo) return;
      const newX = Math.max(0, Math.min(imageInfo.width - 1, cursorX + dx));
      const newY = Math.max(0, Math.min(imageInfo.height - 1, cursorY + dy));
      setCursor(newX, newY);
    },
    [imageInfo, cursorX, cursorY, setCursor]
  );

  const jumpTo = useCallback(
    (x: number, y: number) => {
      if (!imageInfo) return;
      const clampedX = Math.max(0, Math.min(imageInfo.width - 1, x));
      const clampedY = Math.max(0, Math.min(imageInfo.height - 1, y));
      setCursor(clampedX, clampedY);
    },
    [imageInfo, setCursor]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when input/textarea is focused
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (!imageInfo) return;

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveCursor(0, -step);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveCursor(0, step);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveCursor(-step, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveCursor(step, 0);
          break;
        case "Home":
          e.preventDefault();
          jumpTo(0, 0);
          break;
        case "End":
          e.preventDefault();
          jumpTo(imageInfo.width - 1, imageInfo.height - 1);
          break;
        case "Escape":
          e.preventDefault();
          clearSelectedPixels();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageInfo, moveCursor, jumpTo, clearSelectedPixels]);

  return { moveCursor, jumpTo };
}
