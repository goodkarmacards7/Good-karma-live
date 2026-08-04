window.GOOD_KARMA_CONFIG = {
  sheetId: "1893dQvXUL_8ltl9zem8ygiHIUfo4pzui3q2ceQsmNW4",

  // The gid numbers for the two tabs in your Google Sheet.
  hitsGid: "0",
  statsGid: "0",

  refreshSeconds: 10,
  celebrationSeconds: 6,

  hitColumns: {
    name: "Card Name",
    number: "Card Number",
    image: "Image URL",
    status: "Status",
    value: "Value",
    tier: "Tier",
    show: "Show on Board",
    celebrate: "Celebrate"
  },

  soldWords: ["sold", "pulled", "claimed"],
  showWords: ["yes", "y", "true", "1", "show"],
  celebrateWords: ["yes", "y", "true", "1"],

  // Stats tab uses two columns: Key and Value.
  statsKeys: {
    packsRemaining: "Packs Remaining",
    packsSold: "Packs Sold",
    streamNote: "Stream Note"
  },

  useDemoDataUntilConfigured: true
};
