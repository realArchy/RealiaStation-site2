/* ============================================================================
   LUMIÈRE AU DÉFILEMENT
   Quand un élément de contenu entre dans l'écran, il s'allume une fois :
   un filet doré et un halo qui s'éteint en 1,5 s. C'est la même lumière que
   l'impulsion du titre, mais déclenchée par la descente dans la page.

   Performance : rien n'est calculé pendant le défilement. Un IntersectionObserver
   pose une classe, le CSS anime une seule couche d'opacité, puis l'observateur
   oublie l'élément. Aucun écouteur de scroll.
   ========================================================================== */

(function () {
  /* Dès qu'on quitte le haut de page, l'impulsion abandonne les menus fixes :
     elle appartient au contenu qui défile. On retire simplement la classe
     d'animation, les éléments retrouvent leur taille et leur éclat normaux. */
  let dernier = -1;
  let prevu = false;
  window.addEventListener('scroll', function () {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(function () {
      prevu = false;
      const enHaut = window.scrollY < 80;
      if (enHaut !== dernier) {
        dernier = enHaut;
        document.documentElement.classList.toggle('en-defilement', !enHaut);
      }
    });
  }, { passive: true });

  const cibles = document.querySelectorAll(
    'main h2, main .lead, main figcaption, main figure img, main .verre, main .journal li, main .chiffre'
  );
  if (!cibles.length) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduit || !('IntersectionObserver' in window)) return;

  const observateur = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('eclaire');
      observateur.unobserve(e.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  cibles.forEach(function (el) {
    if (el.closest('.hero')) return;   // le hero a déjà son impulsion
    observateur.observe(el);
  });
})();
