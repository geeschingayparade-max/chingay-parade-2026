"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./ParadeScene.css";

interface FloatData {
  id: string;
  templateId: string;
  templateName: string;
  imageUrl: string;
  timestamp: string;
  position: number; // Position along the parade path (0-1)
}

export default function ParadeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const floatsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const [floatCount, setFloatCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
    sceneRef.current = scene;

    // Camera setup - positioned to see floats better
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    // Ground (parade street)
    const groundGeometry = new THREE.PlaneGeometry(20, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });
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

        // Rotate slowly (but keep facing roughly toward camera)
        float.rotation.y = Math.PI + Math.sin(Date.now() * 0.001) * 0.3;

        floatIndex++;

        // Despawn if too far (past camera)
        if (float.position.z > 40) {
          scene.remove(float);
          floatsRef.current.delete(id);
          setFloatCount(floatsRef.current.size);
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

    setIsLoading(false);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Fetch and spawn floats
  useEffect(() => {
    const fetchFloats = async () => {
      try {
        const response = await fetch("/api/submissions");
        const data = await response.json();

        if (data.submissions && Array.isArray(data.submissions)) {
          // Filter out removed floats and those without images
          const activeFloats = data.submissions.filter(
            (sub: any) => sub.imageUrl && sub.imageUrl !== null
          );

          // Spawn floats for latest 50 active submissions
          const latestFloats = activeFloats.slice(-50);

          latestFloats.forEach((submission: any, index: number) => {
            spawnFloat({
              id: submission.id,
              templateId: submission.templateId,
              templateName: submission.templateName,
              imageUrl: submission.imageUrl,
              timestamp: submission.timestamp,
              position: index / Math.max(latestFloats.length, 1),
            });
          });
        }
      } catch (error) {
        console.error("Failed to fetch floats:", error);
      }
    };

    // Initial fetch after scene is ready
    const timeout = setTimeout(fetchFloats, 1000);

    // Poll for new floats every 5 seconds
    const interval = setInterval(fetchFloats, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Spawn a float in the scene
  const spawnFloat = (floatData: FloatData) => {
    if (!sceneRef.current || floatsRef.current.has(floatData.id)) return;

    const scene = sceneRef.current;

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      floatData.imageUrl,
      (texture) => {
        // Create float mesh (plane with drawing texture)
        const geometry = new THREE.PlaneGeometry(6, 6);

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
        });

        const float = new THREE.Mesh(geometry, material);

        // Position along parade path
        const zPosition = -30 + floatData.position * 60;
        float.position.set(0, 3, zPosition);

        // Rotate to face camera
        float.rotation.y = Math.PI;

        scene.add(float);
        floatsRef.current.set(floatData.id, float);
        setFloatCount(floatsRef.current.size);
      },
      undefined,
      (error) => {
        console.error("Failed to load float texture:", floatData.id, error);
      }
    );
  };

  return (
    <div className="parade-scene-container">
      <div ref={containerRef} className="parade-canvas" />

      {/* UI Overlay */}
      <div className="parade-ui">
        <div className="parade-info">
          <h1>🎊 Chingay Parade</h1>
          <p className="float-count">
            <span className="count">{floatCount}</span> floats in parade
          </p>
        </div>

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading parade...</p>
          </div>
        )}

        <div className="controls-hint">
          <p>🎨 Floats move forward automatically</p>
          <p>✨ New submissions appear in real-time</p>
        </div>
      </div>
    </div>
  );
}
