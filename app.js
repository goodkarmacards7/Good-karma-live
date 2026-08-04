(() => {
  "use strict";

  const cfg = window.GOOD_KARMA_CONFIG;
  const $ = id => document.getElementById(id);

  const els = {
    grid: $("cardGrid"),
    template: $("cardTemplate"),
    empty: $("emptyState"),
    showPulled: $("showPulled"),
    liveHitsCount: $("liveHitsCount"),
    highestChase: $("highestChase"),
    packsRemaining: $("packsRemaining"),
    packsSold: $("packsSold"),
    hitsPulled: $("hitsPulled"),
    totalHits: $("totalHits"),
    recentHit: $("recentHit"),
    streamNote: $("streamNote"),
    connectionDot: $("connectionDot"),
    connectionText: $("connectionText"),
    lastUpdated: $("lastUpdated"),
    celebration: $("celebration"),
    celebrationImage: $("celebrationImage"),
    celebrationName: $("celebrationName"),
    celebrationValue: $("celebrationValue")
  };

  let hits = [];
  let stats = {};
  let firstLoad = true;

  const demoHits = [
    {"Card Name":"Greninja ex","Card Number":"214/167","Image URL":"https://images.pokemontcg.io/sv6/214_hires.png","Status":"Available","Value":"$225","Tier":"Top Chase","Show on Board":"Yes","Celebrate":"Yes"},
    {"Card Name":"Charizard ex","Card Number":"199/165","Image URL":"https://images.pokemontcg.io/sv3pt5/199_hires.png","Status":"Available","Value":"$115","Tier":"Chase","Show on Board":"Yes","Celebrate":"Yes"},
    {"Card Name":"Pikachu","Card Number":"173/165","Image URL":"https://images.pokemontcg.io/sv3pt5/173_hires.png","Status":"Sold","Value":"$45","Tier":"Premium IR","Show on Board":"Yes","Celebrate":"No"}
  ];

  const demoStats = {
    "Packs Remaining":"86",
    "Packs Sold":"14",
    "Stream Note":"Every pack contains an Illustration Rare or better."
  };

  const norm = v => String(v ?? "").trim();
  const lower = v => norm(v).toLowerCase();

  function isSold(card){
    return cfg.soldWords.some(w => lower(card[cfg.hitColumns.status]) === w.toLowerCase());
  }
  function shouldShow(card){
    return cfg.showWords.some(w => lower(card[cfg.hitColumns.show]) === w.toLowerCase());
  }
  function shouldCelebrate(card){
    return cfg.celebrateWords.some(w => lower(card[cfg.hitColumns.celebrate]) === w.toLowerCase());
  }
  function moneyToNumber(v){
    const n = parseFloat(norm(v).replace(/[^0-9.-]/g,""));
    return Number.isFinite(n) ? n : 0;
  }
  function setConnection(ok,message){
    els.connectionDot.className = "dot " + (ok ? "live" : "error");
    els.connectionText.textContent = message;
  }

  function render(){
    const premium = hits.filter(shouldShow);
    const visible = premium.filter(c => els.showPulled.checked || !isSold(c));
    const live = premium.filter(c => !isSold(c));
    const pulled = premium.filter(isSold);

    els.grid.innerHTML = "";
    els.empty.hidden = visible.length !== 0;

    visible
      .sort((a,b) => moneyToNumber(b[cfg.hitColumns.value]) - moneyToNumber(a[cfg.hitColumns.value]))
      .forEach(card => {
        const node = els.template.content.cloneNode(true);
        const tile = node.querySelector(".card-tile");
        const img = node.querySelector(".card-image");
        const name = norm(card[cfg.hitColumns.name]) || "Unnamed Card";

        tile.classList.toggle("sold", isSold(card));
        img.src = norm(card[cfg.hitColumns.image]);
        img.alt = name;
        img.onerror = () => { img.style.opacity = ".15"; };

        node.querySelector(".card-name").textContent = name;
        node.querySelector(".card-number").textContent = norm(card[cfg.hitColumns.number]);
        node.querySelector(".card-value").textContent = norm(card[cfg.hitColumns.value]);

        const badge = node.querySelector(".tier-badge");
        badge.textContent = norm(card[cfg.hitColumns.tier]);
        badge.hidden = !badge.textContent;

        els.grid.appendChild(node);
      });

    els.liveHitsCount.textContent = live.length;
    els.hitsPulled.textContent = pulled.length;
    els.totalHits.textContent = premium.length;

    const highest = live.reduce((max,c) => Math.max(max,moneyToNumber(c[cfg.hitColumns.value])),0);
    els.highestChase.textContent = highest ? `$${highest.toLocaleString()}` : "$0";

    els.packsRemaining.textContent = stats[cfg.statsKeys.packsRemaining] || "0";
    els.packsSold.textContent = stats[cfg.statsKeys.packsSold] || "0";
    els.streamNote.textContent = stats[cfg.statsKeys.streamNote] || "Every pack contains an Illustration Rare or better.";

    const recent = pulled[pulled.length - 1];
    els.recentHit.textContent = recent
      ? `${norm(recent[cfg.hitColumns.name])} ${norm(recent[cfg.hitColumns.value])}`.trim()
      : "Waiting for the first pull...";
  }

  function showCelebration(card){
    els.celebrationImage.src = norm(card[cfg.hitColumns.image]);
    els.celebrationName.textContent = norm(card[cfg.hitColumns.name]) || "Top Chase Pulled";
    els.celebrationValue.textContent = norm(card[cfg.hitColumns.value]);
    els.celebration.hidden = false;
    setTimeout(() => { els.celebration.hidden = true; }, Math.max(3,Number(cfg.celebrationSeconds)||6)*1000);
  }

  function detectNewCelebrations(previous,newHits){
    if(firstLoad) return;
    const prevSold = new Set(previous.filter(isSold).map(cardKey));
    const newSold = newHits.filter(c => isSold(c) && shouldCelebrate(c) && !prevSold.has(cardKey(c)));
    if(newSold.length) showCelebration(newSold[0]);
  }

  function cardKey(card){
    return `${norm(card[cfg.hitColumns.name])}|${norm(card[cfg.hitColumns.number])}`;
  }

  async function fetchSheet(gid){
    const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?gid=${encodeURIComponent(gid)}&tqx=out:json&tq=${encodeURIComponent("select *")}&cacheBust=${Date.now()}`;
    const response = await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(`Google Sheet request failed (${response.status}).`);
    const text = await response.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if(start < 0 || end < 0) throw new Error("Google Sheet returned unreadable data.");
    const payload = JSON.parse(text.slice(start,end+1));
    const headers = payload.table.cols.map((col,i) => norm(col.label) || `Column ${i+1}`);
    return payload.table.rows.map(row => {
      const obj = {};
      headers.forEach((h,i) => {
        const cell = row.c?.[i];
        obj[h] = cell?.f ?? cell?.v ?? "";
      });
      return obj;
    });
  }

  async function refresh(){
    const configured = cfg.sheetId && cfg.sheetId !== "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";

    try{
      const previous = hits.slice();

      if(!configured){
        if(!cfg.useDemoDataUntilConfigured) throw new Error("Google Sheet ID has not been configured.");
        hits = demoHits;
        stats = demoStats;
        setConnection(true,"Demo mode");
      }else{
        const [hitRows,statRows] = await Promise.all([
          fetchSheet(cfg.hitsGid),
          fetchSheet(cfg.statsGid)
        ]);
        hits = hitRows.filter(r => norm(r[cfg.hitColumns.name]));
        stats = {};
        statRows.forEach(r => {
          const values = Object.values(r);
          if(values.length >= 2 && norm(values[0])) stats[norm(values[0])] = norm(values[1]);
        });
        setConnection(true,"Live Google Sheet connected");
      }

      detectNewCelebrations(previous,hits);
      render();
      firstLoad = false;
      els.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit",second:"2-digit"})}`;
    }catch(err){
      console.error(err);
      setConnection(false,err.message);
    }
  }

  els.showPulled.addEventListener("change",render);
  refresh();
  setInterval(refresh,Math.max(5,Number(cfg.refreshSeconds)||10)*1000);
})();
