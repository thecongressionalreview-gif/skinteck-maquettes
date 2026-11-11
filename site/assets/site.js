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

  /* 4. Planity white-label module, loaded only where a .book container exists */
  const book = document.querySelector('[data-planity]');
  if (book) {
    const key = book.dataset.planity;
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
