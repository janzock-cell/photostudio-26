import React, { useState, useRef, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import ZoomModal from './components/ZoomModal';
import SaveOptionsModal from './components/SaveOptionsModal';
import CropModal from './components/CropModal';
import AdjustmentPanel, { Adjustments } from './components/AdjustmentPanel';
import MakeupPanel, { MakeupState } from './components/MakeupPanel';
import { analyzeImage, editImage } from './services/geminiService';
import type { BatchResult, GeminiResult } from './types';

declare const __APP_API_KEY__: string;
declare global { interface AIStudio { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void>; } interface Window { aistudio?: AIStudio; } }

const EDIT_KEYWORDS = ['edit', 'change', 'add', 'remove', 'make', 'replace', 'insert', 'put', 'apply', 'transform', 'adjust', 'give', 'enhance', 'generate', 'create', 'convert', 'style', 'retouch', 'retouching', 'swap', 'background', 'bearbeiten', 'ändern', 'hinzufügen', 'entfernen', 'machen', 'ersetzen', 'einfügen', 'anwenden', 'transformieren', 'anpassen', 'geben', 'verbessern', 'generieren', 'erstellen', 'konvertieren', 'stil', 'retusche', 'retuschieren', 'austauschen', 'hintergrund', 'umgebung', 'porträt', 'nahaufnahme', 'bild', 'foto', 'look', 'farbe', 'make-up', 'makeup', 'schwarzweiß', 'monochrom', 'filmkorn', 'vignette', 'szene'];

const BEAUTY_CATEGORIES: Record<string, { name: string, prompt: string }[]> = {
    "Profi Retusche & Details": [
        { name: 'Frequenztrennung (Haut)', prompt: 'Bearbeite die Haut: Wende eine Frequenztrennung an. Behalte die Porenstruktur und feinen Details zu 100% bei. Korrigiere nur sanft Rötungen. Das Bild muss gestochen scharf bleiben.' },
        { name: 'Dodge & Burn (Tiefe)', prompt: 'Bearbeite das Gesicht: Verwende Dodge & Burn, um die Gesichtszüge plastisch herauszuarbeiten. Verstärke Highlights auf Wangenknochen und Nasenrücken, vertiefe sanft die Schatten.' },
        { name: 'Strahlende Augen', prompt: 'Bearbeite die Augen: Erhöhe Helligkeit und Sättigung der Iris leicht, schärfe Details und setze ein klares Glanzlicht (Catchlight). Das Augenweiß soll natürlich wirken.' },
        { name: 'Zähne natürlich aufhellen', prompt: 'Bearbeite die Zähne: Helle sie natürlich auf. Entferne Gelbstich, aber vermeide künstliches "Hollywood-Weiß". Es muss zur Lichtstimmung passen.' },
    ],
    "Haare & Styling": [
        { name: 'Haarfarbe: Blondierung', prompt: 'Färbe die Haare blond, aber behalte die Frisur und Struktur bei.' },
        { name: 'Haarfarbe: Dunkelbraun', prompt: 'Färbe die Haare in ein sattes Dunkelbraun.' },
        { name: 'Haarfarbe: Silbergrau', prompt: 'Färbe die Haare in ein modernes Silbergrau/Weiß.' },
        { name: 'Struktur: Glatt & Sleek', prompt: 'Ändere die Frisur zu einem glatten, eleganten Sleek-Look. Das Gesicht bleibt unverändert.' },
        { name: 'Struktur: Voluminöse Locken', prompt: 'Gib den Haaren viel Volumen und große, glamouröse Locken. Hollywood-Stil.' },
    ],
};

const CREATIVE_CATEGORIES: Record<string, { name: string, prompt: string }[]> = {
    "Cinematic & Licht": [
        { name: 'NYC Golden Hour', prompt: 'Ersetze den Hintergrund durch eine belebte NYC-Straße zur Goldenen Stunde (unscharfe Taxis, Stadtlichter). Behalte die Person im Vordergrund gestochen scharf. Integriere sie photorealistisch in das neue Licht.' },
        { name: 'Red Bokeh Night', prompt: 'Hintergrund ändern: Nächtliche Straße mit vielen roten Rücklichtern im Bokeh. Dramatische, rötliche Lichtreflexe auf der Person.' },
        { name: 'Window Sunlight', prompt: 'Lichtstimmung: Die Person steht an einem Fenster. Hartes Sonnenlicht wirft Schatten der Fensterrahmen auf das Gesicht. Emotionaler, filmischer Look.' },
        { name: 'Cyberpunk Neon', prompt: 'Ändere den Stil zu Cyberpunk: Dunkler Hintergrund, Neonlichter in Pink und Cyan reflektieren auf der Haut. Futuristische Atmosphäre.' },
        { name: 'Studio Noir (B&W)', prompt: 'Konvertiere in Schwarz-Weiß. Dramatische, harte Schatten wie im Film Noir. Hoher Kontrast, mysteriös.' },
    ],
    "Locations & Reise": [
        { name: 'Luxus Yacht', prompt: 'Setze die Person auf eine Luxus-Yacht auf dem offenen Meer. Blauer Himmel, Sonnenschein, teurer Lifestyle Look.' },
        { name: 'Paris Café', prompt: 'Hintergrund ändern: Ein unscharfes, gemütliches Pariser Café im Hintergrund. Morgenlicht, Croissants auf dem Tisch.' },
        { name: 'Tropical Beach', prompt: 'Setze die Person an einen traumhaften, weißen Sandstrand mit türkisfarbenem Wasser. Helles, freundliches Urlaubslicht.' },
        { name: 'Schneelandschaft', prompt: 'Hintergrund ändern: Eine verschneite Winterlandschaft mit Bergen. Kühles Licht, vielleicht leichter Schneefall.' },
        { name: 'Private Jet', prompt: 'Setze die Person in das Interieur eines Privatjets. Luxuriöse Ledersitze, Fensterblick über den Wolken.' },
    ],
    "Kunst & Stile": [
        { name: 'Ölgemälde', prompt: 'Verwandle das Bild in ein klassisches Ölgemälde. Sichtbare Pinselstriche, reiche Textur, künstlerischer Look.' },
        { name: 'Bleistiftzeichnung', prompt: 'Konvertiere das Bild in eine detaillierte Bleistiftzeichnung (Sketch). Graphit-Schattierungen auf Papiertextur.' },
        { name: 'Anime / Manga', prompt: 'Verwandle die Person in einen hochwertigen Anime-Charakter. Große ausdrucksstarke Augen, Cel-Shading, aber behalte die Identität erkennbar.' },
        { name: 'Retro Polaroid 90s', prompt: 'Wende einen 90er Jahre Polaroid-Effekt an. Leicht ausgewaschene Farben, Blitzlicht-Ästhetik, Vintage-Vibe.' },
        { name: 'GTA Loading Screen', prompt: 'Stil: Grand Theft Auto Loading Screen Art. Vektorisierte Illustration, harte Konturen, gesättigte Farben.' },
        { name: 'Statue / Marmor', prompt: 'Verwandle die Person in eine klassische griechische Marmorstatue. Weiße Steinstruktur, museumartige Beleuchtung.' },
    ],
    "Job & Professional": [
        { name: 'LinkedIn (Büro)', prompt: 'Hintergrund ändern: Ein modernes, unscharfes Büro (Glas, helles Holz). Perfekte Ausleuchtung für ein professionelles LinkedIn Profilbild.' },
        { name: 'Studio Grau', prompt: 'Ersetze den Hintergrund durch einen neutralen, dunkelgrauen Studio-Hintergrund mit leichter Vignette. Fokus voll auf dem Gesicht.' },
        { name: 'TED Talk Stage', prompt: 'Setze die Person auf eine dunkle Bühne mit einem roten Scheinwerfer im Hintergrund (TED Talk Atmosphäre). Professionell und inspirierend.' },
    ],
    "Fantasy & Kostüm": [
        { name: 'Wikinger', prompt: 'Kleidung ändern: Gib der Person eine historische Wikinger-Rüstung mit Fellkragen. Hintergrund: Nebliger Fjord. Epische Stimmung.' },
        { name: 'Astronaut', prompt: 'Kleidung ändern: Ein detaillierter NASA Raumanzug. Hintergrund: Weltraumstation oder Mondoberfläche.' },
        { name: 'Elbenkönig(in)', prompt: 'Fantasy Stil: Elegante elbische Gewänder, silberner Haarschmuck. Hintergrund: Leuchtender Wald (Lothlorien Stil).' },
    ]
};

interface ImageItem { file: File | null; url: string; name: string; }
interface AppHistoryState { images: ImageItem[]; results: BatchResult[]; prompt: string; adjustments: Adjustments; makeup: MakeupState; appMode: 'beauty' | 'creative'; keepClothing: boolean; }
interface ZoomedImageState { src: string; originalSrc?: string; }

const DEFAULT_ADJUSTMENTS: Adjustments = { brightness: 0, contrast: 0, saturation: 0, vibrance: 0, structure: 0, faceLight: 0, dodge: 0, burn: 0 };
const DEFAULT_MAKEUP: MakeupState = { lashes: '', eyeliner: '', lipstick: '', eyeshadow: '', blush: '', skin: '' };

const cleanErrorMessage = (error: any): string => {
    let msg = error.message || "Ein unerwarteter Fehler ist aufgetreten.";
    try { if (typeof msg === 'string' && msg.trim().startsWith('{')) msg = JSON.parse(msg).error?.message || msg; } catch (e) {}
    if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) return "Zugriff verweigert. API-Key prüfen.";
    if (msg.includes("400") || msg.includes("INVALID_ARGUMENT")) return "Bildformat nicht unterstützt oder zu groß.";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return "Zu viele Anfragen. Kurze Pause bitte.";
    if (msg.includes("SAFETY") || msg.includes("Safety") || msg.includes("Sicherheit")) return "Sicherheitsfilter hat angeschlagen. Bitte Prompt ändern.";
    if (msg.includes("API_KEY")) return "API Key fehlt. Bitte verknüpfen.";
    return msg;
};

type PanelMode = 'adjustments' | 'makeup'; type AppMode = 'beauty' | 'creative';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [appMode, setAppMode] = useState<AppMode>('creative'); // Startet jetzt standardmäßig in Creative FX
  const [images, setImages] = useState<ImageItem[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [keepClothing, setKeepClothing] = useState<boolean>(true); // Kleidung beibehalten Toggle
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [makeup, setMakeup] = useState<MakeupState>(DEFAULT_MAKEUP);
  const [activePanel, setActivePanel] = useState<PanelMode>('makeup');
  const [isCreativeAdjustmentsOpen, setIsCreativeAdjustmentsOpen] = useState<boolean>(false); // Ausklappbares Technik-Panel
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<ZoomedImageState | null>(null);
  const [saveModalData, setSaveModalData] = useState<{ url: string; originalFileName: string } | null>(null);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; index: number; fileName: string } | null>(null);

  const [hasApiKey, setHasApiKey] = useState<boolean>(() => {
    try { if (process.env.API_KEY) return true; } catch (e) {}
    if (typeof __APP_API_KEY__ !== 'undefined' && __APP_API_KEY__) return true;
    if (typeof window !== 'undefined') { const urlParams = new URLSearchParams(window.location.search); if (urlParams.get('key') || urlParams.get('apiKey')) return true; }
    return false;
  });

  const [history, setHistory] = useState<AppHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isRestoringHistory = useRef(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  
  const saveStateToHistory = (state: AppHistoryState) => {
    if (isRestoringHistory.current) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  useEffect(() => { saveStateToHistory({ images, results, prompt, adjustments, makeup, appMode, keepClothing }); return () => { objectUrlsRef.current.forEach(URL.revokeObjectURL); }; }, []);

  useEffect(() => {
    if (hasApiKey) return;
    if (window.aistudio) { window.aistudio.hasSelectedApiKey().then(found => { if(found) setHasApiKey(true); }); }
  }, [hasApiKey]);

  const handleApiKeySelect = async () => {
      if (window.aistudio) {
          try { await window.aistudio.openSelectKey(); const selected = await window.aistudio.hasSelectedApiKey(); if (selected) setHasApiKey(true); return selected; } 
          catch (e) { console.error("Error selecting API key", e); return false; }
      } return false;
  };

  const restoreStateFromHistory = (index: number) => {
    if (index < 0 || index >= history.length) return;
    isRestoringHistory.current = true;
    const stateToRestore = history[index];
    setImages(stateToRestore.images); setResults(stateToRestore.results); setPrompt(stateToRestore.prompt);
    setAdjustments(stateToRestore.adjustments || DEFAULT_ADJUSTMENTS); setMakeup(stateToRestore.makeup || DEFAULT_MAKEUP);
    setAppMode(stateToRestore.appMode || 'creative'); setKeepClothing(stateToRestore.keepClothing ?? true);
    setHistoryIndex(index);
    setTimeout(() => { isRestoringHistory.current = false; }, 0);
  };
  
  const handleUndo = () => historyIndex > 0 && restoreStateFromHistory(historyIndex - 1);
  const handleRedo = () => historyIndex < history.length - 1 && restoreStateFromHistory(historyIndex + 1);

  const handleImagesSelect = (files: File[]) => {
    const newImagesData = files.map(file => { const url = URL.createObjectURL(file); objectUrlsRef.current.push(url); return { file, url, name: file.name }; });
    const newImages = [...images, ...newImagesData];
    const newResults: BatchResult[] = [];
    setImages(newImages); setError(null); setResults(newResults);
    saveStateToHistory({ images: newImages, results: newResults, prompt, adjustments, makeup, appMode, keepClothing });
  };

  const handleImageRemove = (index: number) => {
    const newImages = [...images]; const removed = newImages.splice(index, 1);
    if (removed[0].url.startsWith('blob:')) { URL.revokeObjectURL(removed[0].url); objectUrlsRef.current = objectUrlsRef.current.filter(url => url !== removed[0].url); }
    setImages(newImages); saveStateToHistory({ images: newImages, results, prompt, adjustments, makeup, appMode, keepClothing });
  };

  const handleSuggestionClick = (suggestionPrompt: string) => { setPrompt(suggestionPrompt); promptTextareaRef.current?.focus(); saveStateToHistory({ images, results, prompt: suggestionPrompt, adjustments, makeup, appMode, keepClothing }); };
  const handleAdjustmentChange = (key: keyof Adjustments, value: number) => { const newAdjustments = { ...adjustments, [key]: value }; setAdjustments(newAdjustments); saveStateToHistory({ images, results, prompt, adjustments: newAdjustments, makeup, appMode, keepClothing }); };
  const handleMakeupChange = (key: keyof MakeupState, value: string) => { const newMakeup = { ...makeup, [key]: value }; setMakeup(newMakeup); saveStateToHistory({ images, results, prompt, adjustments, makeup: newMakeup, appMode, keepClothing }); };
  const handleResetAdjustments = () => { setAdjustments(DEFAULT_ADJUSTMENTS); saveStateToHistory({ images, results, prompt, adjustments: DEFAULT_ADJUSTMENTS, makeup, appMode, keepClothing }); };
  const handleResetMakeup = () => { setMakeup(DEFAULT_MAKEUP); saveStateToHistory({ images, results, prompt, adjustments, makeup: DEFAULT_MAKEUP, appMode, keepClothing }); };

  const handleReset = () => {
    objectUrlsRef.current.forEach(URL.revokeObjectURL); objectUrlsRef.current = [];
    const initialState = { images: [], prompt: '', results: [], adjustments: DEFAULT_ADJUSTMENTS, makeup: DEFAULT_MAKEUP, appMode: appMode, keepClothing: true };
    setImages(initialState.images); setPrompt(initialState.prompt); setResults(initialState.results); setAdjustments(initialState.adjustments); setMakeup(initialState.makeup); setKeepClothing(true);
    setError(null); setIsLoading(false); setProcessingStatus(null);
    saveStateToHistory({ ...initialState, appMode });
  };
  
  const handleUseResultAsSource = async (resultIndex: number) => {
    const resultItem = results[resultIndex];
    if (isLoading || !resultItem?.result || resultItem.result.type !== 'image') return;
    try {
      const newFileName = `edited-${images[resultIndex].name}`; const newUrl = resultItem.result.content;
      const newImages = [...images]; if (newImages[resultIndex].url.startsWith('blob:')) URL.revokeObjectURL(newImages[resultIndex].url);
      newImages[resultIndex] = { file: null, url: newUrl, name: newFileName };
      const newResults = results.map((res, idx) => idx === resultIndex ? { originalUrl: newUrl, originalFileName: newFileName, result: null, error: null } : res);
      setImages(newImages); setResults(newResults); setPrompt(""); setAdjustments(DEFAULT_ADJUSTMENTS); setMakeup(DEFAULT_MAKEUP);
      saveStateToHistory({ images: newImages, results: newResults, prompt: "", adjustments: DEFAULT_ADJUSTMENTS, makeup: DEFAULT_MAKEUP, appMode, keepClothing });
    } catch(e) { setError("Fehler beim Übernehmen."); }
  };

  const handleCropSave = async (croppedImageFile: File, index: number) => {
    const newUrl = URL.createObjectURL(croppedImageFile); objectUrlsRef.current.push(newUrl);
    const newImages = [...images]; if (newImages[index].url.startsWith('blob:')) URL.revokeObjectURL(newImages[index].url);
    newImages[index] = { file: croppedImageFile, url: newUrl, name: croppedImageFile.name };
    const newResults = [...results]; if (newResults[index]) { newResults[index] = { ...newResults[index], originalUrl: newUrl, originalFileName: croppedImageFile.name }; }
    setImages(newImages); setResults(newResults); setImageToCrop(null); 
    saveStateToHistory({ images: newImages, results: newResults, prompt, adjustments, makeup, appMode, keepClothing });
  };

  const getFullPrompt = () => {
        let fullPrompt = prompt; const promptParts: string[] = [];
        
        // Kleidung Toggle Logik
        if (keepClothing) {
            promptParts.push("KEEP CLOTHING: Maintain the subject's original clothing, style, color, and fabric. Do not modify the garments.");
        } else {
            promptParts.push("RESTYLE: You are encouraged to change the subject's clothing to match the requested scene or style.");
        }

        const hasAdjustments = Object.values(adjustments).some(val => val !== 0);
        if (hasAdjustments) {
            const adj = [];
            if (adjustments.structure !== 0) adj.push(adjustments.structure > 0 ? `DETAIL: Enhance texture by ${adjustments.structure}%` : `SOFTEN: Smooth texture by ${Math.abs(adjustments.structure)}%`);
            if (adjustments.brightness !== 0) adj.push(`BRIGHTNESS: ${adjustments.brightness}%`); 
            if (adjustments.contrast !== 0) adj.push(`CONTRAST: ${adjustments.contrast}%`);
            if (adjustments.saturation !== 0) adj.push(`SATURATION: ${adjustments.saturation}%`);
            if (adjustments.vibrance !== 0) adj.push(`VIBRANCE: ${adjustments.vibrance}%`);
            if (adjustments.faceLight !== 0) adj.push(`FACE LIGHTING: ${adjustments.faceLight > 0 ? 'Lighten' : 'Darken'} face by ${Math.abs(adjustments.faceLight)}%`);
            if (adjustments.dodge !== 0) adj.push(`DODGE: Boost highlights (+${adjustments.dodge})`);
            if (adjustments.burn !== 0) adj.push(`BURN: Deepen shadows (+${adjustments.burn})`);
            promptParts.push("TECHNICAL ADJUSTMENTS: " + adj.join(", ") + ".");
        }
        const hasMakeup = Object.values(makeup).some(val => val !== '');
        if (hasMakeup) {
            const mk = [];
            if (makeup.lipstick) mk.push(`Lips: ${makeup.lipstick}`);
            if (makeup.eyeliner) mk.push(`Eyeliner: ${makeup.eyeliner}`);
            if (makeup.lashes) mk.push(`Lashes: ${makeup.lashes}`);
            if (makeup.eyeshadow) mk.push(`Eyeshadow: ${makeup.eyeshadow}`);
            if (makeup.blush) mk.push(`Blush: ${makeup.blush}`);
            if (makeup.skin) mk.push(`Complexion: ${makeup.skin}`);
            promptParts.push("MAKEUP STYLE: " + mk.join(", ") + ".");
        }
        if (promptParts.length > 0) fullPrompt = fullPrompt ? `${fullPrompt}\n\n${promptParts.join('\n')}` : promptParts.join('\n');
        return { fullPrompt, hasAdjustments: hasAdjustments || hasMakeup };
  };

  const handleRetry = async (index: number) => {
    if (isLoading) return;
    setIsLoading(true);
    let currentResults = [...results]; currentResults[index] = { ...currentResults[index], result: null, error: null };
    setResults(currentResults); setProcessingStatus(`Versuche Bild ${index + 1} erneut...`);
    const { fullPrompt, hasAdjustments } = getFullPrompt();
    const isEditRequest = hasAdjustments || EDIT_KEYWORDS.some(keyword => fullPrompt.toLowerCase().includes(keyword));
    try {
        const inputImage = images[index].file ? images[index].file! : images[index].url;
        const result = await (isEditRequest ? editImage : analyzeImage)(inputImage, fullPrompt);
        const geminiResult: GeminiResult = isEditRequest ? { type: 'image', content: result } : { type: 'text', content: result };
        currentResults = [...currentResults]; currentResults[index] = { ...currentResults[index], result: geminiResult, error: null };
        setResults(currentResults);
        saveStateToHistory({ images, results: currentResults, prompt, adjustments, makeup, appMode, keepClothing });
    } catch (e: any) {
        const errorMessage = cleanErrorMessage(e);
        if (errorMessage.includes("Zugriff verweigert") || errorMessage.includes("API Key")) { setHasApiKey(false); setError(errorMessage); }
        currentResults = [...currentResults]; currentResults[index] = { ...currentResults[index], error: errorMessage };
        setResults(currentResults);
    } finally { setIsLoading(false); setProcessingStatus(null); }
  };

  const handleSubmit = async () => {
    if (!hasApiKey) { const success = await handleApiKeySelect(); if (!success) { setError("Bitte verknüpfe einen API Key."); return; } }
    const { fullPrompt, hasAdjustments } = getFullPrompt();
    if (images.length === 0 || (!prompt && !hasAdjustments)) { setError('Bitte lade ein Bild hoch und gib einen Prompt ein.'); return; }
    setIsLoading(true); setError(null);
    const isEditRequest = hasAdjustments || EDIT_KEYWORDS.some(keyword => fullPrompt.toLowerCase().includes(keyword));
    const initialResults: BatchResult[] = images.map(img => ({ originalUrl: img.url, originalFileName: img.name, result: null, error: null }));
    setResults(initialResults); let finalResults = [...initialResults];

    for (let i = 0; i < images.length; i++) {
      setProcessingStatus(`Generiere ${i + 1} von ${images.length}...`);
      try {
        const inputImage = images[i].file ? images[i].file! : images[i].url;
        const result = await (isEditRequest ? editImage : analyzeImage)(inputImage, fullPrompt);
        const geminiResult: GeminiResult = isEditRequest ? { type: 'image', content: result } : { type: 'text', content: result };
        finalResults[i] = { ...finalResults[i], result: geminiResult };
        setResults(prev => { const updated = [...prev]; updated[i] = { ...updated[i], result: geminiResult }; return updated; });
      } catch (e: any) {
        const errorMessage = cleanErrorMessage(e);
        if (errorMessage.includes("Zugriff verweigert") || errorMessage.includes("API Key")) { setHasApiKey(false); setError("Zugriff verweigert."); setIsLoading(false); return; }
        finalResults[i] = { ...finalResults[i], error: errorMessage };
        setResults(prev => { const updated = [...prev]; updated[i] = { ...updated[i], error: errorMessage }; return updated; });
      }
    }
    saveStateToHistory({images, results: finalResults, prompt, adjustments, makeup, appMode, keepClothing});
    setIsLoading(false); setProcessingStatus(null);
  };

  const handleImageClick = (src: string, originalSrc?: string) => setZoomedImage({ src, originalSrc });
  const currentSuggestions = appMode === 'beauty' ? BEAUTY_CATEGORIES : CREATIVE_CATEGORIES;
  const mainGradient = isDarkMode ? (appMode === 'beauty' ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-gray-900 to-black' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black') : (appMode === 'beauty' ? 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100' : 'bg-gradient-to-br from-pink-50 via-white to-purple-100');
  const accentText = isDarkMode ? (appMode === 'beauty' ? 'text-indigo-400' : 'text-pink-400') : (appMode === 'beauty' ? 'text-indigo-600' : 'text-pink-600');
  const cardBg = isDarkMode ? 'bg-gray-800/40 backdrop-blur-md border border-white/10 shadow-xl' : 'bg-white/80 backdrop-blur-md border border-white/40 shadow-xl';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const buttonActive = appMode === 'beauty' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]';

  return (
    <>
      <div className={`min-h-screen ${textColor} font-sans transition-colors duration-700 ${mainGradient}`}>
        <div className={`fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0`}>
             <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${appMode === 'beauty' ? 'bg-indigo-600' : 'bg-pink-600'}`}></div>
             <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${appMode === 'beauty' ? 'bg-blue-600' : 'bg-purple-600'}`}></div>
        </div>
        <div className="absolute top-4 right-4 z-50">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-gray-800 hover:bg-black/10'}`}>
             {isDarkMode ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>
        <div className="relative container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 z-10">
          <header className="flex flex-col items-center mb-10">
            <div className={`${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/60 border-gray-200'} backdrop-blur-lg p-1.5 rounded-full flex shadow-2xl border mb-6 transition-colors`}>
              <button onClick={() => setAppMode('creative')} className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${appMode === 'creative' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>CREATIVE FX</button>
              <button onClick={() => setAppMode('beauty')} className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${appMode === 'beauty' ? 'bg-indigo-600 text-white shadow-lg' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>BEAUTY STUDIO</button>
            </div>
            <div className="flex flex-col items-center text-center">
                <h1 className={`text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${appMode === 'beauty' ? (isDarkMode ? 'from-indigo-200 via-white to-indigo-200' : 'from-indigo-600 via-purple-600 to-indigo-600') : (isDarkMode ? 'from-pink-300 via-purple-300 to-indigo-300' : 'from-pink-600 via-purple-600 to-indigo-600')} mb-2 tracking-tight`}>photo-sudio-26 go</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium`}>Powered by M.J</span>
                    {hasApiKey && <span className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-xs font-bold border border-green-500/20"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>API Key aktiv</span>}
                </div>
            </div>
          </header>
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-4 rounded-xl backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(239,68,68,0.1)]"><strong className="font-bold">System Alert: </strong>{error}</div>}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className={`${cardBg} p-6 rounded-2xl`}>
                <ImageUploader onImagesSelect={handleImagesSelect} images={images} onImageRemove={handleImageRemove} onImageClick={(url) => handleImageClick(url)} onImageCrop={(index) => setImageToCrop({ url: images[index].url, index, fileName: images[index].name })} isDarkMode={isDarkMode} />
              </div>
              <div className={`${cardBg} p-6 rounded-2xl transition-all duration-500`}>
                 <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <label htmlFor="prompt" className={`text-sm font-bold uppercase tracking-wider ${accentText}`}>Prompt & Wünsche</label>
                    <button 
                      onClick={() => setKeepClothing(!keepClothing)} 
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${keepClothing ? (isDarkMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        {keepClothing ? <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l.395.072 4 1.333A1 1 0 0116 6.676V11a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1a1 1 0 00-1-1h-1a1 1 0 00-1 1v1a1 1 0 01-1 1H7a1 1 0 01-1-1V6.676a1 1 0 01.605-.915l4-1.333.395-.072V3a1 1 0 011-1z" clipRule="evenodd" />}
                      </svg>
                      {keepClothing ? 'KLEIDUNG BEIBEHALTEN' : 'KLEIDUNG WECHSELN'}
                    </button>
                  </div>
                  <textarea id="prompt" ref={promptTextareaRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={appMode === 'beauty' ? "Beschreibe die Retusche..." : "Beschreibe den Look..."} className={`w-full h-28 p-4 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 resize-none placeholder-gray-500 ${isDarkMode ? 'bg-black/30 border-white/10 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${appMode === 'beauty' ? 'focus:ring-indigo-500' : 'focus:ring-pink-500'}`} disabled={isLoading} />
                  
                  {appMode === 'beauty' && (
                    <div className="mt-6">
                      <div className={`flex rounded-lg p-1 border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                        <button onClick={() => setActivePanel('makeup')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activePanel === 'makeup' ? (isDarkMode ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-800 shadow') : 'text-gray-500'}`}>Kosmetik</button>
                        <button onClick={() => setActivePanel('adjustments')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activePanel === 'adjustments' ? (isDarkMode ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-800 shadow') : 'text-gray-500'}`}>Technik</button>
                      </div>
                      <div className="mt-4">
                          {activePanel === 'adjustments' ? <AdjustmentPanel values={adjustments} onChange={handleAdjustmentChange} onReset={handleResetAdjustments} disabled={isLoading} isDarkMode={isDarkMode} /> : <MakeupPanel values={makeup} onChange={handleMakeupChange} onReset={handleResetMakeup} disabled={isLoading} isDarkMode={isDarkMode} />}
                      </div>
                    </div>
                  )}

                  {appMode === 'creative' && (
                    <div className="mt-4">
                      <button 
                        onClick={() => setIsCreativeAdjustmentsOpen(!isCreativeAdjustmentsOpen)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isCreativeAdjustmentsOpen ? (isDarkMode ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-pink-50 border-pink-200 text-pink-700') : (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400')}`}
                      >
                        <span className="flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                           Technik-Nachjustierung
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isCreativeAdjustmentsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                      {isCreativeAdjustmentsOpen && (
                        <div className={`mt-3 p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                           <AdjustmentPanel values={adjustments} onChange={handleAdjustmentChange} onReset={handleResetAdjustments} disabled={isLoading} isDarkMode={isDarkMode} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col gap-3 mt-6 pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                   <div className="flex gap-2">
                       <button onClick={handleUndo} disabled={isLoading || historyIndex <= 0} className={`flex-1 p-3 rounded-xl disabled:opacity-30 border ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600 text-white border-white/5' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg></button>
                       <button onClick={handleRedo} disabled={isLoading || historyIndex >= history.length - 1} className={`flex-1 p-3 rounded-xl disabled:opacity-30 border ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600 text-white border-white/5' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" /></svg></button>
                       <button onClick={handleReset} disabled={isLoading} className={`flex-1 font-bold p-3 rounded-xl disabled:opacity-30 border text-sm ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600 text-white border-white/5' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}>RESET</button>
                   </div>
                   <button onClick={handleSubmit} disabled={isLoading || images.length === 0} className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${buttonActive}`}>
                        {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner /> {processingStatus || 'Verarbeite...'}</span> : (appMode === 'beauty' ? 'RETUSCHE STARTEN' : 'LOOK GENERIEREN')}
                    </button>
                </div>
              </div>
              <div className={`${cardBg} p-6 rounded-2xl`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${accentText} ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>{appMode === 'beauty' ? 'Profi-Retusche & Styling' : 'Creative Inspiration'}</h3>
                <div className="space-y-5">
                    {Object.entries(currentSuggestions).map(([category, items]) => (
                        <div key={category}>
                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{category}</h4>
                            <div className="flex flex-wrap gap-2">
                                {items.map((suggestion) => (
                                    <button key={suggestion.name} onClick={() => handleSuggestionClick(suggestion.prompt)} disabled={isLoading} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${appMode === 'beauty' ? (isDarkMode ? 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-indigo-100 hover:border-indigo-300 hover:text-indigo-900') : (isDarkMode ? 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-pink-600 hover:border-pink-500 hover:text-white' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-pink-100 hover:border-pink-300 hover:text-pink-900')}`}>{suggestion.name}</button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            </div>
            <div className={`lg:col-span-7 ${cardBg} p-1 rounded-2xl min-h-[600px] flex flex-col`}>
              <div className="p-4 flex-grow relative">
                  <ResultDisplay results={results} onImageClick={handleImageClick} onUseResultAsSource={handleUseResultAsSource} onSaveClick={(url, originalFileName) => setSaveModalData({ url, originalFileName })} onRetry={handleRetry} isDarkMode={isDarkMode} />
                  {isLoading && !processingStatus && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10"><Spinner /><p className={`${accentText} font-medium animate-pulse tracking-wide`}>Künstliche Intelligenz arbeitet...</p></div>}
              </div>
            </div>
          </main>
          <footer className={`mt-12 text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} pb-8 opacity-60`}><p>photo-sudio-26 go &copy; 2025 • Powered by M.J</p></footer>
        </div>
      </div>
      {zoomedImage && <ZoomModal src={zoomedImage.src} originalSrc={zoomedImage.originalSrc} onClose={() => setZoomedImage(null)} />}
      {saveModalData && <SaveOptionsModal data={saveModalData} onClose={() => setSaveModalData(null)} />}
      {imageToCrop && <CropModal imageToCrop={imageToCrop} onClose={() => setImageToCrop(null)} onCropSave={handleCropSave} />}
    </>
  );
};
export default App;