import { renderMobility } from "./mobility.js";
import { renderStrength } from "./strength.js";
import { renderHistory } from "./history.js";
import { wireOverlays } from "./timer.js";

const TABS = {
  mobility: renderMobility,
  strength: renderStrength,
  history: renderHistory,
};

function currentTab() {
  const hash = location.hash.slice(1);
  const tab = hash.split("?")[0];
  return TABS[tab] ? tab : "mobility";
}

async function route() {
  const tab = currentTab();
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const main = document.getElementById("app-main");
  main.setAttribute("aria-busy", "true");
  try {
    await TABS[tab](main);
  } catch (e) {
    main.innerHTML = `<p class="muted">Error rendering ${tab}. Check the console.</p>`;
    console.error(e);
  } finally {
    main.removeAttribute("aria-busy");
  }
}

// wire tabs
document.querySelectorAll(".tab").forEach((b) => {
  b.addEventListener("click", () => {
    const tab = b.dataset.tab;
    location.hash = `#${tab}`;
  });
});

document.getElementById("tips-btn").addEventListener("click", () => {
  window.open("./cheatsheet.html", "_blank");
});

window.addEventListener("hashchange", route);
wireOverlays();
route();
