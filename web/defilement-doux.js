/* ============================================================================
   DÉFILEMENT DOUX
   Lenis amortit la molette : la page rejoint la position demandée avec une
   inertie courte, au lieu de sauter. On le désactive si l'utilisateur a
   demandé moins de mouvement — son réglage passe avant le nôtre.
   ========================================================================== */

(function () {
  if (!window.Lenis) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({
    lerp: 0.085,          // amorti : plus petit = plus doux
    wheelMultiplier: 0.9, // un cran de molette avance un peu moins
    smoothWheel: true,
    touchMultiplier: 1.4,
  });

  // Lenis a besoin d'être battu ; on le branche sur requestAnimationFrame.
  let actif = true;
  document.addEventListener('visibilitychange', () => { actif = !document.hidden; });

  function battre(temps) {
    requestAnimationFrame(battre);
    if (!actif) return;
    lenis.raf(temps);
  }
  requestAnimationFrame(battre);

  // les liens d'ancre doivent passer par Lenis pour rester doux
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const cible = document.querySelector(a.getAttribute('href'));
      if (!cible) return;
      e.preventDefault();
      lenis.scrollTo(cible, { offset: -70, duration: 1.1 });
    });
  });

  window.__defilementDoux = lenis;
})();
