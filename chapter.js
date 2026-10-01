const chapterId = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#chapter-content");
const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] || char,
  );

/** @param {any} animation @param {boolean} [compact] */
function animationMarkup(animation, compact = false) {
  if (!animation?.steps?.length) return "";
  const steps = animation.steps
    .map(
      (/** @type {any} */ step, /** @type {number} */ index) =>
        `${index ? '<span aria-hidden="true" class="html-link" data-link="' + (index - 1) + '"><i></i></span>' : ""}<div class="html-step" data-step="${index}"><span class="html-step-index">${String(index + 1).padStart(2, "0")}</span><strong>${esc(step.name)}</strong><small>${esc(step.detail)}</small></div>`,
    )
    .join("");
  const statuses = animation.steps
    .map((/** @type {any} */ step) => step.status || step.name)
    .join("|");
  return `<div class="html-animation ${compact ? "html-animation--mini" : "html-animation--card"}" data-html-animation data-statuses="${esc(statuses)}" aria-label="${esc(animation.label || "Workflow animation")}"><div class="html-flow">${steps}</div>${animation.context ? `<div class="html-context"><span class="context-pulse"></span><strong>${esc(animation.context.title)}</strong><small>${esc(animation.context.detail)}</small></div>` : ""}<p class="html-status" aria-live="off"></p></div>`;
}

/** @param {any} block @param {number} index */
function renderBlock(block, index) {
  const reveal = (/** @type {string} */ content) =>
    `<section class="${esc(block.className || `${block.type} section wrap`)}"${block.id ? ` id="${esc(block.id)}"` : ""}>${content}</section>`;
  switch (block.type) {
    case "hero":
      return `<section aria-labelledby="hero-title" class="hero wrap"><div class="chapter-stamp"><span>Portfolio / ${esc(block.version)}</span><span>Chapter ${esc(block.chapter)}: ${esc(block.company)}</span></div><div class="hero-grid"><div class="hero-copy"><p class="kicker"><span></span>${esc(block.kicker)}</p><h1 id="hero-title">${esc(block.heading)} <em>${esc(block.emphasis)}</em></h1><p class="hero-intro">${esc(block.intro)}</p><div class="hero-actions"><a class="button button-primary" href="#work">${esc(block.action || "See selected work")} <span>↓</span></a><a class="text-link" href="mailto:${esc(block.email)}">${esc(block.email)} <span>↗</span></a></div></div><aside aria-label="${esc(block.profileLabel || "Engineering profile summary")}" class="hero-console"><div class="console-bar"><span aria-hidden="true" class="console-dots"><i></i><i></i><i></i></span><span>${esc(block.consoleTitle || "profile.system")}</span><span>${esc(block.chapter)}</span></div><div aria-hidden="true" class="console-visual"><div class="radar-ring ring-one"></div><div class="radar-ring ring-two"></div><div class="radar-ring ring-three"></div><div class="radar-axis axis-x"></div><div class="radar-axis axis-y"></div><span class="radar-node node-one"></span><span class="radar-node node-two"></span><span class="radar-node node-three"></span><strong>${esc(block.visualTitle)}</strong><p>${esc(block.visualDetail)}</p></div><dl class="console-data">${block.profile.map((/** @type {any} */ item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join("")}</dl></aside></div><div class="hero-foot"><p>${esc(block.footLeft || `Experience at ${block.company}`)}</p><p>Scroll to explore <span aria-hidden="true">↘</span></p></div></section>`;
    case "marquee":
      return `<section aria-label="${esc(block.label || "Technical focus")}" class="signal-strip"><div class="signal-track">${[...block.items, ...block.items].map((/** @type {any} */ item) => `<span>${esc(item)}</span><i aria-hidden="true">✦</i>`).join("")}</div></section>`;
    case "intro":
      return reveal(
        `<div class="section-index reveal">${esc(block.index)} / ${esc(block.label)}</div><div class="intro-main reveal"><p class="eyebrow">${esc(block.eyebrow)}</p><h2>${esc(block.heading)}</h2><p class="large-copy">${esc(block.lead)}</p></div><div class="intro-aside reveal">${block.points.map((/** @type {string} */ text) => `<p>${esc(text)}</p>`).join("")}</div>`,
      );
    case "work":
      return `<section aria-labelledby="work-title" class="work section wrap" id="work"><div class="work-heading reveal"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><div><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="work-title">${esc(block.heading)}</h2></div><p class="work-note">${esc(block.note)}</p></div><div class="case-list">${block.items.map((/** @type {any} */ item, /** @type {number} */ i) => `<article class="case-card reveal"><div class="case-number">${String(i + 1).padStart(2, "0")}</div><div class="case-content"><p class="case-type">${esc(item.type)}</p><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><ul aria-label="Technologies" class="pill-list">${item.technologies.map((/** @type {string} */ tech) => `<li>${esc(tech)}</li>`).join("")}</ul></div><div aria-hidden="true" class="case-diagram ${esc(item.diagramClass || "agent-diagram")}">${animationMarkup(item.animation, true)}</div></article>`).join("")}</div></section>`;
    case "impact":
      return `<section aria-label="${esc(block.label || "Work impact")}" class="impact-band"><div class="wrap impact-grid">${block.items.map((/** @type {any} */ item) => `<div class="impact-item reveal"><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></div>`).join("")}</div></section>`;
    case "lab":
      return `<section aria-labelledby="lab-title" class="lab section wrap" id="lab"><div class="lab-copy reveal"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="lab-title">${esc(block.heading)}</h2><p class="large-copy">${esc(block.lead)}</p><p>${esc(block.description)}</p><button class="button button-dark" id="dispatch-button" type="button">${esc(block.button || "Dispatch a job")} <span>→</span></button></div><div aria-live="polite" class="queue-lab reveal"><div class="lab-topbar"><span>${esc(block.host || "scheduler.local")}</span><span id="clock">00:00:00</span></div><div class="queue-stage" id="queue-stage"><div aria-hidden="true" class="queue-connectors"></div>${block.nodes.map((/** @type {any} */ node, /** @type {number} */ i) => `<div class="queue-node" data-node="${esc(node.id)}"><span>${String(i + 1).padStart(2, "0")}</span><strong>${esc(node.name)}</strong><small>${esc(node.detail)}</small></div>`).join("")}<div aria-hidden="true" class="job-token" id="job-token">J<span>001</span></div></div><div class="lab-log"><div><span>Status</span><strong id="job-status">Awaiting dispatch</strong></div><div><span>Attempt</span><strong id="job-attempt"> - </strong></div><div><span>Backoff</span><strong id="job-backoff"> - </strong></div></div></div></section>`;
    case "projects":
      return `<section aria-labelledby="projects-title" class="side-projects section wrap"><div class="side-heading reveal"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><div><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="projects-title">${esc(block.heading)}</h2></div></div><div class="project-grid">${block.items.map((/** @type {any} */ item, /** @type {number} */ i) => `<article class="project-card ${i % 2 ? "inverse" : ""} reveal"><div class="project-top"><span>${String(i + 1).padStart(2, "0")}</span><span>${esc(item.technologies)}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="project-foot"><span>${esc(item.note)}</span><span>${esc(item.status)}</span></div></article>`).join("")}</div></section>`;
    case "principles":
      return `<section aria-labelledby="principles-title" class="principles section wrap"><div class="principles-heading reveal"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="principles-title">${esc(block.heading)}</h2></div><ol class="principle-list">${block.items.map((/** @type {any} */ item, /** @type {number} */ i) => `<li class="reveal"><span>${String(i + 1).padStart(2, "0")}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></li>`).join("")}</ol></section>`;
    case "experience":
      return `<section aria-labelledby="experience-title" class="experience section wrap"><div class="experience-heading reveal"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><div><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="experience-title">${esc(block.heading)}</h2></div></div><div class="timeline">${block.items.map((/** @type {any} */ item) => `<article class="timeline-row ${item.education ? "education" : ""} reveal"><div class="timeline-date">${esc(item.period)}</div><div><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div><p>${esc(item.detail)}</p><span aria-hidden="true" class="timeline-dot"></span></article>`).join("")}</div></section>`;
    case "stack":
      return `<section aria-labelledby="stack-title" class="stack section wrap"><div class="stack-heading reveal"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="stack-title">${esc(block.heading)}</h2></div><div class="stack-grid reveal">${block.groups.map((/** @type {any} */ group) => `<div><h3>${esc(group.name)}</h3>${group.items.map((/** @type {string} */ item) => `<p>${esc(item)}</p>`).join("")}</div>`).join("")}</div></section>`;
    case "contact":
      return `<section aria-labelledby="contact-title" class="contact"><div class="contact-inner wrap"><div class="section-index">${esc(block.index)} / ${esc(block.label)}</div><div class="contact-copy reveal"><p class="eyebrow">${esc(block.eyebrow)}</p><h2 id="contact-title">${esc(block.heading)}</h2><a class="contact-email" href="mailto:${esc(block.email)}">${esc(block.email)} <span>↗</span></a></div><div class="contact-links reveal">${block.links.map((/** @type {any} */ link) => `<a href="${esc(link.url)}" rel="noreferrer" target="_blank">${esc(link.label)} <span>↗</span></a>`).join("")}</div></div></section>`;
    default:
      console.warn(
        `Unknown chapter section type at position ${index}:`,
        block.type,
      );
      return "";
  }
}

async function loadChapter() {
  if (!root) return;
  try {
    if (!chapterId || !/^[a-z0-9_-]+$/i.test(chapterId))
      throw new Error("A valid chapter id is required.");
    const response = await fetch(`chapters/${chapterId}.json`);
    if (!response.ok)
      throw new Error(`Chapter ${chapterId} could not be loaded.`);
    const chapter = await response.json();
    document.title =
      chapter.pageTitle || `Chapter ${chapter.chapter} | Kartik Agnihotri`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        chapter.pageDescription || chapter.summary || "",
      );
    root.innerHTML = `<a class="skip-link" href="#main">Skip to content</a><header class="nav-shell" id="top"><nav aria-label="Primary navigation" class="nav wrap"><a aria-label="Kartik Agnihotri, top of page" class="brand" href="#top">KA<span>.</span></a><div class="nav-links"><a href="#work">Work</a><a href="#lab">Lab</a><a href="#about">About</a></div></nav></header><main id="main">${chapter.sections.map(renderBlock).join("")}</main><footer class="footer"><div class="wrap"><a href="./">← Portfolio archive</a><p>© <span id="year"></span> Kartik Agnihotri</p><a href="#top">Back to top ↑</a></div></footer>`;
    window.initializeHtmlAnimations?.(root);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealElements = document.querySelectorAll(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window))
      revealElements.forEach((el) => el.classList.add("visible"));
    else {
      const observer = new IntersectionObserver(
        (entries, current) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              current.unobserve(entry.target);
            }
          }),
        { threshold: 0.12 },
      );
      revealElements.forEach((el) => observer.observe(el));
    }
    const nav = document.querySelector(".nav-shell");
    const updateNav = () =>
      nav?.classList.toggle("scrolled", window.scrollY > 680);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    const links = [...document.querySelectorAll(".nav-links a")];
    const sections = links.map((link) =>
      document.querySelector(link.getAttribute("href") || "#"),
    );
    if ("IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting)
              links.forEach((link) =>
                link.classList.toggle(
                  "active",
                  link.getAttribute("href") === `#${entry.target.id}`,
                ),
              );
          }),
        { rootMargin: "-25% 0px -65%" },
      );
      sections.forEach((section) => {
        if (section) sectionObserver.observe(section);
      });
    }
    startQueueDemo(reducedMotion);
    const year = document.querySelector("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  } catch (error) {
    console.error(error);
    root.innerHTML =
      '<main class="wrap"><p role="alert">This chapter could not be loaded.</p><a href="./">Return to portfolio</a></main>';
  } finally {
    root.removeAttribute("aria-busy");
  }
}

/** @param {boolean} reducedMotion */
function startQueueDemo(reducedMotion) {
  const button = /** @type {HTMLButtonElement | null} */ (
    document.querySelector("#dispatch-button")
  );
  const token = document.querySelector("#job-token");
  const status = document.querySelector("#job-status");
  const attempt = document.querySelector("#job-attempt");
  const backoff = document.querySelector("#job-backoff");
  const nodes = [...document.querySelectorAll(".queue-node")];
  let number = 0;
  /** @param {number} ms */
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  /** @param {string} name @param {string} [state] */
  const setNode = (name, state = "active") => {
    nodes.forEach((node) => node.classList.remove("active", "failed"));
    document.querySelector(`[data-node="${name}"]`)?.classList.add(state);
  };
  /** @param {string} to */
  const move = (to) => {
    if (token) token.className = `job-token visible at-${to}`;
  };
  button?.addEventListener("click", async () => {
    if (button.disabled || !token || !status) return;
    button.disabled = true;
    number += 1;
    const retry = number % 3 === 1,
      speed = reducedMotion ? 30 : 620,
      id = String(number).padStart(3, "0");
    token.textContent = `J${id}`;
    status.textContent = `Job J${id} accepted`;
    if (attempt) attempt.textContent = "1 / 3";
    if (backoff) backoff.textContent = "-";
    for (const [node, text] of [
      ["intake", "Job accepted"],
      ["queue", "Queued for delivery"],
      ["worker", "Worker processing"],
    ]) {
      status.textContent = text;
      setNode(node);
      move(node);
      await delay(speed);
    }
    if (retry) {
      status.textContent = "Transient failure · retrying";
      if (backoff) backoff.textContent = "2s";
      setNode("worker", "failed");
      await delay(reducedMotion ? 30 : 900);
      status.textContent = "Requeued with backoff";
      if (attempt) attempt.textContent = "2 / 3";
      setNode("queue");
      move("queue");
      await delay(speed);
      status.textContent = "Worker processing";
      setNode("worker");
      move("worker");
      await delay(speed);
    }
    status.textContent = `Job J${id} completed`;
    if (backoff) backoff.textContent = retry ? "2s · recovered" : "not needed";
    setNode("store");
    move("store");
    await delay(speed);
    nodes.forEach((node) => node.classList.remove("active", "failed"));
    token.classList.remove("visible");
    button.disabled = false;
  });
}

loadChapter();
