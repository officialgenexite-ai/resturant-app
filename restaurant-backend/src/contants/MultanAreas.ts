export const MULTAN_AREAS = [
  "Cantt",
  "Gulgasht Colony",
  "Shah Rukn-e-Alam Colony",
  "Bosan Road",
  "Model Town",
  "Chowk Kumharanwala",
  "Vehari Road",
  "Nawa Shehar",
] as const;

export type MultanArea = (typeof MULTAN_AREAS)[number];
