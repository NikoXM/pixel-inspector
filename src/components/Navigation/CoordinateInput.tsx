import React, { useState, useCallback } from "react";
import { useImageStore } from "../../store/imageStore";
import { useViewportStore } from "../../store/viewportStore";
import "./CoordinateInput.css";

export const CoordinateInput: React.FC = () => {
  const imageInfo = useImageStore((s) => s.imageInfo);
  const { cursorX, cursorY, setCursor, zoom, panX, panY, setPan } = useViewportStore();

  const [inputX, setInputX] = useState("");
  const [inputY, setInputY] = useState("");

  const jumpToCoordinate = useCallback(() => {
    if (!imageInfo) return;

    const x = parseInt(inputX, 10);
    const y = parseInt(inputY, 10);

    if (isNaN(x) || isNaN(y)) return;

    const clampedX = Math.max(0, Math.min(imageInfo.width - 1, x));
    const clampedY = Math.max(0, Math.min(imageInfo.height - 1, y));

    setCursor(clampedX, clampedY);

    // Center viewport on the target pixel
    const canvas = document.querySelector(".canvas-container");
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const newPanX = rect.width / 2 - (clampedX + 0.5) * zoom;
      const newPanY = rect.height / 2 - (clampedY + 0.5) * zoom;
      setPan(newPanX, newPanY);
    }

    setInputX("");
    setInputY("");
  }, [imageInfo, inputX, inputY, zoom, setCursor, setPan]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        jumpToCoordinate();
      }
    },
    [jumpToCoordinate]
  );

  if (!imageInfo) return null;

  return (
    <div className="coordinate-input">
      <span className="coord-label">Go to:</span>
      <div className="coord-field">
        <label className="coord-prefix">X</label>
        <input
          type="number"
          className="coord-input"
          value={inputX}
          onChange={(e) => setInputX(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={String(cursorX)}
          min={0}
          max={imageInfo.width - 1}
        />
      </div>
      <div className="coord-field">
        <label className="coord-prefix">Y</label>
        <input
          type="number"
          className="coord-input"
          value={inputY}
          onChange={(e) => setInputY(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={String(cursorY)}
          min={0}
          max={imageInfo.height - 1}
        />
      </div>
      <button className="coord-go-btn" onClick={jumpToCoordinate} title="Jump to coordinates (Enter)">
        Go
      </button>
    </div>
  );
};
