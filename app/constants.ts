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
    id: "dragon",
    name: "dragon",
    displayName: "Ice Kacang",
    thumbnail: "/templates/icekacangfloat.png",
    svgPath: "/templates/icekacangfloat.png",
    description: "A majestic ice kacang float",
  },
  {
    id: "lion",
    name: "lion",
    displayName: "Lion Float",
    thumbnail: "/templates/lion-thumb.svg",
    svgPath: "/templates/lion.svg",
    description: "A fierce lion dance",
  },
  {
    id: "peacock",
    name: "peacock",
    displayName: "Peacock Float",
    thumbnail: "/templates/peacock-thumb.svg",
    svgPath: "/templates/peacock.svg",
    description: "A beautiful peacock",
  },
  {
    id: "phoenix",
    name: "phoenix",
    displayName: "Phoenix Float",
    thumbnail: "/templates/phoenix-thumb.svg",
    svgPath: "/templates/phoenix.svg",
    description: "A mythical phoenix bird",
  },
  {
    id: "elephant",
    name: "elephant",
    displayName: "Elephant Float",
    thumbnail: "/templates/elephant-thumb.svg",
    svgPath: "/templates/elephant.svg",
    description: "A decorated elephant",
  },
];
