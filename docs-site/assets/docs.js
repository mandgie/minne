// docs.minne.sh — theme, search, the on-this-page rail, the mobile drawer.
// No dependencies, no network calls beyond the one fetch of search-index.json,
// which is served from this same origin.
(() => {
  const root = document.documentElement;

  /* ── theme ─────────────────────────────────────────────────────── */

  const themeBtn = document.querySelector(".theme");
  themeBtn?.addEventListener("click", () => {
    const dark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "light" : "dark";
    try {
      localStorage.setItem("minne-docs-theme", root.dataset.theme);
    } catch (e) {}
  });

  /* ── mobile drawer ─────────────────────────────────────────────── */

  const side = document.getElementById("side");
  const burger = document.querySelector(".burger");
  burger?.addEventListener("click", () => {
    const open = side.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  side?.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      side.classList.remove("is-open");
      burger?.setAttribute("aria-expanded", "false");
    }
  });

  // Keep the current page in view in a long sidebar.
  const here = side?.querySelector("a.is-on");
  if (here && side.scrollHeight > side.clientHeight) {
    const top = here.offsetTop - side.clientHeight / 2;
    if (top > 0) side.scrollTop = top;
  }

  /* ── on this page ──────────────────────────────────────────────── */

  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length) {
    const targets = tocLinks
      .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
      .filter(Boolean);
    const mark = () => {
      const line = window.scrollY + parseFloat(getComputedStyle(root).scrollPaddingTop) + 8;
      let active = targets[0];
      for (const t of targets) if (t.offsetTop <= line) active = t;
      // At the very bottom the last heading wins, however short its section.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4)
        active = targets[targets.length - 1];
      tocLinks.forEach((a) =>
        a.classList.toggle("is-on", active && a.hash === "#" + active.id),
      );
    };
    let ticking = false;
    addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          mark();
          ticking = false;
        });
      },
      { passive: true },
    );
    mark();
  }

  /* ── search ────────────────────────────────────────────────────── */

  const dialog = document.getElementById("search");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const empty = document.getElementById("searchEmpty");
  let index = null;
  let cursor = 0;

  async function load() {
    if (index) return index;
    try {
      index = await (await fetch("/search-index.json")).json();
    } catch (e) {
      index = [];
    }
    return index;
  }

  function open() {
    load();
    dialog.hidden = false;
    input.value = "";
    render([]);
    input.focus();
    document.body.style.overflow = "hidden";
  }
  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
  }

  const escHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function excerpt(text, terms) {
    const low = text.toLowerCase();
    let at = -1;
    for (const t of terms) {
      const i = low.indexOf(t);
      if (i !== -1 && (at === -1 || i < at)) at = i;
    }
    if (at === -1) return escHtml(text.slice(0, 110));
    const start = Math.max(0, at - 32);
    let slice = text.slice(start, start + 130);
    if (start > 0) slice = "…" + slice;
    let out = escHtml(slice);
    for (const t of terms) {
      out = out.replace(
        new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"),
        "<mark>$1</mark>",
      );
    }
    return out;
  }

  function search(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) return [];
    const hits = [];
    for (const page of index) {
      const hay = (page.title + " " + page.description + " " + page.text).toLowerCase();
      const heads = page.headings.map((h) => h.text.toLowerCase());
      let score = 0;
      for (const t of terms) {
        if (!hay.includes(t)) {
          score = -1;
          break;
        }
        if (page.title.toLowerCase().includes(t)) score += 12;
        if (page.description.toLowerCase().includes(t)) score += 5;
        if (heads.some((h) => h.includes(t))) score += 6;
        score += Math.min(4, (hay.split(t).length - 1) * 0.5);
      }
      if (score < 0) continue;
      // Land on the most relevant heading, not just the page.
      const head = page.headings.find((h) =>
        terms.every((t) => h.text.toLowerCase().includes(t)),
      );
      hits.push({
        href: (page.slug === "" ? "/" : "/" + page.slug) + (head ? "#" + head.id : ""),
        title: head ? `${page.title} › ${head.text}` : page.title,
        section: page.section,
        body: excerpt(page.description + " — " + page.text, terms),
        score,
      });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  function render(hits) {
    cursor = 0;
    results.innerHTML = hits
      .map(
        (h, i) =>
          `<li${i === 0 ? ' class="is-on"' : ""}><a href="${h.href}"><small>${escHtml(h.section)}</small><b>${escHtml(h.title)}</b><em>${h.body}</em></a></li>`,
      )
      .join("");
    empty.hidden = !(input.value.trim() && hits.length === 0);
  }

  document.querySelector(".search-open")?.addEventListener("click", open);
  dialog?.querySelector(".search__scrim")?.addEventListener("click", close);

  input?.addEventListener("input", async () => {
    await load();
    render(search(input.value.trim()));
  });

  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dialog.hidden ? open() : close();
      return;
    }
    if (dialog.hidden) {
      // "/" opens search, unless the visitor is typing somewhere.
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        open();
      }
      return;
    }
    if (e.key === "Escape") return close();
    const items = [...results.children];
    if (!items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[cursor]?.classList.remove("is-on");
      cursor = (cursor + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
      items[cursor].classList.add("is-on");
      items[cursor].scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter") {
      e.preventDefault();
      items[cursor]?.querySelector("a")?.click();
    }
  });
})();
