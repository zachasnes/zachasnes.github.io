// Page logic for check.html: count the checked statements, show a level.
// Runs entirely in the browser; answers are never stored or sent.
(function () {
  const { el } = SITE;
  const LEVELS = [
    { max: 2, name: "Level 1 · AI-aware",
      text: "You know what AI is, but it isn't part of your week yet. One short beginner course will change that fast.",
      cta: "Start with the #1 course for everyone" },
    { max: 5, name: "Level 2 · Practicing",
      text: "You use AI, but not yet as a habit across your work. The next step is courses built for your role.",
      cta: "Find the best course for your role" },
    { max: 8, name: "Level 3 · AI-fluent",
      text: "AI is part of how you work, and you check its output. Next: go deeper in your field and bring your team along.",
      cta: "Find advanced courses for your role" },
  ];

  document.getElementById("check-go").addEventListener("click", () => {
    const score = document.querySelectorAll("#check input:checked").length;
    const level = LEVELS.find((l) => score <= l.max);
    SITE.track("check/level-" + (LEVELS.indexOf(level) + 1), "Self-check: " + level.name);
    document.getElementById("check-result").replaceChildren(
      el("div", { class: "top-pick enter" },
        el("div", {},
          el("p", { class: "mono eyebrow" }, score + " of 8"),
          el("h3", {}, level.name),
          el("p", {}, level.text),
          el("a", { class: "btn", href: "trainings.html" }, level.cta + " →"))));
  });
})();
