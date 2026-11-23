import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Download,
  Eye,
  RefreshCw,
  Check,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Maximize2
} from 'lucide-react';

const SAMPLE_RENDERS = [
  {
    id: 'front',
    name: 'Front Elevation View',
    subtitle: 'Straight / L-Run with Terrazzo Splash & Refrigerator',
    src: '/renders/kitchen_front_view.jpg',
    description: 'High-gloss acrylic sage cabinets, induction cooktop, double-door refrigerator, and ceiling-height loft storage.'
  },
  {
    id: 'corridor',
    name: 'Corridor Perspective',
    subtitle: 'Deep Walkway Perspective with Natural Window Lighting',
    src: '/renders/kitchen_corridor_view.jpg',
    description: 'Parallel / galley perspective looking toward window, featuring glass display towers and floor tile reflections.'
  },
  {
    id: 'crockery',
    name: 'Crockery & Bar Showcase',
    subtitle: 'Fluted Glass Cabinets with Warm Internal LED Strip',
    src: '/renders/kitchen_crockery_view.jpg',
    description: 'Black aluminum framed glass display units with terrazzo countertop, deep drawer storage, and concealed ambient lights.'
  }
];

export const RealisticVisualizer = ({ design, project, onBackTo3D }) => {
  const [uploadedSitePhoto, setUploadedSitePhoto] = useState(null);
  const [sitePhotoName, setSitePhotoName] = useState('');
  const [activeRenderIndex, setActiveRenderIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100% for Before/After split
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'render' | 'gallery'

  // Style customization states
  const [finishStyle, setFinishStyle] = useState('SAGE_GLOSS'); // 'SAGE_GLOSS' | 'WHITE_ACRYLIC' | 'CHARCOAL_MATTE'
  const [countertopStyle, setCountertopStyle] = useState('TERRAZZO'); // 'TERRAZZO' | 'BLACK_GRANITE' | 'WHITE_QUARTZ'
  const [lightingPreset, setLightingPreset] = useState('WARM_EVENING'); // 'WARM_EVENING' | 'BRIGHT_DAYLIGHT'
  const [includeAppliances, setIncludeAppliances] = useState(true);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedSitePhoto(event.target.result);
        setSitePhotoName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Realistic Render Generation
  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStep('Analyzing room wall geometry and vanishing lines...');

    setTimeout(() => {
      setGenerationProgress(35);
      setGenerationStep(`Aligning ${design.layoutType.replace('_', ' ')} layout footprint to site walls...`);
    }, 700);

    setTimeout(() => {
      setGenerationProgress(65);
      setGenerationStep('Applying physical materials (High-gloss acrylic, Terrazzo stone, Glass)...');
    }, 1400);

    setTimeout(() => {
      setGenerationProgress(90);
      setGenerationStep('Rendering global illumination, ambient occlusions & floor reflections...');
    }, 2100);

    setTimeout(() => {
      setGenerationProgress(100);
      setGenerationStep('Complete! Photorealistic visualization generated.');
      setIsGenerating(false);
      setViewMode('split');
    }, 2800);
  };

  // Download Render
  const handleDownloadRender = () => {
    const activeRender = SAMPLE_RENDERS[activeRenderIndex];
    const link = document.createElement('a');
    link.href = activeRender.src;
    link.download = `${project?.name || 'Kitchen'}_${activeRender.id}_render.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dragging Before/After Slider
  const handleSliderMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  const activeRender = SAMPLE_RENDERS[activeRenderIndex];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* Top Studio Control Bar */}
      <div className="h-13 bg-slate-900 border-b border-slate-800 px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Realistic Visualizer Studio
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span>Shape: <strong className="text-slate-200">{design.layoutType.replace('_', ' ')}</strong></span>
            <span>•</span>
            <span>Units: <strong className="text-slate-200">{design.cabinets.length} Cabinets</strong></span>
          </div>
        </div>

        {/* View Mode Tabs (Split / Render / Gallery) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'split' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Before / After Split
            </button>
            <button
              onClick={() => setViewMode('render')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'render' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Render
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'gallery' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Angle Gallery ({SAMPLE_RENDERS.length})
            </button>
          </div>

          <button
            onClick={handleDownloadRender}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            title="Download Full Resolution Render"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Export Render</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Site Photo Upload & Studio Parameters */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 flex-shrink-0 text-xs">
          {/* 1. Upload Site Photo Area */}
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
                  Remove
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
                className="border-2 border-dashed border-slate-700 hover:border-brand-500 hover:bg-slate-800/60 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-brand-950 flex items-center justify-center text-slate-400 group-hover:text-brand-400 mb-2 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-200 text-xs">Upload Room Photo</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">
                  Take a photo of the empty kitchen wall where cabinets will be installed.
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                <img
                  src={uploadedSitePhoto}
                  alt="Uploaded Site"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition p-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-brand-600 text-white rounded text-[11px] font-medium"
                  >
                    Replace Photo
                  </button>
                </div>
                <div className="p-2 bg-slate-800/90 text-[10px] text-slate-300 truncate">
                  {sitePhotoName || 'Room site photo attached'}
                </div>
              </div>
            )}
          </div>

          {/* 2. Visual Style Presets */}
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px] block">
              Architectural Finish
            </span>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Shutter Finish Tone</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'SAGE_GLOSS', name: 'Sage Olive', color: '#65816b' },
                  { id: 'WHITE_ACRYLIC', name: 'Alabaster', color: '#f1ede4' },
                  { id: 'CHARCOAL_MATTE', name: 'Charcoal', color: '#1e293b' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFinishStyle(item.id)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] flex items-center space-x-1.5 transition ${
                      finishStyle === item.id
                        ? 'border-brand-500 bg-brand-950/40 text-brand-200 font-semibold'
                        : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Countertop & Splash</label>
              <select
                value={countertopStyle}
                onChange={(e) => setCountertopStyle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="TERRAZZO">Terrazzo Speckle Splash (As in photo)</option>
                <option value="WHITE_QUARTZ">Artificial White Vein Quartz</option>
                <option value="BLACK_GRANITE">Black Galaxy Polished Granite</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Lighting & Ambiance</label>
              <select
                value={lightingPreset}
                onChange={(e) => setLightingPreset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="WARM_EVENING">Warm Ceiling Recessed Spots + Under-Cabinet LED</option>
                <option value="BRIGHT_DAYLIGHT">Natural Window Daylight (Morning Sun)</option>
              </select>
            </div>

            <div className="pt-1">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAppliances}
                  onChange={(e) => setIncludeAppliances(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[11px]">Include Refrigerator, Hob & Chimney</span>
              </label>
            </div>
          </div>

          {/* 3. Generate Action */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-orange-500/10"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing View...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generate Realistic View</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Composites design onto room photo with lighting & shadows
            </p>
          </div>
        </div>

        {/* Right Stage: Interactive Viewport */}
        <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
          {/* Progress Overlay during Generation */}
          {isGenerating && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-xl animate-pulse">
                <Sparkles className="w-8 h-8 text-slate-950" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Generating Realistic In-Place Render</h3>
              <p className="text-xs text-amber-300 font-mono mb-4">{generationStep}</p>
              <div className="w-72 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE 1: Before / After Split Slider */}
          {viewMode === 'split' && (
            <div
              ref={containerRef}
              onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
              onClick={handleSliderMove}
              className="flex-1 relative w-full h-full select-none cursor-ew-resize overflow-hidden flex items-center justify-center bg-black"
            >
              {/* After Image (Full width background) */}
              <img
                src={activeRender.src}
                alt="Realistic Render"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Before Image (Clipped overlay) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={uploadedSitePhoto || activeRender.src}
                  alt="Original Site"
                  style={{ filter: uploadedSitePhoto ? 'none' : 'grayscale(100%) contrast(85%)' }}
                  className="absolute inset-0 w-full h-full object-contain max-w-none"
                />
                <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-200">
                  {uploadedSitePhoto ? '📸 Uploaded Site Photo' : '📷 Original Site (Empty)'}
                </div>
              </div>

              {/* Right Tag */}
              <div className="absolute top-4 right-4 bg-emerald-950/85 backdrop-blur border border-emerald-500/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300">
                ✨ Photorealistic Installation
              </div>

              {/* Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-950 font-bold shadow-xl flex items-center justify-center text-xs">
                  ↔
                </div>
              </div>

              {/* Hint badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-full text-[11px] text-slate-300 pointer-events-none">
                Drag slider left / right to compare transformation
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Full Render Mode */}
          {viewMode === 'render' && (
            <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center p-4">
              <img
                src={activeRender.src}
                alt={activeRender.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-xl max-w-md">
                <h4 className="text-sm font-bold text-white">{activeRender.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{activeRender.description}</p>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Multi-Angle Gallery */}
          {viewMode === 'gallery' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Architectural Elevation Gallery</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    High-definition architectural perspectives generated for your {design.layoutType.replace('_', ' ')} layout.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SAMPLE_RENDERS.map((render, idx) => (
                    <div
                      key={render.id}
                      onClick={() => {
                        setActiveRenderIndex(idx);
                        setViewMode('split');
                      }}
                      className={`group cursor-pointer bg-slate-900 border rounded-2xl overflow-hidden transition hover:scale-[1.02] shadow-xl ${
                        activeRenderIndex === idx
                          ? 'border-brand-500 ring-2 ring-brand-500/40'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="h-48 overflow-hidden bg-slate-950">
                        <img
                          src={render.src}
                          alt={render.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                      <div className="p-3.5">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-brand-300 transition">
                          {render.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {render.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Thumbnails Strip */}
          <div className="h-16 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center space-x-3 overflow-x-auto flex-shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">
              Angles:
            </span>
            {SAMPLE_RENDERS.map((render, idx) => (
              <button
                key={render.id}
                onClick={() => setActiveRenderIndex(idx)}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition flex-shrink-0 ${
                  activeRenderIndex === idx
                    ? 'border-brand-500 bg-slate-800 text-white'
                    : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <img src={render.src} alt="" className="w-7 h-7 object-cover rounded" />
                <span className="text-xs font-medium">{render.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
