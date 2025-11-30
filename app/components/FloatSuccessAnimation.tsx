"use client";

import { useEffect, useState } from "react";
import "./FloatSuccessAnimation.css";

interface FloatSuccessAnimationProps {
  floatImageUrl: string;
  onAnimationComplete: () => void;
}

export default function FloatSuccessAnimation({
  floatImageUrl,
  onAnimationComplete,
}: FloatSuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation after mount
    setTimeout(() => setIsVisible(true), 50);

    // Complete animation after 3 seconds
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  // Generate sparkle positions
  const sparkles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 0.8 + Math.random() * 0.4,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className={`float-success-overlay ${isVisible ? "visible" : ""}`}>
      {/* Background glow */}
      <div className="success-glow"></div>

      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
          }}
        />
      ))}

      {/* Magic particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={`particle-${i}`}
          className="magic-particle"
          style={{
            left: `${50 + (Math.random() - 0.5) * 40}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      {/* Float image */}
      <div className="float-image-container">
        <img src={floatImageUrl} alt="Your float" className="float-image" />

        {/* Shimmer effect */}
        <div className="shimmer"></div>
      </div>

      {/* Success message */}
      <div className="success-message">
        <h2 className="success-title">🎉 Amazing!</h2>
        <p className="success-text">Your float is joining the parade!</p>
      </div>

      {/* Trail effect as it goes up */}
      <div className="trail-container">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={`trail-${i}`}
            className="trail"
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
