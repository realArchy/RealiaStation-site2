/* ============================================================================
   MY SETUP & WISHLIST — l'envers du décor R&D

   Même contrat que la boutique : aucun équipement, aucun prix, aucun lien en
   dur dans la page. Tout vient de data/setup.json, que la future application
   mobile lira tel quel.

   Deux blocs, deux intentions :
   · wishlist_devices : ce qui manque, trié par urgence — c'est l'appel ;
   · current_setup    : ce qui tourne déjà — c'est la preuve.
   ========================================================================= */
(() => {
  'use strict';

  const LANG = (document.documentElement.lang || 'fr').slice(0, 2);
  const CLE_PAYS = 'rexoia.boutique.pays';   // la même clé que la boutique

  const MOTS = {
    fr: { des: 'dès', urgent: 'urgence', debloque: 'Ce que ça débloque',
          offrir: 'Offrir / Voir le produit', participer: 'Participer (Ko-fi / Tipeee)',
          nonfini: 'lien à venir', objectif: 'objectif', collecte: 'collecté',
          soutien: 'Soutenir l\u2019équipement du labo', voirRef: 'Voir la référence',
          role: 'Dans le projet', tout: 'Tout', aucun: 'Rien à afficher pour ce filtre.',
          produit: 'produit', produits: 'produits', rien: 'aucun euro collecté à ce jour',
          bientot: 'bientôt' },
    en: { des: 'from', urgent: 'urgency', debloque: 'What it unlocks',
          offrir: 'Gift / View product', participer: 'Contribute (Ko-fi / Tipeee)',
          nonfini: 'link pending', objectif: 'target', collecte: 'raised',
          soutien: 'Support the lab\u2019s equipment', voirRef: 'See the reference',
          role: 'In the project', tout: 'All', aucun: 'Nothing to show for this filter.',
          produit: 'item', produits: 'items', rien: 'nothing raised so far', bientot: 'soon' },
    pt: { des: 'desde', urgent: 'urgência', debloque: 'O que desbloqueia',
          offrir: 'Oferecer / Ver produto', participer: 'Participar (Ko-fi / Tipeee)',
          nonfini: 'link em breve', objectif: 'objetivo', collecte: 'arrecadado',
          soutien: 'Apoiar o equipamento do laboratório', voirRef: 'Ver a referência',
          role: 'No projeto', tout: 'Tudo', aucun: 'Nada para mostrar neste filtro.',
          produto: 'item', produtos: 'itens', rien: 'nenhum euro arrecadado até hoje', bientot: 'breve' },
    zh: { des: '起', urgent: '紧急度', debloque: '它能解锁什么',
          offrir: '赠送 / 查看产品', participer: '参与（Ko-fi / Tipeee）',
          nonfini: '链接待补', objectif: '目标', collecte: '已筹',
          soutien: '支持实验室设备', voirRef: '查看参考',
          role: '在项目中', tout: '全部', aucun: '此筛选暂无内容。',
          produit: '件', produits: '件', rien: '至今尚未筹集任何资金', bientot: '即将上线' },
  };
  const M = MOTS[LANG] || MOTS.fr;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ETAT = { pays: 'FR', cat: 'Tout', data: null };

  /* ---- région : la même que la boutique --------------------------------- */
  function paysDetecte() {
    const memo = localStorage.getItem(CLE_PAYS);
    if (memo) return memo;
    const param = new URLSearchParams(location.search).get('pays');
    if (param) return param.toUpperCase();
    const nav = (navigator.language || 'fr').toLowerCase();
    if (nav.startsWith('pt')) return 'BR';
    if (nav.startsWith('fr')) return 'FR';
    return 'GLOBAL';
  }

  function appliquerPays(code) {
    ETAT.pays = ['FR', 'BR', 'GLOBAL'].includes(code) ? code : 'GLOBAL';
    localStorage.setItem(CLE_PAYS, ETAT.pays);
    $$('[data-pays]').forEach((b) =>
      b.setAttribute('aria-pressed', b.dataset.pays === ETAT.pays ? 'true' : 'false'));
    rendreBesoin(ETAT.data.wishlist_devices || []);
    rendreSetup();
  }

  /* ---- outils ----------------------------------------------------------- */
  const lienPays = (obj) => (obj && (obj[ETAT.pays] || obj.GLOBAL || obj.FR)) || '';
  const estFauxLien = (u) => !u || u.startsWith('[') || u === '#';

  function lienUtile(u) {
    return !estFauxLien(u);
  }

  function prixDe(item) {
    const p = item.estimated_price || {};
    return p[ETAT.pays] || p.GLOBAL || p.FR || '—';
  }

  function classeUrgence(niveau) {
    if (/CRITIQUE/i.test(niveau)) return 'critique';
    if (/HAUTE/i.test(niveau)) return 'haute';
    return 'moyenne';
  }

  /* ---- section 1 : les besoins, par urgence ----------------------------- */
  function rendreBesoin(liste) {
    const cible = $('#liste-besoins');
    if (!cible) return;
    const tri = [...liste].sort((a, b) => (a.priority_rank || 99) - (b.priority_rank || 99));

    cible.innerHTML = tri.map((it) => {
      const cls = classeUrgence(it.urgency_level);
      const lien = lienPays(it.links);
      const prog = it.funding_progress;
      const pct = prog && prog.target ? Math.min(100, Math.round((prog.collected / prog.target) * 100)) : null;
      return `
      <article class="besoin ${cls}">
        <div class="rang" aria-hidden="true">#${it.priority_rank}</div>
        <div class="vignette"><img src="${esc(it.image_url)}" alt="" width="560" height="400" loading="lazy"></div>
        <div class="contenu">
          <p class="niveau"><span class="point"></span>${esc(it.urgency_level)}</p>
          <h3>${esc(it.name)}</h3>
          <p class="cat">${esc(it.category)}</p>
          <p class="pourquoi"><strong>${M.debloque} :</strong> ${esc(it.why_needed)}</p>
          ${prog ? `
          <div class="jauge" role="img" aria-label="${pct} %">
            <span class="barre" style="width:${pct}%"></span>
          </div>
          <p class="jauge-legende">${pct} % · ${prog.collected} / ${prog.target} ${esc(prog.currency)}
            <em>${prog.collected === 0 ? M.rien : M.collecte}</em></p>` : ''}
          <p class="prix">${M.des} <strong>${esc(prixDe(it))}</strong></p>
          <div class="actions">
            ${lienUtile(lien)
              ? `<a class="btn-principal" href="${esc(lien)}" target="_blank" rel="noopener sponsored">${M.offrir}</a>`
              : `<span class="btn-principal desactive" aria-disabled="true">${M.offrir} — ${M.nonfini}</span>`}
            ${it.direct_support_enabled ? `<a class="btn-secondaire" href="#soutenir" data-objet="${esc(it.name)}">${M.participer}</a>` : ''}
          </div>
        </div>
      </article>`;
    }).join('') || `<p class="vide">${M.aucun}</p>`;

    // le bouton secondaire mémorise l'objet visé et remonte vers l'encart de soutien
    $$('#liste-besoins [data-objet]').forEach((a) => a.addEventListener('click', () => {
      const zone = $('#objet-retenu');
      if (zone) zone.textContent = a.dataset.objet;
      const cibleSoutien = $('#soutenir');
      if (cibleSoutien) {
        cibleSoutien.classList.add('mis-en-avant');
        setTimeout(() => cibleSoutien.classList.remove('mis-en-avant'), 2200);
      }
    }));
  }

  /* ---- encart de soutien ------------------------------------------------ */
  function rendreSoutien(liens) {
    const cible = $('#liens-soutien');
    if (!cible) return;
    cible.innerHTML = (liens || []).map((l) => {
      const dispo = lienUtile(l.url);
      return dispo
        ? `<a class="lien-soutien" href="${esc(l.url)}" target="_blank" rel="noopener">
             <strong>${esc(l.label)}</strong><span>${esc(l.note)}</span></a>`
        : `<span class="lien-soutien inactif">
             <strong>${esc(l.label)}</strong><span>${esc(l.note)} · ${M.bientot}</span></span>`;
    }).join('');
  }

  /* ---- section 2 : le setup actuel -------------------------------------- */
  function categoriesSetup() {
    const cats = [...new Set((ETAT.data.current_setup || []).map((x) => x.category))];
    return ['Tout', ...cats];
  }

  function rendreOnglets() {
    const cible = $('#onglets-setup');
    if (!cible) return;
    cible.innerHTML = categoriesSetup().map((c) => `
      <button type="button" class="onglet" data-cat="${esc(c)}"
              aria-pressed="${c === ETAT.cat ? 'true' : 'false'}">${esc(c === 'Tout' ? M.tout : c)}</button>`).join('');
    $$('#onglets-setup [data-cat]').forEach((b) => b.addEventListener('click', () => {
      ETAT.cat = b.dataset.cat;
      rendreOnglets();
      rendreSetup();
    }));
  }

  function rendreSetup() {
    const cible = $('#grille-setup');
    if (!cible || !ETAT.data) return;
    const liste = (ETAT.data.current_setup || []).filter((x) => ETAT.cat === 'Tout' || x.category === ETAT.cat);
    cible.innerHTML = liste.map((x) => {
      const lien = lienPays(x.affiliate_links);
      return `
      <article class="materiel">
        <div class="vignette"><img src="${esc(x.image_url)}" alt="" width="560" height="400" loading="lazy"></div>
        <div class="contenu">
          <p class="etat"><span class="point"></span>${esc(x.status)}</p>
          <h3>${esc(x.name)}</h3>
          <p class="cat">${esc(x.category)}</p>
          <p class="role"><strong>${M.role} :</strong> ${esc(x.role_in_project)}</p>
          ${x.specs_short ? `<p class="specs">${esc(x.specs_short)}</p>` : ''}
          ${lienUtile(lien)
            ? `<a class="lien-ref" href="${esc(lien)}" target="_blank" rel="noopener sponsored">${M.voirRef} →</a>`
            : ''}
        </div>
      </article>`;
    }).join('') || `<p class="vide">${M.aucun}</p>`;
  }

  /* ---- démarrage -------------------------------------------------------- */
  async function demarrer() {
    let donnees;
    try {
      const r = await fetch('data/setup.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      donnees = await r.json();
    } catch (err) {
      const zone = $('#liste-besoins');
      if (zone) zone.innerHTML = `<p class="vide">Données indisponibles — ${esc(err.message)}</p>`;
      console.error('[setup]', err);
      return;
    }
    ETAT.data = donnees;
    const note = $('#note-setup');
    if (note && donnees.note) note.textContent = donnees.note;

    rendreSoutien(donnees.support_links);
    rendreOnglets();
    $$('[data-pays]').forEach((b) => b.addEventListener('click', () => appliquerPays(b.dataset.pays)));
    appliquerPays(paysDetecte());

    const compte = $('#compte-besoins');
    if (compte) compte.textContent = `${(donnees.wishlist_devices || []).length} ${M.produits}`;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
