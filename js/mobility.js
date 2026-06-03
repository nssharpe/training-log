import { MOBILITY } from "../data/mobility-program.js";
import { renderProgramTab } from "./program-tab.js";

export function renderMobility(container) {
  return renderProgramTab({
    tab: "mobility",
    container,
    groups: MOBILITY.groups,
  });
}
