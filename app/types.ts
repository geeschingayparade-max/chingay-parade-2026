export interface FloatTemplate {
  id: string;
  name: string;
  displayName: string;
  thumbnail: string;
  svgPath: string;
  clipPath?: string; // Optional separate image for clipping mask
  description: string;
}

export interface DrawingTool {
  type: "pen" | "eraser";
  color: string;
  size: number;
}

export interface SubmissionData {
  templateId: string;
  templateName: string;
  imageData: string;
  timestamp: string;
  metadata?: {
    drawingTime?: number;
    [key: string]: any;
  };
}
