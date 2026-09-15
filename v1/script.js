const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => revealObserver.observe(element));
}

const navShell = document.querySelector(".nav-shell");
const updateNavigation = () => {
  navShell?.classList.toggle("scrolled", window.scrollY > 680);
};
updateNavigation();
window.addEventListener("scroll", updateNavigation, { passive: true });

const navLinks = [...document.querySelectorAll(".nav-links a")];
const linkedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-25% 0px -65%", threshold: 0 },
  );
  linkedSections.forEach((section) => sectionObserver.observe(section));
}

const clock = document.querySelector("#clock");
const updateClock = () => {
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
};
updateClock();
setInterval(updateClock, 1000);

const dispatchButton = document.querySelector("#dispatch-button");
const jobToken = document.querySelector("#job-token");
const jobStatus = document.querySelector("#job-status");
const jobAttempt = document.querySelector("#job-attempt");
const jobBackoff = document.querySelector("#job-backoff");
const queueNodes = [...document.querySelectorAll(".queue-node")];
let jobNumber = 0;

const delay = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

function setNode(name, state = "active") {
  queueNodes.forEach((node) => node.classList.remove("active", "failed"));
  document.querySelector(`[data-node="${name}"]`)?.classList.add(state);
}

function moveJob(destination) {
  jobToken.className = `job-token visible at-${destination}`;
}

async function dispatchJob() {
  if (!dispatchButton || dispatchButton.disabled) return;

  dispatchButton.disabled = true;
  jobNumber += 1;
  const shouldRetry = jobNumber % 3 === 1;
  const speed = reducedMotion ? 30 : 620;
  const jobId = String(jobNumber).padStart(3, "0");

  jobToken.textContent = `J${jobId}`;
  jobStatus.textContent = `Job J${jobId} accepted`;
  jobAttempt.textContent = "1 / 3";
  jobBackoff.textContent = "-";
  setNode("intake");
  moveJob("intake");
  await delay(speed);

  jobStatus.textContent = "Queued for delivery";
  setNode("queue");
  moveJob("queue");
  await delay(speed);

  jobStatus.textContent = "Worker processing";
  setNode("worker");
  moveJob("worker");
  await delay(speed);

  if (shouldRetry) {
    jobStatus.textContent = "Transient failure · retrying";
    jobBackoff.textContent = "2s";
    setNode("worker", "failed");
    await delay(reducedMotion ? 30 : 900);

    jobStatus.textContent = "Requeued with backoff";
    jobAttempt.textContent = "2 / 3";
    setNode("queue");
    moveJob("queue");
    await delay(speed);

    jobStatus.textContent = "Worker processing";
    setNode("worker");
    moveJob("worker");
    await delay(speed);
  }

  jobStatus.textContent = `Job J${jobId} completed`;
  jobBackoff.textContent = shouldRetry ? "2s · recovered" : "not needed";
  setNode("store");
  moveJob("store");
  await delay(speed);

  queueNodes.forEach((node) => node.classList.remove("active", "failed"));
  jobToken.classList.remove("visible");
  dispatchButton.disabled = false;
}

dispatchButton?.addEventListener("click", dispatchJob);

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
