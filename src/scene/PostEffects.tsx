import {
  Bloom,
  EffectComposer,
  N8AO,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Post-processing of the lab, loaded as its own chunk after the scene:
 * ambient occlusion, bloom on everything brighter than white (neon, panels),
 * film grain, vignette and ACES tone mapping.
 */
export default function PostEffects() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO
        aoRadius={1.2}
        intensity={2.2}
        distanceFalloff={1}
        quality="medium"
      />
      <Bloom
        mipmapBlur
        luminanceThreshold={0.9}
        luminanceSmoothing={0.2}
        intensity={0.85}
        radius={0.7}
      />
      <Noise premultiply opacity={0.35} />
      <Vignette offset={0.25} darkness={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
