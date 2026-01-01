import { GoogleGenAI } from "@google/genai";
import { Shot, CharacterProfile, ModelConfig, PromptTemplates, SceneData, GlobalReferences, ModelSettings } from '../types';
import { DEFAULT_PROMPT_PRESET, WEBTOON_REF_IMAGE } from './promptPresets';
import { logger } from '../utils/logger';

export enum HarmCategory {
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT',
}

export enum HarmBlockThreshold {
  BLOCK_NONE = 'BLOCK_NONE',
}

// 优化的 Base URL 获取函数
const getBaseUrl = (config: ModelConfig, defaultUrl: string = "https://generativelanguage.googleapis.com") => {
  let url = config.baseUrl?.trim() || defaultUrl;
  return url.replace(/\/$/, "");
};

const isGoogleModel = (model: string) => {
  return model.toLowerCase().startsWith('gemini') || model.toLowerCase().startsWith('veo') || model.toLowerCase().startsWith('imagen');
};

const getAI = (config: ModelConfig) => {
  const apiKey = config.apiKey?.trim() || process.env.API_KEY;
  if (!apiKey) {
      throw new Error("API key is missing. Please set it in Settings or provided via environment variable.");
  }
  const options: any = { apiKey };
  
  if (config.baseUrl && config.baseUrl.trim()) {
      options.baseUrl = config.baseUrl.trim();
  }
  
  // Force v1beta for Gemini 3 Pro based on requirements
  if (config.model.includes('gemini-3')) {
      options.apiVersion = 'v1beta';
  }
  return new GoogleGenAI(options);
};

const extractJson = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    const startArr = text.indexOf('[');
    const endArr = text.lastIndexOf(']');
    if (startArr !== -1 && endArr !== -1) {
       const jsonStr = text.substring(startArr, endArr + 1);
       return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error("JSON parse error", e);
  }
  return null;
};

// 【恢复】完整的 Blob 处理逻辑，确保 FormData 能正常上传图片
const base64ToBlob = async (base64: string): Promise<Blob> => {
  // 1. 处理 HTTP URL (如果上一镜是网络图片)
  if (base64.startsWith('http')) {
      try {
          const res = await fetch(base64);
          return await res.blob();
      } catch (e) {
          console.warn("Fetch URL failed", e);
      }
  }

  // 2. 处理 Data URI (data:image/png;base64,...)
  if (base64.startsWith('data:')) {
      try {
        const res = await fetch(base64);
        return await res.blob();
      } catch (e) {
        console.warn("Fetch base64 failed, falling back to manual decode", e);
      }
  }

  // 3. 处理纯 Base64 字符串 (兜底)
  try {
      const cleanBase64 = base64.replace(/^data:.*?;base64,/, "");
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: 'image/png' });
  } catch (e) {
      console.error("Base64 decode error", e);
      throw new Error("Invalid base64 string or image data");
  }
};

const callOpenAIChat = async (config: ModelConfig, systemPrompt: string, userPrompt: string, jsonMode: boolean = false) => {
    const apiKey = config.apiKey?.trim() || process.env.API_KEY;
    const baseUrl = getBaseUrl(config, "https://api.wfei.site");

    if (!apiKey) throw new Error("API key is missing for OpenAI compatible call.");

    const url = `${baseUrl}/v1/chat/completions`;
    const body = {
        model: config.model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

/**
 * 【保留】原生 Gemini Chat/Text 接口调用 (解决中转API兼容性问题)
 * 这部分是你最开始需要的优化，用于解决文本和图片识别报错
 */
const callNativeGeminiChat = async (config: ModelConfig, parts: any[], generationConfig?: any, safetySettings?: any): Promise<string> => {
    const apiKey = config.apiKey?.trim() || process.env.API_KEY;
    const baseUrl = getBaseUrl(config, "https://generativelanguage.googleapis.com");
    const model = config.model;
    
    // 强制使用 v1beta 以兼容大多数中转站格式和 Gemini 新模型
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ role: "user", parts: parts }],
        generationConfig: generationConfig || {},
        safetySettings: safetySettings || []
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const errMsg = `Gemini Native Chat Error ${response.status}: ${JSON.stringify(err)}`;
            
            // 处理常见的安全拦截或 Soft Block
            if (response.status === 400 || JSON.stringify(err).includes('SAFETY') || JSON.stringify(err).includes('blockReason')) {
                 throw new Error(`Safety/Block Error: ${JSON.stringify(err)}`);
            }
            throw new Error(errMsg);
        }

        const data = await response.json();
        
        // 解析标准 Gemini Response
        const candidate = data.candidates?.[0];
        if (!candidate) throw new Error("No candidates returned from API");
        
        const text = candidate.content?.parts?.map((p: any) => p.text).join('') || "";
        return text;

    } catch (e: any) {
        logger.err("Native Chat Fetch Exception", e);
        throw e;
    }
};

/**
 * 【保留】原生 Gemini Image Gen 调用 (服务于 gemini-3-pro-image-preview 等)
 */
const callNativeGeminiImageGen = async (config: ModelConfig, prompt: string, shot: Shot, parts: any[]): Promise<string> => {
    const apiKey = config.apiKey?.trim() || process.env.API_KEY;
    const baseUrl = getBaseUrl(config, "https://generativelanguage.googleapis.com");
    const model = config.model;
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ role: "user", parts: parts }],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"], 
            imageConfig: {
                aspectRatio: shot.aspectRatio || "1:1",
                imageSize: shot.imageQuality || "2K"
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const errMsg = `Gemini Native Error ${response.status}: ${JSON.stringify(err)}`;
            if (response.status === 403) throw new Error("403 Permission Denied: 请检查 API Key 权限。");
            throw new Error(errMsg);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate) throw new Error("No candidates returned from API");

        const contentParts = candidate.content?.parts || [];
        for (const part of contentParts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
        
        const textPart = contentParts.find((p: any) => p.text)?.text;
        if (textPart) throw new Error(`Model returned text instead of image: ${textPart}`);
        throw new Error("No image data found in response");

    } catch (e: any) {
        logger.err("Native Fetch Exception", e);
        throw e;
    }
};

// 【恢复】Sora-2 / OpenAI Video Generation - 恢复为 FormData 模式
// 这与你 GitHub 原版代码保持一致，确保 api.wfei.site 可以正常接收图片和参数
const callOpenAIVideo = async (config: ModelConfig, prompt: string, inputImageBase64?: string, aspectRatio: string = "16:9", durationStr: string = "15"): Promise<string> => {
  const apiKey = config.apiKey?.trim() || process.env.API_KEY;
  const baseUrl = getBaseUrl(config, "https://api.wfei.site");
  const endpoint = `${baseUrl}/v1/videos`;
  
  // 关键：使用 FormData 而不是 JSON
  const formData = new FormData();
  formData.append('model', config.model);
  formData.append('prompt', prompt);
  
  const seconds = durationStr.replace(/[^0-9]/g, '') || "15";
  formData.append('seconds', seconds); 

  const sizeMap: Record<string, string> = {
      "16:9": "1920x1080",
      "9:16": "1080x1920",
      "4:3": "1440x1080",
      "3:4": "1080x1440",
      "1:1": "1024x1024"
  };
  const size = sizeMap[aspectRatio] || "1920x1080";
  formData.append('size', size);

  if (inputImageBase64) {
    try {
      // 使用恢复后的 base64ToBlob 处理图片
      const blob = await base64ToBlob(inputImageBase64);
      // 大多数国内中转使用 'input_reference' 或 'file'，这里保留 'input_reference'
      formData.append('input_reference', blob, 'reference_image.png');
    } catch (e) {
      console.warn("Blob conversion failed:", e);
      throw new Error("无法处理参考图，请确保图片有效");
    }
  }

  // 1. Create Task (FormData Upload)
  let taskId: string;
  try {
      const createRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 
            // 注意：FormData 上传不需要手动设置 Content-Type，浏览器会自动设置 boundary
            'Authorization': `Bearer ${apiKey}` 
        },
        body: formData
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        let errMsg = `Status ${createRes.status}`;
        try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error?.message || errJson.message || JSON.stringify(errJson);
        } catch(e) { errMsg = errText; }
        throw new Error(`Video Creation Error: ${errMsg}`);
      }

      const responseData = await createRes.json();
      taskId = responseData.id || responseData.ID || responseData.task_id;
      if (!taskId) throw new Error(`No task ID returned.`);
  } catch (e: any) {
      throw e;
  }

  // 2. Poll Status
  let attempts = 0;
  const maxAttempts = 240; 
  
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000));
    attempts++;
    
    const statusUrl = `${baseUrl}/v1/videos/${taskId}`; 
    let statusData: any = null;

    try {
        const statusRes = await fetch(statusUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          cache: 'no-store'
        });
        if (statusRes.ok) statusData = await statusRes.json();
        else {
            if (statusRes.status !== 404) console.warn(`Polling error ${statusRes.status}`);
            continue;
        }
    } catch (e) { continue; }

    if (statusData) {
        const rawStatus = (statusData.status || statusData.STATE || statusData.data?.status || "").toString().toLowerCase().trim();

        if (['succeeded', 'success', 'completed'].includes(rawStatus)) {
            const resultUrl = statusData.url || statusData.output || statusData.video_url || statusData.data?.video_url || statusData.data?.[0]?.url;
            if (resultUrl) return resultUrl;
            
            try {
                const contentRes = await fetch(`${baseUrl}/v1/videos/${taskId}/content`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                if (contentRes.ok) {
                    const blob = await contentRes.blob();
                    return URL.createObjectURL(blob);
                }
            } catch(e) {}
            throw new Error(`Video completed but URL not found.`);
        }
        
        if (['failed', 'fail', 'error'].includes(rawStatus)) {
            throw new Error(`Task Failed: ${JSON.stringify(statusData.error || statusData.fail_reason)}`);
        }
    }
  }
  throw new Error("Video generation timed out");
};

export const testConnection = async (config: ModelConfig) => {
    if (isGoogleModel(config.model)) {
        // 使用新的 Native Chat 接口测试，确保配置正确
        const responseText = await callNativeGeminiChat(config, [{ text: "Hello, confirm connection." }]);
        if (!responseText) throw new Error("No response text from Gemini");
    } else {
        await callOpenAIChat(config, "You are a helper.", "Hello", false);
    }
};

export const analyzeScriptLineByLine = (script: string): Shot[] => {
    const lines = script.split('\n').filter(l => l.trim());
    return lines.map((line, idx) => ({
        id: Date.now().toString() + idx,
        sceneNumber: '1',
        shotNumber: (idx + 1).toString(),
        originalText: line,
        visualDescription: line,
        cameraAction: '',
        dialogueOrAudio: '',
        duration: '15s',
        positivePrompt: '',
        negativePrompt: '',
        aspectRatio: '1:1', // Default Image 1:1
        videoPrompt: '',
        isGeneratingPrompt: false,
        isGeneratingImage: false,
        isGeneratingVideoPrompt: false,
        isGeneratingVideo: false,
        characterIds: [],
        imageQuality: '2K', // Default 2K
        videoAspectRatio: '16:9' // Default Video 16:9 (User can adjust globally if needed)
    }));
};

export const analyzeScriptTimeBased = async (script: string, config: ModelConfig, templates: PromptTemplates): Promise<Shot[]> => {
    let responseText = "";
    if (isGoogleModel(config.model)) {
        // 替换为 Native Call 以兼容中转
        responseText = await callNativeGeminiChat(
            config, 
            [{ text: templates.breakdownSystemPrompt + `\n\nScript:\n${script}` }]
        );
    } else {
        responseText = await callOpenAIChat(config, templates.breakdownSystemPrompt, script, true);
    }
    
    const parsed = extractJson(responseText);
    if (!Array.isArray(parsed)) throw new Error("Invalid format from AI, expected JSON Array");
    
    return parsed.map((item: any, idx: number) => ({
        id: Date.now().toString() + idx,
        sceneNumber: '1',
        shotNumber: (idx + 1).toString(),
        originalText: item.segment_text || "",
        visualDescription: item.visual_description || item.visual_cue || "",
        cameraAction: item.composition || "",
        dialogueOrAudio: item.audio_cue || "",
        duration: '15s', // Force 15s default
        positivePrompt: '',
        negativePrompt: '',
        aspectRatio: '1:1', // Default Image 1:1
        videoPrompt: '',
        isGeneratingPrompt: false,
        isGeneratingImage: false,
        isGeneratingVideoPrompt: false,
        isGeneratingVideo: false,
        characterIds: [],
        imageQuality: '2K', // Default 2K
        videoAspectRatio: '16:9' // Default Video 16:9
    }));
};

export const generateSinglePromptForShot = async (targetShot: Shot, previousShot: Shot | undefined, sceneShots: Shot[], characters: CharacterProfile[], config: ModelConfig, templates: PromptTemplates = DEFAULT_PROMPT_PRESET): Promise<{ positivePrompt: string; negativePrompt: string; aspectRatio: string }> => {
  let promptText = `${templates.singleShotDeducePrompt}`;
  
  const charContext = characters.map(c => `${c.name}: ${c.description}`).join("\n");
  const fullContextWithChars = `【人物设定】:\n${charContext}\n\n【分镜脚本】:\n` + sceneShots.map(s => `Shot ${s.shotNumber}: ${s.visualDescription}`).join("\n");
  
  let previousVisualInfo = "无 (这是第一镜，请基于人物设定和文案直接创作)";
  if (previousShot) {
      previousVisualInfo = `画面描述: ${previousShot.visualDescription}\n提示词(Prompt): ${previousShot.positivePrompt}`;
  }

  const currentTextInfo = `场景: ${targetShot.sceneNumber}, 镜头: ${targetShot.shotNumber}\n原文: ${targetShot.originalText || targetShot.visualDescription}\n运镜指令: ${targetShot.cameraAction}`;

  if (promptText.includes('{{fullContext}}')) {
      promptText = promptText.replace('{{fullContext}}', fullContextWithChars);
      promptText = promptText.replace('{{previousVisual}}', previousVisualInfo);
      promptText = promptText.replace('{{currentText}}', currentTextInfo);
  } else {
      promptText += `\n【角色设定】：\n${charContext}\n`;
      if (previousShot) { promptText += `\n### 上一镜数据\n【描述】: ${previousShot.visualDescription}\n【持续时间】: ${previousShot.duration}`; }
      const sceneScript = sceneShots.map(s => `Shot ${s.shotNumber}: ${s.visualDescription}`).join("\n");
      promptText += `\n### 全场剧情上下文\n${sceneScript}`;
      promptText += `\n### 当前分镜目标\n${currentTextInfo}`;
  }
  
  logger.req(`Prompt Deduction (Shot ${targetShot.shotNumber})`, { model: config.model, promptLength: promptText.length });

  try {
    if (isGoogleModel(config.model)) {
        
        // Prepare parts
        const textParts = [{ text: promptText }];
        const imageParts: any[] = [];
        
        if (previousShot && previousShot.generatedImage && previousShot.generatedImage.includes(',')) {
            try {
                const base64Data = previousShot.generatedImage.split(',')[1];
                if (base64Data) { 
                    imageParts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
                    imageParts.push({ text: "【参考：上一镜已生成图片 (Previous Generated Image) - 请确保视觉连贯性】" });
                }
            } catch (e) {
                console.warn("Failed to attach previous image", e);
            }
        }
        
        const safetyConfig = [ 
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }, 
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }, 
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }, 
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE } 
        ];

        let responseText = "";
        
        // --- 3-Stage Retry Strategy (Modified to use callNativeGeminiChat) ---
        // 1. Primary Model + Image
        if (imageParts.length > 0) {
            try {
                responseText = await callNativeGeminiChat(config, [...imageParts, ...textParts], {}, safetyConfig);
            } catch (e: any) {
                const errStr = e.message || e.toString();
                // Check if it's a safety block or 400 bad request (Prohibited Content)
                if (errStr.includes('PROHIBITED_CONTENT') || errStr.includes('SAFETY') || errStr.includes('Block') || errStr.includes('400')) {
                    
                    logger.info(`Primary model ${config.model} blocked image, switching to Fallback Model (gemini-2.5-flash) WITH image to preserve logic...`);
                    
                    // 2. Fallback Model + Image
                    try {
                        // Temporarily switch model
                        const fallbackConfig = { ...config, model: 'gemini-2.5-flash' };
                        responseText = await callNativeGeminiChat(fallbackConfig, [...imageParts, ...textParts], {}, safetyConfig);

                    } catch (retryErr: any) {
                        logger.warn("Fallback model also failed with image. Falling back to TEXT ONLY as last resort.");
                        
                        // 3. Final Fallback: Text Only
                        responseText = await callNativeGeminiChat(config, textParts, {}, safetyConfig);
                    }
                } else {
                    throw e; // Network/Auth errors
                }
            }
        } else {
            // No image to begin with
            responseText = await callNativeGeminiChat(config, textParts, {}, safetyConfig);
        }
        
        logger.res(`Prompt Deduction Response`, { text: responseText });

        const result = extractJson(responseText);
        if (result && result.positivePrompt) {
             return { positivePrompt: result.positivePrompt || "", negativePrompt: result.negativePrompt || "", aspectRatio: result.aspectRatio || targetShot.aspectRatio || "1:1" };
        }
        
        return { positivePrompt: responseText, negativePrompt: "", aspectRatio: targetShot.aspectRatio || "1:1" };

    } else {
        const result = await callOpenAIChat(config, "You are a prompt engineer.", promptText, false); 
        const parsed = extractJson(result);
        if (parsed && parsed.positivePrompt) {
             return { positivePrompt: parsed.positivePrompt || "", negativePrompt: parsed.negativePrompt || "", aspectRatio: parsed.aspectRatio || targetShot.aspectRatio || "1:1" };
        } else {
             return { positivePrompt: result as string, negativePrompt: "", aspectRatio: targetShot.aspectRatio || "1:1" };
        }
    }
  } catch (e: any) { 
    logger.err("Prompt Deduction Error", e);
    throw e; 
  }
};

export const generatePromptsForShots = async (shots: Shot[], characters: CharacterProfile[], config: ModelConfig, templates: PromptTemplates): Promise<Shot[]> => {
    const updatedShots = [...shots];
    for (let i = 0; i < updatedShots.length; i++) {
        const shot = updatedShots[i];
        const prev = i > 0 ? updatedShots[i-1] : undefined;
        const sceneShots = updatedShots.filter(s => s.sceneNumber === shot.sceneNumber);
        const res = await generateSinglePromptForShot(shot, prev, sceneShots, characters, config, templates);
        updatedShots[i] = { ...shot, positivePrompt: res.positivePrompt, negativePrompt: res.negativePrompt };
    }
    return updatedShots;
};

export const generateSingleVideoPromptForShot = async (targetShot: Shot, previousShot: Shot | undefined, sceneShots: Shot[], config: ModelConfig, templates: PromptTemplates) => {
    // 1. Extract Previous KF6 for continuity
    let previousKF6 = "无 (这是第一段视频，无需继承)";
    if (previousShot && previousShot.videoPrompt) {
        const match = previousShot.videoPrompt.match(/KF6\s*\|\s*Visual:\s*(.*?)(?=\||\n|$)/i);
        if (match && match[1]) {
            previousKF6 = match[1].trim();
        } else {
            const lines = previousShot.videoPrompt.split('\n').filter(l => l.trim());
            if (lines.length > 0) previousKF6 = lines[lines.length - 1];
        }
    }

    const inputContext = `
### INPUT DATA
1. **当前分镜六宫格图片提示词 (Current Image Prompts)**:
${targetShot.positivePrompt}

2. **当前分镜脚本/文案 (Current Script)**:
${targetShot.originalText || targetShot.visualDescription}

3. **上一段文案对应的 KF6 画面描述 (Previous Shot KF6 - 必须继承)**:
${previousKF6}
`;

    const fullPrompt = templates.videoPromptSystemPrompt + "\n" + inputContext;

    if (isGoogleModel(config.model)) {
        // Prepare parts
        const textParts = [{ text: fullPrompt }];
        const imageParts: any[] = [];
        
        if (targetShot.generatedImage && targetShot.generatedImage.includes(',')) {
             try {
                const base64Data = targetShot.generatedImage.split(',')[1];
                imageParts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
                imageParts.push({ text: "【参考：当前分镜的六宫格分镜图 (Current 6-Panel Storyboard)】" });
            } catch (e) {
                console.warn("Failed to attach image for video prompt deduction", e);
            }
        }

        const safetyConfig = [ 
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }, 
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }, 
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }, 
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE } 
        ];

        let responseText = "";

        // --- Same 3-Stage Retry Strategy for Video Prompts (Modified to use Native) ---
        if (imageParts.length > 0) {
            try {
                responseText = await callNativeGeminiChat(config, [...imageParts, ...textParts], {}, safetyConfig);

            } catch(e: any) {
                const errStr = e.message || e.toString();
                if (errStr.includes('PROHIBITED_CONTENT') || errStr.includes('SAFETY') || errStr.includes('Block') || errStr.includes('400')) {
                    
                    logger.info("Video inference blocked image, switching to Fallback Model (gemini-2.5-flash) WITH image...");
                    
                    try {
                        const fallbackConfig = { ...config, model: 'gemini-2.5-flash' };
                        responseText = await callNativeGeminiChat(fallbackConfig, [...imageParts, ...textParts], {}, safetyConfig);
                    } catch (e2) {
                        logger.warn("Fallback failed, using text-only.");
                        responseText = await callNativeGeminiChat(config, textParts, {}, safetyConfig);
                    }
                } else {
                    throw e;
                }
            }
        } else {
            responseText = await callNativeGeminiChat(config, textParts, {}, safetyConfig);
        }
        
        return { videoPrompt: responseText || "" };
    }
    
    // Fallback for OpenAI
    const res = await callOpenAIChat(config, "Video Prompt Expert", fullPrompt, false);
    return { videoPrompt: res };
};

export const generateVideoPromptsForShots = async (shots: Shot[], config: ModelConfig, templates: PromptTemplates): Promise<Shot[]> => {
    const updated = [...shots];
    for (let i=0; i<updated.length; i++) {
        const res = await generateSingleVideoPromptForShot(updated[i], i>0?updated[i-1]:undefined, updated.filter(s=>s.sceneNumber===updated[i].sceneNumber), config, templates);
        updated[i] = { ...updated[i], videoPrompt: res.videoPrompt };
    }
    return updated;
};

export const generateVisualDetailForShot = async (targetShot: Shot, allShots: Shot[], config: ModelConfig, templates: PromptTemplates) => {
    const prompt = templates.visualDetailSystemPrompt.replace('{{currentText}}', targetShot.originalText || targetShot.visualDescription);
    if (isGoogleModel(config.model)) {
        // 替换为 Native Call
        const responseText = await callNativeGeminiChat(config, [{ text: prompt }]);
        return responseText || "";
    }
    return await callOpenAIChat(config, "Visual Detail Expert", prompt, false);
};

export const generateVisualDetailsForShots = async (shots: Shot[], config: ModelConfig, templates: PromptTemplates): Promise<Shot[]> => {
    const updated = [...shots];
    for(let i=0; i<updated.length; i++) {
        const text = await generateVisualDetailForShot(updated[i], updated, config, templates);
        updated[i] = { ...updated[i], visualDescription: text };
    }
    return updated;
};

export const generateImageForShot = async (shot: Shot, characters: CharacterProfile[], globalRefs: GlobalReferences, refImages: string[], sceneData: SceneData, config: ModelConfig, templates: PromptTemplates) => {
    const prompt = templates.imageGenerationSubmissionPrompt
        .replace('{{positivePrompt}}', shot.positivePrompt)
        .replace('{{cameraAction}}', shot.cameraAction);
    
    const parts: any[] = [];

    // 1. Add Active Character Images (Visual Reference)
    if (shot.characterIds && shot.characterIds.length > 0) {
        shot.characterIds.forEach(charId => {
            const char = characters.find(c => c.id === charId);
            if (char && char.imageUrl && char.imageUrl.includes(',')) {
                try {
                    parts.push({ 
                        inlineData: { 
                            mimeType: 'image/png', 
                            data: char.imageUrl.split(',')[1] 
                        } 
                    });
                    parts.push({ text: `【角色参考: ${char.name}】` });
                } catch(e) {
                    console.warn("Failed to attach character image", e);
                }
            }
        });
    }

    // 2. Add User-Uploaded Style & Layout References (from globalRefs)
    // Style Reference
    if (globalRefs.activeStyleImage && globalRefs.activeStyleImage.includes(',')) {
        try {
            parts.push({
                inlineData: {
                    mimeType: 'image/png', // Assume png for simplicity, or detect
                    data: globalRefs.activeStyleImage.split(',')[1]
                }
            });
            parts.push({ text: "【全局画风参考 (Style Reference)】" });
        } catch (e) {
            console.warn("Failed to attach style reference image", e);
        }
    }

    // Layout Reference
    if (globalRefs.activeLayoutImage && globalRefs.activeLayoutImage.includes(',')) {
        try {
            parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: globalRefs.activeLayoutImage.split(',')[1]
                }
            });
            parts.push({ text: "【布局结构参考 (Layout Reference)】" });
        } catch (e) {
            console.warn("Failed to attach layout reference image", e);
        }
    }

    // 3. Add Previous Shot Reference (if provided)
    refImages.forEach(img => {
        if(img.includes(',')) {
            parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } });
            parts.push({ text: "【上一镜参考 (Visual Consistency)】" });
        }
    });

    // 4. Add the actual text prompt
    parts.push({ text: prompt });

    // --- LOG REQUEST BEFORE SENDING ---
    logger.req(`Image Generation (Shot ${shot.shotNumber})`, { 
        model: config.model, 
        partsCount: parts.length, 
        promptPreview: prompt.substring(0, 150) + "..." 
    });

    // **关键修复：针对 gemini-3-pro-image-preview 使用原生 Fetch 调用，绕过 SDK 限制**
    if (config.model === 'gemini-3-pro-image-preview') {
        return await callNativeGeminiImageGen(config, prompt, shot, parts);
    }

    if (isGoogleModel(config.model)) {
        const ai = getAI(config);
        
        try {
            if (config.model.includes('imagen')) {
                 const res = await ai.models.generateImages({
                     model: config.model,
                     prompt: prompt, 
                     config: { numberOfImages: 1, aspectRatio: shot.aspectRatio }
                 });
                 
                 logger.res(`Image Gen Success (Imagen)`, { generated: 1 });
                 
                 const b64 = res.generatedImages?.[0]?.image?.imageBytes;
                 if(b64) return `data:image/png;base64,${b64}`;
                 throw new Error("No image generated from Imagen");
            } else {
                // Gemini (Flash/Pro)
                // STRICTLY FOLLOW USER DOCUMENTATION FOR CONFIG STRUCTURE
                const imageConfig: any = {
                    aspectRatio: shot.aspectRatio,
                };
                
                // Only Gemini 3 Pro supports imageSize. 
                // Gemini 2.5 Flash Image DOES NOT support imageSize and will throw INVALID_ARGUMENT.
                if (config.model.includes('gemini-3') && config.model.includes('image')) {
                    imageConfig.imageSize = shot.imageQuality || '1K';
                }

                const generationConfig: any = {
                    imageConfig
                };

                // For standard models (flash, etc), allow SDK to handle it
                // We leave responseModalities out for them as SDK might handle it
                const res = await ai.models.generateContent({
                    model: config.model,
                    contents: { parts },
                    config: generationConfig
                });
                
                logger.res(`Image Gen Success (Gemini)`, { parts: res.candidates?.[0]?.content?.parts?.length });

                for (const part of res.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
                throw new Error("No image in response");
            }
        } catch(e: any) {
            // Enhanced Error Logging for 403
            const status = e.status || e.code;
            let msg = e.message;
            if (status === 403 || msg?.includes('PERMISSION_DENIED')) {
                msg = `Permission Denied (403): Your API Key does not support ${config.model}. Please ensure your billing is enabled or use a different model.`;
            }
            
            logger.err(`Image Gen Failed`, { message: msg, code: status });
            throw e;
        }
    } else {
        // DALL-E Mock
        return "data:image/png;base64,mock";
    }
};

export const generateVideoForShot = async (shot: Shot, config: ModelConfig) => {
    // 1. Google / Veo
    if (isGoogleModel(config.model)) {
        const ai = getAI(config);
        const imagePart = shot.generatedImage ? {
            imageBytes: shot.generatedImage.split(',')[1],
            mimeType: 'image/png'
        } : undefined;

        let operation;
        if (imagePart) {
             operation = await ai.models.generateVideos({
                 model: config.model,
                 prompt: shot.videoPrompt,
                 image: imagePart,
                 config: {
                     numberOfVideos: 1,
                     aspectRatio: shot.videoAspectRatio || shot.aspectRatio || '16:9',
                     resolution: '720p'
                 }
             });
        } else {
             operation = await ai.models.generateVideos({
                 model: config.model,
                 prompt: shot.videoPrompt,
                 config: {
                     numberOfVideos: 1,
                     aspectRatio: shot.videoAspectRatio || '16:9',
                     resolution: '720p'
                 }
             });
        }

        while (!operation.done) {
             await new Promise(r => setTimeout(r, 10000));
             operation = await ai.operations.getVideosOperation({ operation });
        }
        
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
            const vidRes = await fetch(`${uri}&key=${config.apiKey?.trim() || process.env.API_KEY}`);
            const blob = await vidRes.blob();
            return URL.createObjectURL(blob);
        }
        throw new Error("No video generated from Veo");
    } 
    
    // 2. OpenAI Compatible / Sora (Proxy)
    else {
        const ar = shot.videoAspectRatio || shot.aspectRatio || '16:9';
        const prompt = shot.videoPrompt || shot.positivePrompt || shot.visualDescription;
        const duration = shot.duration ? shot.duration.replace('s', '') : '15'; // Default to 15 if not present
        
        if (!shot.generatedImage) {
             return await callOpenAIVideo(config, prompt, undefined, ar, duration);
        }
        return await callOpenAIVideo(config, prompt, shot.generatedImage, ar, duration);
    }
};

export const generateSceneAnalysis = async (sceneNumber: string, shots: Shot[], config: ModelConfig, templates: PromptTemplates) => {
    const text = `Scene ${sceneNumber}\n` + shots.map(s => s.visualDescription).join('\n');
    const prompt = `Analyze this scene environment and atmosphere:\n${text}`;
    
    if (isGoogleModel(config.model)) {
        // 替换为 Native Call
        const responseText = await callNativeGeminiChat(config, [{ text: prompt }]);
        return responseText || "";
    }
    return await callOpenAIChat(config, "Scene Analyst", prompt, false);
};

export const generateSceneImages = async (description: string, config: ModelConfig, templates: PromptTemplates) => {
    const images: string[] = [];
    // Mock implementation for 5 angles
    for (let i=0; i<5; i++) {
        if (isGoogleModel(config.model)) {
             // In real app, call generateImageForShot logic here
             // Returning placeholder for now to satisfy interface
             images.push("https://via.placeholder.com/800x450?text=Scene+Angle+" + (i+1)); 
        }
    }
    return images;
};

export const autoMatchCharacters = async (shots: Shot[], characters: CharacterProfile[], config: ModelConfig, templates: PromptTemplates) => {
    // Logic to ask LLM which characters are in which shot
    // For now, return empty map
    return new Map<string, string[]>();
};