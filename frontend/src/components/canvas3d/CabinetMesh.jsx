import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { to3DCoordinates, from3DCoordinates, from3DRotation } from '../../utils/coordinates';

export const CabinetMesh = ({
  cabinet,
  roomWidthMm,
  roomLengthMm,
  roomHeightMm,
  isSelected,
  onSelect,
  onMove,
  transformMode = 'translate',
  snapEnabled = true,
  controlsRef
}) => {
  const groupRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const isDirectDragging = useRef(false);
  const pointerStartPos = useRef({ x: 0, y: 0 });
  const dragPlane = useRef(new THREE.Plane());
  const dragOffset = useRef(new THREE.Vector3());

  const { camera, gl } = useThree();

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

  // Synchronize 3D mesh position and rotation with domain state when not actively dragging
  useEffect(() => {
    if (groupRef.current && !isDirectDragging.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.rotation.set(0, rotationY, 0);
    }
  }, [position[0], position[1], position[2], rotationY]);

  // Material & color resolution
  const shutterColor =
    cabinet.finishColor ||
    (cabinet.shutterMaterial === 'ACRYLIC'
      ? '#f8fafc'
      : cabinet.shutterMaterial === 'PU_LACQUER'
      ? '#38bdf8'
      : '#64748b');

  const countertopColor = '#0f172a'; // Deep slate / quartz countertop
  const countertopThickness = 0.035; // 35mm slab
  const plinthHeight = 0.1; // 100mm toe-kick

  // Commit final 3D transformation back to 2D domain coordinates & persist
  const commitFinalPosition = () => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    const r = groupRef.current.rotation;

    const newCoords = from3DCoordinates(
      p.x,
      p.y,
      p.z,
      cabinet,
      roomWidthMm,
      roomLengthMm,
      snapEnabled,
      50
    );

    const newRotation = from3DRotation(r.y, snapEnabled);

    if (onMove) {
      onMove(
        cabinet.id,
        newCoords.posX,
        newCoords.posY,
        newCoords.posZ,
        newRotation
      );
    }
  };

  // Direct Floor Drag Handler on Cabinet Body
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Left mouse button only
    e.stopPropagation();

    onSelect(cabinet.id);

    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    isDirectDragging.current = false;

    // Horizontal floor plane at the cabinet's current elevation Y
    const currentY = position[1];
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -currentY);

    const hitPoint = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, hitPoint);
    if (groupRef.current) {
      dragOffset.current.subVectors(groupRef.current.position, hitPoint);
    }

    const handlePointerMove = (moveEvt) => {
      const dist = Math.hypot(
        moveEvt.clientX - pointerStartPos.current.x,
        moveEvt.clientY - pointerStartPos.current.y
      );

      // Once pointer moves more than 4px, start active direct dragging
      if (dist > 4) {
        if (!isDirectDragging.current) {
          isDirectDragging.current = true;
          if (controlsRef?.current) controlsRef.current.enabled = false;
        }

        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((moveEvt.clientX - rect.left) / rect.width) * 2 - 1,
          -((moveEvt.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const planeHit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane.current, planeHit) && groupRef.current) {
          const targetX = planeHit.x + dragOffset.current.x;
          const targetZ = planeHit.z + dragOffset.current.z;

          // Clamp within room boundaries during drag
          const tempCoords = from3DCoordinates(
            targetX,
            currentY,
            targetZ,
            cabinet,
            roomWidthMm,
            roomLengthMm,
            false // Smooth 60fps tracking during active drag
          );

          const roomWm = roomWidthMm / 1000;
          const roomLm = roomLengthMm / 1000;
          groupRef.current.position.x = (tempCoords.posX + cabinet.widthMm / 2) / 1000 - roomWm / 2;
          groupRef.current.position.z = (tempCoords.posY + cabinet.depthMm / 2) / 1000 - roomLm / 2;
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (isDirectDragging.current) {
        isDirectDragging.current = false;
        if (controlsRef?.current) controlsRef.current.enabled = true;
        commitFinalPosition();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        rotation={[0, rotationY, 0]}
        onPointerDown={handlePointerDown}
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
            <mesh
              position={[0, plinthHeight / 2 - countertopThickness / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[widthM, heightM - plinthHeight - countertopThickness, depthM]}
              />
              <meshStandardMaterial
                color={shutterColor}
                roughness={cabinet.shutterMaterial === 'ACRYLIC' ? 0.2 : 0.6}
                metalness={0.1}
              />
            </mesh>

            {/* C. Countertop Slab (with 20mm front overhang) */}
            <mesh
              position={[0, heightM / 2 - countertopThickness / 2, 0.01]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[widthM + 0.005, countertopThickness, depthM + 0.02]} />
              <meshStandardMaterial color={countertopColor} roughness={0.3} metalness={0.2} />
            </mesh>

            {/* D. Sink Unit Detail (Bowl + Faucet) */}
            {cabinet.cabinetType === 'SINK_BASE' && (
              <group position={[0, heightM / 2 + 0.005, 0]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry
                    args={[
                      Math.min(0.7, widthM * 0.75),
                      0.008,
                      Math.min(0.42, depthM * 0.7)
                    ]}
                  />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
                </mesh>
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
                  <boxGeometry
                    args={[
                      Math.min(0.75, widthM * 0.8),
                      0.006,
                      Math.min(0.45, depthM * 0.75)
                    ]}
                  />
                  <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.4} />
                </mesh>
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
            <mesh position={[0, -heightM / 3, depthM / 2 + 0.01]}>
              <boxGeometry args={[Math.min(0.16, widthM * 0.25), 0.01, 0.015]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* 4. TALL CABINET RENDERING (Floor to Ceiling Tower) */}
        {isTall && (
          <group castShadow receiveShadow>
            <mesh position={[0, -heightM / 2 + plinthHeight / 2, -0.025]}>
              <boxGeometry args={[widthM - 0.02, plinthHeight, depthM - 0.05]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>

            <mesh position={[0, plinthHeight / 2, 0]}>
              <boxGeometry args={[widthM, heightM - plinthHeight, depthM]} />
              <meshStandardMaterial
                color={shutterColor}
                roughness={0.4}
                metalness={0.1}
              />
            </mesh>

            <mesh position={[0, 0, depthM / 2 + 0.001]}>
              <boxGeometry args={[widthM, 0.008, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>

            <mesh position={[widthM / 3, 0.2, depthM / 2 + 0.012]}>
              <boxGeometry args={[0.015, 0.35, 0.015]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )}
      </group>

      {/* 5. 3D Precision Transform Gizmo (Attached when Selected) */}
      {isSelected && (
        <TransformControls
          object={groupRef}
          mode={transformMode}
          size={0.75}
          showX={transformMode === 'translate'}
          showZ={transformMode === 'translate'}
          showY={transformMode === 'rotate' || isWall}
          translationSnap={snapEnabled ? 0.05 : null}
          rotationSnap={snapEnabled ? Math.PI / 2 : null}
          onMouseDown={() => {
            if (controlsRef?.current) controlsRef.current.enabled = false;
          }}
          onMouseUp={() => {
            if (controlsRef?.current) controlsRef.current.enabled = true;
            commitFinalPosition();
          }}
        />
      )}
    </>
  );
};
