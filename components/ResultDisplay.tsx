import React from 'react';
import type { BatchResult, GeminiResult } from '../types';
import BeforeAfterSlider from './BeforeAfterSlider';

interface ResultDisplayProps {
  results: BatchResult[];
  onImageClick: (url: string, originalUrl?: string) => void;
  onUseResultAsSource: (index: number) => void;
  onSaveClick: (url: string, originalFileName: string) => void;
  onRetry: (index: number) => void;
  isDarkMode?: boolean;
}

const ResultItem: React.FC<{ 
    item: BatchResult, index: number, onImageClick: (url: string, originalUrl?: string) => void,
    onUseResultAsSource: (index: number) => void, onSaveClick: (url: string, originalFileName: string) => void;
    onRetry: (index: number) => void; isDarkMode?: boolean;
}> = ({ item, index, onImageClick, onUseResultAsSource, onSaveClick, onRetry, isDarkMode = true }) => {
    const { originalUrl, originalFileName, result, error } = item;
    const containerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    
    return (
        <div className={`${containerClass} rounded-xl overflow-hidden border shadow-lg`}>
            <div className={`p-3 border-b flex justify-between items-center ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`text-sm font-medium truncate max-w-[60%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{originalFileName}</span>
                <div className="flex gap-2">
                     {result?.type === 'image' && (
                        <>
                            <button onClick={() => onUseResultAsSource(index)} className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"><span>Weiterbearbeiten</span></button>
                            <button onClick={() => onSaveClick(result.content, originalFileName)} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded flex items-center gap-1 transition-colors">Speichern</button>
                        </>
                    )}
                </div>
            </div>
            <div className={`relative w-full aspect-[4/3] ${isDarkMode ? 'bg-black/40' : 'bg-gray-100'}`}>
                {error ? (
                     <div className={`absolute inset-0 flex items-center justify-center p-6 text-center backdrop-blur-sm z-10 ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'}`}>
                        <div className="flex flex-col items-center gap-3 max-w-sm">
                            <p className={`${isDarkMode ? 'text-red-200' : 'text-red-600'} text-sm font-medium leading-relaxed`}>{error}</p>
                            <button onClick={() => onRetry(index)} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">Erneut versuchen</button>
                        </div>
                     </div>
                ) : result?.type === 'image' ? (
                     <BeforeAfterSlider originalUrl={originalUrl} generatedUrl={result.content} onImageClick={(url) => onImageClick(url, originalUrl)} className="w-full h-full" />
                ) : result?.type === 'text' ? (
                    <div className={`w-full h-full overflow-y-auto p-4 font-mono text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{result.content}</div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <svg className="animate-spin h-8 w-8 mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-sm font-medium animate-pulse">Bild wird verarbeitet...</span>
                         <img src={originalUrl} className="absolute inset-0 w-full h-full object-contain opacity-10 -z-10" alt="loading preview" />
                    </div>
                )}
            </div>
        </div>
    );
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, onImageClick, onUseResultAsSource, onSaveClick, onRetry, isDarkMode = true }) => {
  return (
    <div className="w-full h-full flex flex-col min-h-[500px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Ergebnisse</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-600 bg-gray-200'}`}>{results.length} Elemente</span>
      </div>
      <div className={`w-full flex-grow border border-dashed rounded-xl p-4 overflow-y-auto ${isDarkMode ? 'bg-gray-800/20 border-gray-700' : 'bg-gray-100/50 border-gray-300'}`}>
        {results.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-center text-gray-500">
            <div className="max-w-xs">
              <h3 className="text-lg font-medium mb-1">Noch keine Ergebnisse</h3>
              <p className="text-sm">Lade ein Bild hoch und wähle einen Stil.</p>
            </div>
          </div>
        )}
        {results.length > 0 && (
            <div className="grid grid-cols-1 gap-8">
                {results.map((item, index) => <ResultItem key={`${item.originalUrl}-${index}`} item={item} index={index} onImageClick={onImageClick} onUseResultAsSource={onUseResultAsSource} onSaveClick={onSaveClick} onRetry={onRetry} isDarkMode={isDarkMode} />)}
            </div>
        )}
      </div>
    </div>
  );
};
export default ResultDisplay;