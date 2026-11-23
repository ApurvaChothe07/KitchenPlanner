import React from 'react';
import { Line, Rect, Text, Group } from 'react-konva';
import { mmToPx } from '../../utils/coordinates';

export const GridLayer = ({
  roomWidthMm,
  roomLengthMm,
  scale,
  gridStepMm = 100,
  layoutType = 'L_SHAPED'
}) => {
  const roomWidthPx = mmToPx(roomWidthMm, scale);
  const roomLengthPx = mmToPx(roomLengthMm, scale);
  const gridStepPx = mmToPx(gridStepMm, scale);
  const counterDepthPx = mmToPx(600, scale); // Standard 600mm counter depth guide

  // Resolve active walls from layout shape
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

  const hasIsland = layoutType === 'ISLAND';

  // Grid lines
  const verticalLines = [];
  for (let x = 0; x <= roomWidthPx; x += gridStepPx) {
    verticalLines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, roomLengthPx]}
        stroke="#334155"
        strokeWidth={x % (gridStepPx * 5) === 0 ? 1 : 0.4}
        dash={x % (gridStepPx * 5) === 0 ? [] : [4, 4]}
      />
    );
  }

  const horizontalLines = [];
  for (let y = 0; y <= roomLengthPx; y += gridStepPx) {
    horizontalLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, roomWidthPx, y]}
        stroke="#334155"
        strokeWidth={y % (gridStepPx * 5) === 0 ? 1 : 0.4}
        dash={y % (gridStepPx * 5) === 0 ? [] : [4, 4]}
      />
    );
  }

  // Island footprint coordinates (if Island kitchen)
  const islandWidthPx = mmToPx(1800, scale);
  const islandDepthPx = mmToPx(900, scale);
  const islandXPx = Math.max(0, (roomWidthPx - islandWidthPx) / 2);
  const islandYPx = Math.max(0, roomLengthPx * 0.45);

  return (
    <Group>
      {/* 1. Floor Background */}
      <Rect
        x={0}
        y={0}
        width={roomWidthPx}
        height={roomLengthPx}
        fill="#0f172a"
        stroke="#475569"
        strokeWidth={1.5}
        cornerRadius={2}
      />

      {/* 2. Grid Mesh */}
      {verticalLines}
      {horizontalLines}

      {/* 3. Architectural Layout Shape Countertop Guides (Dashed blueprint zones) */}
      {/* Back Wall Run (Top) */}
      {hasBackWall && (
        <Group listening={false}>
          <Rect
            x={0}
            y={0}
            width={roomWidthPx}
            height={counterDepthPx}
            fill="#38bdf8"
            opacity={0.06}
            stroke="#38bdf8"
            strokeWidth={1}
            dash={[6, 6]}
          />
          <Text
            x={10}
            y={8}
            text="── BACK COUNTER RUN (600mm) ──"
            fontSize={9}
            fill="#38bdf8"
            fontStyle="bold"
            opacity={0.65}
          />
        </Group>
      )}

      {/* Left Wall Run */}
      {hasLeftWall && (
        <Group listening={false}>
          <Rect
            x={0}
            y={hasBackWall ? counterDepthPx : 0}
            width={counterDepthPx}
            height={hasBackWall ? roomLengthPx - counterDepthPx : roomLengthPx}
            fill="#38bdf8"
            opacity={0.06}
            stroke="#38bdf8"
            strokeWidth={1}
            dash={[6, 6]}
          />
          <Text
            x={8}
            y={hasBackWall ? counterDepthPx + 20 : 20}
            text="LEFT RUN"
            fontSize={9}
            fill="#38bdf8"
            fontStyle="bold"
            opacity={0.65}
          />
        </Group>
      )}

      {/* Right Wall Run (U-Shaped / Parallel) */}
      {hasRightWall && (
        <Group listening={false}>
          <Rect
            x={roomWidthPx - counterDepthPx}
            y={hasBackWall ? counterDepthPx : 0}
            width={counterDepthPx}
            height={hasBackWall ? roomLengthPx - counterDepthPx : roomLengthPx}
            fill="#38bdf8"
            opacity={0.06}
            stroke="#38bdf8"
            strokeWidth={1}
            dash={[6, 6]}
          />
          <Text
            x={roomWidthPx - counterDepthPx + 8}
            y={hasBackWall ? counterDepthPx + 20 : 20}
            text="RIGHT RUN"
            fontSize={9}
            fill="#38bdf8"
            fontStyle="bold"
            opacity={0.65}
          />
        </Group>
      )}

      {/* Center Island Guide Zone (Island Kitchen) */}
      {hasIsland && (
        <Group listening={false}>
          <Rect
            x={islandXPx}
            y={islandYPx}
            width={islandWidthPx}
            height={islandDepthPx}
            fill="#f97316"
            opacity={0.08}
            stroke="#f97316"
            strokeWidth={1.5}
            dash={[6, 4]}
            cornerRadius={4}
          />
          <Text
            x={islandXPx + islandWidthPx / 2 - 50}
            y={islandYPx + islandDepthPx / 2 - 6}
            text="★ ISLAND ZONE (1800×900)"
            fontSize={9}
            fill="#f97316"
            fontStyle="bold"
            opacity={0.8}
          />
        </Group>
      )}

      {/* 4. Active Solid Architectural Walls (Thick Structural Outline) */}
      {/* Top / Back Wall */}
      {hasBackWall ? (
        <Line
          points={[-6, -4, roomWidthPx + 6, -4]}
          stroke="#64748b"
          strokeWidth={8}
          lineCap="round"
        />
      ) : (
        <Line
          points={[0, 0, roomWidthPx, 0]}
          stroke="#334155"
          strokeWidth={1.5}
          dash={[4, 4]}
        />
      )}

      {/* Left Wall */}
      {hasLeftWall ? (
        <Line
          points={[-4, -6, -4, roomLengthPx + 6]}
          stroke="#64748b"
          strokeWidth={8}
          lineCap="round"
        />
      ) : (
        <Line
          points={[0, 0, 0, roomLengthPx]}
          stroke="#334155"
          strokeWidth={1.5}
          dash={[4, 4]}
        />
      )}

      {/* Right Wall */}
      {hasRightWall ? (
        <Line
          points={[roomWidthPx + 4, -6, roomWidthPx + 4, roomLengthPx + 6]}
          stroke="#64748b"
          strokeWidth={8}
          lineCap="round"
        />
      ) : (
        <Line
          points={[roomWidthPx, 0, roomWidthPx, roomLengthPx]}
          stroke="#334155"
          strokeWidth={1.5}
          dash={[4, 4]}
        />
      )}

      {/* 5. Dimension Labels (Top & Left) */}
      <Text
        x={roomWidthPx / 2 - 60}
        y={-28}
        text={`↔ Width: ${roomWidthMm} mm (${(roomWidthMm / 1000).toFixed(2)} m)`}
        fontSize={11}
        fill="#94a3b8"
        fontStyle="bold"
      />
      <Text
        x={-30}
        y={roomLengthPx / 2 + 60}
        rotation={-90}
        text={`↕ Length: ${roomLengthMm} mm (${(roomLengthMm / 1000).toFixed(2)} m)`}
        fontSize={11}
        fill="#94a3b8"
        fontStyle="bold"
      />
    </Group>
  );
};
