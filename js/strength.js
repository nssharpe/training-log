import { STRENGTH } from "../data/strength-program.js";
import { renderProgramTab } from "./program-tab.js";

export function renderStrength(container) {
  return renderProgramTab({
    tab: "strength",
    container,
    programs: STRENGTH.splits,
  });
}
