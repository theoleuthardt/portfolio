import {
  BufferAttribute,
  BufferGeometry,
  InterleavedBufferAttribute,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** The static meshes of a subtree merged per material, and their sources. */
export interface MergedStatic {
  meshes: Mesh[];
  /** The meshes that were merged and can be hidden. */
  sources: Mesh[];
}

const ATTRIBUTES = ["position", "normal", "uv"] as const;

/** A key that is equal for materials that render the same. */
function materialKey(material: Material): string | undefined {
  if (
    (!(material instanceof MeshStandardMaterial) &&
      !(material instanceof MeshBasicMaterial)) ||
    material.vertexColors
  ) {
    return undefined;
  }
  const standard =
    material instanceof MeshStandardMaterial ? material : undefined;
  return [
    material.type,
    material.color.getHexString(),
    material.map?.uuid ?? "",
    material.transparent,
    material.opacity,
    material.side,
    material.toneMapped,
    material.fog,
    material.depthWrite,
    material.depthTest,
    material.blending,
    material.alphaTest,
    material.alphaMap?.uuid ?? "",
    material.wireframe,
    standard?.flatShading ?? "",
    standard?.envMapIntensity ?? "",
    standard?.aoMap?.uuid ?? "",
    standard?.lightMap?.uuid ?? "",
    standard?.roughness ?? "",
    standard?.metalness ?? "",
    standard?.emissive.getHexString() ?? "",
    standard?.emissiveIntensity ?? "",
    standard?.roughnessMap?.uuid ?? "",
    standard?.metalnessMap?.uuid ?? "",
    standard?.normalMap?.uuid ?? "",
    standard?.emissiveMap?.uuid ?? "",
  ].join("|");
}

function isDynamic(object: Object3D, root: Object3D): boolean {
  for (
    let current: Object3D | null = object;
    current;
    current = current.parent
  ) {
    if (current.userData.dynamic === true) {
      return true;
    }
    if (current === root) {
      return false;
    }
  }
  return false;
}

/** An attribute as plain floats, whatever its storage (quantized, interleaved). */
function asFloats(attribute: BufferAttribute | InterleavedBufferAttribute) {
  const { count, itemSize } = attribute;
  const values = new Float32Array(count * itemSize);
  const read = [
    (index: number) => attribute.getX(index),
    (index: number) => attribute.getY(index),
    (index: number) => attribute.getZ(index),
    (index: number) => attribute.getW(index),
  ];
  for (let index = 0; index < count; index++) {
    for (let component = 0; component < itemSize; component++) {
      values[index * itemSize + component] = read[component](index);
    }
  }
  return new BufferAttribute(values, itemSize);
}

/**
 * A copy of the geometry in root space: non-indexed, plain float position,
 * normal and uv (quantized glTF data would clamp when transformed), or
 * `undefined` for geometries that cannot be merged.
 */
function prepared(mesh: Mesh, toRoot: Matrix4): BufferGeometry | undefined {
  const source = mesh.geometry;
  if (
    !ATTRIBUTES.every((name) => source.getAttribute(name) !== undefined) ||
    Object.keys(source.morphAttributes).length > 0
  ) {
    return undefined;
  }
  const flat = source.index ? source.toNonIndexed() : source;
  const geometry = new BufferGeometry();
  for (const name of ATTRIBUTES) {
    geometry.setAttribute(name, asFloats(flat.getAttribute(name)));
  }
  if (flat !== source) {
    flat.dispose();
  }
  geometry.applyMatrix4(
    new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld),
  );
  return geometry;
}

/**
 * Merges the visible static meshes below `root` that render the same (equal
 * material settings) into one mesh per material, in `root`'s space, so they
 * draw in one call instead of many. Meshes or groups marked
 * `userData.dynamic` (anything that moves or changes), hidden meshes,
 * instanced meshes, multi-material meshes, meshes with vertex colours,
 * morphing meshes and meshes with other materials or attributes are left
 * alone, and so are the meshes of a material whose geometries cannot merge.
 * Call after the world matrices are up to date.
 */
export function mergeStatic(root: Object3D): MergedStatic {
  const toRoot = new Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<
    string,
    { material: Material; geometries: BufferGeometry[]; meshes: Mesh[] }
  >();
  root.traverseVisible((object) => {
    if (
      !(object instanceof Mesh) ||
      "isInstancedMesh" in object ||
      Array.isArray(object.material) ||
      isDynamic(object, root)
    ) {
      return;
    }
    const material = object.material as Material;
    const key = materialKey(material);
    const geometry = key === undefined ? undefined : prepared(object, toRoot);
    if (key === undefined || geometry === undefined) {
      return;
    }
    const group = groups.get(key) ?? { material, geometries: [], meshes: [] };
    group.geometries.push(geometry);
    group.meshes.push(object);
    groups.set(key, group);
  });
  const meshes: Mesh[] = [];
  const sources: Mesh[] = [];
  for (const group of groups.values()) {
    const merged = mergeGeometries(group.geometries);
    group.geometries.forEach((geometry) => geometry.dispose());
    if (merged) {
      meshes.push(new Mesh(merged, group.material));
      sources.push(...group.meshes);
    }
  }
  return { meshes, sources };
}
