import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { dataUrlToFile } from '../utils/dataUrlToFile';
import Spinner from './Spinner';

interface CropModalProps {
  imageToCrop: {
    url: string;
    index: number;
    fileName: string;
  };
  onClose: () => void;
  onCropSave: (file: File, index: number) => void;
}

const CropModal: React.FC<CropModalProps> = ({ imageToCrop, onClose, onCropSave }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedImageUrl = await getCroppedImg(imageToCrop.url, croppedAreaPixels);
      const newFileName = `cropped-${imageToCrop.fileName}`;
      const croppedImageFile = await dataUrlToFile(croppedImageUrl, newFileName, 'image/png');
      onCropSave(croppedImageFile, imageToCrop.index);
    } catch (e) {
      console.error('Cropping failed', e);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 text-white rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Bild zuschneiden</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="relative flex-grow w-full bg-gray-900 rounded-lg overflow-hidden">
          <Cropper image={imageToCrop.url} crop={crop} zoom={zoom} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div className="py-4">
          <label className="flex justify-between text-sm font-medium text-gray-300 mb-2"><span>Zoom</span><span className="text-indigo-400 font-semibold">{Math.round(zoom * 100)}%</span></label>
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="mt-auto flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Abbrechen</button>
            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 rounded-lg transition-colors">
              {isSaving ? <Spinner/> : 'Zuschnitt speichern'}
            </button>
        </div>
      </div>
    </div>
  );
};
export default CropModal;