/* SKINTECK: consent-gated tracking, source attribution, Planity loader, journal filters */
(() => {
  const T = window.SK_TRACKING || {};
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* 1. Source attribution: first and last touch, kept 90 days.
     Flyers / QR codes use ?utm_source=flyer&utm_medium=print&utm_campaign=<name>. */
  const qs = new URLSearchParams(location.search);
  const now = Date.now();
  const touch = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid'].forEach((k) => { if (qs.get(k)) touch[k] = qs.get(k); });
  if (!touch.utm_source && document.referrer && !document.referrer.includes(location.hostname)) {
    try { touch.referrer = new URL(document.referrer).hostname; } catch (e) {}
  }
  if (Object.keys(touch).length) {
    touch.at = now; touch.page = location.pathname;
    let first = null; try { first = JSON.parse(store.get('sk_first') || 'null'); } catch (e) {}
    if (!first || now - first.at > 90 * 864e5) store.set('sk_first', JSON.stringify(touch));
    store.set('sk_last', JSON.stringify(touch));
  }
  const source = () => { try { return JSON.parse(store.get('sk_last') || store.get('sk_first') || 'null'); } catch (e) { return null; } };

  /* 2. Consent + tags (Google Consent Mode v2: nothing stored before consent) */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  const live = T.enabled && (T.ga4 || T.googleAds);
  if (live) {
    gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
    gtag('js', new Date());
    if (T.ga4) gtag('config', T.ga4);
    if (T.googleAds) gtag('config', T.googleAds);
    const s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + (T.ga4 || T.googleAds);
    document.head.appendChild(s);
  }
  const loadPixel = () => {
    if (!T.enabled || !T.metaPixel || window.fbq) return;
    /* Meta pixel base code */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', T.metaPixel); fbq('track', 'PageView');
  };
  const apply = (yes) => {
    if (live) gtag('consent', 'update', { ad_storage: yes ? 'granted' : 'denied', analytics_storage: yes ? 'granted' : 'denied', ad_user_data: yes ? 'granted' : 'denied', ad_personalization: yes ? 'granted' : 'denied' });
    if (yes) loadPixel();
  };
  const box = document.querySelector('.consent');
  const choice = store.get('sk_consent');
  if (choice) apply(choice === 'yes');
  else if (box) box.hidden = false;
  document.querySelectorAll('[data-consent]').forEach((b) => b.addEventListener('click', () => {
    const yes = b.dataset.consent === 'yes';
    store.set('sk_consent', yes ? 'yes' : 'no'); apply(yes); if (box) box.hidden = true;
  }));
  document.querySelectorAll('[data-cookies]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); if (box) box.hidden = false; }));

  /* 3. Conversion signals: clicks toward booking / phone / WhatsApp, tagged with the source */
  const event = (name, extra) => {
    const src = source() || {};
    const p = Object.assign({ page: location.pathname, src: src.utm_source || src.referrer || 'direct', campaign: src.utm_campaign || '' }, extra || {});
    if (live) gtag('event', name, p);
    if (window.fbq) fbq('trackCustom', name, p);
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.startsWith('tel:')) event('click_phone');
    else if (h.includes('wa.me')) event('click_whatsapp');
    else if (h.includes('planity.com')) event('click_planity');
    else if (h.includes('prendre-rendez-vous')) event('click_booking', { soin: a.dataset.soin || '' });
  });

  /* 4. Planity white-label module, loaded only where a .book container exists.
     Planity has no deep link, so once it renders we either pick one service (select)
     or hide every row that isn't part of this treatment (filter). Unknown text = full list. */
  const PRESET = {
    regen: { select: 'Microneedling + LED' },
    pure: { select: 'Hydrodermabrasion + LED' },
    peel: { select: 'Peeling professionnel + LED' },
    skinprogram: { select: 'Routine skincare personnalisée' },
    diagnostic: { filter: ['Analyse de peau par imagerie', 'Analyse silhouette par imagerie', 'Analyse du cuir chevelu'] },
    density: { select: 'Analyse du cuir chevelu' },
    lift: { filter: ['HIFU double menton', 'HIFU cou', 'HIFU décolleté', 'HIFU ovale', 'HIFU global'] },
    laser: { filter: ['Épilation laser'] },
    cryo: { filter: ['Cryolipolyse'] },
    sculpt: { filter: ['Cryolipolyse', 'HIFU corps', 'Électrostimulation', 'Pressothérapie', 'Analyse silhouette'] },
    duos: { filter: ['Soin visage complet', 'Soin corps'] },
    drainage: { filter: ['Renata França', 'Miracle', 'i.PROST', 'Madéro', 'Emy.A', 'Rituel', 'FASCIALCHIMIE', 'Vodder'] },
  };
  const book = document.querySelector('[data-planity]');
  const want = book && (new URLSearchParams(location.search).get('soin') || book.dataset.soin);
  const preset = want && PRESET[want];
  const rowsOf = (root) => [...root.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Choisir').map((b) => {
    let r = b;
    while (r.parentElement && r.parentElement !== root && [...r.parentElement.querySelectorAll('button')].filter((x) => x.innerText.trim() === 'Choisir').length < 2) r = r.parentElement;
    return { row: r, btn: b, name: (r.innerText.split('\n').find((l) => l.trim()) || '').trim() };
  });
  const applyPreset = (root) => {
    const rows = rowsOf(root);
    if (!rows.length) return false;
    if (preset.select) {
      const hit = rows.find((r) => r.name.startsWith(preset.select));
      if (hit) { hit.btn.click(); event('booking_preselect', { soin: want }); }
      return true;
    }
    const keep = (n) => preset.filter.some((f) => n.includes(f));
    if (!rows.some((r) => keep(r.name))) return true; // nothing matches: leave the full list
    // expand "Voir les N autres prestations" so every option is present, then hide the rest
    const more = /^Voir les \d+ autres prestations$/;
    // click only the innermost matching element of each link (outer + inner both match the text)
    [...root.querySelectorAll('a,button,span,div,p')].filter((e) => more.test(e.innerText.trim()) && ![...e.children].some((c) => more.test(c.innerText.trim()))).forEach((e) => e.click());
    const hide = () => {
      for (const r of rowsOf(root)) r.row.style.display = keep(r.name) ? '' : 'none';
      // hide category blocks left with no visible service
      root.querySelectorAll('h2,h3,h4').forEach((h) => {
        let sec = h.parentElement;
        while (sec && sec !== root && !sec.querySelector('button')) sec = sec.parentElement;
        if (!sec || sec === root) return;
        const vis = rowsOf(sec).some((r) => r.row.style.display !== 'none');
        sec.style.display = vis ? '' : 'none';
      });
    };
    hide(); setTimeout(hide, 400); setTimeout(hide, 1200);
    if (!book.querySelector('.book__all')) {
      const a = document.createElement('button'); a.type = 'button'; a.className = 'book__all'; a.textContent = 'Voir tous les soins';
      a.addEventListener('click', () => { a.remove(); for (const r of rowsOf(root)) r.row.style.display = ''; root.querySelectorAll('*').forEach((e) => { if (e.style.display === 'none') e.style.display = ''; }); });
      book.appendChild(a);
    }
    event('booking_filter', { soin: want });
    return true;
  };
  if (book) {
    const key = book.dataset.planity;
    if (preset) {
      const mo = new MutationObserver(() => {
        const root = document.getElementById('planitywl');
        if (root && applyPreset(root)) mo.disconnect();
      });
      mo.observe(book, { childList: true, subtree: true });
      setTimeout(() => mo.disconnect(), 20000);
    }
    const go = () => {
      if (window.planity) return;
      const c = document.createElement('div'); c.id = 'myContainerId';
      book.innerHTML = ''; book.appendChild(c);
      window.planity = { key, primaryColor: '#fff', container: c, options: {} };
      const add = (src, cb) => { const s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = () => { book.innerHTML = book.dataset.fallback; }; document.body.appendChild(s); };
      add('https://d2skjte8udjqxw.cloudfront.net/widget/production/2/polyfills.latest.js', () => add('https://d2skjte8udjqxw.cloudfront.net/widget/production/2/app.latest.js'));
      event('view_booking');
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '400px' });
      io.observe(book);
    } else go();
  }

  /* 5. Journal filters */
  const filters = document.querySelectorAll('.filters button');
  filters.forEach((b) => b.addEventListener('click', () => {
    filters.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const c = b.dataset.cat;
    document.querySelectorAll('.post').forEach((p) => { p.hidden = c && !(p.dataset.cats || '').split('|').includes(c); });
  }));

  /* 6. Contact form -> e-mail or WhatsApp, with the source attached */
  const form = document.querySelector('form[data-mail]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form); const src = source();
    const body = `Nom : ${d.get('nom')}\nTéléphone : ${d.get('tel') || '-'}\nSujet : ${d.get('sujet')}\n\n${d.get('message')}\n\n--\nVenu via : ${src ? (src.utm_source || src.referrer || 'direct') + (src.utm_campaign ? ' / ' + src.utm_campaign : '') : 'direct'}`;
    event('contact_submit', { sujet: d.get('sujet') });
    if (e.submitter && e.submitter.dataset.via === 'wa') location.href = 'https://wa.me/' + form.dataset.wa + '?text=' + encodeURIComponent(body);
    else location.href = 'mailto:' + form.dataset.mail + '?subject=' + encodeURIComponent('Demande site : ' + d.get('sujet')) + '&body=' + encodeURIComponent(body);
  });
})();
