import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, Color, AdditiveBlending, BackSide } from 'three';
import { Stars } from '@react-three/drei';

// Manually declare intrinsic elements to resolve TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      shaderMaterial: any;
    }
  }
}

export const Earth: React.FC = () => {
  const earthRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);

  // Load textures using standard Three.js loader
  const [
    colorMap,
    normalMap,
    specularMap,
    cloudsMap
  ] = useLoader(TextureLoader, [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1024px-The_earth_at_night.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_normal_2048.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_specular_2048.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame(({ clock }) => {
    // Slow rotation for clouds to create parallax
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.005;
    }
  });

  return (
    <>
      {/* 
        Lighting adjustments for better visibility:
        1. Higher ambient light to see dark continents.
        2. Rim light (Directional) to outline the sphere shape.
      */}
      <ambientLight intensity={0.4} color="#ccccff" /> 
      
      {/* Sun/City highlights */}
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffdcb4" />
      
      {/* Rim light to separate Earth from space */}
      <directionalLight position={[-5, 3, -10]} intensity={0.8} color="#445588" />

      {/* Main Earth Sphere */}
      <mesh ref={earthRef} rotation={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          roughness={0.6} // Slightly smoother to catch light on oceans
          metalness={0.2}
          emissiveMap={colorMap}
          emissive={new Color(0xffff88)}
          emissiveIntensity={1.2} // Boost the city lights
          color={new Color(0x666666)} // Lifts the black base to dark grey so continents are visible
        />
      </mesh>

      {/* Clouds Layer */}
      <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.2}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere Glow - Increased intensity for better outline */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          blending={AdditiveBlending}
          side={BackSide}
          transparent={true}
          uniforms={{
            c: { value: 0.5 }, // Increased from 0.2 for stronger edge
            p: { value: 3.5 }, // Adjusted power for smoother falloff
            glowColor: { value: new Color(0x0088ff) },
            viewVector: { value: new Color(0, 0, 0) } 
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float c;
            uniform float p;
            uniform vec3 glowColor;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(c - dot(vNormal, vec3(0, 0, 1.0)), p);
              gl_FragColor = vec4(glowColor, 1.0) * intensity;
            }
          `}
        />
      </mesh>
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  );
};