import React from 'react';
import { Maximize2, Layers } from 'lucide-react';

export const RoomDimensionsPanel = ({
  roomWidthMm,
  roomLengthMm,
  roomHeightMm,
  layoutType,
  onChangeDimensions,
  onChangeLayoutType
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200 mb-3">
        <Maximize2 className="w-4 h-4 text-brand-500" />
        <span>Room Dimensions (Millimetres)</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Width (X) mm</label>
          <input
            type="number"
            min={1000}
            max={30000}
            step={50}
            value={roomWidthMm}
            onChange={(e) => onChangeDimensions('roomWidthMm', parseInt(e.target.value) || 1000)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">{(roomWidthMm / 1000).toFixed(2)} m</span>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Length (Y) mm</label>
          <input
            type="number"
            min={1000}
            max={30000}
            step={50}
            value={roomLengthMm}
            onChange={(e) => onChangeDimensions('roomLengthMm', parseInt(e.target.value) || 1000)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">{(roomLengthMm / 1000).toFixed(2)} m</span>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Ceiling Height mm</label>
          <input
            type="number"
            min={1800}
            max={6000}
            step={50}
            value={roomHeightMm}
            onChange={(e) => onChangeDimensions('roomHeightMm', parseInt(e.target.value) || 2800)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">{(roomHeightMm / 1000).toFixed(2)} m</span>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 flex items-center space-x-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Layout Shape</span>
          </label>
          <select
            value={layoutType}
            onChange={(e) => onChangeLayoutType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:border-brand-500 focus:outline-none"
          >
            <option value="L_SHAPED">L-Shaped</option>
            <option value="STRAIGHT">Straight / Single Wall</option>
            <option value="U_SHAPED">U-Shaped</option>
            <option value="PARALLEL">Parallel / Galley</option>
            <option value="ISLAND">Island Kitchen</option>
          </select>
          <span className="text-[10px] text-slate-500">Preset Guide</span>
        </div>
      </div>
    </div>
  );
};
