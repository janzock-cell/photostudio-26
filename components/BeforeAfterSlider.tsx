import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BeforeAfterSliderProps {
  originalUrl: string;
  generatedUrl: string;
  className?: string;
  onImageClick?: (url: string) => void;
  interactionMode?: 'anywhere' | 'handle';
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ 
  originalUrl, 
  generatedUrl, 
  className = "", 
  onImageClick,
  interactionMode = 'anywhere'
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newPos = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(newPos);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
        resize(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isResizing && e.touches.length > 0) {
        resize(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      stopResizing();
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, resize, stopResizing]);

  const handleContainerMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (interactionMode === 'anywhere') {
          startResizing(e);
      }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative select-none overflow-hidden group ${className} ${interactionMode === 'anywhere' ? 'cursor-col-resize' : ''}`}
      onMouseDown={handleContainerMouseDown}
      onTouchStart={handleContainerMouseDown}
    >
      <img 
        src={generatedUrl} 
        alt="After" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
      />
      <img 
        src={originalUrl} 
        alt="Before" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }} 
      />
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white/80 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      />
       <div 
        className="absolute top-1/2 w-8 h-8 -mt-4 bg-white rounded-full shadow-xl flex items-center justify-center z-20 text-gray-800 cursor-col-resize"
        style={{ left: `calc(${sliderPosition}% - 16px)` }}
        onMouseDown={startResizing}
        onTouchStart={startResizing}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(90 10 10)"/>
        </svg>
      </div>
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none backdrop-blur-md">VORHER</div>
      <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none backdrop-blur-md">NACHHER</div>
    </div>
  );
};
export default BeforeAfterSlider;