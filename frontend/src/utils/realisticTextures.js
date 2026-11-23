import * as THREE from 'three';

// Cache generated textures to avoid regenerating every frame
const textureCache = new Map();

/**
 * Procedural Terrazzo Texture
 * Generates high-resolution stone composite texture matching sage green & speckled stone kitchens
 */
export function getTerrazzoTexture() {
  if (textureCache.has('terrazzo')) return textureCache.get('terrazzo');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base off-white stone background
  ctx.fillStyle = '#f3efe8';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle sand noise in the background
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Terrazzo stone chips palette (Sage olive, charcoal, terracotta, grey, gold)
  const chipColors = [
    '#58725f', // Sage green
    '#394e40', // Deep olive
    '#1e293b', // Charcoal slate
    '#0f172a', // Black obsidian
    '#c48472', // Terracotta peach
    '#94a3b8', // Cool grey
    '#cbd5e1', // Light limestone
    '#b45309'  // Amber fleck
  ];

  // Draw 600 irregular stone chips
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = Math.random() * 14 + 3;
    const color = chipColors[Math.floor(Math.random() * chipColors.length)];

    ctx.fillStyle = color;
    ctx.beginPath();
    const vertices = Math.floor(Math.random() * 4) + 4; // 4 to 7-sided polygon
    for (let v = 0; v < vertices; v++) {
      const angle = (v / vertices) * Math.PI * 2;
      const radius = size * (0.6 + Math.random() * 0.8);
      const vx = x + Math.cos(angle) * radius;
      const vy = y + Math.sin(angle) * radius;
      if (v === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw 1500 tiny speckles
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = Math.random() * 2 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#1e293b' : '#64748b';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  textureCache.set('terrazzo', texture);
  return texture;
}

/**
 * Procedural Polished Floor Tile Texture
 * Large format glossy tiles with subtle grout lines
 */
export function getFloorTileTexture() {
  if (textureCache.has('floor_tile')) return textureCache.get('floor_tile');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Cream-white glossy tile base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle marble cloudy variation
  ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 300 + 100, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grout lines (4x4 tile grid)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  const tileSize = 1024 / 4;
  for (let i = 0; i <= 4; i++) {
    // Vertical
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, 1024);
    ctx.stroke();

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(1024, i * tileSize);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);

  textureCache.set('floor_tile', texture);
  return texture;
}

/**
 * Procedural Calacatta Marble Texture
 */
export function getMarbleTexture() {
  if (textureCache.has('marble')) return textureCache.get('marble');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft grey marble veins
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (let v = 0; v < 6; v++) {
    ctx.beginPath();
    let x = Math.random() * 1024;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < 1024) {
      x += (Math.random() - 0.45) * 60;
      y += Math.random() * 80 + 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  textureCache.set('marble', texture);
  return texture;
}

/**
 * Procedural Black Granite Texture
 */
export function getGraniteTexture() {
  if (textureCache.has('granite')) return textureCache.get('granite');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.5;
    ctx.fillStyle = Math.random() > 0.7 ? '#94a3b8' : '#334155';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);

  textureCache.set('granite', texture);
  return texture;
}
