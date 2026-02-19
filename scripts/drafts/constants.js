export const mapImages = {
  groudon: "assets/maps/spawn/groudon.png",
  kyogre:  "assets/maps/spawn/kyogre.png",
  rayquaza:"assets/maps/spawn/rayquaza.png",
};

export const draftOrders = {
  classic: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
  ],
  swap: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamB", type: "ban" }, { team: "teamA", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
  ],
  reban: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamA", type: "ban" },  { team: "teamB", type: "ban" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
  ],
  tournament: [
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "ban" }, { team: "teamB", type: "ban" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
    { team: "teamB", type: "pick" }, { team: "teamA", type: "pick" },
    { team: "teamA", type: "pick" }, { team: "teamB", type: "pick" },
  ],
};
