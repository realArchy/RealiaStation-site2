/* ============================================================================
   Jumeau numérique — scène 3D interactive (Three.js)

   Trois étapes, une seule scène, aucune dépendance au-delà de Three.js :
     1. flux de signaux (EEG / sEMG)         → ce qu'on capte
     2. squelette cinématique articulé        → comment on l'assiste
     3. harnais, portique et bulle capteurs   → où tout se monte

   Choix assumés :
   - pas d'OrbitControls (module séparé) : la rotation se fait à la main, en
     quinze lignes, ce qui évite une dépendance et un aller-retour réseau ;
   - fond transparent : le dégradé de la page reste visible, la scène s'y pose
     au lieu de la masquer ;
   - géométries construites une fois, animées par transformation : rien n'est
     recréé à chaque image.
   ========================================================================== */

import * as THREE from './vendor/three.module.js';

const COULEURS = {
  violet: 0x7c3aed,
  violetClair: 0xa78bfa,
  or: 0xd4af37,
  orClair: 0xe8c25a,
  lavande: 0xddd6fe,
  encre: 0x4c1d95
};

export function demarrerScene(conteneur, options = {}) {
  const legende = document.getElementById(options.legendeId || 'scene-legende');
  const boutons = Array.from(document.querySelectorAll('[data-etape]'));
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) {
    conteneur.innerHTML =
      '<p style="padding:2rem;text-align:center;color:#6d28d9">' +
      'WebGL indisponible sur cet appareil — la scène 3D est désactivée.</p>';
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  conteneur.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.cursor = 'grab';
  renderer.domElement.style.touchAction = 'none';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.15, 6.0);
  camera.lookAt(0, 0.72, 0);

  // --- lumières : deux sources colorées, pas d'ombre (inutile ici) ---
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6d28d9, 1.05));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(3, 6, 4);
  scene.add(dir);
  const neon = new THREE.PointLight(COULEURS.or, 2.2, 14);
  neon.position.set(-2.6, 2.2, 2.4);
  scene.add(neon);
  const halo = new THREE.PointLight(COULEURS.violetClair, 1.8, 14);
  halo.position.set(2.8, 1.4, 2.6);
  scene.add(halo);

  // --- support : sol discret, pour que les objets ne flottent pas ---
  const sol = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 64),
    new THREE.MeshBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: 0.22 })
  );
  sol.rotation.x = -Math.PI / 2;
  sol.position.y = -1.15;
  scene.add(sol);

  const grille = new THREE.GridHelper(6.4, 16, 0x8b5cf6, 0x4c1d95);
  grille.position.y = -1.14;
  grille.material.transparent = true;
  grille.material.opacity = 0.30;
  scene.add(grille);

  const racine = new THREE.Group();
  scene.add(racine);

  // ========================================================================
  // ÉTAPE 1 — flux de signaux
  // ========================================================================
  const etape1 = new THREE.Group();

  function onde(couleur, amplitude, frequence, vitesse, y, opacite) {
    const N = 240;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat = new THREE.LineBasicMaterial({
      color: couleur, transparent: true, opacity: opacite
    });
    const ligne = new THREE.Line(geo, mat);
    ligne.position.y = y;
    ligne.userData = { N, amplitude, frequence, vitesse };
    return ligne;
  }

  const ondes = [
    onde(COULEURS.or, 0.50, 1.8, 2.1, 0.58, 1.0),
    onde(COULEURS.violetClair, 0.40, 2.6, 1.5, -0.02, 0.95),
    onde(COULEURS.lavande, 0.30, 3.4, 1.1, -0.62, 0.9)
  ];
  ondes.forEach(o => etape1.add(o));

  // électrodes : petits points posés sur la première onde
  const electrodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const electrodes = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), electrodeMat);
    s.userData.x = -2.7 + i * 0.9;
    etape1.add(s);
    electrodes.push(s);
  }

  // ========================================================================
  // ÉTAPE 2 — squelette cinématique
  // ========================================================================
  const etape2 = new THREE.Group();
  etape2.position.y = -0.15;

  const matOs = new THREE.MeshStandardMaterial({
    color: COULEURS.violet, metalness: 0.35, roughness: 0.35,
    emissive: new THREE.Color(COULEURS.violet), emissiveIntensity: 0.18
  });
  const matArticulation = new THREE.MeshStandardMaterial({
    color: COULEURS.or, metalness: 0.6, roughness: 0.25,
    emissive: new THREE.Color(COULEURS.or), emissiveIntensity: 0.55
  });

  function os(longueur, rayon = 0.055) {
    // cylindre dont le sommet est à l'origine : on peut le faire tourner
    // autour de l'articulation, comme un segment anatomique.
    const g = new THREE.CylinderGeometry(rayon, rayon, longueur, 12);
    g.translate(0, -longueur / 2, 0);
    return new THREE.Mesh(g, matOs);
  }

  function articulation(rayon = 0.085) {
    return new THREE.Mesh(new THREE.SphereGeometry(rayon, 16, 16), matArticulation);
  }

  // bassin
  const bassin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.26), matOs);
  bassin.position.y = 1.02;
  etape2.add(bassin);

  // colonne
  const colonne = os(0.62, 0.05);
  colonne.position.y = 1.02;
  colonne.rotation.x = Math.PI; // vers le haut
  etape2.add(colonne);

  const thorax = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.30, 0.22), matOs);
  thorax.position.y = 1.62;
  etape2.add(thorax);

  const hanches = [];
  [-1, 1].forEach(cote => {
    const hanche = articulation(0.075);
    hanche.position.set(0.2 * cote, 1.0, 0);
    etape2.add(hanche);

    const cuisse = os(0.72);
    cuisse.position.set(0.2 * cote, 1.0, 0);
    etape2.add(cuisse);

    const genou = articulation(0.065);
    etape2.add(genou);

    const tibia = os(0.68);
    etape2.add(tibia);

    const pied = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.30), matOs);
    etape2.add(pied);

    hanches.push({ cote, cuisse, genou, tibia, pied });
  });

  // ========================================================================
  // ÉTAPE 3 — harnais, portique, bulle de capteurs
  // ========================================================================
  const etape3 = new THREE.Group();
  etape3.position.y = -0.15;

  const matStructure = new THREE.MeshStandardMaterial({
    color: 0x9f7aea, metalness: 0.7, roughness: 0.25
  });
  const matSangle = new THREE.MeshStandardMaterial({
    color: COULEURS.or, metalness: 0.2, roughness: 0.6,
    emissive: new THREE.Color(COULEURS.or), emissiveIntensity: 0.25
  });

  // deux montants + rail supérieur
  [-1.15, 1.15].forEach(x => {
    const montant = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.0, 12), matStructure);
    montant.position.set(x, 0.35, 0);
    etape3.add(montant);
  });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.075, 0.075), matStructure);
  rail.position.y = 1.86;
  etape3.add(rail);

  // barres parallèles (le repère gestuel et la protection latérale)
  [-1.15, 1.15].forEach(x => {
    const barre = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.9, 10), matStructure);
    barre.rotation.x = Math.PI / 2;      // axe de marche (Z), pas la largeur (X)
    barre.position.set(x, 0.12, 0);
    etape3.add(barre);
  });

  // sangle de délestage : du rail au harnais
  const sangle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 8), matSangle);
  sangle.position.set(0, 1.35, 0);
  etape3.add(sangle);

  // harnais pelvien et thoracique
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.035, 10, 40), matSangle);
  pelvis.rotation.x = Math.PI / 2;
  pelvis.position.y = 0.82;
  etape3.add(pelvis);

  const thoraxHarnais = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 10, 40), matSangle);
  thoraxHarnais.rotation.x = Math.PI / 2;
  thoraxHarnais.position.y = 1.24;
  etape3.add(thoraxHarnais);

  [-1, 1].forEach(c => {
    const laniere = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.46, 8), matSangle);
    laniere.position.set(0.16 * c, 1.03, 0);
    laniere.rotation.z = 0.12 * c;
    etape3.add(laniere);
  });

  // silhouette simplifiée, pour donner l'échelle
  const corps = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.72, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xede9fe, transparent: true, opacity: 0.85, roughness: 0.8 })
  );
  corps.position.y = 0.96;
  etape3.add(corps);
  const tete = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xfbcfe8, transparent: true, opacity: 0.9, roughness: 0.7 })
  );
  tete.position.y = 1.52;
  etape3.add(tete);

  // bulle de capteurs : une sphère filaire + les nœuds
  const bulle = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 18, 14),
    new THREE.MeshBasicMaterial({
      color: COULEURS.violetClair, wireframe: true, transparent: true, opacity: 0.22
    })
  );
  bulle.position.y = 1.0;
  etape3.add(bulle);

  const noeuds = [];
  const matNoeud = new THREE.MeshBasicMaterial({ color: COULEURS.or });
  const positionsCapteurs = [
    [0, 1.52, 0.16],   // IMU thorax
    [0, 0.82, 0.22],   // IMU bassin
    [-0.30, 1.24, 0],  // EMG
    [0.30, 1.24, 0],
    [0, 0.30, 0.30],   // LiDAR sol
    [0.62, 1.00, 0],   // radar
    [-0.62, 1.00, 0]
  ];
  positionsCapteurs.forEach(([x, y, z]) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), matNoeud);
    n.position.set(x, y, z);
    etape3.add(n);
    noeuds.push(n);
  });

  // ========================================================================
  // montage : une seule étape visible à la fois
  // ========================================================================
  const etapes = [etape1, etape2, etape3];
  racine.add(etape1, etape2, etape3);

  let courante = 0;

  const legendes = [
    'Étape 1 — Le flux : ondes EEG et sEMG, ce que les capteurs lisent avant toute décision.',
    'Étape 2 — La cinématique : hanche et genou articulés, la géométrie à régler avant d’usiner.',
    'Étape 3 — Le montage : harnais, portique de délestage et bulle de capteurs.'
  ];

  function choisir(i) {
    courante = i;
    etapes.forEach((e, k) => { e.visible = k === i; });
    // Les couleurs restent dans la feuille de style. Écrites ici en ligne, elles
    // gardaient l'ancienne palette violette : contraste 3,04, sous le seuil de 4,5.
    boutons.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
    if (legende) legende.textContent = legendes[i];
  }
  boutons.forEach((b, k) => b.addEventListener('click', () => choisir(k)));
  choisir(0);

  // --- rotation à la souris / au doigt ---
  let glisse = false, dernierX = 0, dernierY = 0;
  let rotY = -0.35, rotX = 0.08;
  let auto = true;

  renderer.domElement.addEventListener('pointerdown', e => {
    glisse = true; auto = false;
    dernierX = e.clientX; dernierY = e.clientY;
    renderer.domElement.style.cursor = 'grabbing';
  });
  window.addEventListener('pointerup', () => {
    glisse = false;
    renderer.domElement.style.cursor = 'grab';
  });
  window.addEventListener('pointermove', e => {
    if (!glisse) return;
    rotY += (e.clientX - dernierX) * 0.007;
    rotX += (e.clientY - dernierY) * 0.004;
    rotX = Math.max(-0.7, Math.min(0.7, rotX));
    dernierX = e.clientX; dernierY = e.clientY;
  });

  // --- redimensionnement : on observe le conteneur, pas la fenêtre ---
  function redimensionner() {
    const l = conteneur.clientWidth || 640;
    const h = conteneur.clientHeight || 420;
    renderer.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }
  redimensionner();
  if ('ResizeObserver' in window) new ResizeObserver(redimensionner).observe(conteneur);
  else window.addEventListener('resize', redimensionner);

  // --- boucle d'animation ---
  const horloge = new THREE.Clock();

  /* 30 images par seconde au lieu de 60 : une onde qui défile à cette vitesse
     ne se voit pas plus lente, et le fil principal respire. Mesuré par
     Lighthouse : cette scène pesait 11 s de travail sur le fil principal. */
  let derniereImage = 0;

  function animer(horodatage) {
    requestAnimationFrame(animer);
    if (horodatage && horodatage - derniereImage < 33) return;
    derniereImage = horodatage || 0;

    const t = horloge.getElapsedTime();
    const dt = Math.min(horloge.getDelta(), 0.05);

    // étape 1 : les ondes défilent
    ondes.forEach(o => {
      const { N, amplitude, frequence, vitesse } = o.userData;
      const pos = o.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const x = -3.2 + (i / (N - 1)) * 6.4;
        const enveloppe = Math.exp(-x * x * 0.06);
        const y = Math.sin(x * frequence + t * vitesse) * amplitude * enveloppe
                + Math.sin(x * frequence * 2.7 - t * vitesse * 0.7) * amplitude * 0.28 * enveloppe;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.cos(x * 1.2 + t * 0.6) * 0.12;
      }
      o.geometry.attributes.position.needsUpdate = true;
    });
    electrodes.forEach((e, i) => {
      e.position.x = e.userData.x;
      e.position.y = 0.55 + Math.sin(e.userData.x * 1.8 + t * 2.1) * 0.30;
      e.position.z = Math.cos(e.userData.x * 1.2 + t * 0.6) * 0.10;
      e.scale.setScalar(0.85 + Math.sin(t * 3 + i) * 0.18);
    });

    // étape 2 : cycle de marche simplifié
    hanches.forEach(({ cote, cuisse, genou, tibia, pied }) => {
      const phase = t * 2.0 + (cote > 0 ? Math.PI : 0);
      const angleHanche = Math.sin(phase) * 0.42;
      const angleGenou = -Math.max(0, Math.sin(phase + 1.1)) * 0.85;

      cuisse.rotation.x = angleHanche;
      // position du genou = hanche + segment tourné
      const hx = 0.2 * cote, hy = 1.0;
      const kx = hx;
      const ky = hy - Math.cos(angleHanche) * 0.72;
      const kz = Math.sin(angleHanche) * 0.72 * -1;
      genou.position.set(kx, ky, kz);

      tibia.position.set(kx, ky, kz);
      tibia.rotation.x = angleHanche + angleGenou;

      const ay = ky - Math.cos(angleHanche + angleGenou) * 0.68;
      const az = kz - Math.sin(angleHanche + angleGenou) * 0.68;
      pied.position.set(kx, ay - 0.03, az - 0.10);
      pied.rotation.x = 0;
    });

    // étape 3 : la bulle respire, les nœuds clignotent
    bulle.rotation.y += dt * 0.25;
    noeuds.forEach((n, i) => {
      const s = 0.85 + Math.sin(t * 2.4 + i * 0.9) * 0.28;
      n.scale.setScalar(s);
    });
    neon.intensity = 2.0 + Math.sin(t * 1.6) * 0.5;

    // rotation de l'ensemble
    if (auto && !reduit) rotY += dt * 0.18;
    racine.rotation.y = rotY;
    racine.rotation.x = rotX;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animer);

  // exposé pour la vérification automatique
  window.__scene3d = {
    prete: true,
    etapes: etapes.length,
    courante: () => courante,
    choisir
  };

  return { scene, camera, renderer };
}
