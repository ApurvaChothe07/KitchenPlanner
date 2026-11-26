import assert from 'node:assert';
import {
  mmToPx,
  pxToMm,
  snapToGridMm,
  clampWithinRoom,
  isCabinetColliding,
  findCollisions,
  to3DCoordinates,
  from3DCoordinates,
  from3DRotation,
  PREDEFINED_CABINETS
} from './coordinates.js';
import { autoArrangeExistingCabinets, generateLayoutCabinets } from './layoutTemplates.js';

console.log('Running 2D Kitchen Editor Coordinates & Physics Verification...');

// 1. mm to Px and Px to mm conversions
const scale = 0.2; // 1 mm = 0.2 px (1000 mm = 200 px)
assert.strictEqual(mmToPx(1000, scale), 200, '1000mm at 0.2 scale must be 200px');
assert.strictEqual(pxToMm(200, scale), 1000, '200px at 0.2 scale must be 1000mm');
console.log('✓ mm <-> px conversions verified');

// 2. Grid Snapping
assert.strictEqual(snapToGridMm(448, 50), 450, '448mm should snap to 450mm with 50mm step');
assert.strictEqual(snapToGridMm(422, 50), 400, '422mm should snap to 400mm with 50mm step');
console.log('✓ 50mm grid snapping verified');

// 3. Room boundary clamping (4500 x 3600 mm room, 600 x 600 mm cabinet)
// Inside room: (1000, 1000) -> remains (1000, 1000)
const inside = clampWithinRoom(1000, 1000, 600, 600, 4500, 3600);
assert.strictEqual(inside.posX, 1000);
assert.strictEqual(inside.posY, 1000);

// Negative out of bounds: (-200, -100) -> clamped to (0, 0)
const negative = clampWithinRoom(-200, -100, 600, 600, 4500, 3600);
assert.strictEqual(negative.posX, 0);
assert.strictEqual(negative.posY, 0);

// Exceeding room max: (4200, 3400) -> maxX = 4500 - 600 = 3900; maxY = 3600 - 600 = 3000
const overflow = clampWithinRoom(4200, 3400, 600, 600, 4500, 3600);
assert.strictEqual(overflow.posX, 3900, 'Should clamp right edge to 3900mm');
assert.strictEqual(overflow.posY, 3000, 'Should clamp bottom edge to 3000mm');
console.log('✓ Boundary clamping within room walls verified');

// 4. Overlap & Collision Detection
const baseCab1 = { id: 1, cabinetType: 'BASE', posX: 0, posY: 0, widthMm: 600, depthMm: 600, posZ: 0 };
const baseCab2Overlapping = { id: 2, cabinetType: 'BASE', posX: 400, posY: 200, widthMm: 600, depthMm: 600, posZ: 0 };
const baseCab3NonOverlapping = { id: 3, cabinetType: 'BASE', posX: 700, posY: 0, widthMm: 600, depthMm: 600, posZ: 0 };

assert.strictEqual(isCabinetColliding(baseCab1, baseCab2Overlapping), true, 'Overlapping base cabinets must be detected');
assert.strictEqual(isCabinetColliding(baseCab1, baseCab3NonOverlapping), false, 'Non-overlapping base cabinets must not collide');

// 5. Vertical Elevation separation (Base vs Wall cabinet at same floor coordinates)
const wallCab = { id: 4, cabinetType: 'WALL', posX: 0, posY: 0, widthMm: 600, depthMm: 350, posZ: 1450 };
assert.strictEqual(
  isCabinetColliding(baseCab1, wallCab),
  false,
  'Wall cabinet above base cabinet must NOT trigger collision'
);
console.log('✓ 2D AABB & Vertical elevation collision logic verified');

// 6. Predefined Catalogue Integrity
assert.ok(PREDEFINED_CABINETS.length >= 3, 'Must have at least Base, Wall, Tall categories');
for (const cat of PREDEFINED_CABINETS) {
  for (const item of cat.items) {
    assert.ok(item.widthMm >= 150 && item.widthMm <= 3000, `${item.name} width within bounds`);
    assert.ok(item.depthMm >= 150 && item.depthMm <= 1200, `${item.name} depth within bounds`);
    assert.ok(item.heightMm >= 200 && item.heightMm <= 3000, `${item.name} height within bounds`);
  }
}
console.log('✓ Predefined architectural catalogue integrity verified');

// 7. 2D to 3D Coordinate Mapping Verification
// Room: 4000mm (4m) width, 3000mm (3m) length
// Cabinet at (0, 0) with width 600mm, depth 600mm, height 860mm, posZ 0
const cornerCab = {
  posX: 0,
  posY: 0,
  posZ: 0,
  widthMm: 600,
  depthMm: 600,
  heightMm: 860,
  rotation: 0
};
const res3D = to3DCoordinates(cornerCab, 4000, 3000);

// X center: (0 + 300) / 1000 - 4/2 = 0.3 - 2.0 = -1.7 m
// Y center: (0 + 430) / 1000 = 0.43 m
// Z center: (0 + 300) / 1000 - 3/2 = 0.3 - 1.5 = -1.2 m
assert.strictEqual(Math.round(res3D.position[0] * 100) / 100, -1.7, '3D X should be -1.7m');
assert.strictEqual(Math.round(res3D.position[1] * 100) / 100, 0.43, '3D Y should be 0.43m (half height above floor)');
assert.strictEqual(Math.round(res3D.position[2] * 100) / 100, -1.2, '3D Z should be -1.2m');
assert.strictEqual(res3D.dimensions[0], 0.6, '3D width should be 0.6m');
assert.strictEqual(res3D.dimensions[1], 0.86, '3D height should be 0.86m');
assert.strictEqual(res3D.dimensions[2], 0.6, '3D depth should be 0.6m');
console.log('✓ 2D to 3D metric coordinate and centering transform verified');

// 8. 3D to 2D Inverse Transform Verification
const back2D = from3DCoordinates(
  res3D.position[0],
  res3D.position[1],
  res3D.position[2],
  cornerCab,
  4000,
  3000,
  false // No snapping for exact inverse check
);
assert.strictEqual(back2D.posX, cornerCab.posX, 'Inverse X must match original posX 0mm');
assert.strictEqual(back2D.posY, cornerCab.posY, 'Inverse Y must match original posY 0mm');
assert.strictEqual(back2D.posZ, 0, 'Base cabinet posZ must be 0mm');

// Test with off-center cabinet, 50mm grid snapping and boundary clamping
const offCenterCab = {
  posX: 1250,
  posY: 850,
  posZ: 0,
  widthMm: 600,
  depthMm: 600,
  heightMm: 860,
  cabinetType: 'BASE'
};
const off3D = to3DCoordinates(offCenterCab, 4000, 3000);
const recovered = from3DCoordinates(
  off3D.position[0] + 0.02, // Add slight 20mm jitter
  off3D.position[1],
  off3D.position[2] - 0.02,
  offCenterCab,
  4000,
  3000,
  true, // snapGrid
  50
);
assert.strictEqual(recovered.posX, 1250, 'Jittered X should snap to 1250mm');
assert.strictEqual(recovered.posY, 850, 'Jittered Y should snap to 850mm');

// Test rotation conversion
assert.strictEqual(from3DRotation(0), 0);
assert.strictEqual(from3DRotation(-Math.PI / 2), 90);
assert.strictEqual(from3DRotation(-Math.PI), 180);
assert.strictEqual(from3DRotation(-Math.PI * 1.5), 270);
console.log('✓ 3D to 2D inverse coordinate, snapping, and rotation transform verified');

// 8. Auto-Arrange for User-Added Components
const userAddedCabinets = [
  { id: 101, cabinetType: 'SINK_BASE', widthMm: 800, depthMm: 600, heightMm: 860, finishColor: '#1e3a8a', posX: 100, posY: 100 },
  { id: 102, cabinetType: 'HOB_BASE', widthMm: 900, depthMm: 600, heightMm: 860, finishColor: '#f97316', posX: 100, posY: 100 },
  { id: 103, cabinetType: 'DRAWER_BASE', widthMm: 600, depthMm: 600, heightMm: 860, finishColor: '#475569', posX: 100, posY: 100 },
  { id: 104, cabinetType: 'TALL', widthMm: 600, depthMm: 600, heightMm: 2100, finishColor: '#0f172a', posX: 100, posY: 100 },
  { id: 105, cabinetType: 'WALL', widthMm: 600, depthMm: 350, heightMm: 720, finishColor: '#f8fafc', posX: 100, posY: 100 },
  { id: 106, cabinetType: 'BASE', widthMm: 600, depthMm: 600, heightMm: 860, finishColor: '#38bdf8', posX: 100, posY: 100 }
];

['STRAIGHT', 'L_SHAPED', 'U_SHAPED', 'PARALLEL', 'ISLAND'].forEach((layout) => {
  const arranged = autoArrangeExistingCabinets(userAddedCabinets, layout, 4500, 3600, 2800);
  assert.strictEqual(arranged.length, userAddedCabinets.length, `All ${userAddedCabinets.length} cabinets must be preserved in ${layout}`);

  // Verify IDs and custom finish colors are strictly preserved
  arranged.forEach((cab) => {
    const original = userAddedCabinets.find((u) => u.id === cab.id);
    assert.ok(original, `Original cabinet ${cab.id} must exist in arranged output`);
    assert.strictEqual(cab.finishColor, original.finishColor, `Custom color on cab ${cab.id} must be preserved`);
    
    // Verify within room boundaries based on effective rotated footprint
    const isRot = cab.rotation === 90 || cab.rotation === 270;
    const effW = isRot ? cab.depthMm : cab.widthMm;
    const effD = isRot ? cab.widthMm : cab.depthMm;
    assert.ok(cab.posX >= 0 && cab.posX <= 4500 - effW, `Cabinet ${cab.id} posX (${cab.posX}) must be within room`);
    assert.ok(cab.posY >= 0 && cab.posY <= 3600 - effD, `Cabinet ${cab.id} posY (${cab.posY}) must be within room`);

    // Verify wall elevation
    if (cab.cabinetType === 'WALL') {
      assert.ok(cab.posZ >= 1200, `Wall cabinet ${cab.id} posZ (${cab.posZ}) must be at overhead elevation`);
    } else {
      assert.strictEqual(cab.posZ, 0, `Floor cabinet ${cab.id} posZ must be 0`);
    }

    // Verify wall alignment and handle orientation (handles facing opposite to wall)
    if (cab.posX === 0 && cab.posY > 0) {
      // Left wall run: handles must face EAST (opposite to left wall) -> 270°
      assert.strictEqual(cab.rotation, 270, `Cabinet ${cab.id} on Left wall in ${layout} must have rotation 270° so handles face into room`);
    } else if (cab.posX >= 4500 - 650) {
      // Right wall run: handles must face WEST (opposite to right wall) -> 90°
      assert.strictEqual(cab.rotation, 90, `Cabinet ${cab.id} on Right wall in ${layout} must have rotation 90° so handles face into room`);
    } else if (cab.posY === 0 && cab.posX > 0) {
      // Top wall run: handles must face SOUTH (opposite to top wall) -> 0°
      assert.strictEqual(cab.rotation, 0, `Cabinet ${cab.id} on Top wall in ${layout} must have rotation 0° so handles face into room`);
    }
  });
});
console.log('✓ Auto-arrange for dynamically added components across all 5 layout shapes verified');

// 9. Starter Template Layouts Verification (Handles and Wall Alignment)
['STRAIGHT', 'L_SHAPED', 'U_SHAPED', 'PARALLEL', 'ISLAND'].forEach((layout) => {
  const starter = generateLayoutCabinets(layout, 4500, 3600, 2800);
  assert.ok(starter.length >= 4, `Starter template for ${layout} must contain components`);
  starter.forEach((cab) => {
    if (cab.posX === 0 && cab.posY > 0) {
      assert.strictEqual(cab.rotation, 270, `Starter ${cab.id} on Left wall in ${layout} must have rotation 270°`);
    } else if (cab.posX >= 4500 - 650 && cab.posY > 0) {
      assert.strictEqual(cab.rotation, 90, `Starter ${cab.id} on Right wall in ${layout} must have rotation 90°`);
    } else if (cab.posY === 0 && cab.posX > 0 && cab.posX < 4500 - 650) {
      assert.strictEqual(cab.rotation, 0, `Starter ${cab.id} on Top wall in ${layout} must have rotation 0°`);
    }
  });
});
console.log('✓ Starter templates handle orientation opposite to active walls verified');

console.log('\nALL 2D AND 3D COORDINATE TESTS PASSED SUCCESSFULLY!');
