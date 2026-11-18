/* ============================================================================
   LUNAGALAXIE — galaxie spirale photoréaliste (Three.js / WebGL)
   ----------------------------------------------------------------------------
   Deux couches, comme une vraie photo d'amas :
     · un gaz nébuleux, grosses particules très peu opaques (0,08), qui donne
       le nuage continu des bras ;
     · 30 000 étoiles fines, tailles variées, concentrées dans un bulbe
       central doré et le long des bras.

   Aucune interaction à la souris : la galaxie tourne sur elle-même, lentement,
   comme la Terre de l'accueil. Rien ne bascule quand on déplace le curseur.
   ========================================================================== */

import * as THREE from './vendor/three.module.js';

const ETOILES = 30000;
const GAZ = 4200;
const BRAS = 4;
const RAYON_MAX = 4.4;

const OR_CLAIR = new THREE.Color(0xffe9b8);
const OR = new THREE.Color(0xffc978);
const BLEU = new THREE.Color(0x4f7cff);
const VIOLET = new THREE.Color(0x8a2be2);

const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------- texture d'étoile douce */
function textureDouce() {
  const taille = 128;
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(taille / 2, taille / 2, 0, taille / 2, taille / 2, taille / 2);
  d.addColorStop(0, 'rgba(255,255,255,1)');
  d.addColorStop(0.18, 'rgba(255,255,255,.75)');
  d.addColorStop(0.45, 'rgba(255,255,255,.22)');
  d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, taille, taille);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------- géométrie des bras */
function pointDeBras(rayonMax) {
  const alea = Math.pow(Math.random(), 1.6);
  const rayon = 0.12 + alea * rayonMax;
  const bras = Math.floor(Math.random() * BRAS);
  const angle = (bras / BRAS) * Math.PI * 2
    + rayon * 1.38
    + (Math.random() - 0.5) * (0.5 - 0.28 * (rayon / rayonMax));
  const dispersion = 0.02 + 0.085 * (rayon / rayonMax);
  const epaisseur = 0.025 + 0.11 / (1 + rayon * 2.0);
  return {
    x: Math.cos(angle) * rayon + (Math.random() - 0.5) * dispersion * 2,
    y: (Math.random() - 0.5) * epaisseur * 2,
    z: Math.sin(angle) * rayon + (Math.random() - 0.5) * dispersion * 2,
    part: rayon / rayonMax,
  };
}

function couleurDe(part, couleur) {
  if (part < 0.22) {
    couleur.copy(OR_CLAIR).lerp(OR, part / 0.22);
  } else if (part < 0.58) {
    couleur.copy(OR).lerp(BLEU, (part - 0.22) / 0.36);
  } else {
    couleur.copy(BLEU).lerp(VIOLET, (part - 0.58) / 0.42);
  }
  return couleur;
}

/* ------------------------------------------------- couche 2 : les étoiles */
function geometrieEtoiles() {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(ETOILES * 3);
  const col = new Float32Array(ETOILES * 3);
  const tai = new Float32Array(ETOILES);
  const c = new THREE.Color();
  const bulbe = Math.round(ETOILES * 0.3);
  const blanc = new THREE.Color(0xffffff);

  for (let i = 0; i < ETOILES; i++) {
    let p;
    if (i < bulbe) {
      const r = Math.pow(Math.random(), 2.2) * 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p = {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi) * 0.55,
        z: r * Math.sin(phi) * Math.sin(theta),
        part: (r / RAYON_MAX) * 0.6,
      };
    } else {
      p = pointDeBras(RAYON_MAX);
    }
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;

    couleurDe(p.part, c);
    if (i < bulbe) c.lerp(OR_CLAIR, 0.45);
    if (Math.random() < 0.07) c.lerp(blanc, 0.6);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;

    tai[i] = 0.35 + Math.pow(Math.random(), 3) * 2.2 + (i < bulbe ? 0.3 : 0);
  }

  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('taille', new THREE.BufferAttribute(tai, 1));
  return g;
}

/* --------------------------------------------- couche 1 : le gaz nébuleux */
function geometrieGaz() {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(GAZ * 3);
  const col = new Float32Array(GAZ * 3);
  const c = new THREE.Color();

  for (let i = 0; i < GAZ; i++) {
    const p = pointDeBras(RAYON_MAX);
    pos[i * 3] = p.x * (1 + (Math.random() - 0.5) * 0.22);
    pos[i * 3 + 1] = p.y * 2.4;
    pos[i * 3 + 2] = p.z * (1 + (Math.random() - 0.5) * 0.22);

    couleurDe(p.part, c);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }

  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
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
  camera.position.set(0, 2.0, 9.4);
  camera.lookAt(0, 0, 0);

  const galaxie = new THREE.Group();
  galaxie.rotation.x = -0.62;
  galaxie.rotation.z = 0.22;
  galaxie.scale.setScalar(1.05);
  galaxie.position.set(1.25, -0.15, 0);
  scene.add(galaxie);

  const texture = textureDouce();

  const gaz = new THREE.Points(geometrieGaz(), new THREE.PointsMaterial({
    size: 0.55,
    map: texture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    opacity: 0.06,
  }));
  galaxie.add(gaz);

  const etoiles = new THREE.Points(geometrieEtoiles(), new THREE.PointsMaterial({
    size: 0.075,
    map: texture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    opacity: 1,
  }));
  galaxie.add(etoiles);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, color: 0xffdda0, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.34,
  }));
  halo.scale.setScalar(1.0);
  galaxie.add(halo);

  let qualite = 2;
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

  let enPause = false;
  document.addEventListener('visibilitychange', () => { enPause = document.hidden; });

  let derniere = 0, cumul = 0, images = 0, alertes = 0, chauffe = 0;

  function boucle(t) {
    requestAnimationFrame(boucle);
    if (enPause) return;

    const dt = derniere ? Math.min((t - derniere) / 1000, 0.05) : 0.016;
    derniere = t;

    if (chauffe < 90) {
      chauffe += 1;
    } else {
      cumul += dt * 1000;
      images += 1;
      if (images >= 45) {
        if (cumul / images > 21) {
          alertes += 1;
          if (alertes >= 2 && qualite === 2) { qualite = 1; dimensionner(); }
        } else {
          alertes = 0;
        }
        cumul = 0;
        images = 0;
      }
    }

    // rotation propre, lente et régulière : un tour en ~110 s. Aucune souris.
    galaxie.rotation.y += dt * 0.057;

    rendu.render(scene, camera);
  }

  if (reduit) rendu.render(scene, camera);
  else requestAnimationFrame(boucle);

  window.__galaxie = {
    etoiles: ETOILES, gaz: GAZ,
    qualite: () => qualite,
    scene, camera, rendu,
  };
  return window.__galaxie;
}

demarrer();
