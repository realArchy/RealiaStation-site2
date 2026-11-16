/* ============================================================================
   Fond de page neuronal — réseau de particules derrière toute la page.

   Trois corrections par rapport à la première version, toutes dictées par la
   mesure :
     1. le canvas couvre la fenêtre et reste FIXE derrière le contenu (c'était un
        bloc de 78 vh qui poussait le titre vers le bas) ;
     2. cadence plafonnée à 30 images par seconde et densité divisée : un fond
        qui saccade le défilement n'est pas une animation, c'est une gêne ;
     3. mise en pause dès que l'onglet est caché — un fond de page n'a aucune
        raison de consommer quand personne ne regarde.

   Il ne capte pas la souris (pointer-events: none) : le curseur est suivi au
   niveau de la fenêtre, donc les liens restent cliquables.
   ========================================================================== */

(function () {
  const canvas = document.getElementById('particules');
  if (!canvas) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });

  let largeur = 0, hauteur = 0, dpr = 1;
  let noeuds = [];
  let enPause = false;
  let dernier = 0;
  // Pendant un défilement, le fil principal doit servir au défilement, pas au
  // décor : on cesse de dessiner tant que ça bouge, et on reprend 180 ms après.
  let defile = false;
  let minuterieDefile = null;
  window.addEventListener('scroll', () => {
    defile = true;
    clearTimeout(minuterieDefile);
    minuterieDefile = setTimeout(() => { defile = false; dernier = 0; }, 180);
  }, { passive: true });
  const souris = { x: -9999, y: -9999, actif: false };

  function dimensionner() {
    largeur = window.innerWidth;
    hauteur = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(largeur * dpr);
    canvas.height = Math.floor(hauteur * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // densité : un nœud pour ~26 000 px², plafonnée à 46
    const cible = Math.max(18, Math.min(46, Math.round((largeur * hauteur) / 26000)));
    if (noeuds.length !== cible) {
      noeuds = Array.from({ length: cible }, () => ({
        x: Math.random() * largeur,
        y: Math.random() * hauteur,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2
      }));
    }
  }

  const PORTEE = 128;

  function dessiner(temps) {
    ctx.clearRect(0, 0, largeur, hauteur);
    const onde = (Math.sin(temps / 1800) + 1) / 2;

    for (let i = 0; i < noeuds.length; i++) {
      const a = noeuds[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > largeur) a.vx *= -1;
      if (a.y < 0 || a.y > hauteur) a.vy *= -1;

      for (let j = i + 1; j < noeuds.length; j++) {
        const b = noeuds[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PORTEE * PORTEE) {
          const alpha = (1 - Math.sqrt(d2) / PORTEE) * (0.12 + onde * 0.10);
          ctx.strokeStyle = 'rgba(167,139,250,' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      if (souris.actif) {
        const dx = a.x - souris.x, dy = a.y - souris.y;
        const d = Math.hypot(dx, dy);
        if (d < PORTEE * 1.4) {
          ctx.strokeStyle = 'rgba(103,232,249,' + ((1 - d / (PORTEE * 1.4)) * 0.45).toFixed(3) + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(souris.x, souris.y); ctx.stroke();
        }
      }

      const lueur = 0.3 + 0.4 * Math.abs(Math.sin(temps / 1100 + a.phase));
      ctx.fillStyle = 'rgba(232,121,249,' + (lueur * (0.4 + onde * 0.35)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }

    if (souris.actif) {
      const g = ctx.createRadialGradient(souris.x, souris.y, 0, souris.x, souris.y, 110);
      g.addColorStop(0, 'rgba(103,232,249,.18)');
      g.addColorStop(1, 'rgba(103,232,249,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(souris.x, souris.y, 110, 0, Math.PI * 2); ctx.fill();
    }
  }

  function boucle(temps) {
    if (enPause) return;
    requestAnimationFrame(boucle);
    if (defile) return;                 // on ne peint pas pendant le défilement
    if (temps - dernier < 33) return;   // 30 i/s, pas plus
    dernier = temps;
    dessiner(temps);
  }

  window.addEventListener('resize', () => {
    dimensionner();
    if (reduit) dessiner(0);
  }, { passive: true });

  window.addEventListener('pointermove', (e) => {
    souris.x = e.clientX; souris.y = e.clientY; souris.actif = true;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { souris.actif = false; });

  document.addEventListener('visibilitychange', () => {
    enPause = document.hidden;
    if (!enPause && !reduit) { dernier = 0; requestAnimationFrame(boucle); }
  });

  dimensionner();
  // Sur téléphone, un canvas plein écran animé coûte plus qu'il n'apporte : on
  // peint une image fixe. Le champ d'étoiles CSS suffit à donner la profondeur.
  const petitEcran = window.matchMedia('(max-width: 700px)').matches;
  if (reduit || petitEcran) dessiner(0);
  else requestAnimationFrame(boucle);

  const bouton = document.getElementById('activer-experience');
  if (bouton) {
    bouton.addEventListener('click', () => {
      if (window.LUNA) window.LUNA.jouer();
      const cible = document.getElementById('manifeste');
      if (cible) cible.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
    });
  }
})();
