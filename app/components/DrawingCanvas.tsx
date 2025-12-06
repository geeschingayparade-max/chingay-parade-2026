"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { toast } from "react-toastify";
import { IconArrowLeft, IconSend } from "@tabler/icons-react";
import { FloatTemplate } from "../types";
import { CANVAS_CONFIG, DRAWING_CONFIG } from "../constants";
import Toolbar from "./Toolbar";
import ColorPalette from "./ColorPalette";
import FloatSuccessAnimation from "./FloatSuccessAnimation";
import "./DrawingCanvas.css";

interface DrawingCanvasProps {
  template: FloatTemplate;
  onBack: () => void;
}

export default function DrawingCanvas({
  template,
  onBack,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen"); // Track current tool
  const [currentColor, setCurrentColor] = useState(DRAWING_CONFIG.defaultColor);
  const [brushSize, setBrushSize] = useState(DRAWING_CONFIG.defaultBrushSize);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [submittedFloatImage, setSubmittedFloatImage] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [templateOverlay, setTemplateOverlay] = useState<{
    url: string;
    style: React.CSSProperties;
  } | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef(0);
  const isLoadingHistoryRef = useRef(false); // Prevent saving during undo/redo
  const startTimeRef = useRef(Date.now());

  // Calculate responsive canvas size
  const calculateCanvasSize = useCallback(() => {
    if (typeof window === "undefined") return { width: 1024, height: 768 };

    const isLandscape = window.innerWidth > window.innerHeight;
    const padding = isLandscape
      ? CANVAS_CONFIG.viewportPadding.landscape
      : CANVAS_CONFIG.viewportPadding.portrait;

    const availableWidth = window.innerWidth - padding.horizontal;
    const availableHeight = window.innerHeight - padding.vertical;

    // Calculate size maintaining aspect ratio
    const aspectRatio = CANVAS_CONFIG.maxWidth / CANVAS_CONFIG.maxHeight;
    let width = Math.min(availableWidth, CANVAS_CONFIG.maxWidth);
    let height = width / aspectRatio;

    if (height > availableHeight) {
      height = Math.min(availableHeight, CANVAS_CONFIG.maxHeight);
      width = height * aspectRatio;
    }

    return {
      width: Math.floor(width),
      height: Math.floor(height),
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateCanvasSize();
      setCanvasSize(newSize);

      if (fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        const oldWidth = canvas.getWidth();
        const oldHeight = canvas.getHeight();
        const scaleX = newSize.width / oldWidth;
        const scaleY = newSize.height / oldHeight;

        canvas.setDimensions(newSize);

        // Scale all objects proportionally
        canvas.getObjects().forEach((obj: fabric.Object) => {
          obj.scaleX = (obj.scaleX || 1) * scaleX;
          obj.scaleY = (obj.scaleY || 1) * scaleY;
          obj.left = (obj.left || 0) * scaleX;
          obj.top = (obj.top || 0) * scaleY;
          obj.setCoords();
        });

        canvas.renderAll();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [calculateCanvasSize]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !canvasSize.width) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: CANVAS_CONFIG.backgroundColor,
      isDrawingMode: true,
      selection: false,
    });

    // Configure brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = currentColor;
      canvas.freeDrawingBrush.width = brushSize;
    }

    fabricCanvasRef.current = canvas;

    // Load template
    loadTemplate(canvas);

    // Add history tracking
    canvas.on("object:added", () => saveHistory());
    canvas.on("object:modified", () => saveHistory());
    canvas.on("object:removed", () => saveHistory());

    return () => {
      canvas.dispose();
    };
  }, [template, canvasSize]);

  // Load template as CSS overlay (always visible, even during drawing)
  const loadTemplate = async (canvas: fabric.Canvas) => {
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Support both SVG and regular images (PNG/JPG)
    const isImage = template.svgPath.match(/\.(png|jpg|jpeg)$/i);

    if (isImage) {
      // Load regular image to calculate dimensions
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Calculate scale to fit 80% of canvas
        const scale = Math.min(
          (canvasWidth * 0.8) / img.width,
          (canvasHeight * 0.8) / img.height
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the template
        const left = (canvasWidth - scaledWidth) / 2;
        const top = (canvasHeight - scaledHeight) / 2;

        // Set as CSS overlay
        setTemplateOverlay({
          url: template.svgPath,
          style: {
            position: "absolute",
            left: `${left}px`,
            top: `${top}px`,
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            pointerEvents: "none", // Allow drawing through it
            zIndex: 10, // Above canvas
            userSelect: "none",
          },
        });

        saveHistory();
      };
      img.src = template.svgPath;
    } else {
      // Load SVG
      fabric.loadSVGFromURL(
        template.svgPath,
        (objects: any[], options: any) => {
          const obj = fabric.util.groupSVGElements(objects, options);

          // Calculate scale to fit 80% of canvas
          const scale = Math.min(
            (canvasWidth * 0.8) / (obj.width || 1),
            (canvasHeight * 0.8) / (obj.height || 1)
          );

          const scaledWidth = (obj.width || 0) * scale;
          const scaledHeight = (obj.height || 0) * scale;

          // Center the template
          const left = (canvasWidth - scaledWidth) / 2;
          const top = (canvasHeight - scaledHeight) / 2;

          // Set as CSS overlay
          setTemplateOverlay({
            url: template.svgPath,
            style: {
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              pointerEvents: "none", // Allow drawing through it
              zIndex: 10, // Above canvas
              userSelect: "none",
            },
          });

          saveHistory();
        }
      );
    }
  };

  // History management
  const saveHistory = useCallback(() => {
    if (!fabricCanvasRef.current || isLoadingHistoryRef.current) return;

    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const history = historyRef.current;
    const step = historyStepRef.current;

    // Remove any forward history when new action is made
    history.splice(step + 1);
    history.push(json);
    historyStepRef.current = history.length - 1;

    setCanUndo(history.length > 1);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (!fabricCanvasRef.current || historyStepRef.current <= 0) return;

    historyStepRef.current--;
    const canvas = fabricCanvasRef.current;
    isLoadingHistoryRef.current = true; // Prevent saving during load

    canvas.loadFromJSON(historyRef.current[historyStepRef.current], () => {
      canvas.renderAll();
      isLoadingHistoryRef.current = false;
      setCanUndo(historyStepRef.current > 0);
      setCanRedo(historyStepRef.current < historyRef.current.length - 1);
    });
  }, []);

  const redo = useCallback(() => {
    if (
      !fabricCanvasRef.current ||
      historyStepRef.current >= historyRef.current.length - 1
    )
      return;

    historyStepRef.current++;
    const canvas = fabricCanvasRef.current;
    isLoadingHistoryRef.current = true; // Prevent saving during load

    canvas.loadFromJSON(historyRef.current[historyStepRef.current], () => {
      canvas.renderAll();
      isLoadingHistoryRef.current = false;
      setCanUndo(true);
      setCanRedo(historyStepRef.current < historyRef.current.length - 1);
    });
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Clear all objects (template is CSS overlay, not affected)
    canvas.clear();
    canvas.backgroundColor = CANVAS_CONFIG.backgroundColor;

    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  // Tool handlers
  const handleToolChange = (tool: "pen" | "eraser") => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    setIsDrawingMode(true);
    setCurrentTool(tool); // Track current tool

    if (tool === "eraser") {
      // Eraser draws with white color
      // Since template is on top, it won't be affected
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = CANVAS_CONFIG.backgroundColor;
        canvas.freeDrawingBrush.width = DRAWING_CONFIG.eraserSize;
      }
    } else {
      // Switch to normal brush for pen
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = currentColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);

    // If in eraser mode, switch back to pen with the new color
    if (currentTool === "eraser") {
      handleToolChange("pen");
    }
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);

    // Update brush size for pen mode only (eraser has fixed size)
    if (currentTool === "pen" && fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = size;
    }
    // Note: Eraser size is fixed in DRAWING_CONFIG.eraserSize
  };

  // Submit drawing
  const handleSubmit = async () => {
    if (!fabricCanvasRef.current || isSubmitting || !templateOverlay) return;

    setIsSubmitting(true);

    try {
      // Create composite image: drawing + template overlay
      const canvas = fabricCanvasRef.current;
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = canvas.width || canvas.getWidth();
      compositeCanvas.height = canvas.height || canvas.getHeight();
      const ctx = compositeCanvas.getContext("2d");

      if (!ctx) throw new Error("Could not create canvas context");

      // 1. Load the clip mask image (use clipPath if available, otherwise use template)
      const clipMaskImg = new Image();
      clipMaskImg.crossOrigin = "anonymous";

      // Use separate clip mask if provided, otherwise use template overlay
      const clipMaskUrl = template.clipPath || templateOverlay.url;

      await new Promise<void>((resolve, reject) => {
        clipMaskImg.onload = () => resolve();
        clipMaskImg.onerror = reject;
        clipMaskImg.src = clipMaskUrl;
      });

      const left = parseFloat(templateOverlay.style.left as string);
      const top = parseFloat(templateOverlay.style.top as string);
      const width = parseFloat(templateOverlay.style.width as string);
      const height = parseFloat(templateOverlay.style.height as string);

      // 2. Draw clip mask to establish the shape (this will be the clipping region)
      ctx.drawImage(clipMaskImg, left, top, width, height);

      // 3. Use template's alpha channel as clipping mask
      // This mode only keeps pixels where both images overlap
      ctx.globalCompositeOperation = "source-in";

      // 4. Draw the user's drawing (will be clipped to template shape)
      const canvasDataUrl = canvas.toDataURL({ format: "png" });
      const canvasImg = new Image();

      await new Promise<void>((resolve, reject) => {
        canvasImg.onload = () => {
          ctx.drawImage(canvasImg, 0, 0);
          resolve();
        };
        canvasImg.onerror = reject;
        canvasImg.src = canvasDataUrl;
      });

      // 5. Reset composite operation for future operations
      ctx.globalCompositeOperation = "source-over";

      // 6. Draw the original template outline on top for definition
      const templateOutlineImg = new Image();
      templateOutlineImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        templateOutlineImg.onload = () => {
          // Draw template outline on top of the clipped drawing
          ctx.drawImage(templateOutlineImg, left, top, width, height);
          resolve();
        };
        templateOutlineImg.onerror = reject;
        templateOutlineImg.src = templateOverlay.url;
      });

      // 7. Get final composite image (clipped drawing + template outline!)
      const dataUrl = compositeCanvas.toDataURL("image/png", 1.0);

      // Calculate drawing time
      const drawingTime = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );

      // Submit to backend (Next.js API route)
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          templateName: template.name,
          imageData: dataUrl,
          timestamp: new Date().toISOString(),
          metadata: {
            drawingTime,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit drawing");
      }

      // Store the composite image and show success animation
      setSubmittedFloatImage(dataUrl);
      setShowSuccessAnimation(true);
      // Note: isSubmitting stays true until animation completes to prevent double submission
    } catch (error) {
      console.error("Failed to submit drawing:", error);
      toast.error("Oops! Could not send your drawing. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
      setIsSubmitting(false);
    }
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    setIsSubmitting(false);
    // Go back to template selection after animation
    onBack();
  };

  return (
    <>
      <div className="drawing-canvas-container">
        <div className="canvas-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <IconArrowLeft size={24} stroke={2.5} />
            <span>Back</span>
          </button>
          <h2 className="canvas-title">{template.displayName}</h2>
          <div className="header-spacer"></div>
        </div>

        <div className="canvas-workspace">
          <Toolbar
            currentTool={currentTool}
            onToolChange={handleToolChange}
            onUndo={undo}
            onRedo={redo}
            onClear={clearCanvas}
            canUndo={canUndo}
            canRedo={canRedo}
            brushSize={brushSize}
            onBrushSizeChange={handleBrushSizeChange}
          />

          <div className="canvas-wrapper">
            <canvas ref={canvasRef} />
            {templateOverlay && (
              <img
                src={templateOverlay.url}
                alt="Template overlay"
                style={templateOverlay.style}
                draggable={false}
              />
            )}
          </div>

          <ColorPalette
            currentColor={currentColor}
            onColorChange={handleColorChange}
          />
        </div>

        <div className="canvas-footer">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-label="Submit drawing"
          >
            {isSubmitting ? (
              <>
                <IconSend size={32} stroke={2.5} />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <IconSend size={32} stroke={2.5} />
                <span>Send to Parade!</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Animation */}
      {showSuccessAnimation && submittedFloatImage && (
        <FloatSuccessAnimation
          floatImageUrl={submittedFloatImage}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </>
  );
}
