// services/fileService.ts
import { Shot } from '../types';

// 定义 Window 接口，扩展 electronAPI
declare global {
  interface Window {
    electronAPI?: {
      createProjectFolder: (projectName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      saveAsset: (
        projectName: string, 
        type: 'images' | 'videos', 
        fileName: string, 
        data: string // Base64 或 Buffer
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  }
}

/**
 * 1. 初始化项目文件夹
 */
export const initProjectFolder = async (projectName: string) => {
  if (!window.electronAPI) {
    console.warn("非 Electron 环境，跳过本地文件夹创建");
    return;
  }
  
  // 去除文件名非法字符
  const safeName = projectName.replace(/[\\/:*?"<>|]/g, "_");
  
  try {
    const result = await window.electronAPI.createProjectFolder(safeName);
    if (result.success) {
      console.log(`[FileService] 项目文件夹创建成功: ${result.path}`);
    } else {
      console.error(`[FileService] 创建失败: ${result.error}`);
    }
  } catch (e) {
    console.error("[FileService] IPC 通信错误", e);
  }
};

/**
 * 2. 保存分镜图片
 * 命名规则: {sceneNumber}-{shotNumber}.png (例如 1-1.png)
 */
export const saveShotImage = async (projectName: string, shot: Shot, base64Data: string) => {
  if (!window.electronAPI || !base64Data) return;

  const safeProjectName = projectName.replace(/[\\/:*?"<>|]/g, "_");
  // 命名格式：Scene-Shot.png (例如 1-1.png)
  const fileName = `${shot.sceneNumber}-${shot.shotNumber}.png`;

  console.log(`[FileService] 正在保存图片: ${fileName}`);

  try {
    await window.electronAPI.saveAsset(safeProjectName, 'images', fileName, base64Data);
  } catch (e) {
    console.error("保存图片失败", e);
  }
};

/**
 * 3. 保存分镜视频
 * 命名规则: {sceneNumber}-{shotNumber}.mp4 (例如 1-1.mp4)
 */
export const saveShotVideo = async (projectName: string, shot: Shot, videoUrl: string) => {
  if (!window.electronAPI || !videoUrl) return;

  const safeProjectName = projectName.replace(/[\\/:*?"<>|]/g, "_");
  const fileName = `${shot.sceneNumber}-${shot.shotNumber}.mp4`;

  console.log(`[FileService] 正在保存视频: ${fileName}`);

  try {
    // 如果是 Blob URL，需要先转成 Base64 或 Buffer
    let dataToSave = videoUrl;
    
    if (videoUrl.startsWith('blob:')) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            await window.electronAPI?.saveAsset(safeProjectName, 'videos', fileName, base64data);
        };
    } else {
        // 如果是远程 URL，直接传给 Electron 下载（或者这里 fetch 转 base64）
        // 这里假设是 Base64 或可直接处理的格式，简化处理逻辑：
        await window.electronAPI.saveAsset(safeProjectName, 'videos', fileName, videoUrl);
    }
  } catch (e) {
    console.error("保存视频失败", e);
  }
};