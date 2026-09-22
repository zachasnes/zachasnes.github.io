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

  TRAININGS.initPicker($("role"), $("industry"), state, update);

  SITE.loadTrainings()
    .then((c) => { courses = c; $("t-status").textContent = ""; update(); })
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
