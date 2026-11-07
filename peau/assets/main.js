(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
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

  const P = {
    diag: { img: 'consult', alt: 'Diagnostic de peau sur Smart Skin Pro', tag: 'Le bon point de départ', name: 'SKINTECK ANALYSIS™',
      text: 'Venez simplement avec votre préoccupation et votre objectif : l’analyse sert précisément à déterminer la prise en charge la plus cohérente.',
      price: '30 €, déduits si un soin est réalisé', href: '#', cta: 'Réserver mon diagnostic' },
    lift: { img: 'lift', alt: 'Séance de HIFU sur le visage', tag: 'Visage · Fermeté', name: 'SKINTECK LIFT™',
      text: 'Raffermissement par stimulation du collagène en profondeur. HIFU par ultrasons focalisés + LED.',
      price: '1 zone 220 € · 2 zones 400 € · 3 zones 560 €', href: '#' },
    pure: { img: 'pure', alt: 'Hydrodermabrasion du visage', tag: 'Visage · Pureté', name: 'SKINTECK PURE™',
      text: 'Nettoyage profond, désobstruction des pores et réhydratation. Hydrodermabrasion AquaPeel + actifs adaptés + LED.',
      price: '95 € · 270 € · 510 € (1, 3 ou 6 séances)', href: '#' },
    regen: { img: 'regen', alt: 'Microneedling du visage', tag: 'Visage · Régénération', name: 'SKINTECK REGEN™',
      text: 'Amélioration progressive de la qualité de peau, de la texture et des imperfections. Microneedling + actifs adaptés + LED.',
      price: '150 € · 420 € · 780 € (1, 3 ou 6 séances)', href: '#' },
    peel: { img: 'peel', alt: 'Préparation d’un peeling professionnel', tag: 'Visage · Éclat', name: 'SKINTECK PEEL™',
      text: 'Éclat et correction du teint irrégulier, des taches et du grain de peau. Peeling professionnel + actifs adaptés + LED.',
      price: '120 € · 330 € · 600 €, selon protocole et séances', href: '#' },
    sculpt: { img: 'sculpt', alt: 'Séance d’électrostimulation', tag: 'Corps · Silhouette', name: 'SKINTECK SCULPT™',
      text: 'Accompagner les amas graisseux localisés, la tonicité et le drainage. Cryolipolyse + Lipo HIFU + électrostimulation + pressothérapie.',
      price: '890 € le programme de 6 semaines', href: '#' },
    density: { img: 'density', alt: 'Soin du cuir chevelu réalisé par Vincent', tag: 'Cheveux & barbe · Densité', name: 'SKINTECK DENSITY™',
      text: 'Améliorer la qualité, la résistance et l’apparence de densité. Hydrodermabrasion du cuir chevelu + microneedling + LED.',
      price: 'Cure initiale 590 € · Cure complète 990 € à 1 190 €', href: '#' },
    laser: { img: 'laser', alt: 'Salle de soin avec le laser diode', tag: 'Femmes & hommes', name: 'Épilation laser diode',
      text: 'Une réduction progressive de la pilosité, adaptée à la zone, au phototype, au poil et à son cycle de croissance.',
      price: 'Selon les zones traitées', href: '#', cta: 'Voir les zones et les tarifs' },
  };
  const ans = $('.answer');
  const opts = $$('.opt');
  const img = $('.answer__i img');
  const f = (k) => $(`[data-f=${k}]`, ans);
  const show = (key, focus) => {
    const d = P[key];
    opts.forEach((o) => {
      const on = o.dataset.key === key;
      o.setAttribute('aria-selected', String(on));
      o.tabIndex = on ? 0 : -1;
      if (on) { ans.setAttribute('aria-labelledby', o.id); if (focus) o.focus(); }
    });
    img.style.opacity = 0;
    const next = new Image();
    const swap = () => { img.src = next.src; img.alt = d.alt; img.style.opacity = 1; };
    next.onload = swap; next.onerror = swap;
    next.src = `assets/img/${d.img}.webp`;
    f('tag').textContent = d.tag;
    f('name').textContent = d.name;
    f('text').textContent = d.text;
    f('price').textContent = d.price;
    const cta = f('cta');
    cta.href = d.href;
    cta.textContent = d.cta || `Découvrir ${d.name}`;
  };
  opts.forEach((o, i) => {
    o.addEventListener('click', () => show(o.dataset.key));
    o.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      show(opts[(i + dir + opts.length) % opts.length].dataset.key, true);
    });
  });

  const bar = $('.bar');
  const close = $('.close');
  const onScroll = () => bar.classList.toggle('on', scrollY > innerHeight * 0.7 && close.getBoundingClientRect().top > innerHeight * 0.7);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const vid = $('video[data-autoplay]');
  if (vid) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) vid.controls = true;
    else new IntersectionObserver(([e]) => {
      if (e.isIntersecting) vid.play().catch(() => { vid.controls = true; });
      else vid.pause();
    }, { threshold: 0.25 }).observe(vid);
  }
})();

(()=>{const t=document.createElement('div');t.className='maquette-toast';t.setAttribute('role','status');document.body.append(t);let h;document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.getAttribute('href')!=='#')return;e.preventDefault();t.textContent='Maquette : lien désactivé';t.classList.add('on');clearTimeout(h);h=setTimeout(()=>t.classList.remove('on'),1800)});})();
