import React, { useState, useMemo, useEffect } from 'react';
import { ScriptInput } from './components/ScriptInput';
import { Workspace } from './components/Workspace';
import { Dashboard } from './components/Dashboard';
import { ProjectManager } from './components/ProjectManager';
import { 
  analyzeScriptLineByLine,
  analyzeScriptTimeBased,
  generatePromptsForShots, 
  generateImageForShot, 
  generateVideoPromptsForShots,
  generateVideoForShot,
  generateSinglePromptForShot,
  generateSingleVideoPromptForShot,
  generateVisualDetailForShot,
  generateVisualDetailsForShots
} from './services/geminiService';
import { Shot, GlobalReferences, AppMode, CharacterProfile, ModelSettings, PromptTemplateCollection, PromptTemplates, SceneData, Task, UserProfile, Project, ProjectData } from './types';
import { DEFAULT_PROMPT_COLLECTION } from './services/promptPresets';
import { SettingsModal } from './components/SettingsModal';
// 引入文件保存服务
import { initProjectFolder, saveShotImage, saveShotVideo } from './services/fileService';

// Mock Data
const INITIAL_PROJECTS: Project[] = [
  { 
    id: 'p1', 
    title: '校园-黄昏-告白', 
    status: 'rendering', 
    updatedAt: '2025-11-24 14:30', 
    sceneCount: 4, 
    shotCount: 15, 
    isPro: true, 
    isStarred: true, 
    isDeleted: false, 
    folderId: 'f2',
    size: '120MB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620641788421-7f1c33850486?q=80&w=800&auto=format&fit=crop',
    mode: 'image'
  },
  { 
    id: 'p2', 
    title: '雨夜追逐-测试', 
    status: 'draft', 
    updatedAt: '2025-11-23 09:15', 
    sceneCount: 2, 
    shotCount: 8, 
    isPro: false, 
    isStarred: false, 
    isDeleted: false,
    folderId: 'f1',
    size: '45MB',
    mode: 'image'
  },
  { 
    id: 'p3', 
    title: '未来城市-概念图', 
    status: 'completed', 
    updatedAt: '2025-11-20 18:00', 
    sceneCount: 1, 
    shotCount: 6, 
    isPro: true, 
    isStarred: false, 
    isDeleted: false,
    size: '210MB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop',
    mode: 'image'
  },
  {
      id: 'p4',
      title: '废弃草稿-01',
      status: 'draft',
      updatedAt: '2025-10-01 10:00',
      sceneCount: 1,
      shotCount: 2,
      isPro: false,
      isStarred: false,
      isDeleted: true,
      size: '10MB',
      mode: 'image'
  }
];

const App: React.FC = () => {
  // Changed initial mode to DASHBOARD
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  
  // Track current workspace mode (Only 'image' is active now)
  const [workspaceMode, setWorkspaceMode] = useState<'text' | 'image' | 'commentary'>('image');

  // User Profile State (Mock) - Unlocked Pro by default
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: `UID-${Math.floor(Math.random() * 100000)}`,
    name: '林海',
    plan: 'pro', // UNLOCKED
    credits: 99999, // UNLIMITED
    expireDate: undefined // PERMANENT
  });

  // Settings Modal State (Accessible from anywhere via footer/header)
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Script Input Modal State
  const [showScriptInput, setShowScriptInput] = useState(false);

  // --- Current Workspace State ---
  // These states represent the currently OPENED project data
  const [script, setScript] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>(''); 
  const [shots, setShots] = useState<Shot[]>([]);
  const [globalRefs, setGlobalRefs] = useState<GlobalReferences>({});
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [scenesData, setScenesData] = useState<Record<string, SceneData>>({});
  
  // --- Data Persistence (Isolation Layer) ---
  // Stores data for all projects keyed by project ID
  const [projectDataMap, setProjectDataMap] = useState<Record<string, ProjectData>>({});
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Auto-save effect: Whenever workspace state changes, save to the active project in projectDataMap
  useEffect(() => {
    if (activeProjectId && mode === AppMode.WORKSPACE) {
        setProjectDataMap(prev => ({
            ...prev,
            [activeProjectId]: {
                id: activeProjectId,
                shots,
                characters,
                globalRefs,
                scenesData,
                script
            }
        }));
    }
  }, [shots, characters, globalRefs, scenesData, script, activeProjectId, mode]);

  // Task State (Global or Project specific? Keeping global for simplicity, but clearing filters on switch)
  const [tasks, setTasks] = useState<Task[]>([]);

  // Project State (Metadata)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

  // Model Settings State - Updated defaults to Gemini 3 Pro Image and Sora-2
  const [settings, setSettings] = useState<ModelSettings>({
    text: { apiKey: '', baseUrl: '', model: 'gemini-3-pro-preview' },
    image: { apiKey: '', baseUrl: '', model: 'gemini-3-pro-image-preview' },
    video: { apiKey: '', baseUrl: '', model: 'sora-2' },
  });

  // Prompt Templates Collection (Complex State)
  // Smart Initialization: Merge Default with LocalStorage to preserve new code variants + user selections
  const [promptCollection, setPromptCollection] = useState<PromptTemplateCollection>(() => {
    try {
      // Changed key to promptCollection_v2 to reset state and clear old issues
      const savedJson = localStorage.getItem('promptCollection_v2');
      if (savedJson) {
        const savedData = JSON.parse(savedJson) as PromptTemplateCollection;
        // Deep merge: Clone default, then apply activeId and content from saved
        const merged = JSON.parse(JSON.stringify(DEFAULT_PROMPT_COLLECTION));
        
        (Object.keys(merged) as Array<keyof PromptTemplates>).forEach(key => {
           // Ensure key exists in saved data before trying to access properties
           if (savedData[key]) {
               // 1. Restore Active ID
               // Robust check: Ensure the saved activeId actually exists in the default/new variants list
               if (savedData[key].activeId) {
                   const variantExists = merged[key].variants.some((v: any) => v.id === savedData[key].activeId);
                   if (variantExists) {
                       merged[key].activeId = savedData[key].activeId;
                   }
               }
               
               // 2. Restore Custom Content (User edits)
               merged[key].variants = merged[key].variants.map((v: any) => {
                   const savedVariant = savedData[key].variants.find((sv: any) => sv.id === v.id);
                   if (savedVariant && savedVariant.content) {
                       return { ...v, content: savedVariant.content };
                   }
                   return v;
               });
           }
        });
        return merged;
      }
    } catch(e) { 
        console.error("Failed to load prompt collection", e); 
    }
    return DEFAULT_PROMPT_COLLECTION;
  });

  // Persist Prompt Collection
  useEffect(() => {
      try {
        localStorage.setItem('promptCollection_v2', JSON.stringify(promptCollection));
      } catch (e) {
        console.error("Failed to save prompt collection", e);
      }
  }, [promptCollection]);
  
  const [loading, setLoading] = useState({
    analyzing: false,
    generatingPrompts: false,
    generatingVideoPrompts: false,
    generatingVisualDetails: false, // New
  });

  // Helper: Flatten collection to simple templates for API consumption
  const effectiveTemplates = useMemo((): PromptTemplates => {
    const result = {} as PromptTemplates;
    (Object.keys(promptCollection) as Array<keyof PromptTemplates>).forEach(key => {
      const category = promptCollection[key];
      const activeVariant = category.variants.find(v => v.id === category.activeId) || category.variants[0];
      result[key] = activeVariant.content;
    });
    return result;
  }, [promptCollection]);

  // --- User Logic ---
  const handleActivateCDK = (cdk: string): boolean => {
      // Always true for now or just a mock
      return true;
  };

  // --- Project Handlers ---
  const handleOpenProject = (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          console.log("Opening project:", project.title);
          
          // 1. Set Mode
          if (project.mode) {
             setWorkspaceMode(project.mode);
          } else {
             setWorkspaceMode('image');
          }

          // 2. Load Data from Isolation Map
          const data = projectDataMap[projectId];
          if (data) {
              setShots(data.shots);
              setCharacters(data.characters);
              setGlobalRefs(data.globalRefs);
              setScenesData(data.scenesData);
              setScript(data.script || '');
          } else {
              setShots([]); 
              setCharacters([]);
              setGlobalRefs({});
              setScenesData({});
              setScript('');
              
              if (INITIAL_PROJECTS.find(p => p.id === projectId)) {
                   console.log("Initializing mock data for demo project...");
              }
          }

          // 3. Set Active ID
          setActiveProjectId(projectId);
          
          // 4. Navigate
          setMode(AppMode.WORKSPACE);
      }
  };

  const handleUpdateProject = (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (projectId: string) => {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isDeleted: true } : p));
  };

  const handleDuplicateProject = (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      const projectData = projectDataMap[projectId];
      
      if (project) {
          const newId = `p_${Date.now()}`;
          const newProject: Project = {
              ...project,
              id: newId,
              title: `${project.title} (Copy)`,
              updatedAt: new Date().toISOString(),
              status: 'draft'
          };
          setProjects(prev => [newProject, ...prev]);

          // Duplicate Data if exists
          if (projectData) {
              setProjectDataMap(prev => ({
                  ...prev,
                  [newId]: {
                      ...projectData,
                      id: newId
                  }
              }));
          }
      }
  };

  const handleImportProject = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              if (!data.shots && !data.title) {
                  throw new Error("无效的项目文件");
              }

              const newId = data.id || `imported_${Date.now()}`;
              const newProject: Project = {
                  id: newId,
                  title: data.title || file.name.replace(/\.(json|ani)$/, ''),
                  status: data.status || 'draft',
                  updatedAt: new Date().toISOString(),
                  sceneCount: data.sceneCount || 0,
                  shotCount: data.shots?.length || 0,
                  isPro: data.isPro || false,
                  isStarred: false,
                  isDeleted: false,
                  size: (file.size / 1024).toFixed(0) + 'KB',
                  mode: data.mode || 'image'
              };

              setProjects(prev => [newProject, ...prev]);
              
              setShots(data.shots || []);
              setScript(data.script || '');
              setCharacters(data.characters || []);
              setGlobalRefs(data.globalRefs || {});
              setScenesData(data.scenesData || {});
              
              if (newProject.mode) setWorkspaceMode(newProject.mode);

              setActiveProjectId(newId);
              setProjectDataMap(prev => ({
                  ...prev,
                  [newId]: {
                      id: newId,
                      shots: data.shots || [],
                      characters: data.characters || [],
                      globalRefs: data.globalRefs || {},
                      scenesData: data.scenesData || {},
                      script: data.script || ''
                  }
              }));

              setMode(AppMode.WORKSPACE);
          } catch (e) {
              alert("导入失败: 文件格式错误或损坏");
              console.error(e);
          }
      };
      reader.readAsText(file);
  };

  // --- Task Management Logic ---

  const formatTime = () => {
    return new Date().toISOString(); 
  };

  const createTask = (
      type: Task['type'], 
      name: string, 
      shotId: string | undefined, 
      shotNumber: string | undefined, 
      sceneNumber: string | undefined
  ): Task => {
      return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          type,
          name,
          shotId,
          shotNumber,
          sceneNumber,
          status: 'pending',
          progress: 0,
          submitTime: formatTime(),
          description: type === 'image' ? '分镜生图任务' : type === 'visual_detail' ? '画面推演任务' : 'AI 推演任务'
      };
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const runTaskWrapper = async <T,>(
      taskMeta: { type: Task['type'], name: string, shotId?: string, shotNumber?: string, sceneNumber?: string },
      asyncFn: () => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: any) => void
  ) => {
      const newTask = createTask(taskMeta.type, taskMeta.name, taskMeta.shotId, taskMeta.shotNumber, taskMeta.sceneNumber);
      
      setTasks(prev => [newTask, ...prev]);

      setTimeout(async () => {
          updateTask(newTask.id, { status: 'running', startTime: formatTime(), progress: 5 });
          
          try {
              const result = await asyncFn();
              updateTask(newTask.id, { status: 'success', progress: 100, endTime: formatTime() });
              if (onSuccess) onSuccess(result);
          } catch (e: any) {
              const errorMsg = e.message || e.toString() || "未知错误";
              let friendlyError = errorMsg;
              if (errorMsg.includes("Chinese")) friendlyError = "提示词中包含中文 (API限制)";
              if (errorMsg.includes("401")) friendlyError = "API Key 无效或未授权";
              
              updateTask(newTask.id, { status: 'failed', error: friendlyError, endTime: formatTime() });
              if (onError) onError(e);
          }
      }, 100);
  };

  const handleDeleteTask = (taskId: string) => {
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (taskToDelete && taskToDelete.shotId) {
          setShots(currentShots => currentShots.map(s => {
              if (s.id === taskToDelete.shotId) {
                  return {
                      ...s,
                      isGeneratingImage: taskToDelete.type === 'image' ? false : s.isGeneratingImage,
                      isGeneratingVideo: taskToDelete.type === 'video' ? false : s.isGeneratingVideo,
                      isGeneratingPrompt: taskToDelete.type === 'prompt' ? false : s.isGeneratingPrompt,
                      isGeneratingVideoPrompt: taskToDelete.type === 'video_prompt' ? false : s.isGeneratingVideoPrompt,
                      isGeneratingVisualDetail: taskToDelete.type === 'visual_detail' ? false : s.isGeneratingVisualDetail
                  };
              }
              return s;
          }));
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleClearTasks = () => {
      const tasksWithShots = tasks.filter(t => t.shotId);
      if (tasksWithShots.length > 0) {
          setShots(currentShots => currentShots.map(s => {
               const relatedTasks = tasksWithShots.filter(t => t.shotId === s.id);
               if (relatedTasks.length > 0) {
                   let update = { ...s };
                   relatedTasks.forEach(t => {
                       if (t.type === 'image') update.isGeneratingImage = false;
                       if (t.type === 'video') update.isGeneratingVideo = false;
                       if (t.type === 'prompt') update.isGeneratingPrompt = false;
                       if (t.type === 'video_prompt') update.isGeneratingVideoPrompt = false;
                       if (t.type === 'visual_detail') update.isGeneratingVisualDetail = false;
                   });
                   return update;
               }
               return s;
          }));
      }
      setTasks([]);
  };

  // --- Handlers ---

  const handleAnalyze = async (selectedMode: 'text' | 'image' | 'commentary', breakdownMethod?: 'ai' | 'line') => {
    setLoading(prev => ({ ...prev, analyzing: true }));
    try {
      let analyzedShots: Shot[] = [];
      
      // Enforce image mode logic since others are disabled
      if (breakdownMethod === 'line') {
          analyzedShots = analyzeScriptLineByLine(script);
      } else {
          analyzedShots = await analyzeScriptTimeBased(script, settings.text, effectiveTemplates);
      }
      
      const newProjectId = `p_${Date.now()}`;
      const uniqueScenes = new Set(analyzedShots.map(s => s.sceneNumber)).size;
      
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

      // --- 修改开始：创建本地文件夹 ---
      const safeTitle = projectTitle.trim() || '未命名工程';
      await initProjectFolder(safeTitle);
      // ----------------------------------------

      const newProject: Project = {
          id: newProjectId,
          title: safeTitle,
          status: 'draft',
          updatedAt: formattedDate,
          sceneCount: uniqueScenes,
          shotCount: analyzedShots.length,
          isPro: false,
          isStarred: false,
          isDeleted: false,
          size: '2MB',
          mode: 'image'
      };

      setProjects(prev => [newProject, ...prev]);

      setProjectDataMap(prev => ({
          ...prev,
          [newProjectId]: {
              id: newProjectId,
              shots: analyzedShots,
              characters: [],
              globalRefs: {},
              scenesData: {},
              script: script
          }
      }));

      setActiveProjectId(newProjectId);
      setShots(analyzedShots);
      setCharacters([]);
      setGlobalRefs({});
      setScenesData({});
      
      setWorkspaceMode('image');
      setShowScriptInput(false);
      setMode(AppMode.WORKSPACE);

    } catch (e) {
      alert("剧本分析失败，请重试: " + e);
    } finally {
      setLoading(prev => ({ ...prev, analyzing: false }));
    }
  };

  const handleGeneratePrompts = async () => {
    setLoading(prev => ({ ...prev, generatingPrompts: true }));
    try {
      const updatedShots = await generatePromptsForShots(shots, characters, settings.text, effectiveTemplates);
      setShots(currentShots => {
          return updatedShots.map(newShot => {
              const oldShot = currentShots.find(s => s.id === newShot.id);
              if (oldShot) {
                  return {
                      ...newShot,
                      aspectRatio: oldShot.aspectRatio || newShot.aspectRatio
                  };
              }
              return newShot;
          });
      });
    } catch (e) {
      alert("提示词生成失败: " + e);
    } finally {
      setLoading(prev => ({ ...prev, generatingPrompts: false }));
    }
  };

  const handleGenerateSinglePrompt = async (shotId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) return;

    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingPrompt: true } : s));
    
    runTaskWrapper(
        { 
            type: 'prompt', 
            name: '单镜提示词推演', 
            shotId: shot.id, 
            shotNumber: shot.shotNumber, 
            sceneNumber: shot.sceneNumber 
        },
        async () => {
            const currentIndex = shots.findIndex(s => s.id === shotId);
            const targetShot = shots[currentIndex];
            const previousShot = currentIndex > 0 ? shots[currentIndex - 1] : undefined;
            const sceneShots = shots.filter(s => s.sceneNumber === targetShot.sceneNumber);
            return await generateSinglePromptForShot(targetShot, previousShot, sceneShots, characters, settings.text, effectiveTemplates);
        },
        (result) => {
            setShots(prev => prev.map(s => s.id === shotId ? { 
                ...s, 
                positivePrompt: result.positivePrompt,
                negativePrompt: result.negativePrompt,
                isGeneratingPrompt: false 
            } : s));
        },
        (err) => {
            setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingPrompt: false } : s));
        }
    );
  };

  const handleGenerateSingleVideoPrompt = async (shotId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) return;

    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVideoPrompt: true } : s));
    
    runTaskWrapper(
        { 
            type: 'video_prompt', 
            name: '视频提示词推演', 
            shotId: shot.id, 
            shotNumber: shot.shotNumber, 
            sceneNumber: shot.sceneNumber 
        },
        async () => {
            const currentIndex = shots.findIndex(s => s.id === shotId);
            const targetShot = shots[currentIndex];
            const previousShot = currentIndex > 0 ? shots[currentIndex - 1] : undefined;
            const sceneShots = shots.filter(s => s.sceneNumber === targetShot.sceneNumber);
            return await generateSingleVideoPromptForShot(targetShot, previousShot, sceneShots, settings.text, effectiveTemplates);
        },
        (result) => {
            setShots(prev => prev.map(s => s.id === shotId ? { 
                ...s, 
                videoPrompt: result.videoPrompt,
                isGeneratingVideoPrompt: false 
            } : s));
        },
        (err) => {
            setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVideoPrompt: false } : s));
        }
    );
  };

  const handleGenerateSingleVisualDetail = async (shotId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) return;

    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVisualDetail: true } : s));
    
    runTaskWrapper(
        { 
            type: 'visual_detail', 
            name: '画面推演', 
            shotId: shot.id, 
            shotNumber: shot.shotNumber, 
            sceneNumber: shot.sceneNumber 
        },
        async () => {
            const currentIndex = shots.findIndex(s => s.id === shotId);
            const targetShot = shots[currentIndex];
            // Pass full shots context for state inheritance logic
            return await generateVisualDetailForShot(targetShot, shots, settings.text, effectiveTemplates);
        },
        (result) => {
            setShots(prev => prev.map(s => s.id === shotId ? { 
                ...s, 
                visualDescription: result,
                isGeneratingVisualDetail: false 
            } : s));
        },
        (err) => {
            setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVisualDetail: false } : s));
        }
    );
  };

  const handleGenerateVisualDetails = async () => {
    setLoading(prev => ({ ...prev, generatingVisualDetails: true }));
    try {
        const updatedShots = await generateVisualDetailsForShots(shots, settings.text, effectiveTemplates);
        setShots(updatedShots);
    } catch(e) {
        alert("批量画面推演失败: " + e);
    } finally {
        setLoading(prev => ({ ...prev, generatingVisualDetails: false }));
    }
  };

  const handleGenerateVideoPrompts = async () => {
    setLoading(prev => ({ ...prev, generatingVideoPrompts: true }));
    try {
      const updatedShots = await generateVideoPromptsForShots(shots, settings.text, effectiveTemplates);
      setShots(updatedShots);
    } catch (e) {
      alert("视频提示词生成失败: " + e);
    } finally {
      setLoading(prev => ({ ...prev, generatingVideoPrompts: false }));
    }
  };

  const handleGenerateImage = async (shotId: string) => {
    const shotIndex = shots.findIndex(s => s.id === shotId);
    if (shotIndex === -1) return;
    const targetShot = shots[shotIndex];

    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingImage: true } : s));

    runTaskWrapper(
        { 
            type: 'image', 
            name: '香蕉生图', 
            shotId: targetShot.id, 
            shotNumber: targetShot.shotNumber, 
            sceneNumber: targetShot.sceneNumber 
        },
        async () => {
            let referenceImages: string[] = [];
            if (targetShot.manualReferenceShotIds && targetShot.manualReferenceShotIds.length > 0) {
              referenceImages = shots
                .filter(s => targetShot.manualReferenceShotIds?.includes(s.id) && s.generatedImage)
                .map(s => s.generatedImage!);
            } else {
              if (shotIndex > 0 && shots[shotIndex - 1].generatedImage) {
                referenceImages = [shots[shotIndex - 1].generatedImage!];
              }
            }
            const sceneData = scenesData[targetShot.sceneNumber];
            
            return await generateImageForShot(
                targetShot, 
                characters, 
                globalRefs, 
                referenceImages, 
                sceneData,
                settings.image, 
                effectiveTemplates
            );
        },
        (base64) => {
             // Save previous image to history before updating
             setShots(prev => prev.map(s => {
                 if (s.id === shotId) {
                     const history = s.historyImages ? [...s.historyImages] : [];
                     if (s.generatedImage && !history.includes(s.generatedImage)) {
                         history.unshift(s.generatedImage); // Add current to history
                     }
                     return { 
                         ...s, 
                         generatedImage: base64, 
                         historyImages: history,
                         isGeneratingImage: false 
                     };
                 }
                 return s;
             }));
             
             // --- 修改开始：保存图片到本地 ---
             const currentProjectTitle = projects.find(p => p.id === activeProjectId)?.title || projectTitle || '未命名工程';
             saveShotImage(currentProjectTitle, targetShot, base64);
             // ----------------------------------------
        },
        (err) => {
             setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingImage: false } : s));
        }
    );
  };

  const handleGenerateVideo = async (shotId: string) => {
    const shotIndex = shots.findIndex(s => s.id === shotId);
    if (shotIndex === -1) return;
    const targetShot = shots[shotIndex];

    if (workspaceMode === 'image' && !targetShot.generatedImage) {
      alert("请先生成静态分镜图，视频生成依赖于参考图。");
      return;
    }

    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVideo: true } : s));

    runTaskWrapper(
        {
            type: 'video',
            name: 'AI 视频生成',
            shotId: targetShot.id, 
            shotNumber: targetShot.shotNumber, 
            sceneNumber: targetShot.sceneNumber 
        },
        async () => {
            return await generateVideoForShot(targetShot, settings.video);
        },
        (videoUrl) => {
            // Save previous video to history
            setShots(prev => prev.map(s => {
                if (s.id === shotId) {
                    const history = s.historyVideos ? [...s.historyVideos] : [];
                    if (s.generatedVideo && !history.includes(s.generatedVideo)) {
                        history.unshift(s.generatedVideo);
                    }
                    return { 
                        ...s, 
                        generatedVideo: videoUrl, 
                        historyVideos: history,
                        isGeneratingVideo: false 
                    };
                }
                return s;
            }));

            // --- 修改开始：保存视频到本地 ---
            const currentProjectTitle = projects.find(p => p.id === activeProjectId)?.title || projectTitle || '未命名工程';
            saveShotVideo(currentProjectTitle, targetShot, videoUrl);
            // ----------------------------------------
        },
        (err) => {
            setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVideo: false } : s));
        }
    );
  };

  // Restore history image handler
  const handleRestoreHistoryImage = (shotId: string, historyImageUrl: string) => {
      setShots(prev => prev.map(s => {
          if (s.id === shotId) {
              const currentImage = s.generatedImage;
              let newHistory = s.historyImages ? [...s.historyImages] : [];
              
              // If there was a current image, verify it's not already in history, then add it
              if (currentImage && !newHistory.includes(currentImage)) {
                  newHistory.unshift(currentImage);
              }
              
              // Remove the restored image from history (it's becoming active)
              newHistory = newHistory.filter(img => img !== historyImageUrl);

              return {
                  ...s,
                  generatedImage: historyImageUrl,
                  historyImages: newHistory
              };
          }
          return s;
      }));
  };

  // Restore history video handler
  const handleRestoreHistoryVideo = (shotId: string, historyVideoUrl: string) => {
      setShots(prev => prev.map(s => {
          if (s.id === shotId) {
              const currentVideo = s.generatedVideo;
              let newHistory = s.historyVideos ? [...s.historyVideos] : [];
              
              if (currentVideo && !newHistory.includes(currentVideo)) {
                  newHistory.unshift(currentVideo);
              }
              
              newHistory = newHistory.filter(v => v !== historyVideoUrl);

              return {
                  ...s,
                  generatedVideo: historyVideoUrl,
                  historyVideos: newHistory
              };
          }
          return s;
      }));
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      
      {/* Global Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSettingsChange={setSettings}
        userProfile={userProfile}
        onActivateCDK={handleActivateCDK}
      />

      {/* 1. Dashboard View */}
      {mode === AppMode.DASHBOARD && (
        <Dashboard 
          onOpenScriptInput={() => setShowScriptInput(true)}
          userProfile={userProfile}
          onOpenSettings={() => setShowSettingsModal(true)}
          onNavigateToProjects={() => setMode(AppMode.PROJECTS)}
          projects={projects}
          onOpenProject={handleOpenProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onImportProject={handleImportProject}
        />
      )}

      {/* 2. Script Input Modal Overlay */}
      {showScriptInput && (
        <ScriptInput 
          value={script} 
          onChange={setScript} 
          onAnalyze={handleAnalyze} 
          isAnalyzing={loading.analyzing}
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowScriptInput(false)}
          userProfile={userProfile}
          onActivateCDK={handleActivateCDK}
          projectTitle={projectTitle}
          setProjectTitle={setProjectTitle}
        />
      )}

      {/* 3. Workspace View */}
      {mode === AppMode.WORKSPACE && (
        <Workspace 
          shots={shots}
          setShots={setShots}
          globalRefs={globalRefs}
          setGlobalRefs={setGlobalRefs}
          characters={characters}
          setCharacters={setCharacters}
          scenesData={scenesData}
          setScenesData={setScenesData}
          onGeneratePrompts={handleGeneratePrompts}
          onGenerateSinglePrompt={handleGenerateSinglePrompt}
          onGenerateSingleVideoPrompt={handleGenerateSingleVideoPrompt}
          onGenerateVideoPrompts={handleGenerateVideoPrompts}
          onGenerateImage={handleGenerateImage}
          onGenerateVideo={handleGenerateVideo}
          isGeneratingPrompts={loading.generatingPrompts}
          isGeneratingVideoPrompts={loading.generatingVideoPrompts}
          
          // New Visual Detail Props
          onGenerateVisualDetail={handleGenerateSingleVisualDetail}
          onGenerateVisualDetails={handleGenerateVisualDetails}
          isGeneratingVisualDetails={loading.generatingVisualDetails}

          // History Handler
          onRestoreHistoryImage={handleRestoreHistoryImage}
          onRestoreHistoryVideo={handleRestoreHistoryVideo} // Pass video restore as prop

          onBack={() => {
              setActiveProjectId(null); // Clear active project on exit
              setMode(AppMode.DASHBOARD);
          }} 
          
          settings={settings}
          onSettingsChange={setSettings}
          onOpenSettings={() => setShowSettingsModal(true)}
          
          promptCollection={promptCollection}
          onUpdatePromptCollection={setPromptCollection}
          effectiveTemplates={effectiveTemplates}
          
          tasks={tasks}
          onDeleteTask={handleDeleteTask}
          onClearTasks={handleClearTasks}

          userProfile={userProfile}
          projectMode={workspaceMode} // Pass the mode
        />
      )}

      {/* 4. Project Manager View (New) */}
      {mode === AppMode.PROJECTS && (
         <ProjectManager 
            userProfile={userProfile}
            onOpenSettings={() => setShowSettingsModal(true)}
            onBack={() => setMode(AppMode.DASHBOARD)}
            projects={projects}
            onOpenProject={handleOpenProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onCreateProject={() => {
                setMode(AppMode.DASHBOARD);
                setShowScriptInput(true);
            }}
         />
      )}
    </div>
  );
};

export default App;