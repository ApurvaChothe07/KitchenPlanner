import React, { useState, useRef, useMemo } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Download,
  Eye,
  RefreshCw,
  Layers,
  Maximize2,
  Sliders,
  Sun,
  Palette,
  RotateCcw,
  Box,
  Check,
  ChevronRight,
  Info,
  ArrowLeft
} from 'lucide-react';
import { RealisticScene3D } from './RealisticScene3D';
import { CABINET_COLOR_PALETTE, isLightColor } from '../../utils/coordinates';

// Clean neutral empty room template for instant preview before uploading custom photo
const DEFAULT_ROOM_TEMPLATE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="wall" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23f1f5f9"/><stop offset="100%" stop-color="%23e2e8f0"/></linearGradient><linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23cbd5e1"/><stop offset="100%" stop-color="%2394a3b8"/></linearGradient><linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.6"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="680" fill="url(%23wall)"/><polygon points="0,680 1600,680 1600,1000 0,1000" fill="url(%23floor)"/><line x1="0" y1="680" x2="1600" y2="680" stroke="%2364748b" stroke-width="4"/><polygon points="200,680 700,680 1100,1000 0,1000" fill="url(%23sun)"/></svg>';

export const RealisticVisualizer = ({
  design,
  project,
  onBackTo3D,
  onUpdateCabinet,
  onApplyColorToType
}) => {
  const sceneRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Site Photo State
  const [uploadedSitePhoto, setUploadedSitePhoto] = useState(null);
  const [sitePhotoName, setSitePhotoName] = useState('');

  // Studio Display Mode: defaults to full 3D Architectural Room
  const [environmentMode, setEnvironmentMode] = useState('ARCHITECTURAL_STUDIO'); // 'ARCHITECTURAL_STUDIO' | 'ROOM_PHOTO'
  const [viewMode, setViewMode] = useState('full'); // 'full' (complete installed view by default) | 'split'
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const [cameraPreset, setCameraPreset] = useState('FRONT'); // 'FRONT' | 'CORRIDOR' | 'SHOWCASE' | 'ISO'
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Architectural Finish Controls
  // Default to 'CUSTOM' to automatically reflect individual component colors chosen in 3D scene
  const [finishStyle, setFinishStyle] = useState('CUSTOM'); // 'CUSTOM' (per-component 3D colors) | 'SAGE_GLOSS' | 'ALABASTER' | 'CHARCOAL'
  const [countertopStyle, setCountertopStyle] = useState('TERRAZZO'); // 'TERRAZZO' | 'WHITE_QUARTZ' | 'BLACK_GRANITE'
  const [lightingPreset, setLightingPreset] = useState('WARM_EVENING'); // 'WARM_EVENING' | 'BRIGHT_DAYLIGHT' | 'STUDIO_CLEAN'
  const [includeAppliances, setIncludeAppliances] = useState(true);
  const [enableGlassShowcase, setEnableGlassShowcase] = useState(false);

  // Selected cabinet for live inspection / color tweaking inside studio
  const [selectedCabinetId, setSelectedCabinetId] = useState(null);

  // AR Photo Calibration (Alignment with user room photo)
  const [calibration, setCalibration] = useState({
    scale: 1.0,
    offsetX: 0.0,
    offsetY: 0.0,
    offsetZ: 0.0,
    rotationY: 0.0
  });

  const activePhoto = uploadedSitePhoto || DEFAULT_ROOM_TEMPLATE;

  // Real-time component breakdown
  const stats = useMemo(() => {
    const baseCount = design.cabinets.filter((c) =>
      ['BASE', 'SINK_BASE', 'HOB_BASE', 'DRAWER_BASE'].includes(c.cabinetType)
    ).length;
    const wallCount = design.cabinets.filter((c) => c.cabinetType === 'WALL').length;
    const tallCount = design.cabinets.filter((c) => c.cabinetType === 'TALL').length;
    return { baseCount, wallCount, tallCount, total: design.cabinets.length };
  }, [design.cabinets]);

  // Selected cabinet entity
  const selectedCabinet = useMemo(() => {
    return design.cabinets?.find((c) => c.id === selectedCabinetId) || null;
  }, [design.cabinets, selectedCabinetId]);

  // Breakdown of colors currently present across 3D components
  const detectedColors = useMemo(() => {
    const map = new Map();
    (design.cabinets || []).forEach((c) => {
      const col = (c.finishColor || '#475569').toLowerCase();
      map.set(col, (map.get(col) || 0) + 1);
    });
    return Array.from(map.entries()).map(([color, count]) => ({ color, count }));
  }, [design.cabinets]);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedSitePhoto(event.target.result);
        setSitePhotoName(file.name);
        setEnvironmentMode('ROOM_PHOTO');
      };
      reader.readAsDataURL(file);
    }
  };

  // Draggable Before/After Split Slider with smooth pointer capture
  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSlider(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isDraggingSlider || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  const handlePointerUp = (e) => {
    if (isDraggingSlider) {
      setIsDraggingSlider(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Snapshot Export
  const handleDownloadSnapshot = () => {
    if (sceneRef.current) {
      const name = `${project?.name || 'Kitchen'}_realtime_render.jpg`;
      sceneRef.current.captureSnapshot(name);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden text-slate-100 select-none">
      {/* ============================================================ */}
      {/* 1. TOP STUDIO CONTROL BAR                                    */}
      {/* ============================================================ */}
      <div className="h-13 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          {onBackTo3D && (
            <button
              onClick={onBackTo3D}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition"
              title="Return to interactive 3D floor planner"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to 3D View</span>
            </button>
          )}

          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Realistic Visualizer Studio
            </span>
          </div>

          {/* Real-time sync badge */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Live 3D Reflection
            </span>
            <span>
              Shape: <strong className="text-slate-200">{design.layoutType.replace('_', ' ')}</strong>
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-200">{stats.total} Components</strong> ({stats.baseCount} Base,{' '}
              {stats.wallCount} Wall, {stats.tallCount} Tall)
            </span>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center space-x-2">
          {/* Environment Switcher: Room Photo vs 3D Studio */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setEnvironmentMode('ROOM_PHOTO')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                environmentMode === 'ROOM_PHOTO'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Composite live 3D kitchen directly onto room/wall photo"
            >
              In-Place Room Photo
            </button>
            <button
              onClick={() => setEnvironmentMode('ARCHITECTURAL_STUDIO')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                environmentMode === 'ARCHITECTURAL_STUDIO'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full 3D interior studio with polished tiles and ceiling downlights"
            >
              3D Architectural Room
            </button>
          </div>

          {/* Split Mode Switcher (available in Room Photo mode) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('full')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'full' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full 100% installed kitchen view"
            >
              Installed View
            </button>
            <button
              onClick={() => {
                setViewMode('split');
                if (environmentMode !== 'ROOM_PHOTO') {
                  setEnvironmentMode('ROOM_PHOTO');
                }
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'split' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split Before / After slider"
            >
              Before / After Split
            </button>
          </div>

          {/* Export Snapshot */}
          <button
            onClick={handleDownloadSnapshot}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow"
            title="Download high-resolution image of current view"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Export Render</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN WORKSPACE: LEFT CONTROLS + RIGHT LIVE 3D STAGE      */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT CONTROL PANEL */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 flex-shrink-0 text-xs">
          {/* A. Site Photo Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-brand-400" />
                <span>Site / Wall Photo</span>
              </span>
              {uploadedSitePhoto && (
                <button
                  onClick={() => setUploadedSitePhoto(null)}
                  className="text-[10px] text-red-400 hover:underline"
                >
                  Use Template
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {!uploadedSitePhoto ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-brand-500 hover:bg-slate-800/60 p-3.5 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 group-hover:bg-brand-950 flex items-center justify-center text-slate-400 group-hover:text-brand-400 mb-1.5 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="font-semibold text-slate-200 text-xs">Upload Room Photo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Snap a photo of the empty kitchen wall to project components in place.
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                <img
                  src={uploadedSitePhoto}
                  alt="Uploaded Site"
                  className="w-full h-28 object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition p-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-brand-600 text-white rounded text-[11px] font-medium"
                  >
                    Replace Photo
                  </button>
                </div>
                <div className="p-1.5 bg-slate-800/90 text-[10px] text-slate-300 truncate">
                  {sitePhotoName || 'Custom site photo loaded'}
                </div>
              </div>
            )}
          </div>

          {/* B. Perspective & Scale Calibration (Only active in Room Photo mode) */}
          {environmentMode === 'ROOM_PHOTO' && (
            <div className="border-t border-slate-800 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Photo Perspective Align</span>
                </span>
                <button
                  onClick={() =>
                    setCalibration({
                      scale: 1.0,
                      offsetX: 0.0,
                      offsetY: 0.0,
                      offsetZ: 0.0,
                      rotationY: 0.0
                    })
                  }
                  className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1"
                  title="Reset alignment"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Scale */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Scale / Distance</span>
                  <span className="font-mono text-slate-300">{calibration.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.05"
                  value={calibration.scale}
                  onChange={(e) =>
                    setCalibration((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Elevation / Floor Level */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Floor Level (Elevation)</span>
                  <span className="font-mono text-slate-300">{calibration.offsetY.toFixed(2)}m</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={calibration.offsetY}
                  onChange={(e) =>
                    setCalibration((prev) => ({ ...prev, offsetY: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Horizontal Pan */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Horizontal Pan</span>
                  <span className="font-mono text-slate-300">{calibration.offsetX.toFixed(2)}m</span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.05"
                  value={calibration.offsetX}
                  onChange={(e) =>
                    setCalibration((prev) => ({ ...prev, offsetX: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Wall Rotation Angle */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Wall Angle</span>
                  <span className="font-mono text-slate-300">
                    {Math.round((calibration.rotationY * 180) / Math.PI)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-Math.PI / 4}
                  max={Math.PI / 4}
                  step={0.05}
                  value={calibration.rotationY}
                  onChange={(e) =>
                    setCalibration((prev) => ({ ...prev, rotationY: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                />
              </div>
            </div>
          )}

          {/* C. Architectural Materials & Finishes */}
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px] block">
                Architectural Finishes
              </span>
              {finishStyle === 'CUSTOM' ? (
                <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  3D Colors Active
                </span>
              ) : (
                <button
                  onClick={() => setFinishStyle('CUSTOM')}
                  className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Restore 3D Colors</span>
                </button>
              )}
            </div>

            {/* Shutter Finish Tone */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Cabinet Shutter Finish</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    id: 'CUSTOM',
                    name: '3D Design Colors',
                    desc: 'Per-Component (Live)',
                    isMulti: true
                  },
                  { id: 'SAGE_GLOSS', name: 'Sage Olive', desc: 'Gloss Acrylic Theme', color: '#68846f' },
                  { id: 'ALABASTER', name: 'Alabaster', desc: 'Warm Cream Theme', color: '#f1ede4' },
                  { id: 'CHARCOAL', name: 'Charcoal', desc: 'Matte Slate Theme', color: '#1e293b' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFinishStyle(item.id)}
                    className={`p-1.5 rounded-lg border text-left flex items-center space-x-2 transition ${
                      finishStyle === item.id
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-sm'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.isMulti ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-sky-400 via-amber-400 to-emerald-400 border border-white/20 flex-shrink-0" />
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <div className="truncate">
                      <div className="text-[11px] font-semibold truncate leading-tight">{item.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detected 3D Component Colors Summary */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                  <Palette className="w-3 h-3 text-amber-400" />
                  <span>3D Design Colors</span>
                </span>
                <span className="text-[9px] text-slate-400">{stats.total} components</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {detectedColors.map(({ color, count }) => (
                  <div
                    key={color}
                    className="flex items-center space-x-1 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] text-slate-200"
                    title={`${count} component${count > 1 ? 's' : ''} using ${color}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/30"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-[9px] uppercase">{color}</span>
                    <span className="text-slate-400 font-medium">({count})</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                Click any cabinet in the realistic scene to inspect or modify its color in real time.
              </p>
            </div>

            {/* Selected Component Quick-Color Inspector */}
            {selectedCabinet && (
              <div className="bg-slate-950 border border-amber-500/50 rounded-xl p-3 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-semibold text-slate-100 text-xs truncate max-w-[170px]">
                      {selectedCabinet.cabinetType.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCabinetId(null)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                    title="Deselect"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-[10px] text-slate-400">
                  {selectedCabinet.widthMm}mm × {selectedCabinet.heightMm}mm • {selectedCabinet.shutterMaterial || 'ACRYLIC'}
                </div>

                {/* Color swatches */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                    <span>Component Color</span>
                    <span className="font-mono text-amber-300 uppercase">
                      {selectedCabinet.finishColor || '#475569'}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {CABINET_COLOR_PALETTE.map((swatch) => {
                      const isMatch =
                        (selectedCabinet.finishColor || '#475569').toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => {
                            if (onUpdateCabinet) {
                              onUpdateCabinet({ ...selectedCabinet, finishColor: swatch.hex });
                              setFinishStyle('CUSTOM');
                            }
                          }}
                          className={`w-5 h-5 rounded border transition flex items-center justify-center ${
                            isMatch
                              ? 'border-amber-400 ring-2 ring-amber-500/50 scale-105'
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={`${swatch.name} (${swatch.hex})`}
                        >
                          {isMatch && (
                            <Check
                              className={`w-2.5 h-2.5 ${
                                isLightColor(swatch.hex) ? 'text-slate-900' : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Native input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedCabinet.finishColor || '#475569'}
                      onChange={(e) => {
                        if (onUpdateCabinet) {
                          onUpdateCabinet({ ...selectedCabinet, finishColor: e.target.value });
                          setFinishStyle('CUSTOM');
                        }
                      }}
                      className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedCabinet.finishColor || '#475569'}
                      onChange={(e) => {
                        if (onUpdateCabinet) {
                          onUpdateCabinet({ ...selectedCabinet, finishColor: e.target.value });
                          setFinishStyle('CUSTOM');
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-100 font-mono"
                    />
                  </div>
                </div>

                {/* Batch apply to category */}
                {onApplyColorToType && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyColorToType(
                        selectedCabinet.cabinetType,
                        selectedCabinet.finishColor || '#475569'
                      );
                      setFinishStyle('CUSTOM');
                    }}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[10px] font-medium transition border border-slate-700"
                  >
                    Apply to all {selectedCabinet.cabinetType.includes('BASE') ? 'Base' : selectedCabinet.cabinetType === 'WALL' ? 'Wall' : 'Tall'} units
                  </button>
                )}
              </div>
            )}

            {/* Countertop & Backsplash Material */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Countertop & Backsplash Stone</label>
              <select
                value={countertopStyle}
                onChange={(e) => setCountertopStyle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="TERRAZZO">Terrazzo Speckle (Matching reference photo)</option>
                <option value="WHITE_QUARTZ">Calacatta White Vein Marble</option>
                <option value="BLACK_GRANITE">Black Galaxy Granite</option>
              </select>
            </div>

            {/* Lighting & Ambiance */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Lighting & Ambiance</label>
              <select
                value={lightingPreset}
                onChange={(e) => setLightingPreset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="WARM_EVENING">Warm Ceiling Spots + Under-Cabinet LED (2700K)</option>
                <option value="BRIGHT_DAYLIGHT">Natural Window Daylight (Morning Sunlight)</option>
                <option value="STUDIO_CLEAN">Clean Architectural Studio Light</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAppliances}
                  onChange={(e) => setIncludeAppliances(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-[11px]">Include Refrigerator, Hob & Faucets</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGlassShowcase}
                  onChange={(e) => setEnableGlassShowcase(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-[11px]">Fluted Glass Crockery Showcases</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT STAGE: LIVE 3D SCENE + SPLIT SLIDER */}
        <div className="flex-1 bg-black flex flex-col relative overflow-hidden select-none">
          {/* CAMERA PRESET PILLS (Top Left) */}
          <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur border border-slate-700 p-1.5 rounded-xl shadow-2xl z-10">
            {[
              { id: 'FRONT', name: 'Front Elevation', desc: 'Straight eye-level' },
              { id: 'CORRIDOR', name: 'Corridor Walkway', desc: 'Galley perspective' },
              { id: 'SHOWCASE', name: 'Showcase Angle', desc: 'Detail perspective' },
              { id: 'ISO', name: 'Isometric', desc: '3D Cutaway' }
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => setCameraPreset(cam.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
                  cameraPreset === cam.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={cam.desc}
              >
                {cam.name}
              </button>
            ))}
          </div>

          {/* VIEWPORT AREA */}
          <div
            ref={containerRef}
            className="flex-1 relative w-full h-full overflow-hidden"
          >
            {/* UNDERLYING LAYER: Raw Site Photo (visible in Before/After split) */}
            {environmentMode === 'ROOM_PHOTO' && (
              <div className="absolute inset-0 z-0">
                <img
                  src={activePhoto}
                  alt="Raw Site Photo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* FOREGROUND LAYER: Live Real-Time 3D Kitchen */}
            <div
              className="absolute inset-0 z-1"
              style={{
                clipPath:
                  viewMode === 'split' && environmentMode === 'ROOM_PHOTO'
                    ? `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)`
                    : 'none'
              }}
            >
              {/* Optional Room Photo Backdrop inside the 3D layer for complete alignment */}
              {environmentMode === 'ROOM_PHOTO' && (
                <img
                  src={activePhoto}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none -z-10"
                />
              )}

              {/* The Live Three.js 3D Scene Rendering User's Real Components */}
              <RealisticScene3D
                ref={sceneRef}
                design={design}
                environmentMode={environmentMode}
                finishStyle={finishStyle}
                countertopStyle={countertopStyle}
                lightingPreset={lightingPreset}
                includeAppliances={includeAppliances}
                enableGlassShowcase={enableGlassShowcase}
                cameraPreset={cameraPreset}
                calibration={calibration}
                selectedCabinetId={selectedCabinetId}
                onSelectCabinet={(cab) => setSelectedCabinetId(cab ? cab.id : null)}
                isOrbitEnabled={!isDraggingSlider}
              />
            </div>

            {/* INTERACTIVE SPLIT SLIDER DIVIDER */}
            {environmentMode === 'ROOM_PHOTO' && viewMode === 'split' && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_16px_rgba(255,255,255,0.95)] cursor-ew-resize z-20 touch-none select-none"
                style={{ left: `${sliderPosition}%` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {/* Center Draggable Handle Pill */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-900/95 text-white font-semibold text-[10px] shadow-2xl flex items-center space-x-1.5 border border-amber-500/60 hover:scale-105 active:scale-95 transition cursor-ew-resize select-none pointer-events-none">
                  <span className="text-slate-400 font-medium">Before</span>
                  <span className="text-amber-400 font-bold">↔</span>
                  <span className="text-emerald-400 font-medium">After</span>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM STATUS BAR */}
          <div className="h-10 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0 z-10">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 text-slate-300">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Left-click & drag to rotate 3D camera. Scroll to zoom in/out. Right-click to pan.
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span>
                Room: <strong className="text-slate-200">{design.roomWidthMm}mm × {design.roomLengthMm}mm</strong>
              </span>
              <span>•</span>
              <span>
                Finish:{' '}
                <strong className="text-amber-300">
                  {finishStyle === 'CUSTOM'
                    ? '3D Design Colors (Per-Component)'
                    : finishStyle.replace('_', ' ')}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
