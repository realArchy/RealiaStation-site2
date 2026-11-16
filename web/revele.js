/* Apparition douce au défilement. Un seul fichier pour les dix pages : sans lui,
   tout élément `.reveler` reste à opacity 0 — donc invisible. */
(function () {
  const cibles = document.querySelectorAll('.reveler');
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduit || !('IntersectionObserver' in window)) {
    cibles.forEach(e => e.classList.add('vu'));
    return;
  }

  const o = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('vu'); o.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  cibles.forEach(e => o.observe(e));

  // Filet de sécurité : ce qui est déjà dans la fenêtre au chargement doit être
  // visible tout de suite, même si l'observateur n'a pas encore réagi.
  window.addEventListener('load', function () {
    cibles.forEach(function (e) {
      const r = e.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) e.classList.add('vu');
    });
  });
})();
