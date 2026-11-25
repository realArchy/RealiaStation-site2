/* ============================================================================
   BOUTIQUE — centre commercial agnostique (R'ExoIA)

   Rien n'est écrit en dur ici : la page lit data/partners.json et
   data/catalog.json, exactement les mêmes fichiers qu'une future application
   mobile consommera. Changer un prix, ajouter une enseigne ou un commerce
   local ne demande aucune modification de code.

   Trois principes :
   · un produit est indépendant du marchand ; ses offres sont rangées par pays ;
   · le pays choisi filtre les enseignes ET les offres, jamais le catalogue ;
   · comparer 2 à 3 produits produit un tableau de caractéristiques, pas une
     addition de prix.
   ========================================================================= */
(() => {
  'use strict';

  const LANG = (document.documentElement.lang || 'fr').slice(0, 2);
  const CLE_PAYS = 'rexoia.boutique.pays';

  const MOTS = {
    fr: { des: 'dès', offres: 'Voir les offres', comparer: 'Comparer', devis: 'Sur devis',
          choix: 'offres', local: 'Commerce local', aucun: 'Aucun résultat pour cette recherche.',
          aucunPart: 'Aucune enseigne dans ce pays pour le moment.',
          barre: 'Comparer', fermer: 'Fermer', retirer: 'Retirer', whatsapp: 'Écrire sur WhatsApp',
          voir: 'Voir chez', prix: 'Prix', marchand: 'Marchand', avantage: 'Avantage',
          caracteristique: 'Caractéristique', placeholder: 'Votre commerce ici',
          placeholderTxt: 'Boutique, atelier, producteur : nous créons la fiche et le lien de suivi.',
          contact: 'Nous écrire', resultats: 'produit(s)' },
    en: { des: 'from', offres: 'See offers', comparer: 'Compare', devis: 'On request',
          choix: 'offers', local: 'Local shop', aucun: 'No result for this search.',
          aucunPart: 'No retailer in this country yet.',
          barre: 'Compare', fermer: 'Close', retirer: 'Remove', whatsapp: 'Message on WhatsApp',
          voir: 'View at', prix: 'Price', marchand: 'Retailer', avantage: 'Benefit',
          caracteristique: 'Specification', placeholder: 'Your shop here',
          placeholderTxt: 'Shop, workshop or producer: we build the listing and the tracking link.',
          contact: 'Contact us', resultats: 'product(s)' },
    pt: { des: 'desde', offres: 'Ver ofertas', comparer: 'Comparar', devis: 'Sob orçamento',
          choix: 'ofertas', local: 'Loja local', aucun: 'Nenhum resultado para esta pesquisa.',
          aucunPart: 'Nenhuma loja neste país por enquanto.',
          barre: 'Comparar', fermer: 'Fechar', retirer: 'Remover', whatsapp: 'Falar no WhatsApp',
          voir: 'Ver em', prix: 'Preço', marchand: 'Loja', avantage: 'Vantagem',
          caracteristique: 'Característica', placeholder: 'A sua loja aqui',
          placeholderTxt: 'Loja, oficina ou produtor: criamos a ficha e o link de acompanhamento.',
          contact: 'Falar connosco', resultats: 'produto(s)' },
    zh: { des: '起', offres: '查看报价', comparer: '对比', devis: '面议',
          choix: '个报价', local: '本地商家', aucun: '没有符合条件的结果。',
          aucunPart: '该国家暂无商家。',
          barre: '对比', fermer: '关闭', retirer: '移除', whatsapp: '通过 WhatsApp 联系',
          voir: '前往', prix: '价格', marchand: '商家', avantage: '优势',
          caracteristique: '规格', placeholder: '此处可放您的商店',
          placeholderTxt: '商店、工坊或生产者：我们负责建立页面与跟踪链接。',
          contact: '联系我们', resultats: '件商品' },
  };
  const M = MOTS[LANG] || MOTS.fr;

  const $ = (sel, racine = document) => racine.querySelector(sel);
  const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];
  const tx = (obj) => (obj && (obj[LANG] || obj.fr)) || '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ETAT = { pays: 'FR', cat: 'all', q: '', selection: new Set(), partners: [], products: [], devise: {} };

  /* ---- région ----------------------------------------------------------- */
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

  function paysDisponible(code) {
    return ['FR', 'BR', 'GLOBAL'].includes(code) ? code : 'GLOBAL';
  }

  function appliquerPays(code, memoriser = true) {
    ETAT.pays = paysDisponible(code);
    if (memoriser) localStorage.setItem(CLE_PAYS, ETAT.pays);
    $$('[data-pays]').forEach((b) => {
      const actif = b.dataset.pays === ETAT.pays;
      b.setAttribute('aria-pressed', actif ? 'true' : 'false');
    });
    rendrePartenaires();
    rendreProduits();
    rendreBarreComparaison();
  }

  /* ---- utilitaires données ---------------------------------------------- */
  const partenaire = (id) => ETAT.partners.find((p) => p.id === id);

  function offresDuPays(prod) {
    const offres = (prod.offers && (prod.offers[ETAT.pays] || [])) || [];
    if (offres.length) return offres;
    // un produit sans offre locale : on ne le masque pas, on le dit
    return [];
  }

  function meilleurPrix(offres) {
    const avecPrix = offres.filter((o) => Number(o.price) > 0);
    if (!avecPrix.length) return null;
    return avecPrix.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a));
  }

  function formaterPrix(montant, devise) {
    if (!montant) return M.devis;
    try {
      return new Intl.NumberFormat(LANG === 'zh' ? 'zh-CN' : LANG, {
        style: 'currency', currency: devise || 'EUR', maximumFractionDigits: 2,
      }).format(montant);
    } catch (e) {
      return `${montant} ${devise || ''}`.trim();
    }
  }

  /* ---- partenaires ------------------------------------------------------ */
  function rendrePartenaires() {
    const cible = $('#grille-partenaires');
    if (!cible) return;
    const visibles = ETAT.partners.filter((p) =>
      p.type !== 'local_merchant' && (p.countries.includes(ETAT.pays) || p.countries.includes('GLOBAL')));
    const locaux = ETAT.partners.filter((p) =>
      p.type === 'local_merchant' && p.countries.includes(ETAT.pays));

    const carte = (p, local) => `
      <article class="partenaire${local ? ' local' : ''}">
        <img src="${esc(p.logo_url)}" alt="" width="72" height="72" loading="lazy">
        <h3>${esc(p.name)}</h3>
        <p>${esc(tx(p.pitch))}</p>
        ${local ? `<span class="etq-local">${M.local}</span>` : ''}
        ${local && p.local_info ? `<span class="ville">${esc(p.local_info.city)} · ${esc(p.local_info.region)}</span>` : ''}
      </article>`;

    cible.innerHTML = visibles.map((p) => carte(p, false)).join('') +
      locaux.map((p) => carte(p, true)).join('') +
      `<article class="partenaire placeholder">
         <img src="assets/partenaires/placeholder.svg" alt="" width="72" height="72" loading="lazy">
         <h3>${M.placeholder}</h3>
         <p>${M.placeholderTxt}</p>
         <a class="lien-discret" href="cabinet.html">${M.contact} →</a>
       </article>`;

    if (!visibles.length && !locaux.length) {
      cible.innerHTML = `<p class="vide">${M.aucunPart}</p>`;
    }
  }

  /* ---- produits --------------------------------------------------------- */
  function filtrerProduits() {
    const q = ETAT.q.trim().toLowerCase();
    return ETAT.products.filter((p) => {
      // l'onglet « cadeaux » n'est pas une catégorie de produit : c'est un tag
      if (ETAT.cat === 'gift') {
        if (!(p.tags || []).includes('noel')) return false;
      } else if (ETAT.cat !== 'all' && p.category !== ETAT.cat) {
        return false;
      }
      if (!q) return true;
      const offres = offresDuPays(p);
      const villes = offres
        .map((o) => partenaire(o.partner_id))
        .filter(Boolean)
        .map((p) => `${p.local_info ? p.local_info.city : ''} ${p.local_info ? p.local_info.region : ''} ${p.name}`)
        .join(' ');
      return `${tx(p.title)} ${tx(p.description_short)} ${(p.tags || []).join(' ')} ${villes}`
        .toLowerCase().includes(q);
    });
  }

  function rendreProduits() {
    const cible = $('#grille-produits');
    if (!cible) return;

    // l'onglet « réexpédition » n'affiche pas de produits : c'est un service
    const panneau = $('#reexpedition');
    if (panneau) panneau.hidden = ETAT.cat !== 'reexp';
    if (ETAT.cat === 'reexp') {
      cible.innerHTML = '';
      const compte = $('#compte-resultats');
      if (compte) compte.textContent = '';
      return;
    }
    const liste = filtrerProduits();
    const compte = $('#compte-resultats');
    if (compte) compte.textContent = `${liste.length} ${M.resultats}`;

    cible.innerHTML = liste.map((p) => {
      const offres = offresDuPays(p);
      const best = meilleurPrix(offres);
      const local = offres.some((o) => (partenaire(o.partner_id) || {}).type === 'local_merchant');
      const coche = ETAT.selection.has(p.id);
      return `
      <article class="produit${coche ? ' est-compare' : ''}" data-produit="${esc(p.id)}">
        <div class="visuel">
          <img src="${esc(p.image_url)}" alt="${esc(tx(p.title))}" width="600" height="420" loading="lazy">
          ${local ? `<span class="pastille local">${M.local}</span>` : ''}
          ${best && best.badge ? `<span class="pastille">${esc(best.badge)}</span>` : ''}
        </div>
        <div class="corps">
          <h3>${esc(tx(p.title))}</h3>
          <p class="resume">${esc(tx(p.description_short))}</p>
          <p class="prix">${offres.length ? `${M.des} <strong>${formaterPrix(best ? best.price : 0, best ? best.currency : null)}</strong>` : M.devis}</p>
          <div class="actions">
            <button type="button" class="btn-offres" data-offres="${esc(p.id)}"
                    ${offres.length ? '' : 'disabled'}>
              ${M.offres}${offres.length ? ` (${offres.length})` : ''}
            </button>
            <label class="case">
              <input type="checkbox" data-compare="${esc(p.id)}" ${coche ? 'checked' : ''}>
              <span>${M.comparer}</span>
            </label>
          </div>
        </div>
      </article>`;
    }).join('') || `<p class="vide">${M.aucun}</p>`;

    $$('#grille-produits [data-offres]').forEach((b) =>
      b.addEventListener('click', () => ouvrirOffres(b.dataset.offres)));
    $$('#grille-produits [data-compare]').forEach((c) =>
      c.addEventListener('change', () => basculerComparaison(c.dataset.compare, c)));
  }

  /* ---- tiroir des offres (comparateur par produit) ----------------------- */
  function ouvrirOffres(id) {
    const p = ETAT.products.find((x) => x.id === id);
    const offres = offresDuPays(p);
    const tiroir = $('#tiroir-offres');
    $('#tiroir-titre').textContent = tx(p.title);
    $('#tiroir-corps').innerHTML = `
      <table class="table-offres">
        <thead><tr><th>${M.marchand}</th><th>${M.prix}</th><th>${M.avantage}</th><th></th></tr></thead>
        <tbody>
        ${offres.map((o) => {
          const pa = partenaire(o.partner_id) || { name: o.partner_id, logo_url: '', type: '' };
          const local = pa.type === 'local_merchant';
          const lien = local && pa.local_info && pa.local_info.whatsapp
            ? `https://wa.me/${pa.local_info.whatsapp.replace(/[^0-9]/g, '')}`
            : (o.url || pa.base_affiliate_url || '#');
          const libelle = local ? M.whatsapp : `${M.voir} ${pa.name}`;
          return `<tr>
            <td class="marchand"><img src="${esc(pa.logo_url)}" alt="" width="28" height="28"> <span>${esc(pa.name)}</span></td>
            <td class="prix">${formaterPrix(o.price, o.currency)}</td>
            <td>${esc(o.badge || (pa.local_info ? pa.local_info.city : ''))}</td>
            <td><a class="btn-voir" href="${esc(lien)}" ${lien === '#' ? '' : 'target="_blank" rel="noopener sponsored"'}>${esc(libelle)}</a></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
      <p class="mentions-tiroir">${$('#mention-affiliation') ? $('#mention-affiliation').textContent.trim() : ''}</p>`;
    tiroir.hidden = false;
    document.body.classList.add('tiroir-ouvert');
    $('#tiroir-fermer').focus();
  }

  function fermerOffres() {
    const tiroir = $('#tiroir-offres');
    if (tiroir) tiroir.hidden = true;
    document.body.classList.remove('tiroir-ouvert');
  }

  /* ---- comparaison 2 à 3 ------------------------------------------------ */
  function basculerComparaison(id, input) {
    if (ETAT.selection.has(id)) {
      ETAT.selection.delete(id);
    } else {
      if (ETAT.selection.size >= 3) {
        input.checked = false;
        signaler('3 maximum');
        return;
      }
      ETAT.selection.add(id);
    }
    const carte = input.closest('.produit');
    if (carte) carte.classList.toggle('est-compare', ETAT.selection.has(id));
    rendreBarreComparaison();
  }

  function signaler(texte) {
    const zone = $('#annonce');
    if (zone) { zone.textContent = texte; }
  }

  function rendreBarreComparaison() {
    const barre = $('#barre-comparer');
    if (!barre) return;
    const n = ETAT.selection.size;
    barre.hidden = n === 0;
    $('#comparer-compte').textContent = `${M.barre} (${n})`;
    $('#comparer-lancer').disabled = n < 2;
  }

  function ouvrirComparaison() {
    const produits = [...ETAT.selection].map((id) => ETAT.products.find((p) => p.id === id)).filter(Boolean);
    if (produits.length < 2) return;
    const cles = [...new Set(produits.flatMap((p) => Object.keys(p.specs || {})))];
    const ligne = (libelle, cellules) =>
      `<tr><th>${esc(libelle)}</th>${cellules.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;

    const entetes = produits.map((p) => `<th>
        <img src="${esc(p.image_url)}" alt="" width="96" height="67">
        <span>${esc(tx(p.title))}</span></th>`).join('');

    const prix = produits.map((p) => {
      const best = meilleurPrix(offresDuPays(p));
      return best ? formaterPrix(best.price, best.currency) : M.devis;
    });

    $('#compare-table').innerHTML = `
      <thead><tr><th></th>${entetes}</tr></thead>
      <tbody>
        ${ligne(M.prix, prix)}
        ${cles.map((k) => ligne(k, produits.map((p) => (p.specs && p.specs[k]) || '—'))).join('')}
      </tbody>`;
    $('#compare-modal').hidden = false;
    $('#compare-fermer').focus();
  }

  function fermerComparaison() {
    const m = $('#compare-modal');
    if (m) m.hidden = true;
  }

  /* ---- recherche & onglets --------------------------------------------- */
  function brancherRecherche() {
    const champ = $('#champ-recherche');
    if (!champ) return;
    let minuteur = null;
    champ.addEventListener('input', () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => { ETAT.q = champ.value; rendreProduits(); }, 110);
    });
    $$('[data-cat]').forEach((b) => b.addEventListener('click', () => {
      ETAT.cat = b.dataset.cat;
      $$('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      rendreProduits();
    }));
  }

  /* ---- démarrage -------------------------------------------------------- */
  async function charger() {
    const [rp, rc] = await Promise.all([
      fetch('data/partners.json', { cache: 'no-cache' }),
      fetch('data/catalog.json', { cache: 'no-cache' }),
    ]);
    if (!rp.ok || !rc.ok) throw new Error(`données indisponibles (${rp.status}/${rc.status})`);
    const dp = await rp.json();
    const dc = await rc.json();
    ETAT.partners = dp.partners || [];
    ETAT.products = dc.products || [];
    ETAT.devise = dc.currency_hint || {};
    const note = $('#note-donnees');
    if (note && dc.note) note.textContent = dc.note;
  }

  function brancherSelecteur() {
    $$('[data-pays]').forEach((b) =>
      b.addEventListener('click', () => appliquerPays(b.dataset.pays)));
  }

  function brancherModales() {
    const fermer = $('#tiroir-fermer');
    if (fermer) fermer.addEventListener('click', fermerOffres);
    const cf = $('#compare-fermer');
    if (cf) cf.addEventListener('click', fermerComparaison);
    const lancer = $('#comparer-lancer');
    if (lancer) lancer.addEventListener('click', ouvrirComparaison);
    $$('.voile').forEach((v) => v.addEventListener('click', () => { fermerOffres(); fermerComparaison(); }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { fermerOffres(); fermerComparaison(); }
    });
  }

  async function demarrer() {
    try {
      await charger();
    } catch (err) {
      const cible = $('#grille-produits');
      if (cible) cible.innerHTML = `<p class="vide">Catalogue indisponible — ${esc(err.message)}</p>`;
      console.error('[boutique]', err);
      return;
    }
    brancherSelecteur();
    brancherRecherche();
    brancherModales();
    appliquerPays(paysDetecte(), false);

    // lien direct depuis le menu mobile : #reexpedition ouvre l'onglet
    if (location.hash === '#reexpedition') {
      ETAT.cat = 'reexp';
      $$('[data-cat]').forEach((x) =>
        x.setAttribute('aria-pressed', x.dataset.cat === 'reexp' ? 'true' : 'false'));
      rendreProduits();
      const cible = document.getElementById('reexpedition');
      if (cible) cible.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
