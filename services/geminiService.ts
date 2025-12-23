import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Bildoptimierung: PNG ist stabiler für die API als JPEG (keine Artefakte)
const optimizeImage = async (file: File | string, maxWidth = 1024, maxHeight = 1024): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof file === 'string' && !file.startsWith('data:') && !file.startsWith('blob:')) {
        img.crossOrigin = "Anonymous";
    }
    
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas Context Error");
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/png');
        const parts = dataUrl.split(',');
        resolve({ data: parts[1], mimeType: 'image/png' });
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("Bild ladefehler"));
    img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
  });
};

const getInputPart = async (imageInput: File | string) => {
  const { data, mimeType } = await optimizeImage(imageInput);
  return { inlineData: { mimeType, data } };
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzeImage = async (imageInput: File | string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const imagePart = await getInputPart(imageInput);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, { text: prompt || "Beschreibe das Bild." }] },
    config: { safetySettings: SAFETY_SETTINGS }
  });
  return response.text || "Keine Antwort erhalten.";
};

export const editImage = async (imageInput: File | string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const imagePart = await getInputPart(imageInput);

  const anatomyLock = `
  [PROTECTED ANATOMY]
  Keep identity 100% intact. Do not change jawline, eye shape, or nose structure.
  Only apply lighting, background changes, or textures as requested.
  `;

  const finalPrompt = `
    TASK: ${prompt}
    ${anatomyLock}
    Maintain original camera perspective and shadows.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, { text: finalPrompt }] },
    config: { 
        responseModalities: [Modality.IMAGE], 
        safetySettings: SAFETY_SETTINGS 
    },
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("Kein Bild generiert. Möglicherweise wurde die Anfrage blockiert.");
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};
