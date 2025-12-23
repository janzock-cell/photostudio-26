import React, { useState, useCallback, useEffect } from 'react';
import Spinner from './Spinner';

interface SaveOptionsModalProps {
  data: { url: string; originalFileName: string; };
  onClose: () => void;
}

const SaveOptionsModal: React.FC<SaveOptionsModalProps> = ({ data, onClose }) => {
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [quality, setQuality] = useState(92);
  const [isDownloading, setIsDownloading] = useState(false);

  const getSanitizedFileName = (fileName: string) => {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    return `edited-${nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  };

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    const fileName = `${getSanitizedFileName(data.originalFileName)}.${format}`;
    try {
      const image = new Image();
      image.src = data.url;
      image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(image, 0, 0);
            const dataUrl = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? quality / 100 : undefined);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
      };
    } catch (error) { console.error(error); } 
    finally { setTimeout(() => { setIsDownloading(false); onClose(); }, 300); }
  }, [data, format, quality, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 text-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Bild speichern</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="mb-6"><img src={data.url} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-lg bg-gray-900/50" /></div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFormat('jpeg')} className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${format === 'jpeg' ? 'bg-indigo-600 text-white' : 'bg-gray-700'}`}>JPEG</button>
              <button onClick={() => setFormat('png')} className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${format === 'png' ? 'bg-indigo-600 text-white' : 'bg-gray-700'}`}>PNG</button>
            </div>
          </div>
          {format === 'jpeg' && (
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-300 mb-2"><span>Qualität</span><span className="text-indigo-400 font-semibold">{quality}%</span></label>
              <input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg">Abbrechen</button>
            <button onClick={handleDownload} disabled={isDownloading} className="px-5 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
              {isDownloading ? <Spinner/> : 'Bild speichern'}
            </button>
        </div>
      </div>
    </div>
  );
};
export default SaveOptionsModal;