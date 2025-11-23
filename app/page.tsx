"use client";

import { useState } from "react";
import TemplateSelector from "./components/TemplateSelector";
import DrawingCanvas from "./components/DrawingCanvas";
import { FloatTemplate } from "./types";

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<FloatTemplate | null>(null);

  const handleTemplateSelect = (template: FloatTemplate) => {
    setSelectedTemplate(template);
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
  };

  return (
    <main style={{ width: "100%", height: "100vh" }}>
      {!selectedTemplate ? (
        <TemplateSelector onSelectTemplate={handleTemplateSelect} />
      ) : (
        <DrawingCanvas
          template={selectedTemplate}
          onBack={handleBackToTemplates}
        />
      )}
    </main>
  );
}
