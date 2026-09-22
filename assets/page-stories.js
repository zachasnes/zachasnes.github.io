// Page logic for stories.html (kept out of the HTML so the site can
// forbid inline scripts in its Content Security Policy).
(function () {
  const $ = (id) => document.getElementById(id);
  const statusEl = $("status"), list = $("list"), listView = $("list-view"), readerView = $("reader-view");
  let stories = [];

  function renderList() {
    list.replaceChildren(stories.length ? STORIES.grid(stories, "stories.html") : STORIES.empty());
  }

  function route() {
    const key = decodeURIComponent(location.hash.slice(1));
    const story = key && stories.find((s) => s.slug === key);
    listView.hidden = !!story;
    readerView.hidden = !story;
    if (story) {
      readerView.replaceChildren(STORIES.reader(story));
      SITE.track("story/" + story.slug, "Read story: " + story.title);
      document.title = story.title + " · Zach Asnes";
      window.scrollTo(0, 0);
    } else {
      document.title = "Stories · Zach Asnes";
      renderList();
    }
  }

  window.addEventListener("hashchange", route);

  SITE.loadStories()
    .then((s) => { stories = s; statusEl.textContent = ""; route(); })
    .catch((err) => SITE.showError(statusEl, "stories", err));
})();
