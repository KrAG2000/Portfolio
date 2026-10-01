import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const exists = async (relativePath) => {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
};
const readJson = async (relativePath) => {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
};
const localTargets = (markup) => {
  const targets = [];
  for (const match of markup.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const target = match[1].trim();
    if (!target || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
    targets.push(target.split(/[?#]/, 1)[0] || ".");
  }
  return targets;
};

const home = await readJson("config/home.json");
const manifest = await readJson("config/chapters/manifest.json");
const chapters = [];
const chapterIds = new Set();

if (!home || typeof home.html !== "string" || !home.html.trim()) {
  errors.push("config/home.json must provide non-empty HTML content.");
}
if (
  !manifest ||
  !Array.isArray(manifest.chapters) ||
  manifest.chapters.length === 0
) {
  errors.push("config/chapters/manifest.json must list at least one chapter.");
} else {
  const currentCount = manifest.chapters.filter(
    (entry) => entry.current === true,
  ).length;
  if (currentCount !== 1)
    errors.push("The chapter manifest must mark exactly one chapter current.");

  for (const entry of manifest.chapters) {
    if (
      typeof entry?.file !== "string" ||
      path.basename(entry.file) !== entry.file ||
      !entry.file.endsWith(".json")
    ) {
      errors.push(
        `Invalid chapter filename in manifest: ${String(entry?.file)}`,
      );
      continue;
    }
    const file = `chapters/${entry.file}`;
    const chapter = await readJson(file);
    if (!chapter) continue;
    chapters.push(chapter);
    if (!chapter.id || chapterIds.has(chapter.id))
      errors.push(`${file} has a missing or duplicate id.`);
    chapterIds.add(chapter.id);
    for (const field of ["chapter", "company", "period", "title", "summary"]) {
      if (typeof chapter[field] !== "string" || !chapter[field].trim())
        errors.push(`${file} needs a non-empty '${field}' field.`);
    }
    if (!Array.isArray(chapter.disciplines) || !Array.isArray(chapter.stats))
      errors.push(`${file} needs disciplines and stats arrays.`);
    if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
      errors.push(`${file} needs an ordered 'sections' array.`);
    } else {
      if (
        !Array.isArray(chapter.animation?.steps) ||
        chapter.animation.steps.length < 2
      ) {
        errors.push(
          `${file} needs at least two steps in its 'animation' object.`,
        );
      }
      for (const [index, section] of chapter.sections.entries()) {
        if (!section || typeof section.type !== "string") {
          errors.push(`${file} section ${index + 1} needs a 'type'.`);
          continue;
        }
        if (section.type === "work") {
          for (const [itemIndex, item] of (section.items || []).entries()) {
            const steps = item.animation?.steps;
            if (!Array.isArray(steps) || steps.length < 2) {
              errors.push(
                `${file} work item ${itemIndex + 1} needs at least two animation steps.`,
              );
            }
          }
        }
      }
    }
  }
}

const chapterFiles = await readdir(path.join(root, "chapters"));
for (const file of chapterFiles.filter((name) => name.endsWith(".json"))) {
  if (!manifest?.chapters?.some((entry) => entry.file === file))
    errors.push(`chapters/${file} is not listed in the chapter manifest.`);
}

for (const [source, markup] of [["config/home.json", home?.html]]) {
  if (typeof markup !== "string") continue;
  for (const target of localTargets(markup)) {
    const cleanTarget = decodeURIComponent(target);
    if (cleanTarget === "." || cleanTarget === "./") continue;
    if (cleanTarget.includes("<") || cleanTarget.includes("\\")) {
      errors.push(`${source} contains an invalid local link: ${target}`);
    } else if (!(await exists(cleanTarget))) {
      errors.push(`${source} points to missing local file '${target}'.`);
    }
  }
}

for (const template of ["index.html", "chapter.html"]) {
  const markup = await readFile(path.join(root, template), "utf8");
  for (const target of localTargets(markup)) {
    if (target === "." || target === "./") continue;
    if (!(await exists(target)))
      errors.push(`${template} points to missing local file '${target}'.`);
  }
}

if (errors.length) {
  console.error(
    `Content validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Content validation passed for homepage and ${chapters.length} chapters.`,
  );
}
