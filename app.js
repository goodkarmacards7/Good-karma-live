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
  let first = true;

  let featuredHits = [];
  let featuredIndex = 0;
  let currentFeaturedKey = "";

  /*
    Featured card changes every 4 seconds.
  */
  const rotationSeconds = 4;

  const n = value =>
    String(value ?? "").trim();

  const lower = value =>
    n(value).toLowerCase();

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

  const money = value => {

    const amount =
      parseFloat(
        n(value).replace(/[^0-9.-]/g,"")
      );

    return Number.isFinite(amount)
      ? amount
      : 0;
  };

  const key = card =>
    `${n(card[c.hitColumns.name])}|${n(card[c.hitColumns.number])}`;


  function connection(ok,message){

    e.dot.className =
      `connection-dot ${ok ? "live" : "error"}`;

    e.text.textContent =
      message;
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


    featuredIndex =
      Math.min(
        featuredIndex,
        featuredHits.length - 1
      );


    const card =
      featuredHits[featuredIndex];


    currentFeaturedKey =
      key(card);


    const apply = () => {

      e.image.src =
        n(card[c.hitColumns.image]);

      e.image.alt =
        n(card[c.hitColumns.name]);


      e.image.onerror = () => {
        e.image.style.opacity = .12;
      };


      e.image.onload = () => {
        e.image.style.opacity = "";
      };


      e.name.textContent =
        n(card[c.hitColumns.name]) ||
        "Premium Hit";


      e.number.textContent =
        n(card[c.hitColumns.number]);


      e.value.textContent =
        n(card[c.hitColumns.value]);


      e.tier.textContent =
        n(card[c.hitColumns.tier]);


      e.counter.textContent =
        `${featuredIndex + 1} OF ${featuredHits.length} PREMIUM HITS LEFT`;


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
        180
      );

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


    if(previousKey){

      const stillHere =
        featuredHits.findIndex(
          card =>
            key(card) === previousKey
        );


      if(stillHere >= 0){

        featuredIndex =
          stillHere;

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


    showFeatured(false);
  }


  function showCelebration(card){

    e.ci.src =
      n(card[c.hitColumns.image]);


    e.cn.textContent =
      n(card[c.hitColumns.name]) ||
      "BIG HIT!";


    if(e.cv){

      e.cv.textContent =
        n(card[c.hitColumns.value]);
    }


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
        e.celebration.hidden = true;
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
      row => {

        const item = {};


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


      render();


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


  /*
    Fetch fresh Google Sheet data every 2 seconds.
  */
  refresh();


  setInterval(
    refresh,
    Math.max(
      2,
      Number(c.refreshSeconds) ||
      2
    ) * 1000
  );


  /*
    Rotate featured card every 4 seconds.
  */
  setInterval(
    rotateFeatured,
    rotationSeconds * 1000
  );

})();
