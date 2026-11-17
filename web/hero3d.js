/* ============================================================================
   Hero — réseau neuronal 3D (Three.js) + bascule de perspective du titre.

   Le réseau occupe le fond du hero : des nœuds répartis sur une sphère, reliés
   quand ils sont proches, tournant lentement. La souris incline l'ensemble et
   allume les nœuds qu'elle approche.

   Choix tenus pour la fluidité (leçon des versions précédentes) :
   - une seule géométrie d'arêtes, calculée une fois, jamais reconstruite ;
   - cadence plafonnée à 30 i/s, pause dès que l'onglet est caché ou que le hero
     sort de l'écran ;
   - pas de rendu pendant un défilement ;
   - DPR plafonné à 1.5, et rien du tout si `prefers-reduced-motion`.
   ========================================================================== */

import * as THREE from './vendor/three.module.js';

const CYAN = 0x8b5cf6;   // violet
const MAGENTA = 0xd4af37;   // or

export function demarrerHero(canvas) {
  if (!canvas) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    return; // pas de WebGL : le décor CSS reste, rien ne casse
  }

  const parent = canvas.parentElement;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const groupe = new THREE.Group();
  scene.add(groupe);

  // --- nœuds : répartition de Fibonacci sur une sphère, avec du bruit -------
  const N = 64;
  const positions = [];
  const couleurs = [];
  const or = new THREE.Color(CYAN);
  const mag = new THREE.Color(MAGENTA);

  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 2.15 + (Math.random() - 0.5) * 0.32;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
    const c = or.clone().lerp(mag, (z + r) / (2 * r));
    couleurs.push(c.r, c.g, c.b);
  }

  const geoNoeuds = new THREE.BufferGeometry();
  geoNoeuds.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geoNoeuds.setAttribute('color', new THREE.Float32BufferAttribute(couleurs, 3));

  // sprite rond, dessiné une fois : pas de texture à télécharger
  const tex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,.85)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const points = new THREE.Points(geoNoeuds, new THREE.PointsMaterial({
    size: 0.13, map: tex, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  }));
  groupe.add(points);

  // --- arêtes : paires proches, calculées une seule fois --------------------
  const seuil = 1.35;
  const segments = [];
  const segCouleurs = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
      const bx = positions[j * 3], by = positions[j * 3 + 1], bz = positions[j * 3 + 2];
      const d = Math.hypot(ax - bx, ay - by, az - bz);
      if (d < seuil) {
        segments.push(ax, ay, az, bx, by, bz);
        const ca = new THREE.Color(couleurs[i * 3], couleurs[i * 3 + 1], couleurs[i * 3 + 2]);
        const cb = new THREE.Color(couleurs[j * 3], couleurs[j * 3 + 1], couleurs[j * 3 + 2]);
        segCouleurs.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
      }
    }
  }
  const geoAretes = new THREE.BufferGeometry();
  geoAretes.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
  geoAretes.setAttribute('color', new THREE.Float32BufferAttribute(segCouleurs, 3));

  const aretes = new THREE.LineSegments(geoAretes, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending
  }));
  groupe.add(aretes);

  // --- halo derrière le réseau ---------------------------------------------
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 24, 18),
    new THREE.MeshBasicMaterial({ color: MAGENTA, transparent: true, opacity: 0.045, side: THREE.BackSide })
  );
  groupe.add(halo);

  // --- interaction ---------------------------------------------------------
  const souris = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    souris.tx = (e.clientX / window.innerWidth) * 2 - 1;
    souris.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // --- bascule 3D du bloc titre -------------------------------------------
  const contenu = document.querySelector('.hero-contenu');
  if (contenu && !reduit) {
    let rx = 0, ry = 0, cibleX = 0, cibleY = 0;
    window.addEventListener('pointermove', (e) => {
      const px = (e.clientX / window.innerWidth) * 2 - 1;
      const py = (e.clientY / window.innerHeight) * 2 - 1;
      cibleY = px * 6;      // degrés
      cibleX = -py * 4;
    }, { passive: true });
    (function incliner() {
      rx += (cibleX - rx) * 0.06;
      ry += (cibleY - ry) * 0.06;
      contenu.style.transform =
        'perspective(1200px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      requestAnimationFrame(incliner);
    })();
  }

  // --- dimension et cadence ------------------------------------------------
  function dimensionner() {
    const l = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    renderer.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }
  dimensionner();
  if ('ResizeObserver' in window) new ResizeObserver(dimensionner).observe(parent);
  else window.addEventListener('resize', dimensionner);

  let enPause = false;
  let defile = false;
  let dernier = 0;
  let minuteur = null;

  window.addEventListener('scroll', () => {
    defile = true;
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { defile = false; dernier = 0; }, 180);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => { enPause = document.hidden; });

  // Le hero sort de l'écran dès qu'on descend : inutile de continuer à rendre.
  let heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { heroVisible = e.isIntersecting; });
    }, { threshold: 0.01 }).observe(canvas.parentElement);
  }

  const horloge = new THREE.Clock();

  function boucle(t) {
    requestAnimationFrame(boucle);
    if (enPause || defile || !heroVisible) return;
    if (t - dernier < 33) return;         // 30 i/s
    dernier = t;

    const dt = Math.min(horloge.getDelta(), 0.05);

    // la souris incline et décale légèrement l'ensemble
    souris.x += (souris.tx - souris.x) * 0.05;
    souris.y += (souris.ty - souris.y) * 0.05;

    groupe.rotation.y += dt * 0.16;
    groupe.rotation.x = souris.y * 0.22;
    groupe.position.x = souris.x * 0.35;

    halo.rotation.y -= dt * 0.06;

    renderer.render(scene, camera);
  }

  if (reduit) {
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(boucle);
  }

  window.__hero3d = { prete: true, noeuds: N, aretes: segments.length / 6 };
  return { scene, camera, renderer };
}
