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
  let currentKey = null;
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
      w => l(x[c.hitColumns.status]) === l(w)
    );

  const celebrate = x =>
    c.celebrateWords.some(
      w => l(x[c.hitColumns.celebrate]) === l(w)
    );

  const tierMatch = x =>
    allowedTiers.includes(
      l(x[c.hitColumns.tier])
    );

  const money = v => {
    const amount = parseFloat(
      n(v).replace(/[^0-9.-]/g, "")
    );

    return Number.isFinite(amount)
      ? amount
      : 0;
  };

  /*
    Card identity.

    We use the image URL first because every
    featured hit should have its own image.
  */

  const cardKey = x => {
    const image = n(x[c.hitColumns.image]);

    if (image) {
      return image;
    }

    return [
      n(x[c.hitColumns.name]),
      n(x[c.hitColumns.number]),
      n(x[c.hitColumns.tier])
    ].join("|");
  };

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

  /*
    Prevent duplicate cards from appearing
    multiple times in the slideshow.
  */

  function removeDuplicates(list) {
    const seen = new Set();

    return list.filter(card => {
      const k = cardKey(card);

      if (seen.has(k)) {
        return false;
      }

      seen.add(k);

      return true;
    });
  }

  function rebuildFeaturedHits() {

    let list = hits
      .filter(card =>
        tierMatch(card) &&
        !sold(card)
      )
      .sort((a, b) =>
        money(b[c.hitColumns.value]) -
        money(a[c.hitColumns.value])
      );

    featuredHits =
      removeDuplicates(list);

    /*
      If the card currently being displayed
      was just sold, clear the current key.

      The next rotation will immediately find
      a valid card instead of getting stuck.
    */

    if (
      currentKey &&
      !featuredHits.some(
        card => cardKey(card) === currentKey
      )
    ) {
      currentKey = null;

      if (featuredHits.length) {
        displayCard(featuredHits[0], false);
      }
    }
  }

  function displayCard(card, animate = true) {

    if (!card) {
      document.body.classList.add(
        "empty-featured"
      );

      e.name.textContent =
        "Premium hits coming up...";

      e.number.textContent = "";
      e.tier.textContent = "";
      e.counter.textContent = "";

      e.image.removeAttribute("src");

      currentKey = null;

      return;
    }

    document.body.classList.remove(
      "empty-featured"
    );

    currentKey = cardKey(card);

    const index =
      featuredHits.findIndex(
        x => cardKey(x) === currentKey
      );

    const apply = () => {

      e.image.src =
        n(card[c.hitColumns.image]);

      e.image.alt =
        n(card[c.hitColumns.name]);

      e.image.onerror = () => {
        e.image.style.opacity = ".15";
      };

      e.image.onload = () => {
        e.image.style.opacity = "";
      };

      e.name.textContent =
        n(card[c.hitColumns.name]) ||
        "Featured Hit";

      e.number.textContent =
        n(card[c.hitColumns.number]);

      e.tier.textContent =
        n(card[c.hitColumns.tier]);

      e.counter.textContent =
        `${index + 1} OF ${featuredHits.length} HITS`;

      e.image.classList.remove(
        "changing"
      );

      restartProgress();
    };

    if (animate) {

      e.image.classList.add(
        "changing"
      );

      setTimeout(
        apply,
        180
      );

    } else {

      apply();
    }
  }

  /*
    This is now the ONLY function that
    controls slideshow advancement.
  */

  function rotateFeatured() {

    if (!featuredHits.length) {
      displayCard(null);
      return;
    }

    /*
      First card
    */

    if (!currentKey) {
      displayCard(
        featuredHits[0],
        true
      );

      return;
    }

    /*
      Find the ACTUAL currently displayed card,
      instead of relying on a saved number.
    */

    const currentIndex =
      featuredHits.findIndex(
        card =>
          cardKey(card) === currentKey
      );

    let nextIndex;

    if (currentIndex === -1) {
      nextIndex = 0;
    } else {
      nextIndex =
        currentIndex + 1;

      if (
        nextIndex >=
        featuredHits.length
      ) {
        nextIndex = 0;
      }
    }

    displayCard(
      featuredHits[nextIndex],
      true
    );
  }

  function showCelebration(card) {

    e.ci.src =
      n(card[c.hitColumns.image]);

    e.cn.textContent =
      n(card[c.hitColumns.name]);

    const winner =
      n(card[c.hitColumns.winner]);

    e.cw.textContent =
      winner
        ? `Congratulations ${winner}!`
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

  function detectPulled(prev, now) {

    if (firstLoad) {
      return;
    }

    const previouslySold =
      new Set(
        prev
          .filter(sold)
          .map(cardKey)
      );

    const newlySold =
      now.filter(card =>
        sold(card) &&
        celebrate(card) &&
        !previouslySold.has(
          cardKey(card)
        )
      );

    if (newlySold.length) {
      showCelebration(
        newlySold[0]
      );
    }
  }

  async function fetchSheet(gid) {

    const url =
      `https://docs.google.com/spreadsheets/d/${c.sheetId}` +
      `/gviz/tq?gid=${gid}` +
      `&tqx=out:json` +
      `&tq=${encodeURIComponent("select *")}` +
      `&cacheBust=${Date.now()}`;

    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw Error(
        `Google Sheet request failed (${response.status}).`
      );
    }

    const text =
      await response.text();

    const data =
      JSON.parse(
        text.slice(
          text.indexOf("{"),
          text.lastIndexOf("}") + 1
        )
      );

    const headers =
      data.table.cols.map(
        (column, i) =>
          n(column.label) ||
          `Column ${i + 1}`
      );

    return data.table.rows.map(
      row => {

        const object = {};

        headers.forEach(
          (header, i) => {

            const cell =
              row.c?.[i];

            object[header] =
              cell?.f ??
              cell?.v ??
              "";
          }
        );

        return object;
      }
    );
  }

  async function refresh() {

    try {

      const previous =
        hits.slice();

      const rows =
        await fetchSheet(
          c.hitsGid
        );

      hits =
        rows.filter(
          card =>
            n(card[c.hitColumns.name])
        );

      detectPulled(
        previous,
        hits
      );

      /*
        Refreshing the Sheet only rebuilds
        the AVAILABLE CARD LIST.

        It does NOT advance or reset
        the slideshow.
      */

      rebuildFeaturedHits();

      if (firstLoad) {

        firstLoad = false;

        if (featuredHits.length) {

          displayCard(
            featuredHits[0],
            false
          );

        } else {

          displayCard(null);
        }
      }

      connection(
        true,
        "Google Sheet live"
      );

      e.updated.textContent =
        `Updated ${new Date().toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
          }
        )}`;

    } catch (err) {

      console.error(err);

      connection(
        false,
        err.message
      );
    }
  }

  /*
    DATA

    Update inventory every 2 seconds.
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

    Completely separate.
  */

  setInterval(
    rotateFeatured,
    rotationSeconds * 1000
  );

})();
