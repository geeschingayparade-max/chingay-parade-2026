"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { supabase } from "@/app/lib/supabase";
import "./ParadeScene.css";

interface FloatData {
  id: string;
  templateId: string;
  templateName: string;
  imageUrl: string;
  timestamp: string;
  position: number;
}

interface QueuedFloat {
  id: string;
  template_id: string;
  template_name: string;
  image_url: string;
  created_at: string;
}

interface FloatSprite {
  sprite: PIXI.Sprite;
  progress: number; // 0-1, progress along the parade path
  startTime: number;
  data: FloatData;
  baseScale: number; // Base scale to multiply with progress-based scaling
}

export default function ParadeScenePixi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // Layer containers (from bottom to top)
  const skyLayerRef = useRef<PIXI.Container | null>(null);
  const backgroundLayerRef = useRef<PIXI.Container | null>(null);
  const midgroundLayerRef = useRef<PIXI.Container | null>(null);
  const floatsBehindLayerRef = useRef<PIXI.Container | null>(null); // Between midground and foreground
  const foregroundLayerRef = useRef<PIXI.Container | null>(null);
  const floatsFrontLayerRef = useRef<PIXI.Container | null>(null); // In front of everything

  const floatsRef = useRef<Map<string, FloatSprite>>(new Map());
  const pendingQueueRef = useRef<QueuedFloat[]>([]);
  const recentFloatsPoolRef = useRef<QueuedFloat[]>([]); // Pool of latest 50 floats to reuse
  const textureCacheRef = useRef<Map<string, PIXI.Texture>>(new Map());
  const decorativeSpritesRef = useRef<
    Array<{ sprite: PIXI.Sprite; config: DecorativeElement }>
  >([]);
  const lastSpawnTimeRef = useRef<number>(0); // Track last spawn time
  const lastSpawnedFloatIdRef = useRef<string | null>(null); // Track last spawned float ID
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null); // Spawn interval timer

  const [floatCount, setFloatCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const maxFloatsOnScreen = 50;
  const MIN_SPAWN_INTERVAL = 1000; // Minimum 1 second between spawns
  const MIN_PROGRESS_GAP = 0.015; // Minimum 1.5% progress before spawning next float

  // Background configuration
  const BACKGROUND_WIDTH = 3840;
  const BACKGROUND_HEIGHT = 2180;

  // Scale factors - will be calculated based on screen size
  const scaleRef = useRef({ x: 1, y: 1, uniform: 1 });

  // Decorative elements configuration (images/videos to place in the scene)
  interface DecorativeElement {
    src: string; // Path to image or video file (use .webm for transparency support)
    srcFallback?: string; // Fallback path (e.g., .mp4 for Safari) - optional
    type: "image" | "video";
    x: number; // X position in 3840x2180 space
    y: number; // Y position in 3840x2180 space
    width: number; // Width in 3840x2180 space
    height: number; // Height in 3840x2180 space
    layer:
      | "sky"
      | "background"
      | "midground"
      | "floatsBehind"
      | "foreground"
      | "floatsFront";
    loop?: boolean; // For videos (default: true)
  }

  // Helper: Check if browser supports WebM with alpha
  const supportsWebMAlpha = (): boolean => {
    const video = document.createElement("video");
    return (
      video.canPlayType('video/webm; codecs="vp9"') === "probably" ||
      video.canPlayType('video/webm; codecs="vp8"') === "probably"
    );
  };

  // ADD YOUR DECORATIVE ELEMENTS HERE
  // For transparent videos: use .webm (Chrome/Firefox/Edge) with .mp4 fallback (Safari)
  // Convert your MP4s to WebM using: ffmpeg -i input.mp4 -c:v libvpx-vp9 -pix_fmt yuva420p output.webm
  const decorativeElements: DecorativeElement[] = [
    {
      src: "/decorations/building-with-flag.webm",
      srcFallback: "/decorations/building-with-flag.mp4", // Fallback for Safari
      type: "video",
      x: 2300,
      y: 1000,
      width: 800,
      height: 400,
      layer: "floatsFront",
      loop: true,
    },
    {
      src: "/decorations/train.webm",
      srcFallback: "/decorations/train.mp4",
      type: "video",
      x: 2200,
      y: 200,
      width: 800,
      height: 100,
      layer: "sky",
      loop: true,
    },
    {
      src: "/decorations/ferriswheel.webm",
      srcFallback: "/decorations/ferriswheel.mp4",
      type: "video",
      x: 720,
      y: 5,
      width: 250,
      height: 250,
      layer: "sky",
      loop: true,
    },
    {
      src: "/decorations/stand.webm",
      srcFallback: "/decorations/stand.mp4",
      type: "video",
      x: 2500,
      y: 550,
      width: 550,
      height: 400,
      layer: "floatsBehind",
      loop: true,
    },
    {
      src: "/decorations/band-singing.webm",
      srcFallback: "/decorations/band-singing.mp4",
      type: "video",
      x: 3500,
      y: 860,
      width: 350,
      height: 250,
      layer: "floatsBehind",
      loop: true,
    },
    {
      src: "/decorations/dragon-dance.webm",
      srcFallback: "/decorations/dragon-dance.mp4",
      type: "video",
      x: 800,
      y: 700,
      width: 450,
      height: 350,
      layer: "foreground",
      loop: true,
    },
    {
      src: "/decorations/fire-performance.webm",
      srcFallback: "/decorations/fire-performance.mp4",
      type: "video",
      x: 1900,
      y: 670,
      width: 300,
      height: 250,
      layer: "floatsBehind",
      loop: true,
    },
    {
      src: "/decorations/merlion.webm",
      srcFallback: "/decorations/merlion.mp4",
      type: "video",
      x: 1000,
      y: 190,
      width: 650,
      height: 350,
      layer: "background",
      loop: true,
    },
    {
      src: "/decorations/monocycle.webm",
      srcFallback: "/decorations/monocycle.mp4",
      type: "video",
      x: 2700,
      y: 1400,
      width: 400,
      height: 300,
      layer: "floatsFront",
      loop: true,
    },
    {
      src: "/decorations/lion-float.webm",
      srcFallback: "/decorations/lion-float.mp4",
      type: "video",
      x: 3200,
      y: 1350,
      width: 700,
      height: 450,
      layer: "floatsFront",
      loop: true,
    },

    // photos
    {
      src: "/decorations/street-overhead.png",
      type: "image",
      x: 400,
      y: 140,
      width: 370,
      height: 300,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/street-overhead.png",
      type: "image",
      x: 750,
      y: 270,
      width: 370,
      height: 300,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/street-overhead.png",
      type: "image",
      x: 20,
      y: 65,
      width: 320,
      height: 300,
      layer: "midground",
    },
    {
      src: "/decorations/tree-2.png",
      type: "image",
      x: 150,
      y: 300,
      width: 220,
      height: 270,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/tree-2.png",
      type: "image",
      x: 3600,
      y: 600,
      width: 220,
      height: 270,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/tree-2.png",
      type: "image",
      x: 1360,
      y: 250,
      width: 220,
      height: 270,
      layer: "background",
    },
    {
      src: "/decorations/orchard-road-sign.png",
      type: "image",
      x: 400,
      y: 300,
      width: 334,
      height: 380,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/padang-sign.png",
      type: "image",
      x: 3050,
      y: 1350,
      width: 300,
      height: 360,
      layer: "floatsFront",
    },
    {
      src: "/decorations/tree-2.png",
      type: "image",
      x: 1000,
      y: 400,
      width: 200,
      height: 300,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/ion-orchard.png",
      type: "image",
      x: -150,
      y: 110,
      width: 850,
      height: 1000,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/chingay-sign.png",
      type: "image",
      x: 970,
      y: 550,
      width: 430,
      height: 200,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/tree-3.png",
      type: "image",
      x: 2420,
      y: 560,
      width: 200,
      height: 200,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/tree-3.png",
      type: "image",
      x: 800,
      y: 530,
      width: 250,
      height: 270,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/tree-3.png",
      type: "image",
      x: 1700,
      y: 550,
      width: 200,
      height: 220,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/gacha-float.png",
      type: "image",
      x: 2200,
      y: 600,
      width: 200,
      height: 200,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/carriage-float.png",
      type: "image",
      x: 1400,
      y: 700,
      width: 230,
      height: 220,
      layer: "floatsBehind",
    },
    {
      src: "/decorations/musuem.png",
      type: "image",
      x: 3100,
      y: 800,
      width: 600,
      height: 450,
      layer: "floatsFront",
    },
    {
      src: "/decorations/tree-4.png",
      type: "image",
      x: 2050,
      y: 1100,
      width: 350,
      height: 300,
      layer: "floatsFront",
    },
    {
      src: "/decorations/tree-4.png",
      type: "image",
      x: 1900,
      y: 1800,
      width: 400,
      height: 320,
      layer: "floatsFront",
    },
    {
      src: "/decorations/truck.png",
      type: "image",
      x: 1000,
      y: 1200,
      width: 500,
      height: 420,
      layer: "floatsFront",
    },
    {
      src: "/decorations/floral-float.png",
      type: "image",
      x: 1600,
      y: 1350,
      width: 600,
      height: 250,
      layer: "floatsFront",
    },

    // Example image on background layer
    // {
    //   src: "/decorations/banner.png",
    //   type: "image",
    //   x: 1000,
    //   y: 500,
    //   width: 800,
    //   height: 400,
    //   layer: "background",
    // },
    // Example video on foreground layer
    // {
    //   src: "/decorations/fireworks.mp4",
    //   type: "video",
    //   x: 2000,
    //   y: 300,
    //   width: 600,
    //   height: 600,
    //   layer: "foreground",
    //   loop: true,
    // },
  ];

  // Path configuration - floats will follow this curve
  const pathConfig = {
    startX: -400, // Start off-screen right
    endX: 1600, // End off-screen left
    centerY: 400, // Middle of screen vertically
    amplitude: 50, // How much the path curves up/down
    layerSwitchPoint: 0.5, // At 40% progress, floats move from behind to front
  };

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    const initPixi = async () => {
      // Create PixiJS application
      const app = new PIXI.Application();
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x87ceeb,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Limit FPS to 30 for best performance/battery life (smooth enough for parade)
      // Options: 30 (best performance), 45 (balanced), 60 (smoothest)
      app.ticker.maxFPS = 24;

      appRef.current = app;
      containerRef.current?.appendChild(app.canvas);

      // Create layer containers (bottom to top)
      const skyLayer = new PIXI.Container();
      const backgroundLayer = new PIXI.Container();
      const midgroundLayer = new PIXI.Container();
      const floatsBehindLayer = new PIXI.Container();
      const foregroundLayer = new PIXI.Container();
      const floatsFrontLayer = new PIXI.Container();

      skyLayerRef.current = skyLayer;
      backgroundLayerRef.current = backgroundLayer;
      midgroundLayerRef.current = midgroundLayer;
      floatsBehindLayerRef.current = floatsBehindLayer;
      foregroundLayerRef.current = foregroundLayer;
      floatsFrontLayerRef.current = floatsFrontLayer;

      // Add layers in order (bottom to top)
      app.stage.addChild(skyLayer);
      app.stage.addChild(backgroundLayer);
      app.stage.addChild(midgroundLayer);
      app.stage.addChild(floatsBehindLayer);
      app.stage.addChild(foregroundLayer);
      app.stage.addChild(floatsFrontLayer);

      // Calculate scale to fit background to screen (cover mode - fit to shorter axis)
      const calculateBackgroundScale = () => {
        const scaleX = app.screen.width / BACKGROUND_WIDTH;
        const scaleY = app.screen.height / BACKGROUND_HEIGHT;

        // Use the LARGER scale to ensure coverage (cover mode)
        const uniformScale = Math.max(scaleX, scaleY);

        scaleRef.current = {
          x: scaleX,
          y: scaleY,
          uniform: uniformScale,
        };

        return uniformScale;
      };

      const scaleBackgroundSprite = (sprite: PIXI.Sprite, scale: number) => {
        sprite.scale.set(scale);

        // Center the sprite if it's larger than screen
        const scaledWidth = BACKGROUND_WIDTH * scale;
        const scaledHeight = BACKGROUND_HEIGHT * scale;

        sprite.x = (app.screen.width - scaledWidth) / 2;
        sprite.y = (app.screen.height - scaledHeight) / 2;
      };

      // Load and setup background layers
      try {
        const uniformScale = calculateBackgroundScale();

        // Sky layer (fullscreen, static)
        const skyTexture = await PIXI.Assets.load("/background/sky.png");
        const skySprite = new PIXI.Sprite(skyTexture);
        scaleBackgroundSprite(skySprite, uniformScale);
        skyLayer.addChild(skySprite);

        // Background layer (parallax slow)
        const bgTexture = await PIXI.Assets.load("/background/background.png");
        const bgSprite = new PIXI.Sprite(bgTexture);
        scaleBackgroundSprite(bgSprite, uniformScale);
        backgroundLayer.addChild(bgSprite);

        // Midground layer (parallax medium)
        const mgTexture = await PIXI.Assets.load("/background/midground.png");
        const mgSprite = new PIXI.Sprite(mgTexture);
        scaleBackgroundSprite(mgSprite, uniformScale);
        midgroundLayer.addChild(mgSprite);

        // Foreground layer (parallax fast)
        const fgTexture = await PIXI.Assets.load("/background/foreground.png");
        const fgSprite = new PIXI.Sprite(fgTexture);
        scaleBackgroundSprite(fgSprite, uniformScale);
        foregroundLayer.addChild(fgSprite);

        console.log("✅ Background layers loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load background layers:", error);
      }

      // Load decorative elements (images/videos)
      const loadDecorativeElements = async () => {
        const uniformScale = scaleRef.current.uniform;
        const scaledWidth = BACKGROUND_WIDTH * uniformScale;
        const scaledHeight = BACKGROUND_HEIGHT * uniformScale;
        const offsetX = (app.screen.width - scaledWidth) / 2;
        const offsetY = (app.screen.height - scaledHeight) / 2;

        for (const element of decorativeElements) {
          try {
            // Get the correct layer container
            let targetLayer: PIXI.Container | null = null;
            switch (element.layer) {
              case "sky":
                targetLayer = skyLayer;
                break;
              case "background":
                targetLayer = backgroundLayer;
                break;
              case "midground":
                targetLayer = midgroundLayer;
                break;
              case "floatsBehind":
                targetLayer = floatsBehindLayer;
                break;
              case "foreground":
                targetLayer = foregroundLayer;
                break;
              case "floatsFront":
                targetLayer = floatsFrontLayer;
                break;
            }

            if (!targetLayer) continue;

            if (element.type === "video") {
              // Load video as texture with format fallback for transparency support
              const videoElement = document.createElement("video");
              videoElement.loop = element.loop !== false; // Default to true
              videoElement.muted = true; // Required for autoplay
              videoElement.autoplay = true;
              videoElement.playsInline = true; // Important for mobile

              // Determine which video source to use
              // WebM supports transparency on Chrome/Firefox/Edge
              // MP4 (HEVC) supports transparency on Safari
              let videoSrc = element.src;
              const hasWebMSource = element.src.endsWith(".webm");
              const hasFallback = element.srcFallback;

              // If src is WebM but browser doesn't support it well, use fallback
              if (hasWebMSource && hasFallback && !supportsWebMAlpha()) {
                videoSrc = hasFallback; // Use the already-checked fallback value
                console.log(`🔄 Using fallback video for Safari: ${videoSrc}`);
              }

              videoElement.src = videoSrc;

              // Wait for video to be ready
              await new Promise<void>((resolve, reject) => {
                videoElement.onloadeddata = () => resolve();
                videoElement.onerror = () => {
                  // If primary source fails, try fallback
                  if (hasFallback && videoSrc !== element.srcFallback) {
                    console.log(
                      `⚠️ Primary video failed, trying fallback: ${element.srcFallback}`
                    );
                    videoElement.src = element.srcFallback!;
                    videoElement.onloadeddata = () => resolve();
                    videoElement.onerror = () =>
                      reject(new Error(`Failed to load video: ${element.src}`));
                  } else {
                    reject(new Error(`Failed to load video: ${videoSrc}`));
                  }
                };
              });

              // Create video texture
              const videoTexture = PIXI.Texture.from(videoElement);
              const videoSprite = new PIXI.Sprite(videoTexture);

              // Position and scale in virtual space (3840x2180)
              const scaledX = element.x * uniformScale + offsetX;
              const scaledY = element.y * uniformScale + offsetY;
              const scaledW = element.width * uniformScale;
              const scaledH = element.height * uniformScale;

              videoSprite.x = scaledX;
              videoSprite.y = scaledY;
              videoSprite.width = scaledW;
              videoSprite.height = scaledH;

              targetLayer.addChild(videoSprite);
              decorativeSpritesRef.current.push({
                sprite: videoSprite,
                config: element,
              });

              console.log(
                `✅ Loaded video: ${videoElement.src} on ${element.layer}`
              );
            } else {
              // Load image
              const texture = await PIXI.Assets.load(element.src);
              const sprite = new PIXI.Sprite(texture);

              // Position and scale in virtual space (3840x2180)
              const scaledX = element.x * uniformScale + offsetX;
              const scaledY = element.y * uniformScale + offsetY;
              const scaledW = element.width * uniformScale;
              const scaledH = element.height * uniformScale;

              sprite.x = scaledX;
              sprite.y = scaledY;
              sprite.width = scaledW;
              sprite.height = scaledH;

              targetLayer.addChild(sprite);
              decorativeSpritesRef.current.push({ sprite, config: element });

              console.log(
                `✅ Loaded image: ${element.src} on ${element.layer}`
              );
            }
          } catch (error) {
            console.error(
              `❌ Failed to load decorative element: ${element.src}`,
              error
            );
          }
        }
      };

      // Load decorative elements
      if (decorativeElements.length > 0) {
        loadDecorativeElements();
      }

      // Animation loop
      app.ticker.add((ticker) => {
        const deltaTime = ticker.deltaTime;
        updateFloats(deltaTime);
      });

      // Handle window resize
      const handleResize = () => {
        if (!app) return;
        app.renderer.resize(window.innerWidth, window.innerHeight);

        // Recalculate scale
        const scaleX = window.innerWidth / BACKGROUND_WIDTH;
        const scaleY = window.innerHeight / BACKGROUND_HEIGHT;
        const uniformScale = Math.max(scaleX, scaleY);

        scaleRef.current = {
          x: scaleX,
          y: scaleY,
          uniform: uniformScale,
        };

        // Rescale and reposition background layers
        const scaleSprite = (sprite: PIXI.Sprite) => {
          sprite.scale.set(uniformScale);

          const scaledWidth = BACKGROUND_WIDTH * uniformScale;
          const scaledHeight = BACKGROUND_HEIGHT * uniformScale;

          sprite.x = (window.innerWidth - scaledWidth) / 2;
          sprite.y = (window.innerHeight - scaledHeight) / 2;
        };

        [skyLayer, backgroundLayer, midgroundLayer, foregroundLayer].forEach(
          (layer) => {
            if (layer.children[0]) {
              scaleSprite(layer.children[0] as PIXI.Sprite);
            }
          }
        );

        // Reposition decorative elements
        const scaledWidth = BACKGROUND_WIDTH * uniformScale;
        const scaledHeight = BACKGROUND_HEIGHT * uniformScale;
        const offsetX = (window.innerWidth - scaledWidth) / 2;
        const offsetY = (window.innerHeight - scaledHeight) / 2;

        decorativeSpritesRef.current.forEach(({ sprite, config }) => {
          const scaledX = config.x * uniformScale + offsetX;
          const scaledY = config.y * uniformScale + offsetY;
          const scaledW = config.width * uniformScale;
          const scaledH = config.height * uniformScale;

          sprite.x = scaledX;
          sprite.y = scaledY;
          sprite.width = scaledW;
          sprite.height = scaledH;
        });

        console.log("📐 Resized - new scale:", scaleRef.current);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        app.destroy(true, { children: true, texture: true });
      };
    };

    const cleanup = initPixi();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
      // Clear spawn interval timer
      if (spawnIntervalRef.current) {
        clearTimeout(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, []);

  // Update all floats
  const updateFloats = useCallback((deltaTime: number) => {
    // Early exit if no floats (optimization)
    if (floatsRef.current.size === 0) return;

    const toRemove: string[] = [];

    // Calculate time once per frame (optimization)
    const now = Date.now();
    const animTime = now * 0.001; // Convert to seconds

    floatsRef.current.forEach((floatSprite, id) => {
      // Update progress (0 to 1)
      floatSprite.progress += 0.0003 * deltaTime; // Adjust speed here

      if (floatSprite.progress >= 1.0) {
        // Float has completed the parade
        toRemove.push(id);
        return;
      }

      // Calculate position along path
      const pos = calculatePathPosition(floatSprite.progress);
      floatSprite.sprite.x = pos.x;
      floatSprite.sprite.y = pos.y;

      // Add bounce animation (scaled to screen size)
      const baseBounceAmount = 10; // Base bounce at 3840x2180
      const scaledBounce = baseBounceAmount * scaleRef.current.uniform;
      const bounceOffset =
        Math.sin(animTime * 2 + floatSprite.progress * 10) * scaledBounce;
      floatSprite.sprite.y += bounceOffset;

      // Subtle rotation/sway (reuse animTime)
      floatSprite.sprite.rotation =
        Math.sin(animTime + floatSprite.progress * 5) * 0.1;

      // Scale the float based on progress (multiply by base scale)
      let progressMultiplier;
      if (floatSprite.progress < 0.5) {
        progressMultiplier = 0.5 + floatSprite.progress; // Grows from 0.5 to 1.0
      } else {
        progressMultiplier = 1.0 + (floatSprite.progress - 0.5) * 0.5; // Grows from 1.0 to 1.25
      }
      const finalScale = floatSprite.baseScale * progressMultiplier;
      floatSprite.sprite.scale.set(finalScale);

      // Horizontal flipping based on progress
      if (floatSprite.progress < 0.36) {
        // 0-36%: Normal direction (facing right)
        floatSprite.sprite.scale.x = Math.abs(floatSprite.sprite.scale.x);
      } else if (floatSprite.progress < 0.77) {
        // 37-77%: Flipped (facing left)
        floatSprite.sprite.scale.x = -Math.abs(floatSprite.sprite.scale.x);
      } else {
        // 70-100%: Back to normal (facing right)
        floatSprite.sprite.scale.x = Math.abs(floatSprite.sprite.scale.x);
      }

      // Layer switching: move from behind to front at transition point
      if (floatSprite.progress < pathConfig.layerSwitchPoint) {
        // First half: float is behind foreground
        if (floatSprite.sprite.parent !== floatsBehindLayerRef.current) {
          // Maintain z-order: add at index 0 so newer floats stay behind
          floatsBehindLayerRef.current?.addChildAt(floatSprite.sprite, 0);
        }
      } else {
        // Second half: float is in front of foreground
        if (floatSprite.sprite.parent !== floatsFrontLayerRef.current) {
          // Maintain z-order: add at index 0 so newer floats stay behind
          floatsFrontLayerRef.current?.addChildAt(floatSprite.sprite, 0);
        }
      }
    });

    // Remove completed floats
    toRemove.forEach((id) => {
      const floatSprite = floatsRef.current.get(id);
      if (floatSprite) {
        floatSprite.sprite.destroy();
        floatsRef.current.delete(id);
        setFloatCount(floatsRef.current.size);

        // Try to spawn new float from queue
        trySpawnFromQueue();
      }
    });
  }, []);

  // Calculate position along the parade path
  //   const calculatePathPosition = (
  //     progress: number
  //   ): { x: number; y: number } => {
  //     // Horizontal movement (right to left)
  //     const x =
  //       pathConfig.startX + (pathConfig.endX - pathConfig.startX) * progress;

  //     // Vertical curve (slight wave pattern)
  //     const y =
  //       pathConfig.centerY +
  //       Math.sin(progress * Math.PI * 2) * pathConfig.amplitude;

  //     return { x, y };
  //   };
  // Paste this into calculatePathPosition() in ParadeScenePixi.tsx

  const calculatePathPosition = (
    progress: number
  ): { x: number; y: number } => {
    // Path waypoints (in original 3840x2180 coordinates)
    const waypoints = [
      { progress: 0.0, x: 24, y: 293 },
      { progress: 0.023, x: 200, y: 238 },
      { progress: 0.045, x: 351, y: 264 },
      { progress: 0.068, x: 472, y: 305 },
      { progress: 0.091, x: 656, y: 373 },
      { progress: 0.114, x: 905, y: 441 },
      { progress: 0.136, x: 1082, y: 487 },
      { progress: 0.159, x: 1274, y: 522 },
      { progress: 0.182, x: 1460, y: 545 },
      { progress: 0.205, x: 1662, y: 555 },
      { progress: 0.227, x: 2020, y: 549 },
      { progress: 0.25, x: 2290, y: 545 },
      { progress: 0.273, x: 2526, y: 543 },
      { progress: 0.295, x: 2812, y: 555 },
      { progress: 0.318, x: 3091, y: 593 },
      { progress: 0.341, x: 3280, y: 635 },
      { progress: 0.364, x: 3437, y: 720 },
      { progress: 0.386, x: 3406, y: 829 },
      { progress: 0.409, x: 3229, y: 920 },
      { progress: 0.432, x: 3046, y: 971 },
      { progress: 0.455, x: 2891, y: 1024 },
      { progress: 0.477, x: 3222, y: 1030 },
      { progress: 0.5, x: 3434, y: 1056 },
      { progress: 0.523, x: 3254, y: 979 },
      { progress: 0.545, x: 3137, y: 957 },
      { progress: 0.568, x: 2979, y: 969 },
      { progress: 0.591, x: 2844, y: 1016 },
      { progress: 0.614, x: 2481, y: 1086 },
      { progress: 0.636, x: 2205, y: 1109 },
      { progress: 0.659, x: 1896, y: 1116 },
      { progress: 0.682, x: 1580, y: 1119 },
      { progress: 0.705, x: 1257, y: 1136 },
      { progress: 0.727, x: 954, y: 1175 },
      { progress: 0.75, x: 592, y: 1267 },
      { progress: 0.773, x: 372, y: 1475 },
      { progress: 0.795, x: 606, y: 1653 },
      { progress: 0.818, x: 951, y: 1731 },
      { progress: 0.841, x: 1404, y: 1767 },
      { progress: 0.864, x: 1777, y: 1751 },
      { progress: 0.886, x: 2344, y: 1749 },
      { progress: 0.909, x: 2789, y: 1786 },
      { progress: 0.932, x: 3137, y: 1841 },
      { progress: 0.955, x: 3561, y: 1969 },
      { progress: 0.977, x: 3825, y: 2134 },
      { progress: 1.0, x: 3835, y: 2157 },
    ];

    // Find the two waypoints to interpolate between
    let start = waypoints[0];
    let end = waypoints[waypoints.length - 1];

    for (let i = 0; i < waypoints.length - 1; i++) {
      if (
        progress >= waypoints[i].progress &&
        progress <= waypoints[i + 1].progress
      ) {
        start = waypoints[i];
        end = waypoints[i + 1];
        break;
      }
    }

    // Linear interpolation between waypoints
    const segmentProgress =
      (progress - start.progress) / (end.progress - start.progress);

    // Get position in original coordinates
    const originalX = start.x + (end.x - start.x) * segmentProgress;
    const originalY = start.y + (end.y - start.y) * segmentProgress;

    // Scale to current screen size
    const scale = scaleRef.current.uniform;
    const scaledX = originalX * scale;
    const scaledY = originalY * scale;

    // Account for centering offset
    const scaledWidth = BACKGROUND_WIDTH * scale;
    const scaledHeight = BACKGROUND_HEIGHT * scale;
    const screenWidth = appRef.current?.screen.width || window.innerWidth;
    const screenHeight = appRef.current?.screen.height || window.innerHeight;
    const offsetX = (screenWidth - scaledWidth) / 2;
    const offsetY = (screenHeight - scaledHeight) / 2;

    return {
      x: scaledX + offsetX,
      y: scaledY + offsetY,
    };
  };

  // Load texture with caching
  const loadTextureWithCache = useCallback(
    async (imageUrl: string): Promise<PIXI.Texture> => {
      // Check cache first
      if (textureCacheRef.current.has(imageUrl)) {
        return textureCacheRef.current.get(imageUrl)!;
      }

      // Load new texture
      const texture = await PIXI.Assets.load(imageUrl);
      textureCacheRef.current.set(imageUrl, texture);
      return texture;
    },
    []
  );

  // Spawn a float in the scene
  const spawnFloat = useCallback(
    async (floatData: FloatData) => {
      if (floatsRef.current.has(floatData.id)) return;
      if (!floatsBehindLayerRef.current) return;

      try {
        // Load texture with caching
        const texture = await loadTextureWithCache(floatData.imageUrl);

        // Create sprite
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);

        // Calculate base scale based on screen scale
        // Base size at 3840x2180 resolution (adjust this value to change float size)
        const baseTargetWidth = 300;
        const scaledTargetWidth = baseTargetWidth * scaleRef.current.uniform;
        const baseScale = scaledTargetWidth / sprite.width;

        // Set initial scale (will be modified by progress-based animation)
        sprite.scale.set(baseScale);

        // Start position (off-screen right)
        const startPos = calculatePathPosition(0);
        sprite.x = startPos.x;
        sprite.y = startPos.y;

        // Add to behind layer initially (at index 0 so newer floats go behind older ones)
        floatsBehindLayerRef.current.addChildAt(sprite, 0);

        // Store float data
        const floatSprite: FloatSprite = {
          sprite,
          progress: 0,
          startTime: Date.now(),
          data: floatData,
          baseScale, // Store base scale for progress-based scaling
        };

        floatsRef.current.set(floatData.id, floatSprite);
        setFloatCount(floatsRef.current.size);
      } catch (error) {
        console.error("Failed to spawn float:", floatData.id, error);
      }
    },
    [loadTextureWithCache]
  );

  // Add a float to the recent pool (keeps max 50, removes oldest)
  const addToRecentPool = useCallback((floatData: QueuedFloat) => {
    // Check if already in pool
    const existingIndex = recentFloatsPoolRef.current.findIndex(
      (f) => f.id === floatData.id
    );
    if (existingIndex !== -1) {
      // Move to end (most recent)
      recentFloatsPoolRef.current.splice(existingIndex, 1);
    }

    recentFloatsPoolRef.current.push(floatData);

    // Keep only latest 50
    if (recentFloatsPoolRef.current.length > 50) {
      recentFloatsPoolRef.current.shift();
    }
  }, []);

  // Spawn a float from the recent pool (random pick)
  const spawnFromRecentPool = useCallback(() => {
    if (recentFloatsPoolRef.current.length === 0) {
      console.log("⚠️ No floats in recent pool to spawn");
      return;
    }

    // Random pick from pool
    const randomIndex = Math.floor(
      Math.random() * recentFloatsPoolRef.current.length
    );
    const poolFloat = recentFloatsPoolRef.current[randomIndex];

    // Generate unique ID for this spawn (so same float can appear multiple times)
    const spawnId = `reuse_${poolFloat.id}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Track this as the last spawned float
    lastSpawnedFloatIdRef.current = spawnId;

    spawnFloat({
      id: spawnId,
      templateId: poolFloat.template_id,
      templateName: poolFloat.template_name,
      imageUrl: poolFloat.image_url,
      timestamp: new Date().toISOString(),
      position: 0,
    });
  }, [spawnFloat]);

  // Check if enough gap from last spawned float
  const canSpawnNewFloat = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastSpawn = now - lastSpawnTimeRef.current;

    // Always require minimum time interval
    if (timeSinceLastSpawn < MIN_SPAWN_INTERVAL) {
      return false;
    }

    // Check if last spawned float has moved far enough
    if (lastSpawnedFloatIdRef.current) {
      const lastFloat = floatsRef.current.get(lastSpawnedFloatIdRef.current);
      if (lastFloat && lastFloat.progress < MIN_PROGRESS_GAP) {
        return false; // Last float hasn't moved far enough yet
      }
    }

    return true;
  }, []);

  // Try to spawn a float from the queue (with minimum interval check)
  const trySpawnFromQueue = useCallback(
    (forceSpawn: boolean = false) => {
      if (floatsRef.current.size >= maxFloatsOnScreen) return;

      // Check if we can spawn (time + progress gap)
      if (!forceSpawn && !canSpawnNewFloat()) {
        // Schedule a spawn for later if not already scheduled
        if (!spawnIntervalRef.current) {
          spawnIntervalRef.current = setTimeout(() => {
            spawnIntervalRef.current = null;
            trySpawnFromQueue(true);
          }, MIN_SPAWN_INTERVAL);
        }
        return;
      }

      // Double-check progress gap even on force spawn
      if (lastSpawnedFloatIdRef.current) {
        const lastFloat = floatsRef.current.get(lastSpawnedFloatIdRef.current);
        if (lastFloat && lastFloat.progress < MIN_PROGRESS_GAP) {
          // Reschedule - last float still too close
          if (!spawnIntervalRef.current) {
            spawnIntervalRef.current = setTimeout(() => {
              spawnIntervalRef.current = null;
              trySpawnFromQueue(true);
            }, 500); // Check again in 500ms
          }
          return;
        }
      }

      const now = Date.now();
      const queuedFloat = pendingQueueRef.current.shift();
      setQueueCount(pendingQueueRef.current.length);

      if (queuedFloat) {
        // Add to recent pool for reuse later
        addToRecentPool(queuedFloat);

        lastSpawnTimeRef.current = now; // Update last spawn time
        lastSpawnedFloatIdRef.current = queuedFloat.id; // Track this float
        spawnFloat({
          id: queuedFloat.id,
          templateId: queuedFloat.template_id,
          templateName: queuedFloat.template_name,
          imageUrl: queuedFloat.image_url,
          timestamp: queuedFloat.created_at,
          position: 0,
        });
      } else {
        // Queue is empty - spawn from recent pool (random pick)
        lastSpawnTimeRef.current = now; // Update last spawn time
        spawnFromRecentPool();
      }

      // If there are more in the queue, schedule next spawn
      if (pendingQueueRef.current.length > 0 && !spawnIntervalRef.current) {
        spawnIntervalRef.current = setTimeout(() => {
          spawnIntervalRef.current = null;
          trySpawnFromQueue(true);
        }, MIN_SPAWN_INTERVAL);
      }
    },
    [spawnFromRecentPool, spawnFloat, addToRecentPool, canSpawnNewFloat]
  );

  // Initial load: Fetch latest 50 active floats
  useEffect(() => {
    const fetchInitialFloats = async () => {
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .eq("status", "active")
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          // Populate the recent pool with fetched data
          data.forEach((submission) => {
            recentFloatsPoolRef.current.push({
              id: submission.id,
              template_id: submission.template_id,
              template_name: submission.template_name,
              image_url: submission.image_url,
              created_at: submission.created_at,
            });
          });

          // Spawn initial floats with staggered starts
          data.reverse().forEach((submission, index) => {
            setTimeout(() => {
              spawnFloat({
                id: submission.id,
                templateId: submission.template_id,
                templateName: submission.template_name,
                imageUrl: submission.image_url,
                timestamp: submission.created_at,
                position: index / Math.max(data.length, 1),
              });
            }, index * 1500); // 1.5 second between spawns
          });
        } else {
          // No data available - scene will be empty until submissions come in
          console.log(
            "⚠️ No active submissions found. Waiting for new floats..."
          );
        }
      } catch (error) {
        console.error("Failed to fetch initial floats:", error);
        // Scene will be empty - waiting for real submissions
      }
    };

    // Wait a bit for PixiJS to initialize
    const timer = setTimeout(fetchInitialFloats, 500);
    return () => clearTimeout(timer);
  }, [spawnFloat]);

  // Supabase Real-time subscription
  useEffect(() => {
    console.log("🔔 Setting up Supabase real-time subscription...");

    const channel = supabase
      .channel("submissions_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: "status=eq.active",
        },
        (payload) => {
          console.log("🆕 New submission inserted:", payload.new);
          const newSubmission = payload.new as any;

          if (newSubmission.image_url) {
            const newFloat: QueuedFloat = {
              id: newSubmission.id,
              template_id: newSubmission.template_id,
              template_name: newSubmission.template_name,
              image_url: newSubmission.image_url,
              created_at: newSubmission.created_at,
            };

            // Add to pending queue (priority)
            pendingQueueRef.current.push(newFloat);
            setQueueCount(pendingQueueRef.current.length);

            // Also add to recent pool for later reuse
            addToRecentPool(newFloat);

            if (floatsRef.current.size < maxFloatsOnScreen) {
              trySpawnFromQueue();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
        },
        (payload) => {
          console.log("🔄 Submission updated:", payload.new);
          const updatedSubmission = payload.new as any;

          if (
            updatedSubmission.status === "removed" ||
            !updatedSubmission.image_url
          ) {
            const floatSprite = floatsRef.current.get(updatedSubmission.id);
            if (floatSprite) {
              floatSprite.sprite.destroy();
              floatsRef.current.delete(updatedSubmission.id);
              setFloatCount(floatsRef.current.size);
            }

            pendingQueueRef.current = pendingQueueRef.current.filter(
              (f) => f.id !== updatedSubmission.id
            );
            setQueueCount(pendingQueueRef.current.length);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("🔕 Unsubscribing from real-time...");
      supabase.removeChannel(channel);
    };
  }, [trySpawnFromQueue, addToRecentPool]);

  return (
    <div className="parade-scene-container">
      <div ref={containerRef} className="parade-canvas" />
      {/* <div className="parade-stats">
        <div className="stat-item">
          <span className="stat-label">Active Floats:</span>
          <span className="stat-value">{floatCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Queue:</span>
          <span className="stat-value">{queueCount}</span>
        </div>
      </div> */}
    </div>
  );
}
