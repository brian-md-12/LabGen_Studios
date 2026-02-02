import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Scene, ImageSize, ProtocolTemplate, ReportTemplate, User } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";
import { getAdminKeyForCapability, markKeyAsExhausted } from "../config/apiPool";
import { getCurrentUser } from "./authService";

export const apiEvents = new EventTarget();

const isSubscriptionActive = (user: User | null): boolean => {
  // HACKATHON BYPASS: Always return true to allow judges to test everything
  return true;
};

const getAI = (capability: 'text' | 'image' | 'video' | 'tts' | 'search' = 'text') => {
  const user = getCurrentUser();
  const isUserMode = user?.apiMode === 'user';
  
  let apiKey: string = '';
  let keyLabel: string = 'Personal Key';
  
  if (isUserMode) {
    const personalKeys = JSON.parse(localStorage.getItem('labgen_user_keys') || '{}');
    apiKey = personalKeys[capability === 'search' ? 'text' : capability] || personalKeys['primary'] || process.env.API_KEY || '';
  } else {
    // Admin mode uses the pooled keys provided in environment
    const adminKeyObj = getAdminKeyForCapability(capability === 'search' ? 'text' : capability);
    apiKey = adminKeyObj.key;
    keyLabel = adminKeyObj.label;
  }

  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey === '') {
    throw new Error(`API Key for ${capability.toUpperCase()} is missing. Ensure your key is valid in Profile.`);
  }

  return { ai: new GoogleGenAI({ apiKey }), apiKey, keyLabel };
};

const executeWithRetry = async <T>(
  capability: 'text' | 'image' | 'video' | 'tts' | 'search',
  operation: (ai: GoogleGenAI) => Promise<T>,
  retries: number = 2
): Promise<T> => {
  const { ai, apiKey, keyLabel } = getAI(capability);
  try {
    return await operation(ai);
  } catch (error: any) {
    const isQuotaError = error.message?.includes('429') || error.message?.includes('Quota');
    const user = getCurrentUser();
    if (isQuotaError && user?.apiMode === 'admin' && retries > 0) {
      markKeyAsExhausted(apiKey);
      apiEvents.dispatchEvent(new CustomEvent('failover', { 
        detail: { capability, oldKey: keyLabel } 
      }));
      return executeWithRetry(capability, operation, retries - 1);
    }
    throw error;
  }
};

export const validateKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Ping',
      config: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const suggestProjectTitle = async (protocol: string): Promise<string> => {
  if (!protocol || protocol.length < 10) return "Untitled Experiment";
  return executeWithRetry('text', async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a short, professional, 3-5 word scientific project title for this protocol: "${protocol.substring(0, 1000)}". Respond with ONLY the title. No quotes.`,
      config: { maxOutputTokens: 15, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/["']/g, '').trim() || "Untitled Experiment";
  });
};

export const generateSceneAudio = async (text: string, ctx: AudioContext): Promise<AudioBuffer> => {
  return executeWithRetry('tts', async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `You are a professional scientific narrator. 
          Maintain a consistent, clear, and stable pitch. 
          Narrate the following: ${text}` 
        }] 
      }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: "Puck" } 
          } 
        } 
      }
    });
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) throw new Error("TTS engine failed to generate voice bytes.");
    return await decodeAudioData(decodeBase64(data), ctx, 24000);
  });
};

export const parseProtocolToStoryboard = async (text: string): Promise<Scene[]> => {
  if (!text || text.trim().length < 10) throw new Error("Input too short for scientific analysis.");
  return executeWithRetry('text', async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Convert the following laboratory protocol into a high-fidelity visual storyboard for a cinematic instructional video. 
      Format as a JSON array of objects.
      Protocol: ${text}`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scene_number: { type: Type.INTEGER },
              title: { type: Type.STRING },
              visual_prompt: { type: Type.STRING },
              narration_script: { type: Type.STRING }
            },
            required: ["scene_number", "title", "visual_prompt", "narration_script"]
          }
        }
      }
    });
    const content = response.text || "[]";
    const parsed = JSON.parse(content);
    return parsed.map((s: any) => ({ 
      ...s, 
      id: crypto.randomUUID(), 
      isGeneratingImage: false, 
      isGeneratingAudio: false, 
      isGeneratingVideo: false 
    }));
  });
};

export const generateSceneImage = async (prompt: string, size: ImageSize): Promise<string> => {
  return executeWithRetry('image', async (ai) => {
    const isHighRes = size === '2K' || size === '4K';
    const response = await ai.models.generateContent({
      model: isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Cinematic, highly detailed photorealistic laboratory photography: ${prompt}. Natural scientific lighting, 8k resolution, documentary style.` }] },
      config: { imageConfig: { aspectRatio: "16:9", ...(isHighRes ? { imageSize: size } : {}) } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Image synthesis engine returned empty response.");
    return `data:image/png;base64,${part.inlineData.data}`;
  });
};

export const animateSceneWithVeo = async (prompt: string, imageBase64: string): Promise<string> => {
  const { ai, apiKey } = getAI('video');
  const bytes = imageBase64.split(',')[1];
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Smooth cinematic laboratory movement: ${prompt}. Suble focus shifts, realistic fluid motion, 24fps.`,
    image: { imageBytes: bytes, mimeType: 'image/png' },
    config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
  });
  
  if (!operation) throw new Error("VEO production failed to initialize.");

  let startTime = Date.now();
  const TIMEOUT = 300000; 
  while (!operation.done) {
    if (Date.now() - startTime > TIMEOUT) throw new Error("Video generation timed out in VEO engine.");
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
    if (!operation) throw new Error("VEO production session lost.");
  }
  
  const finalResponse = operation.response;
  if (!finalResponse || !finalResponse.generatedVideos || finalResponse.generatedVideos.length === 0) {
    throw new Error("VEO production failed to return a valid result.");
  }
  
  const videoData = finalResponse.generatedVideos[0].video;
  if (!videoData || !videoData.uri) {
    throw new Error("VEO production finished but returned no asset URI.");
  }
  
  const res = await fetch(`${videoData.uri}&key=${apiKey}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const searchProtocol = async (query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  return executeWithRetry('search', async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search professional protocol and detailed scientific procedure for: "${query}". Provide a comprehensive summary.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const candidate = response.candidates?.[0];
    const text = response.text || "No grounded results found.";
    
    const sources: { title: string; uri: string }[] = [];
    if (candidate?.groundingMetadata?.groundingChunks) {
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }
    
    return { text, sources };
  });
};

export const generateReviewMaterial = async (
  role: 'educator' | 'student',
  projectName: string,
  protocol: string,
  scenes: Scene[],
  useSearch: boolean = false
): Promise<string> => {
  return executeWithRetry('text', async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate ${role} material for project "${projectName}". Protocol: ${protocol}. 
      If student: return a JSON array of objects with question, options[], correctIndex, explanation.
      If educator: return Markdown assessment paper.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
        ...(role === 'student' && { responseMimeType: "application/json" }),
        ...(useSearch && { tools: [{ googleSearch: {} }] })
      }
    });
    return response.text || "";
  });
};

export const generateEducatorQuizSchema = async (
  projectName: string,
  protocol: string
): Promise<any[]> => {
  return executeWithRetry('text', async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this lab protocol and synthesize a structured autogradable quiz for project "${projectName}".
      Protocol: ${protocol}
      IMPORTANT: The 'question' string must NOT contain the explanation or answer. The 'explanation' field should contain the reasoning.
      Output strictly as a JSON array of objects: [{question, options:[], correctIndex, explanation, points}].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              points: { type: Type.INTEGER }
            },
            required: ["question", "options", "correctIndex", "explanation", "points"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

export const generateLabReport = async (
  rawProtocol: string,
  settings: ReportTemplate,
  files?: { data: string; mimeType: string; name: string }[]
): Promise<string> => {
  if (!rawProtocol || rawProtocol.length < 10) throw new Error("Insufficient protocol data.");
  return executeWithRetry('text', async (ai) => {
    const parts: any[] = [];
    if (files && files.length > 0) {
      parts.push(...files.map(f => ({ inlineData: { data: f.data, mimeType: f.mimeType } })));
    }
    const prompt = `Act as Scientific Writer. Generate lab report in Markdown. Protocol: ${rawProtocol}. Context: ${settings.additionalContext || ''}. Citation Style: ${settings.citationStyle}.`;
    parts.push({ text: prompt });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts }],
      config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    return response.text || "Report generation failed.";
  });
};

export const generateStructuredEducationalProtocol = async (
  rawProtocol: string,
  settings: ProtocolTemplate & { targetLevel?: string },
  templateFile?: { data: string; mimeType: string }
): Promise<string> => {
  return executeWithRetry('text', async (ai) => {
    const parts: any[] = [];
    if (templateFile) parts.push({ inlineData: { data: templateFile.data, mimeType: templateFile.mimeType } });
    const prompt = `Transform into educator manual. Level: ${settings.targetLevel || "Undergraduate"}. Citation Style: ${settings.citationStyle}. Protocol: ${rawProtocol}`;
    parts.push({ text: prompt });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts }],
      config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    return response.text || "Synthesis failed.";
  });
};