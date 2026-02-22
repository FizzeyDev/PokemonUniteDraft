import { state } from "./state.js";

const mapImg = document.getElementById("map-img");

export function updateMapScale() {
  if (!mapImg.naturalWidth) return;
  state.mapScale = mapImg.clientWidth / mapImg.naturalWidth;
}

export function scaledSize(baseSize) {
  return Math.max(12, Math.round(baseSize * state.mapScale));
}

export function rescaleAll() {
  updateMapScale();
  document.querySelectorAll("#spawns-container .spawn, #towers-container .tower").forEach(el => {
    const base = parseFloat(el.dataset.baseSize);
    if (!base) return;
    const sz = scaledSize(base);
    el.style.width  = `${sz}px`;
    el.style.height = `${sz}px`;
  });
}

mapImg.addEventListener("load", rescaleAll);
window.addEventListener("resize", rescaleAll);