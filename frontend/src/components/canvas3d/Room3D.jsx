import React from 'react';
import { Grid } from '@react-three/drei';

export const Room3D = ({ roomWidthMm, roomLengthMm, roomHeightMm }) => {
  const roomWm = roomWidthMm / 1000;
  const roomLm = roomLengthMm / 1000;
  const roomHm = roomHeightMm / 1000;

  const wallThickness = 0.15; // 150mm standard architectural wall

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

      {/* 2. Back Wall (Z = -roomLm / 2) */}
      <mesh
        position={[0, roomHm / 2, -roomLm / 2 - wallThickness / 2]}
        receiveShadow
      >
        <boxGeometry args={[roomWm + wallThickness * 2, roomHm, wallThickness]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* 3. Left Wall (X = -roomWm / 2) */}
      <mesh
        position={[-roomWm / 2 - wallThickness / 2, roomHm / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[wallThickness, roomHm, roomLm]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* 4. Subtle Baseboard Trim (Left & Back) */}
      <mesh position={[0, 0.05, -roomLm / 2 + 0.01]}>
        <boxGeometry args={[roomWm, 0.1, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-roomWm / 2 + 0.01, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, roomLm]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};
