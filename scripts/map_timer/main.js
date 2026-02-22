import { state } from "./state.js";
import { loadSpawns } from "./timer.js";

state.currentMap = "groudon";
document.getElementById("map-img").src = "assets/maps/map_groudon.webp";
loadSpawns("groudon");
