/**
 * KitchenCraft 2D Coordinate & Unit Transformation Utilities
 * All internal domain units are stored in Millimetres (mm).
 * Screen rendering converts mm to canvas pixels using dynamic scale.
 */

// Convert millimetres to canvas screen pixels
export const mmToPx = (mm, scale) => mm * scale;

// Convert canvas screen pixels to millimetres
export const pxToMm = (px, scale) => Math.round(px / scale);

// Snap millimetre value to grid step (e.g. 50mm or 100mm)
export const snapToGridMm = (valMm, stepMm = 50) => {
  return Math.round(valMm / stepMm) * stepMm;
};

// Clamp cabinet position within room walls (in mm)
export const clampWithinRoom = (posX, posY, widthMm, depthMm, roomWidthMm, roomLengthMm) => {
  const maxX = Math.max(0, roomWidthMm - widthMm);
  const maxY = Math.max(0, roomLengthMm - depthMm);
  return {
    posX: Math.max(0, Math.min(posX, maxX)),
    posY: Math.max(0, Math.min(posY, maxY))
  };
};

/**
 * Axis-Aligned Bounding Box (AABB) 2D Collision Detection
 * Checks if cabinetA and cabinetB overlap in floor space.
 * Wall cabinets (Z >= 1400mm) do not collide with Base cabinets (Z < 1000mm).
 */
export const isCabinetColliding = (cabA, cabB) => {
  if (cabA.id === cabB.id) return false;

  // Vertical elevation check: Wall cabinets don't collide with Base cabinets
  const isAWall = cabA.cabinetType === 'WALL' || (cabA.posZ && cabA.posZ >= 1400);
  const isBWall = cabB.cabinetType === 'WALL' || (cabB.posZ && cabB.posZ >= 1400);
  if (isAWall !== isBWall) {
    return false; // Different vertical levels (countertop vs overhead)
  }

  // 2D floor AABB check
  const aLeft = cabA.posX;
  const aRight = cabA.posX + cabA.widthMm;
  const aTop = cabA.posY;
  const aBottom = cabA.posY + cabA.depthMm;

  const bLeft = cabB.posX;
  const bRight = cabB.posX + cabB.widthMm;
  const bTop = cabB.posY;
  const bBottom = cabB.posY + cabB.depthMm;

  return (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop);
};

// Check if a target cabinet collides with any other cabinet in the design
export const findCollisions = (targetCabinet, allCabinets) => {
  return allCabinets.filter(other => isCabinetColliding(targetCabinet, other));
};

/**
 * 2D (mm, top-left room origin) to 3D (metres, centered room origin) Coordinate Transform
 * Converts millimeter cabinet position and dimensions into centered Three.js world space coordinates.
 */
export const to3DCoordinates = (cabinet, roomWidthMm, roomLengthMm) => {
  const roomWm = roomWidthMm / 1000;
  const roomLm = roomLengthMm / 1000;

  // Convert dimensions from mm to metres
  const widthM = cabinet.widthMm / 1000;
  const depthM = cabinet.depthMm / 1000;
  const heightM = cabinet.heightMm / 1000;

  // 2D center point in mm from top-left room origin
  const centerXMm = cabinet.posX + cabinet.widthMm / 2;
  const centerYMm = cabinet.posY + cabinet.depthMm / 2;
  const centerZElevationMm = (cabinet.posZ || 0) + cabinet.heightMm / 2;

  // Transform to 3D world space in metres (room centered on X and Z, Y sits on floor = 0)
  const x = centerXMm / 1000 - roomWm / 2;
  const y = centerZElevationMm / 1000;
  const z = centerYMm / 1000 - roomLm / 2;

  // Rotation around vertical Y axis in radians
  const rotationY = -((cabinet.rotation || 0) * Math.PI) / 180;

  return {
    position: [x, y, z],
    dimensions: [widthM, heightM, depthM],
    rotationY
  };
};

/**
 * 3D (metres, centered room origin) to 2D (mm, top-left room origin) Coordinate Transform
 * Converts 3D world position (x, y, z) in metres back into 2D millimeter domain coordinates.
 * Also clamps within room walls and optionally snaps to grid step.
 */
export const from3DCoordinates = (
  xM,
  yM,
  zM,
  cabinet,
  roomWidthMm,
  roomLengthMm,
  snapGrid = true,
  stepMm = 50
) => {
  const roomWm = roomWidthMm / 1000;
  const roomLm = roomLengthMm / 1000;

  // Inverse X transform: centerXMm / 1000 - roomWm / 2 = xM
  const centerXMm = (xM + roomWm / 2) * 1000;
  let posX = Math.round(centerXMm - cabinet.widthMm / 2);

  // Inverse Z transform: centerYMm / 1000 - roomLm / 2 = zM
  const centerYMm = (zM + roomLm / 2) * 1000;
  let posY = Math.round(centerYMm - cabinet.depthMm / 2);

  // Inverse Y elevation transform: (posZ + heightMm / 2) / 1000 = yM
  const centerZElevationMm = yM * 1000;
  let posZ = Math.round(centerZElevationMm - cabinet.heightMm / 2);

  // For Base/Tall cabinets, posZ sits on the floor (0)
  if (cabinet.cabinetType !== 'WALL') {
    posZ = 0;
  } else {
    posZ = Math.max(0, posZ);
  }

  // Snap to grid if requested
  if (snapGrid && stepMm > 0) {
    posX = snapToGridMm(posX, stepMm);
    posY = snapToGridMm(posY, stepMm);
    if (cabinet.cabinetType === 'WALL') {
      posZ = snapToGridMm(posZ, stepMm);
    }
  }

  // Clamp within room boundaries
  const clamped = clampWithinRoom(
    posX,
    posY,
    cabinet.widthMm,
    cabinet.depthMm,
    roomWidthMm,
    roomLengthMm
  );

  return {
    posX: clamped.posX,
    posY: clamped.posY,
    posZ
  };
};

/**
 * 3D rotation (radians around Y) to 2D rotation (degrees 0-360)
 */
export const from3DRotation = (rotationYRad, snapTo90 = false) => {
  let deg = (-Math.round((rotationYRad * 180) / Math.PI)) % 360;
  if (deg < 0) deg += 360;
  if (deg === 0 || Object.is(deg, -0)) deg = 0;

  if (snapTo90) {
    deg = (Math.round(deg / 90) * 90) % 360;
    if (deg === 0) deg = 0;
  }
  return deg;
};

// Predefined Modular Cabinet Catalog (Standard architectural mm dimensions)
export const PREDEFINED_CABINETS = [
  {
    category: 'Base Cabinets',
    items: [
      {
        cabinetType: 'BASE',
        name: 'Single Door Base',
        widthMm: 450,
        depthMm: 600,
        heightMm: 860,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'LAMINATE',
        finishColor: '#475569',
        notes: 'Standard single door base unit with 1 adjustable shelf'
      },
      {
        cabinetType: 'BASE',
        name: 'Double Door Base',
        widthMm: 600,
        depthMm: 600,
        heightMm: 860,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'LAMINATE',
        finishColor: '#475569',
        notes: 'Double door base storage cabinet'
      },
      {
        cabinetType: 'SINK_BASE',
        name: 'Sink Base Unit',
        widthMm: 900,
        depthMm: 600,
        heightMm: 860,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'ACRYLIC',
        finishColor: '#38bdf8',
        notes: 'Waterproof carcass base with stainless steel drip tray'
      },
      {
        cabinetType: 'HOB_BASE',
        name: 'Hob & Cooktop Base',
        widthMm: 900,
        depthMm: 600,
        heightMm: 860,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'ACRYLIC',
        finishColor: '#f97316',
        notes: 'Heat-resistant hob base with reinforced drawer runners'
      },
      {
        cabinetType: 'DRAWER_BASE',
        name: '3-Drawer Base',
        widthMm: 600,
        depthMm: 600,
        heightMm: 860,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'LAMINATE',
        finishColor: '#64748b',
        notes: '1 cutlery drawer + 2 deep tandem box drawers'
      }
    ]
  },
  {
    category: 'Wall Cabinets (Overhead)',
    items: [
      {
        cabinetType: 'WALL',
        name: 'Single Door Wall',
        widthMm: 450,
        depthMm: 350,
        heightMm: 720,
        posZ: 1450,
        carcassMaterial: 'MDF',
        shutterMaterial: 'LAMINATE',
        finishColor: '#94a3b8',
        notes: 'Overhead wall unit with soft-close hinges'
      },
      {
        cabinetType: 'WALL',
        name: 'Double Door Wall',
        widthMm: 600,
        depthMm: 350,
        heightMm: 720,
        posZ: 1450,
        carcassMaterial: 'MDF',
        shutterMaterial: 'LAMINATE',
        finishColor: '#94a3b8',
        notes: 'Double door overhead storage cabinet'
      },
      {
        cabinetType: 'WALL',
        name: 'Wide Overhead Wall',
        widthMm: 900,
        depthMm: 350,
        heightMm: 720,
        posZ: 1450,
        carcassMaterial: 'MDF',
        shutterMaterial: 'ACRYLIC',
        finishColor: '#cbd5e1',
        notes: 'Wide bi-fold lift-up wall cabinet'
      }
    ]
  },
  {
    category: 'Tall Units',
    items: [
      {
        cabinetType: 'TALL',
        name: 'Pantry Tall Unit',
        widthMm: 600,
        depthMm: 600,
        heightMm: 2100,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'ACRYLIC',
        finishColor: '#334155',
        notes: 'Full-height pantry tower with internal pull-out wire baskets'
      },
      {
        cabinetType: 'TALL',
        name: 'Built-in Oven Tall Unit',
        widthMm: 600,
        depthMm: 600,
        heightMm: 2100,
        posZ: 0,
        carcassMaterial: 'BWR_PLYWOOD',
        shutterMaterial: 'ACRYLIC',
        finishColor: '#1e293b',
        notes: 'Mid-height appliance niche for built-in microwave and oven'
      }
    ]
  }
];
