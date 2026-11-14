import React from 'react';
import { Sliders, Trash2, RotateCw, AlertTriangle, Layers, Copy } from 'lucide-react';

export const CabinetInspectorPanel = ({
  cabinet,
  isColliding,
  onUpdateCabinet,
  onDeleteCabinet,
  onDuplicateCabinet,
  onDeselect
}) => {
  if (!cabinet) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Sliders className="w-8 h-8 mb-3 opacity-40 text-slate-400" />
        <p className="text-sm font-medium text-slate-400">No Cabinet Selected</p>
        <p className="text-xs mt-1 text-slate-500">
          Click any cabinet on the canvas to inspect coordinates, dimensions, and materials.
        </p>
      </div>
    );
  }

  const handleNumericChange = (field, value) => {
    onUpdateCabinet({
      ...cabinet,
      [field]: Math.max(0, parseInt(value) || 0)
    });
  };

  const handleStringChange = (field, value) => {
    onUpdateCabinet({
      ...cabinet,
      [field]: value
    });
  };

  const handleRotate = () => {
    const nextRot = ((cabinet.rotation || 0) + 90) % 360;
    onUpdateCabinet({
      ...cabinet,
      rotation: nextRot
    });
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
            Cabinet Properties
          </span>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>{cabinet.cabinetType.replace('_', ' ')}</span>
            <span className="text-xs text-slate-500 font-mono">#{cabinet.id}</span>
          </h3>
        </div>
        <button
          onClick={onDeselect}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {/* Collision Warning Banner */}
      {isColliding && (
        <div className="bg-red-950/60 border-y border-red-500/40 p-3 flex items-start space-x-2 text-red-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Spatial Overlap Detected!</p>
            <p className="text-[11px] text-red-400/90 mt-0.5">
              This unit overlaps with an adjacent unit on the same floor level. Move or resize it.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs flex-1">
        {/* Dimensions Group */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-300 mb-2 uppercase tracking-wide">
            Dimensions (mm)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Width</label>
              <input
                type="number"
                min={150}
                max={3000}
                step={50}
                value={cabinet.widthMm}
                onChange={(e) => handleNumericChange('widthMm', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Depth</label>
              <input
                type="number"
                min={150}
                max={1200}
                step={50}
                value={cabinet.depthMm}
                onChange={(e) => handleNumericChange('depthMm', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Height</label>
              <input
                type="number"
                min={200}
                max={3000}
                step={50}
                value={cabinet.heightMm}
                onChange={(e) => handleNumericChange('heightMm', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Position Group */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-300 mb-2 uppercase tracking-wide">
            Coordinates & Position (mm)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">X (Left)</label>
              <input
                type="number"
                step={25}
                value={Math.round(cabinet.posX)}
                onChange={(e) => handleNumericChange('posX', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Y (Top)</label>
              <input
                type="number"
                step={25}
                value={Math.round(cabinet.posY)}
                onChange={(e) => handleNumericChange('posY', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Z (Floor)</label>
              <input
                type="number"
                step={50}
                value={Math.round(cabinet.posZ || 0)}
                onChange={(e) => handleNumericChange('posZ', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Orientation & Rotation */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-300 mb-2 uppercase tracking-wide">
            Rotation
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRotate}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 px-3 rounded flex items-center justify-center space-x-1.5 transition text-slate-200"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90° ({cabinet.rotation || 0}°)</span>
            </button>
          </div>
        </div>

        {/* Materials & Finish */}
        <div className="border-t border-slate-800 pt-3">
          <span className="block text-[11px] font-semibold text-slate-300 mb-2 uppercase tracking-wide">
            Materials & Finishes
          </span>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Carcass Material</label>
              <select
                value={cabinet.carcassMaterial || 'BWR_PLYWOOD'}
                onChange={(e) => handleStringChange('carcassMaterial', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="BWR_PLYWOOD">BWR Plywood (Water Resistant)</option>
                <option value="HDHMR">HDHMR (High Density Moisture Resistant)</option>
                <option value="MDF">MDF (Medium Density Fibreboard)</option>
                <option value="COMMERCIAL_PLY">Commercial Plywood</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Shutter Material</label>
              <select
                value={cabinet.shutterMaterial || 'LAMINATE'}
                onChange={(e) => handleStringChange('shutterMaterial', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="LAMINATE">Laminate (Matte / Gloss)</option>
                <option value="ACRYLIC">Acrylic High Gloss</option>
                <option value="PU_LACQUER">PU Paint Lacquer</option>
                <option value="PVC_FOIL">PVC Foil Wrap</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Notes</label>
              <textarea
                rows={2}
                value={cabinet.notes || ''}
                onChange={(e) => handleStringChange('notes', e.target.value)}
                placeholder="Hardware specs, hinges, soft-close details..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:border-brand-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2">
        <button
          onClick={() => onDuplicateCabinet(cabinet)}
          className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 px-2 rounded text-slate-200 text-xs flex items-center justify-center space-x-1 transition"
        >
          <Copy className="w-3.5 h-3.5 text-slate-400" />
          <span>Duplicate</span>
        </button>

        <button
          onClick={() => onDeleteCabinet(cabinet.id)}
          className="bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 py-1.5 px-3 rounded text-xs flex items-center justify-center space-x-1 transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
