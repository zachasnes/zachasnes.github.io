// Page logic for index.html (kept out of the HTML so the site can
// forbid inline scripts in its Content Security Policy).
(function () {
  const $ = (id) => document.getElementById(id);
  const state = { role: "", industry: "" };
  let courses = [];

  function update() {
    if (!courses.length) return;
    $("t-status").textContent = TRAININGS.render($("t-results"), courses, state, { limit: 3 });
    const p = new URLSearchParams();
    if (state.role) p.set("role", state.role);
    if (state.industry) p.set("industry", state.industry);
    $("see-all").href = "trainings.html" + (p.toString() ? "?" + p : "");
  }

  // "New this week": added in the last 7 days, and not part of the first
  // batch (the earliest date_added), so the launch catalog never counts as new.
  function showNew() {
    const first = courses.map((c) => c.added).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()[0];
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const fresh = courses.filter((c) => first && c.added > first && c.added >= weekAgo).slice(0, 5);
    if (!fresh.length) return;
    $("new-list").replaceChildren(SITE.el("div", { class: "course-list" }, fresh.map((c, i) => TRAININGS.courseRow(c, i))));
    $("new").hidden = false;
  }

  TRAININGS.initPicker($("role"), $("industry"), state, update);

  SITE.loadTrainings()
    .then((c) => { courses = c; $("t-status").textContent = ""; update(); showNew(); })
    .catch((err) => SITE.showError($("t-status"), "the course list", err));

  SITE.loadStories()
    .then((stories) => {
      if (!stories.length) return;
      $("s-list").replaceChildren(STORIES.grid(stories.slice(0, 3), "stories.html"));
      $("all-stories").hidden = stories.length <= 3;
      $("stories").hidden = false;
    })
    .catch((err) => console.warn("[zachasnes] stories unavailable:", err));
})();
