import React, { useState, useRef, useEffect, useCallback } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';

interface ZoomModalProps {
  src: string;
  originalSrc?: string;
  onClose: () => void;
}

const ZoomModal: React.FC<ZoomModalProps> = ({ src, originalSrc, onClose }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1 || originalSrc) {
        isDragging.current = true;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  
  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); };
  const zoomIn = () => setScale(s => Math.min(s + 0.2, 5));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()} onWheel={handleWheel} onMouseDown={handleMouseDown}>
        <div style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`, cursor: scale > 1 ? 'grab' : 'default', maxWidth: '90vw', maxHeight: '90vh', width: '100%', height: '100%' }} className="transition-transform duration-100 ease-out flex items-center justify-center">
            {originalSrc ? <BeforeAfterSlider originalUrl={originalSrc} generatedUrl={src} className="max-w-full max-h-full w-full h-full object-contain" interactionMode="handle" /> : <img src={src} alt="Zoomed view" className="max-w-full max-h-full object-contain pointer-events-none" />}
        </div>
      </div>
      <div className="absolute top-4 right-4 flex gap-2"><button onClick={onClose} className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-800/80 p-2 rounded-full">
            <button onClick={zoomOut} className="p-2 rounded-full hover:bg-gray-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg></button>
            <button onClick={resetZoom} className="p-2 rounded-full hover:bg-gray-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg></button>
            <button onClick={zoomIn} className="p-2 rounded-full hover:bg-gray-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></button>
        </div>
    </div>
  );
};
export default ZoomModal;