const VERSION_CONFIG_ROOT = "config/versions";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function versionCard(item, index) {
  const title = escapeHtml(item.title).replace("\n", "<br />");
  const tags = item.disciplines
    .map((discipline) => `<li>${escapeHtml(discipline)}</li>`)
    .join("");
  const stats = item.stats
    .map(
      (stat) => `
        <div class="card-stat">
          <strong>${escapeHtml(stat.value)}</strong>
          <span>${escapeHtml(stat.label)}</span>
        </div>`,
    )
    .join("");

  return `
    <article class="version-card" style="--order: ${index}">
      <a class="card-main-link" href="${escapeHtml(item.href)}" aria-label="Open chapter ${escapeHtml(item.chapter)}: ${escapeHtml(item.company)}"></a>
      <div class="card-topline">
        <div class="card-version">
          <span>${escapeHtml(item.version)}</span>
          ${item.current ? '<span class="current-pill">Current</span>' : ""}
        </div>
        <span>${escapeHtml(item.period)}</span>
      </div>

      <div class="card-body">
        <div class="card-copy">
          <p class="card-chapter">Chapter ${escapeHtml(item.chapter)} · ${escapeHtml(item.company)}</p>
          <h3>${title}</h3>
          <p class="card-summary">${escapeHtml(item.summary)}</p>
          <ul class="tag-list" aria-label="Disciplines">${tags}</ul>
        </div>

        <div class="system-map" aria-hidden="true">
          <div class="map-grid"></div>
          <span class="map-node node-a">API</span>
          <span class="map-node node-b">QUEUE</span>
          <span class="map-node node-c">AI</span>
          <span class="map-node node-d">DATA</span>
          <svg viewBox="0 0 360 260" preserveAspectRatio="none">
            <path d="M70 62 C145 62, 124 126, 184 126 S228 204, 300 204" />
            <path d="M70 62 C72 148, 122 204, 300 204" />
            <path d="M184 126 C250 126, 245 62, 300 62" />
          </svg>
          <span class="map-packet packet-one"></span>
          <span class="map-packet packet-two"></span>
          <p>REQUEST → EVENT → OUTCOME</p>
        </div>
      </div>

      <div class="card-footer">
        <div class="card-stats">${stats}</div>
        <div class="card-actions">
          <a class="resume-link" href="${escapeHtml(item.resume)}" target="_blank" rel="noreferrer">Résumé <span>↗</span></a>
          <span class="open-chapter">Open chapter <span class="round-arrow">↗</span></span>
        </div>
      </div>
    </article>`;
}

const versionList = document.querySelector("#version-list");
const versionCount = document.querySelector("#version-count");

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

function validateVersion(version, filename) {
  const requiredFields = ["version", "chapter", "company", "period", "title", "summary", "href", "resume"];
  const missingFields = requiredFields.filter((field) => !version?.[field]);

  if (missingFields.length) {
    throw new Error(`${filename} is missing: ${missingFields.join(", ")}`);
  }

  return {
    ...version,
    disciplines: Array.isArray(version.disciplines) ? version.disciplines : [],
    stats: Array.isArray(version.stats) ? version.stats : [],
  };
}

function enableCardEffects() {
  document.querySelectorAll(".version-card").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--mouse-y", `${event.clientY - bounds.top}px`);
    });
  });
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadPortfolioVersions() {
  if (!versionList) return;

  versionList.setAttribute("aria-busy", "true");

  try {
    const manifest = await fetchJson(`${VERSION_CONFIG_ROOT}/manifest.json`);
    if (!Array.isArray(manifest.versions) || manifest.versions.length === 0) {
      throw new Error("The version manifest does not contain any entries.");
    }

    const results = await Promise.allSettled(
      manifest.versions.map(async (entry) => {
        if (!entry?.config) throw new Error("A manifest entry is missing its config filename.");
        const version = await fetchJson(`${VERSION_CONFIG_ROOT}/${entry.config}`);
        return {
          ...validateVersion(version, entry.config),
          current: entry.current === true,
        };
      }),
    );

    const validVersions = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    results
      .filter((result) => result.status === "rejected")
      .forEach((result) => console.error("Could not load a portfolio version:", result.reason));

    if (validVersions.length === 0) {
      throw new Error("No valid portfolio versions could be loaded.");
    }

    versionList.innerHTML = validVersions.map(versionCard).join("");
    if (versionCount) {
      versionCount.textContent = String(validVersions.length).padStart(2, "0");
    }
    enableCardEffects();
  } catch (error) {
    console.error("Could not load the portfolio archive:", error);
    versionList.innerHTML = `
      <div class="archive-error" role="alert">
        <p>The archive could not be loaded.</p>
        <a href="v1/">Open the latest chapter <span>↗</span></a>
      </div>`;
    if (versionCount) versionCount.textContent = "00";
  } finally {
    versionList.removeAttribute("aria-busy");
  }
}

loadPortfolioVersions();
