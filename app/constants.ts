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
  // Padding from viewport edges (accounts for toolbar + color palette + gaps)
  viewportPadding: {
    landscape: { horizontal: 435, vertical: 230 }, // More space for toolbars on sides
    portrait: { horizontal: 80, vertical: 320 }, // More space for vertical layout
  },
};

// Drawing Tool Configuration
export const DRAWING_CONFIG = {
  brushSizes: [2, 5, 10, 20, 30, 40],
  defaultBrushSize: 10,
  eraserSize: 30,
  colors: [
    "#000000", // Black
    "#4A3728", // Dark Brown
    "#8B4513", // Saddle Brown
    "#FF6B6B", // Red
    "#4ECDC4", // Turquoise
    "#45B7D1", // Blue
    "#FFA07A", // Orange
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B500", // Amber
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
    id: "tiger-float",
    name: "tiger-float",
    displayName: "1970 - Tiger Float",
    thumbnail: "/templates/tiger.png",
    svgPath: "/templates/tiger.png",
    clipPath: "/templates/tiger-clip.png", // Separate clip mask
    description: "A tiger float",
  },
  {
    id: "swan-float",
    name: "swan-float",
    displayName: "1988 - Swan Float",
    thumbnail: "/templates/swan.png",
    svgPath: "/templates/swan.png",
    clipPath: "/templates/swan-clip.png", // Separate clip mask
    description: "A swan float",
  },
  {
    id: "carnival-float",
    name: "carnival-float",
    displayName: "1990 - Carnival Float",
    thumbnail: "/templates/carnival.png",
    svgPath: "/templates/carnival.png",
    clipPath: "/templates/carnival-clip.png", // Separate clip mask
    description: "A carnival float",
  },
  {
    id: "malay-float",
    name: "malay-float",
    displayName: "2010 - Malay Float",
    thumbnail: "/templates/malay-float.png",
    svgPath: "/templates/malay-float.png",
    clipPath: "/templates/malay-float-clip.png", // Separate clip mask
    description: "A malay float",
  },
  {
    id: "horse-carriage",
    name: "horse-carriage",
    displayName: "2018 - Indian Float",
    thumbnail: "/templates/horse-carriage.png",
    svgPath: "/templates/horse-carriage.png",
    clipPath: "/templates/horse-carriage-clip.png", // Separate clip mask
    description: "A horse and carriage float",
  },
  {
    id: "round-float",
    name: "round-float",
    displayName: "Round Chingay Float",
    thumbnail: "/templates/your-float.png",
    svgPath: "/templates/your-float.png",
    clipPath: "/templates/your-float-clip.png", // Separate clip mask
    description: "Your DIY Chingay float",
  },
  {
    id: "square-float",
    name: "square-float",
    displayName: "Square Chingay Float",
    thumbnail: "/templates/square-float.png",
    svgPath: "/templates/square-float.png",
    clipPath: "/templates/square-float-clip.png", // Separate clip mask
    description: "Your DIY Chingay float",
  },
  {
    id: "trapezoid-float",
    name: "trapezoid-float",
    displayName: "Trapezoid Chingay Float",
    thumbnail: "/templates/trapezoid-float.png",
    svgPath: "/templates/trapezoid-float.png",
    clipPath: "/templates/trapezoid-float-clip.png", // Separate clip mask
    description: "Your DIY Chingay float",
  },
];
