import React, { useEffect, useState } from 'react';
import { SatelliteData } from '../types';
import { getSatelliteDetails } from '../services/geminiService';

interface InfoPanelProps {
  satellite: SatelliteData | null;
  locked: boolean;
  setLocked: (locked: boolean) => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ satellite, locked, setLocked }) => {
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAiDescription(null);
    if (satellite) {
      setLoading(true);
      getSatelliteDetails(satellite).then((desc) => {
        setAiDescription(desc);
        setLoading(false);
      });
    }
  }, [satellite]);

  if (!satellite) {
    return null; // Don't show anything if no satellite is selected
  }

  return (
    <div className={`pointer-events-auto absolute bottom-6 left-6 w-full max-w-md max-h-[80vh] flex flex-col bg-black/85 backdrop-blur-xl border border-white/20 rounded-2xl text-white transition-all duration-300 shadow-2xl ring-1 ring-white/10`}>
      
      {/* Header (Fixed) */}
      <div className="flex-none p-6 border-b border-white/10 relative">
        {/* Close Button */}
        <button 
          onClick={() => setLocked(false)}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            {satellite.name}
          </h2>
          <p className="text-xs text-blue-200 font-mono uppercase tracking-widest mt-1">
            {satellite.type} | ID: {satellite.id}
          </p>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase">Owner</p>
            <p className="font-semibold">{satellite.company}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase">Origin</p>
            <p className="font-semibold flex items-center gap-2">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: satellite.color }}></span>
              {satellite.country}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase">Orbit Altitude</p>
            <p className="font-mono text-cyan-400">~{satellite.altitude.toFixed(0)} km</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase">Coordinates</p>
            <p className="font-mono text-xs text-gray-300">
               {satellite.position[0].toFixed(2)}, {satellite.position[1].toFixed(2)}
            </p>
          </div>
        </div>

        {/* AI Content */}
        <div className="pt-4 border-t border-white/10 bg-white/5 rounded-lg p-3">
          <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-2">
              ✨ AI ANALYSIS
          </p>
          {loading ? (
              <div className="flex gap-1 items-center h-12">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
              </div>
          ) : (
          <p className="text-sm text-gray-300 leading-relaxed animate-in fade-in duration-500">
              {aiDescription}
          </p>
          )}
        </div>
      </div>
    </div>
  );
};