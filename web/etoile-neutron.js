/* ============================================================================
   ÉTOILE À NEUTRONS — page de l'application (thème : la communication)

   Le modèle, et c'est celui que ce dessin suit :

   · l'étoile tourne autour d'un AXE DE ROTATION fixe (ici, vertical) ;
   · l'axe MAGNÉTIQUE est incliné de α par rapport à cet axe (ici ≈ 54°) ;
   · les faisceaux naissent aux PÔLES magnétiques : leur base est clouée sur la
     surface de l'étoile et tourne avec elle ; leur extrémité décrit un cercle
     dans l'espace — c'est le cône de balayage du pulsar ;
   · le faisceau est un cône étroit et creux (1 à 10° d'ouverture) ;
   · quand ce cône balaie notre direction, on reçoit un éclat bref : le pulse.

   Les faisceaux ne traversent donc pas l'étoile comme une barre : celui qui
   part du pôle éloigné passe DERRIÈRE le corps, on ne le voit que par ses bords.

   Rendu 2D sur canvas, projection perspective maison, graine fixe.
   ========================================================================= */
(() => {
  const canvas = document.getElementById('etoile-neutron');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const alea = mulberry32(20261120);

  /* ---- granulation posée sur la sphère ----------------------------------- */
  const GRAINS = [];
  for (let i = 0; i < 130; i++) {
    const u = alea() * 2 - 1;
    const th = alea() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - u * u));
    GRAINS.push({ x: Math.cos(th) * r, y: u, z: Math.sin(th) * r,
                  taille: 0.12 + alea() * 0.24, phase: alea() * Math.PI * 2 });
  }

  let L = 0, H = 0, cx = 0, cy = 0, echelle = 1, dpr = 1;

  function jauger() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    L = rect.width; H = rect.height;
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = L * 0.56;
    cy = H * 0.34;
    echelle = Math.max(1, L / 460);
  }

  /* ---- constantes --------------------------------------------------------- */
  let theta = 0;          // angle de rotation de l'étoile
  let phase = 0;
  let dernier = 0;
  const anneaux = [];

  const VITESSE = 2.2;            // rad/s : un tour en ~2,9 s
  const R = 15;                   // rayon de l'étoile en px
  const ALPHA = 0.44;             // inclinaison de l'axe magnétique (≈ 25°)
  const LONGUEUR = 8.4;           // longueur des faisceaux, en rayons
  const DEMI_ANGLE = 0.05;        // demi-ouverture du cône ≈ 2,9°
  const TILT_ECRAN = -0.22;       // on voit l'axe de rotation un peu de biais

  /* projection perspective : z positif = vers le spectateur */
  function proj(v, k) {
    const p = 1 / (1 - v[2] * 0.20);
    return [cx + v[0] * k * p, cy - v[1] * k * p, v[2], p];
  }

  /* axe magnétique à l'instant theta : incliné de ALPHA, tournant autour de Y */
  function axeMag(t) {
    return [Math.sin(ALPHA) * Math.cos(t), Math.cos(ALPHA), Math.sin(ALPHA) * Math.sin(t)];
  }

  function halo(x, y, r, couleurs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [pos, col] of couleurs) g.addColorStop(pos, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- un faisceau : base clouée au pôle, extrémité qui balaie un cercle -- */
  function faisceau(m, sens, k, alphaGlobal) {
    const base3 = [m[0] * sens, m[1] * sens, m[2] * sens];
    const bout3 = [m[0] * sens * LONGUEUR, m[1] * sens * LONGUEUR, m[2] * sens * LONGUEUR];

    const b = proj(base3, k);
    const t = proj(bout3, k);

    /* base posée sur la surface, pas au centre */
    const dx = t[0] - b[0], dy = t[1] - b[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;      // perpendiculaire à l'écran

    const largeurBout = len * Math.tan(DEMI_ANGLE) * 1.6;
    const largeurBase = k * 0.06;

    /* corps du cône : presque rien, c'est du vide */
    const g = ctx.createLinearGradient(b[0], b[1], t[0], t[1]);
    const a = alphaGlobal;
    g.addColorStop(0, `rgba(170, 210, 255, ${0.16 * a})`);
    g.addColorStop(0.35, `rgba(160, 200, 255, ${0.07 * a})`);
    g.addColorStop(1, 'rgba(130, 170, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(b[0] + px * largeurBase, b[1] + py * largeurBase);
    ctx.lineTo(t[0] + px * largeurBout, t[1] + py * largeurBout);
    ctx.lineTo(t[0] - px * largeurBout, t[1] - py * largeurBout);
    ctx.lineTo(b[0] - px * largeurBase, b[1] - py * largeurBase);
    ctx.closePath();
    ctx.fill();

    /* les deux bords du cône creux */
    for (const s of [1, -1]) {
      const gb = ctx.createLinearGradient(b[0], b[1], t[0], t[1]);
      gb.addColorStop(0, `rgba(214, 236, 255, ${0.30 * a})`);
      gb.addColorStop(0.5, `rgba(200, 228, 255, ${0.14 * a})`);
      gb.addColorStop(1, 'rgba(150, 190, 255, 0)');
      ctx.strokeStyle = gb;
      ctx.lineWidth = Math.max(0.5, 0.75 * echelle);
      ctx.beginPath();
      ctx.moveTo(b[0] + px * largeurBase * s, b[1] + py * largeurBase * s);
      ctx.lineTo(t[0] + px * largeurBout * s, t[1] + py * largeurBout * s);
      ctx.stroke();
    }

    /* l'axe du faisceau, mince et vif */
    const gc = ctx.createLinearGradient(b[0], b[1], t[0], t[1]);
    gc.addColorStop(0, `rgba(248, 252, 255, ${0.72 * a})`);
    gc.addColorStop(0.4, `rgba(212, 236, 255, ${0.24 * a})`);
    gc.addColorStop(1, 'rgba(160, 200, 255, 0)');
    ctx.strokeStyle = gc;
    ctx.lineWidth = Math.max(0.6, 1.05 * echelle);
    ctx.beginPath();
    ctx.moveTo(b[0], b[1]);
    ctx.lineTo(t[0], t[1]);
    ctx.stroke();

    /* la tache du pôle, à la base */
    halo(b[0], b[1], k * 0.34, [
      [0, `rgba(255, 255, 255, ${0.55 * a})`],
      [0.5, `rgba(208, 234, 255, ${0.26 * a})`],
      [1, 'rgba(170, 205, 255, 0)'],
    ]);
  }

  function dessiner(dt) {
    ctx.clearRect(0, 0, L, H);
    ctx.globalCompositeOperation = 'lighter';

    const k = R * echelle;
    const m = axeMag(theta);

    /* le pulse : l'éclat arrive quand un cône balaie notre direction */
    const versNous = Math.abs(m[2]) / Math.sin(ALPHA);   // 1 quand un cône nous vise
    const frac = (phase % (Math.PI * 2 / VITESSE)) / (Math.PI * 2 / VITESSE);
    const court = frac < 0.06 ? Math.sin((frac / 0.06) * Math.PI) : 0;
    const impulsion = Math.max(Math.pow(versNous, 12) * 0.9, court * 0.75);

    /* 1. brume lointaine */
    halo(cx, cy, k * 5.4, [
      [0, `rgba(118, 168, 255, ${0.026 + impulsion * 0.045})`],
      [0.5, 'rgba(70, 110, 220, 0.012)'],
      [1, 'rgba(30, 45, 110, 0)'],
    ]);

    /* 2. le faisceau du pôle ÉLOIGNÉ : il passe derrière le corps */
    const sensDevant = m[2] >= 0 ? 1 : -1;
    faisceau(m, -sensDevant, k, 0.16 + impulsion * 0.10);

    /* 3. anneaux de pulse */
    for (let i = anneaux.length - 1; i >= 0; i--) {
      const an = anneaux[i];
      an.t += dt;
      const q = an.t / 1.1;
      if (q >= 1) { anneaux.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(198, 228, 255, ${0.18 * (1 - q)})`;
      ctx.lineWidth = Math.max(0.5, 1.0 * (1 - q) * echelle);
      ctx.beginPath();
      ctx.arc(cx, cy, k * (1.1 + q * 3.0), 0, Math.PI * 2);
      ctx.stroke();
    }

    /* 4. lignes de champ, alignées sur l'axe magnétique */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, k * 4.2, 0, Math.PI * 2);
    ctx.arc(cx, cy, k * 1.02, 0, Math.PI * 2, true);
    ctx.clip();
    const angEcran = Math.atan2(-m[1], m[0]) + TILT_ECRAN;
    ctx.lineWidth = Math.max(0.4, 0.55 * echelle);
    for (let i = 1; i <= 3; i++) {
      ctx.strokeStyle = `rgba(146, 186, 255, ${0.15 / i})`;
      for (const demi of [0, Math.PI]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, k * (1.1 + i * 0.85), k * (0.8 + i * 0.62), angEcran, demi, demi + Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();

    /* 5. le corps */
    halo(cx, cy, k * 1.16, [
      [0, 'rgba(206, 230, 255, 0.55)'],
      [0.7, 'rgba(140, 180, 245, 0.28)'],
      [1, 'rgba(80, 120, 210, 0)'],
    ]);
    halo(cx, cy, k, [
      [0, 'rgba(255, 255, 255, 0.98)'],
      [0.30, 'rgba(233, 245, 255, 0.97)'],
      [0.62, 'rgba(186, 214, 252, 0.93)'],
      [0.86, 'rgba(130, 170, 236, 0.82)'],
      [0.97, 'rgba(84, 122, 200, 0.45)'],
      [1, 'rgba(48, 78, 158, 0)'],
    ]);

    /* granulation : elle tourne avec l'étoile */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, k * 0.97, 0, Math.PI * 2);
    ctx.clip();
    const ca = Math.cos(theta), sa = Math.sin(theta);
    for (const gr of GRAINS) {
      const rx = gr.x * ca - gr.z * sa;
      const rz = gr.x * sa + gr.z * ca;
      if (rz < -0.2) continue;
      const f = 0.5 + 0.5 * rz;
      const s = proj([rx, gr.y, rz], k * 0.96);
      const rr = Math.max(0.45, k * gr.taille * f * 0.26);
      const scint = 0.6 + 0.4 * Math.sin(phase * 2.0 + gr.phase);
      ctx.fillStyle = `rgba(176, 210, 255, ${0.22 * f * scint})`;
      ctx.beginPath();
      ctx.arc(s[0], s[1], rr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* 6. le faisceau du pôle PROCHE : devant le corps, base sur la surface */
    faisceau(m, sensDevant, k, 0.75 + impulsion * 0.25);

    /* 7. éclat du pulse */
    if (impulsion > 0.02) {
      halo(cx, cy, k * (1.1 + impulsion * 1.3), [
        [0, `rgba(255, 255, 255, ${0.34 * impulsion})`],
        [0.5, `rgba(226, 242, 255, ${0.12 * impulsion})`],
        [1, 'rgba(170, 205, 255, 0)'],
      ]);
    }

    /* 8. voile d'éloignement */
    ctx.globalCompositeOperation = 'source-over';
    const brume = ctx.createRadialGradient(cx, cy, k * 1.6, cx, cy, k * 7.5);
    brume.addColorStop(0, 'rgba(5, 2, 10, 0)');
    brume.addColorStop(0.5, 'rgba(5, 2, 10, 0.05)');
    brume.addColorStop(1, 'rgba(5, 2, 10, 0.20)');
    ctx.fillStyle = brume;
    ctx.beginPath();
    ctx.arc(cx, cy, k * 7.5, 0, Math.PI * 2);
    ctx.fill();
  }

  let prochain = 0;
  function boucle(t) {
    const dt = dernier ? Math.min((t - dernier) / 1000, 0.05) : 0.016;
    dernier = t;
    phase += dt;
    theta += VITESSE * dt;

    const tours = phase / (Math.PI * 2 / VITESSE);
    if (tours > prochain) {
      prochain = tours + 1;
      anneaux.push({ t: 0 });
      if (anneaux.length > 3) anneaux.shift();
    }

    dessiner(dt);
    requestAnimationFrame(boucle);
  }

  jauger();
  if (calme) {
    theta = 0.9;
    dessiner(0);
  } else {
    let attente = false;
    addEventListener('resize', () => {
      if (attente) return;
      attente = true;
      requestAnimationFrame(() => { jauger(); attente = false; });
    });
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { dernier = 0; requestAnimationFrame(boucle); }
    }, { threshold: 0 });
    io.observe(canvas);
    requestAnimationFrame(boucle);
  }
})();
