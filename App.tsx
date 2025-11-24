import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Earth } from './components/Earth';
import { Satellites } from './components/Satellites';
import { InfoPanel } from './components/InfoPanel';
import { SatelliteData } from './types';

// Manually declare intrinsic elements to resolve TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
    }
  }
}

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

export default function App() {
  const [lockedSatellite, setLockedSatellite] = useState<SatelliteData | null>(null);

  // We only show the panel if a satellite is locked (clicked)
  const displaySatellite = lockedSatellite;

  // We keep this empty or purely for console logging if needed, 
  // as visual hover highlighting is handled inside the Satellites component 
  // and we don't want the UI panel to flicker on hover anymore.
  const handleHover = (data: SatelliteData | null) => {
     // Intentionally left empty
  };

  const handleSelect = (data: SatelliteData) => {
    // Direct assignment to lock/unlock
    // If clicking the same one, we can either keep it open or toggle. 
    // Setting it directly ensures a firm selection.
    setLockedSatellite(data);
  };

  const unlock = () => setLockedSatellite(null);

  return (
    <div className="w-full h-full relative bg-black">
      {/* Title / Header */}
      <div className="absolute top-8 left-0 right-0 z-10 text-center pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 tracking-tighter uppercase drop-shadow-lg">
          Orbital Watch
        </h1>
        <p className="text-gray-400 text-sm md:text-base mt-2 font-light tracking-widest">
          Global Light Pollution & Satellite Tracking System
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-8 right-8 z-10 pointer-events-none hidden md:block">
          <div className="bg-black/40 backdrop-blur border border-white/10 p-4 rounded-lg text-xs text-white space-y-2">
            <h3 className="font-bold border-b border-white/10 pb-1 mb-2">Affiliation</h3>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> USA</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> China</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-700"></span> Russia</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> EU</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-300"></span> SpaceX</div>
          </div>
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          {/* Grouping Earth and Satellites ensures visual coherence when orbiting */}
          <group>
             <Earth />
             <Satellites onHover={handleHover} onSelect={handleSelect} />
          </group>
          {/* AutoRotate makes the camera spin around the center */}
          <OrbitControls 
            enablePan={false} 
            minDistance={3} 
            maxDistance={12} 
            autoRotate 
            autoRotateSpeed={0.5} 
            enableZoom={true}
          />
        </Suspense>
      </Canvas>

      {/* Interaction Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
         <InfoPanel 
             satellite={displaySatellite} 
             locked={!!lockedSatellite} 
             setLocked={(val) => !val && unlock()}
         />
      </div>
    </div>
  );
}