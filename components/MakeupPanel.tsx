import React from 'react';

export interface MakeupState {
  lashes: string;
  eyeliner: string;
  lipstick: string;
  eyeshadow: string;
  blush: string;
  skin: string;
}

interface MakeupPanelProps {
  values: MakeupState;
  onChange: (key: keyof MakeupState, value: string) => void;
  onReset: () => void;
  disabled?: boolean;
  isDarkMode?: boolean;
}

const MakeupPanel: React.FC<MakeupPanelProps> = ({ values, onChange, onReset, disabled, isDarkMode = true }) => {
  const options = {
    lashes: [
        { value: '', label: 'Original belassen' },
        { value: 'Natürlich getuscht', label: 'Natürlich getuscht' },
        { value: 'Volumen & Länge', label: 'Volumen & Länge' },
        { value: 'Definierte Wimpern', label: 'Stark Definiert' },
        { value: 'Puppen-Wimpern', label: 'Doll-Eye Look' },
    ],
    eyeliner: [
        { value: '', label: 'Original belassen' },
        { value: 'Dezenter Lidstrich', label: 'Dezent (Wimpernkranz)' },
        { value: 'Klassischer Eyeliner', label: 'Klassisch Schwarz' },
        { value: 'Cat-Eye Wing', label: 'Cat-Eye (Winged)' },
        { value: 'Smudged Liner', label: 'Verwischt (Grunge)' },
    ],
    lipstick: [
        { value: '', label: 'Original belassen' },
        { value: 'Roter Lippenstift (Matt)', label: 'Rot (Matt)' },
        { value: 'Roter Lippenstift (Glossy)', label: 'Rot (Glossy)' },
        { value: 'Nude Lippenstift', label: 'Nude / Natürlich' },
        { value: 'Zartes Rosa', label: 'Zartes Rosa' },
        { value: 'Dunkle Beere', label: 'Dunkle Beere' },
        { value: 'Koralle', label: 'Koralle' },
    ],
    eyeshadow: [
        { value: '', label: 'Original belassen' },
        { value: 'Champagner Gold', label: 'Champagner (Schimmer)' },
        { value: 'Smokey Eyes Schwarz', label: 'Smokey Eyes (Dunkel)' },
        { value: 'Sanftes Braun', label: 'Sanftes Braun (Matte)' },
        { value: 'Rosé Gold', label: 'Rosé Gold' },
        { value: 'Kupfer', label: 'Kupfer / Bronze' },
    ],
    blush: [
        { value: '', label: 'Original belassen' },
        { value: 'Pfirsich Rouge', label: 'Pfirsich (Frisch)' },
        { value: 'Rosenholz Rouge', label: 'Rosenholz (Natürlich)' },
        { value: 'Pink Rouge', label: 'Pink (Kühl)' },
        { value: 'Bronzer', label: 'Bronzer (Sonnengeküsst)' },
    ],
    skin: [
        { value: '', label: 'Original belassen' },
        { value: 'Matter Teint', label: 'Mattiert & Pudrig' },
        { value: 'Glowy Skin', label: 'Natürlicher Glow' },
        { value: 'Glass Skin', label: 'Glass Skin (Hochglanz)' },
        { value: 'Gebräunter Teint', label: 'Leicht Gebräunt' },
        { value: 'Porzellan Teint', label: 'Heller / Porzellan' },
    ]
  };

  const labelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const selectClass = isDarkMode 
    ? 'bg-black/40 border-white/10 text-gray-200 hover:bg-black/60 focus:ring-white/30 focus:border-white/30' 
    : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-indigo-300 focus:border-indigo-300';
  const optionClass = isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800';

  const renderSelect = (key: keyof MakeupState, label: string) => (
    <div className="flex flex-col gap-1.5">
      <label className={`text-[10px] uppercase font-bold tracking-wider ml-1 ${labelColor}`}>{label}</label>
      <div className="relative">
          <select
            value={values[key]}
            onChange={(e) => onChange(key, e.target.value)}
            disabled={disabled}
            className={`w-full border text-xs rounded-lg focus:ring-1 p-2 appearance-none cursor-pointer transition-colors ${selectClass}`}
          >
            {options[key].map((opt) => (
                <option key={opt.value} value={opt.value} className={optionClass}>{opt.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
      </div>
    </div>
  );

  return (
    <div className="bg-transparent pt-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
         {renderSelect('skin', 'Haut Finish')}
         {renderSelect('lipstick', 'Lippen')}
         {renderSelect('eyeliner', 'Eyeliner')}
         {renderSelect('lashes', 'Wimpern')}
         {renderSelect('eyeshadow', 'Lidschatten')}
         {renderSelect('blush', 'Rouge')}
      </div>
      <div className="mt-4 pt-2 border-t border-gray-700/30 flex justify-end">
         <button onClick={onReset} disabled={disabled} className="text-[10px] uppercase font-bold tracking-widest text-red-400 hover:text-red-300 transition-colors">
            Reset All
         </button>
      </div>
    </div>
  );
};

export default MakeupPanel;