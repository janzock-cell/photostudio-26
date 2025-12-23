import React from 'react';

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  structure: number;
  faceLight: number;
  dodge: number;
  burn: number;
}

interface AdjustmentPanelProps {
  values: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
  onReset: () => void;
  disabled?: boolean;
  isDarkMode?: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ values, onChange, onReset, disabled, isDarkMode = true }) => {
  const sliders: { key: keyof Adjustments; label: string; min: number; max: number }[] = [
    { key: 'structure', label: 'Struktur / Details', min: -50, max: 50 },
    { key: 'faceLight', label: 'Gesichts-Aufhellung', min: -50, max: 50 },
    { key: 'brightness', label: 'Helligkeit', min: -50, max: 50 },
    { key: 'contrast', label: 'Kontrast', min: -50, max: 50 },
    { key: 'saturation', label: 'Sättigung', min: -50, max: 50 },
    { key: 'vibrance', label: 'Dynamik', min: -50, max: 50 },
    { key: 'dodge', label: 'Dodge (Highlights)', min: -10, max: 10 },
    { key: 'burn', label: 'Burn (Schatten)', min: -10, max: 10 },
  ];

  const containerClass = isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-100/50 border-gray-200';
  const labelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueColorActive = isDarkMode ? 'text-indigo-400' : 'text-indigo-600';
  const valueColorInactive = isDarkMode ? 'text-gray-600' : 'text-gray-400';
  const sliderBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-300';

  return (
    <div className="bg-transparent pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {sliders.map(({ key, label, min, max }) => (
          <div key={key} className={`p-2.5 rounded-lg border ${containerClass}`}>
            <div className={`flex justify-between text-[10px] uppercase font-bold mb-1.5 tracking-wider ${labelColor}`}>
              <span>{label}</span>
              <span className={`font-mono ${values[key] !== 0 ? valueColorActive : valueColorInactive}`}>
                {values[key] > 0 ? '+' : ''}{values[key]}
              </span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] text-gray-500 w-4 text-right">{min}</span>
               <input
                type="range"
                min={min}
                max={max}
                value={values[key]}
                onChange={(e) => onChange(key, parseInt(e.target.value, 10))}
                disabled={disabled}
                className={`flex-grow h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all ${sliderBg}`}
              />
               <span className="text-[9px] text-gray-500 w-4">+{max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdjustmentPanel;