import React, { useState, useEffect } from "react";
import { useImageStore } from "../../store/imageStore";
import { useViewportStore } from "../../store/viewportStore";
import { usePixelData, PixelRGBA, PixelWithCoord } from "../../hooks/usePixelData";
import "./PixelInspector.css";

const PixelRGBADisplay: React.FC<{
  pixel: PixelRGBA;
  label?: string;
  coord?: { x: number; y: number };
  isHdr: boolean;
  toUint8: (p: PixelRGBA) => { r: number; g: number; b: number; a: number };
  toHex: (p: PixelRGBA) => string;
  onRemove?: () => void;
}> = ({ pixel, label, coord, isHdr, toUint8, toHex, onRemove }) => {
  const u8 = toUint8(pixel);
  const hex = toHex(pixel);

  return (
    <div className="pixel-entry">
      <div className="pixel-entry-header">
        {coord && <span className="pixel-entry-coord">({coord.x}, {coord.y})</span>}
        {label && <span className="pixel-entry-label">{label}</span>}
        {onRemove && (
          <button className="pixel-remove-btn" onClick={onRemove} title="Remove">×</button>
        )}
      </div>

      {/* Color Preview */}
      <div className="color-preview-row">
        <div
          className="color-swatch"
          style={{
            backgroundColor: `rgba(${u8.r}, ${u8.g}, ${u8.b}, ${pixel.a})`,
          }}
        />
        <span className="color-hex">{hex}</span>
      </div>

      {/* 0-255 */}
      <div className="rgba-grid">
        <div className="rgba-cell r">
          <span className="channel-label">R</span>
          <span className="channel-value">{u8.r}</span>
        </div>
        <div className="rgba-cell g">
          <span className="channel-label">G</span>
          <span className="channel-value">{u8.g}</span>
        </div>
        <div className="rgba-cell b">
          <span className="channel-label">B</span>
          <span className="channel-value">{u8.b}</span>
        </div>
        <div className="rgba-cell a">
          <span className="channel-label">A</span>
          <span className="channel-value">{u8.a}</span>
        </div>
      </div>

      {/* 0.0-1.0 */}
      <div className="rgba-grid rgba-float">
        <div className="rgba-cell r">
          <span className="channel-label">R</span>
          <span className="channel-value">{pixel.r.toFixed(4)}</span>
        </div>
        <div className="rgba-cell g">
          <span className="channel-label">G</span>
          <span className="channel-value">{pixel.g.toFixed(4)}</span>
        </div>
        <div className="rgba-cell b">
          <span className="channel-label">B</span>
          <span className="channel-value">{pixel.b.toFixed(4)}</span>
        </div>
        <div className="rgba-cell a">
          <span className="channel-label">A</span>
          <span className="channel-value">{pixel.a.toFixed(4)}</span>
        </div>
      </div>

      {/* Raw HDR values */}
      {isHdr && (
        <div className="rgba-grid rgba-hdr">
          <div className="rgba-cell r">
            <span className="channel-label">R</span>
            <span className="channel-value">{pixel.r.toFixed(6)}</span>
          </div>
          <div className="rgba-cell g">
            <span className="channel-label">G</span>
            <span className="channel-value">{pixel.g.toFixed(6)}</span>
          </div>
          <div className="rgba-cell b">
            <span className="channel-label">B</span>
            <span className="channel-value">{pixel.b.toFixed(6)}</span>
          </div>
          <div className="rgba-cell a">
            <span className="channel-label">A</span>
            <span className="channel-value">{pixel.a.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const PixelInspector: React.FC = () => {
  const imageInfo = useImageStore((s) => s.imageInfo);
  const { cursorX, cursorY, cursorActive, selectedPixels, toggleSelectedPixel, clearSelectedPixels } = useViewportStore();
  const { getPixel, getPixels, toUint8, toHex } = usePixelData();

  const [pixel, setPixel] = useState<PixelRGBA | null>(null);
  const [multiPixels, setMultiPixels] = useState<PixelWithCoord[]>([]);

  // Update primary pixel data when cursor moves
  useEffect(() => {
    if (!cursorActive) {
      setPixel(null);
      return;
    }

    let cancelled = false;
    getPixel(cursorX, cursorY).then((p) => {
      if (!cancelled) setPixel(p);
    });

    return () => {
      cancelled = true;
    };
  }, [cursorX, cursorY, cursorActive, getPixel]);

  // Update multi-selected pixels data
  useEffect(() => {
    if (selectedPixels.length === 0) {
      setMultiPixels([]);
      return;
    }

    let cancelled = false;
    getPixels(selectedPixels).then((results) => {
      if (!cancelled) setMultiPixels(results);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedPixels, getPixels]);

  if (!imageInfo) {
    return (
      <div className="inspector-panel">
        <div className="inspector-header">Pixel Inspector</div>
        <div className="inspector-empty">No image loaded</div>
      </div>
    );
  }

  return (
    <div className="inspector-panel">
      <div className="inspector-header">Pixel Inspector</div>

      {/* Image Info */}
      <div className="inspector-section">
        <div className="section-title">Image</div>
        <div className="info-row">
          <span className="info-label">Size</span>
          <span className="info-value">{imageInfo.width} x {imageInfo.height}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Format</span>
          <span className="info-value">{imageInfo.formatName}</span>
        </div>
        {imageInfo.isHdr && (
          <div className="info-row">
            <span className="info-label">HDR</span>
            <span className="info-value hdr-badge">Yes</span>
          </div>
        )}
      </div>

      {/* Primary Cursor Pixel */}
      <div className="inspector-section">
        <div className="section-title">
          Cursor
          {cursorActive && <span className="section-coord">({cursorX}, {cursorY})</span>}
        </div>
        {pixel ? (
          <PixelRGBADisplay
            pixel={pixel}
            isHdr={imageInfo.isHdr}
            toUint8={toUint8}
            toHex={toHex}
          />
        ) : (
          <div className="inspector-empty-inline">Click to select a pixel</div>
        )}
      </div>

      {/* Multi-selected Pixels */}
      <div className="inspector-section">
        <div className="section-title">
          Selected Pixels
          <span className="section-count">{selectedPixels.length}</span>
          {selectedPixels.length > 0 && (
            <button className="clear-all-btn" onClick={clearSelectedPixels} title="Clear all (Esc)">
              Clear
            </button>
          )}
        </div>
        {selectedPixels.length === 0 ? (
          <div className="inspector-empty-inline">Ctrl+Click to add pixels</div>
        ) : (
          <div className="multi-pixel-list">
            {multiPixels.map((mp) => (
              <PixelRGBADisplay
                key={`${mp.x}-${mp.y}`}
                pixel={mp}
                coord={{ x: mp.x, y: mp.y }}
                isHdr={imageInfo.isHdr}
                toUint8={toUint8}
                toHex={toHex}
                onRemove={() => toggleSelectedPixel(mp.x, mp.y)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
