import React, { useState } from 'react';
import { Plus, Box, ShieldAlert } from 'lucide-react';
import { PREDEFINED_CABINETS } from '../../utils/coordinates';

export const CabinetCatalogPanel = ({ onAddCabinet }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
          <Box className="w-4 h-4 text-brand-500" />
          <span>Cabinet Catalogue</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Click an architectural unit to add to your room canvas.
        </p>

        {/* Category Tabs */}
        <div className="flex space-x-1 mt-3 bg-slate-800/60 p-1 rounded-lg text-xs">
          {PREDEFINED_CABINETS.map((cat, idx) => (
            <button
              key={cat.category}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-1 px-2 rounded-md transition text-[11px] font-medium ${
                activeTab === idx
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {idx === 0 ? 'Base' : idx === 1 ? 'Wall' : 'Tall'}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="text-[11px] font-medium text-slate-400 px-1 uppercase tracking-wider">
          {PREDEFINED_CABINETS[activeTab].category}
        </div>

        {PREDEFINED_CABINETS[activeTab].items.map((item, index) => (
          <div
            key={index}
            className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-brand-500/50 rounded-lg p-3 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-brand-400">
                  {item.name}
                </span>
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                  {item.cabinetType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {item.notes}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
              <div className="text-[11px] font-mono text-slate-300">
                <span>{item.widthMm}</span>
                <span className="text-slate-500">×</span>
                <span>{item.depthMm}</span>
                <span className="text-slate-500">×</span>
                <span>{item.heightMm} mm</span>
              </div>

              <button
                onClick={() => onAddCabinet(item)}
                className="flex items-center space-x-1 text-xs bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1 rounded transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
