/**
 * Bootstrap: load JSON, init charts, handle resize.
 */
(async function () {
  const FILES = ["lpi", "endangered", "animals", "penguins"];
  const store = {};

  function getLpi2020(lpi) {
    const pts = (lpi?.global_index || []).filter(d => d.year >= 1970 && d.year <= 2020);
    const last = pts[pts.length - 1];
    return last ? last.value : 0;
  }

  function scatterHeroWhispers() {
    const items = [...document.querySelectorAll(".hero-whispers .whisper")];
    if (!items.length) return;

    const slots = [
      { top: 7,  left: 2,  rot: -6.5, scale: 1.08, op: 0.34 },
      { top: 5,  left: 74, rot: 4.2,  scale: 0.94, op: 0.3 },
      { top: 13, left: 56, rot: -3.1, scale: 0.9,  op: 0.28 },
      { top: 17, left: 86, rot: 2.8,  scale: 0.96, op: 0.32 },
      { top: 22, left: 5,  rot: 5.4,  scale: 1.02, op: 0.31 },
      { top: 19, left: 34, rot: -4.6, scale: 0.88, op: 0.26 },
      { top: 30, left: 80, rot: -2.2, scale: 0.86, op: 0.29 },
      { top: 36, left: 3,  rot: 3.7,  scale: 0.95, op: 0.31 },
      { top: 41, left: 66, rot: 5.1,  scale: 0.9,  op: 0.28 },
      { top: 46, left: 22, rot: -5.8, scale: 1.04, op: 0.27 },
      { top: 53, left: 88, rot: 1.9,  scale: 0.84, op: 0.3 },
      { top: 55, left: 7,  rot: -1.4, scale: 0.92, op: 0.29 },
      { top: 60, left: 48, rot: 4.5,  scale: 0.87, op: 0.24 },
      { top: 65, left: 73, rot: -3.8, scale: 0.93, op: 0.31 },
      { top: 70, left: 12, rot: 2.1,  scale: 0.98, op: 0.3 },
      { top: 76, left: 62, rot: -6.2, scale: 0.86, op: 0.28 },
      { top: 81, left: 2,  rot: 3.3,  scale: 0.91, op: 0.3 },
      { top: 86, left: 40, rot: -2.7, scale: 0.89, op: 0.27 },
      { top: 10, left: 92, rot: 6.1,  scale: 0.82, op: 0.28 },
      { top: 50, left: 32, rot: -4,   scale: 0.84, op: 0.22 },
    ];

    const order = items.map((_, i) => i);
    let seed = 2026;
    for (let i = order.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }

    items.forEach((el, i) => {
      const p = slots[order[i] % slots.length];
      const jitter = Math.sin(i * 2.399) * 2.2;
      const top = Math.min(90, Math.max(4, p.top + jitter * 0.35));
      const left = Math.min(90, Math.max(2, p.left + jitter * 0.6));
      el.style.top = `${top}%`;
      el.style.left = `${left}%`;
      el.style.right = "auto";
      el.style.transform = `rotate(${p.rot + jitter * 0.25}deg)`;
      el.style.opacity = String(p.op);
      el.style.fontSize = `calc(clamp(0.82rem, 1.35vw, 1.08rem) * ${p.scale})`;
      el.style.maxWidth = `${13 + (i % 6) * 2.2}ch`;
      el.style.textAlign = left > 58 ? "right" : "left";
    });
  }

  function animateHeroMetrics(store) {
    const lpiVal = getLpi2020(store.lpi);
    const lpiDisplay = Math.round(lpiVal);
    const lpiDelta = lpiVal ? ((lpiVal - 100) / 100 * 100).toFixed(1) : "0.0";
    const targets = [
      { id: "hero-lpi", val: lpiDisplay },
      { id: "hero-decrease", val: store.lpi?.direction_counts?.decrease || 0, fmt: v => v.toLocaleString() },
      { id: "hero-increase", val: store.lpi?.direction_counts?.increase || 0, fmt: v => v.toLocaleString() },
      { id: "hero-species", val: store.endangered?.total || 0 },
    ];
    const deltaEl = document.getElementById("hero-lpi-delta");
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      targets.forEach(({ id, val, fmt }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const n = Math.round(val * ease);
        el.textContent = fmt ? fmt(n) : String(n);
      });
      if (deltaEl) deltaEl.textContent = `${lpiDelta.startsWith("-") ? "−" : "+"}${Math.abs(parseFloat(lpiDelta)).toFixed(1)}%`;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function showError(msg) {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:auto 1rem 1rem 1rem;background:#7f1d1d;color:#fecaca;padding:1rem 1.25rem;border-radius:12px;font-size:0.9rem;z-index:999;max-width:480px;line-height:1.5;";
    el.innerHTML = `<strong>⚠ 数据未能加载</strong><br>${msg}<br><br>请用本地服务器打开：<br><code style="background:#450a0a;padding:2px 6px;border-radius:4px">cd public && python -m http.server 8080</code><br>然后访问 <code style="background:#450a0a;padding:2px 6px;border-radius:4px">http://localhost:8080</code>`;
    document.body.appendChild(el);
  }

  scatterHeroWhispers();

  try {
    if (typeof d3 === "undefined") throw new Error("D3 库未加载");

    await Promise.all(FILES.map(async name => {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`${name}.json 请求失败 (${res.status})`);
      store[name] = await res.json();
    }));

    ChartController.init(store);
    ContentBuilder.build(store);

    animateHeroMetrics(store);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        scatterHeroWhispers();
        ChartController.redraw();
      }, 250);
    });
  } catch (err) {
    console.error(err);
    showError(err.message);
  }
})();
