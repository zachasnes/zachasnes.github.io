// Page logic for trainings.html (kept out of the HTML so the site can
// forbid inline scripts in its Content Security Policy).
(function () {
  const { el, labelFor, ROLES, INDUSTRIES, formatDate } = SITE;
  const params = new URLSearchParams(location.search);
  const state = {
    role: params.get("role") || "", industry: params.get("industry") || "",
  };
  const $ = (id) => document.getElementById(id);
  const statusEl = $("status"), results = $("results"), related = $("related");
  let courses = [], stories = [];

  function syncUrl() {
    const p = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => { if (v) p.set(k, v); });
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }

  function renderRelated() {
    related.replaceChildren();
    const r = labelFor(ROLES, state.role), i = labelFor(INDUSTRIES, state.industry);
    const hits = stories.filter((s) => (r && s.roles.includes(r)) || (i && s.industries.includes(i))).slice(0, 2);
    if (!hits.length) return;
    related.append(el("p", { class: "mono list-head" }, "Stories from the field"));
    related.append(el("div", { class: "story-grid" }, hits.map((s, n) =>
      el("a", { class: "story", href: "stories.html#" + s.slug, "data-num": String(n + 1).padStart(2, "0") },
        el("span", { class: "mono date" }, formatDate(s.date)),
        el("h3", {}, s.title), el("p", { class: "hook" }, s.hook),
        el("span", { class: "mono read" }, "Read →")))));
  }

  function update() {
    syncUrl();
    if (!courses.length) return;
    statusEl.textContent = TRAININGS.render(results, courses, state);
    renderRelated();
  }

  TRAININGS.initPicker($("role"), $("industry"), state, update);

  SITE.loadTrainings()
    .then((c) => { courses = c; statusEl.textContent = ""; update(); })
    .catch((err) => SITE.showError(statusEl, "the course list", err));
  // Related stories are optional; a failure here never blocks the courses.
  SITE.loadStories().then((s) => { stories = s; renderRelated(); })
    .catch((err) => console.warn("[zachasnes] stories unavailable:", err));
})();
