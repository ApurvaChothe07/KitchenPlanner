import React from 'react';
import { Line, Rect, Text, Group } from 'react-konva';
import { mmToPx } from '../../utils/coordinates';

export const GridLayer = ({ roomWidthMm, roomLengthMm, scale, gridStepMm = 100 }) => {
  const roomWidthPx = mmToPx(roomWidthMm, scale);
  const roomLengthPx = mmToPx(roomLengthMm, scale);
  const gridStepPx = mmToPx(gridStepMm, scale);

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

  return (
    <Group>
      {/* Floor Background */}
      <Rect
        x={0}
        y={0}
        width={roomWidthPx}
        height={roomLengthPx}
        fill="#0f172a"
        stroke="#475569"
        strokeWidth={3}
        cornerRadius={2}
      />

      {/* Grid Lines */}
      {verticalLines}
      {horizontalLines}

      {/* Room Wall Outlines (Simulating architectural wall thickness) */}
      <Rect
        x={-8}
        y={-8}
        width={roomWidthPx + 16}
        height={roomLengthPx + 16}
        stroke="#64748b"
        strokeWidth={8}
      />

      {/* Dimension Labels (Top & Left) */}
      <Text
        x={roomWidthPx / 2 - 50}
        y={-30}
        text={`↔ Width: ${roomWidthMm} mm (${(roomWidthMm / 1000).toFixed(2)} m)`}
        fontSize={12}
        fill="#94a3b8"
        fontStyle="bold"
      />
      <Text
        x={-35}
        y={roomLengthPx / 2 + 50}
        rotation={-90}
        text={`↕ Length: ${roomLengthMm} mm (${(roomLengthMm / 1000).toFixed(2)} m)`}
        fontSize={12}
        fill="#94a3b8"
        fontStyle="bold"
      />
    </Group>
  );
};
