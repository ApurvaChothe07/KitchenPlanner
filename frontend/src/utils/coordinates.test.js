import assert from 'node:assert';
import {
  mmToPx,
  pxToMm,
  snapToGridMm,
  clampWithinRoom,
  isCabinetColliding,
  findCollisions,
  PREDEFINED_CABINETS
} from './coordinates.js';

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

console.log('\nALL 2D COORDINATE AND COLLISION TESTS PASSED SUCCESSFULLY!');
