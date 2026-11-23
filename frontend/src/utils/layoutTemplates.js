/**
 * KitchenCraft Architectural Layout Templates & Auto-Arrangement Engine
 * Generates modular cabinet layouts based on architectural kitchen shapes:
 * - STRAIGHT (Single Wall)
 * - L_SHAPED (Corner adjacent runs)
 * - U_SHAPED (Three surrounding walls)
 * - PARALLEL (Galley opposing runs)
 * - ISLAND (Perimeter run + freestanding center island)
 */

export const LAYOUT_CONFIGS = {
  L_SHAPED: {
    id: 'L_SHAPED',
    name: 'L-Shaped Kitchen',
    description: 'Corner layout running along two adjacent walls. Ideal for open-plan living with an efficient work triangle.',
    activeWalls: ['TOP', 'LEFT'],
    badge: 'Popular & Versatile'
  },
  STRAIGHT: {
    id: 'STRAIGHT',
    name: 'Straight / Single Wall',
    description: 'Linear layout along a single perimeter wall. Best for compact spaces and minimalist open lofts.',
    activeWalls: ['TOP'],
    badge: 'Space Saver'
  },
  U_SHAPED: {
    id: 'U_SHAPED',
    name: 'U-Shaped Kitchen',
    description: 'Continuous run wrapping around three walls. Maximizes countertop surface and storage capacity.',
    activeWalls: ['LEFT', 'TOP', 'RIGHT'],
    badge: 'Maximum Counter Space'
  },
  PARALLEL: {
    id: 'PARALLEL',
    name: 'Parallel / Galley',
    description: 'Two opposing counter runs separated by a central corridor. Preferred by professional chefs for quick workflow.',
    activeWalls: ['LEFT', 'RIGHT'],
    badge: 'Chef Favorite'
  },
  ISLAND: {
    id: 'ISLAND',
    name: 'Island Kitchen',
    description: 'Perimeter preparation run with a freestanding center island for cooking, dining, and social prep.',
    activeWalls: ['TOP', 'LEFT', 'ISLAND'],
    badge: 'Luxury & Social'
  }
};

/**
 * Generate starter modular cabinets configured for the specified layout shape
 */
export const generateLayoutCabinets = (layoutType, roomWidthMm, roomLengthMm, roomHeightMm) => {
  const cabinets = [];
  let tempId = -Date.now();

  const createCab = (data) => {
    tempId -= 1;
    return {
      id: tempId,
      carcassMaterial: 'BWR_PLYWOOD',
      shutterMaterial: 'ACRYLIC',
      finishColor: data.finishColor || '#38bdf8',
      posZ: data.posZ || 0,
      rotation: data.rotation || 0,
      notes: data.notes || '',
      ...data
    };
  };

  switch (layoutType) {
    case 'STRAIGHT': {
      // Linear run along Top/Back wall (posY = 0)
      let curX = 100;

      // 1. Tall Pantry Tower
      cabinets.push(
        createCab({
          cabinetType: 'TALL',
          widthMm: 600,
          depthMm: 600,
          heightMm: 2100,
          posX: curX,
          posY: 0,
          finishColor: '#1e293b',
          notes: 'Full height tall pantry tower'
        })
      );
      curX += 600;

      // 2. Base Prep Unit
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: curX,
          posY: 0,
          finishColor: '#38bdf8'
        })
      );
      // Wall Unit above prep
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: curX,
          posY: 0,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );
      curX += 600;

      // 3. Sink Base Unit
      cabinets.push(
        createCab({
          cabinetType: 'SINK_BASE',
          widthMm: 900,
          depthMm: 600,
          heightMm: 860,
          posX: curX,
          posY: 0,
          finishColor: '#0284c7',
          notes: 'Under-counter sink unit with drip tray'
        })
      );
      // Overhead wall unit above sink
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 900,
          depthMm: 350,
          heightMm: 720,
          posX: curX,
          posY: 0,
          posZ: 1450,
          finishColor: '#cbd5e1'
        })
      );
      curX += 900;

      // 4. Drawer Base (Cutlery & Utensils)
      cabinets.push(
        createCab({
          cabinetType: 'DRAWER_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: curX,
          posY: 0,
          finishColor: '#64748b'
        })
      );
      // Wall unit above drawers
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: curX,
          posY: 0,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );
      curX += 600;

      // 5. Hob Base (Cooktop)
      cabinets.push(
        createCab({
          cabinetType: 'HOB_BASE',
          widthMm: 900,
          depthMm: 600,
          heightMm: 860,
          posX: curX,
          posY: 0,
          finishColor: '#f97316',
          notes: 'Gas hob / induction cooktop base'
        })
      );
      curX += 900;

      // 6. End Base Storage (if room fits)
      if (curX + 600 <= roomWidthMm) {
        cabinets.push(
          createCab({
            cabinetType: 'BASE',
            widthMm: 600,
            depthMm: 600,
            heightMm: 860,
            posX: curX,
            posY: 0,
            finishColor: '#38bdf8'
          })
        );
      }
      break;
    }

    case 'L_SHAPED': {
      // Corner connection: Back Wall (X) + Left Wall (Y)

      // --- Left Wall Run (along X = 0, moving down Y) ---
      // 1. Tall Unit at bottom-left corner
      cabinets.push(
        createCab({
          cabinetType: 'TALL',
          widthMm: 600,
          depthMm: 600,
          heightMm: 2100,
          posX: 0,
          posY: Math.min(roomLengthMm - 600, 1800),
          finishColor: '#1e293b',
          notes: 'Pantry tall tower'
        })
      );

      // 2. Sink Base along left run
      cabinets.push(
        createCab({
          cabinetType: 'SINK_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 1200,
          finishColor: '#0284c7',
          notes: 'Sink workstation'
        })
      );

      // 3. Prep Base along left run
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 600,
          finishColor: '#38bdf8'
        })
      );
      // Wall unit above left prep
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: 0,
          posY: 600,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );

      // --- Corner Base (0, 0) ---
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 0,
          finishColor: '#475569',
          notes: 'L-corner blind transition base'
        })
      );

      // --- Back Wall Run (along Y = 0, moving right along X) ---
      // Drawer Base
      cabinets.push(
        createCab({
          cabinetType: 'DRAWER_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 600,
          posY: 0,
          finishColor: '#64748b'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: 600,
          posY: 0,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );

      // Hob Base Unit
      cabinets.push(
        createCab({
          cabinetType: 'HOB_BASE',
          widthMm: 900,
          depthMm: 600,
          heightMm: 860,
          posX: 1200,
          posY: 0,
          finishColor: '#f97316',
          notes: 'Hob cooktop station'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 900,
          depthMm: 350,
          heightMm: 720,
          posX: 1200,
          posY: 0,
          posZ: 1450,
          finishColor: '#cbd5e1'
        })
      );

      // Double Door Base
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 2100,
          posY: 0,
          finishColor: '#38bdf8'
        })
      );
      break;
    }

    case 'U_SHAPED': {
      const rightX = Math.max(1800, roomWidthMm - 600);

      // Left Wall Run (Wet Prep Run)
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 1200,
          finishColor: '#38bdf8'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 600,
          finishColor: '#38bdf8'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: 0,
          posY: 600,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );

      // Left Corner (0, 0)
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 0,
          finishColor: '#475569'
        })
      );

      // Back Wall Run (Sink in center under window)
      const sinkX = Math.round((roomWidthMm - 900) / 2);
      cabinets.push(
        createCab({
          cabinetType: 'DRAWER_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 600,
          posY: 0,
          finishColor: '#64748b'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'SINK_BASE',
          widthMm: 900,
          depthMm: 600,
          heightMm: 860,
          posX: Math.max(1200, sinkX),
          posY: 0,
          finishColor: '#0284c7'
        })
      );

      // Right Corner
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: rightX,
          posY: 0,
          finishColor: '#475569'
        })
      );

      // Right Wall Run (Cooking / Hob Run)
      cabinets.push(
        createCab({
          cabinetType: 'HOB_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: rightX,
          posY: 600,
          finishColor: '#f97316'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'TALL',
          widthMm: 600,
          depthMm: 600,
          heightMm: 2100,
          posX: rightX,
          posY: 1200,
          finishColor: '#1e293b',
          notes: 'Built-in oven / microwave tower'
        })
      );
      break;
    }

    case 'PARALLEL': {
      const rightX = Math.max(1800, roomWidthMm - 600);

      // Left Run: Wet Zone & Preparation (Sink & Drawers)
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 300,
          finishColor: '#38bdf8'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: 0,
          posY: 300,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );

      cabinets.push(
        createCab({
          cabinetType: 'SINK_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 900,
          finishColor: '#0284c7'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: 0,
          posY: 900,
          posZ: 1450,
          finishColor: '#cbd5e1'
        })
      );

      cabinets.push(
        createCab({
          cabinetType: 'DRAWER_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 0,
          posY: 1500,
          finishColor: '#64748b'
        })
      );

      // Right Run: Hot Cooking & Storage (Hob & Tall Tower)
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: rightX,
          posY: 300,
          finishColor: '#38bdf8'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'HOB_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: rightX,
          posY: 900,
          finishColor: '#f97316'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'TALL',
          widthMm: 600,
          depthMm: 600,
          heightMm: 2100,
          posX: rightX,
          posY: 1500,
          finishColor: '#1e293b',
          notes: 'Pantry storage tower'
        })
      );
      break;
    }

    case 'ISLAND': {
      // Perimeter Run along Back Wall
      cabinets.push(
        createCab({
          cabinetType: 'TALL',
          widthMm: 600,
          depthMm: 600,
          heightMm: 2100,
          posX: 200,
          posY: 0,
          finishColor: '#1e293b',
          notes: 'Integrated refrigerator / oven tall unit'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 800,
          posY: 0,
          finishColor: '#38bdf8'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 600,
          depthMm: 350,
          heightMm: 720,
          posX: 800,
          posY: 0,
          posZ: 1450,
          finishColor: '#94a3b8'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'SINK_BASE',
          widthMm: 900,
          depthMm: 600,
          heightMm: 860,
          posX: 1400,
          posY: 0,
          finishColor: '#0284c7'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'WALL',
          widthMm: 900,
          depthMm: 350,
          heightMm: 720,
          posX: 1400,
          posY: 0,
          posZ: 1450,
          finishColor: '#cbd5e1'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: 2300,
          posY: 0,
          finishColor: '#38bdf8'
        })
      );

      // Freestanding Center Island (placed in middle of floor)
      const islandX = Math.max(600, Math.round((roomWidthMm - 1500) / 2));
      const islandY = Math.max(1200, Math.round(roomLengthMm * 0.45));

      cabinets.push(
        createCab({
          cabinetType: 'HOB_BASE',
          widthMm: 900,
          depthMm: 600,
          heightMm: 860,
          posX: islandX,
          posY: islandY,
          finishColor: '#f97316',
          notes: 'Center island cooktop station'
        })
      );
      cabinets.push(
        createCab({
          cabinetType: 'DRAWER_BASE',
          widthMm: 600,
          depthMm: 600,
          heightMm: 860,
          posX: islandX + 900,
          posY: islandY,
          finishColor: '#64748b',
          notes: 'Island deep drawer storage'
        })
      );
      break;
    }

    default:
      break;
  }

  return cabinets;
};
