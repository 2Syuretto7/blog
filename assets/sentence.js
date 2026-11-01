(() => {
  const posts = window.WRITING || [];
  const $ = id => document.getElementById(id);
  const el = $("sentence"), src = $("source"), hint = $("hint");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Every sentence ever written here, loose. Headings and fragments are left out.
  const all = [];
  for (const p of posts) {
    for (const block of p.x.split(/\n+/)) {
      const b = block.replace(/\s+/g, " ").trim();
      if (!/[.!?]["”’')\]]*$/.test(b)) continue;
      for (const m of b.match(/[^.!?]+[.!?]+["”’')\]]*/g) || []) {
        const s = m.trim();
        if (s.split(" ").length >= 4 && s.length <= 320) all.push({ s, p });
      }
    }
  }
  if (!all.length) return;

  // Link straight to the sentence inside its post; browsers scroll to it and highlight it.
  const enc = t => encodeURIComponent(t).replace(/-/g, "%2D").replace(/,/g, "%2C").replace(/&/g, "%26");
  const fragment = s => {
    const words = s.split(" ");
    if (words.length <= 12) return "#:~:text=" + enc(s);
    return "#:~:text=" + enc(words.slice(0, 5).join(" ")) + "," + enc(words.slice(-4).join(" "));
  };

  // Shuffle so nothing repeats until everything has been seen.
  let deck = [], last = null;
  const draw = () => {
    if (!deck.length) {
      deck = all.slice();
      for (let i = deck.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
      if (deck.length > 1 && deck[deck.length - 1] === last) deck.unshift(deck.pop());
    }
    return (last = deck.pop());
  };

  const fit = () => {
    const maxH = innerHeight * (innerWidth < 640 ? 0.56 : 0.6);
    let size = Math.min(innerWidth * 0.12, innerHeight * 0.22, 190);
    el.style.fontSize = size + "px";
    while ((el.scrollHeight > maxH || el.scrollWidth > el.clientWidth + 1) && size > 22) { size *= 0.94; el.style.fontSize = size + "px"; }
  };

  const show = item => {
    el.textContent = item.s;
    src.innerHTML = "";
    src.append("from ");
    const a = document.createElement("a");
    a.href = item.p.u + fragment(item.s);
    a.textContent = item.p.t;
    src.append(a);
    fit();
  };

  let busy = false;
  const next = () => {
    if (busy) return;
    if (reduce) { show(draw()); return; }
    busy = true;
    document.body.classList.add("turning");
    setTimeout(() => { show(draw()); document.body.classList.remove("turning"); busy = false; }, 220);
  };

  addEventListener("click", e => {
    if (e.target.closest("a")) return;
    hint.classList.add("gone");
    next();
  });
  addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("a")) return;
    if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); hint.classList.add("gone"); next(); }
  });
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(fit, 100); });

  const go = () => show(draw());
  (document.fonts ? document.fonts.load('400 80px "Libre Caslon Display"').then(go, go) : go());
})();
