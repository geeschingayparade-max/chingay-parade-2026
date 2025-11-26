import { FloatTemplate } from "./types";

// API Configuration
export const API_CONFIG = {
  endpoints: {
    submit: "/api/submissions",
    health: "/api/health",
  },
  timeout: 30000, // 30 seconds
};

// Canvas Configuration
export const CANVAS_CONFIG = {
  // Canvas will be responsive, these are max dimensions
  maxWidth: 1024,
  maxHeight: 768,
  backgroundColor: "#ffffff",
  // Padding from viewport edges
  viewportPadding: {
    landscape: { horizontal: 280, vertical: 180 }, // Space for toolbars
    portrait: { horizontal: 80, vertical: 320 }, // More space for vertical layout
  },
};

// Drawing Tool Configuration
export const DRAWING_CONFIG = {
  brushSizes: [5, 10, 20, 30, 40],
  defaultBrushSize: 10,
  eraserSize: 30,
  colors: [
    "#FF6B6B", // Red
    "#4ECDC4", // Turquoise
    "#45B7D1", // Blue
    "#FFA07A", // Orange
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B500", // Amber
    "#FF85A1", // Pink
    "#95E1D3", // Aqua
    "#F38181", // Coral
    "#AA96DA", // Lavender
    "#FCBAD3", // Light Pink
    "#A8E6CF", // Light Green
    "#FFD3B6", // Peach
  ],
  defaultColor: "#FF6B6B",
};

// Float Templates
export const FLOAT_TEMPLATES: FloatTemplate[] = [
  {
    id: "chinese-opera",
    name: "chinese-opera",
    displayName: "Chinese Opera Float",
    thumbnail: "/templates/chinese-opera.png",
    svgPath: "/templates/chinese-opera.png",
    clipPath: "/templates/chinese-opera-clip.png", // Separate clip mask
    description: "A majestic chinese opera float",
  },
  {
    id: "lion",
    name: "lion",
    displayName: "Lion Float",
    thumbnail: "/templates/lion.png",
    svgPath: "/templates/lion.png",
    clipPath: "/templates/lion-clip.png", // Separate clip mask
    description: "A fierce lion float",
  },
  {
    id: "fish-fruits",
    name: "fish-fruits",
    displayName: "Fish and Fruits Float",
    thumbnail: "/templates/fish-fruits.png",
    svgPath: "/templates/fish-fruits.png",
    clipPath: "/templates/fish-fruits-clip.png", // Separate clip mask
    description: "A healthy fish and fruits float",
  },
  {
    id: "horse-carriage",
    name: "horse-carriage",
    displayName: "Horse Carriage Float",
    thumbnail: "/templates/horse-carriage.png",
    svgPath: "/templates/horse-carriage.png",
    clipPath: "/templates/horse-carriage-clip.png", // Separate clip mask
    description: "A horse and carriage float",
  },
  {
    id: "floral",
    name: "flora",
    displayName: "Floral Float",
    thumbnail: "/templates/floral.png",
    svgPath: "/templates/floral.png",
    clipPath: "/templates/floral-clip.png", // Separate clip mask
    description: "A floral float",
  },
];
