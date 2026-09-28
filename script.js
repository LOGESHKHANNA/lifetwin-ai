const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

const outcomeText = {
  productivity: ["ABOUT PRODUCTIVITY", "This view brings your study, sleep and movement context together around the work you want to finish."],
  health: ["ABOUT HEALTH RISK", "This is an indicative everyday signal only. It is not a diagnosis or clinical advice."],
  learning: ["ABOUT LEARNING", "This view helps you see your learning routine beside the rest of your day."],
  stress: ["ABOUT STRESS", "This view encourages you to look for patterns in your routine instead of judging one isolated moment."],
};

function initials(value) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  return (words[0] || "LT").slice(0, 2).toUpperCase();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getViews(sleep, movement, study) {
  return {
    productivity: study >= 4.5 ? "High" : study >= 2.5 ? (movement >= 30 ? "High" : "Medium") : "Low",
    health: sleep >= 7 && movement >= 30 ? "Low" : sleep < 6 || movement < 15 ? "High" : "Medium",
    learning: study >= 5 ? "High" : study >= 2 ? "Medium" : "Low",
    stress: sleep < 6 || study > 8 ? "High" : sleep >= 7 && movement >= 30 ? "Moderate" : "Medium",
  };
}

function updateFocus(sleep, movement, study) {
  let label = "TODAY'S FOCUS";
  let value = "Keep your routine visible";
  let copy = "Use this snapshot as a starting point. Protect the routines that are already helping and choose one small change to try next.";
  if (sleep < 7) { value = "Protect a better sleep window"; copy = "Sleep is one part of the picture. Try making tonight's rest a small, realistic priority."; }
  else if (movement < 30) { value = "Add a little movement"; copy = "A short walk or stretch can be a manageable next step to add to your daily picture."; }
  else if (study < 3) { value = "Create one focused block"; copy = "Choose one small study block rather than trying to redesign the whole day at once."; }
  qs("#focus-label").textContent = label;
  qs("#focus-value").textContent = value;
  qs("#focus-copy").textContent = copy;
}

function renderProfile(values, preview = false) {
  const views = getViews(values.sleep, values.movement, values.study);
  qs("#result-name").textContent = values.name || "Sample student";
  qs("#profile-avatar").textContent = initials(values.name || "Sample student");
  qs("#result-inputs").textContent = `${values.sleep.toFixed(1)} hrs sleep · ${values.movement} min movement · ${values.study.toFixed(1)} hrs study`;
  qs("#productivity-value").textContent = views.productivity;
  qs("#health-value").textContent = views.health;
  qs("#learning-value").textContent = views.learning;
  qs("#stress-value").textContent = views.stress;
  qs("#result-title").textContent = preview ? "Your day, in context" : "A clear starting point";
  qs("#result-label").textContent = preview ? "YOUR PREVIEW" : "EXAMPLE";
  qsa(".outcome small").forEach((item) => { item.textContent = preview ? "your preview" : "example view"; });
  const sleepWidth = clamp(values.sleep / 10 * 100, 4, 100);
  const movementWidth = clamp(values.movement / 90 * 100, 4, 100);
  const studyWidth = clamp(values.study / 6 * 100, 4, 100);
  qs("#sleep-bar").style.width = `${sleepWidth}%`;
  qs("#activity-bar").style.width = `${movementWidth}%`;
  qs("#study-bar").style.width = `${studyWidth}%`;
  qs("#sleep-value").textContent = values.sleep.toFixed(1);
  qs("#activity-value").textContent = String(values.movement);
  qs("#study-value").textContent = values.study.toFixed(1);
  updateFocus(values.sleep, values.movement, values.study);
}

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = qs(".menu-button");
  const mobileNav = qs("#mobile-nav");
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.hidden = isOpen;
    document.body.classList.toggle("menu-open", !isOpen);
  });
  qsa(".mobile-nav a").forEach((link) => link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
    document.body.classList.remove("menu-open");
  }));

  const revealItems = qsa(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, instance) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); instance.unobserve(entry.target); }
    }), { threshold: .08 });
    revealItems.forEach((item) => observer.observe(item));
  } else revealItems.forEach((item) => item.classList.add("visible"));

  const navLinks = qsa(".desktop-nav a");
  const sections = ["home", "twin", "insights", "how"].map((id) => qs(`#${id}`)).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    }), { rootMargin: "-35% 0px -55%" });
    sections.forEach((section) => navObserver.observe(section));
  }

  const readForm = () => ({
    name: qs("#profile-name").value.trim() || "Sample student",
    sleep: Number(qs("#sleep-hours").value),
    movement: Number(qs("#activity-minutes").value),
    study: Number(qs("#study-hours").value),
  });
  const form = qs("#profile-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = readForm();
    const valid = [values.sleep, values.movement, values.study].every(Number.isFinite) && values.sleep >= 0 && values.sleep <= 24 && values.movement >= 0 && values.movement <= 1440 && values.study >= 0 && values.study <= 24;
    if (!valid) { qs("#form-error").textContent = "Please use values within the ranges shown."; return; }
    qs("#form-error").textContent = "";
    renderProfile(values, true);
    qs("#result-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  qs("#reset-profile").addEventListener("click", () => {
    qs("#profile-name").value = "Sample student";
    qs("#sleep-hours").value = "7.2";
    qs("#activity-minutes").value = "45";
    qs("#study-hours").value = "3.5";
    qs("#diet-type").value = "Balanced";
    qs("#form-error").textContent = "";
    renderProfile(readForm());
  });

  qsa(".outcome").forEach((card) => card.addEventListener("click", () => {
    qsa(".outcome").forEach((item) => item.classList.toggle("active", item === card));
    const [title, message] = outcomeText[card.dataset.outcome];
    qs("#selected-outcome span").textContent = title;
    qs("#selected-outcome p").textContent = message;
  }));

  renderProfile(readForm());
  const backTop = qs(".back-top");
  window.addEventListener("scroll", () => backTop.classList.toggle("visible", window.scrollY > 650), { passive: true });
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
});
