import { useState, useCallback, useEffect, lazy, Suspense, useRef } from 'react';
import { GestureIndicator } from '@/components/christmas/GestureIndicator';
import { AudioControl } from '@/components/christmas/AudioControl';
import { PhotoUpload } from '@/components/christmas/PhotoUpload';
import { InstructionsOverlay } from '@/components/christmas/InstructionsOverlay';
import { CameraDebug } from '@/components/christmas/CameraDebug';
import { LoadingScreen } from '@/components/christmas/LoadingScreen';
import { CustomTextOverlay } from '@/components/christmas/CustomTextOverlay';
import { useHandGesture } from '@/hooks/useHandGesture';
import { useMouseFallback } from '@/hooks/useMouseFallback';
import { useChristmasAudio } from '@/hooks/useChristmasAudio';
import { TreeState, GestureType } from '@/types/christmas';
import { Github } from 'lucide-react';

// Lazy load heavy 3D scene
const ChristmasScene = lazy(() => import('@/components/christmas/Scene').then(m => ({ default: m.ChristmasScene })));

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

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [treeState, setTreeState] = useState<TreeState>('tree');
  const [photos, setPhotos] = useState<string[]>([]);
  const [focusedPhotoIndex, setFocusedPhotoIndex] = useState<number | null>(null);
  const [orbitRotation, setOrbitRotation] = useState({ x: 0, y: 0 });
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'requesting'>('prompt');
  const [showInstructions, setShowInstructions] = useState(true);
  const [customText, setCustomText] = useState('Merry Christmas');
  const [isStarFocused, setIsStarFocused] = useState(false);
  const [presetPhotosLoaded, setPresetPhotosLoaded] = useState(false);
  
  // Use refs for values accessed in callbacks to prevent re-renders
  const treeStateRef = useRef(treeState);
  const photosRef = useRef(photos);
  treeStateRef.current = treeState;
  photosRef.current = photos;

  // 在组件加载时检查是否需要加载预设照片
  useEffect(() => {
    const loadPresetPhotosOnStart = () => {
      // 检查本地存储，避免重复加载
      const hasPresetLoaded = localStorage.getItem('preset_photos_loaded');
      const hasUserPhotos = photos.length > 0;
      
      // 如果没有用户照片且预设未加载，则加载预设照片
      if (!hasPresetLoaded && !hasUserPhotos) {
        console.log('正在初始化加载预设照片...');
        
        // 延迟加载，确保其他组件已初始化
        setTimeout(() => {
          // 使用预设的Base64图片（前4张）
          const initialPresetPhotos = PRESET_PHOTOS_BASE64.slice(0, 4);
          
          // 更新照片状态
          setPhotos(initialPresetPhotos);
          
          // 标记预设照片已加载
          localStorage.setItem('preset_photos_loaded', 'true');
          setPresetPhotosLoaded(true);
          
          console.log('预设照片已加载到圣诞树');
        }, 2000);
      } else if (hasPresetLoaded) {
        setPresetPhotosLoaded(true);
      }
    };
    
    // 只在组件加载时执行一次
    loadPresetPhotosOnStart();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // Simulate loading progress - slower interval
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Mark as loaded when scene is ready
  const handleSceneReady = useCallback(() => {
    setLoadingProgress(100);
  }, []);

  // 处理照片变更的函数
  const handlePhotosChange = useCallback((newPhotos: string[]) => {
    setPhotos(newPhotos);
    
    // 如果用户上传了照片，标记预设照片已加载（防止重复加载）
    if (newPhotos.length > 0 && !presetPhotosLoaded) {
      localStorage.setItem('preset_photos_loaded', 'true');
      setPresetPhotosLoaded(true);
    }
  }, [presetPhotosLoaded]);

  // 清空照片的函数（重置预设加载状态）
  const handleClearPhotos = useCallback(() => {
    setPhotos([]);
    // 清除预设加载标记，以便下次重新加载
    localStorage.removeItem('preset_photos_loaded');
    setPresetPhotosLoaded(false);
  }, []);

  // Audio hook
  const audio = useChristmasAudio();

  // Gesture handling - use refs to avoid callback recreation
  const handleGestureChange = useCallback((gesture: GestureType) => {
    const currentTreeState = treeStateRef.current;
    const currentPhotos = photosRef.current;
    
    switch (gesture) {
      case 'fist':
        setTreeState('tree');
        setFocusedPhotoIndex(null);
        break;
      case 'open':
        setTreeState('galaxy');
        setFocusedPhotoIndex(null);
        break;
      case 'pinch':
        if (currentTreeState === 'galaxy') {
          const photoCount = currentPhotos.length > 0 ? currentPhotos.length : 12;
          const randomIndex = Math.floor(Math.random() * Math.min(photoCount, 12));
          setFocusedPhotoIndex(randomIndex);
          setTreeState('focus');
        } else if (currentTreeState === 'focus') {
          setFocusedPhotoIndex(null);
          setTreeState('galaxy');
        }
        break;
    }
  }, []); // Empty deps - uses refs

  // Request camera permission - actually request it now
  const handleRequestCamera = useCallback(async () => {
    console.log('[Index] Requesting camera permission...');
    setCameraPermission('requesting');
    try {
      // Actually request camera permission from the browser
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      console.log('[Index] Camera permission granted!');
      // Keep the stream alive - MediaPipe will use it
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (error) {
      console.error('[Index] Camera permission denied:', error);
      setCameraPermission('denied');
    }
  }, []);

  // Hand gesture hook
  const handGesture = useHandGesture({
    enabled: cameraPermission === 'granted',
    onGestureChange: handleGestureChange,
  });

  // Mouse fallback hook
  const mouseFallback = useMouseFallback({
    enabled: !handGesture.isTracking,
    currentState: treeState,
    onStateChange: setTreeState,
    onOrbitChange: setOrbitRotation,
  });

  // Update orbit from hand position
  useEffect(() => {
    if (handGesture.isTracking && handGesture.handPosition && treeState === 'galaxy') {
      setOrbitRotation({
        x: (handGesture.handPosition.y - 0.5) * Math.PI * 0.5,
        y: (handGesture.handPosition.x - 0.5) * Math.PI * 2,
      });
    }
  }, [handGesture.handPosition, handGesture.isTracking, treeState]);

  const handleDismissInstructions = useCallback(() => {
    setShowInstructions(false);
    // Auto-play music after dismissing instructions
    audio.play();
  }, [audio]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Loading Screen */}
      {!isLoaded && (
        <LoadingScreen 
          progress={loadingProgress} 
          onLoaded={() => setIsLoaded(true)} 
        />
      )}

      {/* 3D Scene - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        <ChristmasScene
          state={treeState}
          photos={photos}
          focusedPhotoIndex={focusedPhotoIndex}
          orbitRotation={orbitRotation}
          handPosition={handGesture.isTracking ? handGesture.handPosition : null}
          onReady={handleSceneReady}
          onStarFocusChange={setIsStarFocused}
          onPhotosChange={handlePhotosChange} // 传递照片变更回调
        />
      </Suspense>

      {/* UI Overlays - only show after loaded */}
      {isLoaded && (
        <>
          <GestureIndicator
            gesture={handGesture.gesture}
            isTracking={handGesture.isTracking}
            usingMouse={!handGesture.isTracking}
            cameraPermission={cameraPermission}
            mediapipeStatus={handGesture.status}
            onRequestCamera={handleRequestCamera}
          />

          <AudioControl
            isPlaying={audio.isPlaying}
            isMuted={audio.isMuted}
            onToggle={audio.toggle}
            onMuteToggle={audio.toggleMute}
          />

          <PhotoUpload
            photos={photos}
            onPhotosChange={handlePhotosChange}
            // 可以添加clear回调
          />

          {/* Camera Debug Preview */}
          <CameraDebug enabled={cameraPermission === 'granted'} />

          {/* Instructions Overlay */}
          {showInstructions && (
            <InstructionsOverlay onDismiss={handleDismissInstructions} />
          )}

          {/* State indicator & GitHub link */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* 可以添加预设照片加载状态指示器 */}
            {presetPhotosLoaded && photos.length > 0 && photos.length <= 4 && (
              <div className="glass rounded-lg px-3 py-1.5 text-xs text-green-400 animate-pulse">
                🎄 圣诞树已装饰 {photos.length} 张预设照片
              </div>
            )}
            
            <a
              href="https://github.com/zebo101/christmas-tree"
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          {/* Custom text overlay and edit button */}
          <CustomTextOverlay
            isVisible={isStarFocused}
            text={customText}
            onTextChange={setCustomText}
          />
        </>
      )}
    </div>
  );
};

export default Index;
