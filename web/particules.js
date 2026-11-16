/* ============================================================================
   Bannière d'accueil — réseau de particules neuronales.

   Des nœuds dérivent lentement, se relient quand ils s'approchent, et le
   curseur agit comme un soma : les nœuds proches s'allument et se connectent
   à lui. Une pulsation traverse le réseau toutes les trois secondes — c'est
   « l'étincelle ».

   Contraintes tenues : pas de WebGL (la bannière ne doit pas concurrencer la
   scène du jumeau), nombre de nœuds proportionnel à la surface, cadence
   plafonnée, et rien du tout si l'utilisateur préfère moins de mouvement.
   ========================================================================== */

(function () {
  const canvas = document.getElementById('particules');
  if (!canvas) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  let largeur = 0, hauteur = 0, dpr = 1;
  let noeuds = [];
  const souris = { x: -9999, y: -9999, actif: false };

  function dimensionner() {
    const rect = canvas.getBoundingClientRect();
    largeur = rect.width || window.innerWidth;
    hauteur = rect.height || 480;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = largeur * dpr;
    canvas.height = hauteur * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cible = Math.max(28, Math.min(90, Math.round((largeur * hauteur) / 14000)));
    if (noeuds.length !== cible) {
      noeuds = Array.from({ length: cible }, () => ({
        x: Math.random() * largeur,
        y: Math.random() * hauteur,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.1 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      }));
    }
  }

  const PORTEE = 132;

  function dessiner(temps) {
    ctx.clearRect(0, 0, largeur, hauteur);

    // pulsation globale : une onde traverse le réseau
    const onde = (Math.sin(temps / 1400) + 1) / 2;

    for (let i = 0; i < noeuds.length; i++) {
      const a = noeuds[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > largeur) a.vx *= -1;
      if (a.y < 0 || a.y > hauteur) a.vy *= -1;

      // liens entre nœuds
      for (let j = i + 1; j < noeuds.length; j++) {
        const b = noeuds[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < PORTEE) {
          const alpha = (1 - d / PORTEE) * (0.16 + onde * 0.14);
          ctx.strokeStyle = `rgba(167,139,250,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // lien avec la souris : le soma
      if (souris.actif) {
        const dx = a.x - souris.x, dy = a.y - souris.y;
        const d = Math.hypot(dx, dy);
        if (d < PORTEE * 1.5) {
          const alpha = (1 - d / (PORTEE * 1.5)) * 0.55;
          ctx.strokeStyle = `rgba(103,232,249,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(souris.x, souris.y);
          ctx.stroke();
        }
      }

      // le nœud
      const lueur = 0.35 + 0.45 * Math.abs(Math.sin(temps / 900 + a.phase));
      ctx.fillStyle = `rgba(232,121,249,${(lueur * (0.45 + onde * 0.4)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // halo du curseur
    if (souris.actif) {
      const g = ctx.createRadialGradient(souris.x, souris.y, 0, souris.x, souris.y, 90);
      g.addColorStop(0, 'rgba(103,232,249,.28)');
      g.addColorStop(1, 'rgba(103,232,249,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(souris.x, souris.y, 90, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduit) requestAnimationFrame(dessiner);
  }

  window.addEventListener('resize', () => { dimensionner(); if (reduit) dessiner(0); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    souris.x = e.clientX - r.left;
    souris.y = e.clientY - r.top;
    souris.actif = true;
  });
  canvas.addEventListener('pointerleave', () => { souris.actif = false; });

  dimensionner();
  dessiner(0);

  // Bouton de la bannière : lancer Luna, puis descendre vers le manifeste.
  const bouton = document.getElementById('activer-experience');
  if (bouton) {
    bouton.addEventListener('click', () => {
      if (window.LUNA) window.LUNA.jouer();
      const cible = document.getElementById('manifeste');
      if (cible) cible.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
    });
  }
})();
