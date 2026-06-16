/**
 * Populate rich editorial content from dataset JSON.
 */
const ContentBuilder = (() => {
  const REGION_ZH = {
    Africa: "非洲", Asia: "亚洲", Europe: "欧洲",
    "North America": "北美", Oceania: "大洋洲", Antarctic: "南极",
    "International Waters": "国际水域",
  };

  const STATUS_ZH = {
    "Critically Endangered": "极危",
    Endangered: "濒危",
    Vulnerable: "易危",
    "Near Threatened": "近危",
    "Least Concern": "无危",
  };

  const SP_ZH = { Adelie: "阿德利", Chinstrap: "帽带", Gentoo: "巴布亚" };

  const CLASS_ZH = {
    Amphibia: "两栖类", Elasmobranchii: "板鳃类", Aves: "鸟类",
    Actinopteri: "辐鳍鱼类", Mammalia: "哺乳类", Reptilia: "爬行类",
    Chondrichthyes: "软骨鱼类", Coelacanthi: "腔棘类",
  };

  function el(id) { return document.getElementById(id); }

  function renderList(id, items) {
    const node = el(id);
    if (!node) return;
    node.innerHTML = items.map(it => `
      <li>
        <span class="name">${it.name}${it.sub ? `<em>${it.sub}</em>` : ""}</span>
        <span class="val ${it.cls || ""}">${it.val}</span>
      </li>`).join("");
  }

  function renderFacts(id, items) {
    const node = el(id);
    if (!node) return;
    node.innerHTML = items.map(it => `
      <div class="fact-cell">
        <div class="val ${it.cls || ""}">${it.val}</div>
        <div class="lbl">${it.lbl}</div>
      </div>`).join("");
  }

  function renderSpecies(id, species) {
    const node = el(id);
    if (!node) return;
    node.innerHTML = species.slice(0, 4).map(s => {
      const name = speciesNameZh(s);
      return `
        <div class="species-item">
          <div class="num">${popZh(s.population?.raw)}</div>
          <div class="sci">${name}</div>
          <div class="loc">${s.location || ""}</div>
        </div>`;
    }).join("");
  }

  function popZh(raw) {
    if (!raw) return "?";
    return raw
      .replace(/sub-populations?/gi, "个亚种群")
      .replace(/individuals?/gi, "个个体")
      .replace(/mature individuals?/gi, "株成体")
      .replace(/less than/gi, "少于")
      .replace(/</g, "少于 ");
  }

  function fillHero() {
    const sub = document.getElementById("hero-subtitle");
    if (sub) sub.textContent = "从1970到今天，一部正在归零的种群档案";
  }

  function build(store) {
    fillHero();

    const lpi = store.lpi || {};
    const end = store.endangered || {};
    const ani = store.animals || {};
    const pen = store.penguins || {};

    const pts = (lpi.global_index || []).filter(d => d.year >= 1970 && d.year <= 2020);
    const v20 = pts.find(d => d.year === 2020)?.value ?? pts.at(-1)?.value ?? 0;
    const chg = ((v20 - 100) / 100 * 100).toFixed(0);
    const dir = lpi.direction_counts || {};

    el("display-act1") && (el("display-act1").innerHTML = `${v20.toFixed(0)}<span class="unit">指数</span>`);
    el("label-act1") && (el("label-act1").textContent =
      `1970→2020 · 全球指数跌至 ${v20.toFixed(0)} · ${chg}%`);

    renderFacts("facts-act1", [
      { val: (lpi.total_populations || 0).toLocaleString(), lbl: "条监测记录<br>在说话" },
      { val: (dir.decrease || 0).toLocaleString(), lbl: "条记录向下<br>沉默坠落", cls: "neg" },
      { val: (dir.increase || 0).toLocaleString(), lbl: "条记录向上<br>逆势生长", cls: "pos" },
    ]);

    const topClass = (lpi.class_summary || [])
      .filter(c => c.total >= 50)
      .sort((a, b) => b.decrease_pct - a.decrease_pct)
      .slice(0, 5);

    renderList("list-act1", topClass.map(c => ({
      name: CLASS_ZH[c.class] || c.class,
      sub: `监测种群 ${c.total} 组`,
      val: `−${c.decrease_pct}%`,
      cls: "warn",
    })));

    el("stat-global-change").textContent =
      `一句话概括这五十年：指数从 100 跌到 ${v20.toFixed(0)}，跌幅 ${chg}%。`;

    const pq1 = document.getElementById("quote-act1");
    if (pq1 && dir.decrease) {
      pq1.innerHTML = `${(lpi.total_populations || 0).toLocaleString()} 条记录里，${dir.decrease.toLocaleString()} 条在下降，${(dir.increase || 0).toLocaleString()} 条在上升——沉默的，永远是那些来不及被听见的坠落。<cite>地球生命力指数 · 趋势方向统计</cite>`;
    }

    const regions = (lpi.region_change || []).slice().sort((a, b) => a.change_pct - b.change_pct);
    const worst = regions[0];
    const best = regions[regions.length - 1];

    el("display-act2") && (el("display-act2").innerHTML =
      `${worst?.change_pct}<span class="unit">%</span>`);
    el("label-act2") && (el("label-act2").textContent =
      `${REGION_ZH[worst?.region] || worst?.region} · 五十年跌去 ${Math.abs(worst?.change_pct || 0)}%`);

    renderFacts("facts-act2", [
      { val: regions.filter(r => r.change_pct < 0).length, lbl: "片大陆在坠落<br>地理裂痕", cls: "neg" },
      { val: `+${best?.change_pct}%`, lbl: `${REGION_ZH[best?.region] || best?.region}<br>唯一逆势`, cls: "pos" },
      { val: regions.length, lbl: "个区域被监测<br>同球不同命" },
    ]);

    renderList("list-act2", regions.map(r => ({
      name: REGION_ZH[r.region] || r.region,
      sub: `1970：${r.value_1970.toFixed(0)} → 2020：${r.value_2020.toFixed(0)}`,
      val: `${r.change_pct > 0 ? "+" : ""}${r.change_pct}%`,
      cls: r.change_pct < -30 ? "warn" : r.change_pct > 0 ? "good" : "",
    })));

    el("stat-worst-region").textContent =
      `全球均值掩盖了地理伤痕：${REGION_ZH[worst?.region]} ${worst?.change_pct}%，接近「消失」`;

    const lowest = end.lowest_population || [];
    const threats = aggregateThreats(end.threat_counts || []).slice(0, 5);
    const rarest = lowest[0];

    el("display-act3") && (el("display-act3").innerHTML =
      `${rarest?.population?.value ?? 2}<span class="unit">余</span>`);
    el("label-act3") && (el("label-act3").textContent =
      `最少种群 · ${speciesNameZh(rarest)}`);

    renderFacts("facts-act3", [
      { val: end.total || 90, lbl: "份极危档案<br>等待被读完", cls: "neg" },
      { val: threats[0]?.count || "—", lbl: `首要威胁<br>${threats[0]?.threat || "—"}` },
      { val: lowest.filter(s => (s.population?.value || 99) <= 10).length, lbl: "个物种 ≤10<br>倒数计时", cls: "neg" },
    ]);

    renderSpecies("species-act3", lowest);
    renderList("list-act3", threats.map(t => ({
      name: t.threat,
      val: `${t.count} 种`,
      cls: "warn",
    })));

    if (rarest) {
      el("stat-lowest-pop").textContent =
        `档案里最刺眼的数字：${speciesNameZh(rarest)}，仅剩 ${popZh(rarest.population?.raw)}`;
    }

    const status = (ani.status_distribution || [])
      .filter(d => !["Not Evaluated", "Not Applicable", "Extinct"].includes(d.status));
    const threatened = status
      .filter(d => ["Critically Endangered", "Endangered", "Vulnerable"].includes(d.status))
      .reduce((s, d) => s + d.count, 0);

    el("display-act4") && (el("display-act4").innerHTML =
      `${threatened}<span class="unit">种</span>`);
    el("label-act4") && (el("label-act4").textContent =
      `踩在红线上的物种 · 极危+濒危+易危`);

    renderFacts("facts-act4", [
      { val: ani.total || 205, lbl: "份动物档案<br>构成光谱" },
      { val: status.find(s => s.status === "Critically Endangered")?.count || 19, lbl: "种极危<br>临界刻度", cls: "neg" },
      { val: status.find(s => s.status === "Least Concern")?.count || 68, lbl: "种无危<br>尚有余地", cls: "pos" },
    ]);

    renderList("list-act4", status
      .filter(d => d.count > 0 && STATUS_ZH[d.status])
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        name: STATUS_ZH[d.status],
        val: `${d.count} 种`,
        cls: ["Critically Endangered", "Endangered"].includes(d.status) ? "warn" : "",
      })));

    el("stat-endangered-count").textContent =
      `${threatened} 个名字，已站在极危 / 濒危 / 易危的红线之上`;

    const health = pen.health_distribution || [];
    const ow = pen.overweight_rate || [];
    const topOw = ow.reduce((a, b) => a.overweight_pct > b.overweight_pct ? a : b, ow[0] || {});

    el("display-act5") && (el("display-act5").innerHTML =
      `${(pen.total || 0).toLocaleString()}<span class="unit">只</span>`);
    el("label-act5") && (el("label-act5").textContent =
      `帕尔默群岛 · 三只企鹅物种的身体档案`);

    renderFacts("facts-act5", [
      { val: `${topOw?.overweight_pct || 0}%`, lbl: `${SP_ZH[topOw?.species] || topOw?.species} 超重<br>脂肪先报警`, cls: "neg" },
      { val: health.filter(h => h.health === "healthy").reduce((s, h) => s + h.count, 0), lbl: "只仍被标为健康<br>尚未拉响警报", cls: "pos" },
      { val: "3", lbl: "种企鹅被监测<br>南极哨兵" },
    ]);

    renderList("list-act5", ["Adelie", "Chinstrap", "Gentoo"].map(sp => {
      const spH = health.filter(h => h.species === sp);
      const healthy = spH.find(h => h.health === "healthy");
      const owRate = ow.find(o => o.species === sp);
      return {
        name: SP_ZH[sp] || sp,
        val: `健康 ${healthy?.pct || 0}% · 超重 ${owRate?.overweight_pct || 0}%`,
      };
    }));

    if (topOw) {
      el("stat-overweight").textContent =
        `身体先于曲线报警：${SP_ZH[topOw.species] || topOw.species} 超重比例 ${topOw.overweight_pct}%`;
    }
  }

  return { build };
})();

window.ContentBuilder = ContentBuilder;
