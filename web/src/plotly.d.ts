declare module "react-plotly.js" {
  import type { FC } from "react";
  import type { PlotParams } from "plotly.js";

  const Plot: FC<PlotParams>;
  export default Plot;
}
