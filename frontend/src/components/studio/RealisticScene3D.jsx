import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { RealisticCabinet3D } from './RealisticCabinet3D';
import { getFloorTileTexture, getTerrazzoTexture, getMarbleTexture, getGraniteTexture } from '../../utils/realisticTextures';

export const RealisticScene3D = forwardRef(({
  design,
  environmentMode = 'ROOM_PHOTO', // 'ROOM_PHOTO' | 'ARCHITECTURAL_STUDIO'
  finishStyle = 'SAGE_GLOSS',
  countertopStyle = 'TERRAZZO',
  lightingPreset = 'WARM_EVENING',
  includeAppliances = true,
  enableGlassShowcase = false,
  cameraPreset = 'FRONT', // 'FRONT' | 'CORRIDOR' | 'SHOWCASE' | 'ISO'
  calibration = { scale: 1, offsetX: 0, offsetY: 0, offsetZ: 0, rotationY: 0 },
  onCameraChange
}, ref) => {
  const controlsRef = useRef(null);
  const canvasRef = useRef(null);

  const roomWm = (design.roomWidthMm || 4500) / 1000;
  const roomLm = (design.roomLengthMm || 3600) / 1000;
  const roomHm = (design.roomHeightMm || 2800) / 1000;
  const layoutType = design.layoutType || 'L_SHAPED';

  // Expose Snapshot capture to parent
  useImperativeHandle(ref, () => ({
    captureSnapshot: (filename = 'KitchenCraft_Render.jpg') => {
      if (!canvasRef.current) return null;
      try {
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return dataUrl;
      } catch (err) {
        console.error('Failed to capture snapshot from WebGL:', err);
        return null;
      }
    }
  }));

  // Resolve Architectural Materials
  const floorMap = useMemo(() => getFloorTileTexture(), []);
  const backsplashMap = useMemo(() => {
    if (countertopStyle === 'TERRAZZO') return getTerrazzoTexture();
    if (countertopStyle === 'WHITE_QUARTZ') return getMarbleTexture();
    if (countertopStyle === 'BLACK_GRANITE') return getGraniteTexture();
    return getTerrazzoTexture();
  }, [countertopStyle]);

  // Update Camera position according to selected Preset
  useEffect(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;

    switch (cameraPreset) {
      case 'FRONT':
        // Straight-on eye-level elevation (matching Reference Photo 1)
        ctrl.object.position.set(0, 1.4, roomLm * 1.35);
        ctrl.target.set(0, 1.3, 0);
        break;
      case 'CORRIDOR':
        // Walkway perspective looking down aisle toward window (matching Reference Photo 2)
        ctrl.object.position.set(-roomWm * 0.15, 1.45, roomLm * 1.2);
        ctrl.target.set(0, 1.2, -roomLm * 0.4);
        break;
      case 'SHOWCASE':
        // Close 3/4 angle focusing on display & details (matching Reference Photo 3)
        ctrl.object.position.set(roomWm * 0.65, 1.35, roomLm * 0.85);
        ctrl.target.set(roomWm * 0.1, 1.2, 0);
        break;
      case 'ISO':
        // High angle cutaway architectural perspective
        ctrl.object.position.set(roomWm * 0.85, roomHm * 1.25, roomLm * 1.25);
        ctrl.target.set(0, roomHm * 0.35, 0);
        break;
      default:
        break;
    }
    ctrl.update();
  }, [cameraPreset, roomWm, roomLm, roomHm]);

  // Layout Wall Flags
  const hasBackWall =
    layoutType === 'STRAIGHT' ||
    layoutType === 'L_SHAPED' ||
    layoutType === 'U_SHAPED' ||
    layoutType === 'ISLAND';
  const hasLeftWall =
    layoutType === 'L_SHAPED' ||
    layoutType === 'U_SHAPED' ||
    layoutType === 'PARALLEL' ||
    layoutType === 'ISLAND';
  const hasRightWall = layoutType === 'U_SHAPED' || layoutType === 'PARALLEL';

  const isFullRoom = environmentMode === 'ARCHITECTURAL_STUDIO';

  return (
    <Canvas
      ref={canvasRef}
      shadows
      camera={{ position: [0, 1.4, roomLm * 1.35], fov: 42 }}
      gl={{
        antialias: true,
        alpha: true, // Transparent background allows underlying room photo
        preserveDrawingBuffer: true, // Required for capturing HD screenshots
        powerPreference: 'high-performance'
      }}
      className="w-full h-full"
    >
      {/* ============================================================ */}
      {/* 1. LIGHTING RIG                                               */}
      {/* ============================================================ */}
      {lightingPreset === 'WARM_EVENING' ? (
        <>
          <ambientLight intensity={0.7} color="#fffbeb" />
          <directionalLight
            position={[roomWm * 1.2, roomHm * 2.2, roomLm * 1.5]}
            intensity={1.5}
            color="#ffedd5"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <hemisphereLight groundColor="#0f172a" color="#fef08a" intensity={0.5} />
          {/* Ceiling Recessed Spotlights */}
          <pointLight position={[0, roomHm - 0.2, 0]} intensity={0.8} color="#fef08a" distance={5} />
          <pointLight position={[-roomWm * 0.3, roomHm - 0.2, roomLm * 0.2]} intensity={0.6} color="#fef08a" distance={4} />
          <pointLight position={[roomWm * 0.3, roomHm - 0.2, roomLm * 0.2]} intensity={0.6} color="#fef08a" distance={4} />
        </>
      ) : lightingPreset === 'BRIGHT_DAYLIGHT' ? (
        <>
          <ambientLight intensity={0.85} color="#f8fafc" />
          <directionalLight
            position={[-roomWm * 1.5, roomHm * 1.8, -roomLm * 0.8]}
            intensity={2.0}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <hemisphereLight groundColor="#1e293b" color="#e0f2fe" intensity={0.6} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.9} color="#ffffff" />
          <directionalLight
            position={[roomWm, roomHm * 2, roomLm]}
            intensity={1.6}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight
            position={[-roomWm, roomHm, -roomLm]}
            intensity={0.6}
            color="#cbd5e1"
          />
        </>
      )}

      {/* ============================================================ */}
      {/* 2. USER KITCHEN MODEL ROOT (WITH CALIBRATION OFFSETS)        */}
      {/* ============================================================ */}
      <group
        position={[calibration.offsetX, calibration.offsetY, calibration.offsetZ]}
        scale={[calibration.scale, calibration.scale, calibration.scale]}
        rotation={[0, calibration.rotationY, 0]}
      >
        {/* Render EVERY cabinet in the user's real-time design */}
        {design.cabinets?.map((cabinet) => (
          <RealisticCabinet3D
            key={cabinet.id}
            cabinet={cabinet}
            roomWidthMm={design.roomWidthMm}
            roomLengthMm={design.roomLengthMm}
            finishStyle={finishStyle}
            countertopStyle={countertopStyle}
            includeAppliances={includeAppliances}
            enableGlassShowcase={enableGlassShowcase}
          />
        ))}

        {/* Backsplash Panel along active walls (Height 600mm between counter & wall units) */}
        {hasBackWall && (
          <mesh
            position={[0, 0.86 + 0.3, -roomLm / 2 + 0.005]}
            receiveShadow
          >
            <planeGeometry args={[roomWm, 0.6]} />
            <meshStandardMaterial
              map={backsplashMap}
              color={countertopStyle === 'BLACK_GRANITE' ? '#111827' : '#ffffff'}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        )}

        {hasLeftWall && (
          <mesh
            position={[-roomWm / 2 + 0.005, 0.86 + 0.3, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[roomLm, 0.6]} />
            <meshStandardMaterial
              map={backsplashMap}
              color={countertopStyle === 'BLACK_GRANITE' ? '#111827' : '#ffffff'}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        )}

        {/* ============================================================ */}
        {/* 3. ARCHITECTURAL ENCLOSURE OR AR SHADOW CATCHER             */}
        {/* ============================================================ */}
        {isFullRoom ? (
          /* FULL ARCHITECTURAL 3D STUDIO (Ceiling, Floor Tiles, Real Walls) */
          <group>
            {/* Polished Floor Tiles */}
            <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[roomWm * 1.5, roomLm * 1.5]} />
              <meshStandardMaterial
                map={floorMap}
                roughness={0.15}
                metalness={0.1}
              />
            </mesh>

            {/* Ceiling with Recessed Spotlights */}
            <mesh position={[0, roomHm, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[roomWm * 1.5, roomLm * 1.5]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
            {/* Ceiling Spot fixtures */}
            {[-1, 0, 1].map((pos) => (
              <mesh key={pos} position={[pos * roomWm * 0.3, roomHm - 0.01, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
            ))}

            {/* Clean Architectural Back Wall */}
            {hasBackWall && (
              <mesh position={[0, roomHm / 2, -roomLm / 2 - 0.05]} receiveShadow>
                <boxGeometry args={[roomWm + 0.2, roomHm, 0.1]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
              </mesh>
            )}

            {/* Clean Architectural Left Wall */}
            {hasLeftWall && (
              <mesh position={[-roomWm / 2 - 0.05, roomHm / 2, 0]} receiveShadow>
                <boxGeometry args={[0.1, roomHm, roomLm + 0.2]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
              </mesh>
            )}

            {/* Clean Architectural Right Wall */}
            {hasRightWall && (
              <mesh position={[roomWm / 2 + 0.05, roomHm / 2, 0]} receiveShadow>
                <boxGeometry args={[0.1, roomHm, roomLm + 0.2]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
              </mesh>
            )}
          </group>
        ) : (
          /* ROOM PHOTO COMPOSITE: Invisible Shadow Receiver Floor Plane */
          <group>
            {/* Catches realistic directional shadows directly onto the room photo floor */}
            <mesh
              position={[0, -0.001, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[roomWm * 2.5, roomLm * 2.5]} />
              <shadowMaterial opacity={0.42} />
            </mesh>
            {/* Contact Shadows for soft ambient occlusion beneath cabinets */}
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.65}
              scale={roomWm * 1.5}
              blur={1.8}
              far={1.5}
            />
          </group>
        )}
      </group>

      {/* Orbit Controls with smooth damping */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 1.2, 0]}
        minDistance={0.5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 + 0.02}
        dampingFactor={0.06}
      />
    </Canvas>
  );
});
