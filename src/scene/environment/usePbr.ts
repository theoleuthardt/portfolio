import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { surfaceUrls, type Surface } from "./surfaces";

/** Maps for a `MeshStandardMaterial`-like material. */
export interface PbrMaps {
  map: Texture;
  normalMap: Texture;
  roughnessMap: Texture;
  metalnessMap: Texture;
}

function tiled(texture: Texture, repeatX: number, repeatY: number): Texture {
  const copy = texture.clone();
  copy.wrapS = RepeatWrapping;
  copy.wrapT = RepeatWrapping;
  copy.repeat.set(repeatX, repeatY);
  copy.anisotropy = 8;
  copy.needsUpdate = true;
  return copy;
}

/**
 * Loads a surface's PBR maps (suspends until they are loaded) and tiles them
 * `repeatX` × `repeatY` times. Each call gets its own texture copies, so the
 * same surface can be tiled differently on different meshes.
 */
export function usePbr(
  surface: Surface,
  repeatX: number,
  repeatY: number,
): PbrMaps {
  const [color, normal, roughnessMetalness] = useTexture(
    surfaceUrls(surface, import.meta.env.BASE_URL),
  );
  const maps = useMemo(() => {
    const map = tiled(color, repeatX, repeatY);
    map.colorSpace = SRGBColorSpace;
    const packed = tiled(roughnessMetalness, repeatX, repeatY);
    return {
      map,
      normalMap: tiled(normal, repeatX, repeatY),
      roughnessMap: packed,
      metalnessMap: packed,
    };
  }, [color, normal, roughnessMetalness, repeatX, repeatY]);
  useEffect(
    () => () => {
      maps.map.dispose();
      maps.normalMap.dispose();
      maps.roughnessMap.dispose();
    },
    [maps],
  );
  return maps;
}
