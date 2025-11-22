
import React from 'react';
import { AppSettings } from '../types';
import { X, Volume2, Skull, Music } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-80 md:w-96 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          Settings
        </h2>

        <div className="space-y-6">
          {/* Music Volume */}
          <div>
            <label className="flex items-center text-gray-300 mb-2 text-sm uppercase tracking-wider">
              <Music size={16} className="mr-2" /> Music Volume
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={settings.musicVolume}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSettings({...settings, musicVolume: parseFloat((e.target as any).value)})}
              className="w-full accent-emerald-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <label className="flex items-center text-gray-300 mb-2 text-sm uppercase tracking-wider">
              <Volume2 size={16} className="mr-2" /> SFX Volume
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={settings.sfxVolume}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSettings({...settings, sfxVolume: parseFloat((e.target as any).value)})}
              className="w-full accent-emerald-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <hr className="border-white/10" />

          {/* Difficulty */}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-gray-300 text-sm uppercase tracking-wider">
              <Skull size={16} className="mr-2" /> Hardcore Mode
            </label>
            <button
              onClick={() => onUpdateSettings({...settings, hardcoreMode: !settings.hardcoreMode})}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.hardcoreMode ? 'bg-red-600' : 'bg-gray-600'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.hardcoreMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Faster pipes, gravity increased.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
