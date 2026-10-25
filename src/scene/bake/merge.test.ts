import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
} from "three";
import { describe, expect, it } from "vitest";
import { mergeStatic } from "./merge";

const grey = () =>
  new MeshStandardMaterial({ color: "#808080", roughness: 0.5 });
const red = () => new MeshBasicMaterial({ color: "#ff0000" });

describe("mergeStatic", () => {
  it("merges meshes with equal materials into one mesh per material", () => {
    const root = new Group();
    const a = new Mesh(new BoxGeometry(1, 1, 1), grey());
    const b = new Mesh(new BoxGeometry(1, 1, 1), grey());
    b.position.set(3, 0, 0);
    const c = new Mesh(new BoxGeometry(1, 1, 1), red());
    root.add(a, b, c);
    root.updateMatrixWorld(true);
    const merged = mergeStatic(root);
    expect(merged.meshes).toHaveLength(2);
    const box = new BoxGeometry(1, 1, 1).toNonIndexed();
    const counts = merged.meshes
      .map((mesh) => mesh.geometry.getAttribute("position").count)
      .sort((x, y) => x - y);
    expect(counts).toEqual([
      box.getAttribute("position").count,
      box.getAttribute("position").count * 2,
    ]);
    expect(merged.sources).toEqual([a, b, c]);
  });

  it("bakes each mesh's transform relative to the root into the vertices", () => {
    const root = new Group();
    root.position.set(10, 0, 0);
    const moved = new Mesh(new BoxGeometry(1, 1, 1), grey());
    moved.position.set(0, 5, 0);
    root.add(moved);
    root.updateMatrixWorld(true);
    const [mesh] = mergeStatic(root).meshes;
    mesh.geometry.computeBoundingBox();
    expect(mesh.geometry.boundingBox?.min.y).toBeCloseTo(4.5);
    expect(mesh.geometry.boundingBox?.min.x).toBeCloseTo(-0.5);
  });

  it("merges indexed and non-indexed geometries together", () => {
    const root = new Group();
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(1, 0);
    shape.lineTo(0, 1);
    root.add(
      new Mesh(new BoxGeometry(), grey()),
      new Mesh(new ExtrudeGeometry(shape, { depth: 0.1 }), grey()),
      new Mesh(new CylinderGeometry(), grey()),
    );
    root.updateMatrixWorld(true);
    expect(mergeStatic(root).meshes).toHaveLength(1);
  });

  it("converts quantized attributes before moving them into root space", () => {
    const quantized = new BufferGeometry();
    const corner = 32767;
    quantized.setAttribute(
      "position",
      new BufferAttribute(
        new Int16Array([0, 0, 0, corner, 0, 0, 0, corner, 0]),
        3,
        true,
      ),
    );
    quantized.setAttribute(
      "normal",
      new BufferAttribute(
        new Int8Array([0, 0, 127, 0, 0, 127, 0, 0, 127]),
        3,
        true,
      ),
    );
    quantized.setAttribute(
      "uv",
      new BufferAttribute(new Uint16Array([0, 0, 65535, 0, 0, 65535]), 2, true),
    );
    const root = new Group();
    const mesh = new Mesh(quantized, grey());
    mesh.scale.setScalar(4);
    root.add(mesh);
    root.updateMatrixWorld(true);
    const [merged] = mergeStatic(root).meshes;
    merged.geometry.computeBoundingBox();
    expect(merged.geometry.boundingBox?.max.x).toBeCloseTo(4, 3);
    expect(merged.geometry.getAttribute("position").normalized).toBe(false);
  });

  it("keeps the originals of a material whose geometries cannot merge", () => {
    const root = new Group();
    const lines = new BufferGeometry();
    lines.setAttribute("position", new BufferAttribute(new Float32Array(9), 3));
    lines.setAttribute("normal", new BufferAttribute(new Float32Array(9), 3));
    lines.setAttribute("uv", new BufferAttribute(new Float32Array(6), 2));
    lines.morphAttributes.position = [
      new BufferAttribute(new Float32Array(9), 3),
    ];
    const box = new Mesh(new BoxGeometry(), grey());
    const morphing = new Mesh(lines, grey());
    root.add(box, morphing);
    root.updateMatrixWorld(true);
    expect(mergeStatic(root).sources).not.toContain(morphing);
  });

  it("leaves meshes with vertex colours alone", () => {
    const root = new Group();
    const tinted = new Mesh(
      new BoxGeometry(),
      new MeshStandardMaterial({ vertexColors: true }),
    );
    root.add(tinted, new Mesh(new BoxGeometry(), grey()));
    root.updateMatrixWorld(true);
    expect(mergeStatic(root).sources).not.toContain(tinted);
  });

  it("leaves dynamic meshes and whole dynamic groups alone", () => {
    const root = new Group();
    const fixed = new Mesh(new BoxGeometry(), grey());
    const spinning = new Mesh(new BoxGeometry(), grey());
    spinning.userData.dynamic = true;
    const fan = new Group();
    fan.userData.dynamic = true;
    fan.add(new Mesh(new BoxGeometry(), grey()));
    root.add(fixed, spinning, fan);
    root.updateMatrixWorld(true);
    const merged = mergeStatic(root);
    expect(merged.sources).toEqual([fixed]);
    expect(merged.meshes).toHaveLength(1);
  });
});
