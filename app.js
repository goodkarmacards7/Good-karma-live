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
  let featuredHits = [];
  let featuredIndex = 0;
  let firstLoad = true;

  const rotationSeconds = 4;

  const allowedTiers = [
    "top chase",
    "chase",
    "premium"
  ];

  const n = v => String(v ?? "").trim();
  const l = v => n(v).toLowerCase();

  const sold = x =>
    c.soldWords.some(
      w => l(x[c.hitColumns.status]) === w
    );

  const celebrate = x =>
    c.celebrateWords.some(
      w => l(x[c.hitColumns.celebrate]) === w
    );

  const tierMatch = x =>
    allowedTiers.includes(
      l(x[c.hitColumns.tier])
    );

  const money = v => {
    const x = parseFloat(
      n(v).replace(/[^0-9.-]/g, "")
    );

    return Number.isFinite(x) ? x : 0;
  };

  const key = x =>
    [
      n(x[c.hitColumns.name]),
      n(x[c.hitColumns.number]),
      n(x[c.hitColumns.image]),
      n(x[c.hitColumns.tier])
    ].join("|");

  function connection(ok, msg) {
    e.dot.className =
      `connection-dot ${ok ? "live" : "error"}`;

    e.text.textContent = msg;
  }

  function restartProgress() {
    e.progress.classList.remove("run");

    void e.progress.offsetWidth;

    e.progress.style.animationDuration =
      `${rotationSeconds}s`;

    e.progress.classList.add("run");
  }

  function displayCurrentHit(animate = true) {

    if (!featuredHits.length) {

      document.body.classList.add(
        "empty-featured"
      );

      e.name.textContent =
        "Premium hits coming up...";

      e.number.textContent = "";
      e.tier.textContent = "";
      e.counter.textContent = "";

      e.image.removeAttribute("src");

      return;
    }

    document.body.classList.remove(
      "empty-featured"
    );

    if (featuredIndex >= featuredHits.length) {
      featuredIndex = 0;
    }

    const x = featuredHits[featuredIndex];

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
        "Featured Hit";

      e.number.textContent =
        n(x[c.hitColumns.number]);

      e.tier.textContent =
        n(x[c.hitColumns.tier]);

      e.counter.textContent =
        `${featuredIndex + 1} OF ${featuredHits.length} HITS LEFT`;

      e.image.classList.remove(
        "changing"
      );

      restartProgress();
    };

    if (animate) {

      e.image.classList.add(
        "changing"
      );

      setTimeout(apply, 180);

    } else {

      apply();
    }
  }

  function rotateFeatured() {

    if (!featuredHits.length) {
      return;
    }

    if (featuredHits.length === 1) {
      restartProgress();
      return;
    }

    featuredIndex++;

    if (featuredIndex >= featuredHits.length) {
      featuredIndex = 0;
    }

    displayCurrentHit(true);
  }

  function rebuildFeaturedHits() {

    const current =
      featuredHits[featuredIndex];

    const currentKey =
      current ? key(current) : null;

    const newList = hits

      .filter(x =>
        tierMatch(x) &&
        !sold(x)
      )

      .sort((a, b) =>
        money(b[c.hitColumns.value]) -
        money(a[c.hitColumns.value])
      );

    featuredHits = newList;

    if (!featuredHits.length) {

      featuredIndex = 0;

      displayCurrentHit(false);

      return;
    }

    /*
      If the card currently being displayed
      still exists, leave it on screen.
    */

    if (currentKey) {

      const newIndex =
        featuredHits.findIndex(
          x => key(x) === currentKey
        );

      if (newIndex >= 0) {

        featuredIndex = newIndex;

        return;
      }
    }

    /*
      Current card disappeared because
      it was sold/pulled.
      Immediately move to the next card.
    */

    if (featuredIndex >= featuredHits.length) {
      featuredIndex = 0;
    }

    displayCurrentHit(false);
  }

  function showCelebration(x) {

    e.ci.src =
      n(x[c.hitColumns.image]);

    e.cn.textContent =
      n(x[c.hitColumns.name]);

    e.cw.textContent =
      n(x[c.hitColumns.winner])
        ? `Congratulations ${n(x[c.hitColumns.winner])}!`
        : "Congratulations!";

    e.celebration.hidden = false;

    setTimeout(
      () => {
        e.celebration.hidden = true;
      },
      (Number(c.celebrationSeconds) || 6)
        * 1000
    );
  }

  function detect(prev, now) {

    if (firstLoad) {
      return;
    }

    const old = new Set(
      prev
        .filter(sold)
        .map(key)
    );

    const fresh = now.filter(
      x =>
        sold(x) &&
        celebrate(x) &&
        !old.has(key(x))
    );

    if (fresh.length) {
      showCelebration(fresh[0]);
    }
  }

  async function fetchSheet(gid) {

    const url =
      `https://docs.google.com/spreadsheets/d/${c.sheetId}` +
      `/gviz/tq?gid=${gid}` +
      `&tqx=out:json` +
      `&tq=${encodeURIComponent("select *")}` +
      `&cacheBust=${Date.now()}`;

    const r = await fetch(
      url,
      { cache: "no-store" }
    );

    if (!r.ok) {

      throw Error(
        `Google Sheet request failed (${r.status}).`
      );
    }

    const t = await r.text();

    const p = JSON.parse(
      t.slice(
        t.indexOf("{"),
        t.lastIndexOf("}") + 1
      )
    );

    const headers =
      p.table.cols.map(
        (x, i) =>
          n(x.label) ||
          `Column ${i + 1}`
      );

    return p.table.rows.map(row => {

      const o = {};

      headers.forEach((k, i) => {

        const cell =
          row.c?.[i];

        o[k] =
          cell?.f ??
          cell?.v ??
          "";
      });

      return o;
    });
  }

  async function refresh() {

    try {

      const previousHits =
        hits.slice();

      const rows =
        await fetchSheet(
          c.hitsGid
        );

      hits = rows.filter(
        x =>
          n(x[c.hitColumns.name])
      );

      detect(
        previousHits,
        hits
      );

      rebuildFeaturedHits();

      if (firstLoad) {

        featuredIndex = 0;

        displayCurrentHit(false);

        firstLoad = false;
      }

      connection(
        true,
        "Google Sheet live"
      );

      e.updated.textContent =
        `Updated ${new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit"
        })}`;

    } catch (err) {

      console.error(err);

      connection(
        false,
        err.message
      );
    }
  }

  /*
    SHEET REFRESH

    Checks admin changes every 2 seconds.
    Does NOT control the slideshow.
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
    SLIDESHOW

    Completely independent from
    Google Sheet refreshing.
  */

  setInterval(
    rotateFeatured,
    rotationSeconds * 1000
  );

})();
