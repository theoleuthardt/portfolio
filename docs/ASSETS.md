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

## Adding an asset

1. Only CC0 or equivalently permissive sources.
2. Smallest resolution that still looks right; WebP for textures, glTF with meshopt or Draco for models.
3. Add a row to this file in the same PR.
4. Keep the total within the asset budget of `docs/design-concept.md` section 7.
