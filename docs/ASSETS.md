# Assets

Third-party assets used by the 3D lab. Everything here is **CC0** (public domain): no attribution is required, the list exists so the origin of every file stays traceable.

## Textures (`public/textures/`)

Downloaded from [Poly Haven](https://polyhaven.com) at 1K, converted to WebP. `*_color` is the albedo, `*_normal` the OpenGL normal map, `*_rm` packs roughness into the green and metalness into the blue channel (the channels Three.js reads).

| Files        | Source                                                         | Used for                   | Size    |
| ------------ | -------------------------------------------------------------- | -------------------------- | ------- |
| `floor_*`    | [Grey Cartago 03](https://polyhaven.com/a/grey_cartago_03)     | polished stone floor tiles | 1024 px |
| `wall_*`     | [Metal Plate 02](https://polyhaven.com/a/metal_plate_02)       | wall panels, pillars       | 1024 px |
| `grating_*`  | [Metal Plate](https://polyhaven.com/a/metal_plate)             | floor grates               | 512 px  |
| `concrete_*` | [Concrete Wall 006](https://polyhaven.com/a/concrete_wall_006) | ceiling slab               | 512 px  |

All twelve files together are about 0.8 MB.

## Models (`public/models/`)

Downloaded from [Poly Haven](https://polyhaven.com) as 1K glTF and compressed with `gltf-transform optimize` (meshopt geometry, WebP textures at 512 px, 256 px for small props). Loaded with meshopt (no Draco, no CDN decoder).

| File                          | Source                                                                     | Used for              | Size   |
| ----------------------------- | -------------------------------------------------------------------------- | --------------------- | ------ |
| `metal_office_desk.glb`       | [Metal Office Desk](https://polyhaven.com/a/metal_office_desk)             | workbench             | 94 KB  |
| `worn_metal_rack.glb`         | [Worn Metal Rack](https://polyhaven.com/a/worn_metal_rack)                 | shelves               | 110 KB |
| `plastic_crate_01.glb`        | [Plastic Crate 01](https://polyhaven.com/a/plastic_crate_01)               | crates                | 217 KB |
| `plastic_crate_03.glb`        | [Plastic Crate 03](https://polyhaven.com/a/plastic_crate_03)               | crates                | 252 KB |
| `power_box_01.glb`            | [Power Box 01](https://polyhaven.com/a/power_box_01)                       | wall power box        | 196 KB |
| `tool_cart.glb`               | [Tool Cart](https://polyhaven.com/a/tool_cart)                             | cart next to the rack | 295 KB |
| `metal_toolbox.glb`           | [Metal Toolbox](https://polyhaven.com/a/metal_toolbox)                     | toolboxes             | 131 KB |
| `utility_box_01.glb`          | [Utility Box 01](https://polyhaven.com/a/utility_box_01)                   | distribution boxes    | 56 KB  |
| `industrial_storage_cart.glb` | [Industrial Storage Cart](https://polyhaven.com/a/industrial_storage_cart) | storage cart          | 232 KB |
| `hanging_industrial_lamp.glb` | [Hanging Industrial Lamp](https://polyhaven.com/a/hanging_industrial_lamp) | ceiling lamps         | 133 KB |

All ten models together are about 1.7 MB; with the textures the lab's assets are about 2.5 MB (budget 3 MB).

## Monitor wear (`src/assets/crt-*.svg`)

Own drawings, no third-party source. Procedural SVG textures (`feTurbulence`) that give the CRT housing its worn look; Vite inlines them into the CSS.

| File             | Used for                                                 | Size  |
| ---------------- | -------------------------------------------------------- | ----- |
| `crt-grime.svg`  | tiling stains, paint flakes and a few scratches          | ~1 KB |
| `crt-rust.svg`   | rust patches in two corners of the housing and the bezel | ~1 KB |
| `crt-cracks.svg` | hairline cracks in the lower right of the tube glass     | ~1 KB |

## Adding an asset

1. Only CC0 or equivalently permissive sources.
2. Smallest resolution that still looks right; WebP for textures, glTF with meshopt or Draco for models.
3. Add a row to this file in the same PR.
4. Keep the total within the asset budget of `docs/design-concept.md` section 7.
