// ============================================================
// Trainings finder: sentence picker + "#1 pick" results.
// Used by trainings.html (full) and index.html (teaser).
// ============================================================

const TRAININGS = (() => {
  const { ROLES, INDUSTRIES, BASICS, slug, labelFor, el, rank, formatHours } = SITE;

  function courseMeta(c) {
    return [c.provider, c.level, formatHours(c.hours)].filter(Boolean).join("  ·  ");
  }

  function courseTags(c) {
    return [...c.roles.filter((r) => r !== BASICS), ...c.industries].slice(0, 4)
      .map((t) => el("span", { class: "tag" }, t));
  }

  function topPickCard(c, eyebrow) {
    return el("a", { class: "top-pick enter", href: c.url, target: "_blank", rel: "noopener",
      "data-track": "course-top/" + c.id, "data-track-title": "#1 pick: " + c.title },
      el("div", {},
        el("p", { class: "mono eyebrow" }, eyebrow),
        el("h3", {}, c.title),
        el("p", {}, c.description),
        el("p", { class: "mono meta" }, courseMeta(c) + "  ·  Free")),
      el("span", { class: "go", "aria-hidden": "true" }, "↗"));
  }

  function courseRow(c, i) {
    return el("a", { class: "course enter d" + Math.min(i, 8), href: c.url, target: "_blank", rel: "noopener",
      "data-track": "course/" + c.id, "data-track-title": "Course: " + c.title },
      el("span", { class: "course-num" }, String(i + 2).padStart(2, "0")),
      el("div", {},
        el("div", { class: "course-name" }, c.title, " ↗"),
        el("div", { class: "course-desc" }, c.description),
        el("div", { class: "mono course-meta" }, courseMeta(c))),
      el("div", { class: "tags" }, courseTags(c)));
  }

  // filters: { level, time, q } (slugs / text)
  function applyFilters(courses, f) {
    return courses.filter((c) => {
      if (f.level && slug(c.level) !== f.level) return false;
      if (f.time && c.hours != null) {
        if (f.time === "short" && c.hours >= 1) return false;
        if (f.time === "medium" && (c.hours < 1 || c.hours > 5)) return false;
        if (f.time === "long" && c.hours <= 5) return false;
      }
      if (f.q) {
        const hay = [c.title, c.provider, c.description, ...c.roles, ...c.industries, ...c.tasks].join(" ").toLowerCase();
        if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }

  // Renders into `out`. Returns a one-line status string.
  function render(out, courses, state, opts = {}) {
    const roleLabel = labelFor(ROLES, state.role);
    const industryLabel = labelFor(INDUSTRIES, state.industry);
    const who = [roleLabel && roleLabel !== BASICS ? roleLabel : "", industryLabel].filter(Boolean).join(" · ");
    const filtered = applyFilters(courses, state);
    const ranked = rank(filtered, roleLabel, industryLabel);
    out.replaceChildren();
    if (!ranked.length) return "No courses match those filters. Try clearing one.";

    const matched = ranked.filter((x) => x.matched).map((x) => x.c);
    const basics = ranked.filter((x) => !x.matched && x.c.roles.includes(BASICS)).map((x) => x.c);
    let top, next, foundations = [], status = "", eyebrow = "The best place to start";

    if (who && matched.length) {
      [top, ...next] = matched;
      foundations = basics;
      eyebrow = "Your #1 pick for " + who;
    } else if (who) {
      // Nothing specific yet: fall back to the general ranking, not a fake "#1 for X".
      [top, ...next] = rank(filtered, "", "").map((x) => x.c);
      status = "Nothing " + who + "-specific yet. Here's where to start. New courses land weekly.";
    } else {
      [top, ...next] = ranked.map((x) => x.c);
    }

    out.append(topPickCard(top, eyebrow));
    const limit = opts.limit ?? Infinity;
    if (next.length) {
      out.append(el("p", { class: "mono list-head" }, who && matched.length ? "Next up for " + who + " (" + next.length + ")" : "Also worth your time"));
      out.append(el("div", { class: "course-list" }, next.slice(0, limit).map(courseRow)));
    }
    if (foundations.length && limit === Infinity) {
      out.append(el("p", { class: "mono list-head" }, "Foundations for any role (" + foundations.length + ")"));
      out.append(el("div", { class: "course-list" }, foundations.map((c, i) => courseRow(c, i + next.length))));
    }
    return status;
  }

  // Wires a sentence picker. Calls onChange(state) on every change.
  function initPicker(roleSel, industrySel, state, onChange) {
    SITE.fillSelect(roleSel, ROLES.filter((r) => r !== BASICS), "any role");
    SITE.fillSelect(industrySel, INDUSTRIES, "any industry");
    roleSel.value = state.role || "";
    industrySel.value = state.industry || "";
    // Size each select to its current text so the sentence reads naturally.
    // Inter averages ~0.5em per character at this weight.
    const fit = (s) => { s.style.width = Math.max(2, s.options[s.selectedIndex].text.length * 0.5 + 0.1) + "em"; };
    [roleSel, industrySel].forEach((s) => {
      fit(s);
      s.addEventListener("change", () => {
        const key = s === roleSel ? "role" : "industry";
        state[key] = s.value;
        fit(s);
        if (s.value) SITE.track("picker/" + key + "/" + s.value, "Picked " + key + ": " + s.options[s.selectedIndex].text);
        onChange(state);
      });
    });
  }

  return { render, initPicker };
})();
