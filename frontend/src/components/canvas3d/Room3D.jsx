import React from 'react';
import { Grid } from '@react-three/drei';

export const Room3D = ({
  roomWidthMm,
  roomLengthMm,
  roomHeightMm,
  layoutType = 'L_SHAPED'
}) => {
  const roomWm = roomWidthMm / 1000;
  const roomLm = roomLengthMm / 1000;
  const roomHm = roomHeightMm / 1000;

  const wallThickness = 0.15; // 150mm standard architectural wall

  // Resolve active architectural walls according to kitchen layout shape
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

  const hasRightWall =
    layoutType === 'U_SHAPED' || layoutType === 'PARALLEL';

  const hasIslandZone = layoutType === 'ISLAND';

  return (
    <group>
      {/* 1. Floor Plane */}
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomWm, roomLm]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Ground Sub-Floor Grid Helper */}
      <Grid
        position={[0, 0.001, 0]}
        args={[roomWm, roomLm]}
        cellSize={0.1} // 100mm cell
        cellThickness={0.6}
        cellColor="#475569"
        sectionSize={0.5} // 500mm major grid
        sectionThickness={1.2}
        sectionColor="#64748b"
        fadeDistance={20}
        infiniteGrid={false}
      />

      {/* Center Island Footprint Zone in 3D */}
      {hasIslandZone && (
        <group position={[0, 0.002, roomLm * 0.05]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.9, 1.1]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.92, 1.12]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
        </group>
      )}

      {/* 2. Back Wall (Z = -roomLm / 2) */}
      {hasBackWall && (
        <>
          <mesh
            position={[0, roomHm / 2, -roomLm / 2 - wallThickness / 2]}
            receiveShadow
          >
            <boxGeometry
              args={[
                roomWm + (hasLeftWall ? wallThickness : 0) + (hasRightWall ? wallThickness : 0),
                roomHm,
                wallThickness
              ]}
            />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          {/* Back Baseboard */}
          <mesh position={[0, 0.05, -roomLm / 2 + 0.01]}>
            <boxGeometry args={[roomWm, 0.1, 0.02]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </>
      )}

      {/* 3. Left Wall (X = -roomWm / 2) */}
      {hasLeftWall && (
        <>
          <mesh
            position={[-roomWm / 2 - wallThickness / 2, roomHm / 2, 0]}
            receiveShadow
          >
            <boxGeometry args={[wallThickness, roomHm, roomLm]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          {/* Left Baseboard */}
          <mesh position={[-roomWm / 2 + 0.01, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.1, roomLm]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </>
      )}

      {/* 4. Right Wall (X = +roomWm / 2) for U-Shaped and Parallel Layouts */}
      {hasRightWall && (
        <>
          <mesh
            position={[roomWm / 2 + wallThickness / 2, roomHm / 2, 0]}
            receiveShadow
          >
            <boxGeometry args={[wallThickness, roomHm, roomLm]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          {/* Right Baseboard */}
          <mesh position={[roomWm / 2 - 0.01, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.1, roomLm]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </>
      )}
    </group>
  );
};
