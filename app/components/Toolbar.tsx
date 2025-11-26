"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  IconPencil,
  IconEraser,
  IconCircleDot,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconTrash,
} from "@tabler/icons-react";
import { DRAWING_CONFIG } from "../constants";
import "./Toolbar.css";

interface ToolbarProps {
  currentTool?: "pen" | "eraser";
  onToolChange: (tool: "pen" | "eraser") => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

export default function Toolbar({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  brushSize,
  onBrushSizeChange,
}: ToolbarProps) {
  const [showBrushSizes, setShowBrushSizes] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const brushButtonRef = useRef<HTMLButtonElement>(null);
  const brushMenuRef = useRef<HTMLDivElement>(null);

  // Use prop if provided, otherwise maintain local state
  const activeTool = currentTool || "pen";

  // Calculate menu position when showing
  useEffect(() => {
    if (showBrushSizes && brushButtonRef.current) {
      const rect = brushButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 10, // 10px spacing from button
      });
    }
  }, [showBrushSizes]);

  // Close brush size menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        brushMenuRef.current &&
        !brushMenuRef.current.contains(event.target as Node) &&
        brushButtonRef.current &&
        !brushButtonRef.current.contains(event.target as Node)
      ) {
        setShowBrushSizes(false);
      }
    };

    if (showBrushSizes) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showBrushSizes]);

  const handleToolChange = (tool: "pen" | "eraser") => {
    onToolChange(tool);
  };

  const handleClearClick = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    onClear();
    setShowClearConfirm(false);
    toast.success("Canvas cleared! Start fresh!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className="toolbar">
      <div className="tool-section">
        <button
          className={`tool-button ${activeTool === "pen" ? "active" : ""}`}
          onClick={() => handleToolChange("pen")}
          title="Pen Tool"
          aria-label="Pen Tool"
        >
          <IconPencil size={28} stroke={2.5} />
          <span className="tool-label">Pen</span>
        </button>

        <button
          className={`tool-button ${activeTool === "eraser" ? "active" : ""}`}
          onClick={() => handleToolChange("eraser")}
          title="Eraser Tool"
          aria-label="Eraser Tool"
        >
          <IconEraser size={28} stroke={2.5} />
          <span className="tool-label">Eraser</span>
        </button>
      </div>

      <div className="tool-divider"></div>

      <div className="tool-section brush-size-section">
        <button
          ref={brushButtonRef}
          className="tool-button brush-size-button"
          onClick={() => setShowBrushSizes(!showBrushSizes)}
          title="Brush Size"
          aria-label="Brush Size"
        >
          <IconCircleDot size={brushSize + 8} stroke={2.5} />
          <span className="tool-label">Size</span>
        </button>

        {showBrushSizes &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={brushMenuRef}
              className="brush-size-menu-portal"
              style={{
                position: "fixed",
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 10000,
              }}
            >
              {DRAWING_CONFIG.brushSizes.map((size) => (
                <button
                  key={size}
                  className={`brush-size-option ${
                    brushSize === size ? "active" : ""
                  }`}
                  onClick={() => {
                    onBrushSizeChange(size);
                    setShowBrushSizes(false);
                  }}
                  aria-label={`Brush size ${size}`}
                >
                  <div
                    className="brush-preview"
                    style={{ width: size, height: size }}
                  ></div>
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>

      <div className="tool-divider"></div>

      <div className="tool-section">
        <button
          className="tool-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          aria-label="Undo"
        >
          <IconArrowBackUp size={28} stroke={2.5} />
          <span className="tool-label">Undo</span>
        </button>

        <button
          className="tool-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          aria-label="Redo"
        >
          <IconArrowForwardUp size={28} stroke={2.5} />
          <span className="tool-label">Redo</span>
        </button>
      </div>

      <div className="tool-divider"></div>

      <div className="tool-section">
        <button
          className="tool-button clear-button"
          onClick={handleClearClick}
          title="Clear Canvas"
          aria-label="Clear Canvas"
        >
          <IconTrash size={28} stroke={2.5} />
          <span className="tool-label">Clear</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="confirm-overlay" onClick={handleCancelClear}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Clear your drawing?</h3>
            <p>This will remove everything you've drawn.</p>
            <div className="confirm-buttons">
              <button className="btn-cancel" onClick={handleCancelClear}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleConfirmClear}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
