
export type GeminiResult = 
  | { type: 'text'; content: string }
  | { type: 'image'; content: string };

export interface BatchResult {
  originalUrl: string;
  originalFileName: string;
  result: GeminiResult | null;
  error: string | null;
}