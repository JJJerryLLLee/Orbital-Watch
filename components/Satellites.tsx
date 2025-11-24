import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, Vector3 } from 'three';
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
}

const COUNT = 800; // Requirement: Hundreds of satellites

// Helper to generate random point on sphere surface (orbit)
const getOrbitPosition = (radius: number): [number, number, number] => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return [x, y, z];
};

const COUNTRIES = Object.values(CountryOwner);
const TYPES = ['Communication', 'Navigation', 'Spy/Recon', 'Weather', 'Scientific', 'Telescope'];

export const Satellites: React.FC<SatellitesProps> = ({ onHover, onSelect }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const hitboxRef = useRef<InstancedMesh>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  
  // Generate Satellite Data
  const satellites = useMemo(() => {
    const data: SatelliteData[] = [];
    for (let i = 0; i < COUNT; i++) {
      // Varying altitudes: Low Earth Orbit (LEO) to Geostationary
      const altitudeOffset = 0.1 + Math.random() * 0.8; 
      const radius = 2 + altitudeOffset;
      const pos = getOrbitPosition(radius);
      
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      let color = '#ffffff';
      
      // Color coding by country/entity
      switch(country) {
        case CountryOwner.USA: color = '#3b82f6'; break; // Blue
        case CountryOwner.SpaceX: color = '#60a5fa'; break; // Light Blue
        case CountryOwner.China: color = '#ef4444'; break; // Red
        case CountryOwner.Russia: color = '#dc2626'; break; // Dark Red
        case CountryOwner.EU: color = '#eab308'; break; // Yellow
        case CountryOwner.India: color = '#f97316'; break; // Orange
        default: color = '#a3a3a3'; // Grey
      }

      data.push({
        id: i,
        position: pos,
        color: color,
        country: country,
        company: country.includes('SpaceX') ? 'SpaceX' : `National Space Agency of ${country}`,
        type: TYPES[Math.floor(Math.random() * TYPES.length)],
        altitude: 300 + Math.random() * 35000 // Fake Km calculation
      });
    }
    return data;
  }, []);

  useEffect(() => {
    if (!meshRef.current || !hitboxRef.current) return;

    // Set initial positions and colors
    satellites.forEach((sat, i) => {
      tempObject.position.set(sat.position[0], sat.position[1], sat.position[2]);
      tempObject.lookAt(0, 0, 0); // Face earth
      
      // 1. Visual Mesh (Small & Realistic)
      tempObject.scale.set(0.015, 0.015, 0.04); 
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, new Color(sat.color));

      // 2. Hitbox Mesh (Large & Invisible)
      // Scale is significantly larger to act as a generous click target
      tempObject.scale.set(0.2, 0.2, 0.2); 
      tempObject.updateMatrix();
      hitboxRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
    hitboxRef.current.instanceMatrix.needsUpdate = true;
  }, [satellites, tempObject]);

  // Handle pointer interactions via the larger hitbox
  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id !== undefined && id !== hoveredId) {
      setHoveredId(id);
      onHover(satellites[id]);
      
      // Highlight the visual mesh
      meshRef.current!.setColorAt(id, new Color('#ffffff')); // Bright White on Hover
      meshRef.current!.instanceColor!.needsUpdate = true;
      
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: any) => {
    if (hoveredId !== null) {
         const sat = satellites[hoveredId];
         // Restore original color
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
      {/* Visual Mesh: Small, colored, no raycasting for performance */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, COUNT]}
        raycast={() => null} // Disable raycasting here, we use hitbox instead
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Hitbox Mesh: Large, invisible, handles events */}
      <instancedMesh
        ref={hitboxRef}
        args={[undefined, undefined, COUNT]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.6, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </>
  );
};