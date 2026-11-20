/* ============================================================================
   ÉTOILE À NEUTRONS — page de l'application (thème : la communication)

   Une étoile à neutrons ne clignote pas parce qu'elle tourne : elle émet deux
   faisceaux le long de son axe magnétique, qui PARTENT DE SES PÔLES et balaient
   l'espace. Quand l'un passe dans notre direction, on reçoit un éclat — c'est un
   pulsar. Les faisceaux naissent donc à la surface, pas au centre.

   Dessin en 2D sur canvas : la surface porte une granulation qui tourne avec
   l'étoile, les pôles portent une tache chaude, et chaque passage d'un faisceau
   allume un anneau. Aucun coût GPU, rendu déterministe (graine fixe).
   ========================================================================= */
(() => {
  const canvas = document.getElementById('etoile-neutron');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- graine fixe : la granulation ne change pas d'une visite à l'autre --- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const alea = mulberry32(20261120);

  /* ---- granulation : cellules réparties sur la sphère ---------------------- */
  const GRAINS = [];
  for (let i = 0; i < 150; i++) {
    const u = alea() * 2 - 1;
    const th = alea() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - u * u));
    GRAINS.push({
      x: Math.cos(th) * r,
      y: u,
      z: Math.sin(th) * r,
      taille: 0.10 + alea() * 0.24,
      chaud: alea() < 0.34,
      phase: alea() * Math.PI * 2,
    });
  }

  /* ---- géométrie ---------------------------------------------------------- */
  let L = 0, H = 0, cx = 0, cy = 0, echelle = 1, dpr = 1;

  function jauger() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    L = rect.width;
    H = rect.height;
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = L * 0.55;
    cy = H * 0.32;
    echelle = Math.max(1, L / 460);
  }

  /* ---- constantes --------------------------------------------------------- */
  let angle = 0;
  let phase = 0;
  let dernier = 0;
  const anneaux = [];

  const VITESSE = 2.6;        // rad/s : un tour en ~2,4 s
  const PERIODE = (Math.PI * 2) / VITESSE;

  const R_COEUR = 16;         // rayon du cœur en pixels (avant échelle)
  const FUITE = 34;           // portée des faisceaux
  const OUVERTURE = 3.0;      // largeur du cône au bout
  const TILT = 0.62;          // inclinaison de l'axe magnétique

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
    const impulsion = Math.pow(Math.max(0, Math.cos(angle - TILT)), 16);
    const base = 0.55;

    /* 1. brume lointaine : c'est elle qui donne la profondeur */
    halo(cx, cy, fuite * 3.6, [
      [0, `rgba(148, 200, 255, ${0.05 + impulsion * 0.11})`],
      [0.42, `rgba(92, 146, 255, ${0.028 + impulsion * 0.05})`],
      [1, 'rgba(38, 56, 132, 0)'],
    ]);

    /* 2. les faisceaux, depuis les deux pôles -------------------------------- */
    for (const sens of [1, -1]) {
      const a = angle + (sens > 0 ? 0 : Math.PI);
      const cosA = Math.cos(a), sinA = Math.sin(a);
      const perpX = Math.cos(a + Math.PI / 2), perpY = Math.sin(a + Math.PI / 2);

      /* départ à la surface du pôle */
      const depart = coeur * 0.92;
      const long = fuite * OUVERTURE;
      const sx = cx + cosA * depart, sy = cy + sinA * depart;
      const ex = sx + cosA * long, ey = sy + sinA * long;

      const etroit = coeur * 0.34;
      const large = coeur * 1.30;

      /* nappe extérieure, très diffuse : le halo du faisceau */
      let g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, `rgba(190, 226, 255, ${0.32 * (base + impulsion)})`);
      g.addColorStop(0.45, `rgba(140, 190, 255, ${0.13 * (base + impulsion)})`);
      g.addColorStop(1, 'rgba(110, 150, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx + perpX * etroit * 0.8, sy + perpY * etroit * 0.8);
      ctx.lineTo(ex + perpX * large, ey + perpY * large);
      ctx.lineTo(ex - perpX * large, ey - perpY * large);
      ctx.lineTo(sx - perpX * etroit * 0.8, sy - perpY * etroit * 0.8);
      ctx.closePath();
      ctx.fill();

      /* cône intérieur : plus dense, porte l'éclat */
      const bx = sx + cosA * long * 0.72, by = sy + sinA * long * 0.72;
      g = ctx.createLinearGradient(sx, sy, bx, by);
      g.addColorStop(0, `rgba(240, 250, 255, ${0.88 * (base + impulsion)})`);
      g.addColorStop(0.28, `rgba(200, 230, 255, ${0.38 * (base + impulsion)})`);
      g.addColorStop(1, 'rgba(150, 196, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx + perpX * etroit, sy + perpY * etroit);
      ctx.lineTo(bx + perpX * large * 0.62, by + perpY * large * 0.62);
      ctx.lineTo(bx - perpX * large * 0.62, by - perpY * large * 0.62);
      ctx.lineTo(sx - perpX * etroit, sy - perpY * etroit);
      ctx.closePath();
      ctx.fill();

      /* la tache chaude du pôle, à l'origine du faisceau */
      halo(sx, sy, coeur * (0.40 + impulsion * 0.20), [
        [0, `rgba(255, 255, 255, ${0.82 + impulsion * 0.18})`],
        [0.5, `rgba(206, 232, 255, ${0.34 + impulsion * 0.24})`],
        [1, 'rgba(170, 205, 255, 0)'],
      ]);
    }

    /* 3. anneaux d'impulsion ------------------------------------------------- */
    for (let i = anneaux.length - 1; i >= 0; i--) {
      const an = anneaux[i];
      an.t += dt;
      const k = an.t / 1.7;
      if (k >= 1) { anneaux.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(202, 231, 255, ${0.28 * (1 - k)})`;
      ctx.lineWidth = Math.max(0.6, 1.6 * (1 - k) * echelle);
      ctx.beginPath();
      ctx.arc(cx, cy, coeur * (1.2 + k * 3.8), 0, Math.PI * 2);
      ctx.stroke();
    }

    /* 4. la surface de l'étoile ---------------------------------------------- */

    /* 4a. halo atmosphérique très fin, autour du corps */
    halo(cx, cy, coeur * 1.55, [
      [0, 'rgba(210, 234, 255, 0.30)'],
      [0.62, 'rgba(150, 190, 250, 0.10)'],
      [1, 'rgba(120, 160, 240, 0)'],
    ]);

    /* 4b. corps : plus sombre sur les bords, comme une sphère éclairée */
    halo(cx, cy, coeur, [
      [0, 'rgba(252, 254, 255, 0.99)'],
      [0.42, 'rgba(214, 235, 255, 0.96)'],
      [0.74, 'rgba(168, 202, 252, 0.90)'],
      [0.93, 'rgba(112, 150, 226, 0.72)'],
      [1, 'rgba(60, 90, 170, 0.10)'],
    ]);

    /* 4c. granulation : les cellules tournent avec l'étoile */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 0.96, 0, Math.PI * 2);
    ctx.clip();
    const ca = Math.cos(angle), sa = Math.sin(angle);
    for (const gr of GRAINS) {
      const rx = gr.x * ca - gr.z * sa;
      const rz = gr.x * sa + gr.z * ca;
      if (rz < -0.2) continue;                       // face cachée
      const f = 0.5 + 0.5 * rz;                      // perspective
      const px = cx + rx * coeur * 0.90;
      const py = cy + gr.y * coeur * 0.90;
      const rr = Math.max(0.55, coeur * gr.taille * f * 0.32);
      const scint = 0.55 + 0.45 * Math.sin(phase * 2.2 + gr.phase);
      ctx.fillStyle = gr.chaud
        ? `rgba(255, 246, 230, ${0.34 * f * scint})`
        : `rgba(176, 214, 255, ${0.30 * f * scint})`;
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    /* 4d. liseré du limbe */
    ctx.strokeStyle = 'rgba(236, 247, 255, 0.58)';
    ctx.lineWidth = Math.max(0.7, coeur * 0.05);
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 0.955, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    /* 4e. éclat du cœur, qui monte quand un faisceau nous fait face */
    halo(cx, cy, coeur * (1.25 + impulsion * 0.9), [
      [0, `rgba(255, 255, 255, ${0.42 + impulsion * 0.45})`],
      [0.5, `rgba(226, 242, 255, ${0.14 + impulsion * 0.28})`],
      [1, 'rgba(170, 205, 255, 0)'],
    ]);

    /* 5. voile d'éloignement ------------------------------------------------- */
    ctx.globalCompositeOperation = 'source-over';
    const brume = ctx.createRadialGradient(cx, cy, coeur * 1.3, cx, cy, coeur * 9);
    brume.addColorStop(0, 'rgba(5, 2, 10, 0)');
    brume.addColorStop(0.5, 'rgba(5, 2, 10, 0.07)');
    brume.addColorStop(1, 'rgba(5, 2, 10, 0.24)');
    ctx.fillStyle = brume;
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 9, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- boucle ------------------------------------------------------------- */
  let prochaine = 0;

  function boucle(t) {
    const dt = dernier ? Math.min((t - dernier) / 1000, 0.05) : 0.016;
    dernier = t;
    phase += dt;
    angle += VITESSE * dt;

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
    angle = 0.4;
    phase = 1.2;
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
