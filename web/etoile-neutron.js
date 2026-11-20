/* ============================================================================
   ÉTOILE À NEUTRONS — page de l'application (thème : la communication)

   Une étoile à neutrons ne « clignote » pas parce qu'elle tourne : elle émet
   deux faisceaux le long de son axe magnétique, et ce sont ces faisceaux qui
   balaient l'espace. Quand l'un passe dans notre direction, on reçoit un éclat
   — c'est un pulsar. C'est exactement ce qui est dessiné ici : deux cônes
   opposés qui tournent avec l'étoile, un halo qui s'allume au passage, et des
   anneaux qui s'élargissent à chaque impulsion.

   Dessin en 2D sur canvas : quelques centaines d'opérations par image, aucun
   risque pour la carte graphique, et un rendu qui « respire » sans jamais
   clignoter bêtement.
   ========================================================================= */
(() => {
  const canvas = document.getElementById('etoile-neutron');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- géométrie : petite, loin, en haut à droite ------------------------ */
  let L = 0, H = 0, cx = 0, cy = 0, echelle = 1, dpr = 1;

  function jauger() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    L = rect.width;
    H = rect.height;
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* le cœur se tient à 78 % de la largeur, 26 % de la hauteur du cadre */
    cx = L * 0.55;
    cy = H * 0.30;
    /* diamètre du cœur : ~14 px — une étoile lointaine, pas un projecteur */
    echelle = Math.max(1, L / 460);
  }

  /* ---- état ------------------------------------------------------------- */
  let angle = 0;              // rotation de l'étoile sur elle-même
  let phase = 0;              // avance temporelle
  let dernier = 0;
  const anneaux = [];
  const VITESSE = 3.1;        // rad/s : une rotation en ~2 s, très rapide
  const PERIODE = (Math.PI * 2) / VITESSE;

  const R_COEUR = 7;          // rayon du cœur, en pixels (avant échelle)
  const FUITE = 19;           // longueur des faisceaux

  function halo(x, y, r, couleurs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [pos, col] of couleurs) g.addColorStop(pos, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function dessiner(dt) {
    ctx.clearRect(0, 0, L, H);
    ctx.globalCompositeOperation = 'lighter';

    const coeur = R_COEUR * echelle;
    const fuite = FUITE * echelle;

    /* l'intensité d'impulsion : maximale quand un faisceau nous fait face */
    const face = Math.max(0, Math.cos(angle));
    const impulsion = Math.pow(face, 14);        // éclat bref, très marqué
    const base = 0.34;

    /* 1. brume lointaine : ce qui donne la profondeur */
    halo(cx, cy, fuite * 3.4, [
      [0, `rgba(150, 205, 255, ${0.05 + impulsion * 0.10})`],
      [0.45, `rgba(96, 150, 255, ${0.028 + impulsion * 0.05})`],
      [1, 'rgba(40, 60, 140, 0)'],
    ]);

    /* 2. les deux faisceaux opposés, dans le plan de l'écran */
    for (const sens of [1, -1]) {
      const a = angle + (sens > 0 ? 0 : Math.PI);
      const ex = cx + Math.cos(a) * fuite * 2.0;
      const ey = cy + Math.sin(a) * fuite * 2.0;
      /* un faisceau s'ouvre en s'éloignant : étroit au pôle, large au bout */
      const etroit = coeur * 0.28;
      const large = coeur * 1.35;

      const g = ctx.createLinearGradient(cx, cy, ex, ey);
      g.addColorStop(0, `rgba(226, 242, 255, ${0.62 * (base + impulsion)})`);
      g.addColorStop(0.35, `rgba(160, 205, 255, ${0.20 * (base + impulsion)})`);
      g.addColorStop(0.75, `rgba(130, 175, 255, ${0.07 * (base + impulsion)})`);
      g.addColorStop(1, 'rgba(120, 160, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a + Math.PI / 2) * etroit,
                 cy + Math.sin(a + Math.PI / 2) * etroit);
      ctx.lineTo(ex + Math.cos(a + Math.PI / 2) * large,
                 ey + Math.sin(a + Math.PI / 2) * large);
      ctx.lineTo(ex + Math.cos(a - Math.PI / 2) * large,
                 ey + Math.sin(a - Math.PI / 2) * large);
      ctx.lineTo(cx + Math.cos(a - Math.PI / 2) * etroit,
                 cy + Math.sin(a - Math.PI / 2) * etroit);
      ctx.closePath();
      ctx.fill();
    }

    /* 3. anneaux d'impulsion : ils s'élargissent puis s'effacent */
    for (let i = anneaux.length - 1; i >= 0; i--) {
      const an = anneaux[i];
      an.t += dt;
      const k = an.t / 1.5;
      if (k >= 1) { anneaux.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(196, 226, 255, ${0.30 * (1 - k)})`;
      ctx.lineWidth = Math.max(0.6, 1.4 * (1 - k) * echelle);
      ctx.beginPath();
      ctx.arc(cx, cy, coeur * (1.3 + k * 5.5), 0, Math.PI * 2);
      ctx.stroke();
    }

    /* 4. le cœur : bleu-blanc, très petit, très lumineux */
    halo(cx, cy, coeur * (1.5 + impulsion * 0.8), [
      [0, `rgba(255, 255, 255, ${0.92 - 0.10 * (1 - impulsion)})`],
      [0.35, `rgba(205, 231, 255, ${0.55 + impulsion * 0.3})`],
      [1, 'rgba(150, 195, 255, 0)'],
    ]);

    /* 5. la tache chaude : le pôle magnétique, tourne avec l'étoile */
    const px = cx + Math.cos(angle) * coeur * 0.42;
    const py = cy + Math.sin(angle) * coeur * 0.42;
    halo(px, py, coeur * 0.55, [
      [0, `rgba(255, 255, 255, ${0.85 + impulsion * 0.15})`],
      [1, 'rgba(190, 225, 255, 0)'],
    ]);

    /* 6. voile d'éloignement : l'étoile est derrière une fine brume */
    ctx.globalCompositeOperation = 'source-over';
    const brume = ctx.createRadialGradient(cx, cy, coeur * 2, cx, cy, coeur * 9);
    brume.addColorStop(0, 'rgba(5, 2, 10, 0)');
    brume.addColorStop(0.55, 'rgba(5, 2, 10, 0.10)');
    brume.addColorStop(1, 'rgba(5, 2, 10, 0.30)');
    ctx.fillStyle = brume;
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 9, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- boucle ----------------------------------------------------------- */
  let prochaine = 0;

  function boucle(t) {
    const dt = dernier ? Math.min((t - dernier) / 1000, 0.05) : 0.016;
    dernier = t;
    phase += dt;
    angle += VITESSE * dt;

    /* une impulsion par demi-tour : chaque fois qu'un faisceau nous balaie */
    const tours = phase / (PERIODE / 2);
    if (tours > prochaine) {
      prochaine = tours + 1;
      anneaux.push({ t: 0 });
      if (anneaux.length > 6) anneaux.shift();
    }

    dessiner(dt);
    requestAnimationFrame(boucle);
  }

  jauger();
  if (calme) {
    angle = 0.35;
    dessiner(0);
  } else {
    let enAttente = false;
    addEventListener('resize', () => {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(() => { jauger(); enAttente = false; });
    });
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { dernier = 0; requestAnimationFrame(boucle); }
    }, { threshold: 0 });
    io.observe(canvas);
    requestAnimationFrame(boucle);
  }
})();
