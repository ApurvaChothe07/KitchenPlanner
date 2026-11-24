import React from 'react';
import { Maximize2, Layers, Wand2 } from 'lucide-react';
import { LAYOUT_CONFIGS } from '../../utils/layoutTemplates';

export const RoomDimensionsPanel = ({
  roomWidthMm,
  roomLengthMm,
  roomHeightMm,
  layoutType,
  onChangeDimensions,
  onChangeLayoutType,
  onAutoArrangeLayout
}) => {
  const currentConfig = LAYOUT_CONFIGS[layoutType] || LAYOUT_CONFIGS.L_SHAPED;

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
          <Maximize2 className="w-4 h-4 text-brand-500" />
          <span>Room Dimensions (Millimetres)</span>
        </div>

        {/* Layout Shape Active Badge & Auto-Arrange Trigger */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-brand-950 border border-brand-500/40 text-brand-300 font-medium">
            {currentConfig.badge}
          </span>
          {onAutoArrangeLayout && (
            <button
              onClick={onAutoArrangeLayout}
              className="px-2.5 py-1 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition font-medium flex items-center space-x-1.5 shadow-sm"
              title={`Auto-arrange all placed and added components into ${currentConfig.name}`}
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto-Arrange {currentConfig.name.split(' ')[0]}</span>
            </button>
          )}
        </div>
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
          <label className="block text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Layout Shape</span>
            </span>
          </label>
          <select
            value={layoutType}
            onChange={(e) => onChangeLayoutType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:border-brand-500 focus:outline-none font-medium"
          >
            <option value="L_SHAPED">L-Shaped Kitchen</option>
            <option value="STRAIGHT">Straight / Single Wall</option>
            <option value="U_SHAPED">U-Shaped Kitchen</option>
            <option value="PARALLEL">Parallel / Galley</option>
            <option value="ISLAND">Island Kitchen</option>
          </select>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
            {currentConfig.description}
          </span>
        </div>
      </div>
    </div>
  );
};
