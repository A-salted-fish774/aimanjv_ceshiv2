
export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  imageUrl: string; // Base64
}

export interface SceneData {
  sceneNumber: string;
  description: string;
  images: string[]; // Base64 strings of generated scene images
  isAnalyzing: boolean;
  isGeneratingImages: boolean;
}

export interface Shot {
  id: string;
  sceneNumber: string;
  shotNumber: string;
  visualDescription: string;
  cameraAction: string;
  dialogueOrAudio: string;
  duration: string;
  
  // New: Original Text Segment (for comparison and source)
  originalText?: string;
  
  // Character Assignment (New)
  characterIds: string[]; // List of character IDs appearing in this shot
  
  // AI Generated Content - Image
  positivePrompt: string; // Chinese
  negativePrompt: string;
  aspectRatio: string;
  imageQuality?: '1K' | '2K' | '4K'; // New: Image Quality Setting for Gemini 3 Pro
  generatedImage?: string; // Base64
  historyImages?: string[]; // New: History of generated images for this shot
  manualReferenceShotIds?: string[]; // IDs of shots manually selected as reference
  
  // AI Generated Content - Video
  videoPrompt: string; // Chinese
  videoAspectRatio?: string; // Separate aspect ratio for video
  generatedVideo?: string; // Blob URL or remote URL
  historyVideos?: string[]; // New: History of generated videos for this shot
  
  // State
  isGeneratingPrompt: boolean;
  isGeneratingImage: boolean;
  isGeneratingVideoPrompt: boolean;
  isGeneratingVideo: boolean;
  isGeneratingVisualDetail?: boolean; // New state for Visual Breakdown generation
}

export interface GlobalReferences {
  environment?: string;
  // New: User uploaded reference assets
  styleImages?: string[]; // List of base64 strings
  layoutImages?: string[]; // List of base64 strings
  activeStyleImage?: string; // Currently selected style reference (base64)
  activeLayoutImage?: string; // Currently selected layout reference (base64)
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  INPUT = 'INPUT', 
  WORKSPACE = 'WORKSPACE',
  PROJECTS = 'PROJECTS', // New Mode
}

// User & License Types
export interface UserProfile {
  id: string;
  name: string;
  plan: 'free' | 'pro';
  expireDate?: string; // ISO String
  credits: number;
  avatarUrl?: string;
}

// New: Granular Model Configuration
export interface ModelConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ModelSettings {
  text: ModelConfig;
  image: ModelConfig;
  video: ModelConfig;
}

// --- Prompt Engineering Types ---

export interface PromptTemplates {
  breakdownSystemPrompt: string;
  imagePromptSystemPrompt: string;
  singleShotDeducePrompt: string;
  videoPromptSystemPrompt: string;
  imageGenerationSubmissionPrompt: string;
  characterMatchSystemPrompt: string;
  aiBreakdownSystemPrompt: string; // New: AI 分镜提示词
  visualDetailSystemPrompt: string; // New: 画面推演提示词
}

export interface TemplateVariant {
  id: string;
  name: string;
  content: string;
  stylePreset?: string; // e.g., 'anime', 'cinematic', 'comic'
}

export interface TemplateCategory {
  key: keyof PromptTemplates;
  name: string; // Display name e.g. "1. 剧本拆解"
  activeId: string;
  variants: TemplateVariant[];
}

export type PromptTemplateCollection = Record<keyof PromptTemplates, TemplateCategory>;

// --- Task Management Types ---

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

export interface Task {
  id: string;
  type: 'image' | 'video' | 'prompt' | 'video_prompt' | 'analysis' | 'visual_detail';
  name: string; // Display name e.g. "原创出图"
  shotId?: string;
  sceneNumber?: string;
  shotNumber?: string;
  status: TaskStatus;
  progress: number; // 0-100
  submitTime: string;
  startTime?: string;
  endTime?: string;
  error?: string;
  description?: string;
}

// --- Project Management Types (New) ---

export type ProjectStatus = 'completed' | 'rendering' | 'draft';

export interface Project {
  id: string;
  title: string;
  thumbnailUrl?: string;
  status: ProjectStatus;
  updatedAt: string;
  sceneCount: number;
  shotCount: number;
  isPro: boolean; // Uses pro models
  isStarred: boolean;
  isDeleted: boolean; // In trash
  folderId?: string;
  size: string; // e.g. "120MB"
  mode?: 'text' | 'image' | 'commentary'; // Added 'commentary' mode
}

export interface ProjectFolder {
  id: string;
  name: string;
}

// --- Data Isolation Types ---
export interface ProjectData {
  id: string;
  shots: Shot[];
  characters: CharacterProfile[];
  globalRefs: GlobalReferences;
  scenesData: Record<string, SceneData>;
  script: string;
}