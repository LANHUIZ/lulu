import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ParticleSystem, GiftBoxes, GemOrnaments, TetrahedronSpiral } from './ParticleSystem';
import { PhotoCards } from './PhotoCards';
import { TreeStar } from './TreeStar';
import { SnowEffect } from './SnowEffect';
import { TreeState } from '@/types/christmas';

interface SceneContentProps {
  state: TreeState;
  photos: string[];
  focusedPhotoIndex: number | null;
  orbitRotation: { x: number; y: number };
  handPosition: { x: number; y: number } | null;
  onStarFocusChange?: (focused: boolean) => void;
  onPhotosChange?: (photos: string[]) => void; // 添加照片变更回调
}

// 预设照片的Base64数据（小型占位图）
const PRESET_PHOTOS_BASE64 = [
  // 圣诞家庭照
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyRjk0NEEiLz48cGF0aCBkPSJNODAgMTIwQzEwMCA4MCAxNDAgODAgMTYwIDEyMCIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjgiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI3MCIgcj0iMjAiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjEwMCIgcj0iMTUiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSIxNDAiIGN5PSIxMDAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+PHBhdGggZD0iTTY1IDEzMEw1MCAxNTBNMTM1IDEzMEwxNTAgMTUwIiBzdHJva2U9IiNGRkYiIHN0cm9rZS13aWR0aD0iNiIvPjwvc3ZnPg==',
  
  // 可爱宠物
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0REJCOTMiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iNDAiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjYwIiByPSI4IiBmaWxsPSIjMzMzIi8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iNjAiIHI9IjgiIGZpbGw9IiMzMzMiLz48cGF0aCBkPSJNODUgMTEwTDEwMCAxMjBNMTE1IDExMEwxMDAgMTIwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNSIvPjxwYXRoIGQ9Ik04MCAxNDBMMTIwIDE0MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjgiLz48L3N2Zz4=',
  
  // 朋友聚会
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRjY2MzMiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjgwIiByPSIyMCIgZmlsbD0iI0ZGRiIvPjxjaXJjbGUgY3g9IjEzMCIgY3k9IjgwIiByPSIyMCIgZmlsbD0iI0ZGRiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEyMCIgcj0iMjUiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNNTAgNjBMMjAgNDBNMTUwIDYwTDE4MCA0MCIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNNjAgMTYwTDE0MCAxNjAiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSI4Ii8+PHBhdGggZD0iTTEwMCAxNDBMMTAwIDEwMCIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjYiLz48L3N2Zz4=',
  
  // 冬日雪景
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM4Q0JGRkYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI2MCIgcj0iMjAiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjkwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjkwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPjxyZWN0IHg9IjQwIiB5PSIxMjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiNGRkYiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCA0MEw1MCAyME0xNzAgNDBMMTUwIDIwTTgwIDMwTDYwIDEwTTEyMCAzMEwxNDAgMTAiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+',
];

function CameraController({ 
  state, 
  orbitRotation,
  handPosition,
  onStarFocused,
}: { 
  state: TreeState;
  orbitRotation: { x: number; y: number };
  handPosition: { x: number; y: number } | null;
  onStarFocused?: (focused: boolean) => void;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const positionRef = useRef(new THREE.Vector3(0, 2, 12));
  const ribbonTimeRef = useRef(0);
  const prevStateRef = useRef<TreeState>(state);
  const transitionDelayRef = useRef(0);
  const isAtStarRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Physics-based smooth rotation
  const velocityRef = useRef(0);
  const targetVelocityRef = useRef(0.15); // Target rotation speed

  // Find nearest ribbon position based on camera position
  const findNearestRibbonT = (cameraPos: THREE.Vector3): number => {
    const height = 7;
    const maxRadius = 3.0;
    let nearestT = 0;
    let minDistance = Infinity;
    
    // Sample points along the ribbon to find nearest
    for (let t = 0; t <= 1; t += 0.02) {
      const ribbonY = t * height - height / 2 + 0.3;
      const layerRadius = maxRadius * (1 - t * 0.88) + 0.15;
      const angle = t * Math.PI * 6;
      
      const ribbonX = Math.cos(angle) * layerRadius;
      const ribbonZ = Math.sin(angle) * layerRadius;
      
      const distance = Math.sqrt(
        Math.pow(cameraPos.x - ribbonX, 2) +
        Math.pow(cameraPos.y - ribbonY, 2) +
        Math.pow(cameraPos.z - ribbonZ, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestT = t;
      }
    }
    
    return nearestT;
  };

  useFrame((_, delta) => {
    // Detect state change to tree (pinch gesture completed)
    if (state === 'tree' && prevStateRef.current !== 'tree') {
      // Find nearest ribbon position based on current camera location
      const nearestT = findNearestRibbonT(camera.position);
      
      // Wait for tree to assemble before starting ribbon follow
      transitionDelayRef.current = 2.0; // 2 second delay for assembly
      ribbonTimeRef.current = nearestT; // Start from nearest position
      isAtStarRef.current = false;
      velocityRef.current = 0.05; // Start with small velocity for smooth transition
      hasInitializedRef.current = true;
      onStarFocused?.(false);
    }
    
    // Reset when leaving tree state
    if (state !== 'tree' && prevStateRef.current === 'tree') {
      isAtStarRef.current = false;
      onStarFocused?.(false);
    }
    prevStateRef.current = state;

    // Handle transition delay
    if (transitionDelayRef.current > 0) {
      transitionDelayRef.current -= delta;
    }

    // Base camera distance
    const baseDistance = state === 'tree' ? 12 : 18;
    
    let targetX = 0;
    let targetY = 2;
    let targetZ = baseDistance;
    let lookAtY = 0;
    
    if (state === 'tree' && transitionDelayRef.current <= 0) {
      if (!isAtStarRef.current) {
        // Physics-based smooth rotation with easing
        const t = ribbonTimeRef.current;
        
        // Dynamic target velocity: fast in middle, slow at start and end
        const easeFactor = Math.sin(t * Math.PI); // 0 at start/end, 1 in middle
        const baseVelocity = 0.12;
        const maxVelocity = 0.22;
        targetVelocityRef.current = baseVelocity + easeFactor * (maxVelocity - baseVelocity);
        
        // Smooth acceleration/deceleration (spring-like physics)
        const acceleration = 2.5; // How fast velocity changes
        velocityRef.current += (targetVelocityRef.current - velocityRef.current) * acceleration * delta;
        
        // Apply velocity with smooth damping
        ribbonTimeRef.current += velocityRef.current * delta;
        
        // Check if reached the top (t >= 1)
        if (ribbonTimeRef.current >= 1) {
          isAtStarRef.current = true;
          onStarFocused?.(true);
          ribbonTimeRef.current = 1;
        }
        const tClamped = Math.min(ribbonTimeRef.current, 1);
        
        // Match ribbon spiral parameters from TetrahedronSpiral
        const height = 7;
        const maxRadius = 3.0;
        const ribbonY = tClamped * height - height / 2 + 0.3;
        const layerRadius = maxRadius * (1 - tClamped * 0.88) + 0.15;
        const angle = tClamped * Math.PI * 6; // 3 full spirals
        
        // Position camera outside the ribbon, looking at the ribbon point
        const cameraDistance = 5 + layerRadius * 1.5;
        const cameraAngle = angle + Math.PI * 0.3; // Slightly ahead of ribbon
        
        targetX = Math.cos(cameraAngle) * cameraDistance;
        targetY = ribbonY + 1.5; // Slightly above the ribbon point
        targetZ = Math.sin(cameraAngle) * cameraDistance;
        lookAtY = ribbonY;
      } else {
        // Focused on star - stay looking at the tree top
        const starY = 4.4;
        targetX = 0;
        targetY = starY + 1;
        targetZ = 6;
        lookAtY = starY;
      }
    } else if (handPosition && state === 'galaxy') {
      targetX = (handPosition.x - 0.5) * 20;
      targetY = (0.5 - handPosition.y) * 10 + 2;
      targetZ = Math.cos(orbitRotation.y) * baseDistance;
    } else {
      targetX = Math.sin(orbitRotation.y) * baseDistance;
      targetY = Math.sin(orbitRotation.x) * 5 + 2;
      targetZ = Math.cos(orbitRotation.y) * baseDistance;
    }
    
    // Frame-rate independent smooth camera movement
    const smoothFactor = 1 - Math.exp(-3 * delta);
    
    positionRef.current.x += (targetX - positionRef.current.x) * smoothFactor;
    positionRef.current.y += (targetY - positionRef.current.y) * smoothFactor;
    positionRef.current.z += (targetZ - positionRef.current.z) * smoothFactor;
    
    // Smooth look-at target
    targetRef.current.y += (lookAtY - targetRef.current.y) * smoothFactor;
    
    camera.position.copy(positionRef.current);
    camera.lookAt(targetRef.current);
  });

  return null;
}

function SceneContent({ 
  state, 
  photos, 
  focusedPhotoIndex,
  orbitRotation,
  handPosition,
  onStarFocusChange,
  onPhotosChange, // 新增的回调函数
}: SceneContentProps) {
  const [isStarFocused, setIsStarFocused] = useState(false);

  const handleStarFocused = (focused: boolean) => {
    setIsStarFocused(focused);
    onStarFocusChange?.(focused);
  };

  return (
    <>
      <CameraController 
        state={state} 
        orbitRotation={orbitRotation}
        handPosition={handPosition}
        onStarFocused={handleStarFocused}
      />
      
      {/* 简化灯光配置 */}
      <ambientLight intensity={0.2} />
      
      {/* 主聚光灯 */}
      <spotLight 
        position={[0, 12, 5]} 
        angle={0.6}
        penumbra={0.8}
        intensity={2.5}
        color="#fff8e8"
      />
      
      {/* 彩色点光源 */}
      <pointLight position={[0, -2, 0]} intensity={1.2} color="#ff6633" distance={12} />
      
      {/* 背景星星 */}
      <Stars 
        radius={100} 
        depth={50} 
        count={2000} 
        factor={4} 
        saturation={0.5} 
        fade 
        speed={0.3}
      />
      
      {/* 主要粒子系统 */}
      <ParticleSystem state={state} particleCount={4000} />
      
      {/* 圣诞礼物盒 */}
      <GiftBoxes state={state} />
      
      {/* 宝石装饰品 */}
      <GemOrnaments state={state} />
      
      {/* 四面体螺旋 */}
      <TetrahedronSpiral state={state} />
      
      {/* 照片卡片 - 显示预设照片 */}
      <PhotoCards 
        state={state} 
        photos={photos}
        focusedIndex={focusedPhotoIndex}
      />
      
      {/* 树顶星星 */}
      <TreeStar state={state} isFocused={isStarFocused} />
      
      {/* 雪效果 */}
      <SnowEffect active={isStarFocused} />
      
      {/* 后期处理效果 */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.85}
          luminanceSmoothing={0.2}
          intensity={1.5}
          mipmapBlur
        />
        <Vignette
          offset={0.2}
          darkness={0.6}
        />
      </EffectComposer>
    </>
  );
}

interface ChristmasSceneProps {
  state: TreeState;
  photos: string[];
  focusedPhotoIndex: number | null;
  orbitRotation: { x: number; y: number };
  handPosition: { x: number; y: number } | null;
  onReady?: () => void;
  onStarFocusChange?: (focused: boolean) => void;
  onPhotosChange?: (photos: string[]) => void; // 新增：照片变更回调
}

export function ChristmasScene({ 
  state, 
  photos, 
  focusedPhotoIndex,
  orbitRotation,
  handPosition,
  onReady,
  onStarFocusChange,
  onPhotosChange, // 接收照片变更回调
}: ChristmasSceneProps) {
  // 场景就绪回调
  useEffect(() => {
    const timer = setTimeout(() => {
      onReady?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <Canvas
      camera={{ position: [0, 2, 12], fov: 60 }}
      gl={{ 
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1.5]}
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a0a28 50%, #0a1628 100%)' }}
    >
      <color attach="background" args={['#0a1628']} />
      <fog attach="fog" args={['#0a1628', 15, 35]} />
      
      <SceneContent 
        state={state}
        photos={photos}
        focusedPhotoIndex={focusedPhotoIndex}
        orbitRotation={orbitRotation}
        handPosition={handPosition}
        onStarFocusChange={onStarFocusChange}
        onPhotosChange={onPhotosChange} // 传递回调给SceneContent
      />
    </Canvas>
  );
}
