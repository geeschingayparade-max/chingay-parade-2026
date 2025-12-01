"use client";

import { useState, useRef, useEffect } from "react";

/**
 * PathEditor Component
 *
 * A visual tool to help design the parade path.
 * Shows the path overlaid on your background, and outputs the path coordinates
 * that you can copy into ParadeScenePixi.tsx
 *
 * Usage:
 * 1. Import this in your parade page temporarily
 * 2. Draw your desired path by clicking points
 * 3. Copy the generated code
 * 4. Paste into calculatePathPosition() in ParadeScenePixi.tsx
 * 5. Remove this component
 */

interface PathPoint {
  x: number;
  y: number;
  progress: number; // 0 to 1
}

export default function PathEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [backgroundsLoaded, setBackgroundsLoaded] = useState(false);
  const backgroundImagesRef = useRef<HTMLImageElement[]>([]);

  // Virtual canvas dimensions (actual parade background size)
  const VIRTUAL_WIDTH = 3840;
  const VIRTUAL_HEIGHT = 2180;
  const scaleRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });

  // Load background images once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate scale to fit virtual canvas to screen (cover mode)
    const calculateScale = () => {
      const scaleX = window.innerWidth / VIRTUAL_WIDTH;
      const scaleY = window.innerHeight / VIRTUAL_HEIGHT;
      const scale = Math.max(scaleX, scaleY);

      const scaledWidth = VIRTUAL_WIDTH * scale;
      const scaledHeight = VIRTUAL_HEIGHT * scale;

      const offsetX = (window.innerWidth - scaledWidth) / 2;
      const offsetY = (window.innerHeight - scaledHeight) / 2;

      scaleRef.current = { scale, offsetX, offsetY };
      return { scale, offsetX, offsetY };
    };

    calculateScale();

    // Set canvas size to screen size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load background images
    const loadImages = async () => {
      const imageSrcs = [
        "/background/sky.png",
        "/background/background.png",
        "/background/midground.png",
        "/background/foreground.png",
      ];

      const loadedImages: HTMLImageElement[] = [];

      for (const src of imageSrcs) {
        const img = new Image();
        img.src = src;
        await new Promise((resolve) => {
          img.onload = () => {
            loadedImages.push(img);
            resolve(null);
          };
          img.onerror = () => {
            console.warn(`Failed to load ${src}`);
            resolve(null);
          };
        });
      }

      backgroundImagesRef.current = loadedImages;
      setBackgroundsLoaded(true);
    };

    loadImages();

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return;

      // Recalculate scale
      const scaleX = window.innerWidth / VIRTUAL_WIDTH;
      const scaleY = window.innerHeight / VIRTUAL_HEIGHT;
      const scale = Math.max(scaleX, scaleY);

      const scaledWidth = VIRTUAL_WIDTH * scale;
      const scaledHeight = VIRTUAL_HEIGHT * scale;

      const offsetX = (window.innerWidth - scaledWidth) / 2;
      const offsetY = (window.innerHeight - scaledHeight) / 2;

      scaleRef.current = { scale, offsetX, offsetY };

      // Resize canvas
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redraw canvas when points change or backgrounds load
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background layers (semi-transparent) with proper scaling
    if (backgroundsLoaded && backgroundImagesRef.current.length > 0) {
      ctx.globalAlpha = 0.3;
      const { scale, offsetX, offsetY } = scaleRef.current;
      backgroundImagesRef.current.forEach((img) => {
        const scaledWidth = VIRTUAL_WIDTH * scale;
        const scaledHeight = VIRTUAL_HEIGHT * scale;
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      });
      ctx.globalAlpha = 1.0;
    }

    // Helper to convert virtual coords to screen coords
    const { scale, offsetX, offsetY } = scaleRef.current;
    const toScreenX = (vx: number) => vx * scale + offsetX;
    const toScreenY = (vy: number) => vy * scale + offsetY;

    // Draw path
    if (points.length > 1) {
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(toScreenX(points[0].x), toScreenY(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toScreenX(points[i].x), toScreenY(points[i].y));
      }
      ctx.stroke();

      // Draw points
      points.forEach((point, index) => {
        const sx = toScreenX(point.x);
        const sy = toScreenY(point.y);

        ctx.fillStyle =
          index === 0
            ? "#00ff00"
            : index === points.length - 1
            ? "#0000ff"
            : "#ff0000";
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();

        // Label with progress %
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px monospace";
        ctx.fillText(`${Math.round(point.progress * 100)}%`, sx + 12, sy - 8);
      });
    }

    // Draw single point if only one
    if (points.length === 1) {
      const point = points[0];
      const sx = toScreenX(point.x);
      const sy = toScreenY(point.y);

      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "14px monospace";
      ctx.fillText("Start", sx + 12, sy - 8);
    }
  }, [points, backgroundsLoaded]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert from screen space to virtual space (3840x2180)
    const { scale, offsetX, offsetY } = scaleRef.current;
    const virtualX = (screenX - offsetX) / scale;
    const virtualY = (screenY - offsetY) / scale;

    // Only add point if within virtual canvas bounds
    if (
      virtualX < 0 ||
      virtualX > VIRTUAL_WIDTH ||
      virtualY < 0 ||
      virtualY > VIRTUAL_HEIGHT
    ) {
      return;
    }

    const newPoint: PathPoint = {
      x: Math.round(virtualX),
      y: Math.round(virtualY),
      progress: points.length / Math.max(points.length + 1, 10), // Auto-distribute
    };

    setPoints([...points, newPoint]);
  };

  const clearPath = () => {
    setPoints([]);
    setShowCode(false);
  };

  const generateCode = () => {
    if (points.length < 2) return "// Draw at least 2 points first";

    // Re-distribute progress evenly
    const redistributedPoints = points.map((p, i) => ({
      ...p,
      progress: i / (points.length - 1),
    }));

    // Generate linear interpolation code
    let code = `// Paste this into calculatePathPosition() in ParadeScenePixi.tsx\n`;
    code += `// These coordinates are in 3840x2180 resolution\n\n`;
    code += `const calculatePathPosition = (progress: number): { x: number; y: number } => {\n`;
    code += `  // Path waypoints (in original 3840x2180 coordinates)\n`;
    code += `  const waypoints = [\n`;

    redistributedPoints.forEach((p, i) => {
      code += `    { progress: ${p.progress.toFixed(3)}, x: ${Math.round(
        p.x
      )}, y: ${Math.round(p.y)} },\n`;
    });

    code += `  ];\n\n`;
    code += `  // Find the two waypoints to interpolate between\n`;
    code += `  let start = waypoints[0];\n`;
    code += `  let end = waypoints[waypoints.length - 1];\n\n`;
    code += `  for (let i = 0; i < waypoints.length - 1; i++) {\n`;
    code += `    if (progress >= waypoints[i].progress && progress <= waypoints[i + 1].progress) {\n`;
    code += `      start = waypoints[i];\n`;
    code += `      end = waypoints[i + 1];\n`;
    code += `      break;\n`;
    code += `    }\n`;
    code += `  }\n\n`;
    code += `  // Linear interpolation between waypoints\n`;
    code += `  const segmentProgress = (progress - start.progress) / (end.progress - start.progress);\n`;
    code += `  return {\n`;
    code += `    x: start.x + (end.x - start.x) * segmentProgress,\n`;
    code += `    y: start.y + (end.y - start.y) * segmentProgress,\n`;
    code += `  };\n`;
    code += `};\n`;

    return code;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "#000",
      }}
    >
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          cursor: isDrawing ? "crosshair" : "default",
          display: "block",
        }}
      />

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: "20px",
          borderRadius: "8px",
          color: "white",
          maxWidth: "300px",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Path Editor</h2>

        {!backgroundsLoaded && (
          <p
            style={{ fontSize: "14px", marginBottom: "15px", color: "#ffcc00" }}
          >
            ⏳ Loading background images...
          </p>
        )}

        {backgroundsLoaded && (
          <p style={{ fontSize: "14px", marginBottom: "15px" }}>
            {!isDrawing
              ? "Click 'Start Drawing' then click on the canvas to create path points."
              : `Points: ${points.length} - Click to add more points`}
          </p>
        )}

        <button
          onClick={() => setIsDrawing(!isDrawing)}
          disabled={!backgroundsLoaded}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            marginBottom: "10px",
            backgroundColor: !backgroundsLoaded
              ? "#666"
              : isDrawing
              ? "#ff4444"
              : "#44ff44",
            border: "none",
            borderRadius: "4px",
            cursor: backgroundsLoaded ? "pointer" : "not-allowed",
            fontWeight: "bold",
            opacity: backgroundsLoaded ? 1 : 0.5,
          }}
        >
          {isDrawing ? "Stop Drawing" : "Start Drawing"}
        </button>

        <button
          onClick={clearPath}
          style={{
            padding: "10px 20px",
            marginBottom: "10px",
            backgroundColor: "#444",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Clear Path
        </button>

        {points.length >= 2 && (
          <>
            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                padding: "10px 20px",
                marginBottom: "10px",
                display: "block",
                width: "100%",
                backgroundColor: "#4444ff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {showCode ? "Hide Code" : "Generate Code"}
            </button>

            {showCode && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#1e1e1e",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  maxHeight: "300px",
                  overflow: "auto",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {generateCode()}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateCode());
                    alert("Code copied to clipboard!");
                  }}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#44ff44",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </>
        )}

        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          <strong>Virtual Canvas:</strong>
          <br />
          3840 × 2180 px
          <br />
          <br />
          <strong>Legend:</strong>
          <br />
          🟢 Green = Start
          <br />
          🔴 Red = Waypoints
          <br />
          🔵 Blue = End
        </div>
      </div>
    </div>
  );
}
