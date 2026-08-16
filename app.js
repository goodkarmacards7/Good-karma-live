(()=>{
  "use strict";

  const c = window.GOOD_KARMA_CONFIG;
  const $ = id => document.getElementById(id);

  const e = {
    image: $("featuredImage"),
    name: $("featuredName"),
    number: $("featuredNumber"),
    tier: $("featuredTier"),
    counter: $("hitCounter"),
    progress: $("rotationProgress"),

    dot: $("connectionDot"),
    text: $("connectionText"),
    updated: $("lastUpdated"),

    celebration: $("celebration"),
    ci: $("celebrationImage"),
    cn: $("celebrationName"),
    cw: $("celebrationWinner")
  };

  let hits = [];
  let first = true;

  let featuredHits = [];
  let featuredIndex = 0;
  let currentFeaturedKey = "";

  const rotationSeconds = 4;

  const n = v =>
    String(v ?? "").trim();

  const lower = v =>
    n(v).toLowerCase();

  const sold = card =>
    c.soldWords.some(
      word =>
        lower(card[c.hitColumns.status]) ===
        lower(word)
    );

  const shown = card =>
    c.showWords.some(
      word =>
        lower(card[c.hitColumns.show]) ===
        lower(word)
    );

  const celebrate = card =>
    c.celebrateWords.some(
      word =>
        lower(card[c.hitColumns.celebrate]) ===
        lower(word)
    );

  const money = v => {
    const amount =
      parseFloat(
        n(v).replace(/[^0-9.-]/g,"")
      );

    return Number.isFinite(amount)
      ? amount
      : 0;
  };

  const key = card =>
    card.__gkRowId ||
    [
      n(card[c.hitColumns.name]),
      n(card[c.hitColumns.number]),
      n(card[c.hitColumns.image]),
      n(card[c.hitColumns.value])
    ].join("|");

  function connection(ok,message){
    e.dot.className =
      `connection-dot ${ok ? "live" : "error"}`;

    e.text.textContent =
      message;
  }

  function restartProgress(){
    if(!e.progress){
      return;
    }

    e.progress.classList.remove("run");
    void e.progress.offsetWidth;

    e.progress.style.animationDuration =
      `${rotationSeconds}s`;

    e.progress.classList.add("run");
  }

  function displayFeatured(card,animate=true){

    if(!card){

      document.body.classList.add(
        "empty-featured"
      );

      e.name.textContent =
        "Premium hits coming up...";

      e.number.textContent = "";
      e.tier.textContent = "";
      e.counter.textContent = "";

      e.image.removeAttribute("src");

      currentFeaturedKey = "";

      restartProgress();

      return;
    }

    document.body.classList.remove(
      "empty-featured"
    );

    currentFeaturedKey =
      key(card);

    const apply = () => {

      const imageUrl =
        n(card[c.hitColumns.image]);

      if(imageUrl){
        e.image.src = imageUrl;
      }else{
        e.image.removeAttribute("src");
      }

      e.image.alt =
        n(card[c.hitColumns.name]);

      e.image.onerror = () => {
        e.image.style.opacity = .12;
      };

      e.image.onload = () => {
        e.image.style.opacity = "";

        const ratio =
          e.image.naturalWidth /
          Math.max(e.image.naturalHeight, 1);

        e.image.classList.toggle(
          "is-slab",
          ratio < 0.64
        );

        e.image.classList.toggle(
          "is-raw",
          ratio >= 0.64
        );
      };

      e.name.textContent =
        n(card[c.hitColumns.name]) ||
        "Premium Hit";

      e.number.textContent =
        n(card[c.hitColumns.number]);

      e.tier.textContent =
        n(card[c.hitColumns.tier]);

      e.counter.textContent =
        `${featuredIndex + 1} OF ${featuredHits.length} HITS`;

      e.image.classList.remove(
        "changing"
      );

      restartProgress();
    };

    if(animate){

      e.image.classList.add(
        "changing"
      );

      setTimeout(
        apply,
        160
      );

    }else{
      apply();
    }
  }

  function rotateFeatured(){

    if(featuredHits.length === 0){

      displayFeatured(
        null,
        false
      );

      return;
    }

    if(featuredHits.length === 1){

      featuredIndex = 0;

      displayFeatured(
        featuredHits[0],
        false
      );

      return;
    }

    featuredIndex =
      (featuredIndex + 1) %
      featuredHits.length;

    displayFeatured(
      featuredHits[featuredIndex],
      true
    );
  }

  function updateFeaturedList(){

    const oldKey =
      currentFeaturedKey;

    featuredHits =
      hits
        .filter(
          card =>
            shown(card) &&
            !sold(card)
        )
        .sort(
          (a,b) =>
            money(b[c.hitColumns.value]) -
            money(a[c.hitColumns.value])
        );

    if(featuredHits.length === 0){

      featuredIndex = 0;

      displayFeatured(
        null,
        false
      );

      return;
    }

    if(oldKey){

      const existingIndex =
        featuredHits.findIndex(
          card =>
            key(card) === oldKey
        );

      if(existingIndex >= 0){

        featuredIndex =
          existingIndex;

        e.counter.textContent =
          `${featuredIndex + 1} OF ${featuredHits.length} HITS`;

        return;
      }
    }

    if(featuredIndex >= featuredHits.length){
      featuredIndex = 0;
    }

    displayFeatured(
      featuredHits[featuredIndex],
      false
    );
  }

  function showCelebration(card){

    e.ci.src =
      n(card[c.hitColumns.image]);

    e.cn.textContent =
      n(card[c.hitColumns.name]) ||
      "BIG HIT!";

    if(e.cw){

      const winnerColumn =
        c.hitColumns.winner;

      const winner =
        winnerColumn
          ? n(card[winnerColumn])
          : "";

      e.cw.textContent =
        winner
          ? `Congratulations ${winner}!`
          : "Congratulations!";
    }

    e.celebration.hidden =
      false;

    setTimeout(
      () => {
        e.celebration.hidden =
          true;
      },
      (
        Number(c.celebrationSeconds) ||
        6
      ) * 1000
    );
  }

  function detect(previous,current){

    if(first){
      return;
    }

    const previouslySold =
      new Set(
        previous
          .filter(sold)
          .map(key)
      );

    const newCelebrations =
      current.filter(
        card =>
          sold(card) &&
          celebrate(card) &&
          !previouslySold.has(
            key(card)
          )
      );

    if(newCelebrations.length){

      showCelebration(
        newCelebrations[0]
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

    const response =
      await fetch(
        url,
        {
          cache:"no-store"
        }
      );

    if(!response.ok){

      throw Error(
        `Google Sheet request failed (${response.status}).`
      );
    }

    const text =
      await response.text();

    const start =
      text.indexOf("{");

    const end =
      text.lastIndexOf("}");

    if(start < 0 || end < 0){

      throw Error(
        "Google Sheet returned unreadable data."
      );
    }

    const payload =
      JSON.parse(
        text.slice(
          start,
          end + 1
        )
      );

    const headers =
      payload.table.cols.map(
        (column,index) =>
          n(column.label) ||
          `Column ${index + 1}`
      );

    return payload.table.rows.map(
      (row,rowIndex) => {

        const item = {
          __gkRowId:
            `${gid}:${rowIndex}`
        };

        headers.forEach(
          (header,index) => {

            const cell =
              row.c?.[index];

            item[header] =
              cell?.f ??
              cell?.v ??
              "";
          }
        );

        return item;
      }
    );
  }

  async function refresh(){

    try{

      const previous =
        hits.slice();

      const rows =
        await fetchSheet(
          c.hitsGid
        );

      hits =
        rows.filter(
          card =>
            n(
              card[c.hitColumns.name]
            )
        );

      detect(
        previous,
        hits
      );

      updateFeaturedList();

      first =
        false;

      connection(
        true,
        "Google Sheet live"
      );

      e.updated.textContent =
        `Updated ${new Date().toLocaleTimeString(
          [],
          {
            hour:"numeric",
            minute:"2-digit",
            second:"2-digit"
          }
        )}`;

    }catch(error){

      console.error(
        error
      );

      connection(
        false,
        error.message
      );
    }
  }

  refresh();

  setInterval(
    refresh,
    Math.max(
      2,
      Number(c.refreshSeconds) ||
      2
    ) * 1000
  );

  setInterval(
    rotateFeatured,
    rotationSeconds * 1000
  );

})();
