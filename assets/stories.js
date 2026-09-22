// ============================================================
// Stories: cards, the full-story reader, and the empty state.
// Used by stories.html (all) and index.html (latest 3).
// ============================================================

const STORIES = (() => {
  const { el, slug, formatDate, readMinutes, BASICS } = SITE;
  const LINKEDIN = "https://www.linkedin.com/in/zachary-asnes/";

  function card(s, i, hrefBase) {
    return el("a", { class: "story enter", href: hrefBase + "#" + s.slug, "data-num": String(i + 1).padStart(2, "0"), style: "animation-delay:" + i * 0.06 + "s" },
      el("span", { class: "mono date" }, formatDate(s.date) + "  ·  " + readMinutes(s) + " min read"),
      el("h3", {}, s.title),
      el("p", { class: "hook" }, s.hook),
      el("div", { class: "tags" }, [...s.roles.filter((r) => r !== BASICS), ...s.industries].slice(0, 3).map((t) => el("span", { class: "tag" }, t))),
      el("span", { class: "mono read" }, "Read the story →"));
  }

  function grid(stories, hrefBase) {
    return el("div", { class: "story-grid" }, stories.map((s, i) => card(s, i, hrefBase)));
  }

  function empty() {
    return el("div", { class: "story-empty" },
      el("h3", {}, "The first story drops soon."),
      el("p", {}, "Real lessons from rolling out AI at large enterprises, with customers kept anonymous. Follow on LinkedIn to catch it first."),
      el("a", { class: "btn", href: LINKEDIN, target: "_blank", rel: "noopener" }, "Follow on LinkedIn ↗"));
  }

  // The link into the trainings finder for this story's audience.
  function trainingsLink(s) {
    const p = new URLSearchParams();
    const role = s.roles.find((r) => r !== BASICS);
    if (role) p.set("role", slug(role));
    if (s.industries[0]) p.set("industry", slug(s.industries[0]));
    return "trainings.html" + (p.toString() ? "?" + p : "");
  }

  function reader(s) {
    const who = [s.roles.find((r) => r !== BASICS), s.industries[0]].filter(Boolean).join(" · ");
    return el("article", { class: "reader enter" },
      el("a", { class: "mono back", href: "stories.html" }, "← All stories"),
      el("p", { class: "mono date", style: "color:var(--accent)" }, formatDate(s.date) + "  ·  " + readMinutes(s) + " min read"),
      el("h1", {}, s.title),
      s.hook ? el("p", { class: "hook" }, s.hook) : null,
      el("div", { class: "body" }, s.paragraphs.map((p) => el("p", {}, p))),
      el("div", { class: "actions" },
        el("a", { class: "btn", href: trainingsLink(s) }, who ? "Top free trainings for " + who + " →" : "Find a free training for your role →"),
        s.linkedin ? el("a", { class: "btn ghost", href: s.linkedin, target: "_blank", rel: "noopener" }, "Discuss on LinkedIn ↗") : null));
  }

  return { grid, empty, reader };
})();
