(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Menu */
  const toggle = $('.toggle');
  const menu = $('.menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('on', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Finder */
  const P = {
    diag: { img: 'consult', alt: 'Échange devant le poste d’analyse de peau', tag: 'C’est normal', name: 'Commencez par comprendre.',
      text: 'Venez avec ce qui vous gêne. On regarde, on vous explique ce qu’on voit, puis on décide ensemble de ce qui est utile.',
      adv: 'Un vrai temps d’analyse, sans obligation de faire un soin.',
      proto: 'Échange + SKINTECK ANALYSIS™, notre diagnostic peau ou silhouette', price: '30 €, déduits si vous réalisez ensuite un soin', href: 'diagnostic.html', cta: 'Découvrir le diagnostic' },
    lift: { img: 'lift', alt: 'Séance de HIFU sur le visage', tag: 'Visage · Fermeté', name: 'Retrouver un visage plus ferme.',
      text: 'Les traits tombent un peu, l’ovale est moins net, vous avez l’air fatigué. On commence par regarder où, et pourquoi.',
      adv: 'On analyse votre peau pour cibler les bonnes zones, ou pour vous dire si ce soin n’est pas le bon.',
      proto: 'SKINTECK LIFT™ · HIFU (ultrasons focalisés) + LED', price: '1 zone 220 € · 2 zones 400 € · 3 zones 560 €', href: '#', cta: 'Découvrir LIFT™' },
    pure: { img: 'pure', alt: 'Hydrodermabrasion du visage', tag: 'Visage · Éclat', name: 'Retrouver une peau nette et lumineuse.',
      text: 'Pores visibles, teint gris, peau encombrée : votre peau manque de fraîcheur.',
      adv: 'Le nettoyage et les produits sont choisis selon ce que l’analyse montre de votre peau.',
      proto: 'SKINTECK PURE™ · Hydrodermabrasion AquaPeel + actifs + LED', price: '95 € · 270 € · 510 € (1, 3 ou 6 séances)', href: '#', cta: 'Découvrir PURE™' },
    regen: { img: 'regen', alt: 'Microneedling du visage', tag: 'Visage · Texture', name: 'Une peau plus lisse et plus uniforme.',
      text: 'Grain de peau irrégulier, marques, petites rides : votre peau vous semble moins belle qu’avant.',
      adv: 'Le nombre de séances dépend de votre peau, et on mesure l’évolution en cours de route.',
      proto: 'SKINTECK REGEN™ · Microneedling + actifs + LED', price: '150 € · 420 € · 780 € (1, 3 ou 6 séances)', href: '#', cta: 'Découvrir REGEN™' },
    peel: { img: 'peel', alt: 'Préparation d’un peeling professionnel', tag: 'Visage · Teint', name: 'Un teint plus uniforme.',
      text: 'Des taches, un teint irrégulier : votre peau ne reflète pas comment vous vous sentez.',
      adv: 'On regarde d’abord le type de taches pour choisir le bon peeling, à la bonne intensité.',
      proto: 'SKINTECK PEEL™ · Peeling professionnel + actifs + LED', price: '120 € · 330 € · 600 €, selon le protocole et le nombre de séances', href: '#', cta: 'Découvrir PEEL™' },
    sculpt: { img: 'sculpt', alt: 'Séance d’électrostimulation', tag: 'Corps · Silhouette', name: 'Une silhouette plus tonique.',
      text: 'Vous faites des efforts, mais certaines zones ne changent pas.',
      adv: 'Une analyse du corps au départ, puis des mesures pour voir vos vrais progrès.',
      proto: 'SKINTECK SCULPT™ · Cryolipolyse + Lipo HIFU + électrostimulation + pressothérapie', price: '890 € le programme de 6 semaines', href: '#', cta: 'Découvrir SCULPT™' },
    density: { img: 'density', alt: 'Soin du cuir chevelu réalisé par Vincent', tag: 'Cheveux & barbe', name: 'Des cheveux plus denses.',
      text: 'Cheveux plus fins, moins de volume, barbe clairsemée : ça se voit, et ça pèse.',
      adv: 'On observe d’abord le cuir chevelu pour adapter le programme à votre cas.',
      proto: 'SKINTECK DENSITY™ · Soin du cuir chevelu + microneedling + LED', price: 'Cure initiale 590 € · Cure complète 990 € à 1 190 €', href: '#', cta: 'Découvrir DENSITY™' },
    laser: { img: 'laser', alt: 'Salle de soin avec le laser diode', tag: 'Femmes & hommes', name: 'Moins de poils, progressivement.',
      text: 'Le rasage et l’épilation qui reviennent sans cesse, vous en avez assez.',
      adv: 'Les réglages sont adaptés à votre peau, à la zone et au cycle du poil.',
      proto: 'Épilation au laser diode', price: 'Selon les zones traitées', href: '#', cta: 'Voir les zones et les tarifs' },
  };
  const panel = $('.panel');
  if (panel) {
    const chips = $$('.chip');
    const img = $('.panel__img img', panel);
    const f = (k) => $(`[data-f=${k}]`, panel);
    const show = (key, focus) => {
      const d = P[key];
      chips.forEach((c) => {
        const on = c.dataset.key === key;
        c.setAttribute('aria-selected', String(on));
        c.tabIndex = on ? 0 : -1;
        if (on) {
          panel.setAttribute('aria-labelledby', c.id);
          if (focus) c.focus();
          const box = c.parentElement;
          if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: c.offsetLeft - 20, behavior: reduced ? 'auto' : 'smooth' });
        }
      });
      img.style.opacity = 0;
      const next = new Image();
      const swap = () => { img.src = next.src; img.alt = d.alt; img.style.opacity = 1; };
      next.onload = swap; next.onerror = swap;
      next.src = `assets/img/${d.img}.webp`;
      ['tag', 'name', 'text', 'adv', 'proto', 'price'].forEach((k) => { f(k).textContent = d[k]; });
      const cta = f('cta');
      cta.href = d.href;
      cta.textContent = d.cta || `Découvrir ${d.name}`;
    };
    chips.forEach((c, i) => {
      c.addEventListener('click', () => show(c.dataset.key));
      c.addEventListener('keydown', (e) => {
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!dir) return;
        e.preventDefault();
        show(chips[(i + dir + chips.length) % chips.length].dataset.key, true);
      });
    });
  }

  /* Gallery arrows */
  const gal = $('.gal');
  const prev = $('[data-gal=prev]');
  const next = $('[data-gal=next]');
  if (gal && prev && next) {
    const step = () => ($('.card', gal).offsetWidth + 18) * (innerWidth > 900 ? 2 : 1);
    const sync = () => {
      prev.disabled = gal.scrollLeft < 8;
      next.disabled = gal.scrollLeft > gal.scrollWidth - gal.clientWidth - 8;
    };
    prev.addEventListener('click', () => gal.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => gal.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
    gal.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  }

  /* Gentle settle on arrival; content is always visible */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  $$('.gentle').forEach((el) => io.observe(el));

  /* Scroll scenes */
  const heroImg = $('.hero__img');
  const buy = $('.buy');
  const method = $('.method');
  const items = $$('.steplist li');
  const shots = $$('.shots img');
  let last = -1;
  const paint = () => {
    const vh = innerHeight;
    if (heroImg && !reduced) {
      const r = heroImg.parentElement.getBoundingClientRect();
      const p = clamp((-r.top) / (vh * 0.5));
      heroImg.style.transform = `scale(${0.94 + p * 0.06})`;
    }
    if (buy) buy.classList.toggle('on', scrollY > vh * 0.5);
    if (method) {
      const r = method.getBoundingClientRect();
      const span = r.height - vh;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      const idx = Math.min(items.length - 1, Math.floor(p * items.length));
      if (idx !== last) {
        items.forEach((x, i) => x.classList.toggle('on', i === idx));
        shots.forEach((x, i) => x.classList.toggle('on', i === idx));
        last = idx;
      }
    }
  };
  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; paint(); });
  }, { passive: true });
  addEventListener('resize', paint);

  /* Video plays only while visible */
  const vid = $('video[data-autoplay]');
  if (vid) {
    if (reduced) vid.controls = true;
    else new IntersectionObserver(([e]) => {
      if (e.isIntersecting) vid.play().catch(() => { vid.controls = true; });
      else vid.pause();
    }, { threshold: 0.25 }).observe(vid);
  }
  paint();
})();

(()=>{const t=document.createElement('div');t.className='maquette-toast';t.setAttribute('role','status');document.body.append(t);let h;document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.getAttribute('href')!=='#')return;e.preventDefault();t.textContent='Maquette : lien désactivé';t.classList.add('on');clearTimeout(h);h=setTimeout(()=>t.classList.remove('on'),1800)});})();
