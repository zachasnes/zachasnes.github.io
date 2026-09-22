// ============================================================
// zachasnes.com: shared page logic
//   - loads Trainings + Stories from public Google Sheets
//   - ranks trainings for a role/industry ("your #1 pick")
//   - scroll fade-ins
// Courses: the same Live sheet the TEMBA AI Club page reads.
// Stories: add a row and set published = yes. No redeploy needed.
// ============================================================

const SITE = (() => {
  const TRAININGS_CSV = "https://docs.google.com/spreadsheets/d/1LOaHPOWs0XlF7-O4FD4LfL-CphbTyNfAK44r0mAFwh8/gviz/tq?tqx=out:csv";
  const STORIES_CSV = "https://docs.google.com/spreadsheets/d/15mi1KufT_tQn-He8L2_E93we8vMORdBMb4ycipnu4MI/gviz/tq?tqx=out:csv";

  const ROLES = [
    "Everyone / AI Basics", "Sales", "Marketing", "Finance & Accounting",
    "Operations & Supply Chain", "Product", "Consulting & Strategy", "HR & People",
  ];
  const INDUSTRIES = [
    "Telecom", "Healthcare", "Energy", "Financial Services", "Tech",
    "Real Estate", "Legal", "Public Sector",
  ];
  const BASICS = ROLES[0];

  const slug = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const splitList = (s) => String(s || "").split(";").map((x) => x.trim()).filter(Boolean);
  const labelFor = (list, value) => list.find((l) => slug(l) === value) || "";

  // CSV parsing (quoted fields, commas, embedded newlines)
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    const header = (rows.shift() || []).map((h) => h.trim().toLowerCase());
    return rows
      .filter((r) => r.some((v) => v.trim()))
      .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || "").trim()])));
  }

  // Only http(s) links from the sheets, never javascript: etc.
  function safeUrl(u) {
    try {
      const url = new URL(u);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (e) { return null; }
  }

  async function loadSheet(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status + " loading " + url);
    return parseCSV(await res.text());
  }

  async function loadTrainings() {
    const rows = await loadSheet(TRAININGS_CSV);
    const courses = rows.map((r) => {
      const hours = parseFloat(r.hours);
      return {
        id: r.id, title: r.title, provider: r.provider, url: safeUrl(r.url),
        description: r.description, level: r.level,
        hours: isNaN(hours) ? null : hours,
        roles: splitList(r.roles), industries: splitList(r.industries),
        tasks: splitList(r.tasks), topPickFor: splitList(r.top_pick_for),
      };
    }).filter((c) => c.title && c.url);
    if (!courses.length) throw new Error("Trainings sheet loaded but had no courses");
    return courses;
  }

  async function loadStories() {
    const rows = await loadSheet(STORIES_CSV);
    return rows
      .filter((r) => /^(yes|y|true)$/i.test(r.published || "") && r.title && r.slug)
      .map((r) => ({
        slug: slug(r.slug), date: r.date, title: r.title, hook: r.hook,
        paragraphs: String(r.body || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        roles: splitList(r.roles), industries: splitList(r.industries),
        linkedin: safeUrl(r.linkedin_url),
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  // Hand-picked #1 course per audience, by Sheet id. A `top_pick_for`
  // column in the Sheet, if present, takes priority over this list.
  const TOP_PICKS = {
    "Everyone / AI Basics": "anthropic-ai-fluency",
    "Sales": "hubspot-ai-for-sales",
    "Marketing": "hubspot-ai-for-marketing",
    "Finance & Accounting": "google-ai-finance-professionals",
    "Operations & Supply Chain": "openai-applied-ai-foundations",
    "Product": "google-agentic-strategy",
    "Consulting & Strategy": "openai-ai-leadership",
    "HR & People": "aws-genai-ready-organization",
    "Healthcare": "google-genai-healthcare",
    "Energy": "trailhead-agentforce-energy-utilities",
    "Financial Services": "trailhead-agentforce-financial-services",
    "Tech": "anthropic-ai-fluency-builders",
    "Legal": "ou-genai-use-cases-legal",
    "Public Sector": "innovateus-public-professionals",
  };

  const isTopPick = (c, audience) =>
    c.topPickFor.length ? c.topPickFor.includes(audience) : TOP_PICKS[audience] === c.id;

  // Ranking: top pick > matches role/industry > level > shorter
  const LEVEL = { beginner: 0, intermediate: 1, advanced: 2 };

  function rank(courses, roleLabel, industryLabel) {
    let want = [roleLabel, industryLabel].filter((x) => x && x !== BASICS);
    if (!want.length) want = [BASICS];
    const scored = courses.map((c) => {
      let score = 0;
      if (want.some((w) => isTopPick(c, w))) score += 100;
      if (roleLabel && roleLabel !== BASICS && c.roles.includes(roleLabel)) score += 20;
      if (industryLabel && c.industries.includes(industryLabel)) score += 20;
      const matched = score > 0;
      if (c.roles.includes(BASICS)) score += 5;
      return { c, score, matched };
    });
    scored.sort((a, b) =>
      b.score - a.score ||
      (LEVEL[slug(a.c.level)] ?? 3) - (LEVEL[slug(b.c.level)] ?? 3) ||
      (a.c.hours ?? 99) - (b.c.hours ?? 99));
    return scored;
  }

  function formatHours(h) {
    if (h == null) return "";
    if (h < 1) return Math.round(h * 60) + " min";
    return (Number.isInteger(h) ? h : h.toFixed(1)) + (h === 1 ? " hr" : " hrs");
  }

  const readMinutes = (story) =>
    Math.max(1, Math.round(story.paragraphs.join(" ").split(/\s+/).length / 200));

  function formatDate(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
    if (!m) return d || "";
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  // Small DOM helper: el("p", {class: "x"}, "text", child). Text is always textContent.
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else n.setAttribute(k, v);
    });
    kids.flat().forEach((k) => { if (k != null && k !== "") n.append(k instanceof Node ? k : String(k)); });
    return n;
  }

  function fillSelect(select, labels, placeholder) {
    select.append(el("option", { value: "" }, placeholder));
    labels.forEach((l) => select.append(el("option", { value: slug(l) }, l)));
  }

  function showError(statusEl, what, err) {
    console.error("[zachasnes] Could not load " + what + ":", err);
    statusEl.textContent = "Couldn't load " + what + " right now. Refresh in a minute.";
    statusEl.classList.add("is-error");
  }

  // ---------- Analytics (GoatCounter: cookieless, no banner needed) ----------
  // Set to your GoatCounter code, e.g. "zachasnes" for zachasnes.goatcounter.com.
  // Empty = analytics off (nothing is loaded or sent).
  const GOATCOUNTER = "zachasnes";

  function loadAnalytics() {
    if (!GOATCOUNTER) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = "https://" + GOATCOUNTER + ".goatcounter.com/count";
    s.onerror = () => console.warn("[zachasnes] analytics script failed to load");
    document.head.append(s);
  }

  // Records a named event, e.g. track("course/hubspot-ai-for-sales").
  // Never throws: analytics must not break the page.
  function track(name, title) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, title: title || name, event: true });
      }
    } catch (e) {
      console.warn("[zachasnes] analytics event failed:", name, e);
    }
  }

  // Any element with data-track="event/name" is counted when clicked.
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-track]");
    if (t) track(t.dataset.track, t.dataset.trackTitle);
  });

  // Scroll fade-ins (skipped automatically under reduced motion via CSS)
  function initChrome() {
    loadAnalytics();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll(".fade-up").forEach((n, i) => {
      n.style.transitionDelay = (i % 4) * 0.1 + "s";
      observer.observe(n);
    });
  }

  document.addEventListener("DOMContentLoaded", initChrome);

  return {
    ROLES, INDUSTRIES, BASICS, slug, labelFor, safeUrl, el, fillSelect, showError, track,
    loadTrainings, loadStories, rank, formatHours, readMinutes, formatDate,
  };
})();
