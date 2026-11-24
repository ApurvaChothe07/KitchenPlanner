import React, { useRef, useState, useEffect, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room3D } from './Room3D';
import { CabinetMesh } from './CabinetMesh';
import {
  Rotate3d,
  Compass,
  Eye,
  AlertTriangle,
  Move,
  RotateCw,
  Grid,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  X,
  Palette,
  Check,
  Wand2
} from 'lucide-react';
import { CABINET_COLOR_PALETTE, isLightColor } from '../../utils/coordinates';

// Error Boundary for WebGL Rendering Failures
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WebGL 3D Rendering Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-white">3D WebGL Visualization Unavailable</h3>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
            WebGL is either disabled or unsupported by your graphics environment. You can continue planning seamlessly using the full-featured 2D Floor Plan view.
          </p>
          <button
            onClick={() => this.props.onFallback()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Switch to 2D Editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const KitchenScene3D = ({
  roomWidthMm,
  roomLengthMm,
  roomHeightMm,
  layoutType = 'L_SHAPED',
  cabinets,
  selectedCabinetId,
  onSelectCabinet,
  onMoveCabinet,
  onUpdateCabinet,
  onDeleteCabinet,
  onDuplicateCabinet,
  onAutoArrange,
  onFallbackTo2D
}) => {
  const controlsRef = useRef(null);
  const [transformMode, setTransformMode] = useState('translate'); // 'translate' | 'rotate'
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  useEffect(() => {
    setIsColorPickerOpen(false);
  }, [selectedCabinetId]);

  const roomWm = roomWidthMm / 1000;
  const roomLm = roomLengthMm / 1000;
  const roomHm = roomHeightMm / 1000;

  const selectedCabinet = cabinets.find((c) => c.id === selectedCabinetId);
  const isWall = selectedCabinet?.cabinetType === 'WALL';

  // Desktop Keyboard Shortcuts in 3D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        onSelectCabinet(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCabinetId && onDeleteCabinet) {
          onDeleteCabinet(selectedCabinetId);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedCabinet && onMoveCabinet) {
          const nextRot = ((selectedCabinet.rotation || 0) + 90) % 360;
          onMoveCabinet(
            selectedCabinet.id,
            selectedCabinet.posX,
            selectedCabinet.posY,
            selectedCabinet.posZ,
            nextRot
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCabinetId, selectedCabinet, onSelectCabinet, onDeleteCabinet, onMoveCabinet]);

  // Quick Action: Rotate 90°
  const handleRotate90 = () => {
    if (!selectedCabinet || !onMoveCabinet) return;
    const nextRot = ((selectedCabinet.rotation || 0) + 90) % 360;
    onMoveCabinet(
      selectedCabinet.id,
      selectedCabinet.posX,
      selectedCabinet.posY,
      selectedCabinet.posZ,
      nextRot
    );
  };

  // Quick Action: Elevation Adjustment for Wall units
  const handleElevate = (deltaMm) => {
    if (!selectedCabinet || !onMoveCabinet) return;
    const currentZ = selectedCabinet.posZ || 1450;
    const maxZ = Math.max(0, roomHeightMm - selectedCabinet.heightMm);
    const newZ = Math.max(0, Math.min(maxZ, currentZ + deltaMm));
    onMoveCabinet(
      selectedCabinet.id,
      selectedCabinet.posX,
      selectedCabinet.posY,
      newZ,
      selectedCabinet.rotation
    );
  };

  // Preset camera views
  const handleCameraPreset = (view) => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;

    if (view === 'ISO') {
      ctrl.object.position.set(roomWm * 0.9, roomHm * 1.4, roomLm * 1.3);
      ctrl.target.set(0, roomHm * 0.35, 0);
    } else if (view === 'TOP') {
      ctrl.object.position.set(0, roomHm * 2.5, 0.01);
      ctrl.target.set(0, 0, 0);
    } else if (view === 'FRONT') {
      ctrl.object.position.set(0, roomHm * 0.5, roomLm * 1.5);
      ctrl.target.set(0, roomHm * 0.4, 0);
    }
    ctrl.update();
  };

  const initialCamPos = [roomWm * 0.9, roomHm * 1.3, roomLm * 1.3];

  return (
    <div className="w-full h-full relative bg-slate-950 select-none">
      <WebGLErrorBoundary onFallback={onFallbackTo2D}>
        <Canvas
          shadows
          camera={{ position: initialCamPos, fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          onPointerMissed={() => onSelectCabinet(null)}
        >
          {/* Lighting Rig */}
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[roomWm * 1.5, roomHm * 2.5, roomLm * 1.5]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          <hemisphereLight groundColor="#0f172a" color="#f8fafc" intensity={0.4} />

          {/* Room Enclosure */}
          <Room3D
            roomWidthMm={roomWidthMm}
            roomLengthMm={roomLengthMm}
            roomHeightMm={roomHeightMm}
            layoutType={layoutType}
          />

          {/* Cabinets with Direct Drag & 3D Transform Gizmo */}
          {cabinets.map((cab) => (
            <CabinetMesh
              key={cab.id}
              cabinet={cab}
              roomWidthMm={roomWidthMm}
              roomLengthMm={roomLengthMm}
              roomHeightMm={roomHeightMm}
              isSelected={cab.id === selectedCabinetId}
              onSelect={onSelectCabinet}
              onMove={onMoveCabinet}
              transformMode={transformMode}
              snapEnabled={snapEnabled}
              controlsRef={controlsRef}
            />
          ))}

          {/* Orbit, Zoom and Pan Controls */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={[0, roomHm * 0.35, 0]}
            minDistance={0.5}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2 + 0.05} // Do not dip below floor
            dampingFactor={0.08}
          />
        </Canvas>
      </WebGLErrorBoundary>

      {/* Floating Camera Presets (Top-Left) */}
      <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur border border-slate-700/70 p-1.5 rounded-xl shadow-lg z-10">
        <button
          onClick={() => handleCameraPreset('ISO')}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium flex items-center space-x-1"
          title="Isometric 3D Perspective"
        >
          <Rotate3d className="w-3.5 h-3.5 text-brand-400" />
          <span>Isometric</span>
        </button>
        <button
          onClick={() => handleCameraPreset('TOP')}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium flex items-center space-x-1"
          title="Top-down Ortho View"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Top-Down</span>
        </button>
        <button
          onClick={() => handleCameraPreset('FRONT')}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium flex items-center space-x-1"
          title="Front Eye-level View"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Eye-Level</span>
        </button>

        {onAutoArrange && (
          <>
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={onAutoArrange}
              className="px-2.5 py-1 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition font-medium flex items-center space-x-1 shadow-sm"
              title={`Auto-arrange all components into ${layoutType.replace('_', ' ')} layout`}
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto-Arrange</span>
            </button>
          </>
        )}
      </div>

      {/* Floating 3D Selected Object Tool Strip (Top-Center) */}
      {selectedCabinet && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-2xl z-20">
          {/* Cabinet Name Badge */}
          <div className="flex items-center space-x-1.5 pr-2 border-r border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-100 max-w-[120px] truncate">
              {selectedCabinet.cabinetType.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({selectedCabinet.posX},{selectedCabinet.posY})
            </span>
          </div>

          {/* Mode: Move (Translate Gizmo) */}
          <button
            onClick={() => setTransformMode('translate')}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center space-x-1 ${
              transformMode === 'translate'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Move / Translate along floor axes (drag arrows or ground plane)"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          {/* Mode: Rotate (Rotation Gizmo) */}
          <button
            onClick={() => setTransformMode('rotate')}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center space-x-1 ${
              transformMode === 'rotate'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Rotate Gizmo around vertical axis"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>

          {/* Quick Turn: 90° Clockwise */}
          <button
            onClick={handleRotate90}
            className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium flex items-center space-x-1"
            title="Quick Rotate 90° Clockwise (Hotkey: R)"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>90°</span>
          </button>

          {/* Snap Toggle (50mm / 90°) */}
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`px-2 py-1 text-xs rounded-lg transition font-medium flex items-center space-x-1 border ${
              snapEnabled
                ? 'border-brand-500/50 bg-brand-950/60 text-brand-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
            title="Toggle 50mm Grid Snapping"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{snapEnabled ? 'Snap: 50mm' : 'Snap: Off'}</span>
          </button>

          {/* Shutter Color Picker Trigger & Popover in 3D */}
          <div className="relative">
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium flex items-center space-x-1.5 border border-slate-700 bg-slate-800/80"
              title="Change Cabinet Shutter Color"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-500 shadow-sm"
                style={{ backgroundColor: selectedCabinet.finishColor || '#475569' }}
              />
              <span>Color</span>
            </button>

            {/* Floating Color Palette Popover */}
            {isColorPickerOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl z-30 w-56">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-200 flex items-center space-x-1">
                    <Palette className="w-3 h-3 text-brand-400" />
                    <span>Shutter Color</span>
                  </span>
                  <button
                    onClick={() => setIsColorPickerOpen(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Swatches Grid */}
                <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                  {CABINET_COLOR_PALETTE.map((swatch) => {
                    const isSelectedColor =
                      (selectedCabinet.finishColor || '#475569').toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => {
                          onUpdateCabinet &&
                            onUpdateCabinet({
                              ...selectedCabinet,
                              finishColor: swatch.hex
                            });
                        }}
                        title={`${swatch.name} (${swatch.hex})`}
                        className={`w-6 h-6 rounded border transition flex items-center justify-center ${
                          isSelectedColor
                            ? 'border-brand-400 ring-2 ring-brand-500/50 scale-105 shadow'
                            : 'border-slate-700 hover:border-slate-500 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isSelectedColor && (
                          <Check
                            className={`w-3 h-3 ${
                              isLightColor(swatch.hex) ? 'text-slate-900' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Native Color Picker Row */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <input
                    type="color"
                    value={selectedCabinet.finishColor || '#475569'}
                    onChange={(e) => {
                      onUpdateCabinet &&
                        onUpdateCabinet({
                          ...selectedCabinet,
                          finishColor: e.target.value
                        });
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-600 bg-transparent"
                  />
                  <input
                    type="text"
                    value={selectedCabinet.finishColor || '#475569'}
                    onChange={(e) => {
                      onUpdateCabinet &&
                        onUpdateCabinet({
                          ...selectedCabinet,
                          finishColor: e.target.value
                        });
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-100 font-mono"
                    placeholder="#38bdf8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Wall Cabinet Height Adjustment */}
          {isWall && (
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-700">
              <button
                onClick={() => handleElevate(100)}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Raise wall cabinet +100mm"
              >
                <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
              </button>
              <button
                onClick={() => handleElevate(-100)}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Lower wall cabinet -100mm"
              >
                <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>
          )}

          {/* Quick Duplicate */}
          {onDuplicateCabinet && (
            <button
              onClick={() => onDuplicateCabinet(selectedCabinet)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Duplicate Cabinet"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Delete */}
          {onDeleteCabinet && (
            <button
              onClick={() => onDeleteCabinet(selectedCabinet.id)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-lg transition"
              title="Delete Cabinet (Hotkey: Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Deselect (Close) */}
          <button
            onClick={() => onSelectCabinet(null)}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
            title="Deselect (Hotkey: Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dynamic Interaction & Navigation Helper Badge (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur border border-slate-700/80 text-xs px-3.5 py-2 rounded-xl text-slate-300 flex items-center space-x-2.5 shadow-xl pointer-events-none z-10">
        {selectedCabinet ? (
          <>
            <span className="text-emerald-400 font-medium">● Unit Selected:</span>
            <span>Click & drag cabinet or gizmo arrows to reposition</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">R: Rotate 90°</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Esc: Deselect</span>
          </>
        ) : (
          <>
            <span>Left-click unit: Select & Drag</span>
            <span className="text-slate-600">•</span>
            <span>Left-click floor: Orbit</span>
            <span className="text-slate-600">•</span>
            <span>Right-click: Pan</span>
            <span className="text-slate-600">•</span>
            <span>Scroll: Zoom</span>
          </>
        )}
      </div>
    </div>
  );
};
