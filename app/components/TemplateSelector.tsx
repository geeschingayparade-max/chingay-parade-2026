"use client";

import { FloatTemplate } from "../types";
import { FLOAT_TEMPLATES } from "../constants";
import { IconSparkles } from "@tabler/icons-react";
import "./TemplateSelector.css";

interface TemplateSelectorProps {
  onSelectTemplate: (template: FloatTemplate) => void;
}

export default function TemplateSelector({
  onSelectTemplate,
}: TemplateSelectorProps) {
  return (
    <div className="template-selector">
      <div className="template-header">
        <IconSparkles size={80} className="header-icon" stroke={2} />
        <h1 className="title">Choose Your Float!</h1>
        <p className="subtitle">Tap to start drawing</p>
      </div>

      <div className="template-grid">
        {FLOAT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            className="template-card"
            onClick={() => onSelectTemplate(template)}
            aria-label={`Select ${template.displayName}`}
          >
            <div className="template-image">
              <img src={template.thumbnail} alt={template.displayName} />
            </div>
            <h3 className="template-name">{template.displayName}</h3>
          </button>
        ))}
      </div>
    </div>
  );
}
