/**
 * One物生灵 · Charts v11 — 清晰优先，仅保留必要图表类型
 * I 折线 | II 坡度 | III 威胁条形 | IV IUCN 条形 | V 分组柱形
 */
const ChartController = (() => {
  const W = 760, H = 400, HT = 240;
  const FS = { axis: 12, label: 13, value: 12, small: 11, title: 11 };

  const C = {
    forest: "#2D5A47", rust: "#B85C42", gold: "#8B6914",
    sage: "#4A7C62", terra: "#D4846A", amber: "#C4922A",
    muted: "#6B7A72", ink: "#1C2B26", sand: "#F0E4D4",
  };

  const REGION_ZH = {
    Africa: "非洲", Asia: "亚洲", Europe: "欧洲",
    "North America": "北美", Oceania: "大洋洲", Antarctic: "南极",
    "International Waters": "国际水域",
  };

  const TYPE_ZH = { Mammal: "哺乳类", Bird: "鸟类", Fish: "鱼类", Reptile: "爬行类", Amphibian: "两栖类", Insect: "昆虫", Plant: "植物" };

  let data = {}, state = { region: null, threat: null, penguinFilter: "all" };
  const tip = d3.select("#tooltip");

  function showTip(html, ev) {
    tip.html(html).classed("visible", true)
      .style("left", `${Math.min(ev.clientX + 14, innerWidth - 290)}px`)
      .style("top", `${ev.clientY - 8}px`);
  }
  function hideTip() { tip.classed("visible", false); }

  function prep(sel, w = W, h = H, margin = { t: 28, r: 24, b: 44, l: 52 }) {
    const svg = d3.select(sel);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`).attr("class", "chart-svg");
    const iw = w - margin.l - margin.r, ih = h - margin.t - margin.b;
    const g = svg.append("g").attr("transform", `translate(${margin.l},${margin.t})`);
    const defs = svg.append("defs");
    return { svg, g, defs, iw, ih, w, h, margin };
  }

  function styleAxis(sel) {
    sel.selectAll("text").attr("font-size", FS.axis);
    sel.selectAll("line, path").attr("stroke", "rgba(28,43,38,0.25)");
  }

  function grad(defs, id, c1, c2) {
    const lg = defs.append("linearGradient").attr("id", id).attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");
    lg.append("stop").attr("offset", "0%").attr("stop-color", c1).attr("stop-opacity", 0.9);
    lg.append("stop").attr("offset", "100%").attr("stop-color", c2).attr("stop-opacity", 0.15);
    return `url(#${id})`;
  }

  function glow(defs, id) {
    const f = defs.append("filter").attr("id", id);
    f.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "b");
    const m = f.append("feMerge");
    m.append("feMergeNode").attr("in", "b");
    m.append("feMergeNode").attr("in", "SourceGraphic");
    return id;
  }

  function popDisplay(raw) {
    if (!raw) return "?";
    return raw
      .replace(/sub-populations?/gi, "个亚种群")
      .replace(/mature individuals?/gi, "株成体")
      .replace(/individuals?/gi, "个个体")
      .replace(/</g, "少于 ");
  }

  function normThreat(t) {
    const s = (t || "").toLowerCase();
    if (/hunt|poach|trap/.test(s)) return "狩猎";
    if (/habitat|forest|clearance|deforest/.test(s)) return "栖息地";
    if (/climate|warming|drought/.test(s)) return "气候";
    if (/agri|graz|crop|farm/.test(s)) return "农业";
    if (/invasive|introduced/.test(s)) return "入侵种";
    if (/pollut|contamin|oil|plastic/.test(s)) return "污染";
    if (/fire/.test(s)) return "火灾";
    if (/fish|bycatch|net/.test(s)) return "渔业";
    return "其他";
  }

  function normType(t) {
    if (!t) return "其他";
    if (t.startsWith("Mammal")) return "哺乳类";
    if (t.startsWith("Bird")) return "鸟类";
    if (t.startsWith("Fish")) return "鱼类";
    if (t.startsWith("Reptile")) return "爬行类";
    if (t.startsWith("Amphibian")) return "两栖类";
    if (t.startsWith("Insect")) return "昆虫";
    if (t.startsWith("Plant")) return "植物";
    return "其他";
  }

  const THREAT_ZH = {
    hunting: "狩猎", Hunting: "狩猎",
    "climate change": "气候", "Climate change": "气候",
    Agriculture: "农业", agriculture: "农业",
    "agricultural expansion": "农业扩张",
    "Habitat loss": "栖息地", "habitat loss": "栖息地",
    fire: "火灾", "Invasive species": "入侵种",
    overgrazing: "过度放牧", development: "开发",
  };

  function threatLabel(t) {
    return THREAT_ZH[t] || normThreat(t);
  }

  /* ═══ ACT 1: 折线图（去掉冗余热力条，全幅展示） ═══ */
  function drawGlobal() {
    const pts = (data.lpi?.global_index || []).filter(d => d.year >= 1970 && d.year <= 2020);
    if (!pts.length) return;
    const { g, defs, iw, ih } = prep("#chart-global");
    const gf = glow(defs, "glow1");
    const fill = grad(defs, "gFill", C.forest, C.sage);

    const x = d3.scaleLinear().domain([1970, 2020]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, 120]).range([ih, 0]);

    g.append("g").attr("class", "grid")
      .call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickSize(-iw).tickFormat(""))
      .selectAll("line").attr("stroke", "rgba(28,43,38,0.08)");
    styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).attr("class", "axis")
      .call(d3.axisBottom(x).tickValues(d3.range(1970, 2021, 10)).tickFormat(d3.format("d"))));
    styleAxis(g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickValues([0, 50, 100])));

    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100))
      .attr("stroke", C.gold).attr("stroke-dasharray", "4,4").attr("opacity", 0.6);
    g.append("text").attr("x", iw).attr("y", y(100) - 6).attr("text-anchor", "end")
      .attr("fill", C.gold).attr("font-size", FS.small).text("基准 100");

    g.append("path").datum(pts).attr("fill", fill)
      .attr("d", d3.area().x(d => x(d.year)).y0(ih).y1(d => y(d.value)).curve(d3.curveCatmullRom.alpha(0.5)));

    const linePath = g.append("path").datum(pts).attr("fill", "none")
      .attr("stroke", C.forest).attr("stroke-width", 3).attr("filter", `url(#${gf})`)
      .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveCatmullRom.alpha(0.5)));

    const total = linePath.node().getTotalLength();
    linePath.attr("stroke-dasharray", total).attr("stroke-dashoffset", total)
      .transition().duration(1400).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);

    const v20pt = pts.find(d => d.year === 2020) || pts.at(-1);
    g.append("circle").attr("cx", x(v20pt.year)).attr("cy", y(v20pt.value)).attr("r", 7)
      .attr("fill", C.rust).attr("stroke", "#fff").attr("stroke-width", 2);
    g.append("text").attr("x", x(v20pt.year) - 10).attr("y", y(v20pt.value) - 12)
      .attr("text-anchor", "end").attr("fill", C.rust).attr("font-size", FS.label).attr("font-weight", 700)
      .text(`${v20pt.value.toFixed(0)}`);

    const focus = g.append("g").style("display", "none");
    focus.append("line").attr("y1", 0).attr("y2", ih).attr("stroke", C.rust).attr("stroke-dasharray", "3,3");
    focus.append("circle").attr("r", 7).attr("fill", C.rust).attr("stroke", "#fff").attr("stroke-width", 2);

    const overlay = g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent").style("cursor", "crosshair");
    const bisect = d3.bisector(d => d.year).left;
    const hud = document.getElementById("hud-global");

    overlay.on("mousemove", function (ev) {
      const [mx] = d3.pointer(ev);
      const year = Math.round(x.invert(mx));
      const i = bisect(pts, year);
      const d0 = pts[i - 1], d1 = pts[i];
      const d = !d1 ? d0 : !d0 ? d1 : year - d0.year > d1.year - year ? d1 : d0;
      if (!d) return;
      focus.style("display", null).attr("transform", `translate(${x(d.year)},0)`);
      focus.select("circle").attr("cy", y(d.value));
      hud.textContent = `${d.year} 年 · 指数 ${d.value.toFixed(1)}`;
      showTip(`<b>${d.year} 年</b><br>种群指数 ${d.value.toFixed(1)}`, ev);
    }).on("mouseleave", () => { focus.style("display", "none"); hud.textContent = "移动鼠标读取年份"; hideTip(); });

    const v20 = v20pt.value;
    const chg = ((v20 - 100) / 100 * 100).toFixed(0);
    document.getElementById("stat-global-change").textContent =
      `五十年：指数从 100 跌到 ${v20.toFixed(0)}，跌幅 ${chg}%`;
    document.getElementById("caption-global").textContent =
      `LPI · ${(data.lpi?.total_populations || 0).toLocaleString()} 条记录`;
  }

  /* ═══ ACT 2: 坡度图 ═══ */
  function drawRegions() {
    const changes = (data.lpi?.region_change || []).slice().sort((a, b) => a.value_2020 - b.value_2020);
    if (!changes.length) return;
    const { g, iw, ih } = prep("#chart-regions", W, H, { t: 16, r: 96, b: 40, l: 96 });

    const x = d3.scalePoint().domain(["1970", "2020"]).range([0, iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 145]).range([ih, 0]);

    styleAxis(g.append("g").attr("class", "grid")
      .call(d3.axisLeft(y).tickValues([0, 50, 100, 133]).tickSize(-iw).tickFormat("")));

    g.append("line").attr("x1", x("1970")).attr("x2", x("2020"))
      .attr("y1", y(100)).attr("y2", y(100))
      .attr("stroke", C.gold).attr("stroke-dasharray", "5,4").attr("opacity", 0.7);
    g.append("text").attr("x", x("1970") - 6).attr("y", y(100) - 8)
      .attr("text-anchor", "end").attr("fill", C.gold).attr("font-size", FS.small).text("基准 100");

    ["1970", "2020"].forEach(k => {
      g.append("text").attr("x", x(k)).attr("y", ih + 24)
        .attr("text-anchor", "middle").attr("fill", C.ink)
        .attr("font-size", FS.label).attr("font-weight", 700).text(k);
    });

    const slopes = g.selectAll(".slope").data(changes).join("g")
      .attr("opacity", d => !state.region || state.region === d.region ? 1 : 0.2)
      .style("cursor", "pointer")
      .on("click", (_, d) => { state.region = state.region === d.region ? null : d.region; drawRegions(); })
      .on("mousemove", (ev, d) => showTip(
        `<b>${REGION_ZH[d.region]}</b><br>1970: ${d.value_1970.toFixed(0)} → 2020: ${d.value_2020.toFixed(0)}<br>${d.change_pct > 0 ? "+" : ""}${d.change_pct}%`, ev))
      .on("mouseleave", hideTip);

    slopes.append("line")
      .attr("x1", x("1970")).attr("y1", d => y(d.value_1970))
      .attr("x2", x("2020")).attr("y2", d => y(d.value_2020))
      .attr("stroke", d => d.change_pct < -40 ? C.rust : d.change_pct < 0 ? C.terra : C.forest)
      .attr("stroke-width", d => state.region === d.region ? 5 : 3).attr("stroke-linecap", "round");

    slopes.append("circle").attr("cx", x("2020")).attr("cy", d => y(d.value_2020))
      .attr("r", 6).attr("fill", d => d.change_pct < 0 ? C.rust : C.forest);

    slopes.append("text")
      .attr("x", -12).attr("y", d => (y(d.value_1970) + y(d.value_2020)) / 2 + 5)
      .attr("text-anchor", "end").attr("fill", C.ink)
      .attr("font-size", FS.label).attr("font-weight", 600)
      .text(d => REGION_ZH[d.region] || d.region);

    slopes.append("text")
      .attr("x", x("2020") + 12).attr("y", d => y(d.value_2020) + 5)
      .attr("fill", d => d.change_pct < 0 ? C.rust : C.forest)
      .attr("font-size", FS.value).attr("font-weight", 700)
      .text(d => `${d.value_2020.toFixed(0)} (${d.change_pct > 0 ? "+" : ""}${d.change_pct}%)`);

    const worst = changes[0];
    document.getElementById("stat-worst-region").textContent =
      `全球均值掩盖地理伤痕：${REGION_ZH[worst.region]} ${worst.change_pct}%`;
    document.getElementById("caption-regions").textContent =
      state.region ? `已选中 ${REGION_ZH[state.region]}` : "点击线条高亮区域";
  }

  /* ═══ ACT 3: 威胁横向条形（清晰 + 可筛选） ═══ */
  function drawThreats() {
    const threats = aggregateThreats(data.endangered?.threat_counts || []).slice(0, 7);
    const lowest = data.endangered?.lowest_population || [];
    if (!threats.length) return;
    const { g, iw, ih } = prep("#chart-threats", W, HT, { t: 8, r: 36, b: 8, l: 96 });

    const labels = threats.map(d => d.threat);
    const y = d3.scaleBand().domain(labels).range([0, ih]).padding(0.28);
    const x = d3.scaleLinear().domain([0, d3.max(threats, d => d.count)]).range([0, iw]);

    g.selectAll("rect").data(threats).join("rect")
      .attr("y", (_, i) => y(labels[i]))
      .attr("height", y.bandwidth())
      .attr("x", 0).attr("width", 0)
      .attr("fill", (_, i) => d3.interpolateRgb(C.rust, C.amber)(i / 6))
      .attr("rx", 3)
      .attr("opacity", d => !state.threat || d.threat === state.threat ? 1 : 0.28)
      .style("cursor", "pointer")
      .on("click", (_, d) => { state.threat = state.threat === d.threat ? null : d.threat; drawThreats(); })
      .on("mousemove", (ev, d) => showTip(`<b>${d.threat}</b><br>${d.count} 种`, ev))
      .on("mouseleave", hideTip)
      .transition().duration(600).delay((_, i) => i * 50)
      .attr("width", d => x(d.count));

    g.selectAll(".nm").data(threats).join("text")
      .attr("class", "nm")
      .attr("x", -8).attr("y", (_, i) => y(labels[i]) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "end").attr("fill", C.ink)
      .attr("font-size", FS.label).attr("font-weight", 600)
      .text((_, i) => labels[i]);

    g.selectAll(".val").data(threats).join("text")
      .attr("class", "val")
      .attr("x", d => x(d.count) + 8)
      .attr("y", (_, i) => y(labels[i]) + y.bandwidth() / 2 + 5)
      .attr("fill", C.ink).attr("font-size", FS.value).attr("font-weight", 700)
      .text(d => `${d.count} 种`);

    const grid = document.getElementById("species-spotlight");
    grid.innerHTML = lowest.slice(0, 4).map((s, i) => {
      const name = speciesNameZh(s);
      const spThreats = (s.threats || []).map(t => threatLabel(t));
      const match = !state.threat || spThreats.includes(state.threat);
      return `<div class="spot-card ${match ? "highlight" : "dim"}">
        <div class="rank">#${i + 1} · 最稀少</div>
        <div class="name">${name}</div>
        <div class="pop">${popDisplay(s.population?.raw)}</div>
        <div class="meta">${normType(s.type)}</div>
      </div>`;
    }).join("");

    if (lowest[0]) {
      document.getElementById("stat-lowest-pop").textContent =
        `${speciesNameZh(lowest[0])}：仅剩 ${popDisplay(lowest[0].population?.raw)}`;
    }
    document.getElementById("caption-threats").textContent =
      state.threat ? `筛选：${state.threat}` : "首要威胁 · 点击条形筛选物种";
  }

  /* ═══ ACT 4: IUCN 等级横向条形（光谱叙事） ═══ */
  function drawStatus() {
    const statusOrder = ["Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered"];
    const statusZh = {
      "Critically Endangered": "极危", Endangered: "濒危", Vulnerable: "易危",
      "Near Threatened": "近危", "Least Concern": "无危",
    };
    const statusColor = {
      "Critically Endangered": C.rust, Endangered: "#C4622D",
      Vulnerable: C.amber, "Near Threatened": C.sage, "Least Concern": C.forest,
    };

    const raw = (data.animals?.status_distribution || [])
      .filter(d => statusOrder.includes(d.status) && d.count > 0)
      .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

    if (!raw.length) return;
    const { g, iw, ih } = prep("#chart-status", W, H, { t: 8, r: 48, b: 8, l: 108 });

    const labels = raw.map(d => statusZh[d.status]);
    const y = d3.scaleBand().domain(labels).range([0, ih]).padding(0.3);
    const x = d3.scaleLinear().domain([0, d3.max(raw, d => d.count)]).range([0, iw]);
    const total = d3.sum(raw, d => d.count);

    g.selectAll("rect").data(raw).join("rect")
      .attr("y", d => y(statusZh[d.status]))
      .attr("height", y.bandwidth())
      .attr("x", 0).attr("width", 0)
      .attr("fill", d => statusColor[d.status])
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mousemove", (ev, d) => {
        const pct = (d.count / total * 100).toFixed(1);
        showTip(`<b>${statusZh[d.status]}</b><br>${d.count} 种 · ${pct}%`, ev);
      })
      .on("mouseleave", hideTip)
      .transition().duration(700).delay((_, i) => i * 80)
      .attr("width", d => x(d.count));

    g.selectAll(".nm").data(raw).join("text")
      .attr("x", -8).attr("y", d => y(statusZh[d.status]) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "end").attr("fill", C.ink)
      .attr("font-size", FS.label).attr("font-weight", 600)
      .text(d => statusZh[d.status]);

    g.selectAll(".val").data(raw).join("text")
      .attr("x", d => x(d.count) + 8)
      .attr("y", d => y(statusZh[d.status]) + y.bandwidth() / 2 + 5)
      .attr("fill", C.ink).attr("font-size", FS.value).attr("font-weight", 700)
      .text(d => `${d.count} 种`);

    const endangered = raw.filter(d => ["Critically Endangered", "Endangered", "Vulnerable"].includes(d.status))
      .reduce((s, d) => s + d.count, 0);
    document.getElementById("stat-endangered-count").textContent = `${endangered} 种处于受威胁状态`;
    document.getElementById("caption-status").textContent = "IUCN 红色名录 · 无危→极危光谱";
  }

  /* ═══ ACT 5: 分组柱形（三物种 × 健康指标） ═══ */
  function drawPenguin() {
    const health = data.penguins?.health_distribution || [];
    if (!health.length) return;
    const { g, iw, ih } = prep("#chart-penguin", W, H, { t: 24, r: 16, b: 40, l: 48 });

    const spZh = { Adelie: "阿德利", Chinstrap: "帽带", Gentoo: "巴布亚" };
    const metricZh = { healthy: "健康", overweight: "超重", underweight: "偏瘦" };
    const metricColor = { healthy: C.forest, overweight: C.amber, underweight: C.rust };
    const metrics = ["healthy", "overweight", "underweight"];
    const species = [...new Set(health.map(d => d.species))];

    const x0 = d3.scaleBand().domain(species.map(s => spZh[s])).range([0, iw]).padding(0.28);
    const x1 = d3.scaleBand().domain(metrics.map(m => metricZh[m])).range([0, x0.bandwidth()]).padding(0.15);
    const y = d3.scaleLinear().domain([0, 60]).range([ih, 0]);

    styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).attr("class", "axis")
      .call(d3.axisBottom(x0)));
    styleAxis(g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).tickValues([0, 25, 50]).tickFormat(d => `${d}%`)));

    const groups = g.selectAll(".sp").data(species).join("g")
      .attr("transform", d => `translate(${x0(spZh[d])},0)`);

    groups.selectAll("rect").data(sp => metrics.map(m => {
      const d = health.find(h => h.species === sp && h.health === m);
      return { sp, m, pct: d?.pct || 0, show: state.penguinFilter === "all" || state.penguinFilter === m };
    })).join("rect")
      .attr("x", d => x1(metricZh[d.m]))
      .attr("width", x1.bandwidth())
      .attr("y", ih).attr("height", 0)
      .attr("fill", d => metricColor[d.m])
      .attr("rx", 3)
      .attr("opacity", d => d.show ? 1 : 0.15)
      .style("cursor", "pointer")
      .on("mousemove", (ev, d) => showTip(`<b>${spZh[d.sp]}</b> · ${metricZh[d.m]}<br>${d.pct}%`, ev))
      .on("mouseleave", hideTip)
      .transition().duration(600).delay((_, i) => i * 40)
      .attr("y", d => y(d.pct)).attr("height", d => ih - y(d.pct));

    groups.selectAll(".pct").data(sp => metrics.map(m => {
      const d = health.find(h => h.species === sp && h.health === m);
      return { sp, m, pct: d?.pct || 0, show: state.penguinFilter === "all" || state.penguinFilter === m };
    })).join("text")
      .attr("class", "pct")
      .attr("x", d => x1(metricZh[d.m]) + x1.bandwidth() / 2)
      .attr("y", d => y(d.pct) + 16)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.pct > 30 ? "#fff" : C.ink)
      .attr("font-size", FS.value).attr("font-weight", 700)
      .attr("opacity", d => d.show && d.pct >= 6 ? 1 : 0)
      .text(d => `${d.pct}%`);

    const leg = g.append("g").attr("transform", `translate(0,-8)`);
    metrics.forEach((m, i) => {
      const lx = i * 72;
      leg.append("rect").attr("x", lx).attr("y", 0).attr("width", 10).attr("height", 10)
        .attr("fill", metricColor[m]).attr("rx", 2);
      leg.append("text").attr("x", lx + 14).attr("y", 9)
        .attr("fill", C.ink).attr("font-size", FS.small).text(metricZh[m]);
    });

    const ow = data.penguins?.overweight_rate || [];
    if (ow.length) {
      const top = ow.reduce((a, b) => a.overweight_pct > b.overweight_pct ? a : b);
      document.getElementById("stat-overweight").textContent =
        `${spZh[top.species]} 超重 ${top.overweight_pct}%`;
    }
    document.getElementById("caption-penguin").textContent =
      state.penguinFilter === "all" ? "三物种健康比例 · 柱上标 %" : `筛选：${metricZh[state.penguinFilter]}`;
  }

  function bindPenguinFilters() {
    document.querySelectorAll("#penguin-filters .filter-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("#penguin-filters .filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.penguinFilter = btn.dataset.metric;
        drawPenguin();
      };
    });
  }

  const drawers = { global: drawGlobal, regions: drawRegions, threats: drawThreats, status: drawStatus, penguin: drawPenguin };

  function onStepChange(chartId, stepNum) {
    if (drawers[chartId]) drawers[chartId]();
    document.getElementById("nav-act-num").textContent = String(stepNum + 1).padStart(2, "0");
    document.getElementById("progress-fill").style.width = `${((stepNum + 1) / 5) * 100}%`;
    const hints = {
      global: "移动鼠标 · 按年份读取指数",
      regions: "点击线条 · 高亮区域轨迹",
      threats: "点击威胁条 · 筛选物种",
      status: "悬停条形 · 读取各等级数量",
      penguin: "切换筛选 · 对比三物种比例",
    };
    const h = document.getElementById("toolbar-hint");
    if (h) h.textContent = hints[chartId] || "";
  }

  function getLpi2020() {
    const pts = (data.lpi?.global_index || []).filter(d => d.year >= 1970 && d.year <= 2020);
    return pts.at(-1)?.value || 0;
  }

  function fillHero() {
    const pop = (data.lpi?.total_populations || 0).toLocaleString();
    const txtPop = document.getElementById("txt-populations");
    if (txtPop) txtPop.textContent = pop;
    const lpiVal = getLpi2020();
    const lpiEl = document.getElementById("hero-lpi");
    const deltaEl = document.getElementById("hero-lpi-delta");
    if (lpiEl) lpiEl.textContent = String(Math.round(lpiVal));
    if (deltaEl && lpiVal) {
      const pct = ((lpiVal - 100) / 100 * 100).toFixed(1);
      deltaEl.textContent = `${pct.startsWith("-") ? "−" : "+"}${Math.abs(parseFloat(pct)).toFixed(1)}%`;
    }
    const dec = data.lpi?.direction_counts?.decrease;
    const inc = data.lpi?.direction_counts?.increase;
    const decEl = document.getElementById("hero-decrease");
    const incEl = document.getElementById("hero-increase");
    if (decEl && dec != null) decEl.textContent = dec.toLocaleString();
    if (incEl && inc != null) incEl.textContent = inc.toLocaleString();
    if (data.endangered) {
      const sp = document.getElementById("hero-species");
      if (sp) sp.textContent = data.endangered.total;
    }
  }

  function init(allData) {
    data = allData;
    state = { region: null, threat: null, penguinFilter: "all" };
    fillHero();
    bindPenguinFilters();
    drawGlobal();
  }

  function redraw() {
    const active = document.querySelector(".chart-panel.is-active");
    if (active) drawers[active.dataset.chart]?.();
  }

  return { init, onStepChange, redraw };
})();

window.ChartController = ChartController;
