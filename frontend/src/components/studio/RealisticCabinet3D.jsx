import React, { useMemo } from 'react';
import * as THREE from 'three';
import { to3DCoordinates } from '../../utils/coordinates';
import { getTerrazzoTexture, getMarbleTexture, getGraniteTexture } from '../../utils/realisticTextures';

export const RealisticCabinet3D = ({
  cabinet,
  roomWidthMm,
  roomLengthMm,
  finishStyle = 'SAGE_GLOSS', // 'SAGE_GLOSS' | 'ALABASTER' | 'CHARCOAL' | 'CUSTOM'
  countertopStyle = 'TERRAZZO', // 'TERRAZZO' | 'WHITE_QUARTZ' | 'BLACK_GRANITE'
  includeAppliances = true,
  enableGlassShowcase = false
}) => {
  const { position, dimensions, rotationY } = to3DCoordinates(
    cabinet,
    roomWidthMm,
    roomLengthMm
  );

  const [widthM, heightM, depthM] = dimensions;
  const isBase =
    cabinet.cabinetType === 'BASE' ||
    cabinet.cabinetType === 'SINK_BASE' ||
    cabinet.cabinetType === 'HOB_BASE' ||
    cabinet.cabinetType === 'DRAWER_BASE';
  const isWall = cabinet.cabinetType === 'WALL';
  const isTall = cabinet.cabinetType === 'TALL';

  // Determine Shutter Color & Physical Material properties
  const shutterColor = useMemo(() => {
    if (finishStyle === 'CUSTOM' && cabinet.finishColor) {
      return cabinet.finishColor;
    }
    switch (finishStyle) {
      case 'SAGE_GLOSS':
        return '#68846f'; // Architectural Sage Green from reference photo
      case 'ALABASTER':
        return '#f1ede4'; // Warm alabaster cream
      case 'CHARCOAL':
        return '#1e293b'; // Deep slate matte
      default:
        return cabinet.finishColor || '#68846f';
    }
  }, [finishStyle, cabinet.finishColor]);

  // Resolve Countertop Texture & Material
  const countertopMap = useMemo(() => {
    if (countertopStyle === 'TERRAZZO') return getTerrazzoTexture();
    if (countertopStyle === 'WHITE_QUARTZ') return getMarbleTexture();
    if (countertopStyle === 'BLACK_GRANITE') return getGraniteTexture();
    return getTerrazzoTexture();
  }, [countertopStyle]);

  const countertopColor = countertopStyle === 'BLACK_GRANITE' ? '#111827' : '#ffffff';

  const countertopThickness = 0.04; // 40mm solid surface
  const plinthHeight = 0.1; // 100mm toe-kick

  // Check if this tall unit is configured as a refrigerator
  const isRefrigerator =
    isTall &&
    includeAppliances &&
    (cabinet.notes?.toLowerCase().includes('fridge') ||
      cabinet.notes?.toLowerCase().includes('refrigerator') ||
      widthM >= 0.85);

  // Check if this unit is a glass crockery showcase
  const isGlassDisplay =
    enableGlassShowcase &&
    (isTall || isWall) &&
    !isRefrigerator &&
    (cabinet.notes?.toLowerCase().includes('glass') || cabinet.id % 2 === 0);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ============================================================ */}
      {/* 1. BASE UNITS (Standard, Drawers, Sink, Cooktop)             */}
      {/* ============================================================ */}
      {isBase && (
        <group>
          {/* A. Plinth / Toe-kick Recess */}
          <mesh position={[0, -heightM / 2 + plinthHeight / 2, -0.035]} castShadow receiveShadow>
            <boxGeometry args={[widthM - 0.01, plinthHeight, depthM - 0.07]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>

          {/* B. Base Carcass & Shutters with Clearcoat Acrylic Reflection */}
          <mesh
            position={[0, plinthHeight / 2 - countertopThickness / 2, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry
              args={[widthM - 0.004, heightM - plinthHeight - countertopThickness, depthM]}
            />
            <meshPhysicalMaterial
              color={shutterColor}
              roughness={finishStyle === 'CHARCOAL' ? 0.45 : 0.12}
              metalness={0.05}
              clearcoat={finishStyle === 'CHARCOAL' ? 0.0 : 0.75}
              clearcoatRoughness={0.1}
            />
          </mesh>

          {/* C. Modern Handleless Gola Profile / Shadow Gap Accent */}
          <mesh
            position={[0, heightM / 2 - countertopThickness - 0.025, depthM / 2 + 0.002]}
            castShadow
          >
            <boxGeometry args={[widthM - 0.004, 0.025, 0.02]} />
            <meshStandardMaterial color="#09090b" roughness={0.7} />
          </mesh>

          {/* D. Drawer Separation Lines for DRAWER_BASE */}
          {cabinet.cabinetType === 'DRAWER_BASE' && (
            <>
              {/* Drawer gap 1 */}
              <mesh position={[0, heightM * 0.1, depthM / 2 + 0.002]}>
                <boxGeometry args={[widthM - 0.01, 0.006, 0.004]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Drawer gap 2 */}
              <mesh position={[0, -heightM * 0.18, depthM / 2 + 0.002]}>
                <boxGeometry args={[widthM - 0.01, 0.006, 0.004]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Sleek horizontal pull bars */}
              <mesh position={[0, heightM * 0.12, depthM / 2 + 0.01]}>
                <boxGeometry args={[widthM * 0.7, 0.01, 0.012]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, -heightM * 0.16, depthM / 2 + 0.01]}>
                <boxGeometry args={[widthM * 0.7, 0.01, 0.012]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
              </mesh>
            </>
          )}

          {/* E. Countertop Slab with Beveled Nose & Terrazzo/Stone Texture */}
          <mesh
            position={[0, heightM / 2 - countertopThickness / 2, 0.015]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[widthM + 0.004, countertopThickness, depthM + 0.03]} />
            <meshStandardMaterial
              map={countertopMap}
              color={countertopColor}
              roughness={0.25}
              metalness={0.15}
            />
          </mesh>

          {/* F. SINK UNIT: Undermount Basin & Chrome Swan-Neck Faucet */}
          {cabinet.cabinetType === 'SINK_BASE' && includeAppliances && (
            <group position={[0, heightM / 2 + 0.002, 0]}>
              {/* Basin Rim */}
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry
                  args={[Math.min(0.68, widthM * 0.8), 0.006, Math.min(0.44, depthM * 0.72)]}
                />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Sink Depth Well */}
              <mesh position={[0, -0.06, 0]}>
                <boxGeometry
                  args={[Math.min(0.62, widthM * 0.72), 0.12, Math.min(0.38, depthM * 0.62)]}
                />
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.25} />
              </mesh>
              {/* Faucet Base */}
              <mesh position={[0, 0.03, -depthM * 0.22]}>
                <cylinderGeometry args={[0.022, 0.025, 0.06, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
              </mesh>
              {/* Tall Swan Neck Gooseneck Spout */}
              <mesh position={[0, 0.18, -depthM * 0.18]}>
                <torusGeometry args={[0.08, 0.012, 12, 24, Math.PI]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.08} />
              </mesh>
              {/* Mixer Handle */}
              <mesh position={[0.04, 0.08, -depthM * 0.22]} rotation={[0, 0, -0.4]}>
                <cylinderGeometry args={[0.006, 0.006, 0.07, 12]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
              </mesh>
            </group>
          )}

          {/* G. HOB UNIT: Sleek Ceramic Glass Induction Cooktop */}
          {cabinet.cabinetType === 'HOB_BASE' && includeAppliances && (
            <group position={[0, heightM / 2 + 0.004, 0]}>
              {/* Cooktop Glass Surface */}
              <mesh castShadow receiveShadow>
                <boxGeometry
                  args={[Math.min(0.76, widthM * 0.82), 0.006, Math.min(0.48, depthM * 0.75)]}
                />
                <meshPhysicalMaterial
                  color="#050505"
                  roughness={0.08}
                  metalness={0.3}
                  clearcoat={1.0}
                />
              </mesh>
              {/* Glowing Left Cooking Zone */}
              <mesh position={[-0.18, 0.004, 0]}>
                <ringGeometry args={[0.06, 0.085, 32]} />
                <meshBasicMaterial color="#ea580c" />
              </mesh>
              {/* Glowing Right Cooking Zone */}
              <mesh position={[0.18, 0.004, 0]}>
                <ringGeometry args={[0.06, 0.085, 32]} />
                <meshBasicMaterial color="#ea580c" />
              </mesh>
              {/* Center Accent Zone */}
              <mesh position={[0, 0.004, -0.04]}>
                <ringGeometry args={[0.04, 0.055, 32]} />
                <meshBasicMaterial color="#c2410c" />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ============================================================ */}
      {/* 2. WALL UNITS (Overhead Cabinets & Under-Cabinet LED Strip)  */}
      {/* ============================================================ */}
      {isWall && (
        <group castShadow receiveShadow>
          {/* A. Wall Cabinet Body */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[widthM - 0.004, heightM, depthM]} />
            <meshPhysicalMaterial
              color={shutterColor}
              roughness={finishStyle === 'CHARCOAL' ? 0.45 : 0.12}
              metalness={0.05}
              clearcoat={finishStyle === 'CHARCOAL' ? 0.0 : 0.75}
              clearcoatRoughness={0.1}
            />
          </mesh>

          {/* B. Glass Showcase Variant (Fluted Glass + Aluminum Frame) */}
          {isGlassDisplay ? (
            <group position={[0, 0, depthM / 2 + 0.002]}>
              {/* Aluminum Frame */}
              <mesh>
                <boxGeometry args={[widthM - 0.02, heightM - 0.04, 0.015]} />
                <meshStandardMaterial color="#09090b" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Frosted Glass Panes */}
              <mesh position={[0, 0, 0.004]}>
                <boxGeometry args={[widthM - 0.08, heightM - 0.1, 0.006]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  transmission={0.8}
                  opacity={0.7}
                  transparent
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
            </group>
          ) : (
            /* Subtle Finger Pull Bottom Gap */
            <mesh position={[0, -heightM / 2 + 0.01, depthM / 2 + 0.002]}>
              <boxGeometry args={[widthM - 0.01, 0.018, 0.01]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          )}

          {/* C. Under-Cabinet Warm LED Light Strip (Illuminates Backsplash) */}
          <group position={[0, -heightM / 2 - 0.005, depthM * 0.1]}>
            {/* Emissive Strip */}
            <mesh>
              <boxGeometry args={[widthM * 0.9, 0.006, 0.02]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
            {/* Downward Warm Ambient Glow */}
            <pointLight
              color="#fef08a"
              intensity={0.45}
              distance={1.2}
              decay={2}
              position={[0, -0.05, 0]}
            />
          </group>

          {/* D. Integrated Chimney Extractor Hood for HOB Run */}
          {cabinet.notes?.toLowerCase().includes('chimney') && includeAppliances && (
            <group position={[0, -0.15, 0.04]}>
              <mesh castShadow>
                <boxGeometry args={[widthM, 0.06, depthM + 0.12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ============================================================ */}
      {/* 3. TALL UNITS / REFRIGERATOR / CROCKERY SHOWCASE             */}
      {/* ============================================================ */}
      {isTall && (
        <group castShadow receiveShadow>
          {isRefrigerator ? (
            /* DOUBLE-DOOR FRENCH REFRIGERATOR (As in Reference Photo 1 & 2) */
            <group>
              {/* Plinth */}
              <mesh position={[0, -heightM / 2 + 0.03, -0.02]}>
                <boxGeometry args={[widthM - 0.02, 0.06, depthM - 0.04]} />
                <meshStandardMaterial color="#09090b" roughness={0.9} />
              </mesh>

              {/* Stainless Steel Refrigerator Body */}
              <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
                <boxGeometry args={[widthM, heightM - 0.06, depthM]} />
                <meshPhysicalMaterial
                  color="#cbd5e1"
                  metalness={0.88}
                  roughness={0.18}
                  clearcoat={0.3}
                />
              </mesh>

              {/* French Door Center Seam Divider */}
              <mesh position={[0, 0.03, depthM / 2 + 0.002]}>
                <boxGeometry args={[0.008, heightM - 0.08, 0.006]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>

              {/* Left Door Long Vertical Handle */}
              <mesh position={[-0.04, 0.1, depthM / 2 + 0.025]}>
                <cylinderGeometry args={[0.012, 0.012, heightM * 0.5, 16]} />
                <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.9} />
              </mesh>

              {/* Right Door Long Vertical Handle */}
              <mesh position={[0.04, 0.1, depthM / 2 + 0.025]}>
                <cylinderGeometry args={[0.012, 0.012, heightM * 0.5, 16]} />
                <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.9} />
              </mesh>

              {/* In-Door Water / Ice Dispenser Unit (Left Door) */}
              <mesh position={[-widthM * 0.25, 0.12, depthM / 2 + 0.004]}>
                <boxGeometry args={[0.18, 0.32, 0.012]} />
                <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.5} />
              </mesh>
              <mesh position={[-widthM * 0.25, 0.12, depthM / 2 + 0.012]}>
                <boxGeometry args={[0.12, 0.22, 0.01]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
            </group>
          ) : isGlassDisplay ? (
            /* CROCKERY & BAR SHOWCASE (As in Reference Photo 3) */
            <group>
              {/* Plinth */}
              <mesh position={[0, -heightM / 2 + plinthHeight / 2, -0.02]}>
                <boxGeometry args={[widthM - 0.02, plinthHeight, depthM - 0.04]} />
                <meshStandardMaterial color="#020617" roughness={0.9} />
              </mesh>

              {/* Lower Drawers Section (Solid Shutter) */}
              <mesh
                position={[0, -heightM / 2 + plinthHeight + 0.35, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[widthM, 0.7, depthM]} />
                <meshPhysicalMaterial
                  color={shutterColor}
                  roughness={0.12}
                  clearcoat={0.7}
                />
              </mesh>

              {/* Upper Glass Tower Section */}
              <mesh
                position={[0, heightM / 2 - (heightM - plinthHeight - 0.7) / 2, 0]}
                castShadow
              >
                <boxGeometry args={[widthM, heightM - plinthHeight - 0.7, depthM]} />
                <meshStandardMaterial color="#09090b" roughness={0.6} />
              </mesh>

              {/* Aluminum Fluted Glass Doors */}
              <mesh
                position={[0, heightM / 2 - (heightM - plinthHeight - 0.7) / 2, depthM / 2 + 0.004]}
              >
                <boxGeometry args={[widthM - 0.04, heightM - plinthHeight - 0.74, 0.01]} />
                <meshPhysicalMaterial
                  color="#38bdf8"
                  transmission={0.82}
                  opacity={0.65}
                  transparent
                  roughness={0.25}
                />
              </mesh>

              {/* Internal Glass Shelves with Warm LED Backlights */}
              {[-0.2, 0.2, 0.6].map((shelfY, idx) => (
                <group key={idx} position={[0, shelfY, 0]}>
                  <mesh>
                    <boxGeometry args={[widthM - 0.06, 0.01, depthM - 0.06]} />
                    <meshPhysicalMaterial
                      color="#f8fafc"
                      transmission={0.9}
                      transparent
                      opacity={0.8}
                    />
                  </mesh>
                  {/* Warm Shelf Illumination Strip */}
                  <mesh position={[0, 0, -depthM * 0.4]}>
                    <boxGeometry args={[widthM - 0.08, 0.006, 0.015]} />
                    <meshBasicMaterial color="#fef08a" />
                  </mesh>
                </group>
              ))}
            </group>
          ) : (
            /* STANDARD TALL PANTRY TOWER */
            <group>
              <mesh position={[0, -heightM / 2 + plinthHeight / 2, -0.025]}>
                <boxGeometry args={[widthM - 0.02, plinthHeight, depthM - 0.05]} />
                <meshStandardMaterial color="#020617" roughness={0.9} />
              </mesh>

              <mesh position={[0, plinthHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[widthM - 0.004, heightM - plinthHeight, depthM]} />
                <meshPhysicalMaterial
                  color={shutterColor}
                  roughness={finishStyle === 'CHARCOAL' ? 0.45 : 0.12}
                  metalness={0.05}
                  clearcoat={finishStyle === 'CHARCOAL' ? 0.0 : 0.75}
                  clearcoatRoughness={0.1}
                />
              </mesh>

              {/* Clean Horizontal Accent Split */}
              <mesh position={[0, 0.05, depthM / 2 + 0.002]}>
                <boxGeometry args={[widthM, 0.006, 0.004]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>

              {/* Sleek Minimalist Vertical Bar Handle */}
              <mesh position={[widthM / 3.5, 0.1, depthM / 2 + 0.014]}>
                <boxGeometry args={[0.012, 0.45, 0.015]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
};
