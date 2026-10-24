import { ROOM } from "../layout";

/** The CC0 models in `public/models/` (see docs/ASSETS.md). */
export const PROP_MODELS = [
  "metal_office_desk",
  "worn_metal_rack",
  "plastic_crate_01",
  "plastic_crate_03",
  "power_box_01",
  "tool_cart",
  "metal_toolbox",
  "utility_box_01",
  "industrial_storage_cart",
  "hanging_industrial_lamp",
] as const;

/** One of {@link PROP_MODELS}. */
export type PropModel = (typeof PROP_MODELS)[number];

/** One placed model in scene space; models stand on their origin. */
export interface ModelProp {
  model: PropModel;
  position: [number, number, number];
  rotationY: number;
}

const FLOOR = ROOM.floor;
const CRATE_01_HEIGHT = 0.264;
const CRATE_03_HEIGHT = 0.266;

/** Height of the workbench top (metal_office_desk is 0.787 m tall). */
export const DESK_TOP = FLOOR + 0.787;
const CART_TOP = FLOOR + 0.96;

/** Where the models stand in the lab. */
export const MODEL_PROPS: readonly ModelProp[] = [
  {
    model: "metal_office_desk",
    position: [-5.4, FLOOR, -8.5],
    rotationY: Math.PI / 2,
  },
  {
    model: "worn_metal_rack",
    position: [6.35, FLOOR, -6.5],
    rotationY: -Math.PI / 2,
  },
  { model: "plastic_crate_01", position: [6.05, FLOOR, -4.7], rotationY: 0.3 },
  {
    model: "plastic_crate_01",
    position: [6.1, FLOOR + CRATE_01_HEIGHT, -4.72],
    rotationY: 0.1,
  },
  {
    model: "plastic_crate_01",
    position: [5.55, FLOOR, -5.25],
    rotationY: -0.25,
  },
  {
    model: "power_box_01",
    position: [ROOM.right - 0.06, 0.1, -2.2],
    rotationY: -Math.PI / 2,
  },
  { model: "tool_cart", position: [3.7, FLOOR, -0.6], rotationY: -0.6 },
  {
    model: "metal_toolbox",
    position: [3.75, CART_TOP, -0.55],
    rotationY: -0.9,
  },
  {
    model: "metal_toolbox",
    position: [-5.35, DESK_TOP, -7.55],
    rotationY: Math.PI / 2,
  },
  {
    model: "worn_metal_rack",
    position: [-6.35, FLOOR, -1.6],
    rotationY: Math.PI / 2,
  },
  {
    model: "plastic_crate_03",
    position: [-6.3, FLOOR + 0.42, -1.6],
    rotationY: Math.PI / 2,
  },
  {
    model: "plastic_crate_03",
    position: [-6.3, FLOOR + 1.12, -1.75],
    rotationY: Math.PI / 2,
  },
  {
    model: "utility_box_01",
    position: [-6.65, FLOOR, -4.2],
    rotationY: Math.PI / 2,
  },
  {
    model: "utility_box_01",
    position: [6.65, FLOOR, -10.8],
    rotationY: -Math.PI / 2,
  },
  {
    model: "industrial_storage_cart",
    position: [4.7, FLOOR, -9.4],
    rotationY: -0.35,
  },
  {
    model: "plastic_crate_03",
    position: [-4.85, FLOOR, -10.6],
    rotationY: 0.2,
  },
  {
    model: "plastic_crate_03",
    position: [-4.85, FLOOR + CRATE_03_HEIGHT, -10.62],
    rotationY: 0.05,
  },
  { model: "plastic_crate_01", position: [-4.3, FLOOR, -11], rotationY: -0.4 },
  {
    model: "hanging_industrial_lamp",
    position: [-5.4, ROOM.ceiling, -8.5],
    rotationY: 0,
  },
  {
    model: "hanging_industrial_lamp",
    position: [4.7, ROOM.ceiling, -9.4],
    rotationY: 0.5,
  },
];
