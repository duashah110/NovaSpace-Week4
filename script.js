/* TechNova — Week 4: accessible interactions */
document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile navigation
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const closeMenu = () => {
    if (!menuToggle || !navLinks) return;
    navLinks.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  };
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("active");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
    navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
    document.addEventListener("click", event => {
      if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
  }

  // Theme preference (storage may be unavailable in private browsing)
  const themeToggle = document.getElementById("themeToggle");
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("technova-theme"); } catch (_) { /* storage unavailable */ }
  if (savedTheme === "dark") document.body.classList.add("dark-theme");
  const updateThemeButton = () => {
    if (!themeToggle) return;
    const dark = document.body.classList.contains("dark-theme");
    themeToggle.textContent = dark ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("aria-pressed", String(dark));
  };
  updateThemeButton();
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    try { localStorage.setItem("technova-theme", document.body.classList.contains("dark-theme") ? "dark" : "light"); } catch (_) { /* storage unavailable */ }
    updateThemeButton();
  });

  // Animated counters; display final values immediately for reduced-motion users.
  const counters = document.querySelectorAll(".counter");
  const animateCounter = counter => {
    const target = Number(counter.dataset.target);
    if (!Number.isFinite(target)) return;
    if (prefersReducedMotion) { counter.textContent = String(target); return; }
    const duration = 1400, start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && counters.length) {
    const observer = new IntersectionObserver((entries, obs) => entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); obs.unobserve(entry.target); }
    }), { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
  } else counters.forEach(animateCounter);

  // FAQ accordion with synchronized ARIA and inert panel state.
  document.querySelectorAll(".faq-question").forEach(question => {
    const panel = document.getElementById(question.getAttribute("aria-controls"));
    if (!panel) return;
    question.addEventListener("click", () => {
      const shouldOpen = question.getAttribute("aria-expanded") !== "true";
      document.querySelectorAll(".faq-question").forEach(other => {
        const otherPanel = document.getElementById(other.getAttribute("aria-controls"));
        other.setAttribute("aria-expanded", "false");
        if (otherPanel) { otherPanel.setAttribute("aria-hidden", "true"); otherPanel.inert = true; }
        other.closest(".faq-item")?.classList.remove("open");
      });
      if (shouldOpen) {
        question.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
        panel.inert = false;
        question.closest(".faq-item")?.classList.add("open");
      }
    });
  });

  // Contact form validation (demo only; it does not send an email).
  const form = document.getElementById("contactForm");
  if (form) {
    const fields = [
      { input: document.getElementById("name"), error: document.getElementById("nameError"), message: "Please enter your name." },
      { input: document.getElementById("email"), error: document.getElementById("emailError"), message: "Please enter a valid email address.", email: true },
      { input: document.getElementById("message"), error: document.getElementById("messageError"), message: "Please enter at least 10 characters.", messageField: true }
    ];
    fields.forEach(({ input, error }) => input?.addEventListener("input", () => {
      input.classList.remove("invalid");
      input.setAttribute("aria-invalid", "false");
      if (error) error.textContent = "";
    }));
    form.addEventListener("submit", event => {
      event.preventDefault();
      let firstInvalid = null;
      fields.forEach(({ input, error, message, email, messageField }) => {
        if (!input || !error) return;
        const value = input.value.trim();
        let valid = value.length > 0;
        if (email) valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (messageField) valid = value.length >= 10;
        input.classList.toggle("invalid", !valid);
        input.setAttribute("aria-invalid", String(!valid));
        error.textContent = valid ? "" : message;
        if (!valid && !firstInvalid) firstInvalid = input;
      });
      const status = document.getElementById("formStatus");
      if (firstInvalid) {
        if (status) status.textContent = "Please correct the highlighted fields.";
        firstInvalid.focus();
      } else {
        if (status) status.textContent = "Thank you! Your message has passed validation. This demo does not send email.";
        form.reset();
        fields.forEach(({ input }) => input?.setAttribute("aria-invalid", "false"));
      }
    });
  }

  // Back-to-top control
  const backToTop = document.getElementById("backToTop");
  if (backToTop) {
    const updateBackToTop = () => backToTop.classList.toggle("visible", window.scrollY > 450);
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
  }
});
