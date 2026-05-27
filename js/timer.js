// Rest timer + metronome — Web Audio API, no audio files needed.

let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function beep({ freq = 880, durMs = 80, gain = 0.25, type = "sine" } = {}) {
  const c = ctx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + durMs / 1000 + 0.02);
}

// ---------- rest timer ----------
const overlay = () => document.getElementById("timer-overlay");
const display = () => document.getElementById("timer-display");
let restEndAt = 0;
let restInterval = null;

function fmt(ms) {
  if (ms < 0) ms = 0;
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function tickRest() {
  const left = restEndAt - Date.now();
  display().textContent = fmt(left);
  if (left <= 0) stopRest(true);
}

export function startRest(seconds) {
  stopRest(false);
  restEndAt = Date.now() + seconds * 1000;
  overlay().hidden = false;
  display().textContent = fmt(seconds * 1000);
  restInterval = setInterval(tickRest, 200);
}

export function stopRest(playDing) {
  clearInterval(restInterval);
  restInterval = null;
  overlay().hidden = true;
  if (playDing) {
    beep({ freq: 880, durMs: 150, gain: 0.3 });
    setTimeout(() => beep({ freq: 1320, durMs: 200, gain: 0.3 }), 180);
  }
}

// Parse a prescription rest string like "60s+", "90s+", "as needed" → seconds (or null).
export function parseRestSeconds(text) {
  if (!text) return null;
  const m = String(text).match(/(\d+)\s*s/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

// ---------- metronome ----------
const metroOverlay = () => document.getElementById("metronome-overlay");
let metroInterval = null;
let metroBeat = 0;

export function startMetronome(bpm) {
  stopMetronome();
  const periodMs = 60000 / bpm;
  metroBeat = 0;
  beep({ freq: 1200, durMs: 50, gain: 0.3 });
  metroInterval = setInterval(() => {
    metroBeat++;
    // accent every 4th beat
    const accent = metroBeat % 4 === 0;
    beep({ freq: accent ? 1500 : 1000, durMs: 50, gain: accent ? 0.35 : 0.22 });
  }, periodMs);
  document.getElementById("metro-toggle").textContent = "Stop";
}

export function stopMetronome() {
  clearInterval(metroInterval);
  metroInterval = null;
  const btn = document.getElementById("metro-toggle");
  if (btn) btn.textContent = "Start";
}

export function isMetronomeRunning() { return metroInterval !== null; }

// ---------- wiring ----------
export function wireOverlays() {
  document.getElementById("timer-stop").addEventListener("click", () => stopRest(false));
  document.getElementById("timer-add-30").addEventListener("click", () => {
    restEndAt += 30000;
    tickRest();
  });
  document.getElementById("metro-toggle").addEventListener("click", () => {
    if (isMetronomeRunning()) stopMetronome();
    else {
      const bpm = Math.max(20, Math.min(240, parseInt(document.getElementById("bpm-input").value, 10) || 60));
      startMetronome(bpm);
    }
  });
  document.getElementById("metro-close").addEventListener("click", () => {
    stopMetronome();
    metroOverlay().hidden = true;
  });
  for (const v of [60, 90, 120]) {
    document.getElementById(`bpm-${v}`).addEventListener("click", () => {
      document.getElementById("bpm-input").value = v;
      if (isMetronomeRunning()) startMetronome(v);
    });
  }
}

export function openMetronome() { metroOverlay().hidden = false; }
