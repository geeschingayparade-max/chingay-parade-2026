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
  const textureCacheRef = useRef<Map<string, PIXI.Texture>>(new Map());

  const [floatCount, setFloatCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const maxFloatsOnScreen = 50;

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

      // Load and setup background layers
      try {
        // Sky layer (fullscreen, static)
        const skyTexture = await PIXI.Assets.load("/background/sky.png");
        const skySprite = new PIXI.Sprite(skyTexture);
        skySprite.width = app.screen.width;
        skySprite.height = app.screen.height;
        skyLayer.addChild(skySprite);

        // Background layer (parallax slow)
        const bgTexture = await PIXI.Assets.load("/background/background.png");
        const bgSprite = new PIXI.Sprite(bgTexture);
        bgSprite.width = app.screen.width;
        bgSprite.height = app.screen.height;
        backgroundLayer.addChild(bgSprite);

        // Midground layer (parallax medium)
        const mgTexture = await PIXI.Assets.load("/background/midground.png");
        const mgSprite = new PIXI.Sprite(mgTexture);
        mgSprite.width = app.screen.width;
        mgSprite.height = app.screen.height;
        midgroundLayer.addChild(mgSprite);

        // Foreground layer (parallax fast)
        const fgTexture = await PIXI.Assets.load("/background/foreground.png");
        const fgSprite = new PIXI.Sprite(fgTexture);
        fgSprite.width = app.screen.width;
        fgSprite.height = app.screen.height;
        foregroundLayer.addChild(fgSprite);

        console.log("✅ Background layers loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load background layers:", error);
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

        // Resize background layers
        [skyLayer, backgroundLayer, midgroundLayer, foregroundLayer].forEach(
          (layer) => {
            if (layer.children[0]) {
              layer.children[0].width = window.innerWidth;
              layer.children[0].height = window.innerHeight;
            }
          }
        );
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
    };
  }, []);

  // Update all floats
  const updateFloats = useCallback((deltaTime: number) => {
    const toRemove: string[] = [];

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

      // Add bounce animation
      const bounceOffset =
        Math.sin(Date.now() * 0.002 + floatSprite.progress * 10) * 20;
      floatSprite.sprite.y += bounceOffset;

      // Subtle rotation/sway
      floatSprite.sprite.rotation =
        Math.sin(Date.now() * 0.001 + floatSprite.progress * 5) * 0.1;

      // Scale the float based on progress
      if (floatSprite.progress < 0.5) {
        const scale = 0.5 + floatSprite.progress; // Grows from 0.5 to 1.0
        floatSprite.sprite.scale.set(scale);
      } else {
        const scale = 1.0 + (floatSprite.progress - 0.5) * 0.5; // Grows from 1.0 to 1.25
        floatSprite.sprite.scale.set(scale);
      }

      // Horizontal flipping based on progress
      if (floatSprite.progress < 0.4) {
        // 0-40%: Normal direction (facing right)
        floatSprite.sprite.scale.x = Math.abs(floatSprite.sprite.scale.x);
      } else if (floatSprite.progress < 0.7) {
        // 40-70%: Flipped (facing left)
        floatSprite.sprite.scale.x = -Math.abs(floatSprite.sprite.scale.x);
      } else {
        // 70-100%: Back to normal (facing right)
        floatSprite.sprite.scale.x = Math.abs(floatSprite.sprite.scale.x);
      }

      // Layer switching: move from behind to front at transition point
      if (floatSprite.progress < pathConfig.layerSwitchPoint) {
        // First half: float is behind foreground
        if (floatSprite.sprite.parent !== floatsBehindLayerRef.current) {
          floatsBehindLayerRef.current?.addChild(floatSprite.sprite);
        }
      } else {
        // Second half: float is in front of foreground
        if (floatSprite.sprite.parent !== floatsFrontLayerRef.current) {
          floatsFrontLayerRef.current?.addChild(floatSprite.sprite);
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
    // Path waypoints (generated by PathEditor)
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
    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress,
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

        // Scale to reasonable size (adjust as needed)
        const targetWidth = 50;
        const scale = targetWidth / sprite.width;
        sprite.scale.set(scale);

        // Start position (off-screen right)
        const startPos = calculatePathPosition(0);
        sprite.x = startPos.x;
        sprite.y = startPos.y;

        // Add to behind layer initially
        floatsBehindLayerRef.current.addChild(sprite);

        // Store float data
        const floatSprite: FloatSprite = {
          sprite,
          progress: 0,
          startTime: Date.now(),
          data: floatData,
        };

        floatsRef.current.set(floatData.id, floatSprite);
        setFloatCount(floatsRef.current.size);

        console.log("✨ Spawned float:", floatData.templateName);
      } catch (error) {
        console.error("Failed to spawn float:", floatData.id, error);
      }
    },
    [loadTextureWithCache]
  );

  // Dummy float templates
  const dummyTemplates = [
    {
      id: "chinese-opera",
      name: "Chinese Opera",
      image: "/templates/chinese-opera.png",
    },
    { id: "lion", name: "Lion", image: "/templates/lion.png" },
    {
      id: "fish-fruits",
      name: "Fish and Fruits",
      image: "/templates/fish-fruits.png",
    },
    {
      id: "horse-carriage",
      name: "Horse Carriage",
      image: "/templates/horse-carriage.png",
    },
    { id: "floral", name: "Floral", image: "/templates/floral.png" },
  ];
  const dummyIndexRef = useRef(0);

  // Spawn a dummy float
  const spawnDummyFloat = useCallback(() => {
    const template =
      dummyTemplates[dummyIndexRef.current % dummyTemplates.length];
    dummyIndexRef.current++;

    const dummyId = `dummy_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    spawnFloat({
      id: dummyId,
      templateId: template.id,
      templateName: template.name,
      imageUrl: template.image,
      timestamp: new Date().toISOString(),
      position: 0,
    });
  }, [spawnFloat]);

  // Try to spawn a float from the queue
  const trySpawnFromQueue = useCallback(() => {
    if (floatsRef.current.size >= maxFloatsOnScreen) return;

    const queuedFloat = pendingQueueRef.current.shift();
    setQueueCount(pendingQueueRef.current.length);

    if (queuedFloat) {
      console.log("✨ Spawning real float from queue:", queuedFloat.id);
      spawnFloat({
        id: queuedFloat.id,
        templateId: queuedFloat.template_id,
        templateName: queuedFloat.template_name,
        imageUrl: queuedFloat.image_url,
        timestamp: queuedFloat.created_at,
        position: 0,
      });
    } else {
      // Spawn dummy float if queue is empty
      spawnDummyFloat();
    }
  }, [spawnDummyFloat, spawnFloat]);

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
            }, index * 2500); // 2 second between spawns
          });
        } else {
          // No data, spawn some dummy floats
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              spawnDummyFloat();
            }, i * 2500);
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial floats:", error);
        // Spawn dummy floats on error
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            spawnDummyFloat();
          }, i * 2000);
        }
      }
    };

    // Wait a bit for PixiJS to initialize
    const timer = setTimeout(fetchInitialFloats, 500);
    return () => clearTimeout(timer);
  }, [spawnFloat, spawnDummyFloat]);

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
            pendingQueueRef.current.push({
              id: newSubmission.id,
              template_id: newSubmission.template_id,
              template_name: newSubmission.template_name,
              image_url: newSubmission.image_url,
              created_at: newSubmission.created_at,
            });
            setQueueCount(pendingQueueRef.current.length);

            console.log(
              "📥 Added to queue. Queue size:",
              pendingQueueRef.current.length
            );

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
            console.log("🗑️ Removing float from scene:", updatedSubmission.id);

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
  }, [trySpawnFromQueue]);

  return (
    <div className="parade-scene-container">
      <div ref={containerRef} className="parade-canvas" />
      <div className="parade-stats">
        <div className="stat-item">
          <span className="stat-label">Active Floats:</span>
          <span className="stat-value">{floatCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Queue:</span>
          <span className="stat-value">{queueCount}</span>
        </div>
      </div>
    </div>
  );
}
