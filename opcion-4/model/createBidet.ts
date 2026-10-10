import { refineGeometry } from './refineGeometry.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

// bevelEnabled defaults to true on THREE.ExtrudeGeometry and rounds every
// corner — sharp/pointed profiles (blades, fork tines, spikes) need
// bevelEnabled: false plus lineTo()-only path segments near the tip, since a
// curve command cannot produce a true converging point.
function buildExtrudeShape(points: [number, number][], holes?: [number, number][][]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length > 0) {
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) {
      shape.lineTo(points[i][0], points[i][1]);
    }
  }
  // Cutouts (e.g. an oval wire-cutter hole) as THREE.Path added to shape.holes —
  // dep-free boolean subtraction via the tessellator, no CSG library needed.
  for (const loop of holes ?? []) {
    if (loop.length < 3) continue;
    const path = new THREE.Path();
    path.moveTo(loop[0][0], loop[0][1]);
    for (let i = 1; i < loop.length; i += 1) path.lineTo(loop[i][0], loop[i][1]);
    path.closePath();
    shape.holes.push(path);
  }
  return shape;
}

// Build an N-gon oval loop (for hole authoring from a compact {cx,cy,rx,ry} descriptor).
function ovalLoop(cx: number, cy: number, rx: number, ry: number, seg = 24): [number, number][] {
  const loop: [number, number][] = [];
  for (let i = 0; i < seg; i += 1) {
    const a = (i / seg) * Math.PI * 2;
    loop.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return loop;
}

function buildExtrudeGeometry(profile: { points: [number, number][]; depth: number; holes?: [number, number][][]; ovalHoles?: { cx: number; cy: number; rx: number; ry: number }[] }): THREE.ExtrudeGeometry {
  const holes = [...(profile.holes ?? []), ...((profile.ovalHoles ?? []).map((o) => ovalLoop(o.cx, o.cy, o.rx, o.ry)))];
  const shape = buildExtrudeShape(profile.points, holes);
  return new THREE.ExtrudeGeometry(shape, {
    depth: profile.depth,
    bevelEnabled: false,
    steps: 1,
  });
}

function buildLatheGeometry(profile: { points: [number, number][]; segments?: number }): THREE.LatheGeometry {
  const points = profile.points.map(([x, y]) => new THREE.Vector2(Math.max(0.0001, x), y));
  return new THREE.LatheGeometry(points, profile.segments ?? 24);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [clampAlbedoChannel((value >> 16) & 255), clampAlbedoChannel((value >> 8) & 255), clampAlbedoChannel(value & 255)];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampAlbedoChannel(value: number): number {
  return Math.max(30, Math.min(240, Math.round(value)));
}

function clampPbrF0(value: number): number {
  return Math.max(0.02, Math.min(1, value));
}

function clampPbrIor(value: number): number {
  return Math.max(1, Math.min(2.5, value));
}

function clampPbrMetalness(value: number): number {
  return value >= 0.5 ? 1 : 0;
}

function clampedAlbedoColor(spec: SculptMaterialSpec): THREE.Color {
  const source = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  // setStyle with an explicit SRGBColorSpace, NOT the numeric constructor.
  //
  // `new THREE.Color(r, g, b)` treats its arguments as LINEAR working-space components,
  // while an authored `baseColor` hex is sRGB. Feeding one to the other skipped the
  // transfer function and lifted every dark albedo: #2e2a28, authored as a near-black
  // vinyl, rendered at roughly sRGB 0.46 — a mid grey. The error is largest exactly where
  // it matters most, because the transfer curve is steepest near black.
  return new THREE.Color().setStyle(source, THREE.SRGBColorSpace);
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [clampAlbedoChannel(Number(match[1])), clampAlbedoChannel(Number(match[2])), clampAlbedoChannel(Number(match[3]))];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions, denseComponent = false): THREE.MeshPhysicalMaterial {
  // A material that declares -- with evidence -- that its subject carries no texture
  // detail gets NO texture set. Synthesising one anyway is not a harmless default: the
  // branch below then forces color to white and roughness to 1 and reads both from the
  // generated maps, so the authored albedo and the reference-derived roughness are both
  // discarded, and the model gains mottling the reference does not have. Measured on the
  // tuxedo cat, whose black fur rendered as speckled grey-and-white from a palette that
  // only ever described two flat regions.
  const textureless = (spec.textureless as { declared?: boolean } | undefined)?.declared === true || spec.colorVariation?.pattern === 'solid';
  const textures = textureless
    ? null
    : makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : clampedAlbedoColor(spec),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clampPbrMetalness(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: clampPbrIor(readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: clampPbrIor(readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clampPbrF0(readLayerNumber(spec.specularF0 ?? spec.f0 ?? spec.specularIntensity, ['base', 'value'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
    flatShading: spec.flatShading === true,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const denseMesh = denseComponent || spec.denseMesh === true || spec.geometryDensity === 'dense' || spec.topologyClass === 'dense';
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    const effectiveBumpScale = denseMesh ? Math.max(0.05, bumpScale) : bumpScale;
    if (effectiveBumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = effectiveBumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    const effectiveDisplacementScale = denseMesh ? Math.max(0.005, displacementScale) : displacementScale;
    if (effectiveDisplacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = effectiveDisplacementScale;
      material.displacementBias = -effectiveDisplacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrConstraints = { albedoRange: [30, 240], binaryMetalness: true, f0Range: [0.02, 1], iorRange: [1, 2.5] };
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.userData.referenceMaterialId = spec.referenceMaterialId ?? spec.materialReference?.profileId ?? null;
  material.userData.materialEvidence = spec.materialEvidence ?? null;
  material.userData.validationViews = spec.materialReference?.validationViews ?? [];
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: PopoWash mechanical bidet
// Sculpt build pass: optimization-pass
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createPopoWashMechanicalBidetModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "PopoWash mechanical bidet";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": false, "fovDegrees": 40, "aspect": 1, "orientation": {"yaw": 0, "pitch": 0, "roll": 0}, "positionHint": [0, 0, 3], "note": "For likeness work, solve the reference camera (forge/stage1_intake/solve_camera_pose.py) so the review render aligns with the photo and the reference can be projected. Confirm by overlay review."}, "approximationNotes": []};
  root.userData.materialPipeline = {"status": "proceed", "regions": [{"regionId": "white-plastic", "materialId": "base", "status": "proceed", "specMaterialId": "base", "componentId": "root", "profileId": "plastic.glossy"}, {"regionId": "chrome-collar", "materialId": "chrome", "status": "proceed", "specMaterialId": "chrome", "componentId": "chrome-collar", "profileId": "metal.steel-polished"}], "notes": "Flat solid albedo. Photo maps retained as uncertain evidence, not tiled illumination. White crop automatic brushed-steel classification rejected by vision: region is smooth molded plastic. Chrome inferred from reflective band; scalars are approximate.", "schemaVersion": 1, "registry": ".agents/skills/img2threejs/docs/materials/material-reference.json"};
  root.userData.materialReferenceRegistry = ".agents/skills/img2threejs/docs/materials/material-reference.json";

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["base"] = createSculptMaterial(
    "base",
    {"id": "base", "name": "White molded plastic", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#f2f2f2", "color": "#f2f2f2", "albedo": {"dominant": "#f2f2f2", "secondary": ["#efefef", "#f9f9f9"], "samplingNotes": "Supplied studio photographs; neutral white, illumination is not albedo."}, "colorVariation": {"palette": ["#f2f2f2", "#f1f1f1"], "pattern": "solid", "amplitude": 0, "heightCorrelation": 0}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2, 2], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2, "amplitude": 0.001, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12, "amplitude": 0.001, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56, "amplitude": 0.001, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.24, "variation": 0.015, "map": "independent low-amplitude molded finish"}, "metalness": {"base": 0, "variation": 0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.015, "scale": 24, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0, "scratches": [], "chips": []}, "dirt": {"amount": 0, "cavityBias": 0, "color": "#2F2A22"}, "localOverrides": [{"id": "edge-gloss", "roughness": 0.18, "description": "Narrow molded outer edge highlight", "evidenceRefs": ["full-object"]}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Uniform clean injection molded plastic. Do not introduce wood, stone, wear, scratches or visible noise.", "referencePbr": {"usable": true, "confidence": 0.716, "sourceImage": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\body-material-crop.png", "verdict": "pass", "method": "reference-pixel-extraction", "maps": {"albedo": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\material-evidence\\white-plastic_albedo.png", "url": "model/material-evidence/white-plastic_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\material-evidence\\white-plastic_roughness.png", "url": "model/material-evidence/white-plastic_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\material-evidence\\white-plastic_height.png", "url": "model/material-evidence/white-plastic_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\material-evidence\\white-plastic_normal.png", "url": "model/material-evidence/white-plastic_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\material-evidence\\white-plastic_ao.png", "url": "model/material-evidence/white-plastic_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}, "hardLimit": "single-image PBR extraction is an estimate; 70%+ extraction confidence still needs render screenshot review"}, "clearcoat": {"base": 0.25}, "clearcoatRoughness": {"base": 0.18}, "solidAlbedoRecipe": {"reason": "Clean uniform finish; reference pixels contain illumination. Independent micro roughness/normal maps supplied by refineGeometry.js, no photo tiling.", "implementation": "refineGeometry.js"}},
    options
  );
  materialMap["chrome"] = createSculptMaterial(
    "chrome",
    {"id": "chrome", "name": "Chrome dial collar", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#c6c9cf", "color": "#c6c9cf", "albedo": {"dominant": "#c6c9cf", "secondary": ["#dedee2"], "samplingNotes": "Narrow reflective collar visible at dial seam"}, "colorVariation": {"palette": ["#f2f2f2", "#f1f1f1"], "pattern": "solid", "amplitude": 0, "heightCorrelation": 0}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2, 2], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2, "amplitude": 0.001, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12, "amplitude": 0.001, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56, "amplitude": 0.001, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.12, "variation": 0.01, "map": "independent metal polish"}, "metalness": {"base": 1, "variation": 0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.015, "scale": 24, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0, "scratches": [], "chips": []}, "dirt": {"amount": 0, "cavityBias": 0, "color": "#2F2A22"}, "localOverrides": [{"id": "collar-polish", "roughness": 0.08, "description": "Polished ring surface"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Uniform clean injection molded plastic. Do not introduce wood, stone, wear, scratches or visible noise.", "referencePbr": {"usable": true, "confidence": 0.771, "sourceImage": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\chrome-material-crop.png", "verdict": "pass", "method": "reference-pixel-extraction", "maps": {"albedo": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\chrome-evidence\\chrome_albedo.png", "url": "model/chrome-evidence/chrome_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\chrome-evidence\\chrome_roughness.png", "url": "model/chrome-evidence/chrome_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\chrome-evidence\\chrome_height.png", "url": "model/chrome-evidence/chrome_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\chrome-evidence\\chrome_normal.png", "url": "model/chrome-evidence/chrome_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\andre\\Desktop\\POPOWASH\\opcion-4\\model\\chrome-evidence\\chrome_ao.png", "url": "model/chrome-evidence/chrome_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}, "hardLimit": "single-image PBR extraction is an estimate; 70%+ extraction confidence still needs render screenshot review"}, "solidAlbedoRecipe": {"reason": "Clean uniform finish; reference pixels contain illumination. Independent micro roughness/normal maps supplied by refineGeometry.js, no photo tiling.", "implementation": "refineGeometry.js"}},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const endpoint_root_0 = makeAttachmentEndpoint(null);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "root__pivot";
  node_root_0.scale.set(1, 1, 1);
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "root", "level": "macro", "role": "root", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[-1.4, -0.37], [1.3, -0.37], [1.32638916015625, -0.3674365234375], [1.3493945312500002, -0.3598046875], [1.3691479492187497, -0.3471923828125], [1.38578125, -0.32968749999999997], [1.39942626953125, -0.3073779296875], [1.41021484375, -0.2303515625], [1.41827880859375, -0.19869628906250003], [1.42375, -0.1625], [1.42676025390625, -0.1218505859375], [1.42744140625, -0.0768359375], [1.42592529296875, -0.027543945312499984], [1.5309062500000001, -0.032637499999999986], [1.52406748046875, 0.03876542968750005], [1.51499453125, 0.11514531250000001], [1.50385087890625, 0.19639316406250001], [1.4908, 0.28240000000000004], [1.4740587890625, 0.38580498046875], [1.4394078125, 0.47723984375000006], [1.3892810546874999, 0.55635947265625], [1.3261125000000002, 0.62281875], [1.2523361328125, 0.6762725585937501], [1.1703859375, 0.71637578125], [1.0826958984375001, 0.7427833007812501], [0.9916999999999999, 0.75515], [0.8998322265625001, 0.7531307617187498], [0.8095265625, 0.73638046875], [0.7232169921874999, 0.7045540039062501], [0.6433375, 0.65730625], [0.5723220703125, 0.59429208984375], [0.5126046874999999, 0.5151664062499999], [0.46661933593750005, 0.41958408203124997], [0.4368000000000001, 0.3072], [0.49, 0.18], [-0.45, 0.18], [-0.47967529296875, 0.29263427734374997], [-0.41257890624999993, 0.41955078124999995], [-0.47932880859375004, 0.52297998046875], [-0.5574312499999999, 0.60848125], [-0.64447041015625, 0.67618173828125], [-0.7380304687500001, 0.72620859375], [-0.83569560546875, 0.75868896484375], [-0.9350500000000002, 0.77375], [-1.0336778320312499, 0.7715188476562499], [-1.12916328125, 0.7521226562500001], [-1.21909052734375, 0.71568857421875], [-1.3010437499999998, 0.66234375], [-1.37260712890625, 0.59221533203125], [-1.43136484375, 0.50543046875], [-1.47490107421875, 0.40211630859375], [-1.5008, 0.28240000000000004], [-1.4, -0.37]], "depth": 0.12}, "reconstructionRefinement": {"source": "01-estudio-giro-000.png", "discRadius": 0.425, "controlAxisX": -2.08, "armSpine": [[-1.35, -0.12, 0.12], [-2.35, -0.22, 0.12], [-2.16, -0.84, 0.12], [-2.08, -1.475, 0.12]], "armHalfWidth": 0.275, "armHalfDepthRange": [0.065, 0.27], "slotHalfWidth": 0.05, "slotHalfLength": 0.2, "implementation": "refineGeometry.js", "note": "Measured macro ratios from original photo. Hidden underside inferred, no manufacturing dimensions.", "controlAxisAngle": 0.12, "mountingPlateBezier": {"bottomY": -0.37, "lobeTopY": 0.8, "rightX": 1.52, "leftX": -1.48, "valleyY": 0.14, "implementation": "refineGeometry.js"}, "collar": {"radius": 0.276, "length": 0.055, "axis": "same straight Y axis as control, rotated .12 radians around Z"}, "surfaceRecipe": {"brandMark": "approximate POPO/WASH canvas typography", "controlDots": 9, "offAccent": "#df292e", "conformalPatch": {"tRange": [0.61, 0.99], "angleRange": [0.9, 2.24]}, "seams": "narrow neutral-gray lines; no artificial wear"}}}, "parent": null, "attachment": null, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "curved-arm-socket", "name": "curved-arm-socket", "position": [0, 0, 0.01], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "disc-a-socket", "name": "disc-a-socket", "position": [-0.98, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "disc-b-socket", "name": "disc-b-socket", "position": [0.97, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "dial-socket", "name": "dial-socket", "position": [-2.0231367015377635, -1.9465841020305865, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-housing-socket", "name": "nozzle-housing-socket", "position": [0.16, -0.45, -0.23], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "chrome-collar-socket", "name": "chrome-collar-socket", "position": [-2.08, -1.475, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-a-socket", "name": "nozzle-a-socket", "position": [0.04, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-b-socket", "name": "nozzle-b-socket", "position": [0.28, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "root-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_root_0.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "curved-arm-socket", "name": "curved-arm-socket", "position": [0, 0, 0.01], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "disc-a-socket", "name": "disc-a-socket", "position": [-0.98, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "disc-b-socket", "name": "disc-b-socket", "position": [0.97, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "dial-socket", "name": "dial-socket", "position": [-2.0231367015377635, -1.9465841020305865, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-housing-socket", "name": "nozzle-housing-socket", "position": [0.16, -0.45, -0.23], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "chrome-collar-socket", "name": "chrome-collar-socket", "position": [-2.08, -1.475, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-a-socket", "name": "nozzle-a-socket", "position": [0.04, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-b-socket", "name": "nozzle-b-socket", "position": [0.28, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 16, 6)
    : buildExtrudeGeometry({"points": [[-1.4, -0.37], [1.3, -0.37], [1.32638916015625, -0.3674365234375], [1.3493945312500002, -0.3598046875], [1.3691479492187497, -0.3471923828125], [1.38578125, -0.32968749999999997], [1.39942626953125, -0.3073779296875], [1.41021484375, -0.2303515625], [1.41827880859375, -0.19869628906250003], [1.42375, -0.1625], [1.42676025390625, -0.1218505859375], [1.42744140625, -0.0768359375], [1.42592529296875, -0.027543945312499984], [1.5309062500000001, -0.032637499999999986], [1.52406748046875, 0.03876542968750005], [1.51499453125, 0.11514531250000001], [1.50385087890625, 0.19639316406250001], [1.4908, 0.28240000000000004], [1.4740587890625, 0.38580498046875], [1.4394078125, 0.47723984375000006], [1.3892810546874999, 0.55635947265625], [1.3261125000000002, 0.62281875], [1.2523361328125, 0.6762725585937501], [1.1703859375, 0.71637578125], [1.0826958984375001, 0.7427833007812501], [0.9916999999999999, 0.75515], [0.8998322265625001, 0.7531307617187498], [0.8095265625, 0.73638046875], [0.7232169921874999, 0.7045540039062501], [0.6433375, 0.65730625], [0.5723220703125, 0.59429208984375], [0.5126046874999999, 0.5151664062499999], [0.46661933593750005, 0.41958408203124997], [0.4368000000000001, 0.3072], [0.49, 0.18], [-0.45, 0.18], [-0.47967529296875, 0.29263427734374997], [-0.41257890624999993, 0.41955078124999995], [-0.47932880859375004, 0.52297998046875], [-0.5574312499999999, 0.60848125], [-0.64447041015625, 0.67618173828125], [-0.7380304687500001, 0.72620859375], [-0.83569560546875, 0.75868896484375], [-0.9350500000000002, 0.77375], [-1.0336778320312499, 0.7715188476562499], [-1.12916328125, 0.7521226562500001], [-1.21909052734375, 0.71568857421875], [-1.3010437499999998, 0.66234375], [-1.37260712890625, 0.59221533203125], [-1.43136484375, 0.50543046875], [-1.47490107421875, 0.40211630859375], [-1.5008, 0.28240000000000004], [-1.4, -0.37]], "depth": 0.12});
  if (!endpoint_root_0) {
    mesh_root_0Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "root";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "root", "level": "macro", "role": "root", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[-1.4, -0.37], [1.3, -0.37], [1.32638916015625, -0.3674365234375], [1.3493945312500002, -0.3598046875], [1.3691479492187497, -0.3471923828125], [1.38578125, -0.32968749999999997], [1.39942626953125, -0.3073779296875], [1.41021484375, -0.2303515625], [1.41827880859375, -0.19869628906250003], [1.42375, -0.1625], [1.42676025390625, -0.1218505859375], [1.42744140625, -0.0768359375], [1.42592529296875, -0.027543945312499984], [1.5309062500000001, -0.032637499999999986], [1.52406748046875, 0.03876542968750005], [1.51499453125, 0.11514531250000001], [1.50385087890625, 0.19639316406250001], [1.4908, 0.28240000000000004], [1.4740587890625, 0.38580498046875], [1.4394078125, 0.47723984375000006], [1.3892810546874999, 0.55635947265625], [1.3261125000000002, 0.62281875], [1.2523361328125, 0.6762725585937501], [1.1703859375, 0.71637578125], [1.0826958984375001, 0.7427833007812501], [0.9916999999999999, 0.75515], [0.8998322265625001, 0.7531307617187498], [0.8095265625, 0.73638046875], [0.7232169921874999, 0.7045540039062501], [0.6433375, 0.65730625], [0.5723220703125, 0.59429208984375], [0.5126046874999999, 0.5151664062499999], [0.46661933593750005, 0.41958408203124997], [0.4368000000000001, 0.3072], [0.49, 0.18], [-0.45, 0.18], [-0.47967529296875, 0.29263427734374997], [-0.41257890624999993, 0.41955078124999995], [-0.47932880859375004, 0.52297998046875], [-0.5574312499999999, 0.60848125], [-0.64447041015625, 0.67618173828125], [-0.7380304687500001, 0.72620859375], [-0.83569560546875, 0.75868896484375], [-0.9350500000000002, 0.77375], [-1.0336778320312499, 0.7715188476562499], [-1.12916328125, 0.7521226562500001], [-1.21909052734375, 0.71568857421875], [-1.3010437499999998, 0.66234375], [-1.37260712890625, 0.59221533203125], [-1.43136484375, 0.50543046875], [-1.47490107421875, 0.40211630859375], [-1.5008, 0.28240000000000004], [-1.4, -0.37]], "depth": 0.12}, "reconstructionRefinement": {"source": "01-estudio-giro-000.png", "discRadius": 0.425, "controlAxisX": -2.08, "armSpine": [[-1.35, -0.12, 0.12], [-2.35, -0.22, 0.12], [-2.16, -0.84, 0.12], [-2.08, -1.475, 0.12]], "armHalfWidth": 0.275, "armHalfDepthRange": [0.065, 0.27], "slotHalfWidth": 0.05, "slotHalfLength": 0.2, "implementation": "refineGeometry.js", "note": "Measured macro ratios from original photo. Hidden underside inferred, no manufacturing dimensions.", "controlAxisAngle": 0.12, "mountingPlateBezier": {"bottomY": -0.37, "lobeTopY": 0.8, "rightX": 1.52, "leftX": -1.48, "valleyY": 0.14, "implementation": "refineGeometry.js"}, "collar": {"radius": 0.276, "length": 0.055, "axis": "same straight Y axis as control, rotated .12 radians around Z"}, "surfaceRecipe": {"brandMark": "approximate POPO/WASH canvas typography", "controlDots": 9, "offAccent": "#df292e", "conformalPatch": {"tRange": [0.61, 0.99], "angleRange": [0.9, 2.24]}, "seams": "narrow neutral-gray lines; no artificial wear"}}}, "parent": null, "attachment": null, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "curved-arm-socket", "name": "curved-arm-socket", "position": [0, 0, 0.01], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "disc-a-socket", "name": "disc-a-socket", "position": [-0.98, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "disc-b-socket", "name": "disc-b-socket", "position": [0.97, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "dial-socket", "name": "dial-socket", "position": [-2.0231367015377635, -1.9465841020305865, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-housing-socket", "name": "nozzle-housing-socket", "position": [0.16, -0.45, -0.23], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "chrome-collar-socket", "name": "chrome-collar-socket", "position": [-2.08, -1.475, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-a-socket", "name": "nozzle-a-socket", "position": [0.04, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"}, {"id": "nozzle-b-socket", "name": "nozzle-b-socket", "position": [0.28, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "root-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_root_0);
  const socket_root_curved_arm_socket_0 = new THREE.Object3D();
  socket_root_curved_arm_socket_0.name = "curved-arm-socket";
  socket_root_curved_arm_socket_0.position.set(0.0, 0.0, 0.01);
  socket_root_curved_arm_socket_0.rotation.set(0.0, 0.0, 0.0);
  socket_root_curved_arm_socket_0.userData.socket = {"id": "curved-arm-socket", "name": "curved-arm-socket", "position": [0, 0, 0.01], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_curved_arm_socket_0);
  sockets["root:curved-arm-socket"] = socket_root_curved_arm_socket_0;
  const socket_root_disc_a_socket_1 = new THREE.Object3D();
  socket_root_disc_a_socket_1.name = "disc-a-socket";
  socket_root_disc_a_socket_1.position.set(-0.98, 0.27, 0.13);
  socket_root_disc_a_socket_1.rotation.set(0.0, 0.0, 0.0);
  socket_root_disc_a_socket_1.userData.socket = {"id": "disc-a-socket", "name": "disc-a-socket", "position": [-0.98, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_disc_a_socket_1);
  sockets["root:disc-a-socket"] = socket_root_disc_a_socket_1;
  const socket_root_disc_b_socket_2 = new THREE.Object3D();
  socket_root_disc_b_socket_2.name = "disc-b-socket";
  socket_root_disc_b_socket_2.position.set(0.97, 0.27, 0.13);
  socket_root_disc_b_socket_2.rotation.set(0.0, 0.0, 0.0);
  socket_root_disc_b_socket_2.userData.socket = {"id": "disc-b-socket", "name": "disc-b-socket", "position": [0.97, 0.27, 0.13], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_disc_b_socket_2);
  sockets["root:disc-b-socket"] = socket_root_disc_b_socket_2;
  const socket_root_dial_socket_3 = new THREE.Object3D();
  socket_root_dial_socket_3.name = "dial-socket";
  socket_root_dial_socket_3.position.set(-2.0231367015377635, -1.9465841020305865, 0.12);
  socket_root_dial_socket_3.rotation.set(0.0, 0.0, 0.0);
  socket_root_dial_socket_3.userData.socket = {"id": "dial-socket", "name": "dial-socket", "position": [-2.0231367015377635, -1.9465841020305865, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_dial_socket_3);
  sockets["root:dial-socket"] = socket_root_dial_socket_3;
  const socket_root_nozzle_housing_socket_4 = new THREE.Object3D();
  socket_root_nozzle_housing_socket_4.name = "nozzle-housing-socket";
  socket_root_nozzle_housing_socket_4.position.set(0.16, -0.45, -0.23);
  socket_root_nozzle_housing_socket_4.rotation.set(0.0, 0.0, 0.0);
  socket_root_nozzle_housing_socket_4.userData.socket = {"id": "nozzle-housing-socket", "name": "nozzle-housing-socket", "position": [0.16, -0.45, -0.23], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_nozzle_housing_socket_4);
  sockets["root:nozzle-housing-socket"] = socket_root_nozzle_housing_socket_4;
  const socket_root_chrome_collar_socket_5 = new THREE.Object3D();
  socket_root_chrome_collar_socket_5.name = "chrome-collar-socket";
  socket_root_chrome_collar_socket_5.position.set(-2.08, -1.475, 0.12);
  socket_root_chrome_collar_socket_5.rotation.set(0.0, 0.0, 0.0);
  socket_root_chrome_collar_socket_5.userData.socket = {"id": "chrome-collar-socket", "name": "chrome-collar-socket", "position": [-2.08, -1.475, 0.12], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_chrome_collar_socket_5);
  sockets["root:chrome-collar-socket"] = socket_root_chrome_collar_socket_5;
  const socket_root_nozzle_a_socket_6 = new THREE.Object3D();
  socket_root_nozzle_a_socket_6.name = "nozzle-a-socket";
  socket_root_nozzle_a_socket_6.position.set(0.04, -0.65, -0.44);
  socket_root_nozzle_a_socket_6.rotation.set(0.0, 0.0, 0.0);
  socket_root_nozzle_a_socket_6.userData.socket = {"id": "nozzle-a-socket", "name": "nozzle-a-socket", "position": [0.04, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_nozzle_a_socket_6);
  sockets["root:nozzle-a-socket"] = socket_root_nozzle_a_socket_6;
  const socket_root_nozzle_b_socket_7 = new THREE.Object3D();
  socket_root_nozzle_b_socket_7.name = "nozzle-b-socket";
  socket_root_nozzle_b_socket_7.position.set(0.28, -0.65, -0.44);
  socket_root_nozzle_b_socket_7.rotation.set(0.0, 0.0, 0.0);
  socket_root_nozzle_b_socket_7.userData.socket = {"id": "nozzle-b-socket", "name": "nozzle-b-socket", "position": [0.28, -0.65, -0.44], "rotation": [0, 0, 0], "purpose": "assembly-contact"};
  node_root_0.add(socket_root_nozzle_b_socket_7);
  sockets["root:nozzle-b-socket"] = socket_root_nozzle_b_socket_7;

  const endpoint_curved_arm_1 = makeAttachmentEndpoint(null);
  const node_curved_arm_1 = new THREE.Group();
  node_curved_arm_1.name = "curved-arm__pivot";
  node_curved_arm_1.scale.set(1, 1, 1);
  if (endpoint_curved_arm_1) {
    node_curved_arm_1.position.copy(endpoint_curved_arm_1.start);
    node_curved_arm_1.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_curved_arm_1.position.set(0.0, 0.0, 0.01);
    node_curved_arm_1.rotation.set(0.0, 0.0, 0.0);
  }
  node_curved_arm_1.userData.sculptComponent = {"id": "curved-arm", "name": "curved-arm", "level": "macro", "role": "curved-arm", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[-1.36, -0.2], [-1.5045458984375, -0.2135302734375], [-1.6313671875000002, -0.23558593750000004], [-1.7414892578125, -0.26648925781250005], [-1.8359375000000002, -0.3065625], [-1.9157373046875001, -0.3561279296875], [-1.9819140625, -0.4155078125], [-2.0354931640625002, -0.4850244140625], [-2.0775, -0.5650000000000001], [-2.1089599609375003, -0.6557568359375], [-2.1308984375, -0.7576171875], [-2.1443408203125003, -0.8709033203125001], [-2.1503125, -0.9959375], [-2.1498388671875004, -1.1330419921875001], [-2.1439453125, -1.2825390625000002], [-2.1336572265625002, -1.4447509765625], [-2.12, -1.62], [-1.57, -1.62], [-1.5753857421875, -1.49072265625], [-1.5798046875, -1.3690625], [-1.5825244140624999, -1.25490234375], [-1.5828125, -1.148125], [-1.5799365234375, -1.0486132812500002], [-1.5731640625, -0.95625], [-1.5617626953125001, -0.87091796875], [-1.545, -0.7925], [-1.5221435546875, -0.7208789062500001], [-1.4924609375, -0.6559375000000001], [-1.4552197265625, -0.59755859375], [-1.4096875, -0.545625], [-1.3551318359375, -0.50001953125], [-1.2908203125, -0.46062500000000006], [-1.2160205078125, -0.42732421875], [-1.13, -0.4], [-1.13, -0.2]], "depth": 0.23}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "curved-arm-socket", "localStart": [0, 0, 0.01], "localEnd": [0, 0.1, 0.01], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0.01], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "curved-arm", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "curved-arm-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_curved_arm_1.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "curved-arm", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_curved_arm_1);
  nodes["curved-arm"] = node_curved_arm_1;
  const mesh_curved_arm_1Geometry = endpoint_curved_arm_1
    ? new THREE.CylinderGeometry(endpoint_curved_arm_1.endRadius, endpoint_curved_arm_1.baseRadius, endpoint_curved_arm_1.length, 16, 6)
    : buildExtrudeGeometry({"points": [[-1.36, -0.2], [-1.5045458984375, -0.2135302734375], [-1.6313671875000002, -0.23558593750000004], [-1.7414892578125, -0.26648925781250005], [-1.8359375000000002, -0.3065625], [-1.9157373046875001, -0.3561279296875], [-1.9819140625, -0.4155078125], [-2.0354931640625002, -0.4850244140625], [-2.0775, -0.5650000000000001], [-2.1089599609375003, -0.6557568359375], [-2.1308984375, -0.7576171875], [-2.1443408203125003, -0.8709033203125001], [-2.1503125, -0.9959375], [-2.1498388671875004, -1.1330419921875001], [-2.1439453125, -1.2825390625000002], [-2.1336572265625002, -1.4447509765625], [-2.12, -1.62], [-1.57, -1.62], [-1.5753857421875, -1.49072265625], [-1.5798046875, -1.3690625], [-1.5825244140624999, -1.25490234375], [-1.5828125, -1.148125], [-1.5799365234375, -1.0486132812500002], [-1.5731640625, -0.95625], [-1.5617626953125001, -0.87091796875], [-1.545, -0.7925], [-1.5221435546875, -0.7208789062500001], [-1.4924609375, -0.6559375000000001], [-1.4552197265625, -0.59755859375], [-1.4096875, -0.545625], [-1.3551318359375, -0.50001953125], [-1.2908203125, -0.46062500000000006], [-1.2160205078125, -0.42732421875], [-1.13, -0.4], [-1.13, -0.2]], "depth": 0.23});
  if (!endpoint_curved_arm_1) {
    mesh_curved_arm_1Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_curved_arm_1 = new THREE.Mesh(
    mesh_curved_arm_1Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_curved_arm_1.name = "curved-arm";
  if (endpoint_curved_arm_1) {
    mesh_curved_arm_1.position.copy(endpoint_curved_arm_1.midpoint);
    mesh_curved_arm_1.quaternion.copy(endpoint_curved_arm_1.quaternion);
  }
  mesh_curved_arm_1.castShadow = options.castShadow ?? true;
  mesh_curved_arm_1.receiveShadow = options.receiveShadow ?? true;
  mesh_curved_arm_1.userData.sculptComponent = {"id": "curved-arm", "name": "curved-arm", "level": "macro", "role": "curved-arm", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[-1.36, -0.2], [-1.5045458984375, -0.2135302734375], [-1.6313671875000002, -0.23558593750000004], [-1.7414892578125, -0.26648925781250005], [-1.8359375000000002, -0.3065625], [-1.9157373046875001, -0.3561279296875], [-1.9819140625, -0.4155078125], [-2.0354931640625002, -0.4850244140625], [-2.0775, -0.5650000000000001], [-2.1089599609375003, -0.6557568359375], [-2.1308984375, -0.7576171875], [-2.1443408203125003, -0.8709033203125001], [-2.1503125, -0.9959375], [-2.1498388671875004, -1.1330419921875001], [-2.1439453125, -1.2825390625000002], [-2.1336572265625002, -1.4447509765625], [-2.12, -1.62], [-1.57, -1.62], [-1.5753857421875, -1.49072265625], [-1.5798046875, -1.3690625], [-1.5825244140624999, -1.25490234375], [-1.5828125, -1.148125], [-1.5799365234375, -1.0486132812500002], [-1.5731640625, -0.95625], [-1.5617626953125001, -0.87091796875], [-1.545, -0.7925], [-1.5221435546875, -0.7208789062500001], [-1.4924609375, -0.6559375000000001], [-1.4552197265625, -0.59755859375], [-1.4096875, -0.545625], [-1.3551318359375, -0.50001953125], [-1.2908203125, -0.46062500000000006], [-1.2160205078125, -0.42732421875], [-1.13, -0.4], [-1.13, -0.2]], "depth": 0.23}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "curved-arm-socket", "localStart": [0, 0, 0.01], "localEnd": [0, 0.1, 0.01], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0.01], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "curved-arm", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "curved-arm-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_curved_arm_1.add(mesh_curved_arm_1);
  meshes["curved-arm"] = mesh_curved_arm_1;
  colliders["curved-arm"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["curved-arm"] ??= [];
  destructionGroups["curved-arm"].push(node_curved_arm_1);

  const endpoint_disc_a_2 = makeAttachmentEndpoint(null);
  const node_disc_a_2 = new THREE.Group();
  node_disc_a_2.name = "disc-a__pivot";
  node_disc_a_2.scale.set(1, 1, 1);
  if (endpoint_disc_a_2) {
    node_disc_a_2.position.copy(endpoint_disc_a_2.start);
    node_disc_a_2.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_disc_a_2.position.set(-0.98, 0.27, 0.13);
    node_disc_a_2.rotation.set(0.0, 0.0, 0.0);
  }
  node_disc_a_2.userData.sculptComponent = {"id": "disc-a", "name": "disc-a", "level": "meso", "role": "disc-a", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[0.425, 0.0], [0.42295350883568367, 0.041657284640063255], [0.416833744171373, 0.08291338685685451], [0.40669964268618874, 0.1233709878331465], [0.3926488013172969, 0.16264045875516317], [0.3748165373480509, 0.20034361315104895], [0.35337458522858173, 0.23611734903333093], [0.32852944267916323, 0.2696171457695493], [0.3005203820042827, 0.30052038200428266], [0.2696171457695493, 0.3285294426791632], [0.23611734903333098, 0.35337458522858173], [0.20034361315104904, 0.3748165373480508], [0.16264045875516317, 0.3926488013172969], [0.1233709878331465, 0.4066996426861888], [0.08291338685685454, 0.416833744171373], [0.04165728464006332, 0.42295350883568367], [2.6023744481881257e-17, 0.425], [-0.04165728464006327, 0.42295350883568367], [-0.08291338685685448, 0.416833744171373], [-0.12337098783314641, 0.4066996426861888], [-0.16264045875516314, 0.3926488013172969], [-0.200343613151049, 0.3748165373480509], [-0.23611734903333081, 0.3533745852285818], [-0.26961714576954926, 0.3285294426791633], [-0.30052038200428266, 0.3005203820042827], [-0.32852944267916323, 0.2696171457695493], [-0.3533745852285818, 0.23611734903333093], [-0.3748165373480508, 0.2003436131510491], [-0.3926488013172969, 0.1626404587551632], [-0.40669964268618874, 0.12337098783314651], [-0.416833744171373, 0.08291338685685466], [-0.42295350883568367, 0.04165728464006335], [-0.425, 5.2047488963762513e-17], [-0.42295350883568367, -0.04165728464006325], [-0.416833744171373, -0.08291338685685455], [-0.4066996426861888, -0.12337098783314639], [-0.39264880131729696, -0.16264045875516311], [-0.3748165373480509, -0.20034361315104895], [-0.3533745852285818, -0.23611734903333081], [-0.3285294426791633, -0.2696171457695492], [-0.30052038200428277, -0.30052038200428266], [-0.26961714576954954, -0.32852944267916306], [-0.23611734903333093, -0.35337458522858173], [-0.20034361315104912, -0.3748165373480508], [-0.16264045875516336, -0.3926488013172968], [-0.12337098783314654, -0.40669964268618874], [-0.08291338685685468, -0.41683374417137287], [-0.04165728464006319, -0.42295350883568367], [-7.807123344564376e-17, -0.425], [0.04165728464006304, -0.42295350883568367], [0.08291338685685451, -0.416833744171373], [0.12337098783314637, -0.4066996426861888], [0.16264045875516325, -0.3926488013172968], [0.20034361315104895, -0.3748165373480509], [0.2361173490333308, -0.3533745852285818], [0.26961714576954937, -0.3285294426791632], [0.3005203820042826, -0.30052038200428277], [0.328529442679163, -0.26961714576954954], [0.35337458522858173, -0.23611734903333093], [0.3748165373480508, -0.20034361315104912], [0.3926488013172968, -0.1626404587551634], [0.40669964268618874, -0.12337098783314657], [0.41683374417137287, -0.0829133868568547], [0.42295350883568367, -0.04165728464006321]], "depth": 0.05, "holes": [[[0.05, 0], [0.04957224306869052, 0.03197891709391264], [0.04829629131445342, 0.06341066605011758], [0.04619397662556434, 0.09375744092944699], [0.04330127018922194, 0.12249999999999998], [0.03966766701456176, 0.14914655010713657], [0.03535533905932738, 0.1732411613907041], [0.030438071450436033, 0.1943715683713526], [0.02500000000000001, 0.21217622392718746], [0.019134171618254495, 0.22635048546526523], [0.012940952255126037, 0.23665182744082172], [0.006526309611002586, 0.24290399103658353], [3.061616997868383e-18, 0.245], [-0.00652630961100258, 0.24290399103658353], [-0.012940952255126032, 0.23665182744082172], [-0.019134171618254477, 0.22635048546526526], [-0.02499999999999999, 0.2121762239271875], [-0.030438071450436033, 0.1943715683713526], [-0.035355339059327376, 0.17324116139070414], [-0.03966766701456176, 0.14914655010713662], [-0.04330127018922194, 0.12249999999999998], [-0.04619397662556434, 0.09375744092944702], [-0.04829629131445341, 0.06341066605011765], [-0.04957224306869052, 0.031978917093912734], [-0.05, 3.0003846579110155e-17], [-0.04957224306869052, -0.031978917093912686], [-0.04829629131445342, -0.0634106660501176], [-0.04619397662556435, -0.09375744092944696], [-0.043301270189221946, -0.12249999999999993], [-0.03966766701456176, -0.14914655010713657], [-0.0353553390593274, -0.17324116139070406], [-0.030438071450436047, -0.19437156837135255], [-0.025000000000000022, -0.21217622392718744], [-0.019134171618254477, -0.22635048546526526], [-0.012940952255126032, -0.23665182744082172], [-0.006526309611002582, -0.24290399103658353], [-9.184850993605149e-18, -0.245], [0.006526309611002564, -0.24290399103658356], [0.012940952255126016, -0.23665182744082175], [0.01913417161825446, -0.2263504854652653], [0.02500000000000001, -0.21217622392718746], [0.030438071450435995, -0.19437156837135275], [0.03535533905932737, -0.17324116139070417], [0.03966766701456175, -0.14914655010713662], [0.04330127018922192, -0.12250000000000011], [0.04619397662556435, -0.09375744092944693], [0.048296291314453406, -0.06341066605011779], [0.04957224306869052, -0.031978917093912665]]]}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "disc-a-socket", "localStart": [-0.98, 0.27, 0.13], "localEnd": [-0.98, 0.37, 0.13], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [-0.98, 0.27, 0.13], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "disc-a", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "disc-a-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}, {"id": "slot-a", "kind": "groove", "description": "Open axial adjustment slot through mounting disc", "width": 0.1, "length": 0.49}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_disc_a_2.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "disc-a", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_disc_a_2);
  nodes["disc-a"] = node_disc_a_2;
  const mesh_disc_a_2Geometry = endpoint_disc_a_2
    ? new THREE.CylinderGeometry(endpoint_disc_a_2.endRadius, endpoint_disc_a_2.baseRadius, endpoint_disc_a_2.length, 16, 6)
    : buildExtrudeGeometry({"points": [[0.425, 0.0], [0.42295350883568367, 0.041657284640063255], [0.416833744171373, 0.08291338685685451], [0.40669964268618874, 0.1233709878331465], [0.3926488013172969, 0.16264045875516317], [0.3748165373480509, 0.20034361315104895], [0.35337458522858173, 0.23611734903333093], [0.32852944267916323, 0.2696171457695493], [0.3005203820042827, 0.30052038200428266], [0.2696171457695493, 0.3285294426791632], [0.23611734903333098, 0.35337458522858173], [0.20034361315104904, 0.3748165373480508], [0.16264045875516317, 0.3926488013172969], [0.1233709878331465, 0.4066996426861888], [0.08291338685685454, 0.416833744171373], [0.04165728464006332, 0.42295350883568367], [2.6023744481881257e-17, 0.425], [-0.04165728464006327, 0.42295350883568367], [-0.08291338685685448, 0.416833744171373], [-0.12337098783314641, 0.4066996426861888], [-0.16264045875516314, 0.3926488013172969], [-0.200343613151049, 0.3748165373480509], [-0.23611734903333081, 0.3533745852285818], [-0.26961714576954926, 0.3285294426791633], [-0.30052038200428266, 0.3005203820042827], [-0.32852944267916323, 0.2696171457695493], [-0.3533745852285818, 0.23611734903333093], [-0.3748165373480508, 0.2003436131510491], [-0.3926488013172969, 0.1626404587551632], [-0.40669964268618874, 0.12337098783314651], [-0.416833744171373, 0.08291338685685466], [-0.42295350883568367, 0.04165728464006335], [-0.425, 5.2047488963762513e-17], [-0.42295350883568367, -0.04165728464006325], [-0.416833744171373, -0.08291338685685455], [-0.4066996426861888, -0.12337098783314639], [-0.39264880131729696, -0.16264045875516311], [-0.3748165373480509, -0.20034361315104895], [-0.3533745852285818, -0.23611734903333081], [-0.3285294426791633, -0.2696171457695492], [-0.30052038200428277, -0.30052038200428266], [-0.26961714576954954, -0.32852944267916306], [-0.23611734903333093, -0.35337458522858173], [-0.20034361315104912, -0.3748165373480508], [-0.16264045875516336, -0.3926488013172968], [-0.12337098783314654, -0.40669964268618874], [-0.08291338685685468, -0.41683374417137287], [-0.04165728464006319, -0.42295350883568367], [-7.807123344564376e-17, -0.425], [0.04165728464006304, -0.42295350883568367], [0.08291338685685451, -0.416833744171373], [0.12337098783314637, -0.4066996426861888], [0.16264045875516325, -0.3926488013172968], [0.20034361315104895, -0.3748165373480509], [0.2361173490333308, -0.3533745852285818], [0.26961714576954937, -0.3285294426791632], [0.3005203820042826, -0.30052038200428277], [0.328529442679163, -0.26961714576954954], [0.35337458522858173, -0.23611734903333093], [0.3748165373480508, -0.20034361315104912], [0.3926488013172968, -0.1626404587551634], [0.40669964268618874, -0.12337098783314657], [0.41683374417137287, -0.0829133868568547], [0.42295350883568367, -0.04165728464006321]], "depth": 0.05, "holes": [[[0.05, 0], [0.04957224306869052, 0.03197891709391264], [0.04829629131445342, 0.06341066605011758], [0.04619397662556434, 0.09375744092944699], [0.04330127018922194, 0.12249999999999998], [0.03966766701456176, 0.14914655010713657], [0.03535533905932738, 0.1732411613907041], [0.030438071450436033, 0.1943715683713526], [0.02500000000000001, 0.21217622392718746], [0.019134171618254495, 0.22635048546526523], [0.012940952255126037, 0.23665182744082172], [0.006526309611002586, 0.24290399103658353], [3.061616997868383e-18, 0.245], [-0.00652630961100258, 0.24290399103658353], [-0.012940952255126032, 0.23665182744082172], [-0.019134171618254477, 0.22635048546526526], [-0.02499999999999999, 0.2121762239271875], [-0.030438071450436033, 0.1943715683713526], [-0.035355339059327376, 0.17324116139070414], [-0.03966766701456176, 0.14914655010713662], [-0.04330127018922194, 0.12249999999999998], [-0.04619397662556434, 0.09375744092944702], [-0.04829629131445341, 0.06341066605011765], [-0.04957224306869052, 0.031978917093912734], [-0.05, 3.0003846579110155e-17], [-0.04957224306869052, -0.031978917093912686], [-0.04829629131445342, -0.0634106660501176], [-0.04619397662556435, -0.09375744092944696], [-0.043301270189221946, -0.12249999999999993], [-0.03966766701456176, -0.14914655010713657], [-0.0353553390593274, -0.17324116139070406], [-0.030438071450436047, -0.19437156837135255], [-0.025000000000000022, -0.21217622392718744], [-0.019134171618254477, -0.22635048546526526], [-0.012940952255126032, -0.23665182744082172], [-0.006526309611002582, -0.24290399103658353], [-9.184850993605149e-18, -0.245], [0.006526309611002564, -0.24290399103658356], [0.012940952255126016, -0.23665182744082175], [0.01913417161825446, -0.2263504854652653], [0.02500000000000001, -0.21217622392718746], [0.030438071450435995, -0.19437156837135275], [0.03535533905932737, -0.17324116139070417], [0.03966766701456175, -0.14914655010713662], [0.04330127018922192, -0.12250000000000011], [0.04619397662556435, -0.09375744092944693], [0.048296291314453406, -0.06341066605011779], [0.04957224306869052, -0.031978917093912665]]]});
  if (!endpoint_disc_a_2) {
    mesh_disc_a_2Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_disc_a_2 = new THREE.Mesh(
    mesh_disc_a_2Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_disc_a_2.name = "disc-a";
  if (endpoint_disc_a_2) {
    mesh_disc_a_2.position.copy(endpoint_disc_a_2.midpoint);
    mesh_disc_a_2.quaternion.copy(endpoint_disc_a_2.quaternion);
  }
  mesh_disc_a_2.castShadow = options.castShadow ?? true;
  mesh_disc_a_2.receiveShadow = options.receiveShadow ?? true;
  mesh_disc_a_2.userData.sculptComponent = {"id": "disc-a", "name": "disc-a", "level": "meso", "role": "disc-a", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[0.425, 0.0], [0.42295350883568367, 0.041657284640063255], [0.416833744171373, 0.08291338685685451], [0.40669964268618874, 0.1233709878331465], [0.3926488013172969, 0.16264045875516317], [0.3748165373480509, 0.20034361315104895], [0.35337458522858173, 0.23611734903333093], [0.32852944267916323, 0.2696171457695493], [0.3005203820042827, 0.30052038200428266], [0.2696171457695493, 0.3285294426791632], [0.23611734903333098, 0.35337458522858173], [0.20034361315104904, 0.3748165373480508], [0.16264045875516317, 0.3926488013172969], [0.1233709878331465, 0.4066996426861888], [0.08291338685685454, 0.416833744171373], [0.04165728464006332, 0.42295350883568367], [2.6023744481881257e-17, 0.425], [-0.04165728464006327, 0.42295350883568367], [-0.08291338685685448, 0.416833744171373], [-0.12337098783314641, 0.4066996426861888], [-0.16264045875516314, 0.3926488013172969], [-0.200343613151049, 0.3748165373480509], [-0.23611734903333081, 0.3533745852285818], [-0.26961714576954926, 0.3285294426791633], [-0.30052038200428266, 0.3005203820042827], [-0.32852944267916323, 0.2696171457695493], [-0.3533745852285818, 0.23611734903333093], [-0.3748165373480508, 0.2003436131510491], [-0.3926488013172969, 0.1626404587551632], [-0.40669964268618874, 0.12337098783314651], [-0.416833744171373, 0.08291338685685466], [-0.42295350883568367, 0.04165728464006335], [-0.425, 5.2047488963762513e-17], [-0.42295350883568367, -0.04165728464006325], [-0.416833744171373, -0.08291338685685455], [-0.4066996426861888, -0.12337098783314639], [-0.39264880131729696, -0.16264045875516311], [-0.3748165373480509, -0.20034361315104895], [-0.3533745852285818, -0.23611734903333081], [-0.3285294426791633, -0.2696171457695492], [-0.30052038200428277, -0.30052038200428266], [-0.26961714576954954, -0.32852944267916306], [-0.23611734903333093, -0.35337458522858173], [-0.20034361315104912, -0.3748165373480508], [-0.16264045875516336, -0.3926488013172968], [-0.12337098783314654, -0.40669964268618874], [-0.08291338685685468, -0.41683374417137287], [-0.04165728464006319, -0.42295350883568367], [-7.807123344564376e-17, -0.425], [0.04165728464006304, -0.42295350883568367], [0.08291338685685451, -0.416833744171373], [0.12337098783314637, -0.4066996426861888], [0.16264045875516325, -0.3926488013172968], [0.20034361315104895, -0.3748165373480509], [0.2361173490333308, -0.3533745852285818], [0.26961714576954937, -0.3285294426791632], [0.3005203820042826, -0.30052038200428277], [0.328529442679163, -0.26961714576954954], [0.35337458522858173, -0.23611734903333093], [0.3748165373480508, -0.20034361315104912], [0.3926488013172968, -0.1626404587551634], [0.40669964268618874, -0.12337098783314657], [0.41683374417137287, -0.0829133868568547], [0.42295350883568367, -0.04165728464006321]], "depth": 0.05, "holes": [[[0.05, 0], [0.04957224306869052, 0.03197891709391264], [0.04829629131445342, 0.06341066605011758], [0.04619397662556434, 0.09375744092944699], [0.04330127018922194, 0.12249999999999998], [0.03966766701456176, 0.14914655010713657], [0.03535533905932738, 0.1732411613907041], [0.030438071450436033, 0.1943715683713526], [0.02500000000000001, 0.21217622392718746], [0.019134171618254495, 0.22635048546526523], [0.012940952255126037, 0.23665182744082172], [0.006526309611002586, 0.24290399103658353], [3.061616997868383e-18, 0.245], [-0.00652630961100258, 0.24290399103658353], [-0.012940952255126032, 0.23665182744082172], [-0.019134171618254477, 0.22635048546526526], [-0.02499999999999999, 0.2121762239271875], [-0.030438071450436033, 0.1943715683713526], [-0.035355339059327376, 0.17324116139070414], [-0.03966766701456176, 0.14914655010713662], [-0.04330127018922194, 0.12249999999999998], [-0.04619397662556434, 0.09375744092944702], [-0.04829629131445341, 0.06341066605011765], [-0.04957224306869052, 0.031978917093912734], [-0.05, 3.0003846579110155e-17], [-0.04957224306869052, -0.031978917093912686], [-0.04829629131445342, -0.0634106660501176], [-0.04619397662556435, -0.09375744092944696], [-0.043301270189221946, -0.12249999999999993], [-0.03966766701456176, -0.14914655010713657], [-0.0353553390593274, -0.17324116139070406], [-0.030438071450436047, -0.19437156837135255], [-0.025000000000000022, -0.21217622392718744], [-0.019134171618254477, -0.22635048546526526], [-0.012940952255126032, -0.23665182744082172], [-0.006526309611002582, -0.24290399103658353], [-9.184850993605149e-18, -0.245], [0.006526309611002564, -0.24290399103658356], [0.012940952255126016, -0.23665182744082175], [0.01913417161825446, -0.2263504854652653], [0.02500000000000001, -0.21217622392718746], [0.030438071450435995, -0.19437156837135275], [0.03535533905932737, -0.17324116139070417], [0.03966766701456175, -0.14914655010713662], [0.04330127018922192, -0.12250000000000011], [0.04619397662556435, -0.09375744092944693], [0.048296291314453406, -0.06341066605011779], [0.04957224306869052, -0.031978917093912665]]]}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "disc-a-socket", "localStart": [-0.98, 0.27, 0.13], "localEnd": [-0.98, 0.37, 0.13], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [-0.98, 0.27, 0.13], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "disc-a", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "disc-a-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}, {"id": "slot-a", "kind": "groove", "description": "Open axial adjustment slot through mounting disc", "width": 0.1, "length": 0.49}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_disc_a_2.add(mesh_disc_a_2);
  meshes["disc-a"] = mesh_disc_a_2;
  colliders["disc-a"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["disc-a"] ??= [];
  destructionGroups["disc-a"].push(node_disc_a_2);

  const endpoint_disc_b_3 = makeAttachmentEndpoint(null);
  const node_disc_b_3 = new THREE.Group();
  node_disc_b_3.name = "disc-b__pivot";
  node_disc_b_3.scale.set(1, 1, 1);
  if (endpoint_disc_b_3) {
    node_disc_b_3.position.copy(endpoint_disc_b_3.start);
    node_disc_b_3.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_disc_b_3.position.set(0.97, 0.27, 0.13);
    node_disc_b_3.rotation.set(0.0, 0.0, 0.0);
  }
  node_disc_b_3.userData.sculptComponent = {"id": "disc-b", "name": "disc-b", "level": "meso", "role": "disc-b", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[0.425, 0.0], [0.42295350883568367, 0.041657284640063255], [0.416833744171373, 0.08291338685685451], [0.40669964268618874, 0.1233709878331465], [0.3926488013172969, 0.16264045875516317], [0.3748165373480509, 0.20034361315104895], [0.35337458522858173, 0.23611734903333093], [0.32852944267916323, 0.2696171457695493], [0.3005203820042827, 0.30052038200428266], [0.2696171457695493, 0.3285294426791632], [0.23611734903333098, 0.35337458522858173], [0.20034361315104904, 0.3748165373480508], [0.16264045875516317, 0.3926488013172969], [0.1233709878331465, 0.4066996426861888], [0.08291338685685454, 0.416833744171373], [0.04165728464006332, 0.42295350883568367], [2.6023744481881257e-17, 0.425], [-0.04165728464006327, 0.42295350883568367], [-0.08291338685685448, 0.416833744171373], [-0.12337098783314641, 0.4066996426861888], [-0.16264045875516314, 0.3926488013172969], [-0.200343613151049, 0.3748165373480509], [-0.23611734903333081, 0.3533745852285818], [-0.26961714576954926, 0.3285294426791633], [-0.30052038200428266, 0.3005203820042827], [-0.32852944267916323, 0.2696171457695493], [-0.3533745852285818, 0.23611734903333093], [-0.3748165373480508, 0.2003436131510491], [-0.3926488013172969, 0.1626404587551632], [-0.40669964268618874, 0.12337098783314651], [-0.416833744171373, 0.08291338685685466], [-0.42295350883568367, 0.04165728464006335], [-0.425, 5.2047488963762513e-17], [-0.42295350883568367, -0.04165728464006325], [-0.416833744171373, -0.08291338685685455], [-0.4066996426861888, -0.12337098783314639], [-0.39264880131729696, -0.16264045875516311], [-0.3748165373480509, -0.20034361315104895], [-0.3533745852285818, -0.23611734903333081], [-0.3285294426791633, -0.2696171457695492], [-0.30052038200428277, -0.30052038200428266], [-0.26961714576954954, -0.32852944267916306], [-0.23611734903333093, -0.35337458522858173], [-0.20034361315104912, -0.3748165373480508], [-0.16264045875516336, -0.3926488013172968], [-0.12337098783314654, -0.40669964268618874], [-0.08291338685685468, -0.41683374417137287], [-0.04165728464006319, -0.42295350883568367], [-7.807123344564376e-17, -0.425], [0.04165728464006304, -0.42295350883568367], [0.08291338685685451, -0.416833744171373], [0.12337098783314637, -0.4066996426861888], [0.16264045875516325, -0.3926488013172968], [0.20034361315104895, -0.3748165373480509], [0.2361173490333308, -0.3533745852285818], [0.26961714576954937, -0.3285294426791632], [0.3005203820042826, -0.30052038200428277], [0.328529442679163, -0.26961714576954954], [0.35337458522858173, -0.23611734903333093], [0.3748165373480508, -0.20034361315104912], [0.3926488013172968, -0.1626404587551634], [0.40669964268618874, -0.12337098783314657], [0.41683374417137287, -0.0829133868568547], [0.42295350883568367, -0.04165728464006321]], "depth": 0.05, "holes": [[[0.05, 0], [0.04957224306869052, 0.03197891709391264], [0.04829629131445342, 0.06341066605011758], [0.04619397662556434, 0.09375744092944699], [0.04330127018922194, 0.12249999999999998], [0.03966766701456176, 0.14914655010713657], [0.03535533905932738, 0.1732411613907041], [0.030438071450436033, 0.1943715683713526], [0.02500000000000001, 0.21217622392718746], [0.019134171618254495, 0.22635048546526523], [0.012940952255126037, 0.23665182744082172], [0.006526309611002586, 0.24290399103658353], [3.061616997868383e-18, 0.245], [-0.00652630961100258, 0.24290399103658353], [-0.012940952255126032, 0.23665182744082172], [-0.019134171618254477, 0.22635048546526526], [-0.02499999999999999, 0.2121762239271875], [-0.030438071450436033, 0.1943715683713526], [-0.035355339059327376, 0.17324116139070414], [-0.03966766701456176, 0.14914655010713662], [-0.04330127018922194, 0.12249999999999998], [-0.04619397662556434, 0.09375744092944702], [-0.04829629131445341, 0.06341066605011765], [-0.04957224306869052, 0.031978917093912734], [-0.05, 3.0003846579110155e-17], [-0.04957224306869052, -0.031978917093912686], [-0.04829629131445342, -0.0634106660501176], [-0.04619397662556435, -0.09375744092944696], [-0.043301270189221946, -0.12249999999999993], [-0.03966766701456176, -0.14914655010713657], [-0.0353553390593274, -0.17324116139070406], [-0.030438071450436047, -0.19437156837135255], [-0.025000000000000022, -0.21217622392718744], [-0.019134171618254477, -0.22635048546526526], [-0.012940952255126032, -0.23665182744082172], [-0.006526309611002582, -0.24290399103658353], [-9.184850993605149e-18, -0.245], [0.006526309611002564, -0.24290399103658356], [0.012940952255126016, -0.23665182744082175], [0.01913417161825446, -0.2263504854652653], [0.02500000000000001, -0.21217622392718746], [0.030438071450435995, -0.19437156837135275], [0.03535533905932737, -0.17324116139070417], [0.03966766701456175, -0.14914655010713662], [0.04330127018922192, -0.12250000000000011], [0.04619397662556435, -0.09375744092944693], [0.048296291314453406, -0.06341066605011779], [0.04957224306869052, -0.031978917093912665]]]}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "disc-b-socket", "localStart": [0.97, 0.27, 0.13], "localEnd": [0.97, 0.37, 0.13], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.97, 0.27, 0.13], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "disc-b", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "disc-b-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}, {"id": "slot-b", "kind": "groove", "description": "Open axial adjustment slot through mounting disc", "width": 0.1, "length": 0.49}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_disc_b_3.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "disc-b", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_disc_b_3);
  nodes["disc-b"] = node_disc_b_3;
  const mesh_disc_b_3Geometry = endpoint_disc_b_3
    ? new THREE.CylinderGeometry(endpoint_disc_b_3.endRadius, endpoint_disc_b_3.baseRadius, endpoint_disc_b_3.length, 16, 6)
    : buildExtrudeGeometry({"points": [[0.425, 0.0], [0.42295350883568367, 0.041657284640063255], [0.416833744171373, 0.08291338685685451], [0.40669964268618874, 0.1233709878331465], [0.3926488013172969, 0.16264045875516317], [0.3748165373480509, 0.20034361315104895], [0.35337458522858173, 0.23611734903333093], [0.32852944267916323, 0.2696171457695493], [0.3005203820042827, 0.30052038200428266], [0.2696171457695493, 0.3285294426791632], [0.23611734903333098, 0.35337458522858173], [0.20034361315104904, 0.3748165373480508], [0.16264045875516317, 0.3926488013172969], [0.1233709878331465, 0.4066996426861888], [0.08291338685685454, 0.416833744171373], [0.04165728464006332, 0.42295350883568367], [2.6023744481881257e-17, 0.425], [-0.04165728464006327, 0.42295350883568367], [-0.08291338685685448, 0.416833744171373], [-0.12337098783314641, 0.4066996426861888], [-0.16264045875516314, 0.3926488013172969], [-0.200343613151049, 0.3748165373480509], [-0.23611734903333081, 0.3533745852285818], [-0.26961714576954926, 0.3285294426791633], [-0.30052038200428266, 0.3005203820042827], [-0.32852944267916323, 0.2696171457695493], [-0.3533745852285818, 0.23611734903333093], [-0.3748165373480508, 0.2003436131510491], [-0.3926488013172969, 0.1626404587551632], [-0.40669964268618874, 0.12337098783314651], [-0.416833744171373, 0.08291338685685466], [-0.42295350883568367, 0.04165728464006335], [-0.425, 5.2047488963762513e-17], [-0.42295350883568367, -0.04165728464006325], [-0.416833744171373, -0.08291338685685455], [-0.4066996426861888, -0.12337098783314639], [-0.39264880131729696, -0.16264045875516311], [-0.3748165373480509, -0.20034361315104895], [-0.3533745852285818, -0.23611734903333081], [-0.3285294426791633, -0.2696171457695492], [-0.30052038200428277, -0.30052038200428266], [-0.26961714576954954, -0.32852944267916306], [-0.23611734903333093, -0.35337458522858173], [-0.20034361315104912, -0.3748165373480508], [-0.16264045875516336, -0.3926488013172968], [-0.12337098783314654, -0.40669964268618874], [-0.08291338685685468, -0.41683374417137287], [-0.04165728464006319, -0.42295350883568367], [-7.807123344564376e-17, -0.425], [0.04165728464006304, -0.42295350883568367], [0.08291338685685451, -0.416833744171373], [0.12337098783314637, -0.4066996426861888], [0.16264045875516325, -0.3926488013172968], [0.20034361315104895, -0.3748165373480509], [0.2361173490333308, -0.3533745852285818], [0.26961714576954937, -0.3285294426791632], [0.3005203820042826, -0.30052038200428277], [0.328529442679163, -0.26961714576954954], [0.35337458522858173, -0.23611734903333093], [0.3748165373480508, -0.20034361315104912], [0.3926488013172968, -0.1626404587551634], [0.40669964268618874, -0.12337098783314657], [0.41683374417137287, -0.0829133868568547], [0.42295350883568367, -0.04165728464006321]], "depth": 0.05, "holes": [[[0.05, 0], [0.04957224306869052, 0.03197891709391264], [0.04829629131445342, 0.06341066605011758], [0.04619397662556434, 0.09375744092944699], [0.04330127018922194, 0.12249999999999998], [0.03966766701456176, 0.14914655010713657], [0.03535533905932738, 0.1732411613907041], [0.030438071450436033, 0.1943715683713526], [0.02500000000000001, 0.21217622392718746], [0.019134171618254495, 0.22635048546526523], [0.012940952255126037, 0.23665182744082172], [0.006526309611002586, 0.24290399103658353], [3.061616997868383e-18, 0.245], [-0.00652630961100258, 0.24290399103658353], [-0.012940952255126032, 0.23665182744082172], [-0.019134171618254477, 0.22635048546526526], [-0.02499999999999999, 0.2121762239271875], [-0.030438071450436033, 0.1943715683713526], [-0.035355339059327376, 0.17324116139070414], [-0.03966766701456176, 0.14914655010713662], [-0.04330127018922194, 0.12249999999999998], [-0.04619397662556434, 0.09375744092944702], [-0.04829629131445341, 0.06341066605011765], [-0.04957224306869052, 0.031978917093912734], [-0.05, 3.0003846579110155e-17], [-0.04957224306869052, -0.031978917093912686], [-0.04829629131445342, -0.0634106660501176], [-0.04619397662556435, -0.09375744092944696], [-0.043301270189221946, -0.12249999999999993], [-0.03966766701456176, -0.14914655010713657], [-0.0353553390593274, -0.17324116139070406], [-0.030438071450436047, -0.19437156837135255], [-0.025000000000000022, -0.21217622392718744], [-0.019134171618254477, -0.22635048546526526], [-0.012940952255126032, -0.23665182744082172], [-0.006526309611002582, -0.24290399103658353], [-9.184850993605149e-18, -0.245], [0.006526309611002564, -0.24290399103658356], [0.012940952255126016, -0.23665182744082175], [0.01913417161825446, -0.2263504854652653], [0.02500000000000001, -0.21217622392718746], [0.030438071450435995, -0.19437156837135275], [0.03535533905932737, -0.17324116139070417], [0.03966766701456175, -0.14914655010713662], [0.04330127018922192, -0.12250000000000011], [0.04619397662556435, -0.09375744092944693], [0.048296291314453406, -0.06341066605011779], [0.04957224306869052, -0.031978917093912665]]]});
  if (!endpoint_disc_b_3) {
    mesh_disc_b_3Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_disc_b_3 = new THREE.Mesh(
    mesh_disc_b_3Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_disc_b_3.name = "disc-b";
  if (endpoint_disc_b_3) {
    mesh_disc_b_3.position.copy(endpoint_disc_b_3.midpoint);
    mesh_disc_b_3.quaternion.copy(endpoint_disc_b_3.quaternion);
  }
  mesh_disc_b_3.castShadow = options.castShadow ?? true;
  mesh_disc_b_3.receiveShadow = options.receiveShadow ?? true;
  mesh_disc_b_3.userData.sculptComponent = {"id": "disc-b", "name": "disc-b", "level": "meso", "role": "disc-b", "importance": 1, "confidence": 0.85, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "A physically thin molded mounting plate, curved in its planar footprint. Thickness is intentionally small compared with width.", "geometryDescriptor": {"topologyIntent": "Measured continuous molded silhouette with finite thickness.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "profile2D": {"points": [[0.425, 0.0], [0.42295350883568367, 0.041657284640063255], [0.416833744171373, 0.08291338685685451], [0.40669964268618874, 0.1233709878331465], [0.3926488013172969, 0.16264045875516317], [0.3748165373480509, 0.20034361315104895], [0.35337458522858173, 0.23611734903333093], [0.32852944267916323, 0.2696171457695493], [0.3005203820042827, 0.30052038200428266], [0.2696171457695493, 0.3285294426791632], [0.23611734903333098, 0.35337458522858173], [0.20034361315104904, 0.3748165373480508], [0.16264045875516317, 0.3926488013172969], [0.1233709878331465, 0.4066996426861888], [0.08291338685685454, 0.416833744171373], [0.04165728464006332, 0.42295350883568367], [2.6023744481881257e-17, 0.425], [-0.04165728464006327, 0.42295350883568367], [-0.08291338685685448, 0.416833744171373], [-0.12337098783314641, 0.4066996426861888], [-0.16264045875516314, 0.3926488013172969], [-0.200343613151049, 0.3748165373480509], [-0.23611734903333081, 0.3533745852285818], [-0.26961714576954926, 0.3285294426791633], [-0.30052038200428266, 0.3005203820042827], [-0.32852944267916323, 0.2696171457695493], [-0.3533745852285818, 0.23611734903333093], [-0.3748165373480508, 0.2003436131510491], [-0.3926488013172969, 0.1626404587551632], [-0.40669964268618874, 0.12337098783314651], [-0.416833744171373, 0.08291338685685466], [-0.42295350883568367, 0.04165728464006335], [-0.425, 5.2047488963762513e-17], [-0.42295350883568367, -0.04165728464006325], [-0.416833744171373, -0.08291338685685455], [-0.4066996426861888, -0.12337098783314639], [-0.39264880131729696, -0.16264045875516311], [-0.3748165373480509, -0.20034361315104895], [-0.3533745852285818, -0.23611734903333081], [-0.3285294426791633, -0.2696171457695492], [-0.30052038200428277, -0.30052038200428266], [-0.26961714576954954, -0.32852944267916306], [-0.23611734903333093, -0.35337458522858173], [-0.20034361315104912, -0.3748165373480508], [-0.16264045875516336, -0.3926488013172968], [-0.12337098783314654, -0.40669964268618874], [-0.08291338685685468, -0.41683374417137287], [-0.04165728464006319, -0.42295350883568367], [-7.807123344564376e-17, -0.425], [0.04165728464006304, -0.42295350883568367], [0.08291338685685451, -0.416833744171373], [0.12337098783314637, -0.4066996426861888], [0.16264045875516325, -0.3926488013172968], [0.20034361315104895, -0.3748165373480509], [0.2361173490333308, -0.3533745852285818], [0.26961714576954937, -0.3285294426791632], [0.3005203820042826, -0.30052038200428277], [0.328529442679163, -0.26961714576954954], [0.35337458522858173, -0.23611734903333093], [0.3748165373480508, -0.20034361315104912], [0.3926488013172968, -0.1626404587551634], [0.40669964268618874, -0.12337098783314657], [0.41683374417137287, -0.0829133868568547], [0.42295350883568367, -0.04165728464006321]], "depth": 0.05, "holes": [[[0.05, 0], [0.04957224306869052, 0.03197891709391264], [0.04829629131445342, 0.06341066605011758], [0.04619397662556434, 0.09375744092944699], [0.04330127018922194, 0.12249999999999998], [0.03966766701456176, 0.14914655010713657], [0.03535533905932738, 0.1732411613907041], [0.030438071450436033, 0.1943715683713526], [0.02500000000000001, 0.21217622392718746], [0.019134171618254495, 0.22635048546526523], [0.012940952255126037, 0.23665182744082172], [0.006526309611002586, 0.24290399103658353], [3.061616997868383e-18, 0.245], [-0.00652630961100258, 0.24290399103658353], [-0.012940952255126032, 0.23665182744082172], [-0.019134171618254477, 0.22635048546526526], [-0.02499999999999999, 0.2121762239271875], [-0.030438071450436033, 0.1943715683713526], [-0.035355339059327376, 0.17324116139070414], [-0.03966766701456176, 0.14914655010713662], [-0.04330127018922194, 0.12249999999999998], [-0.04619397662556434, 0.09375744092944702], [-0.04829629131445341, 0.06341066605011765], [-0.04957224306869052, 0.031978917093912734], [-0.05, 3.0003846579110155e-17], [-0.04957224306869052, -0.031978917093912686], [-0.04829629131445342, -0.0634106660501176], [-0.04619397662556435, -0.09375744092944696], [-0.043301270189221946, -0.12249999999999993], [-0.03966766701456176, -0.14914655010713657], [-0.0353553390593274, -0.17324116139070406], [-0.030438071450436047, -0.19437156837135255], [-0.025000000000000022, -0.21217622392718744], [-0.019134171618254477, -0.22635048546526526], [-0.012940952255126032, -0.23665182744082172], [-0.006526309611002582, -0.24290399103658353], [-9.184850993605149e-18, -0.245], [0.006526309611002564, -0.24290399103658356], [0.012940952255126016, -0.23665182744082175], [0.01913417161825446, -0.2263504854652653], [0.02500000000000001, -0.21217622392718746], [0.030438071450435995, -0.19437156837135275], [0.03535533905932737, -0.17324116139070417], [0.03966766701456175, -0.14914655010713662], [0.04330127018922192, -0.12250000000000011], [0.04619397662556435, -0.09375744092944693], [0.048296291314453406, -0.06341066605011779], [0.04957224306869052, -0.031978917093912665]]]}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "disc-b-socket", "localStart": [0.97, 0.27, 0.13], "localEnd": [0.97, 0.37, 0.13], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.97, 0.27, 0.13], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "disc-b", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "disc-b-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}, {"id": "slot-b", "kind": "groove", "description": "Open axial adjustment slot through mounting disc", "width": 0.1, "length": 0.49}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_disc_b_3.add(mesh_disc_b_3);
  meshes["disc-b"] = mesh_disc_b_3;
  colliders["disc-b"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["disc-b"] ??= [];
  destructionGroups["disc-b"].push(node_disc_b_3);

  const endpoint_dial_4 = makeAttachmentEndpoint(null);
  const node_dial_4 = new THREE.Group();
  node_dial_4.name = "dial__pivot";
  node_dial_4.scale.set(1, 1, 1);
  if (endpoint_dial_4) {
    node_dial_4.position.copy(endpoint_dial_4.start);
    node_dial_4.rotation.set(0.0, 0.0, 0.12);
  } else {
    node_dial_4.position.set(-2.0231367015377635, -1.9465841020305865, 0.12);
    node_dial_4.rotation.set(0.0, 0.0, 0.12);
  }
  node_dial_4.userData.sculptComponent = {"id": "dial", "name": "dial", "level": "meso", "role": "dial", "importance": 1, "confidence": 0.85, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "latheProfile": {"points": [[0, -0.52], [0.2, -0.52], [0.26, -0.46], [0.275, -0.25], [0.28, 0.25], [0.26, 0.46], [0.23, 0.49], [0, 0.49]], "segments": 64}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "dial-socket", "localStart": [-2.0231367015377635, -1.9465841020305865, 0.12], "localEnd": [-2.0231367015377635, -1.8465841020305864, 0.12], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [-2.0231367015377635, -1.9465841020305865, 0.12], "rotation": [0, 0, 0.12], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rotary-control", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "dial", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "dial-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_dial_4.userData.actionProfile = {"animationRole": "rotary-control", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "dial", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_dial_4);
  nodes["dial"] = node_dial_4;
  const mesh_dial_4Geometry = endpoint_dial_4
    ? new THREE.CylinderGeometry(endpoint_dial_4.endRadius, endpoint_dial_4.baseRadius, endpoint_dial_4.length, 16, 6)
    : buildLatheGeometry({"points": [[0, -0.52], [0.2, -0.52], [0.26, -0.46], [0.275, -0.25], [0.28, 0.25], [0.26, 0.46], [0.23, 0.49], [0, 0.49]], "segments": 64});
  if (!endpoint_dial_4) {
    mesh_dial_4Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_dial_4 = new THREE.Mesh(
    mesh_dial_4Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_dial_4.name = "dial";
  if (endpoint_dial_4) {
    mesh_dial_4.position.copy(endpoint_dial_4.midpoint);
    mesh_dial_4.quaternion.copy(endpoint_dial_4.quaternion);
  }
  mesh_dial_4.castShadow = options.castShadow ?? true;
  mesh_dial_4.receiveShadow = options.receiveShadow ?? true;
  mesh_dial_4.userData.sculptComponent = {"id": "dial", "name": "dial", "level": "meso", "role": "dial", "importance": 1, "confidence": 0.85, "primitive": "lathe", "topologyClass": "continuous-sculpt", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": [], "latheProfile": {"points": [[0, -0.52], [0.2, -0.52], [0.26, -0.46], [0.275, -0.25], [0.28, 0.25], [0.26, 0.46], [0.23, 0.49], [0, 0.49]], "segments": 64}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "dial-socket", "localStart": [-2.0231367015377635, -1.9465841020305865, 0.12], "localEnd": [-2.0231367015377635, -1.8465841020305864, 0.12], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [-2.0231367015377635, -1.9465841020305865, 0.12], "rotation": [0, 0, 0.12], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "rotary-control", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "dial", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "dial-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_dial_4.add(mesh_dial_4);
  meshes["dial"] = mesh_dial_4;
  colliders["dial"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["dial"] ??= [];
  destructionGroups["dial"].push(node_dial_4);

  const endpoint_nozzle_housing_5 = makeAttachmentEndpoint(null);
  const node_nozzle_housing_5 = new THREE.Group();
  node_nozzle_housing_5.name = "nozzle-housing__pivot";
  node_nozzle_housing_5.scale.set(1, 1, 1);
  if (endpoint_nozzle_housing_5) {
    node_nozzle_housing_5.position.copy(endpoint_nozzle_housing_5.start);
    node_nozzle_housing_5.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_nozzle_housing_5.position.set(0.16, -0.45, -0.23);
    node_nozzle_housing_5.rotation.set(0.0, 0.0, 0.0);
  }
  node_nozzle_housing_5.userData.sculptComponent = {"id": "nozzle-housing", "name": "nozzle-housing", "level": "meso", "role": "nozzle-housing", "importance": 1, "confidence": 0.85, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "nozzle-housing-socket", "localStart": [0.16, -0.45, -0.23], "localEnd": [0.16, -0.35, -0.23], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.16, -0.45, -0.23], "rotation": [0, 0, 0], "scale": [0.52, 0.4, 0.46]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-housing", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "nozzle-housing-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_nozzle_housing_5.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-housing", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_nozzle_housing_5);
  nodes["nozzle-housing"] = node_nozzle_housing_5;
  const mesh_nozzle_housing_5Geometry = endpoint_nozzle_housing_5
    ? new THREE.CylinderGeometry(endpoint_nozzle_housing_5.endRadius, endpoint_nozzle_housing_5.baseRadius, endpoint_nozzle_housing_5.length, 16, 6)
    : new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
  if (!endpoint_nozzle_housing_5) {
    mesh_nozzle_housing_5Geometry.scale(0.52, 0.4, 0.46);
  }
  const mesh_nozzle_housing_5 = new THREE.Mesh(
    mesh_nozzle_housing_5Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_nozzle_housing_5.name = "nozzle-housing";
  if (endpoint_nozzle_housing_5) {
    mesh_nozzle_housing_5.position.copy(endpoint_nozzle_housing_5.midpoint);
    mesh_nozzle_housing_5.quaternion.copy(endpoint_nozzle_housing_5.quaternion);
  }
  mesh_nozzle_housing_5.castShadow = options.castShadow ?? true;
  mesh_nozzle_housing_5.receiveShadow = options.receiveShadow ?? true;
  mesh_nozzle_housing_5.userData.sculptComponent = {"id": "nozzle-housing", "name": "nozzle-housing", "level": "meso", "role": "nozzle-housing", "importance": 1, "confidence": 0.85, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "nozzle-housing-socket", "localStart": [0.16, -0.45, -0.23], "localEnd": [0.16, -0.35, -0.23], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.16, -0.45, -0.23], "rotation": [0, 0, 0], "scale": [0.52, 0.4, 0.46]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-housing", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "nozzle-housing-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_nozzle_housing_5.add(mesh_nozzle_housing_5);
  meshes["nozzle-housing"] = mesh_nozzle_housing_5;
  colliders["nozzle-housing"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["nozzle-housing"] ??= [];
  destructionGroups["nozzle-housing"].push(node_nozzle_housing_5);

  const attachment_chrome_collar_6 = {"parentId": "root", "parentSocket": "chrome-collar-socket", "localStart": [-2.08, -1.475, 0.12], "localEnd": [-2.08, -1.375, 0.12], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]};
  const endpoint_chrome_collar_6 = makeAttachmentEndpoint(attachment_chrome_collar_6);
  const node_chrome_collar_6 = new THREE.Group();
  node_chrome_collar_6.name = "chrome-collar__pivot";
  node_chrome_collar_6.scale.set(1, 1, 1);
  if (endpoint_chrome_collar_6) {
    node_chrome_collar_6.position.copy(endpoint_chrome_collar_6.start);
    node_chrome_collar_6.rotation.set(0.0, 0.0, 0.12);
  } else {
    node_chrome_collar_6.position.set(-2.08, -1.475, 0.12);
    node_chrome_collar_6.rotation.set(0.0, 0.0, 0.12);
  }
  node_chrome_collar_6.userData.sculptComponent = {"id": "chrome-collar", "name": "chrome-collar", "level": "micro", "role": "chrome-collar", "importance": 1, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "chrome-collar-socket", "localStart": [-2.08, -1.475, 0.12], "localEnd": [-2.08, -1.375, 0.12], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [-2.08, -1.475, 0.12], "rotation": [0, 0, 0.12], "scale": [0.54, 0.055, 0.54]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "chrome-collar", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "chrome-collar-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "metal", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_chrome_collar_6.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "chrome-collar", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "chrome"}};
  (nodes["root"] ?? root).add(node_chrome_collar_6);
  nodes["chrome-collar"] = node_chrome_collar_6;
  const mesh_chrome_collar_6Geometry = endpoint_chrome_collar_6
    ? new THREE.CylinderGeometry(endpoint_chrome_collar_6.endRadius, endpoint_chrome_collar_6.baseRadius, endpoint_chrome_collar_6.length, 16, 6)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 8);
  if (!endpoint_chrome_collar_6) {
    mesh_chrome_collar_6Geometry.scale(0.54, 0.055, 0.54);
  }
  const mesh_chrome_collar_6 = new THREE.Mesh(
    mesh_chrome_collar_6Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_chrome_collar_6.name = "chrome-collar";
  if (endpoint_chrome_collar_6) {
    mesh_chrome_collar_6.position.copy(endpoint_chrome_collar_6.midpoint);
    mesh_chrome_collar_6.quaternion.copy(endpoint_chrome_collar_6.quaternion);
  }
  mesh_chrome_collar_6.castShadow = options.castShadow ?? true;
  mesh_chrome_collar_6.receiveShadow = options.receiveShadow ?? true;
  mesh_chrome_collar_6.userData.sculptComponent = {"id": "chrome-collar", "name": "chrome-collar", "level": "micro", "role": "chrome-collar", "importance": 1, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "chrome-collar-socket", "localStart": [-2.08, -1.475, 0.12], "localEnd": [-2.08, -1.375, 0.12], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [-2.08, -1.475, 0.12], "rotation": [0, 0, 0.12], "scale": [0.54, 0.055, 0.54]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "chrome-collar", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "chrome-collar-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "metal", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_chrome_collar_6.add(mesh_chrome_collar_6);
  meshes["chrome-collar"] = mesh_chrome_collar_6;
  colliders["chrome-collar"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["chrome-collar"] ??= [];
  destructionGroups["chrome-collar"].push(node_chrome_collar_6);

  const attachment_nozzle_a_7 = {"parentId": "root", "parentSocket": "nozzle-a-socket", "localStart": [0.04, -0.65, -0.44], "localEnd": [0.04, -0.65, -0.65], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"], "baseRadius": 0.0525, "endRadius": 0.046};
  const endpoint_nozzle_a_7 = makeAttachmentEndpoint(attachment_nozzle_a_7);
  const node_nozzle_a_7 = new THREE.Group();
  node_nozzle_a_7.name = "nozzle-a__pivot";
  node_nozzle_a_7.scale.set(1, 1, 1);
  if (endpoint_nozzle_a_7) {
    node_nozzle_a_7.position.copy(endpoint_nozzle_a_7.start);
    node_nozzle_a_7.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_nozzle_a_7.position.set(0.04, -0.65, -0.44);
    node_nozzle_a_7.rotation.set(0.0, 0.0, 0.0);
  }
  node_nozzle_a_7.userData.sculptComponent = {"id": "nozzle-a", "name": "nozzle-a", "level": "micro", "role": "nozzle-a", "importance": 1, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "nozzle-a-socket", "localStart": [0.04, -0.65, -0.44], "localEnd": [0.04, -0.65, -0.65], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"], "baseRadius": 0.0525, "endRadius": 0.046}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.04, -0.65, -0.44], "rotation": [0, 0, 0], "scale": [0.105, 0.23, 0.105]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-a", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "nozzle-a-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_nozzle_a_7.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-a", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_nozzle_a_7);
  nodes["nozzle-a"] = node_nozzle_a_7;
  const mesh_nozzle_a_7Geometry = endpoint_nozzle_a_7
    ? new THREE.CylinderGeometry(endpoint_nozzle_a_7.endRadius, endpoint_nozzle_a_7.baseRadius, endpoint_nozzle_a_7.length, 16, 6)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 8);
  if (!endpoint_nozzle_a_7) {
    mesh_nozzle_a_7Geometry.scale(0.105, 0.23, 0.105);
  }
  const mesh_nozzle_a_7 = new THREE.Mesh(
    mesh_nozzle_a_7Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_nozzle_a_7.name = "nozzle-a";
  if (endpoint_nozzle_a_7) {
    mesh_nozzle_a_7.position.copy(endpoint_nozzle_a_7.midpoint);
    mesh_nozzle_a_7.quaternion.copy(endpoint_nozzle_a_7.quaternion);
  }
  mesh_nozzle_a_7.castShadow = options.castShadow ?? true;
  mesh_nozzle_a_7.receiveShadow = options.receiveShadow ?? true;
  mesh_nozzle_a_7.userData.sculptComponent = {"id": "nozzle-a", "name": "nozzle-a", "level": "micro", "role": "nozzle-a", "importance": 1, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "nozzle-a-socket", "localStart": [0.04, -0.65, -0.44], "localEnd": [0.04, -0.65, -0.65], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"], "baseRadius": 0.0525, "endRadius": 0.046}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.04, -0.65, -0.44], "rotation": [0, 0, 0], "scale": [0.105, 0.23, 0.105]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-a", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "nozzle-a-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_nozzle_a_7.add(mesh_nozzle_a_7);
  meshes["nozzle-a"] = mesh_nozzle_a_7;
  colliders["nozzle-a"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["nozzle-a"] ??= [];
  destructionGroups["nozzle-a"].push(node_nozzle_a_7);

  const attachment_nozzle_b_8 = {"parentId": "root", "parentSocket": "nozzle-b-socket", "localStart": [0.28, -0.65, -0.44], "localEnd": [0.28, -0.65, -0.65], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"], "baseRadius": 0.0525, "endRadius": 0.046};
  const endpoint_nozzle_b_8 = makeAttachmentEndpoint(attachment_nozzle_b_8);
  const node_nozzle_b_8 = new THREE.Group();
  node_nozzle_b_8.name = "nozzle-b__pivot";
  node_nozzle_b_8.scale.set(1, 1, 1);
  if (endpoint_nozzle_b_8) {
    node_nozzle_b_8.position.copy(endpoint_nozzle_b_8.start);
    node_nozzle_b_8.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_nozzle_b_8.position.set(0.28, -0.65, -0.44);
    node_nozzle_b_8.rotation.set(0.0, 0.0, 0.0);
  }
  node_nozzle_b_8.userData.sculptComponent = {"id": "nozzle-b", "name": "nozzle-b", "level": "micro", "role": "nozzle-b", "importance": 1, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "nozzle-b-socket", "localStart": [0.28, -0.65, -0.44], "localEnd": [0.28, -0.65, -0.65], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"], "baseRadius": 0.0525, "endRadius": 0.046}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.28, -0.65, -0.44], "rotation": [0, 0, 0], "scale": [0.105, 0.23, 0.105]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-b", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "nozzle-b-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_nozzle_b_8.userData.actionProfile = {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-b", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_nozzle_b_8);
  nodes["nozzle-b"] = node_nozzle_b_8;
  const mesh_nozzle_b_8Geometry = endpoint_nozzle_b_8
    ? new THREE.CylinderGeometry(endpoint_nozzle_b_8.endRadius, endpoint_nozzle_b_8.baseRadius, endpoint_nozzle_b_8.length, 16, 6)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 8);
  if (!endpoint_nozzle_b_8) {
    mesh_nozzle_b_8Geometry.scale(0.105, 0.23, 0.105);
  }
  const mesh_nozzle_b_8 = new THREE.Mesh(
    mesh_nozzle_b_8Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_nozzle_b_8.name = "nozzle-b";
  if (endpoint_nozzle_b_8) {
    mesh_nozzle_b_8.position.copy(endpoint_nozzle_b_8.midpoint);
    mesh_nozzle_b_8.quaternion.copy(endpoint_nozzle_b_8.quaternion);
  }
  mesh_nozzle_b_8.castShadow = options.castShadow ?? true;
  mesh_nozzle_b_8.receiveShadow = options.receiveShadow ?? true;
  mesh_nozzle_b_8.userData.sculptComponent = {"id": "nozzle-b", "name": "nozzle-b", "level": "micro", "role": "nozzle-b", "importance": 1, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Rigid manufactured subassembly visible in supplied reference.", "geometryDescriptor": {"topologyIntent": "Rigid manufactured subassembly visible in supplied reference.", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}, "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals", "deformationStack": []}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "nozzle-b-socket", "localStart": [0.28, -0.65, -0.44], "localEnd": [0.28, -0.65, -0.65], "contactType": "overlap", "overlap": 0.025, "embedDepth": 0.025, "gapTolerance": 0.01, "evidenceRefs": ["full-object"], "baseRadius": 0.0525, "endRadius": 0.046}, "dimensions": {"width": 1, "height": 1, "depth": 1, "units": "relative", "confidence": 0.5}, "transform": {"position": [0.28, -0.65, -0.44], "rotation": [0, 0, 0], "scale": [0.105, 0.23, 0.105]}, "actionProfile": {"animationRole": "rigid-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "nozzle-b", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "nozzle-b-edge", "kind": "bevel", "description": "Molded edge radius 0.025 relative units with 3 segments", "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.025, "segments": 3}}], "surfaceDetail": {"macroRoughness": 0, "microRoughness": 0.015, "bumpAmplitude": 0, "normalPattern": "independent low-amplitude molded finish at 1024px", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": "Clean molded plastic: no wear. Integral panel seam, printed markings and dial inset implemented in refineGeometry.js.", "normalAmplitude": 0.015}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "refined", "colorMaterialRecipe": {"dominantAlbedo": "rgba(242, 242, 242, 1)", "secondaryAlbedo": "rgba(239, 239, 239, 1)", "materialClass": "plastic", "materialClassConfidence": 0.85, "evidenceRefs": ["full-object"]}};
  node_nozzle_b_8.add(mesh_nozzle_b_8);
  meshes["nozzle-b"] = mesh_nozzle_b_8;
  colliders["nozzle-b"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["nozzle-b"] ??= [];
  destructionGroups["nozzle-b"].push(node_nozzle_b_8);

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  refineGeometry(root.userData.sculptRuntime, 'optimization-pass');
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createPopoWashMechanicalBidetLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "PopoWash mechanical bidet look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{"type": "key light", "direction": [-3, 5, 6], "color": "#ffffff", "intensity": 3}, {"type": "fill light", "direction": [4, 1, 3], "color": "#eef1ff", "intensity": 1.5}, {"type": "rim or environment light", "direction": [0, 2, -4], "color": "#ffffff", "intensity": 2}, {"type": "render-settings", "exposure": 1, "toneMapping": "ACESFilmicToneMapping", "background": "#eceeec", "contactShadow": "soft ground shadow", "shadowSoftness": 0.8}];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createPopoWashMechanicalBidetEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function framePopoWashMechanicalBidetCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createPopoWashMechanicalBidetPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configurePopoWashMechanicalBidetRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createPopoWashMechanicalBidetInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
