(() => {
  const DAY = 864e5, RATE = 18, START = 12, FLOOR = 10935, PX = 0.9;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = id => document.getElementById(id);
  const root = document.documentElement;

  // Every post sinks 18 metres a day from the moment it is written.
  const depthOf = born => Math.min(FLOOR - 60, START + Math.max(0, (Date.now() - Date.parse(born)) / DAY) * RATE);
  const fmt = m => Math.round(m).toLocaleString("en-US");
  const ago = born => {
    const d = Math.floor((Date.now() - Date.parse(born)) / DAY);
    return d < 1 ? "sinking since today" : d === 1 ? "sinking for a day" : `sinking for ${d.toLocaleString("en-US")} days`;
  };

  // The real ocean, roughly: colour, zone, pressure, sunlight.
  const STOPS = [[-1, [233, 243, 241]], [0, [150, 214, 224]], [60, [64, 158, 188]], [200, [24, 88, 120]], [600, [12, 44, 78]], [1000, [8, 24, 48]], [4000, [4, 9, 20]], [FLOOR, [1, 2, 6]]];
  const colourAt = d => {
    if (d <= STOPS[0][0]) return STOPS[0][1];
    for (let i = 0; i < STOPS.length - 1; i++) {
      const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1];
      if (d <= b) { const t = (d - a) / (b - a); return ca.map((v, k) => Math.round(v + (cb[k] - v) * t)); }
    }
    return STOPS[STOPS.length - 1][1];
  };
  const ZONES = [[0, "Sunlight zone"], [200, "Twilight zone"], [1000, "Midnight zone"], [4000, "Abyssal zone"], [6000, "Hadal zone"]];
  const zoneAt = d => d < 0 ? "Surface" : ZONES.filter(z => d >= z[0]).pop()[1];
  const lightAt = d => {
    if (d < 0) return "sunlight 100%";
    if (d >= 1000) return "no sunlight";
    const p = 100 * Math.exp(-d / 43);
    return "sunlight " + (p >= 1 ? Math.round(p) + "%" : p >= 0.001 ? p.toPrecision(1) + "%" : "a trace");
  };
  const paint = d => {
    const c = colourAt(d);
    const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    root.style.setProperty("--water", `rgb(${c})`);
    root.classList.toggle("dark", lum < 0.5);
    $("g-zone").textContent = zoneAt(d);
    $("g-depth").textContent = fmt(Math.max(0, d));
    $("g-pressure").textContent = `${fmt(1 + Math.max(0, d) / 10)} atm`;
    $("g-light").textContent = lightAt(d);
    current = d;
  };
  let current = -1;

  // Marine snow: the slow fall of everything from above. And, in the dark, light where something is touched.
  const cv = $("snow"), ctx = cv.getContext("2d");
  let W, H, flakes = [], sparks = [], lastY = scrollY;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = Array.from({ length: Math.round(W * H / 5200) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, v: Math.random() * 0.25 + 0.05, w: Math.random() * 6.28 }));
  };
  const loop = () => {
    ctx.clearRect(0, 0, W, H);
    const dy = scrollY - lastY; lastY = scrollY;
    const vis = Math.min(1, Math.max(0, (current - 40) / 260));
    if (vis > 0) {
      ctx.fillStyle = `rgba(214, 236, 240, ${0.55 * vis})`;
      for (const f of flakes) {
        f.y += f.v - dy * 0.35; f.w += 0.01; f.x += Math.sin(f.w) * 0.12;
        if (f.y > H) f.y -= H; if (f.y < 0) f.y += H;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.life -= 0.018; s.x += s.vx; s.y += s.vy - dy;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
      g.addColorStop(0, `rgba(127, 245, 214, ${0.9 * s.life})`); g.addColorStop(1, "rgba(127, 245, 214, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(loop);
  };
  let lastSpark = 0;
  addEventListener("pointermove", e => {
    if (current < 400 || reduce) return;
    const now = performance.now(); if (now - lastSpark < 30) return; lastSpark = now;
    for (let k = 0; k < 2; k++) sparks.push({ x: e.clientX + (Math.random() - 0.5) * 18, y: e.clientY + (Math.random() - 0.5) * 18, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 2 + 1, life: 1 });
  }, { passive: true });
  addEventListener("resize", size);
  size();
  if (!reduce) loop();

  // Home: the shaft. Posts sit at their real depth; the gauge follows you down.
  const shaft = $("shaft");
  if (shaft) {
    shaft.style.height = `${FLOOR * PX + innerHeight * 0.7}px`;
    let prevBottom = -Infinity;
    shaft.querySelectorAll(".wreck").forEach(li => {
      const d = depthOf(li.dataset.born);
      li.querySelector(".at").textContent = `${fmt(d)} m, ${ago(li.dataset.born)}`;
      const y = Math.max(d * PX, prevBottom + 64);
      li.style.top = `${y}px`;
      prevBottom = y + li.offsetHeight;
      const c = colourAt(d), lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
      li.classList.toggle("glow", lum < 0.5);
    });
    $("floor").style.top = `${FLOOR * PX}px`;
    const onScroll = () => {
      const top = shaft.getBoundingClientRect().top + scrollY;
      paint(Math.min(FLOOR, (scrollY + innerHeight * 0.5 - top) / PX));
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();
  }

  // A post: you are taken down to where it has sunk.
  const post = document.querySelector(".post");
  if (post) {
    const d = depthOf(post.dataset.born);
    post.querySelector(".at").textContent = `${fmt(d)} m, ${ago(post.dataset.born)}`;
    if (reduce) { paint(d); post.classList.add("arrived"); }
    else {
      const t0 = performance.now(), T = 1300 + Math.min(1700, d / 4);
      const fall = now => {
        const t = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - t, 3);
        paint(-1 + (d + 1) * e);
        if (t < 1) requestAnimationFrame(fall); else post.classList.add("arrived");
      };
      paint(-1);
      requestAnimationFrame(fall);
    }
  }
})();
