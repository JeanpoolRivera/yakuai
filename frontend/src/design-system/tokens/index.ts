export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./radii";
export * from "./shadows";
export * from "./motion";
export * from "./targets";

import * as colors from "./colors";
import * as typography from "./typography";
import * as spacing from "./spacing";
import * as radii from "./radii";
import * as shadows from "./shadows";
import * as motion from "./motion";
import * as targets from "./targets";

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
  targets,
} as const;
