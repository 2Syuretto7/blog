(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DAY = 864e5;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const key = url => "erosion:" + url;

  // How much of a text is gone: a little from the start, more for every day since you last read it to the end.
  function level(url, born) {
    const last = +store.get(key(url)) || 0;
    const bornAt = Date.parse(born) || Date.now();
    const readSince = last > bornAt;
    const days = Math.max(0, (Date.now() - (readSince ? last : bornAt)) / DAY);
    return Math.min(0.86, (readSince ? 0 : 0.16) + (days / 60) * 0.55);
  }

  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // Split text into letters, each with a fixed fragility. The same letters always go first.
  function wrap(el, seed) {
    const r = rng(hash(seed));
    const chars = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest("pre, code, script, style, .c") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of n.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        const w = document.createElement("span");
        w.className = "w";
        for (const ch of part) {
          const s = document.createElement("span");
          s.className = "c";
          s.textContent = ch;
          const v = r();
          s.style.setProperty("--d", (v * 0.9).toFixed(2) + "s");
          w.appendChild(s);
          chars.push({ s, v });
        }
        frag.appendChild(w);
      }
      n.parentNode.replaceChild(frag, n);
    }
    return chars;
  }

  const erode = (chars, E) => { for (const c of chars) c.s.classList.toggle("gone", c.v < E); };

  function heal(chars, done) {
    const lost = chars.filter(c => c.s.classList.contains("gone"));
    for (const c of lost) { c.s.classList.add("healing"); c.s.classList.remove("gone"); }
    const t = reduce ? 0 : 2400;
    setTimeout(() => { for (const c of lost) c.s.classList.remove("healing"); }, t);
    if (done) done();
  }

  const pct = (chars) => chars.length ? Math.round(100 * chars.filter(c => c.s.classList.contains("gone")).length / chars.length) : 0;
  const lostText = p => p === 0 ? "nothing forgotten" : `${p}% forgotten`;

  // Home: every title at its own stage of forgetting.
  document.querySelectorAll(".entry").forEach(li => {
    const t = li.querySelector(".t");
    const chars = wrap(t, li.dataset.url);
    erode(chars, level(li.dataset.url, li.dataset.born));
    li.querySelector(".lost").textContent = lostText(pct(chars));
  });

  // Home: the masthead forgets itself whenever you stop moving, and comes back when you return.
  const idleEls = [...document.querySelectorAll(".idle")];
  if (idleEls.length) {
    const all = idleEls.flatMap((el, i) => wrap(el, "idle" + i)).sort((a, b) => a.v - b.v);
    let gone = 0, idleTimer, tickTimer;
    const forgetOne = () => {
      if (gone < all.length * 0.82) { all[gone++].s.classList.add("gone"); tickTimer = setTimeout(forgetOne, 160 + Math.random() * 300); }
    };
    const wake = () => {
      clearTimeout(idleTimer); clearTimeout(tickTimer);
      if (gone) { heal(all.slice(0, gone)); gone = 0; }
      idleTimer = setTimeout(forgetOne, 2600);
    };
    let last = 0;
    const throttled = () => { const now = performance.now(); if (now - last > 120) { last = now; wake(); } };
    ["pointermove", "pointerdown", "scroll", "keydown", "touchstart", "wheel"].forEach(ev => addEventListener(ev, throttled, { passive: true }));
    if (!reduce) wake();
  }

  // A post: arrives worn; each passage comes back while you read it.
  const post = document.querySelector(".post");
  if (post) {
    const url = post.dataset.url;
    const E = level(url, post.dataset.born);
    const lostEl = post.querySelector(".lost");
    const coda = post.querySelector(".coda");
    const blocks = [post.querySelector(".post-title"), ...post.querySelectorAll(".prose > *:not(pre):not(hr):not(img):not(figure)")].filter(Boolean);
    const units = blocks.map((el, i) => ({ el, chars: wrap(el, url + "#" + i), healed: false, timer: 0 }));
    const every = units.flatMap(u => u.chars);
    units.forEach(u => erode(u.chars, E));
    const update = () => { lostEl.textContent = lostText(pct(every)); };
    update();

    const finish = () => {
      if (units.some(u => !u.healed)) return;
      store.set(key(url), String(Date.now()));
      coda.hidden = false;
      requestAnimationFrame(() => coda.classList.add("shown"));
    };
    const restore = u => {
      if (u.healed) return;
      u.healed = true;
      heal(u.chars);
      setTimeout(update, reduce ? 0 : 900);
      finish();
    };

    const band = new IntersectionObserver(entries => {
      for (const e of entries) {
        const u = units.find(x => x.el === e.target);
        if (!u || u.healed) continue;
        if (e.isIntersecting) {
          const dwell = reduce ? 0 : Math.min(1800, 450 + u.chars.length * 2.2);
          u.timer = setTimeout(() => restore(u), dwell);
        } else clearTimeout(u.timer);
      }
    }, { rootMargin: "-28% 0px -28% 0px", threshold: 0 });
    units.forEach(u => band.observe(u.el));

    // Short final passages may never reach the middle of the screen; reaching the bottom counts as reading them.
    addEventListener("scroll", () => {
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
        units.forEach(u => {
          const r = u.el.getBoundingClientRect();
          if (!u.healed && r.top < innerHeight && r.bottom > 0 && !u.timer2) u.timer2 = setTimeout(() => restore(u), reduce ? 0 : 900);
        });
      }
    }, { passive: true });
  }
})();
