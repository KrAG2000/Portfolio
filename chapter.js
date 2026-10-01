const params = new URLSearchParams(location.search);
const chapterId = params.get("id");
const root = document.querySelector("#chapter-content");

/** @returns {Promise<void>} */
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
    root.innerHTML = chapter.html;
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
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href") || "#"))
      .filter((section) => section !== null);
    const sectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
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
          )
        : null;
    sections.forEach((section) => sectionObserver?.observe(section));
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
  /** @type {HTMLButtonElement | null} */
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
