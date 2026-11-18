/* ============================================================================
   LUNAGALAXIE — une galaxie spirale en 3D (Three.js / WebGL)
   ----------------------------------------------------------------------------
   Remplace l'image plate de la page LunaGalaxie par une vraie galaxie :
   ~18 000 étoiles réparties sur quatre bras spiraux, un cœur doré, des bras
   qui glissent vers le bleu puis le violet, le tout en AdditiveBlending.

   Fluidité : 60 i/s visés, 30 si l'appareil peine, pause hors écran et onglet
   caché, rien du tout si `prefers-reduced-motion`.
   ========================================================================== */

import * as THREE from './vendor/three.module.js';

const NOMBRE = 18000;
const BRAS = 4;
const RAYON_MAX = 4.4;
const TEINTE_COEUR = new THREE.Color(0xffe9b8);
const TEINTE_OR = new THREE.Color(0xffd27d);
const TEINTE_BLEU = new THREE.Color(0x4f7cff);
const TEINTE_VIOLET = new THREE.Color(0x8a2be2);

const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ étoiles */
function etoileDouce() {
  const taille = 64;
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(taille / 2, taille / 2, 0, taille / 2, taille / 2, taille / 2);
  d.addColorStop(0, 'rgba(255,255,255,1)');
  d.addColorStop(0.35, 'rgba(255,255,255,.55)');
  d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, taille, taille);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function nuage() {
  const geometrie = new THREE.BufferGeometry();
  const positions = new Float32Array(NOMBRE * 3);
  const couleurs = new Float32Array(NOMBRE * 3);
  const tailles = new Float32Array(NOMBRE);
  const teinte = new THREE.Color();

  for (let i = 0; i < NOMBRE; i++) {
    const bras = i % BRAS;
    // plus dense au centre : la puissance pousse les tirages vers 0
    const alea = Math.pow(Math.random(), 1.7);
    const rayon = 0.18 + alea * RAYON_MAX;
    const part = rayon / RAYON_MAX;

    // enroulement du bras + dispersion organique
    const angle = (bras / BRAS) * Math.PI * 2
      + rayon * 1.55
      + (Math.random() - 0.5) * (0.55 - 0.32 * part);

    const epaisseur = 0.05 + 0.22 / (1 + rayon * 1.6);
    const dispersion = 0.05 + 0.16 * part;

    const x = Math.cos(angle) * rayon + (Math.random() - 0.5) * dispersion * 2;
    const z = Math.sin(angle) * rayon + (Math.random() - 0.5) * dispersion * 2;
    const y = (Math.random() - 0.5) * epaisseur * 2;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // cœur blanc-or → or → bleu électrique → violet nébuleux
    if (part < 0.30) {
      teinte.copy(TEINTE_COEUR).lerp(TEINTE_OR, part / 0.30);
    } else if (part < 0.62) {
      teinte.copy(TEINTE_OR).lerp(TEINTE_BLEU, (part - 0.30) / 0.32);
    } else {
      teinte.copy(TEINTE_BLEU).lerp(TEINTE_VIOLET, (part - 0.62) / 0.38);
    }
    // une étoile sur douze tire vers le blanc : le scintillement du disque
    if (Math.random() < 0.08) teinte.lerp(new THREE.Color(0xffffff), 0.55);
    couleurs[i * 3] = teinte.r;
    couleurs[i * 3 + 1] = teinte.g;
    couleurs[i * 3 + 2] = teinte.b;

    tailles[i] = 0.55 + Math.random() * 0.85 + (part < 0.2 ? 0.5 : 0);
  }

  geometrie.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometrie.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
  geometrie.setAttribute('taille', new THREE.BufferAttribute(tailles, 1));
  return geometrie;
}

/* -------------------------------------------------------------------- scène */
function demarrer() {
  const hote = document.querySelector('.ciel');
  if (!hote) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'galaxie-fond';
  canvas.setAttribute('aria-hidden', 'true');
  hote.appendChild(canvas);

  const rendu = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: true, powerPreference: 'high-performance',
  });
  rendu.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 2.0, 10.2);
  camera.lookAt(0, 0, 0);

  const galaxie = new THREE.Group();
  galaxie.rotation.x = -0.62;      // ≈ 35° : on voit le volume et les bras
  galaxie.rotation.z = 0.22;
  galaxie.scale.setScalar(0.95);   // la galaxie tient dans le cadre
  galaxie.position.set(1.15, -0.55, 0);   // le cœur passe sous l'image, à droite
  scene.add(galaxie);

  const texture = etoileDouce();
  const materiau = new THREE.PointsMaterial({
    size: 0.075,
    map: texture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    opacity: 1,
  });
  galaxie.add(new THREE.Points(nuage(), materiau));

  // le cœur : un halo chaud qui déborde du disque
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, color: 0xffe3a8, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.38,
  }));
  halo.scale.setScalar(1.6);
  galaxie.add(halo);

  /* ------------------------------------------------------- dimensionnement */
  let qualite = 2;                       // 2 = complet, 1 = réduit
  function dimensionner() {
    const l = window.innerWidth;
    const h = window.innerHeight;
    rendu.setPixelRatio(qualite === 2 ? Math.min(window.devicePixelRatio || 1, 1.75) : 1);
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }
  dimensionner();
  window.addEventListener('resize', dimensionner, { passive: true });

  /* --------------------------------------------------------- interaction */
  let cibleX = 0, cibleY = 0, douxX = 0, douxY = 0;
  window.addEventListener('mousemove', (e) => {
    cibleX = (e.clientX / window.innerWidth) * 2 - 1;
    cibleY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ------------------------------------------------------------- boucle */
  let enPause = false;
  document.addEventListener('visibilitychange', () => { enPause = document.hidden; });

  let derniere = 0;
  let cumul = 0;
  let images = 0;
  let alertes = 0;
  let chauffe = 0;

  function boucle(t) {
    requestAnimationFrame(boucle);
    if (enPause) return;

    const dt = derniere ? Math.min((t - derniere) / 1000, 0.05) : 0.016;
    derniere = t;

    // mesure de cadence : on ne dégrade qu'après le démarrage
    if (chauffe < 90) {
      chauffe += 1;
    } else {
      cumul += dt * 1000;
      images += 1;
      if (images >= 45) {
        const moyenne = cumul / images;
        if (moyenne > 21) {
          alertes += 1;
          if (alertes >= 2 && qualite === 2) { qualite = 1; dimensionner(); }
        } else {
          alertes = 0;
        }
        cumul = 0;
        images = 0;
      }
    }

    douxX += (cibleX - douxX) * 0.04;
    douxY += (cibleY - douxY) * 0.04;

    galaxie.rotation.y += dt * 0.055;
    galaxie.rotation.x = -0.62 + douxY * 0.06;
    camera.position.x = 1.7 + douxX * 0.5;
    camera.position.y = 2.1 + douxY * 0.35;
    camera.lookAt(0, 0, 0);

    rendu.render(scene, camera);
  }

  if (reduit) {
    rendu.render(scene, camera);
  } else {
    requestAnimationFrame(boucle);
  }

  window.__galaxie = {
    particules: NOMBRE,
    qualite: () => qualite,
    scene, camera, rendu,
  };
  return window.__galaxie;
}

demarrer();
