(() => {
  /** @param {ParentNode} [scope=document] */
  function initializeHtmlAnimations(scope = document) {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scope
      .querySelectorAll("[data-html-animation]:not([data-animation-ready])")
      .forEach((stageElement) => {
        const stage = /** @type {HTMLElement} */ (stageElement);
        const steps = [...stage.querySelectorAll(".html-step")];
        const links = [...stage.querySelectorAll(".html-link")];
        const status = stage.querySelector(".html-status");
        const messages = (stage.dataset.statuses || "").split("|");
        if (!steps.length) return;
        stage.dataset.animationReady = "true";
        let active = 0;
        const paint = () => {
          steps.forEach((step, index) => {
            step.classList.toggle("is-active", index === active);
            step.classList.toggle("is-complete", index < active);
          });
          links.forEach((link, index) =>
            link.classList.toggle("is-active", index < active),
          );
          if (status && messages[active]) status.textContent = messages[active];
          stage.dataset.activeStep = String(active);
        };
        paint();
        if (reducedMotion || steps.length < 2) {
          steps.forEach((step) => step.classList.add("is-complete"));
          return;
        }
        window.setInterval(() => {
          active = (active + 1) % steps.length;
          paint();
        }, 1050);
      });
  }

  window.initializeHtmlAnimations = initializeHtmlAnimations;
  document.addEventListener("DOMContentLoaded", () =>
    initializeHtmlAnimations(),
  );
})();
