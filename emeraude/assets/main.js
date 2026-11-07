(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Menu */
  const toggle = $('.menu-toggle');
  const menu = $('.menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Words of the statement light up as you read */
  const say = $('[data-words]');
  let words = [];
  if (say && !reduced) {
    say.innerHTML = say.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    words = $$('.w', say);
  }

  /* Finder */
  const P = {
    lift: { img: 'lift', alt: 'Séance de HIFU sur le visage au cabinet SKINTECK', tag: 'Visage · Fermeté', name: 'SKINTECK LIFT™',
      text: 'Raffermissement et effet lifting par stimulation du collagène en profondeur, pour accompagner la perte de fermeté du visage.',
      proto: 'HIFU par ultrasons focalisés + LED', price: '1 zone 220 € · 2 zones 400 € · 3 zones 560 €', href: '#' },
    pure: { img: 'pure', alt: 'Hydrodermabrasion du visage au cabinet SKINTECK', tag: 'Visage · Pureté', name: 'SKINTECK PURE™',
      text: 'Nettoyage profond, désobstruction des pores et réhydratation pour retrouver une peau plus nette, plus équilibrée et plus lumineuse.',
      proto: 'Hydrodermabrasion AquaPeel + actifs adaptés + LED', price: '95 € · 270 € · 510 € (1, 3 ou 6 séances)', href: '#' },
    regen: { img: 'regen', alt: 'Microneedling du visage réalisé au cabinet SKINTECK', tag: 'Visage · Régénération', name: 'SKINTECK REGEN™',
      text: 'Amélioration progressive de la qualité de peau, de la texture et des imperfections, avec stimulation des mécanismes de régénération cutanée.',
      proto: 'Microneedling + actifs adaptés + LED', price: '150 € · 420 € · 780 € (1, 3 ou 6 séances)', href: '#' },
    peel: { img: 'peel', alt: 'Application d’un peeling professionnel au pinceau', tag: 'Visage · Éclat', name: 'SKINTECK PEEL™',
      text: 'Protocole d’éclat et de correction destiné à accompagner le teint irrégulier, les taches et les problématiques de grain de peau.',
      proto: 'Peeling professionnel + actifs adaptés + LED', price: '120 € · 330 € · 600 € selon le protocole et le nombre de séances', href: '#' },
    sculpt: { img: 'sculpt', alt: 'Séance de cryolipolyse au cabinet SKINTECK', tag: 'Corps · Silhouette', name: 'SKINTECK SCULPT™',
      text: 'Programme silhouette associant plusieurs technologies afin d’accompagner les amas graisseux localisés, la tonicité et le drainage.',
      proto: 'Cryolipolyse + Lipo HIFU + électrostimulation + pressothérapie', price: '890 € le programme de 6 semaines', href: '#' },
    density: { img: 'density', alt: 'Soin du cuir chevelu réalisé par Vincent', tag: 'Cheveux & barbe · Densité', name: 'SKINTECK DENSITY™',
      text: 'Programme capillaire destiné à améliorer progressivement la qualité, la résistance et l’apparence de densité des cheveux ou de la barbe.',
      proto: 'Hydrodermabrasion du cuir chevelu + microneedling + LED', price: 'Cure initiale 590 € · Cure complète 990 € à 1 190 €', href: '#' },
    laser: { img: 'laser-room', alt: 'Salle de soin SKINTECK avec le laser diode', tag: 'Visage & corps · Femmes & hommes', name: 'Épilation laser diode',
      text: 'Une réduction progressive de la pilosité. Chaque protocole est adapté à la zone, au phototype, aux caractéristiques du poil et à son cycle de croissance.',
      proto: 'Laser diode, paramètres ajustés au fil des séances', price: 'Selon les zones traitées', href: '#', cta: 'Voir les zones et les tarifs' },
    diag: { img: 'consult-skin', alt: 'Diagnostic de peau sur Smart Skin Pro au cabinet SKINTECK', tag: 'Le bon point de départ', name: 'SKINTECK ANALYSIS™',
      text: 'Vous n’avez pas besoin de connaître le nom d’un protocole avant de réserver. Venez avec votre préoccupation et votre objectif : l’analyse sert précisément à déterminer la suite.',
      proto: 'Échange, observation professionnelle et technologies d’analyse', price: '30 €, déduits si vous réalisez ensuite un soin', href: 'diagnostic.html', cta: 'Découvrir le diagnostic' },
  };
  const result = $('.result');
  if (result) {
    const tabs = $$('.concern');
    const img = $('.result__img img', result);
    const f = (k) => $(`[data-f=${k}]`, result);
    const show = (key, focus) => {
      const d = P[key];
      tabs.forEach((t) => {
        const on = t.dataset.key === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) {
          result.setAttribute('aria-labelledby', t.id);
          if (focus) t.focus();
          if (t.parentElement.scrollWidth > t.parentElement.clientWidth) {
            t.parentElement.scrollTo({ left: t.offsetLeft - 20, behavior: reduced ? 'auto' : 'smooth' });
          }
        }
      });
      img.style.opacity = 0;
      const next = new Image();
      const swap = () => { img.src = next.src; img.alt = d.alt; img.style.opacity = 1; };
      next.onload = swap; next.onerror = swap;
      next.src = `assets/img/${d.img}.webp`;
      f('tag').textContent = d.tag;
      f('name').textContent = d.name;
      f('text').textContent = d.text;
      f('proto').textContent = d.proto;
      f('price').textContent = d.price;
      const cta = f('cta');
      cta.href = d.href;
      cta.firstChild.textContent = (d.cta || `Découvrir ${d.name}`) + ' ';
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(t.dataset.key));
      t.addEventListener('keydown', (e) => {
        const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!dir) return;
        e.preventDefault();
        show(tabs[(i + dir + tabs.length) % tabs.length].dataset.key, true);
      });
    });
  }

  /* Scroll-driven scenes */
  const hero = $('.hero__media');
  const heroBody = $('.hero__body');
  const dock = $('.dock');
  const closing = $('.closing');
  const story = $('.story');
  const stages = $$('.stage');
  const shots = $$('.frame img');
  const beam = $('.beam');
  const meter = $('.meter i');
  const measures = $$('.measures li');
  const railwrap = $('.railwrap');
  const rail = $('.rail');
  const expand = $('.expand');
  const expandImg = $('.expand__pin img');
  const founder = $('.founder__img img');
  let railTravel = 0;

  const layout = () => {
    if (!railwrap) return;
    const pinned = !reduced && innerWidth > 860 && innerHeight > 620;
    railwrap.classList.toggle('is-pinned', pinned);
    if (pinned) {
      railTravel = Math.max(0, rail.scrollWidth - innerWidth);
      railwrap.style.height = `${innerHeight + railTravel}px`;
    } else {
      railTravel = 0;
      railwrap.style.height = '';
      rail.style.transform = '';
    }
  };

  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  let lastStage = -1;
  const paint = () => {
    const y = scrollY;
    const vh = innerHeight;

    if (hero && !reduced && y < vh * 1.2) {
      hero.style.transform = `translate3d(0,${y * 0.18}px,0) scale(${1 + y / vh * 0.05})`;
      if (heroBody) heroBody.style.opacity = innerWidth > 860 ? clamp(1 - y / (vh * 0.7)) : '';
    }

    if (dock) {
      const near = closing && closing.getBoundingClientRect().top < vh * 0.7;
      dock.classList.toggle('on', y > vh * 0.55 && !near);
    }

    if (words.length) {
      const r = say.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.42));
      const lit = p * (words.length + 3);
      words.forEach((w, i) => { w.style.opacity = clamp(0.2 + (lit - i) * 0.5, 0.2, 1); });
    }

    if (story && document.documentElement.classList.contains('js')) {
      const p = progress(story);
      const n = stages.length;
      const idx = Math.min(n - 1, Math.floor(p * n));
      const local = clamp(p * n - idx);
      if (idx !== lastStage) {
        stages.forEach((s, i) => s.classList.toggle('on', i === idx));
        shots.forEach((s, i) => s.classList.toggle('on', i === idx));
        lastStage = idx;
      }
      if (beam) beam.style.transform = `translate3d(0,${local * beam.parentElement.clientHeight}px,0)`;
      if (meter) meter.style.transform = `scaleX(${p})`;
      measures.forEach((m, i) => m.classList.toggle('hit', idx > 0 || local > (i + 0.6) / (measures.length + 1)));
    }

    if (railTravel) {
      const r = railwrap.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      rail.style.transform = `translate3d(${-p * railTravel}px,0,0)`;
    }

    if (expand && expandImg && !reduced) {
      const p = clamp(progress(expand) * 1.35);
      const e = 1 - Math.pow(1 - p, 2);
      const narrow = innerWidth <= 860;
      const iy = (narrow ? 24 : 20) * (1 - e);
      const ix = (narrow ? 10 : 24) * (1 - e);
      expandImg.style.clipPath = `inset(${iy}% ${ix}% round ${28 * (1 - e)}px)`;
    } else if (expandImg) {
      expandImg.style.clipPath = 'none';
    }

    if (founder && !reduced) {
      const r = founder.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = (vh - r.top) / (vh + r.height);
        founder.style.transform = `translate3d(0,${-p * 10.7}%,0)`;
      }
    }
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; paint(); });
  };

  /* Cabinet video plays only while visible */
  const vid = $('video[data-autoplay]');
  if (vid) {
    if (reduced) { vid.controls = true; }
    else {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) vid.play().catch(() => { vid.controls = true; });
        else vid.pause();
      }, { threshold: 0.2 }).observe(vid);
    }
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { layout(); paint(); });
  addEventListener('load', () => { layout(); paint(); });
  layout();
  paint();
})();

(()=>{const t=document.createElement('div');t.className='maquette-toast';t.setAttribute('role','status');document.body.append(t);let h;document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.getAttribute('href')!=='#')return;e.preventDefault();t.textContent='Maquette : lien désactivé';t.classList.add('on');clearTimeout(h);h=setTimeout(()=>t.classList.remove('on'),1800)});})();
