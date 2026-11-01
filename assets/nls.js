(() => {
  const body = document.body;

  // Number every paragraph under its piece: 1a, 1b ... 1z, 1aa.
  const letters = i => { let s = ""; i++; while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(97 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
  document.querySelectorAll(".branch").forEach(br => {
    const n = br.dataset.n, kids = br.querySelector(".kids");
    if (!kids) return;
    [...kids.children].forEach((el, i) => {
      const stmt = document.createElement("div");
      stmt.className = "stmt l2" + (/^H[2-6]$/.test(el.tagName) ? " head" : "");
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = n + letters(i);
      const text = document.createElement("div");
      text.className = "text";
      kids.replaceChild(stmt, el);
      text.appendChild(el);
      stmt.append(num, text);
    });
  });

  // Viewspecs: how deep to look.
  const buttons = [...document.querySelectorAll("[data-level]")];
  const setLevel = lv => {
    body.classList.remove("lv1", "lv2", "lv3");
    body.classList.add("lv" + lv);
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.level === String(lv))));
  };
  buttons.forEach(b => b.addEventListener("click", () => setLevel(+b.dataset.level)));
  addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "1" || e.key === "2" || e.key === "3") setLevel(+e.key);
  });

  // A statement's number opens or closes its branch alone.
  document.querySelectorAll(".branch button.num").forEach(btn => {
    btn.addEventListener("click", () => {
      const br = btn.closest(".branch"), open = !br.classList.contains("open");
      br.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
})();
