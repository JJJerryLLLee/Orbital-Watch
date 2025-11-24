import React, { useState, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { Earth } from './components/Earth';
import { Satellites } from './components/Satellites';
import { InfoPanel } from './components/InfoPanel';
import { SatelliteData } from './types';

const Loader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-sm animate-pulse">Initializing Global Data...</p>
      </div>
    </Html>
  );
};

// Component to handle the connecting line and visual marker
const ConnectingLine = ({ satellite }: { satellite: SatelliteData }) => {
  const { camera, size } = useThree();
  const vec = useMemo(() => new Vector3(), []);
  
  // Clean up SVG line on unmount
  useEffect(() => {
    return () => {
      const el = document.getElementById('connection-line-path');
      if (el) el.setAttribute('d', '');
    }
  }, []);

  useFrame(() => {
    const el = document.getElementById('connection-line-path');
    
    if (!satellite) {
       if (el) el.setAttribute('d', '');
       return;
    }

    // Calculate screen position of satellite
    vec.set(satellite.position[0], satellite.position[1], satellite.position[2]);
    vec.project(camera);

    // Convert NDC to pixel coordinates
    const x = (vec.x * 0.5 + 0.5) * size.width;
    const y = (-(vec.y * 0.5) + 0.5) * size.height;

    const panel = document.getElementById('info-panel-container');

    if (panel && el) {
        const rect = panel.getBoundingClientRect();
        // Target top-left area of the panel container
        const targetX = rect.left + 24; // Align with left padding
        const targetY = rect.top + 24; // Align with top padding
        
        // Draw dashed line
        el.setAttribute('d', `M ${x} ${y} L ${targetX} ${targetY}`);
        el.style.opacity = '1';
    }
  });

  return (
    <Html 
      position={satellite.position} 
      zIndexRange={[0, 0]} 
      style={{
        pointerEvents: 'none',
        transform: 'translate3d(-50%, -50%, 0)'
      }}
    >
      <div className="relative flex items-center justify-center w-12 h-12">
         {/* Pulsating Glow */}
         <div className="absolute w-full h-full rounded-full border border-cyan-400/50 animate-ping"></div>
         <div className="absolute w-8 h-8 rounded-full border border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
         {/* Center Dot */}
         <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#ffffff]"></div>
      </div>
    </Html>
  );
};

export default function App() {
  const [lockedSatellite, setLockedSatellite] = useState<SatelliteData | null>(null);
  
  // New State for features
  const [headerVisible, setHeaderVisible] = useState(true);
  const [satelliteCount, setSatelliteCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotSpeed, setRotSpeed] = useState(0.5);
  const [legendOpen, setLegendOpen] = useState(true);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
        // If no key, open settings automatically after a brief delay so user knows where to input it
        setTimeout(() => setShowSettings(true), 1500);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('GEMINI_API_KEY', newKey);
  };

  // Auto-hide header after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeaderVisible(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // We only show the panel if a satellite is locked (clicked)
  const displaySatellite = lockedSatellite;

  const handleHover = (data: SatelliteData | null) => {
     // Intentionally left empty
  };

  const handleSelect = (data: SatelliteData) => {
    setLockedSatellite(data);
    // Stop rotation when a satellite is selected for easier reading
    if (data) {
        setAutoRotate(false);
    }
  };

  const unlock = () => {
      setLockedSatellite(null);
      setAutoRotate(true);
  }

  return (
    <div className="w-full h-full relative bg-black">
      {/* SVG Overlay for Connection Lines */}
      <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
        <path 
          id="connection-line-path" 
          stroke="rgba(34, 211, 238, 0.4)" 
          strokeWidth="1.5" 
          strokeDasharray="4 4" 
          fill="none" 
          style={{ filter: 'drop-shadow(0 0 2px rgba(34, 211, 238, 0.3))', transition: 'opacity 0.2s' }} 
        />
      </svg>

      {/* Title / Header - Fades out */}
      <div className={`absolute top-8 left-0 right-0 z-10 text-center transition-opacity duration-1000 ${headerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 tracking-tighter uppercase drop-shadow-lg">
          Orbital Watch
        </h1>
        <p className="text-gray-400 text-sm md:text-base mt-2 font-light tracking-widest">
          Global Light Pollution & Satellite Tracking System
        </p>
      </div>

      {/* Legend - Manually Toggled, does not fade automatically */}
      <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-2 hidden md:flex">
          {/* Toggle Button */}
          <button 
            onClick={() => setLegendOpen(!legendOpen)}
            className={`
               bg-black/40 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2
               ${legendOpen ? 'text-cyan-400 border-cyan-500/30' : 'text-gray-400'}
            `}
          >
             <span>Key</span>
             <svg 
               className={`w-3 h-3 transition-transform duration-300 ${legendOpen ? 'rotate-180' : ''}`} 
               fill="none" viewBox="0 0 24 24" stroke="currentColor"
             >
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
          </button>

          {/* Collapsible Content */}
          <div className={`
              bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-lg text-xs text-white space-y-2 transition-all duration-300 origin-top-right overflow-hidden shadow-lg
              ${legendOpen ? 'opacity-100 scale-100 max-h-64' : 'opacity-0 scale-95 max-h-0 pointer-events-none border-0 p-0'}
          `}>
            <h3 className="font-bold border-b border-white/10 pb-1 mb-2">Affiliation</h3>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> USA</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> China</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-700 shadow-[0_0_8px_rgba(185,28,28,0.6)]"></span> Russia</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></span> EU</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.6)]"></span> SpaceX</div>
          </div>
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          <group>
             <Earth />
             <Satellites 
                onHover={handleHover} 
                onSelect={handleSelect} 
                onDataLoaded={setSatelliteCount}
             />
             {lockedSatellite && <ConnectingLine satellite={lockedSatellite} />}
          </group>
          <OrbitControls 
            enablePan={false} 
            minDistance={3} 
            maxDistance={45} 
            autoRotate={autoRotate}
            autoRotateSpeed={rotSpeed}
            enableZoom={true}
          />
        </Suspense>
      </Canvas>

      {/* Interaction Overlay (Satellite Info) */}
      <div className="absolute inset-0 pointer-events-none z-20">
         <InfoPanel 
             satellite={displaySatellite} 
             locked={!!lockedSatellite} 
             setLocked={(val) => !val && unlock()}
             apiKey={apiKey}
             onOpenSettings={() => setShowSettings(true)}
         />
      </div>

      {/* System Control Toggle Button (Bottom Right) */}
      <div className="absolute bottom-8 right-8 z-30">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`group flex items-center justify-center w-12 h-12 backdrop-blur-md border rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${!apiKey ? 'bg-red-900/50 border-red-500 animate-pulse' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
          title="System Information & Settings"
        >
           {/* Icon changing based on state */}
           {showSettings ? (
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           ) : (
             <svg className={`w-6 h-6 transition-transform duration-500 ${!apiKey ? 'text-red-400' : 'text-cyan-400 group-hover:rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
             </svg>
           )}
        </button>
      </div>

      {/* Settings / Info Panel Overlay */}
      {showSettings && (
        <div className="absolute bottom-24 right-8 z-30 w-80 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${apiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                System Status
              </h2>
           </div>
           
           <div className="p-5 space-y-6">
              
              {/* API KEY INPUT */}
              <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Google Gemini API Key</label>
                  <input 
                    type="password" 
                    placeholder="Enter your API Key here..." 
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-gray-500">
                    Required for AI analysis. Key is stored locally in your browser.
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-500 hover:text-cyan-300 ml-1 underline">Get Key</a>
                  </p>
              </div>

              {/* Stats Section */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Tracked Satellites</span>
                    <span className="text-white font-mono font-bold text-lg">{satelliteCount}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total in Orbit (Est.)</span>
                    <span className="text-cyan-400 font-mono">~11,300</span>
                 </div>
                 {/* Visual Bar */}
                 <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                      style={{ width: `${(satelliteCount / 11300) * 100}%` }}
                    ></div>
                 </div>
              </div>

              {/* Controls Section */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Controls</h3>
                 
                 {/* Rotation Toggle */}
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Auto-Rotation</span>
                    <button 
                      onClick={() => setAutoRotate(!autoRotate)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${autoRotate ? 'bg-green-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${autoRotate ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                 </div>

                 {/* Speed Slider */}
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                       <span>Slow</span>
                       <span>Speed</span>
                       <span>Fast</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.1" 
                      value={rotSpeed} 
                      onChange={(e) => setRotSpeed(parseFloat(e.target.value))}
                      disabled={!autoRotate}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                 </div>
              </div>

              {/* Instructions */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Instructions</h3>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                   <li>Drag to rotate view</li>
                   <li>Scroll to zoom in/out</li>
                   <li>Click dots to identify satellites</li>
                </ul>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}