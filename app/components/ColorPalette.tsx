"use client";

import { DRAWING_CONFIG } from "../constants";
import "./ColorPalette.css";

interface ColorPaletteProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

export default function ColorPalette({
  currentColor,
  onColorChange,
}: ColorPaletteProps) {
  return (
    <div className="color-palette">
      <div className="palette-title">Colors</div>
      <div className="color-grid">
        {DRAWING_CONFIG.colors.map((color) => (
          <button
            key={color}
            className={`color-button ${currentColor === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            title={color}
          >
            {currentColor === color && <span className="check-mark">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
