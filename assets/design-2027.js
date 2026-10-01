(() => {
  "use strict";

  const root = document.body;
  if (!root.classList.contains("home-2027")) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (reducedMotion) return;

  const revealTargets = document.querySelectorAll(
    ".solution-hub, .usecase-band, .demosites-promo, .sales-section, .training-section, .portfolio-section, .contact-section"
  );
  revealTargets.forEach((node) => node.classList.add("motion-reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach((node) => observer.observe(node));
  } else {
    revealTargets.forEach((node) => node.classList.add("is-visible"));
  }

  let raf = 0;
  const onPointerMove = (event) => {
    if (!hero) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const mx = (x - 0.5) * 2;
      const my = (y - 0.5) * 2;
      hero.style.setProperty("--hero-a-x", (mx * 8).toFixed(2) + "px");
      hero.style.setProperty("--hero-a-y", (my * 8).toFixed(2) + "px");
      hero.style.setProperty("--hero-b-x", (mx * -11).toFixed(2) + "px");
      hero.style.setProperty("--hero-b-y", (my * -7).toFixed(2) + "px");
      hero.style.setProperty("--hero-c-x", (mx * 12).toFixed(2) + "px");
      hero.style.setProperty("--hero-c-y", (my * -10).toFixed(2) + "px");
      hero.style.setProperty("--hero-d-x", (mx * -7).toFixed(2) + "px");
      hero.style.setProperty("--hero-d-y", (my * 11).toFixed(2) + "px");
      hero.style.setProperty("--spot-x", String((x * 100).toFixed(1)) + "%");
      hero.style.setProperty("--spot-y", String((y * 100).toFixed(1)) + "%");
    });
  };
  if (hero) hero.addEventListener("pointermove", onPointerMove, { passive: true });

  const tiltCards = document.querySelectorAll(".solution-card");
  tiltCards.forEach((card) => {
    card.classList.add("motion-card");
    card.addEventListener("pointermove", (event) => {
      if (window.innerWidth < 900) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--tilt-y", String(((x - 0.5) * 3.4).toFixed(2)) + "deg");
      card.style.setProperty("--tilt-x", String(((0.5 - y) * 3.0).toFixed(2)) + "deg");
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
})();
