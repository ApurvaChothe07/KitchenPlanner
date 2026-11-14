import React, { useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { mmToPx, pxToMm, snapToGridMm, clampWithinRoom } from '../../utils/coordinates';

const CABINET_COLORS = {
  BASE: { fill: '#1e293b', stroke: '#38bdf8', text: '#f8fafc' },
  SINK_BASE: { fill: '#0c4a6e', stroke: '#0284c7', text: '#e0f2fe' },
  HOB_BASE: { fill: '#7c2d12', stroke: '#ea580c', text: '#ffedd5' },
  DRAWER_BASE: { fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9' },
  WALL: { fill: '#1e1b4b', stroke: '#818cf8', text: '#e0e7ff', dash: [4, 4] },
  TALL: { fill: '#064e3b', stroke: '#10b981', text: '#d1fae5' },
  CORNER: { fill: '#3730a3', stroke: '#6366f1', text: '#ede9fe' }
};

export const CabinetItem = ({
  cabinet,
  isSelected,
  isColliding,
  scale,
  roomWidthMm,
  roomLengthMm,
  onSelect,
  onMove
}) => {
  const groupRef = useRef(null);

  const widthPx = mmToPx(cabinet.widthMm, scale);
  const depthPx = mmToPx(cabinet.depthMm, scale);
  const xPx = mmToPx(cabinet.posX, scale);
  const yPx = mmToPx(cabinet.posY, scale);

  const colorConfig = CABINET_COLORS[cabinet.cabinetType] || CABINET_COLORS.BASE;

  const handleDragEnd = (e) => {
    const rawX = e.target.x();
    const rawY = e.target.y();

    // Convert pixels back to millimetres
    let mmX = pxToMm(rawX, scale);
    let mmY = pxToMm(rawY, scale);

    // Snap to 50mm grid
    mmX = snapToGridMm(mmX, 50);
    mmY = snapToGridMm(mmY, 50);

    // Clamp within room boundaries
    const clamped = clampWithinRoom(
      mmX,
      mmY,
      cabinet.widthMm,
      cabinet.depthMm,
      roomWidthMm,
      roomLengthMm
    );

    // Reset visual konva position to exact clamped/snapped pixel value
    e.target.x(mmToPx(clamped.posX, scale));
    e.target.y(mmToPx(clamped.posY, scale));

    onMove(cabinet.id, clamped.posX, clamped.posY);
  };

  return (
    <Group
      ref={groupRef}
      x={xPx}
      y={yPx}
      rotation={cabinet.rotation || 0}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(cabinet.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(cabinet.id);
      }}
      onDragEnd={handleDragEnd}
    >
      {/* Cabinet Body Rect */}
      <Rect
        width={widthPx}
        height={depthPx}
        fill={colorConfig.fill}
        stroke={
          isColliding
            ? '#ef4444' // Red if overlapping
            : isSelected
            ? '#22c55e' // Bright Green if selected
            : colorConfig.stroke
        }
        strokeWidth={isSelected ? 3 : isColliding ? 3 : 1.5}
        dash={colorConfig.dash || []}
        shadowColor={isColliding ? '#ef4444' : isSelected ? '#22c55e' : '#000000'}
        shadowBlur={isSelected ? 10 : 4}
        shadowOpacity={isSelected ? 0.7 : 0.3}
        cornerRadius={2}
      />

      {/* Internal Hatch / Door Line indicating front edge */}
      <Rect
        x={1}
        y={depthPx - 4}
        width={widthPx - 2}
        height={3}
        fill={isSelected ? '#22c55e' : '#94a3b8'}
      />

      {/* Label: Type & Dimensions */}
      {widthPx > 35 && depthPx > 25 && (
        <>
          <Text
            x={4}
            y={4}
            text={cabinet.cabinetType.replace('_', ' ')}
            fontSize={Math.max(9, Math.min(11, widthPx / 7))}
            fill={colorConfig.text}
            fontStyle="bold"
            listening={false}
          />
          <Text
            x={4}
            y={depthPx - 16}
            text={`${cabinet.widthMm}×${cabinet.depthMm}`}
            fontSize={Math.max(8, Math.min(10, widthPx / 8))}
            fill="#94a3b8"
            listening={false}
          />
        </>
      )}

      {/* Elevation tag for Wall cabinets */}
      {cabinet.cabinetType === 'WALL' && widthPx > 50 && (
        <Text
          x={widthPx - 45}
          y={4}
          text="▲ WALL"
          fontSize={8}
          fill="#818cf8"
          listening={false}
        />
      )}
    </Group>
  );
};
