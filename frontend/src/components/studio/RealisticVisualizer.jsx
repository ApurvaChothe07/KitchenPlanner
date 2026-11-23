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
  Info
} from 'lucide-react';
import { RealisticScene3D } from './RealisticScene3D';

// Clean neutral empty room template for instant preview before uploading custom photo
const DEFAULT_ROOM_TEMPLATE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="wall" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23f1f5f9"/><stop offset="100%" stop-color="%23e2e8f0"/></linearGradient><linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23cbd5e1"/><stop offset="100%" stop-color="%2394a3b8"/></linearGradient><linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.6"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="680" fill="url(%23wall)"/><polygon points="0,680 1600,680 1600,1000 0,1000" fill="url(%23floor)"/><line x1="0" y1="680" x2="1600" y2="680" stroke="%2364748b" stroke-width="4"/><polygon points="200,680 700,680 1100,1000 0,1000" fill="url(%23sun)"/></svg>';

export const RealisticVisualizer = ({ design, project, onBackTo3D }) => {
  const sceneRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Site Photo State
  const [uploadedSitePhoto, setUploadedSitePhoto] = useState(null);
  const [sitePhotoName, setSitePhotoName] = useState('');

  // Studio Display Mode
  const [environmentMode, setEnvironmentMode] = useState('ROOM_PHOTO'); // 'ROOM_PHOTO' | 'ARCHITECTURAL_STUDIO'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'full'
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const [cameraPreset, setCameraPreset] = useState('FRONT'); // 'FRONT' | 'CORRIDOR' | 'SHOWCASE' | 'ISO'

  // Architectural Finish Controls
  const [finishStyle, setFinishStyle] = useState('SAGE_GLOSS'); // 'SAGE_GLOSS' | 'ALABASTER' | 'CHARCOAL' | 'CUSTOM'
  const [countertopStyle, setCountertopStyle] = useState('TERRAZZO'); // 'TERRAZZO' | 'WHITE_QUARTZ' | 'BLACK_GRANITE'
  const [lightingPreset, setLightingPreset] = useState('WARM_EVENING'); // 'WARM_EVENING' | 'BRIGHT_DAYLIGHT' | 'STUDIO_CLEAN'
  const [includeAppliances, setIncludeAppliances] = useState(true);
  const [enableGlassShowcase, setEnableGlassShowcase] = useState(true);

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

  // Draggable Before/After Split Slider
  const handleSliderMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
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
          {environmentMode === 'ROOM_PHOTO' && (
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  viewMode === 'split' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Split Before / After slider"
              >
                Before / After Split
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  viewMode === 'full' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Full 100% composite"
              >
                Installed View
              </button>
            </div>
          )}

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
            <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px] block">
              Architectural Finishes
            </span>

            {/* Shutter Finish Tone */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Cabinet Shutter Finish</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'SAGE_GLOSS', name: 'Sage Olive', desc: 'Gloss Acrylic', color: '#68846f' },
                  { id: 'ALABASTER', name: 'Alabaster', desc: 'Warm Cream', color: '#f1ede4' },
                  { id: 'CHARCOAL', name: 'Charcoal', desc: 'Matte Slate', color: '#1e293b' },
                  { id: 'CUSTOM', name: 'Custom Finishes', desc: 'From 3D Design', color: '#38bdf8' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFinishStyle(item.id)}
                    className={`p-1.5 rounded-lg border text-left flex items-center space-x-2 transition ${
                      finishStyle === item.id
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="truncate">
                      <div className="text-[11px] font-semibold truncate leading-tight">{item.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
            onMouseMove={(e) => {
              if (viewMode === 'split' && environmentMode === 'ROOM_PHOTO' && e.buttons === 1) {
                handleSliderMove(e);
              }
            }}
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
                {/* Left Tag for Before */}
                {viewMode === 'split' && (
                  <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-200 z-10 pointer-events-none mt-10">
                    📷 Before: Raw Room Photo
                  </div>
                )}
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
              />

              {/* Right Tag for After */}
              {environmentMode === 'ROOM_PHOTO' && viewMode === 'split' && (
                <div className="absolute top-4 right-4 bg-emerald-950/85 backdrop-blur border border-emerald-500/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 pointer-events-none">
                  ✨ Installed: Real-Time 3D Kitchen ({stats.total} units)
                </div>
              )}
            </div>

            {/* INTERACTIVE SPLIT SLIDER DIVIDER */}
            {environmentMode === 'ROOM_PHOTO' && viewMode === 'split' && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] cursor-ew-resize z-20"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={(e) => {
                  const onMove = (moveEvt) => handleSliderMove(moveEvt);
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-950 font-bold shadow-2xl flex items-center justify-center text-xs border border-slate-300 hover:scale-110 transition">
                  ↔
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
                Finish: <strong className="text-amber-300">{finishStyle.replace('_', ' ')}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
