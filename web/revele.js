/* Apparition douce au défilement — sans jamais cacher le contenu.

   Réécrit après mesure : la version précédente appelait getBoundingClientRect()
   sur CHAQUE élément à CHAQUE événement de défilement. Lire la géométrie dans un
   gestionnaire de scroll force le navigateur à recalculer la mise en page à
   chaque image : c'est la définition même du défilement saccadé.

   Ici : un IntersectionObserver, aucun écouteur de scroll, aucune lecture de
   géométrie. Plus un filet de sécurité qui révèle tout après 1,5 s.
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
      if (e.isIntersecting) {
        e.target.classList.add('vu');
        o.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });

  cibles.forEach(e => o.observe(e));

  setTimeout(function () {
    cibles.forEach(e => e.classList.add('vu'));
  }, 1500);
})();
