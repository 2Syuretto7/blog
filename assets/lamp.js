(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tx = innerWidth / 2, ty = innerHeight * 0.4, x = tx, y = ty, r = 0, tr = 0, idle;

  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX; ty = e.clientY;
    tr = 230;
    clearTimeout(idle);
    idle = setTimeout(() => { tr = 0; }, 1600);
  }, { passive: true });

  function tick() {
    const k = reduce ? 1 : 0.08;
    x += (tx - x) * k; y += (ty - y) * k; r += (tr - r) * (reduce ? 1 : 0.05);
    root.style.setProperty("--lx", x + 4 * innerWidth / 100 + "px");
    root.style.setProperty("--ly", y + 4 * innerHeight / 100 + "px");
    root.style.setProperty("--lr", r.toFixed(1) + "px");
    requestAnimationFrame(tick);
  }
  tick();

  const ink = document.querySelector(".inkline i");
  if (ink) {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      ink.style.height = (max > 0 ? Math.min(1, scrollY / max) * 100 : 100) + "%";
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }
})();
