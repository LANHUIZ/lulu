import { useRef, useState, useEffect } from 'react';
import { ImagePlus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

// 预设照片列表
const PRESET_PHOTOS = [
  { id: 1, name: '圣诞全家福', url: '/preset-photos/family.jpg' },
  { id: 2, name: '可爱宠物', url: '/preset-photos/pet.jpg' },
  { id: 3, name: '好友聚会', url: '/preset-photos/friends.jpg' },
  { id: 4, name: '冬日雪景', url: '/preset-photos/winter.jpg' },
  { id: 5, name: '圣诞礼物', url: '/preset-photos/gift.jpg' },
  { id: 6, name: '节日装饰', url: '/preset-photos/decorations.jpg' },
  { id: 7, name: '圣诞老人', url: '/preset-photos/santa.jpg' },
  { id: 8, name: '温馨烛光', url: '/preset-photos/candle.jpg' },
];

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 12 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPreset, setShowPreset] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);

  // 在组件加载时自动添加预设照片（如果用户没有照片）
  useEffect(() => {
    const loadPresetPhotos = async () => {
      // 检查是否应该加载预设照片
      if (photos.length === 0 && !presetLoaded) {
        try {
          // 延迟加载以确保组件完全初始化
          setTimeout(async () => {
            const presetPhotoURLs: string[] = [];
            
            // 加载前4个预设照片
            for (let i = 0; i < Math.min(4, PRESET_PHOTOS.length); i++) {
              try {
                const photo = PRESET_PHOTOS[i];
                const response = await fetch(photo.url);
                const blob = await response.blob();
                const reader = new FileReader();
                
                reader.onload = () => {
                  presetPhotoURLs.push(reader.result as string);
                  
                  // 当所有预设照片都加载完成后，更新状态
                  if (presetPhotoURLs.length === Math.min(4, PRESET_PHOTOS.length)) {
                    onPhotosChange([...presetPhotoURLs]);
                    setPresetLoaded(true);
                    
                    // 保存到本地存储，标记预设已加载
                    localStorage.setItem('preset_photos_loaded', 'true');
                  }
                };
                
                reader.readAsDataURL(blob);
              } catch (error) {
                console.warn(`无法加载预设照片: ${PRESET_PHOTOS[i].name}`);
              }
            }
          }, 2000); // 延迟2秒，让用户看到初始界面
        } catch (error) {
          console.error('加载预设照片时出错:', error);
        }
      }
    };
    
    // 检查本地存储，避免重复加载
    const hasPresetLoaded = localStorage.getItem('preset_photos_loaded');
    if (!hasPresetLoaded) {
      loadPresetPhotos();
    }
  }, [photos.length, presetLoaded, onPhotosChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    Array.from(files).slice(0, filesToProcess).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotos.push(event.target.result as string);
          if (newPhotos.length === filesToProcess) {
            onPhotosChange([...photos, ...newPhotos]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handlePresetSelect = async (presetUrl: string) => {
    if (photos.length >= maxPhotos) {
      alert(`最多只能添加 ${maxPhotos} 张照片`);
      return;
    }

    try {
      const response = await fetch(presetUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto = event.target.result as string;
          onPhotosChange([...photos, newPhoto]);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('加载预设照片失败:', error);
    }
    
    setShowPreset(false);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleClearAll = () => {
    onPhotosChange([]);
    // 清除预设加载标记，以便下次重新加载
    localStorage.removeItem('preset_photos_loaded');
    setPresetLoaded(false);
  };

  // 快速添加所有预设照片
  const handleAddAllPresets = async () => {
    if (photos.length >= maxPhotos) {
      alert(`最多只能添加 ${maxPhotos} 张照片`);
      return;
    }

    const newPhotos = [...photos];
    const slotsAvailable = maxPhotos - photos.length;
    const presetsToAdd = Math.min(slotsAvailable, PRESET_PHOTOS.length);

    for (let i = 0; i < presetsToAdd; i++) {
      try {
        const response = await fetch(PRESET_PHOTOS[i].url);
        const blob = await response.blob();
        const reader = new FileReader();
        
        await new Promise((resolve) => {
          reader.onload = (event) => {
            if (event.target?.result) {
              newPhotos.push(event.target.result as string);
              resolve(true);
            }
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn(`无法添加预设照片: ${PRESET_PHOTOS[i].name}`);
      }
    }

    onPhotosChange(newPhotos);
    setShowPreset(false);
    setPresetLoaded(true);
    localStorage.setItem('preset_photos_loaded', 'true');
  };

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div className="flex flex-col items-end gap-2">
        {photos.length > 0 && (
          <div className="glass rounded-lg p-2 flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground px-2">
              {photos.length}/{maxPhotos} 张照片
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-accent hover:text-accent/80"
            >
              清空所有
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          {/* 上传照片按钮 */}
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className="glass-gold hover:bg-christmas-gold/30 text-foreground rounded-full px-4 py-2 flex items-center gap-2"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-sm font-medium">添加照片</span>
          </Button>
          
          {/* 预设照片按钮 */}
          <Button
            onClick={() => setShowPreset(!showPreset)}
            className="glass-green hover:bg-green-600/30 text-foreground rounded-full px-4 py-2 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">预设照片</span>
          </Button>
        </div>
        
        {/* 预设照片面板 */}
        {showPreset && (
          <div className="glass rounded-lg p-4 w-64 max-h-80 overflow-y-auto mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">选择预设照片</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddAllPresets}
                className="text-xs text-green-600 hover:text-green-700"
              >
                全部添加
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PHOTOS.map((preset) => (
                <div
                  key={preset.id}
                  className="relative group cursor-pointer"
                  onClick={() => handlePresetSelect(preset.url)}
                >
                  <div className="aspect-square rounded-md overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 border border-gray-200 hover:border-green-500 transition-all">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-2">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-green-100 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md" />
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              点击照片添加到圣诞树
            </p>
          </div>
        )}
        
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
