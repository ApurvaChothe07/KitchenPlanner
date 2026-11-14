import React, { useRef, useState, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room3D } from './Room3D';
import { CabinetMesh } from './CabinetMesh';
import { Rotate3d, Compass, Eye, AlertTriangle } from 'lucide-react';

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
  cabinets,
  selectedCabinetId,
  onSelectCabinet,
  onFallbackTo2D
}) => {
  const controlsRef = useRef(null);

  const roomWm = roomWidthMm / 1000;
  const roomLm = roomLengthMm / 1000;
  const roomHm = roomHeightMm / 1000;

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
          />

          {/* Cabinets */}
          {cabinets.map((cab) => (
            <CabinetMesh
              key={cab.id}
              cabinet={cab}
              roomWidthMm={roomWidthMm}
              roomLengthMm={roomLengthMm}
              isSelected={cab.id === selectedCabinetId}
              onSelect={onSelectCabinet}
            />
          ))}

          {/* Orbit, Zoom and Pan Controls */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={[0, roomHm * 0.35, 0]}
            minDistance={0.5}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2 + 0.05} // Do not dip below the floor plane
            dampingFactor={0.08}
          />
        </Canvas>
      </WebGLErrorBoundary>

      {/* Floating 3D Camera Controls & Hint */}
      <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur border border-slate-700/70 p-1.5 rounded-xl shadow-lg">
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
      </div>

      {/* Navigation Helper Tag */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-300 flex items-center space-x-3 pointer-events-none">
        <span>Left-click: Orbit</span>
        <span>•</span>
        <span>Right-click: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
      </div>
    </div>
  );
};
