const CONFIG_ROOT = "config";
const CHAPTER_ROOT = "chapters";

/** @param {unknown} value */
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char] ?? char,
  );

/** @param {any} animation */
function renderCardAnimation(animation) {
  if (!Array.isArray(animation?.steps) || animation.steps.length === 0)
    return "";
  const steps = animation.steps
    .map(
      (/** @type {any} */ step, /** @type {number} */ index) =>
        `${index ? `<span aria-hidden="true" class="html-link" data-link="${index - 1}"><i></i></span>` : ""}<div class="html-step" data-step="${index}"><span class="html-step-index">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(step.name)}</strong><small>${escapeHtml(step.detail)}</small></div>`,
    )
    .join("");
  const statuses = animation.steps
    .map((/** @type {any} */ step) => escapeHtml(step.status || step.name))
    .join("|");
  return `<div class="html-animation html-animation--card" data-html-animation data-statuses="${statuses}" aria-label="${escapeHtml(animation.label || "Workflow animation")}"><div class="html-flow">${steps}</div>${animation.context ? `<div class="html-context"><span class="context-pulse"></span><strong>${escapeHtml(animation.context.title)}</strong><small>${escapeHtml(animation.context.detail)}</small></div>` : ""}<p class="html-status" aria-live="off"></p></div>`;
}

/** @param {string} path @returns {Promise<any>} */
async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

/** @param {any} chapter @param {boolean} current @param {number} index */
function chapterCard(chapter, current, index) {
  const title = escapeHtml(chapter.title)
    .replaceAll("\\n", "<br />")
    .replaceAll("\n", "<br />");
  const tags = /** @type {string[]} */ (chapter.disciplines || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const stats = /** @type {{value: string, label: string}[]} */ (
    chapter.stats || []
  )
    .map(
      (stat) =>
        `<div class="card-stat"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`,
    )
    .join("");
  const animation = renderCardAnimation(chapter.animation);
  const href = `chapter.html?id=${encodeURIComponent(chapter.id)}`;
  return `<article class="version-card" style="--order:${index}">
    <a class="card-main-link" href="${href}" aria-label="Open chapter ${escapeHtml(chapter.chapter)}: ${escapeHtml(chapter.company)}"></a>
    <div class="card-topline"><div class="card-version"><span>${escapeHtml(chapter.version || chapter.id)}</span>${current ? '<span class="current-pill">Current</span>' : ""}</div><span>${escapeHtml(chapter.period)}</span></div>
    <div class="card-body"><div class="card-copy"><p class="card-chapter">Chapter ${escapeHtml(chapter.chapter)} · ${escapeHtml(chapter.company)}</p><h3>${title}</h3><p class="card-summary">${escapeHtml(chapter.summary)}</p><ul class="tag-list" aria-label="Disciplines">${tags}</ul></div><div class="system-map" aria-hidden="true">${animation}</div></div>
    <div class="card-footer"><div class="card-stats">${stats}</div><div class="card-actions"><a class="open-chapter" href="${href}">Open chapter <span class="round-arrow">↗</span></a></div></div>
  </article>`;
}

async function start() {
  const root = document.querySelector("#page-content");
  if (!root) return;
  try {
    const home = await fetchJson(`${CONFIG_ROOT}/home.json`);
    document.title = home.title || document.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", home.description || "");
    root.innerHTML = home.html;
    const resumeLink = document.querySelector("[data-resume-link]");
    if (resumeLink && home.resume) resumeLink.setAttribute("href", home.resume);
    else resumeLink?.remove();
    const year = document.querySelector("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    const list = document.querySelector("#version-list");
    if (!list) return;
    const manifest = await fetchJson(`${CONFIG_ROOT}/chapters/manifest.json`);
    const chapterEntries = /** @type {{file: string, current?: boolean}[]} */ (
      manifest.chapters
    );
    const entries = await Promise.all(
      chapterEntries.map(async (entry) => ({
        chapter: await fetchJson(`${CHAPTER_ROOT}/${entry.file}`),
        current: entry.current === true,
      })),
    );
    list.innerHTML = entries
      .map(({ chapter, current }, i) => chapterCard(chapter, current, i))
      .join("");
    window.initializeHtmlAnimations?.(list);
    const count = document.querySelector("#version-count");
    if (count) count.textContent = String(entries.length).padStart(2, "0");
    list.querySelectorAll(".version-card").forEach((card) =>
      card.addEventListener("mousemove", (event) => {
        const bounds = card.getBoundingClientRect();
        const mouse = /** @type {MouseEvent} */ (event);
        const element = /** @type {HTMLElement} */ (card);
        element.style.setProperty(
          "--mouse-x",
          `${mouse.clientX - bounds.left}px`,
        );
        element.style.setProperty(
          "--mouse-y",
          `${mouse.clientY - bounds.top}px`,
        );
      }),
    );
  } catch (error) {
    console.error("Could not load portfolio content:", error);
    root.innerHTML =
      '<main class="wrap"><p role="alert">Portfolio content could not be loaded. Preview this site through a local web server.</p></main>';
  } finally {
    root?.removeAttribute("aria-busy");
  }
}

start();
