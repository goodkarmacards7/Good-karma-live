(()=>{
  "use strict";

  const c = window.GOOD_KARMA_CONFIG;
  const $ = id => document.getElementById(id);

  const e = {
    image: $("featuredImage"),
    name: $("featuredName"),
    number: $("featuredNumber"),
    value: $("featuredValue"),
    tier: $("featuredTier"),
    counter: $("hitCounter"),
    progress: $("rotationProgress"),
    packs: $("packsRemaining"),

    dot: $("connectionDot"),
    text: $("connectionText"),
    updated: $("lastUpdated"),

    celebration: $("celebration"),
    ci: $("celebrationImage"),
    cn: $("celebrationName"),
    cv: $("celebrationValue"),
    cw: $("celebrationWinner")
  };

  let hits = [];
  let stats = {};
  let first = true;

  let featuredHits = [];
  let featuredIndex = 0;
  let currentFeaturedKey = "";

  /*
    FEATURED CARD ROTATION SPEED
    The display changes to the next premium hit every 4 seconds.
  */
  const rotationSeconds = 4;

  const n = v =>
    String(v ?? "").trim();

  const l = v =>
    n(v).toLowerCase();

  const sold = x =>
    c.soldWords.some(
      w => l(x[c.hitColumns.status]) === l(w)
    );

  const shown = x =>
    c.showWords.some(
      w => l(x[c.hitColumns.show]) === l(w)
    );

  const celebrate = x =>
    c.celebrateWords.some(
      w => l(x[c.hitColumns.celebrate]) === l(w)
    );

  const money = v => {
    const x = parseFloat(
      n(v).replace(/[^0-9.-]/g,"")
    );

    return Number.isFinite(x) ? x : 0;
  };

  const key = x =>
    `${n(x[c.hitColumns.name])}|${n(x[c.hitColumns.number])}`;

  function connection(ok,msg){
    e.dot.className =
      `connection-dot ${ok ? "live" : "error"}`;

    e.text.textContent = msg;
  }

  function restartProgress(){
    e.progress.classList.remove("run");

    void e.progress.offsetWidth;

    e.progress.style.animationDuration =
      `${rotationSeconds}s`;

    e.progress.classList.add("run");
  }

  function showFeatured(animate=true){

    if(!featuredHits.length){
      document.body.classList.add(
        "empty-featured"
      );

      e.name.textContent =
        "Premium hits coming up...";

      e.number.textContent = "";
      e.value.textContent = "";
      e.tier.textContent = "";
      e.counter.textContent = "";

      e.image.removeAttribute("src");

      return;
    }

    document.body.classList.remove(
      "empty-featured"
    );

    featuredIndex = Math.min(
      featuredIndex,
      featuredHits.length - 1
    );

    const x =
      featuredHits[featuredIndex];

    currentFeaturedKey = key(x);

    const apply = () => {

      e.image.src =
        n(x[c.hitColumns.image]);

      e.image.alt =
        n(x[c.hitColumns.name]);

      e.image.onerror = () => {
        e.image.style.opacity = .12;
      };

      e.image.onload = () => {
        e.image.style.opacity = "";
      };

      e.name.textContent =
        n(x[c.hitColumns.name]) ||
        "Premium Hit";

      e.number.textContent =
        n(x[c.hitColumns.number]);

      e.value.textContent =
        n(x[c.hitColumns.value]);

      e.tier.textContent =
        n(x[c.hitColumns.tier]);

      e.counter.textContent =
        `${featuredIndex + 1} OF ${featuredHits.length} HITS LEFT`;

      e.image.classList.remove(
        "changing"
      );

      restartProgress();
    };

    if(animate){
      e.image.classList.add(
        "changing"
      );

      setTimeout(apply,180);
    }else{
      apply();
    }
  }

  function rotateFeatured(){

    if(featuredHits.length <= 1){
      restartProgress();
      return;
    }

    featuredIndex =
      (featuredIndex + 1) %
      featuredHits.length;

    showFeatured(true);
  }

  function render(){

    const previousKey =
      currentFeaturedKey;

    /*
      Only show hits that:
      1. are marked Show on Board
      2. have NOT been sold/pulled/claimed

      Highest-value hits are shown first.
    */
    featuredHits = hits
      .filter(
        x => shown(x) && !sold(x)
      )
      .sort(
        (a,b) =>
          money(b[c.hitColumns.value]) -
          money(a[c.hitColumns.value])
      );

    /*
      Keep the same card on screen
      when the Sheet refreshes,
      unless that card was just sold.
    */
    if(previousKey){

      const stillHere =
        featuredHits.findIndex(
          x => key(x) === previousKey
        );

      if(stillHere >= 0){
        featuredIndex = stillHere;
      }else{
        featuredIndex =
          featuredIndex %
          Math.max(
            featuredHits.length,
            1
          );
      }

    }else{
      featuredIndex = 0;
    }

    if(e.packs){
      e.packs.textContent =
        stats[c.statsKeys.packsRemaining] ||
        "0";
    }

    showFeatured(false);
  }

  function showCelebration(x){

    e.ci.src =
      n(x[c.hitColumns.image]);

    e.cn.textContent =
      n(x[c.hitColumns.name]) ||
      "BIG HIT!";

    if(e.cv){
      e.cv.textContent =
        n(x[c.hitColumns.value]);
    }

    if(e.cw){

      const winnerColumn =
        c.hitColumns.winner;

      const winner =
        winnerColumn
          ? n(x[winnerColumn])
          : "";

      e.cw.textContent =
        winner
          ? `Congratulations ${winner}!`
          : "Congratulations!";
    }

    e.celebration.hidden = false;

    setTimeout(
      () => {
        e.celebration.hidden = true;
      },
      (Number(c.celebrationSeconds) || 6)
        * 1000
    );
  }

  function detect(prev,now){

    if(first){
      return;
    }

    const old =
      new Set(
        prev
          .filter(sold)
          .map(key)
      );

    const fresh =
      now.filter(
        x =>
          sold(x) &&
          celebrate(x) &&
          !old.has(key(x))
      );

    if(fresh.length){
      showCelebration(
        fresh[0]
      );
    }
  }

  async function fetchSheet(gid){

    const url =
      `https://docs.google.com/spreadsheets/d/${c.sheetId}` +
      `/gviz/tq?gid=${encodeURIComponent(gid)}` +
      `&tqx=out:json` +
      `&tq=${encodeURIComponent("select *")}` +
      `&cacheBust=${Date.now()}`;

    const r =
      await fetch(
        url,
        {
          cache:"no-store"
        }
      );

    if(!r.ok){
      throw Error(
        `Google Sheet request failed (${r.status}).`
      );
    }

    const t =
      await r.text();

    const start =
      t.indexOf("{");

    const end =
      t.lastIndexOf("}");

    if(start < 0 || end < 0){
      throw Error(
        "Google Sheet returned unreadable data."
      );
    }

    const p =
      JSON.parse(
        t.slice(
          start,
          end + 1
        )
      );

    const h =
      p.table.cols.map(
        (x,i) =>
          n(x.label) ||
          `Column ${i + 1}`
      );

    return p.table.rows.map(
      row => {

        const o = {};

        h.forEach(
          (k,i) => {

            const cell =
              row.c?.[i];

            o[k] =
              cell?.f ??
              cell?.v ??
              "";
          }
        );

        return o;
      }
    );
  }

  async function refresh(){

    try{

      const prev =
        hits.slice();

      const [hr,sr] =
        await Promise.all([
          fetchSheet(c.hitsGid),
          fetchSheet(c.statsGid)
        ]);

      hits =
        hr.filter(
          x =>
            n(
              x[c.hitColumns.name]
            )
        );

      stats = {};

      sr.forEach(
        x => {

          const values =
            Object.values(x);

          if(
            values.length > 1 &&
            n(values[0])
          ){
            stats[n(values[0])] =
              n(values[1]);
          }
        }
      );

      detect(
        prev,
        hits
      );

      render();

      first = false;

      connection(
        true,
        "Google Sheet live"
      );

      e.updated.textContent =
        `Updated ${new Date().toLocaleTimeString([],{
          hour:"numeric",
          minute:"2-digit",
          second:"2-digit"
        })}`;

    }catch(err){

      console.error(err);

      connection(
        false,
        err.message
      );
    }
  }

  /*
    SHEET REFRESH:
    This now checks the Google Sheet every 2 seconds.
  */
  refresh();

  setInterval(
    refresh,
    Math.max(
      2,
      Number(c.refreshSeconds) || 2
    ) * 1000
  );

  /*
    FEATURED CARD ROTATION:
    Move to a different premium hit every 4 seconds.
  */
  setInterval(
    rotateFeatured,
    rotationSeconds * 1000
  );

})();
