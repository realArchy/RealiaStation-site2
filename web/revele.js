/* Apparition douce au défilement — sans jamais cacher durablement le contenu.

   Trois garde-fous, appris à la dure :
   1. l'état « invisible » n'existe que si ce script s'exécute (classe sur <html>) ;
   2. tout ce qui est déjà dans la fenêtre au chargement est révélé aussitôt ;
   3. un filet de sécurité révèle tout après 2,5 s, même si l'observateur n'a
      jamais réagi (saut de page, lien profond, onglet en arrière-plan).
*/
(function () {
  const cibles = document.querySelectorAll('.reveler');
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduit || !('IntersectionObserver' in window)) {
    cibles.forEach(e => e.classList.add('vu'));
    return;
  }

  document.documentElement.classList.add('revele-js');

  const o = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('vu'); o.unobserve(e.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  cibles.forEach(e => o.observe(e));

  function revelerVisible() {
    cibles.forEach(function (e) {
      const r = e.getBoundingClientRect();
      if (r.top < window.innerHeight + 40 && r.bottom > -40) e.classList.add('vu');
    });
  }
  window.addEventListener('load', revelerVisible);
  window.addEventListener('scroll', revelerVisible, { passive: true });

  setTimeout(function () {
    cibles.forEach(e => e.classList.add('vu'));
  }, 2500);
})();
