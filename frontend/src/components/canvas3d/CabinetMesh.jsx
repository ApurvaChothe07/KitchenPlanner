import React, { useState } from 'react';
import { to3DCoordinates } from '../../utils/coordinates';

export const CabinetMesh = ({
  cabinet,
  roomWidthMm,
  roomLengthMm,
  isSelected,
  onSelect
}) => {
  const [hovered, setHovered] = useState(false);

  const { position, dimensions, rotationY } = to3DCoordinates(
    cabinet,
    roomWidthMm,
    roomLengthMm
  );

  const [widthM, heightM, depthM] = dimensions;
  const isBase = cabinet.cabinetType === 'BASE' || cabinet.cabinetType === 'SINK_BASE' || cabinet.cabinetType === 'HOB_BASE' || cabinet.cabinetType === 'DRAWER_BASE';
  const isWall = cabinet.cabinetType === 'WALL';
  const isTall = cabinet.cabinetType === 'TALL';

  // Material & color resolution
  const shutterColor = cabinet.finishColor || (
    cabinet.shutterMaterial === 'ACRYLIC' ? '#f8fafc' :
    cabinet.shutterMaterial === 'PU_LACQUER' ? '#38bdf8' :
    '#64748b'
  );

  const carcassColor = cabinet.carcassMaterial === 'BWR_PLYWOOD' ? '#475569' : '#334155';
  const countertopColor = '#0f172a'; // Deep slate / quartz countertop

  const countertopThickness = 0.035; // 35mm slab
  const plinthHeight = 0.1; // 100mm toe-kick

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(cabinet.id);
  };

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Selection & Hover Highlight Bounding Box */}
      {(isSelected || hovered) && (
        <mesh>
          <boxGeometry args={[widthM + 0.02, heightM + 0.02, depthM + 0.02]} />
          <meshBasicMaterial
            color={isSelected ? '#22c55e' : '#38bdf8'}
            wireframe
            transparent
            opacity={isSelected ? 0.9 : 0.4}
          />
        </mesh>
      )}

      {/* 2. BASE CABINET RENDERING */}
      {isBase && (
        <group>
          {/* A. Plinth / Toe-kick Recess */}
          <mesh position={[0, -heightM / 2 + plinthHeight / 2, -0.025]}>
            <boxGeometry args={[widthM - 0.02, plinthHeight, depthM - 0.05]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>

          {/* B. Carcass & Shutter Main Body */}
          <mesh position={[0, plinthHeight / 2 - countertopThickness / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[widthM, heightM - plinthHeight - countertopThickness, depthM]} />
            <meshStandardMaterial
              color={shutterColor}
              roughness={cabinet.shutterMaterial === 'ACRYLIC' ? 0.2 : 0.6}
              metalness={0.1}
            />
          </mesh>

          {/* C. Countertop Slab (with 20mm front overhang) */}
          <mesh position={[0, heightM / 2 - countertopThickness / 2, 0.01]} castShadow receiveShadow>
            <boxGeometry args={[widthM + 0.005, countertopThickness, depthM + 0.02]} />
            <meshStandardMaterial color={countertopColor} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* D. Sink Unit Detail (Bowl + Faucet) */}
          {cabinet.cabinetType === 'SINK_BASE' && (
            <group position={[0, heightM / 2 + 0.005, 0]}>
              {/* Sink Basin */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[Math.min(0.7, widthM * 0.75), 0.008, Math.min(0.42, depthM * 0.7)]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Chrome Faucet */}
              <mesh position={[0, 0.12, -depthM * 0.25]}>
                <cylinderGeometry args={[0.01, 0.01, 0.24, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
              </mesh>
            </group>
          )}

          {/* E. Hob Unit Detail (Induction Cooktop) */}
          {cabinet.cabinetType === 'HOB_BASE' && (
            <group position={[0, heightM / 2 + 0.004, 0]}>
              <mesh>
                <boxGeometry args={[Math.min(0.75, widthM * 0.8), 0.006, Math.min(0.45, depthM * 0.75)]} />
                <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.4} />
              </mesh>
              {/* Burner rings */}
              <mesh position={[-0.15, 0.004, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.002, 16]} />
                <meshStandardMaterial color="#ea580c" roughness={0.3} />
              </mesh>
              <mesh position={[0.15, 0.004, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.002, 16]} />
                <meshStandardMaterial color="#ea580c" roughness={0.3} />
              </mesh>
            </group>
          )}

          {/* F. Sleek Cabinet Handle */}
          <mesh position={[0, heightM / 4, depthM / 2 + 0.012]}>
            <boxGeometry args={[Math.min(0.18, widthM * 0.3), 0.012, 0.018]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* 3. WALL CABINET RENDERING (Overhead) */}
      {isWall && (
        <group castShadow receiveShadow>
          <mesh>
            <boxGeometry args={[widthM, heightM, depthM]} />
            <meshStandardMaterial
              color={shutterColor}
              roughness={cabinet.shutterMaterial === 'ACRYLIC' ? 0.2 : 0.6}
            />
          </mesh>
          {/* Wall Door Handle */}
          <mesh position={[0, -heightM / 3, depthM / 2 + 0.01]}>
            <boxGeometry args={[Math.min(0.16, widthM * 0.25), 0.01, 0.015]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* 4. TALL CABINET RENDERING (Floor to Ceiling Tower) */}
      {isTall && (
        <group castShadow receiveShadow>
          {/* Plinth */}
          <mesh position={[0, -heightM / 2 + plinthHeight / 2, -0.025]}>
            <boxGeometry args={[widthM - 0.02, plinthHeight, depthM - 0.05]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>

          {/* Tower Body */}
          <mesh position={[0, plinthHeight / 2, 0]}>
            <boxGeometry args={[widthM, heightM - plinthHeight, depthM]} />
            <meshStandardMaterial
              color={shutterColor}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>

          {/* Mid Door Divider Groove */}
          <mesh position={[0, 0, depthM / 2 + 0.001]}>
            <boxGeometry args={[widthM, 0.008, 0.002]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Vertical Pull Handles */}
          <mesh position={[widthM / 3, 0.2, depthM / 2 + 0.012]}>
            <boxGeometry args={[0.015, 0.35, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
};
