import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { GridLayer } from './GridLayer';
import { CabinetItem } from './CabinetItem';
import { isCabinetColliding } from '../../utils/coordinates';

export const KitchenCanvas = ({
  roomWidthMm,
  roomLengthMm,
  cabinets,
  selectedCabinetId,
  onSelectCabinet,
  onMoveCabinet
}) => {
  const containerRef = useRef(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  // Update canvas stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageDimensions({
          width: containerRef.current.offsetWidth || 800,
          height: containerRef.current.offsetHeight || 600
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute dynamic scale (1 mm to screen pixels) to fit the room with 60px padding
  const paddingPx = 80;
  const availableWidth = Math.max(200, stageDimensions.width - paddingPx * 2);
  const availableHeight = Math.max(200, stageDimensions.height - paddingPx * 2);

  const scale = Math.min(
    availableWidth / Math.max(1000, roomWidthMm),
    availableHeight / Math.max(1000, roomLengthMm)
  );

  // Center room inside the stage
  const roomWidthPx = roomWidthMm * scale;
  const roomLengthPx = roomLengthMm * scale;
  const offsetX = Math.max(40, (stageDimensions.width - roomWidthPx) / 2);
  const offsetY = Math.max(40, (stageDimensions.height - roomLengthPx) / 2);

  // Pre-calculate collision state for each cabinet
  const collidingCabinetIds = new Set();
  for (let i = 0; i < cabinets.length; i++) {
    for (let j = i + 1; j < cabinets.length; j++) {
      if (isCabinetColliding(cabinets[i], cabinets[j])) {
        collidingCabinetIds.add(cabinets[i].id);
        collidingCabinetIds.add(cabinets[j].id);
      }
    }
  }

  const handleStageClick = (e) => {
    // If user clicks on empty canvas background, deselect cabinet
    if (e.target === e.target.getStage()) {
      onSelectCabinet(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
      <Stage
        width={stageDimensions.width}
        height={stageDimensions.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          <Group x={offsetX} y={offsetY}>
            {/* Grid & Wall Layer */}
            <GridLayer
              roomWidthMm={roomWidthMm}
              roomLengthMm={roomLengthMm}
              scale={scale}
              gridStepMm={100}
            />

            {/* Cabinets Layer */}
            {cabinets.map((cab) => (
              <CabinetItem
                key={cab.id}
                cabinet={cab}
                isSelected={cab.id === selectedCabinetId}
                isColliding={collidingCabinetIds.has(cab.id)}
                scale={scale}
                roomWidthMm={roomWidthMm}
                roomLengthMm={roomLengthMm}
                onSelect={onSelectCabinet}
                onMove={onMoveCabinet}
              />
            ))}
          </Group>
        </Layer>
      </Stage>

      {/* Floating Canvas Scale & Help Badge */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-300 flex items-center space-x-3 pointer-events-none">
        <span>Grid: 100 mm</span>
        <span>•</span>
        <span>Snap: 50 mm</span>
        <span>•</span>
        <span>Scale: {(scale * 1000).toFixed(1)} px/m</span>
      </div>
    </div>
  );
};
