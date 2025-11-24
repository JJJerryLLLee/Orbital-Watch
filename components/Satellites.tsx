import React, { useMemo, useRef, useState, useEffect } from 'react';
import { InstancedMesh, Object3D, Color, MathUtils } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { SatelliteData, CountryOwner } from '../types';

// Manually declare intrinsic elements to resolve TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
    }
  }
}

interface SatellitesProps {
  onHover: (data: SatelliteData | null) => void;
  onSelect: (data: SatelliteData) => void;
  onDataLoaded?: (count: number) => void;
}

// 3D Scale Constants
// These ensure 1:1 realism with the Earth model
const EARTH_RADIUS_UNITS = 2; // The 3D model radius
const EARTH_RADIUS_KM = 6371; // Real Earth radius
const SCALE = EARTH_RADIUS_UNITS / EARTH_RADIUS_KM;

const getPositionFromOrbitalElements = (altitudeKm: number, inclinationDeg: number, raanDeg: number, meanAnomalyDeg: number): [number, number, number] => {
  // r is the distance from the CENTER of the Earth
  const r = (EARTH_RADIUS_KM + altitudeKm) * SCALE;
  const i = MathUtils.degToRad(inclinationDeg);
  const omega = MathUtils.degToRad(raanDeg); // RAAN
  const theta = MathUtils.degToRad(meanAnomalyDeg); // Position along orbit

  // Keplerian to Cartesian conversion
  const x = r * (Math.cos(omega) * Math.cos(theta) - Math.sin(omega) * Math.sin(theta) * Math.cos(i));
  const z = r * (Math.sin(omega) * Math.cos(theta) + Math.cos(omega) * Math.sin(theta) * Math.cos(i));
  const y = r * (Math.sin(theta) * Math.sin(i));

  return [x, y, z];
};

export const Satellites: React.FC<SatellitesProps> = ({ onHover, onSelect, onDataLoaded }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const hitboxRef = useRef<InstancedMesh>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const { camera } = useThree();
  
  // Track previous distance to optimize updates
  const lastDistanceRef = useRef<number>(0);

  // Generate REALISTIC Satellite Data
  const satellites = useMemo(() => {
    const data: SatelliteData[] = [];
    let idCounter = 0;

    const addSat = (name: string, country: CountryOwner, type: string, alt: number, inc: number, raan: number, ma: number, colorOverride?: string) => {
      let color = '#ffffff';
      if (colorOverride) {
        color = colorOverride;
      } else {
        switch(country) {
            case CountryOwner.USA: color = '#3b82f6'; break;
            case CountryOwner.SpaceX: color = '#60a5fa'; break;
            case CountryOwner.China: color = '#ef4444'; break;
            case CountryOwner.Russia: color = '#dc2626'; break;
            case CountryOwner.EU: color = '#eab308'; break;
            case CountryOwner.India: color = '#f97316'; break;
            case CountryOwner.International: color = '#ffffff'; break;
            default: color = '#a3a3a3';
        }
      }

      data.push({
        id: idCounter++,
        name,
        position: getPositionFromOrbitalElements(alt, inc, raan, ma),
        color,
        country,
        company: country === CountryOwner.SpaceX ? 'SpaceX' : 
                 country === CountryOwner.International ? 'International Collaboration' :
                 `National Space Agency of ${country}`,
        type,
        altitude: alt
      });
    };

    // --- 1. SPECIAL SATELLITES ---
    addSat("ISS (Zarya)", CountryOwner.International, "Space Station", 408, 51.6, 0, 0);
    addSat("Tiangong", CountryOwner.China, "Space Station", 450, 41.5, 120, 180);
    addSat("Hubble Space Telescope", CountryOwner.USA, "Telescope", 540, 28.5, 60, 90);
    addSat("Envisat", CountryOwner.EU, "Earth Observation", 790, 98, 200, 45);

    // --- 2. GPS CONSTELLATION (USA) ---
    for (let plane = 0; plane < 6; plane++) {
        for (let sat = 0; sat < 4; sat++) {
            addSat(`GPS III SV-${plane*4 + sat + 1}`, CountryOwner.USA, "Navigation (GPS)", 20200, 55, plane * 60, sat * 90);
        }
    }

    // --- 3. GALILEO (EU) ---
    for (let i = 0; i < 15; i++) {
        addSat(`Galileo FOC-${i+1}`, CountryOwner.EU, "Navigation (Galileo)", 23222, 56, (i%3)*120, i*24);
    }

    // --- 4. GLONASS (Russia) ---
    for (let i = 0; i < 15; i++) {
        addSat(`GLONASS-M ${700+i}`, CountryOwner.Russia, "Navigation (GLONASS)", 19130, 64.8, (i%3)*120, i*24 + 45);
    }

    // --- 5. BEIDOU (China) ---
    for (let i = 0; i < 10; i++) {
        addSat(`Beidou-3 M${i+1}`, CountryOwner.China, "Navigation (Beidou)", 21528, 55, (i%3)*120 + 30, i*36);
    }

    // --- 6. STARLINK (SpaceX) ---
    for (let i = 0; i < 200; i++) {
        const plane = i % 8; 
        const anomaly = (i / 8) * 15 + (Math.random() * 5); 
        addSat(`Starlink-${3000+i}`, CountryOwner.SpaceX, "Communications", 550, 53, plane * 45, anomaly);
    }
    for (let i = 0; i < 50; i++) {
        addSat(`Starlink-Polar-${100+i}`, CountryOwner.SpaceX, "Communications", 560, 97.6, i * 10, i * 20);
    }

    // --- 7. GEOSTATIONARY BELT ---
    for (let i = 0; i < 60; i++) {
        const angle = i * 6; 
        let owner = CountryOwner.Private;
        let name = "Intelsat";
        if (i % 5 === 0) { owner = CountryOwner.USA; name = "GOES-East"; }
        else if (i % 5 === 1) { owner = CountryOwner.EU; name = "Eutelsat"; }
        else if (i % 5 === 2) { owner = CountryOwner.China; name = "Chinasat"; }
        else if (i % 5 === 3) { owner = CountryOwner.Japan; name = "Himawari"; }
        addSat(`${name}-${900+i}`, owner, "Weather/Comms (GEO)", 35786, 0, 0, angle);
    }

    // --- 8. IRIDIUM NEXT ---
    for (let i = 0; i < 30; i++) {
        addSat(`Iridium NEXT-${100+i}`, CountryOwner.Private, "Communications", 780, 86.4, (i%6)*30, i*12);
    }

    return data;
  }, []);

  // Report data count on load
  useEffect(() => {
    if (onDataLoaded) {
      onDataLoaded(satellites.length);
    }
  }, [satellites, onDataLoaded]);

  // Initialize Hitboxes (Static, run once)
  useEffect(() => {
    if (!hitboxRef.current) return;
    satellites.forEach((sat, i) => {
      tempObject.position.set(sat.position[0], sat.position[1], sat.position[2]);
      tempObject.scale.set(0.4, 0.4, 0.4); // Large consistent hitbox
      tempObject.updateMatrix();
      hitboxRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    hitboxRef.current.instanceMatrix.needsUpdate = true;
  }, [satellites, tempObject]);

  // Initial Colors
  useEffect(() => {
    if (!meshRef.current) return;
    satellites.forEach((sat, i) => {
      meshRef.current!.setColorAt(i, new Color(sat.color));
    });
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [satellites]);

  // Dynamic Scaling Logic
  useFrame(() => {
    if (!meshRef.current) return;

    const cameraDistance = camera.position.length();
    
    // Only update if distance has changed significantly to save performance
    if (Math.abs(cameraDistance - lastDistanceRef.current) > 0.5) {
      lastDistanceRef.current = cameraDistance;

      // Logic: As camera gets farther, scale gets larger.
      // At dist 8 (close), scale is 0.02.
      // At dist 40 (far), scale is 0.15 (huge visible dots).
      let scaleFactor = 0.02; 
      if (cameraDistance > 8) {
          scaleFactor = 0.02 + ((cameraDistance - 8) / 32) * 0.13;
      }
      
      // Clamp max size
      scaleFactor = Math.min(scaleFactor, 0.2);

      satellites.forEach((sat, i) => {
        tempObject.position.set(sat.position[0], sat.position[1], sat.position[2]);
        tempObject.lookAt(0, 0, 0); 
        tempObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });

      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id !== undefined && id !== hoveredId) {
      setHoveredId(id);
      onHover(satellites[id]);
      
      meshRef.current!.setColorAt(id, new Color('#ffffff')); // Bright White on Hover
      meshRef.current!.instanceColor!.needsUpdate = true;
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: any) => {
    if (hoveredId !== null) {
         const sat = satellites[hoveredId];
         meshRef.current!.setColorAt(hoveredId, new Color(sat.color));
         meshRef.current!.instanceColor!.needsUpdate = true;
    }
    setHoveredId(null);
    onHover(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
      e.stopPropagation();
      if (e.instanceId !== undefined) {
          onSelect(satellites[e.instanceId]);
      }
  };

  return (
    <>
      {/* Visual Mesh: Spheres (Points of light) with size attenuation logic via scaling */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, satellites.length]}
        raycast={() => null} // Visuals don't handle clicks
      >
        <sphereGeometry args={[1, 8, 8]} /> {/* Simple sphere geometry */}
        <meshBasicMaterial toneMapped={false} /> {/* Unlit material = Glows in dark */}
      </instancedMesh>

      {/* Hitbox Mesh: Invisible */}
      <instancedMesh
        ref={hitboxRef}
        args={[undefined, undefined, satellites.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </>
  );
};