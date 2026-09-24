// Page logic for check.html: count the checked statements, show a level,
// and point each level somewhere different. Answers are never stored.
(function () {
  const { el } = SITE;
  // Loaded once up front; a failure just means no course list (the button still works).
  const coursesReady = SITE.loadTrainings().catch((err) => {
    console.warn("[zachasnes] self-check: courses unavailable:", err);
    return [];
  });
  const ranked = (list) => SITE.rank(list, "", "").map((x) => x.c);

  const LEVELS = [
    { name: "Level 1 · AI-aware",
      text: "You know what AI is, but it isn't part of your week yet. Start with these three short beginner courses, in order.",
      picks: (list) => ranked(list).slice(0, 3), head: "Your first three courses", steps: true },
    { name: "Level 2 · Practicing",
      text: "You use AI, but not yet as a habit across your work. Next: a step-by-step path built for your role.",
      cta: "Get the path for my role" },
    { name: "Level 3 · AI-fluent",
      text: "AI is part of how you work, you check its output, and you know the data rules. Go deeper with these.",
      picks: (list) => ranked(list).filter((c) => /intermediate|advanced/i.test(c.level)).slice(0, 5), head: "Go deeper" },
  ];

  document.getElementById("check-go").addEventListener("click", async () => {
    const boxes = [...document.querySelectorAll("#check input")];
    const score = boxes.filter((b) => b.checked).length;
    // Level 3 also requires checking AI output and knowing the data rules.
    const safe = boxes.filter((b) => b.hasAttribute("data-required")).every((b) => b.checked);
    const n = score <= 2 ? 0 : score <= 5 || !safe ? 1 : 2;
    const level = LEVELS[n];
    const text = score >= 6 && !safe
      ? "You use AI a lot. Fluency also means checking its output and knowing which data you can share. Get those two down and you're Level 3."
      : level.text;
    SITE.track("check/level-" + (n + 1), "Self-check: " + level.name);

    const picks = level.picks ? level.picks(await coursesReady) : [];
    const out = [el("div", { class: "top-pick enter" },
      el("div", {},
        el("p", { class: "mono eyebrow" }, score + " of 8"),
        el("h3", {}, level.name),
        el("p", {}, text),
        picks.length ? null : el("a", { class: "btn", href: "trainings.html" }, (level.cta || "See the free courses") + " →")))];
    if (picks.length) {
      out.push(el("p", { class: "mono list-head" }, level.head));
      out.push(el("div", { class: "course-list" }, picks.map((c, i) => TRAININGS.courseRow(c, i, level.steps ? i + 1 : null))));
    }
    document.getElementById("check-result").replaceChildren(...out);
  });
})();
