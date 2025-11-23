"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
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

export default function ParadeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const floatsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const pendingQueueRef = useRef<QueuedFloat[]>([]); // Queue for new submissions
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map()); // Texture cache for bandwidth optimization
  const [floatCount, setFloatCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const maxFloatsOnScreen = 50; // Maximum floats visible at once
  const nextSpawnZRef = useRef(-30); // Track Z position for next spawn

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 3, -10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalk markers
    for (let i = -100; i < 100; i += 5) {
      const markerGeometry = new THREE.BoxGeometry(0.5, 0.1, 2);
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(-10, 0.05, i);
      scene.add(marker);

      const marker2 = marker.clone();
      marker2.position.set(10, 0.05, i);
      scene.add(marker2);
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Animate floats
      let floatIndex = 0;
      floatsRef.current.forEach((float, id) => {
        // Move float forward along parade path
        float.position.z += 0.05;

        // Bounce animation
        float.position.y =
          Math.sin(Date.now() * 0.002 + floatIndex * 0.5) * 0.5 + 3;

        // Rotate slowly
        float.rotation.y = Math.PI + Math.sin(Date.now() * 0.001) * 0.3;

        floatIndex++;

        // Despawn if too far (past camera)
        if (float.position.z > 40) {
          scene.remove(float);
          floatsRef.current.delete(id);
          setFloatCount(floatsRef.current.size);

          // Try to spawn a new float from queue
          trySpawnFromQueue();
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Dummy float templates (cycle through these)
  const dummyTemplates = [
    { id: "dragon", name: "Dragon", image: "/templates/dragon.svg" },
    { id: "lion", name: "Lion", image: "/templates/lion.svg" },
    { id: "phoenix", name: "Phoenix", image: "/templates/phoenix.svg" },
    { id: "peacock", name: "Elephant", image: "/templates/elephant.svg" },
    { id: "peacock", name: "Peacock", image: "/templates/peacock.svg" },
  ];
  const dummyIndexRef = useRef(0);

  // Spawn a dummy float (when queue is empty)
  const spawnDummyFloat = useCallback(() => {
    const template =
      dummyTemplates[dummyIndexRef.current % dummyTemplates.length];
    dummyIndexRef.current++;

    const dummyId = `dummy_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    console.log("🎭 Spawning dummy float:", template.name);

    spawnFloat({
      id: dummyId,
      templateId: template.id,
      templateName: template.name,
      imageUrl: template.image,
      timestamp: new Date().toISOString(),
      position: 0,
    });
  }, []);

  // Try to spawn a float from the queue
  const trySpawnFromQueue = useCallback(() => {
    if (!sceneRef.current) return;
    if (floatsRef.current.size >= maxFloatsOnScreen) return;

    const queuedFloat = pendingQueueRef.current.shift();
    setQueueCount(pendingQueueRef.current.length);

    if (queuedFloat) {
      // Spawn real float from queue
      console.log("✨ Spawning real float from queue:", queuedFloat.id);
      spawnFloat({
        id: queuedFloat.id,
        templateId: queuedFloat.template_id,
        templateName: queuedFloat.template_name,
        imageUrl: queuedFloat.image_url,
        timestamp: queuedFloat.created_at,
        position: 0, // Spawn at start position
      });
    } else {
      // Spawn dummy float if queue is empty
      spawnDummyFloat();
    }
  }, [spawnDummyFloat]);

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
          // Spawn initial floats with staggered positions
          data.reverse().forEach((submission, index) => {
            const zPosition = -30 + index * 8; // 8 units apart
            spawnFloat({
              id: submission.id,
              templateId: submission.template_id,
              templateName: submission.template_name,
              imageUrl: submission.image_url,
              timestamp: submission.created_at,
              position: index / Math.max(data.length, 1),
            });
            nextSpawnZRef.current = zPosition + 8; // Update next spawn position
          });
        }
      } catch (error) {
        console.error("Failed to fetch initial floats:", error);
      }
    };

    fetchInitialFloats();
  }, []);

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

          // Only add if it has an image
          if (newSubmission.image_url) {
            // Add to pending queue
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

            // Try to spawn immediately if there's room
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

          // If status changed to removed or image_url is null, remove from scene and queue
          if (
            updatedSubmission.status === "removed" ||
            !updatedSubmission.image_url
          ) {
            console.log("🗑️ Removing float from scene:", updatedSubmission.id);

            // Remove from active floats
            const float = floatsRef.current.get(updatedSubmission.id);
            if (float && sceneRef.current) {
              sceneRef.current.remove(float);
              floatsRef.current.delete(updatedSubmission.id);
              setFloatCount(floatsRef.current.size);

              //   // Try to spawn replacement, disabled for now
              //   trySpawnFromQueue();
            }

            // Remove from queue if it's there
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
  }, []);

  // Load texture with caching (bandwidth optimization)
  const loadTextureWithCache = useCallback(
    (imageUrl: string): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        // Check cache first
        if (textureCacheRef.current.has(imageUrl)) {
          const cachedTexture = textureCacheRef.current.get(imageUrl)!;
          resolve(cachedTexture.clone()); // Clone to allow independent transformations
          return;
        }

        // Load new texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          imageUrl,
          (texture) => {
            // Store in cache
            textureCacheRef.current.set(imageUrl, texture);
            resolve(texture);
          },
          undefined,
          reject
        );
      });
    },
    []
  );

  // Spawn a float in the scene
  const spawnFloat = useCallback(
    (floatData: FloatData) => {
      if (!sceneRef.current || floatsRef.current.has(floatData.id)) return;

      const scene = sceneRef.current;

      // Load texture with caching
      loadTextureWithCache(floatData.imageUrl)
        .then((texture) => {
          // Create float mesh (plane with drawing texture)
          const geometry = new THREE.PlaneGeometry(6, 6);

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
          });

          const float = new THREE.Mesh(geometry, material);

          // Position along parade path
          const zPosition = nextSpawnZRef.current;
          float.position.set(0, 3, zPosition);

          // Update next spawn position (further back)
          nextSpawnZRef.current = Math.min(zPosition - 8, -30);

          // Rotate to face camera
          float.rotation.y = Math.PI;

          scene.add(float);
          floatsRef.current.set(floatData.id, float);
          setFloatCount(floatsRef.current.size);
        })
        .catch((error) => {
          console.error("Failed to load float texture:", floatData.id, error);
        });
    },
    [loadTextureWithCache]
  );

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
