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
  /* Planity draws two layouts: desktop (categories open, text "Choisir" buttons) and mobile
     (categories folded, services hidden until the category title is tapped). We read the DOM
     with textContent so hidden services are found too, open their category, then act. */
  const txt = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim();
  const isPick = (b) => {
    const t = txt(b), c = String(b.className);
    if (t === 'Choisir') return true;
    return t === '' && /button/i.test(c) && !/toggle/i.test(c) && !!b.closest('[class*="service"]');
  };
  const rowsOf = (root) => [...root.querySelectorAll('button')].filter(isPick).map((b) => {
    let r = b;
    while (r.parentElement && r.parentElement !== root && [...r.parentElement.querySelectorAll('button')].filter(isPick).length < 2) r = r.parentElement;
    return { row: r, btn: b, name: txt(r) };
  });
  // category ("service set") of a service: the smallest block that holds both its title and the service
  const categoryOf = (row, root) => {
    for (let a = row.parentElement; a && a !== root; a = a.parentElement) {
      const t = a.querySelector('[class*="service_set-module_title"]');
      if (t && !row.contains(t)) return { head: t, wrap: a };
    }
    return null;
  };
  const visible = (e) => !!(e.offsetParent || e.getClientRects().length);
  const collapsed = (cat) => !!cat && (/isCollapsed/.test(String(cat.wrap.className)) || !!cat.wrap.querySelector('[class*="service_set-module_isCollapsed"]'));
  const openCat = (cat) => { if (!cat || !collapsed(cat)) return; const c = cat.head.querySelector('button,[role=button]') || cat.head; c.click(); };
  const later = (fn, ms) => new Promise((r) => setTimeout(() => r(fn()), ms));
  const applyPreset = (root) => {
    const rows = rowsOf(root);
    if (!rows.length) return false;
    if (preset.select) {
      const hit = rows.find((r) => r.name.startsWith(preset.select));
      if (!hit) return true;
      (async () => {
        { const c = categoryOf(hit.row, root); if (collapsed(c)) { openCat(c); await later(() => 0, 700); } }
        if (false) { await later(() => 0, 700); }
        const fresh = rowsOf(root).find((r) => r.name.startsWith(preset.select)) || hit;
        fresh.btn.click();
        event('booking_preselect', { soin: want });
      })();
      return true;
    }
    const keep = (n) => preset.filter.some((f) => n.includes(f));
    if (!rows.some((r) => keep(r.name))) return true; // nothing matches: leave the full list
    // desktop: expand "Voir les N autres prestations" (innermost element only, outer + inner both match)
    const more = /^Voir les \d+ autres prestations$/;
    [...root.querySelectorAll('a,button,span,div,p')].filter((e) => more.test(txt(e)) && ![...e.children].some((c) => more.test(txt(c)))).forEach((e) => e.click());
    // mobile: open each folded category that holds a kept service
    const cats = new Map();
    for (const r of rows) { const c = categoryOf(r.row, root); if (c && !cats.has(c.wrap)) cats.set(c.wrap, c); }
    for (const c of cats.values()) {
      const kept = rowsOf(c.wrap).some((r) => keep(r.name));
      if (kept) openCat(c);
    }
    const hide = () => {
      const all = rowsOf(root);
      for (const r of all) r.row.style.display = keep(r.name) ? '' : 'none';
      for (const r of all) {
        const c = categoryOf(r.row, root); if (!c) continue;
        c.wrap.style.display = rowsOf(c.wrap).some((x) => keep(x.name)) ? '' : 'none';
      }
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
  /* 4b. Booking funnel: Planity draws each step in our page, so we read its headings.
     1 service chosen -> 2 slot chosen -> 3 sign-in step -> 4 confirmed.
     Each step fires once per page view with treatment, price and source.
     Add ?sk_debug=1 to the URL to see the events on screen (for the test booking). */
  const DEBUG = qs.has('sk_debug');
  const toast = (m) => {
    if (!DEBUG) return;
    console.log('[SKINTECK]', m);
    const t = document.createElement('div');
    t.textContent = m; t.style.cssText = 'position:fixed;z-index:99;left:12px;top:' + (60 + document.querySelectorAll('.sk-toast').length * 34) + 'px;background:#1d1d1f;color:#fff;padding:6px 12px;border-radius:8px;font:13px/1.3 system-ui';
    t.className = 'sk-toast'; document.body.appendChild(t); setTimeout(() => t.remove(), 8000);
  };
  const STEPS = [
    ['booking_service', /Prestation sélectionnée/i],
    ['booking_slot', /Date et heure sélectionnées/i],
    ['booking_identify', /Nouveau sur ce service|Se connecter|Identification/i],
    // confirmation wording to be checked with Vincent's test booking (?sk_debug=1 shows the text)
    ['booking_confirmed', /rendez-vous (est |a été |a bien été )?confirm|réservation (est |a été |a bien été )?confirm|votre rendez-vous est (bien )?(enregistré|réservé)|merci pour votre réservation/i],
  ];
  const done = new Set();
  const detail = (root) => {
    const t = root.innerText;
    const m = /Prestation sélectionnée\s*\n+\s*([^\n]+)\n+\s*([^\n]+)/.exec(t);
    const price = m && /(\d[\d\s]*)\s*€/.exec(m[2]);
    const when = /Date et heure sélectionnées\s*\n+\s*([^\n]+)/.exec(t);
    return { soin: m ? m[1].trim() : '', value: price ? Number(price[1].replace(/\s/g, '')) : 0, currency: 'EUR', creneau: when ? when[1].trim() : '' };
  };
  const watchFunnel = () => {
    const fb = document.querySelector('.book-fb');
    const check = () => {
      const root = document.getElementById('planitywl'); if (!root) return;
      const t = root.innerText;
      if (fb) fb.classList.toggle('is-hot', STEPS[2][1].test(t) && !STEPS[3][1].test(t));
      for (const [name, re] of STEPS) {
        if (done.has(name) || !re.test(t)) continue;
        // the confirmed step must come after a real selection, never on its own
        if (name === 'booking_confirmed' && !done.has('booking_slot')) continue;
        done.add(name);
        const d = detail(root);
        event(name, d);
        if (name === 'booking_confirmed') {
          if (live && T.googleAds && T.adsBookingLabel) gtag('event', 'conversion', { send_to: T.googleAds + '/' + T.adsBookingLabel, value: d.value, currency: 'EUR' });
          if (window.fbq) fbq('track', 'Schedule', { value: d.value, currency: 'EUR', content_name: d.soin });
          store.set('sk_last_booking', JSON.stringify({ at: Date.now(), soin: d.soin, src: source() }));
        }
        toast(name + (d.soin ? ' · ' + d.soin : '') + (d.value ? ' · ' + d.value + ' €' : '') + ' · source: ' + JSON.stringify(source() || 'direct'));
        if (DEBUG && name === 'booking_identify') console.log('[SKINTECK] widget text now:\n' + t.slice(0, 1500));
      }
      if (DEBUG && done.has('booking_identify') && !done.has('booking_confirmed')) window.__skLastText = t;
    };
    new MutationObserver(check).observe(book, { childList: true, subtree: true, characterData: true });
  };
  if (book) {
    watchFunnel();
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
